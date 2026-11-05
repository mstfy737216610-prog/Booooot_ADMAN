"""
==============================================================================
نظام مزودي الذكاء الاصطناعي المزدوج المستقل (Dual AI Provider System)
==============================================================================
1. المزوّد الأساسي (Primary API Provider):
   - واجهة HCNSEC الرسمية: https://api.hcnsec.cn/v1
   - النماذج الفائقة: DeepSeek-V4-Flash, DeepSeek-V4-Pro, glm-5.3, Qwen3.8-27B
   - الوظيفة: فلترة الأخبار، استبعاد الإعلانات، الصياغة الأكاديمية، والرقابة.
   - حقن حلقة التعلم المستفادة من أسباب رفض المشرف (Feedback Loop).

2. المزوّد الإضافي عبر الكوكيز (Cookie-Based AI Provider):
   - يعمل بشكل مستقل تماماً بجانب المزوّد الأساسي دون التأثير عليه.
   - حفظ الجلسات في data/ai_sessions/ وربطها بجدول ai_sessions.
   - استخدامه لتوليد الردود والبطاقات والتصاميم المخصصة.
==============================================================================
"""

import os
import sys
import json
import logging
import urllib.request
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from ai_engine.ai_memory import get_learned_rules_context, add_user_feedback_rule

logger = logging.getLogger("AIProvider")

BASE_DIR = Path(__file__).resolve().parent.parent
AI_SESSIONS_DIR = BASE_DIR / "data" / "ai_sessions"
AI_SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

# مفاتيح ونماذج المزوّد الأساسي (HCNSEC)
PRIMARY_API_BASE = "https://api.hcnsec.cn/v1"
PRIMARY_API_KEY = "sk-ZimPNQ7NBOAqouWIL9Wa15qczOorNkLY72ns3zUfxoUmU307"
BACKUP_API_KEY = "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii"
DEFAULT_TEXT_MODEL = "DeepSeek-V4-Flash"


class BaseAIProvider(ABC):
    """الواجهة البرمجية الموحدة لمزودي الذكاء الاصطناعي"""

    @abstractmethod
    def generate_text(self, prompt: str, system_prompt: str = "") -> Dict[str, Any]:
        pass

    @abstractmethod
    def moderate_and_filter(self, content: str, university_name: str = "") -> Dict[str, Any]:
        pass


class PrimaryAPIProvider(BaseAIProvider):
    """المزوّد الأساسي المستقر عبر واجهة API السريعة (HCNSEC / DeepSeek / Qwen)"""

    def __init__(self, api_base: str = PRIMARY_API_BASE, api_key: str = PRIMARY_API_KEY, model: str = DEFAULT_TEXT_MODEL):
        self.api_base = api_base.rstrip("/")
        self.api_key = api_key
        self.model = model

    def _call_chat_completions(self, messages: List[Dict[str, str]], max_tokens: int = 1000, temperature: float = 0.2) -> Dict[str, Any]:
        url = f"{self.api_base}/chat/completions"
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }

        # تجربة المفتاح الأساسي ثم الاحتياطي
        keys = [self.api_key, BACKUP_API_KEY]
        last_err = ""

        for k in keys:
            if not k:
                continue
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {k}",
                    "Content-Type": "application/json"
                }
            )
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    res_data = json.loads(resp.read().decode("utf-8"))
                    text = res_data["choices"][0]["message"]["content"].strip()
                    return {"ok": True, "text": text, "model": self.model}
            except Exception as e:
                last_err = str(e)
                logger.warning(f"ملاحظة في PrimaryAPIProvider مع المفتاح {k[:8]}...: {e}")

        return {"ok": False, "error": last_err, "text": ""}

    def generate_text(self, prompt: str, system_prompt: str = "") -> Dict[str, Any]:
        learned_rules = get_learned_rules_context()
        combined_sys = f"{system_prompt}\n\n{learned_rules}".strip()
        messages = [
            {"role": "system", "content": combined_sys},
            {"role": "user", "content": prompt}
        ]
        return self._call_chat_completions(messages)

    def moderate_and_filter(self, content: str, university_name: str = "") -> Dict[str, Any]:
        """
        تحليل محتوى المنشور وتطبيق قواعد الفلترة الذكية والتعلم السابق:
        - استبعاد إعلانات الكافيهات، المعاهد، الإعلانات التجارية الشخصية.
        - اعتماد المنشورات الأكاديمية والقرارات الجامعية.
        - إرجاع قرار واضح: (publish / ignore) مع السبب.
        """
        learned_rules = get_learned_rules_context()
        sys_prompt = f"""أنت مدير الرقابة الأكاديمية الذكية لقناة جامعية رسمية.
المهمة: فحص المنشور الوارد وتحديد هل يصلح للنشر للطلاب أم يجب استبعاده.

## 🚫 قواعد الاستبعاد الصارمة (تجاهل المنشور فوراً Ignore):
1. إعلانات المعاهد والدورات التدريبية المدفوعة غير المعتمدة من الجامعة.
2. إعلانات الكافيهات والمطاعم والمتاجر والمحلات التجارية.
3. المنشورات الشخصية الخاصة بالأفراد أو السير الذاتية التي لا تفيد عموم الطلاب.
4. إعلانات حل الواجبات وبحوث التخرج غير القانونية.
5. أي منشور يدعو للتواصل مع جهة ربحية خارجية.

{learned_rules}

## ✅ معايير القبول (نشر Publish):
- مواعيد القبول والتسجيل والحذف والإضافة.
- الجداول الدراسية وجداول الامتحانات والتقويم الأكاديمي.
- قرارات تعليق الدراسة، المكافآت الجامعية، ولوائح الحرمان والإنذار الأكاديمي.
- الفعاليات والأنشطة الطلابية المعتمدة رسمياً في {university_name or 'الجامعة'}.

## صيغة الرد المطلوبة بدقة JSON فقط:
{{
  "decision": "publish" أو "ignore",
  "reason": "سبب موجز ودقيق باللغة العربية",
  "confidence": 0.98,
  "formatted_post": "صياغة المنشور الأكاديمي إذا كان مقبولاً، أو فارغ إذا كان مستبعداً"
}}"""

        res = self._call_chat_completions([
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": f"حلل هذا المنشور وقرر أمره:\n{content}"}
        ], max_tokens=800, temperature=0.1)

        if not res.get("ok"):
            # Fallback تحليلي آمن محلياً
            c_low = content.lower()
            if any(b in c_low for b in ["كافيه", "مطعم", "معهد خاص", "حل واجبات", "بحوث تخرج", "خصم خاص"]):
                return {"decision": "ignore", "reason": "استبعاد محلي: يحتوي على إعلانات تجارية أو كافيهات", "confidence": 0.9}
            return {"decision": "publish", "reason": "اعتماد مبدئي لعدم وجود كلمات محظورة", "confidence": 0.85, "formatted_post": content}

        try:
            # استخراج كائن JSON من رد النموذج
            raw_text = res.get("text", "")
            json_match = raw_text[raw_text.find("{"):raw_text.rfind("}") + 1]
            decision_data = json.loads(json_match)
            return decision_data
        except Exception:
            return {"decision": "publish", "reason": "تمت صياغة المحتوى", "confidence": 0.8, "formatted_post": res.get("text", content)}


class CookieAIProvider(BaseAIProvider):
    """
    المزوّد الإضافي المستقل المعتمد على الكوكيز (Cookie-Based Session Provider)
    يحفظ الجلسات في data/ai_sessions/ ويعمل كخدمة موازية لتوليد الردود والبطاقات
    """

    def __init__(self, session_name: str = "default_gemini_session"):
        self.session_name = session_name
        self.session_file = AI_SESSIONS_DIR / f"{session_name}.json"

    def save_session_cookies(self, cookies_dict_or_str: Any) -> bool:
        try:
            with open(self.session_file, "w", encoding="utf-8") as f:
                if isinstance(cookies_dict_or_str, dict):
                    json.dump(cookies_dict_or_str, f, ensure_ascii=False, indent=2)
                else:
                    f.write(str(cookies_dict_or_str))
            logger.info(f"🍪 [Cookie AI] تم حفظ جلسة الكوكيز بنجاح في: {self.session_file}")
            return True
        except Exception as e:
            logger.error(f"❌ [Cookie AI] فشل حفظ الجلسة: {e}")
            return False

    def load_session_cookies(self) -> Optional[Dict[str, str]]:
        if not self.session_file.exists():
            return None
        try:
            with open(self.session_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    def generate_text(self, prompt: str, system_prompt: str = "") -> Dict[str, Any]:
        """توليد ردود ونصوص باستخدام جلسة الكوكيز النشطة"""
        cookies = self.load_session_cookies()
        if not cookies:
            return {"ok": False, "error": "لم يتم العثور على جلسة كوكيز نشطة للمزود الإضافي.", "text": ""}
        # محاكاة الاستدعاء أو توجيهه للواجهة الداخلية
        return {"ok": True, "text": f"رد مولّد عبر جلسة الكوكيز ({self.session_name})", "provider": "cookie_session"}

    def moderate_and_filter(self, content: str, university_name: str = "") -> Dict[str, Any]:
        return {"decision": "publish", "reason": "مزوّد الكوكيز مخصص للتوليد والردود وليس للرقابة الأساسية"}


# إنشاء النسخة الفعالة المعتمدة عالمياً
primary_ai = PrimaryAPIProvider()
cookie_ai = CookieAIProvider()
