#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
محرر وناشر المحتوى الأكاديمي والجامعي الذكي (النسخة الإنتاجية الشاملة V3.0)
Telegram University Content Editor & Automated Multi-Channel Publisher
================================================================================
المشرف العام المعتمد: @M_S_F_G (معرف: 7607633343)
قناة النشر الافتراضية المعتمدة: @jhdhhdcj
الذكاء الاصطناعي: DeepSeek-V4-Flash / DeepSeek-V4.1-Flash (https://api.hcnsec.cn/v1)
قاعدة البيانات: SQLite3 الدائمة (bot_database.db) مع مزامنة Bots.Business
محرك السحب المزدوج: MTProto (Telethon) + Scraper محسن مع حماية كاملة
معالجة غير متزامنة: Worker Thread + Queue لمنع التجمد أثناء استدعاء الـ AI
================================================================================
"""

import os
import sys
import json
import time
import ssl
import re
import queue
import hashlib
import logging
import threading
import asyncio
import uuid
import tempfile
import urllib.request
import urllib.parse
import urllib.error
import xml.etree.ElementTree as ET
import html
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Dict, Any, Optional, List, Tuple

# استيراد وحدة قاعدة البيانات الدائمة
import database as db

# تحميل متغيرات البيئة
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# استيراد Telethon لسحب MTProto للقنوات العامة والخاصة
try:
    from telethon import TelegramClient, events
    from telethon.sessions import StringSession
    TELETHON_AVAILABLE = True
except ImportError:
    TELETHON_AVAILABLE = False

def safe_int(val: Any, default: int = 0) -> int:
    """تحويل آمن إلى عدد صحيح لتفادي استثناءات ValueError عند وجود نصوص الجلسات أو قيم خاطئة"""
    if val is None:
        return default
    try:
        s = str(val).strip()
        if s.lstrip("-").isdigit():
            return int(s)
        # استخراج أول كتلة أرقام إن وجدت
        digits_match = re.search(r'\b\d{5,10}\b', s)
        if digits_match:
            return int(digits_match.group(0))
        return default
    except Exception:
        return default

# ----------------- الإعدادات والاعتمادات والتحقق الذاتي -----------------
_db_tok = db.get_setting("bot_token")
_env_tok = os.getenv("BOT_TOKEN", "").strip()
_revoked = [
    "8901693218:AAEOQmHMZLy-xaPbTUMq1KGhDwp1l0wFWP4",
    "8901693218:AAFUiQ62KQlfl6rtoarimpSpeoeCgA422Qg",
    "8901693218:AAH0Ri7lpY2R6d1DQSrKZclRa7kuo1Jw-Gs"
]

if _db_tok and _db_tok not in _revoked:
    BOT_TOKEN = _db_tok
elif _env_tok and _env_tok not in _revoked:
    BOT_TOKEN = _env_tok
else:
    BOT_TOKEN = "8901693218:AAH0hoZdTq9qGaLYOhu_Cvxg9TEzTPAVADw"
ADMIN_ID = safe_int(os.getenv("ADMIN_ID", "7607633343"), 7607633343)
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "M_S_F_G").replace("@", "").strip()

# استرداد آمن ومعالجة الخلط المحتمل بين API_ID و STRING_SESSION
_raw_api_id = os.getenv("TELEGRAM_API_ID", "20123456").strip()
_raw_session = os.getenv("STRING_SESSION", "").strip()

# إذا تم وضع كود الجلسة (StringSession) في خانة TELEGRAM_API_ID بالخطأ
if not _raw_api_id.lstrip("-").isdigit():
    if len(_raw_api_id) > 20:
        if not _raw_session or len(_raw_session) < 20:
            _raw_session = _raw_api_id
        # إذا كانت الجلسة هي التي تحتوي على رقم الـ API ID
        if _raw_session.lstrip("-").isdigit() and len(_raw_session) <= 10:
            TELEGRAM_API_ID = safe_int(_raw_session, 20123456)
        else:
            TELEGRAM_API_ID = 20123456
    else:
        TELEGRAM_API_ID = safe_int(_raw_api_id, 20123456)
else:
    TELEGRAM_API_ID = safe_int(_raw_api_id, 20123456)

if TELEGRAM_API_ID <= 0:
    TELEGRAM_API_ID = 20123456

TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH", "abcdef0123456789abcdef0123456789").strip()
STRING_SESSION = _raw_session

AI_BASE_URL = os.getenv("AI_BASE_URL", "https://api.hcnsec.cn/v1").rstrip("/")
AI_API_KEY = os.getenv("AI_API_KEY", "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii").strip()
PRIMARY_MODEL = os.getenv("PRIMARY_MODEL", "DeepSeek-V4-Flash").strip()
FALLBACK_MODEL = os.getenv("FALLBACK_MODEL", "DeepSeek-V4.1-Flash").strip()

# كوكبة النماذج الذكية المتتالية للعمل بأقصى سرعة واستيعاب وتخطي أي أخطاء 503 تلقائياً
AI_MODELS_CASCADE = [
    PRIMARY_MODEL,
    "DeepSeek-V4-Flash",
    "DeepSeek-V4.1-Flash",
    "auto",
    "glm-5.3",
    "Qwen3.8-Flash-Next",
    "MiniMax-M3.1-Flash"
]
_raw_port = safe_int(os.getenv("PORT", os.getenv("KEEPALIVE_PORT", "8088")), 8088)
PORT = 8088 if _raw_port == 3000 else _raw_port

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    level=logging.INFO,
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("PublisherBot")

# إعداد SSL آمن ونظامي (بدون CERT_NONE)
ssl_ctx = ssl.create_default_context()

# طابور معالجة الرسائل والمنشورات غير المتزامن لمنع تجمد البوت
post_queue = queue.Queue(maxsize=100)

SYSTEM_PROMPT_REPHRASE = """# الدور: ممثل الدفعة والمستشار الطلابي الخليجي المقرّب (إنسان حقيقي وزميل ناصح ومحب لزملائه، ولست روبوتاً آلياً)
## الهوية والروح الحقيقية:
أنت لست آلة تنسخ بيانات جامعية جافة بقوالب صماء ميتة، بل أنت ممثل الدفعة والزميل المحبوب والناصح الأمين في مجتمعاتنا الجامعية الخليجية والعربية. تتحدث مع إخوانك وزملائك في قنوات الكلية وقروبات الدفعة بأسلوب خليجي دافئ، عفوي، أخوي، مفعم بالروح والمشاعر الصادقة وقريب جداً لقلب الطالب.

## 🚫 محرمات قطعية (قواعد كسر الروبوتية والتكرار الأعمى):
1. يمنع منعاً باتاً البدء بـ "🚨 تنبيه لطلاب..." أو أي قالب ثابت مشابه. نوع بداياتك دائماً بحسب الموضوع والحدث!
2. يمنع استخدام القوالب الإدارية الباردة والمبتذلة: (أبرز التفاصيل والتعليمات الأكاديمية / يسعدنا الرد على استفساراتكم في التعليقات / إعلان وتحديث رسمي / نود إفادتكم / يرجى الاطلاع على).
3. يمنع تكرار نفس العبارات في كل منشور؛ الذكاء يكمن في فهم "متى" تضع كل عبارة بحسب سياقها الصحيح دون حشو!

## 🧠 الذكاء السياقي الحقيقي (Context-Aware Persona):
افهم نوع المنشور وصغه بروحه الواقعية:
1. 📚 التسجيل والمواد والأدفايزر:
   - خاطب الطلاب كزميل ناصح وحثهم على متابعة مرشدهم الأكاديمي (الأدفايزر) قبل إغلاق النظام:
   - "يا شباب ويا بنات بخصوص تسجيل المواد.. كلموا أدفايزراتكم (المرشدين الأكاديميين) يسجلون لكم المادة أو يفتحون السكاشن قبل يقفل السستم ⏰"
2. ☀️ الفصل الصيفي (السمر):
   - استخدام مصطلح "السمر" أو "الفصل الصيفي" بروح خفيفة ومنظمة:
   - "بخصوص السمر (الفصل الصيفي).. هذي مواعيد تنزيل المقررات والشروط كاملة، رتبوا جداولكم من بدري وفالكم التساهيل ☀️📚"
3. 📝 مواسم الاختبارات والفاينل والكويزات:
   - الهدوء، الأدعية الصادقة، التذكير بالأذكار والصلاة على النبي، والتحفيز:
   - "هانت يا ربعنا.. ما بقى شي ونختم هالفصل على خير بإذن الله. توكلوا على الله ولا تنسون أذكاركم وأدعيتكم، وربي ما يضيع لكم تعب.. وفالكم الـ A+ وأعلى القريدات يا رب 🤲✨"
4. 🎓 التخرج والنتائج:
   - فرحة غامرة، فخر وتفاعل مجتمعي عالي:
   - "ألف ألف مبروك لخريجينا وخريجاتنا! تستاهلون الفرحة بعد تعب السنين.. المتخرجين يثبتون وجودهم برياكشن قلب ❤️🎓 وعقبال أعلى المناصب."
5. 🤍 يوم الجمعة والنفحات الإيمانية:
   - بروح هادئة محبة للخير:
   - "اللهم صلّ وسلم على نبينا محمد وعلى آله وصحبه أجمعين 🤍.. جمعة مباركة يا أحبة، تذكير بسورة الكهف وساعة الاستجابة، لا تنسون أنفسكم وأهاليكم وزملائكم من صالح الدعاء."
6. 🤝 مشاريع واستبيانات الزملاء:
   - الفزعة والدعم الأخوي:
   - "فزعتكم يا ربعنا لزميلكم في مشروع تخرجه.. استبيان بسيط ما ياخذ من وقتكم دقيقة وحدة، بتساعدونه وتفرجون كربته لاهنتم: [الرابط]"
7. 🌱 التوعية والعمل الخيري والتطوع:
   - التحفيز على الخير (التبرع بالدم، الساعات التطوعية، مبادرات الكلية) بروح شبابية دافئة ونبيلة.

## 🔤 التنسيق والتنظيم الإلزامي:
- أبرز المواعيد والتواريخ والأوقات وأسماء القاعات والمواد والنسب بخط عريض <b>...</b> لتسهيل القراءة السريعة.
- احتفظ بروابط البوابات الرسمية والاستمارات كاملة بسطر مستقل (🔗 <b>رابط البوابة / التقديم:</b> [الرابط]).
- احذف أي معرفات قنوات خارجية ترويجية (@channel أو t.me).
- إذا كان هناك صورة أو جدول مرفق، اجعل النص كابشن مشوق ومختصر يوجه العين فوراً للمرفق أعلاه."""

AD_KEYWORDS = [
    "حل واجبات بمقابل", "حل واجبات واختبارات", "حل كويزات", "حل فاينل", "حل اسايمنت",
    "كتابة بحوث بمقابل", "عمل بحوث ورسائل بمقابل", "إعلان مدفوع للخدمات", "إعلان ممول غير رسمي"
]

# الكلمات المفتاحية السياسية والاقتصادية العامة غير المتعلقة بالطلاب لحظرها على البوابة
IRRELEVANT_POLITICAL_KEYWORDS = [
    "مجلس الوزراء برئاسة", "العلاقات الثنائية", "مباحثات رسمية", "وزير الخارجية يبحث",
    "الأمم المتحدة", "تطورات الأوضاع العسكرية", "الضربات الجوية", "إطلاق صواريخ",
    "مؤشر داو جونز", "أسعار النفط", "خام برنت", "أوبك بلس", "البورصة العالمية",
    "تداول العملات المشفرة", "مفاوضات الهدنة", "الانتخابات الرئاسية", "البرلمان الأوروبي",
    "انفجار سيارة", "حريق مروع في", "مقتل شخص وإصابة", "أرباح شركة تسلا", "أرباح إنفيديا"
]

STUDENT_AFFINITY_KEYWORDS = [
    "طالب", "طلبة", "طالبات", "جامع", "كلي", "دراس", "محاضر", "اختبار", "امتحان",
    "فاينل", "كويز", "سكشن", "شعب", "تسجيل", "قبول", "معدل", "تخرج", "أدفايزر",
    "مرشد", "سمر", "صيفي", "قاعة", "دكتور", "عماد", "مكافأة", "سكن", "باص",
    "استبيان", "مشروع تخرج", "بحث تخرج", "أذكار", "جمعة", "اللهم صل", "تطوع", "تبرع بالدم"
]


def is_relevant_student_news(text: str, target_univ: Optional[str] = None) -> Tuple[bool, str]:
    """
    فحص صارم لعزل وحظر أي أخبار سياسية أو اقتصادية أو حشو إعلامي عام
    وضمان أن المنشور موجه حصراً للشأن الطلابي والأكاديمي والجامعي
    """
    if not text or len(text.strip()) < 5:
        return False, "نص فارغ"

    # 1. إذا كان المنشور يحمل كلمات سياسية أو اقتصادية عامة
    for kw in IRRELEVANT_POLITICAL_KEYWORDS:
        if kw in text:
            # نتأكد أنه لا يتحدث عن قسم أكاديمي ككلية العلوم السياسية أو الاقتصاد
            has_student_context = any(sk in text for sk in ["كلية", "قسم", "طالب", "طلبة", "اختبار", "تسجيل", "محاضرة"])
            if not has_student_context:
                return False, f"خبر سياسي/اقتصادي عام ({kw})"

    # 2. فحص إذا كان المحتوى طويلاً ولا يحمل أي صلة بالحياة الطلابية
    if len(text) > 80:
        has_affinity = any(sk in text for sk in STUDENT_AFFINITY_KEYWORDS)
        if not has_affinity and not target_univ:
            return False, "محتوى خارجي غير مرتبط بالحياة الطلابية والجامعية"

    return True, "محتوى طلابي معتمد"


def detect_student_context(text: str) -> str:
    """
    التعرف الذكي على طبيعة ومناسبة المنشور الطلابي لتوجيه نبرة الذكاء الاصطناعي بدقة:
    - registration: تسجيل المقررات، الحذف والإضافة، الأدفايزر، فتح السكاشن
    - summer_term: الفصل الصيفي (السمر)
    - exams: الاختبارات، الفاينل، الكويزات، القاعات، الأذكار والتهدئة
    - graduation: التخرج، النتائج، احتفالات الخريجين
    - friday_prayer: يوم الجمعة، الصلاة على النبي ﷺ، سورة الكهف، الأدعية
    - student_project: استبيانات ومشاريع تخرج الزملاء
    - charity_volunteering: التبرع بالدم، العمل الخيري، التطوع
    - general_academic: تنبيهات أكاديمية ومواعيد عامة
    """
    t = text.lower()

    if any(k in t for k in ["استبيان", "استبانة", "مشروع تخرج", "بحث تخرج", "تعبئة الرابط", "استطلاع رأي طلاب"]):
        return "student_project"

    if any(k in t for k in ["جمعة مباركة", "يوم الجمعة", "سورة الكهف", "اللهم صل", "الصلاة على النبي", "ساعة الاستجابة"]):
        return "friday_prayer"

    if any(k in t for k in ["تخرج", "خريج", "خريجين", "خريجات", "حفل التخرج", "وثائق التخرج", "مرتبة الشرف", "مبروك التخرج"]):
        return "graduation"

    if any(k in t for k in ["سمر", "الفصل الصيفي", "صيفي", "ترم صيفي", "summer"]):
        return "summer_term"

    if any(k in t for k in ["تسجيل", "حذف وإضافة", "أدفايزر", "مرشد", "سكشن", "سكاشن", "شعب", "سستم", "فتح الشعب", "تأكيد التسجيل", "تنزيل المواد"]):
        return "registration"

    if any(k in t for k in ["اختبار", "امتحان", "فاينل", "كويز", "ميدتيرم", "درجات", "قريدات", "قاعة اختبار", "جدول الاختبار"]):
        return "exams"

    if any(k in t for k in ["تبرع بالدم", "بنك الدم", "ساعات تطوع", "عمل تطوعي", "حملة خيرية", "كسوة"]):
        return "charity_volunteering"

    return "general_academic"


# ----------------- خادم Keep-Alive للصحة والمراقبة -----------------
class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "application/json; charset=utf-8")
        self.end_headers()
        targets = db.get_target_channels()
        res = {
            "status": "online",
            "bot": "@admiuin_bot",
            "admin": f"@{ADMIN_USERNAME}",
            "primary_model": PRIMARY_MODEL,
            "target_channels": targets,
            "database": "SQLite3 Persistent",
            "mtproto_supported": TELETHON_AVAILABLE,
            "queue_size": post_queue.qsize(),
            "timestamp": int(time.time()),
            "message": "محرر المحتوى الأكاديمي الذكي V3 يعمل بنجاح 24/7"
        }
        self.wfile.write(json.dumps(res, ensure_ascii=False).encode("utf-8"))

    def log_message(self, format, *args):
        pass


def run_keepalive_server():
    for p in [PORT, 8088, 8089, 8090, 8000]:
        try:
            server = HTTPServer(("0.0.0.0", p), HealthCheckHandler)
            logger.info(f"🌐 خادم Health-Check يعمل بنجاح على المنفذ: {p}")
            server.serve_forever()
            break
        except Exception:
            continue


# ----------------- خريطة البوابات الإلكترونية الرسمية للجامعات -----------------
OFFICIAL_UNIVERSITY_PORTALS = {
    "جامعة الملك سعود": "https://ksu.edu.sa",
    "ksu": "https://ksu.edu.sa",
    "جامعة الشرق الأوسط الأمريكية": "https://www.aum.edu.kw",
    "aum": "https://www.aum.edu.kw",
    "جامعة الكويت": "https://ku.edu.kw",
    "جامعة الملك عبدالعزيز": "https://kau.edu.sa",
    "جامعة الإمام": "https://imamu.edu.sa",
    "جامعة أم القرى": "https://uqu.edu.sa",
    "جامعة الأميرة نورة": "https://pnu.edu.sa",
    "جامعة الملك فهد": "https://kfupm.edu.sa",
    "كليات التقنية العليا": "https://hct.ac.ae",
    "جامعة البحرين": "https://uob.edu.bh",
    "جامعة قطر": "https://qu.edu.qa",
    "جامعة الإمارات": "https://uaeu.ac.ae",
}


def clean_and_resolve_url(raw_url: str, target_univ_name: Optional[str] = None) -> str:
    """
    تنظيف واختصار الروابط ومصادر النشر:
    1. فك روابط Google News RSS واستخراج الرابط الأصلي أو توفير بوابة الجامعة الرسمية.
    2. حذف كافة بارامترات التعقب والتجسس (UTM parameters, oc, ved, gclid, etc.).
    3. إعادة رابط مختصر وأنيق وموثوق.
    """
    if not raw_url:
        return ""

    clean_u = raw_url.strip().rstrip(".,;!?)>]\'\"")

    # 1. معالجة روابط Google News RSS
    if "news.google.com" in clean_u or "google.com/url" in clean_u:
        parsed = urllib.parse.urlparse(clean_u)
        qs = urllib.parse.parse_qs(parsed.query)
        if "url" in qs and qs["url"]:
            clean_u = qs["url"][0]
        elif "q" in qs and qs["q"] and qs["q"][0].startswith("http"):
            clean_u = qs["q"][0]
        else:
            try:
                head_req = urllib.request.Request(clean_u, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                })
                with urllib.request.urlopen(head_req, context=ssl_ctx, timeout=2.5) as resp:
                    resolved_url = resp.geturl()
                    if resolved_url and "news.google.com" not in resolved_url and "google.com" not in resolved_url:
                        clean_u = resolved_url
            except Exception:
                pass

        # إذا تعذر فك الرابط وبقي خاماً من جوجل نيوز، نستبدله ببوابة الجامعة الرسمية
        if "news.google.com" in clean_u or "google.com" in clean_u:
            if target_univ_name:
                for k, v in OFFICIAL_UNIVERSITY_PORTALS.items():
                    if k.lower() in target_univ_name.lower():
                        return v
            return ""

    # 2. تنظيف بارامترات التعقب (UTM parameters & trackers)
    try:
        parsed = urllib.parse.urlparse(clean_u)
        if parsed.query:
            qs = urllib.parse.parse_qsl(parsed.query)
            keep_params = []
            tracking_keys = {
                'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
                'oc', 'ved', 'usg', 'gclid', 'fbclid', 'ref', 'hl', 'gl', 'ceid'
            }
            for k, v in qs:
                if k.lower() not in tracking_keys:
                    keep_params.append((k, v))
            new_query = urllib.parse.urlencode(keep_params)
            clean_u = urllib.parse.urlunparse((
                parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment
            ))
    except Exception:
        pass

    return clean_u.rstrip("?&")


# ----------------- فئة البوت الرئيسية -----------------
class StandaloneTelegramEducationalBot:
    def __init__(self):
        self.token = BOT_TOKEN
        self.user_waiting_state: Dict[int, str] = {}
        self.univ_wizard_data: Dict[int, Dict[str, Any]] = {}
        self.cached_forwarded_post: Dict[int, Dict[str, Any]] = {}
        self.telethon_client: Optional[Any] = None
        self.telethon_loop: Optional[asyncio.AbstractEventLoop] = None
        self.running = True

    # ----------------- طلبات تيليجرام الأساسية -----------------
    def tg_request(self, method: str, payload: Optional[Dict] = None, timeout: int = 25) -> Dict[str, Any]:
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/{method}"
        data_bytes = None
        headers = {"User-Agent": "TelegramEducationalBot/3.0"}
        if payload is not None:
            data_bytes = json.dumps(payload).encode("utf-8")
            headers["Content-Type"] = "application/json"

        try:
            req = urllib.request.Request(url, data=data_bytes, headers=headers)
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            # لا نسجل خطأ 409 أو 401 كـ warning في getUpdates لتجنب التشويش عند تحديث التوكن أو عمل Bots.Business
            # وكذلك أخطاء تعذر جلب الروابط الخارجية مباشرة لأن المحرك يتكفل بتنزيلها ورفعها تلقائياً كملف
            if e.code in [401, 409] and "getUpdates" in method:
                logger.debug(f"تيليجرام HTTP ({method}) [{e.code}]: {err_body}")
            elif "failed to get HTTP URL content" in err_body:
                logger.info(f"💡 ملاحظة: خوادم تيليجرام لم تتمكن من سحب رابط الوسائط مباشرة ({method}). سيتم التنزيل والرفع المباشر كملف...")
            else:
                logger.warning(f"تيليجرام HTTP ({method}) [{e.code}]: {err_body}")
            try:
                res_json = json.loads(err_body)
                res_json["http_code"] = e.code
                return res_json
            except Exception:
                return {"ok": False, "http_code": e.code, "description": err_body}
        except Exception as e:
            return {"ok": False, "description": str(e)}

    def strip_html(self, text: str) -> str:
        """إزالة وسوم HTML وتحويل الكيانات لنص عادي نظيف لمنع أي أخطاء في تيليجرام"""
        if not text:
            return ""
        clean = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
        clean = re.sub(r'</?(?:b|strong|i|em|u|ins|s|strike|del|code|pre|a)[^>]*>', '', clean, flags=re.IGNORECASE)
        clean = re.sub(r'<[^>]+>', '', clean)
        clean = html.unescape(clean)
        clean = clean.replace("&quot;", '"').replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
        return clean.strip()

    def balance_html_tags(self, html_str: str) -> str:
        """إغلاق أي وسم مفتوح تلقائياً لمنع خطأ Can't parse entities من تيليجرام"""
        if not html_str:
            return ""
        tags = ['b', 'strong', 'i', 'em', 'u', 'ins', 's', 'strike', 'del', 'code', 'pre', 'a']
        # إزالة أي وسم مبتور في نهاية السلسلة مثل '<b' أو '<a hr'
        html_str = re.sub(r'<[a-zA-Z/][^>]*$', '', html_str)
        open_stack = []
        for match in re.finditer(r'<(/)?([a-zA-Z]+)(?:\s+[^>]*)?>', html_str):
            is_closing = bool(match.group(1))
            tag_name = match.group(2).lower()
            if tag_name not in tags:
                continue
            if is_closing:
                if open_stack and open_stack[-1] == tag_name:
                    open_stack.pop()
            else:
                open_stack.append(tag_name)
        for t in reversed(open_stack):
            html_str += f"</{t}>"
        return html_str

    def split_safe_caption(self, text: str, max_lead: int = 1000) -> Tuple[str, str]:
        """
        تقسيم الكابشن بأمان مطلق دون كسر وسوم HTML أو تجاوز حدود تيليجرام (1024 حرف)
        مع إغلاق الوسوم المفتوحة تلقائياً وضمان عدم حدوث Bad Request: can't parse entities
        """
        if not text:
            return "", ""
        if len(text) <= max_lead:
            return self.balance_html_tags(text), ""

        cut_idx = max_lead
        newline_pos = text.rfind("\n", max_lead // 2, max_lead)
        if newline_pos != -1:
            cut_idx = newline_pos
        else:
            space_pos = text.rfind(" ", max_lead // 2, max_lead)
            if space_pos != -1:
                cut_idx = space_pos

        lead = text[:cut_idx].strip()
        remainder = text[cut_idx:].strip()
        lead_balanced = self.balance_html_tags(lead)
        return lead_balanced, remainder

    def clean_media_url(self, raw_url: Optional[str]) -> Optional[str]:
        """تنظيف وفك تشفير روابط الوسائط واستبعاد الرموز التعبيرية والأيقونات"""
        if not raw_url:
            return None
        url = str(raw_url).strip()
        url = html.unescape(url)
        url = url.replace("&quot;", "").replace('"', '').replace("'", "").strip()
        if url.startswith("//"):
            url = "https:" + url
        elif url.startswith("/") and not os.path.isfile(url):
            url = "https://t.me" + url

        if not (url.startswith("http://") or url.startswith("https://") or os.path.isfile(url)):
            return url
        if "emoji" in url or "telegram.org/img" in url or "website_icon" in url or "favicon" in url:
            return None

        # تشفير المسار إذا كان يحتوي على فراغات أو أحرف خاصة
        if " " in url:
            try:
                parts = urllib.parse.urlsplit(url)
                quoted_path = urllib.parse.quote(parts.path)
                url = urllib.parse.urlunsplit((parts.scheme, parts.netloc, quoted_path, parts.query, parts.fragment))
            except Exception:
                pass
        return url

    def download_remote_media_to_temp(self, url: str, ext_hint: str = "") -> Optional[str]:
        """تحميل وسائط الروابط الخارجية إلى مجلد مؤقت محلي لضمان رفعها في حال تعذر سحب الرابط مباشرة من تيليجرام"""
        try:
            temp_dir = os.path.join(tempfile.gettempdir(), "tg_media")
            os.makedirs(temp_dir, exist_ok=True)
            req_headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept": "*/*"
            }
            if "telegram" in url or "telesco.pe" in url or "t.me" in url:
                req_headers["Referer"] = "https://t.me/"
            elif "twimg" in url or "x.com" in url or "twitter" in url:
                req_headers["Referer"] = "https://x.com/"

            ext = ext_hint
            if not ext:
                if any(x in url.lower() for x in [".png", "png"]):
                    ext = ".png"
                elif any(x in url.lower() for x in [".mp4", "mp4", "video"]):
                    ext = ".mp4"
                elif any(x in url.lower() for x in [".webp", "webp"]):
                    ext = ".webp"
                else:
                    ext = ".jpg"

            temp_path = os.path.join(temp_dir, f"{uuid.uuid4().hex[:12]}{ext}")
            req = urllib.request.Request(url, headers=req_headers)
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=20) as resp:
                data = resp.read()
                if len(data) > 50:
                    with open(temp_path, "wb") as f:
                        f.write(data)
                    return temp_path
        except Exception as e:
            logger.debug(f"تعذر تنزيل الوسائط مؤقتاً من {url[:45]}: {e}")
        return None

    def to_safe_html(self, text: str) -> str:
        if not text:
            return ""
        s = text
        s = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', s)
        return self.balance_html_tags(s)

    def send_msg(self, chat_id: Any, text: str, reply_markup: Optional[Dict] = None, parse_mode: Optional[str] = "HTML", reply_to_message_id: Optional[int] = None) -> Dict[str, Any]:
        safe_text = self.to_safe_html(text) if parse_mode == "HTML" else text
        payload = {"chat_id": chat_id, "text": safe_text}
        if reply_markup:
            payload["reply_markup"] = reply_markup
        if parse_mode:
            payload["parse_mode"] = parse_mode
        if reply_to_message_id:
            payload["reply_to_message_id"] = reply_to_message_id
        res = self.tg_request("sendMessage", payload)
        if not res.get("ok"):
            payload.pop("parse_mode", None)
            payload["text"] = self.strip_html(text)
            res = self.tg_request("sendMessage", payload)
        return res

    def send_photo(self, chat_id: Any, photo: str, caption: str = "", reply_markup: Optional[Dict] = None, parse_mode: Optional[str] = "HTML") -> Dict[str, Any]:
        """
        إرسال صورة بنظام الحماية الفولاذي:
        - فحص وتنظيف الرابط / المسار
        - قص الكابشن وموازنته بدقة تامة لمنع أخطاء 1024 حرف وأخطاء الوسوم المفتوحة
        - محاولات متعددة تدريجية (HTML -> نص عادي -> إرسال الصورة وحدها ثم النص)
        - ضمان مستحيل ضياع الصورة إطلاقاً
        """
        clean_p = self.clean_media_url(photo)
        if not clean_p:
            if caption:
                return self.send_msg(chat_id, caption, reply_markup=reply_markup, parse_mode=parse_mode)
            return {"ok": False, "description": "Empty photo path"}

        safe_caption = self.to_safe_html(caption) if parse_mode == "HTML" else caption
        lead_caption, remainder = self.split_safe_caption(safe_caption, max_lead=1000)
        plain_caption = self.strip_html(lead_caption)

        # 1. إذا كانت الصورة ملفاً محلياً على القرص
        if os.path.isfile(clean_p):
            def upload_local_photo(cap: str, pm: Optional[str]) -> Dict[str, Any]:
                with open(clean_p, "rb") as f:
                    img_bytes = f.read()
                if not img_bytes or len(img_bytes) < 30:
                    return {"ok": False, "description": "Local file is empty"}
                boundary = uuid.uuid4().hex
                body = bytearray()
                def add_f(name: str, val: str):
                    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{val}\r\n'.encode('utf-8'))

                add_f("chat_id", str(chat_id))
                if cap:
                    add_f("caption", cap)
                    if pm:
                        add_f("parse_mode", pm)
                if reply_markup:
                    add_f("reply_markup", json.dumps(reply_markup))

                fname = os.path.basename(clean_p) or "photo.jpg"
                body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="photo"; filename="{fname}"\r\nContent-Type: image/jpeg\r\n\r\n'.encode('utf-8'))
                body.extend(img_bytes)
                body.extend(f'\r\n--{boundary}--\r\n'.encode('utf-8'))

                u_req = urllib.request.Request(
                    f"https://api.telegram.org/bot{BOT_TOKEN}/sendPhoto",
                    data=body,
                    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
                )
                with urllib.request.urlopen(u_req, context=ssl_ctx, timeout=35) as u_resp:
                    return json.loads(u_resp.read().decode("utf-8"))

            try:
                res = upload_local_photo(lead_caption, parse_mode)
                if res.get("ok"):
                    if remainder:
                        self.send_msg(chat_id, remainder, reply_markup=reply_markup, parse_mode=parse_mode)
                    return res
            except Exception as e:
                logger.debug(f"محاولة رفع صورة محلية بـ HTML تعذرت: {e}")

            # محاولة بنص عادي
            try:
                res = upload_local_photo(plain_caption, None)
                if res.get("ok"):
                    if remainder:
                        self.send_msg(chat_id, remainder, reply_markup=reply_markup, parse_mode=parse_mode)
                    return res
            except Exception as e:
                logger.debug(f"محاولة رفع صورة محلية بنص عادي تعذرت: {e}")

            # محاولة إرسال الصورة فارغة ثم النص كرسالة
            try:
                res = upload_local_photo("", None)
                if res.get("ok"):
                    if caption:
                        self.send_msg(chat_id, caption, reply_markup=reply_markup, parse_mode=parse_mode)
                    return res
            except Exception as e:
                logger.warning(f"تعذر رفع ملف الصورة المحلي بالكامل {clean_p}: {e}")

        # 2. إذا كانت الصورة رابط إنترنت مباشر (URL)
        if clean_p.startswith("http://") or clean_p.startswith("https://"):
            # محاولة 1: إرسال الرابط مباشرة عبر Telegram API
            payload = {"chat_id": chat_id, "photo": clean_p}
            if lead_caption:
                payload["caption"] = lead_caption
                if parse_mode:
                    payload["parse_mode"] = parse_mode
            if reply_markup:
                payload["reply_markup"] = reply_markup

            res = self.tg_request("sendPhoto", payload)
            if res.get("ok"):
                if remainder:
                    self.send_msg(chat_id, remainder, reply_markup=reply_markup, parse_mode=parse_mode)
                return res

            err_desc = str(res.get("description", "")).lower()
            is_url_fetch_error = "failed to get http url content" in err_desc or "wrong_file_identifier" in err_desc or "wrong file identifier" in err_desc or "wrong_type" in err_desc

            # محاولة 2: بدون parse_mode بنص عادي فقط إذا كان الخطأ متعلقاً بالتنسيق
            if not is_url_fetch_error and lead_caption and parse_mode:
                payload.pop("parse_mode", None)
                payload["caption"] = plain_caption
                res = self.tg_request("sendPhoto", payload)
                if res.get("ok"):
                    if remainder:
                        self.send_msg(chat_id, remainder, reply_markup=reply_markup, parse_mode=parse_mode)
                    return res

            # محاولة 3: تحميل الصورة محلياً ورفعها كـ Multipart لضمان تجاوز حظر خوادم الـ CDN
            temp_file = self.download_remote_media_to_temp(clean_p, ".jpg")
            if temp_file and os.path.isfile(temp_file):
                local_res = self.send_photo(chat_id, temp_file, caption=caption, reply_markup=reply_markup, parse_mode=parse_mode)
                try:
                    os.remove(temp_file)
                except Exception:
                    pass
                if local_res.get("ok"):
                    return local_res

            # محاولة 4: إرسال الصورة برابطها فارغة ثم إرسال النص فقط إذا لم تكن مشكلة في جلب الرابط
            if not is_url_fetch_error:
                res_pure = self.tg_request("sendPhoto", {"chat_id": chat_id, "photo": clean_p})
                if res_pure.get("ok"):
                    if caption:
                        self.send_msg(chat_id, caption, reply_markup=reply_markup, parse_mode=parse_mode)
                    return res_pure

        # 3. إذا كانت الصورة عبارة عن file_id في تيليجرام
        if clean_p and not os.path.isfile(clean_p) and not clean_p.startswith("http"):
            payload = {"chat_id": chat_id, "photo": clean_p}
            if lead_caption:
                payload["caption"] = lead_caption
                if parse_mode:
                    payload["parse_mode"] = parse_mode
            if reply_markup:
                payload["reply_markup"] = reply_markup

            res = self.tg_request("sendPhoto", payload)
            if res.get("ok"):
                if remainder:
                    self.send_msg(chat_id, remainder, reply_markup=reply_markup, parse_mode=parse_mode)
                return res

            # محاولة بنص عادي
            if lead_caption:
                payload.pop("parse_mode", None)
                payload["caption"] = plain_caption
                res = self.tg_request("sendPhoto", payload)
                if res.get("ok"):
                    if remainder:
                        self.send_msg(chat_id, remainder, reply_markup=reply_markup, parse_mode=parse_mode)
                    return res

            # محاولة بالصورة وحدها
            res_id = self.tg_request("sendPhoto", {"chat_id": chat_id, "photo": clean_p})
            if res_id.get("ok"):
                if caption:
                    self.send_msg(chat_id, caption, reply_markup=reply_markup, parse_mode=parse_mode)
                return res_id

        # خط الدفاع الأخير: إذا كانت الصورة تالفة تماماً أو محذوفة من المصدر، يتم نشر النص كاملاً حتى لا يضيع الخبر
        if caption:
            res_msg = self.send_msg(chat_id, caption, reply_markup=reply_markup, parse_mode=parse_mode)
            if res_msg.get("ok"):
                res_msg["note"] = "fallback_text_after_photo_error"
                return res_msg
        return {"ok": False, "description": "Failed to send photo and text"}

    def send_video(self, chat_id: Any, video: str, caption: str = "", reply_markup: Optional[Dict] = None, parse_mode: Optional[str] = "HTML", supports_streaming: bool = True) -> Dict[str, Any]:
        """
        إرسال مقطع فيديو بنظام الحماية الفولاذي:
        - فحص وتنظيف الرابط / الملف
        - تقسيم الكابشن بدقة تامة لمنع أخطاء 1024 حرف
        - إمكانية الإرسال كـ Video أو كـ Animation أو Document عند اختلاف الترميز
        """
        clean_v = self.clean_media_url(video)
        if not clean_v:
            if caption:
                return self.send_msg(chat_id, caption, reply_markup=reply_markup, parse_mode=parse_mode)
            return {"ok": False, "description": "Empty video path"}

        safe_caption = self.to_safe_html(caption) if parse_mode == "HTML" else caption
        lead_caption, remainder = self.split_safe_caption(safe_caption, max_lead=1000)
        plain_caption = self.strip_html(lead_caption)

        # 1. إذا كان الفيديو ملفاً محلياً على القرص
        if os.path.isfile(clean_v):
            def upload_local_video(cap: str, pm: Optional[str]) -> Dict[str, Any]:
                with open(clean_v, "rb") as f:
                    vid_bytes = f.read()
                if not vid_bytes or len(vid_bytes) < 50:
                    return {"ok": False, "description": "Local video is empty"}
                boundary = uuid.uuid4().hex
                body = bytearray()
                def add_f(name: str, val: str):
                    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{val}\r\n'.encode('utf-8'))

                add_f("chat_id", str(chat_id))
                if cap:
                    add_f("caption", cap)
                    if pm:
                        add_f("parse_mode", pm)
                if reply_markup:
                    add_f("reply_markup", json.dumps(reply_markup))
                add_f("supports_streaming", "true")

                fname = os.path.basename(clean_v) or "video.mp4"
                body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="video"; filename="{fname}"\r\nContent-Type: video/mp4\r\n\r\n'.encode('utf-8'))
                body.extend(vid_bytes)
                body.extend(f'\r\n--{boundary}--\r\n'.encode('utf-8'))

                u_req = urllib.request.Request(
                    f"https://api.telegram.org/bot{BOT_TOKEN}/sendVideo",
                    data=body,
                    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
                )
                with urllib.request.urlopen(u_req, context=ssl_ctx, timeout=60) as u_resp:
                    return json.loads(u_resp.read().decode("utf-8"))

            try:
                res = upload_local_video(lead_caption, parse_mode)
                if res.get("ok"):
                    if remainder:
                        self.send_msg(chat_id, remainder, reply_markup=reply_markup, parse_mode=parse_mode)
                    return res
            except Exception as e:
                logger.debug(f"محاولة رفع فيديو محلي بـ HTML تعذرت: {e}")

            # محاولة بنص عادي
            try:
                res = upload_local_video(plain_caption, None)
                if res.get("ok"):
                    if remainder:
                        self.send_msg(chat_id, remainder, reply_markup=reply_markup, parse_mode=parse_mode)
                    return res
            except Exception as e:
                logger.debug(f"محاولة رفع فيديو محلي بنص عادي تعذرت: {e}")

            # محاولة إرسال الفيديو فارغاً ثم النص
            try:
                res = upload_local_video("", None)
                if res.get("ok"):
                    if caption:
                        self.send_msg(chat_id, caption, reply_markup=reply_markup, parse_mode=parse_mode)
                    return res
            except Exception as e:
                logger.warning(f"تعذر رفع ملف الفيديو المحلي {clean_v}: {e}")

        # 2. إذا كان الفيديو رابطاً مباشراً (URL)
        if clean_v.startswith("http://") or clean_v.startswith("https://"):
            payload = {"chat_id": chat_id, "video": clean_v, "supports_streaming": supports_streaming}
            if lead_caption:
                payload["caption"] = lead_caption
                if parse_mode:
                    payload["parse_mode"] = parse_mode
            if reply_markup:
                payload["reply_markup"] = reply_markup

            res = self.tg_request("sendVideo", payload)
            if res.get("ok"):
                if remainder:
                    self.send_msg(chat_id, remainder, reply_markup=reply_markup, parse_mode=parse_mode)
                return res

            err_desc = str(res.get("description", "")).lower()
            is_url_fetch_error = "failed to get http url content" in err_desc or "wrong_file_identifier" in err_desc or "wrong file identifier" in err_desc or "wrong_type" in err_desc

            # محاولة ثانية بنص عادي فقط إذا كان الخطأ متعلقاً بالتنسيق
            if not is_url_fetch_error and lead_caption and parse_mode:
                payload.pop("parse_mode", None)
                payload["caption"] = plain_caption
                res = self.tg_request("sendVideo", payload)
                if res.get("ok"):
                    if remainder:
                        self.send_msg(chat_id, remainder, reply_markup=reply_markup, parse_mode=parse_mode)
                    return res

            # محاولة تنزيله مؤقتاً ورفعه
            temp_vid = self.download_remote_media_to_temp(clean_v, ".mp4")
            if temp_vid and os.path.isfile(temp_vid):
                loc_res = self.send_video(chat_id, temp_vid, caption=caption, reply_markup=reply_markup, parse_mode=parse_mode)
                try:
                    os.remove(temp_vid)
                except Exception:
                    pass
                if loc_res.get("ok"):
                    return loc_res

            # محاولة إرساله كـ Animation أو Document فقط إذا لم تكن مشكلة في جلب الرابط
            if not is_url_fetch_error:
                res_anim = self.tg_request("sendAnimation", {"chat_id": chat_id, "animation": clean_v, "caption": plain_caption})
                if res_anim.get("ok"):
                    return res_anim

                res_pure = self.tg_request("sendVideo", {"chat_id": chat_id, "video": clean_v, "supports_streaming": True})
                if res_pure.get("ok"):
                    if caption:
                        self.send_msg(chat_id, caption, reply_markup=reply_markup, parse_mode=parse_mode)
                    return res_pure

        # 3. إذا كان الفيديو عبارة عن file_id
        if clean_v and not os.path.isfile(clean_v) and not clean_v.startswith("http"):
            payload = {"chat_id": chat_id, "video": clean_v, "supports_streaming": supports_streaming}
            if lead_caption:
                payload["caption"] = lead_caption
                if parse_mode:
                    payload["parse_mode"] = parse_mode
            if reply_markup:
                payload["reply_markup"] = reply_markup

            res = self.tg_request("sendVideo", payload)
            if res.get("ok"):
                if remainder:
                    self.send_msg(chat_id, remainder, reply_markup=reply_markup, parse_mode=parse_mode)
                return res

            if lead_caption:
                payload.pop("parse_mode", None)
                payload["caption"] = plain_caption
                res = self.tg_request("sendVideo", payload)
                if res.get("ok"):
                    if remainder:
                        self.send_msg(chat_id, remainder, reply_markup=reply_markup, parse_mode=parse_mode)
                    return res

            res_vid = self.tg_request("sendVideo", {"chat_id": chat_id, "video": clean_v, "supports_streaming": True})
            if res_vid.get("ok"):
                if caption:
                    self.send_msg(chat_id, caption, reply_markup=reply_markup, parse_mode=parse_mode)
                return res_vid

        if caption:
            res_msg = self.send_msg(chat_id, caption, reply_markup=reply_markup, parse_mode=parse_mode)
            if res_msg.get("ok"):
                res_msg["note"] = "fallback_text_after_video_error"
                return res_msg
        return {"ok": False, "description": "Failed to send video and text"}

    def send_media_group(self, chat_id: Any, media_items: List[Dict[str, Any]], caption: str = "", reply_markup: Optional[Dict] = None, parse_mode: Optional[str] = "HTML") -> Dict[str, Any]:
        """إرسال ألبوم صور أو وسائط مجمعة (Media Group) إلى القناة مع الكابشن المعتمد"""
        if not media_items:
            if caption:
                return self.send_msg(chat_id, caption, reply_markup=reply_markup, parse_mode=parse_mode)
            return {"ok": False, "description": "Empty media group"}

        safe_caption = self.to_safe_html(caption) if parse_mode == "HTML" else caption
        lead_caption, remainder = self.split_safe_caption(safe_caption, max_lead=1000)

        formatted_media = []
        for idx, item in enumerate(media_items[:10]):
            m_type = item.get("type", "photo")
            m_url = self.clean_media_url(item.get("media"))
            if not m_url:
                continue
            entry = {"type": m_type, "media": m_url}
            if idx == 0 and lead_caption:
                entry["caption"] = lead_caption
                if parse_mode:
                    entry["parse_mode"] = parse_mode
            formatted_media.append(entry)

        if not formatted_media:
            if caption:
                return self.send_msg(chat_id, caption, reply_markup=reply_markup, parse_mode=parse_mode)
            return {"ok": False, "description": "No valid media in group"}

        res = self.tg_request("sendMediaGroup", {"chat_id": chat_id, "media": formatted_media})
        if res.get("ok"):
            if remainder:
                self.send_msg(chat_id, remainder, reply_markup=reply_markup, parse_mode=parse_mode)
            return res

        # إذا تعذر إرسال الألبوم مجمعاً: إرسال العنصر الأول كصورة/فيديو والبقية تباعاً
        first = formatted_media[0]
        if first["type"] == "video":
            return self.send_video(chat_id, first["media"], caption=caption, reply_markup=reply_markup, parse_mode=parse_mode)
        else:
            return self.send_photo(chat_id, first["media"], caption=caption, reply_markup=reply_markup, parse_mode=parse_mode)

    def send_document(self, chat_id: Any, document: str, caption: str = "", reply_markup: Optional[Dict] = None, parse_mode: Optional[str] = "HTML") -> Dict[str, Any]:
        """إرسال ملف/مستند (أدلة القبول، نماذج التسجيل، ملفات PDF الأكاديمية)"""
        clean_d = self.clean_media_url(document)
        if not clean_d:
            if caption:
                return self.send_msg(chat_id, caption, reply_markup=reply_markup, parse_mode=parse_mode)
            return {"ok": False, "description": "Empty document"}

        safe_caption = self.to_safe_html(caption) if parse_mode == "HTML" else caption
        lead_caption, remainder = self.split_safe_caption(safe_caption, max_lead=1000)
        plain_caption = self.strip_html(lead_caption)

        payload = {"chat_id": chat_id, "document": clean_d}
        if lead_caption:
            payload["caption"] = lead_caption
            if parse_mode:
                payload["parse_mode"] = parse_mode
        if reply_markup:
            payload["reply_markup"] = reply_markup

        res = self.tg_request("sendDocument", payload)
        if res.get("ok"):
            if remainder:
                self.send_msg(chat_id, remainder, reply_markup=reply_markup, parse_mode=parse_mode)
            return res

        if lead_caption:
            payload.pop("parse_mode", None)
            payload["caption"] = plain_caption
            res = self.tg_request("sendDocument", payload)
            if res.get("ok"):
                if remainder:
                    self.send_msg(chat_id, remainder, reply_markup=reply_markup, parse_mode=parse_mode)
                return res

        res_doc = self.tg_request("sendDocument", {"chat_id": chat_id, "document": clean_d})
        if res_doc.get("ok"):
            if caption:
                self.send_msg(chat_id, caption, reply_markup=reply_markup, parse_mode=parse_mode)
            return res_doc

        if caption:
            return self.send_msg(chat_id, caption, reply_markup=reply_markup, parse_mode=parse_mode)
        return {"ok": False, "description": "Failed to send document"}

    def send_animation(self, chat_id: Any, animation: str, caption: str = "", reply_markup: Optional[Dict] = None, parse_mode: Optional[str] = "HTML") -> Dict[str, Any]:
        """إرسال صورة متحركة GIF أو مقطع إرشادي متحرك"""
        clean_a = self.clean_media_url(animation)
        if not clean_a:
            if caption:
                return self.send_msg(chat_id, caption, reply_markup=reply_markup, parse_mode=parse_mode)
            return {"ok": False, "description": "Empty animation"}

        safe_caption = self.to_safe_html(caption) if parse_mode == "HTML" else caption
        lead_caption, remainder = self.split_safe_caption(safe_caption, max_lead=1000)
        plain_caption = self.strip_html(lead_caption)

        payload = {"chat_id": chat_id, "animation": clean_a}
        if lead_caption:
            payload["caption"] = lead_caption
            if parse_mode:
                payload["parse_mode"] = parse_mode
        if reply_markup:
            payload["reply_markup"] = reply_markup

        res = self.tg_request("sendAnimation", payload)
        if res.get("ok"):
            if remainder:
                self.send_msg(chat_id, remainder, reply_markup=reply_markup, parse_mode=parse_mode)
            return res

        if lead_caption:
            payload.pop("parse_mode", None)
            payload["caption"] = plain_caption
            res = self.tg_request("sendAnimation", payload)
            if res.get("ok"):
                if remainder:
                    self.send_msg(chat_id, remainder, reply_markup=reply_markup, parse_mode=parse_mode)
                return res

        res_a = self.tg_request("sendAnimation", {"chat_id": chat_id, "animation": clean_a})
        if res_a.get("ok"):
            if caption:
                self.send_msg(chat_id, caption, reply_markup=reply_markup, parse_mode=parse_mode)
            return res_a

        if caption:
            return self.send_msg(chat_id, caption, reply_markup=reply_markup, parse_mode=parse_mode)
        return {"ok": False, "description": "Failed to send animation"}

    def answer_callback(self, cb_id: str, text: Optional[str] = None, alert: bool = False):
        payload = {"callback_query_id": cb_id}
        if text:
            payload["text"] = text
            payload["show_alert"] = alert
        return self.tg_request("answerCallbackQuery", payload)

    # ----------------- فحص الصلاحيات والأدوار -----------------
    def check_user_access(self, from_user: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        user_id = from_user.get("id")
        username = (from_user.get("username") or "").replace("@", "")
        first_name = from_user.get("first_name", "")

        user = db.get_user(user_id)
        if not user:
            role = "admin" if user_id == ADMIN_ID else "user"
            user = db.upsert_user(user_id, username, first_name, role)

        if user.get("is_banned"):
            return False, user

        return True, user

    def is_admin(self, user_id: int) -> bool:
        if user_id == ADMIN_ID:
            return True
        u = db.get_user(user_id)
        return bool(u and u.get("role") in ["admin", "superadmin"])

    def is_moderator(self, user_id: int) -> bool:
        if self.is_admin(user_id):
            return True
        u = db.get_user(user_id)
        return bool(u and u.get("role") in ["admin", "moderator"])

    # ----------------- لوحات المفاتيح والأزرار -----------------
    def get_main_reply_keyboard(self, user_role: str = "user") -> Dict[str, Any]:
        kb = [
            [{"text": "🏛️ إدارة الجامعات وقنوات النشر"}, {"text": "➕ إضافة جامعة وقناة نشر"}],
            [{"text": "🔄 فحص وسحب أخبار الجامعات"}, {"text": "🌐 بحث أخبار جوجل للجامعة"}],
            [{"text": "📝 صياغة ونشر خبر فوري"}, {"text": "🎯 إعلان خدماتي البديل"}],
            [{"text": "📊 تقارير القنوات"}, {"text": "⏸ إيقاف / استئناف"}],
            [{"text": "👥 إدارة المستخدمين"}, {"text": "👤 حسابي والاشتراك"}],
            [{"text": "📱 ربط رقم هاتفي (تحقق)"}, {"text": "🧪 تجربة الصياغة الفورية"}]
        ]
        return {
            "keyboard": kb,
            "resize_keyboard": True,
            "persistent": True,
            "is_persistent": True
        }

    def get_contact_request_keyboard(self) -> Dict[str, Any]:
        return {
            "keyboard": [
                [{"text": "📱 مشاركة رقم هاتفي للتحقق الرسمي", "request_contact": True}],
                [{"text": "🔙 إلغاء والعودة للرئيسية"}]
            ],
            "resize_keyboard": True,
            "one_time_keyboard": True
        }

    def get_control_panel_inline_keyboard(self, is_admin_user: bool = True) -> Dict[str, Any]:
        univs = db.get_university_projects()
        is_paused = db.get_setting("is_paused", "0") == "1"
        pause_btn_text = "▶️ استئناف النشر" if is_paused else "⏸ إيقاف مؤقت"
        buttons = [
            [
                {"text": f"🏛️ الجامعات وقنواتها ({len(univs)})", "callback_data": "panel_universities"},
                {"text": "➕ إضافة جامعة جديدة", "callback_data": "panel_add_university"}
            ],
            [
                {"text": "🔄 فحص وسحب أخبار الجامعات", "callback_data": "panel_crawl"},
                {"text": "🌐 بحث أخبار جوجل", "callback_data": "panel_gnews"}
            ],
            [
                {"text": "📝 صياغة ونشر خبر فوري", "callback_data": "panel_new_post"},
                {"text": "🎯 إعلان خدماتي البديل", "callback_data": "panel_ad"}
            ],
            [
                {"text": "📊 حالة النظام والتقارير", "callback_data": "panel_stats"},
                {"text": pause_btn_text, "callback_data": "panel_toggle_pause"}
            ],
            [
                {"text": "👥 إدارة المستخدمين", "callback_data": "panel_users"},
                {"text": "🧪 تجربة الصياغة المباشرة", "callback_data": "panel_test"}
            ],
            [
                {"text": "📞 الدعم الفني (@M_S_F_G)", "url": "https://t.me/M_S_F_G"},
                {"text": "🔄 تحديث اللوحة", "callback_data": "panel_start"}
            ]
        ]
        return {"inline_keyboard": buttons}

    # ----------------- دمج الذكاء الاصطناعي مع Timeout Guard -----------------
    def clean_text_from_sources(self, text: str) -> str:
        if not text:
            return ""
        cleaned = text.replace("&nbsp;&nbsp;X", "").replace("&nbsp;X", "").replace("&nbsp;", " ")
        cleaned = re.sub(r'\s+X\s*$', '', cleaned)
        # إزالة روابط قنوات تيليجرام الترويجية فقط دون مساس بالروابط الرسمية أو أسماء الجامعات
        cleaned = re.sub(r'https?://(?:t\.me|telegram\.me)/[a-zA-Z0-9_+/]+', '', cleaned)
        cleaned = re.sub(r'(?:لا تنسوا الاشتراك|تابعونا على تليجرام|اشترك في القناة)[^\n.]*', '', cleaned, flags=re.IGNORECASE)
        cleaned = cleaned.replace("ߓ堙噈اعيد", "مواعيد").replace("ߓꠙ嘰كرات", "مذكرات").replace("ߎ㠘㙆ظمة", "أنظمة")
        cleaned = re.sub(r'[\u07C0-\u07FF\u4E00-\u9FFF\uF000-\uFFFF]', '', cleaned)

        # حذف الأسطر الفارغة والنقاط الفارغة مع الحفاظ الكامل على نصوص المنشور
        lines = cleaned.split("\n")
        clean_lines = []
        for l in lines:
            t = l.strip()
            if not t or t in ["•", "-", "*", "📌", "🎓", "• ", "- ", "* "]:
                continue
            clean_lines.append(t)
        return "\n".join(clean_lines).strip()

    def extract_external_links(self, text: str, target_univ: Optional[str] = None) -> List[str]:
        if not text:
            return []
        matches = re.findall(r'https?://[^\s<>"]+', text)
        valid = []
        for u in matches:
            u_clean = u.rstrip(".,;!?)>]\'\"")
            if "t.me/" in u_clean or "telegram.me/" in u_clean:
                continue
            resolved = clean_and_resolve_url(u_clean, target_univ)
            if resolved and resolved not in valid and "news.google.com" not in resolved:
                valid.append(resolved)
        return valid

    def call_ai_merge_stories(self, story1: str, story2: str, target_univ: Optional[str] = None) -> Optional[str]:
        """دمج الأخبار المماثلة بالذكاء الاصطناعي: دمج تفاصيل ومستجدات المصدرين في منشور أكاديمي واحد شامل"""
        clean1 = self.clean_text_from_sources(story1)
        clean2 = self.clean_text_from_sources(story2)
        if not clean1 or not clean2:
            return None

        links1 = self.extract_external_links(story1, target_univ)
        links2 = self.extract_external_links(story2, target_univ)
        all_links = list(dict.fromkeys(links1 + links2))

        univ_label = target_univ or "الجامعة"
        merge_prompt = f"""أنت محرر وموجه محتوى أكاديمي بارع. ورد خبران من مصدرين مختلفين حول نفس الفعالية أو الموضوع الأكاديمي لـ ({univ_label}).
المطلوب:
1. ادمج التفاصيل والمستجدات الواردة في كلا الخبرين في منشور أكاديمي واحد متكامل وشامل.
2. احتفظ بجميع المواعيد، التواريخ، الشروط، وأرقام البوابات الإلكترونية.
3. تخلص تماماً من أي تكرار للكلام أو الحشو، ولا تذكر أي قنوات أو مصادر سابقة.
4. استخدم صياغة جذابة ومباشرة للطلاب مع نقاط واضحة وعنوان رسمي مميز."""

        payload = {
            "model": PRIMARY_MODEL,
            "messages": [
                {"role": "system", "content": merge_prompt},
                {"role": "user", "content": f"التقرير الأول:\n{clean1}\n\nالتقرير الثاني (تفاصيل إضافية مكملة):\n{clean2}\n\nالمطلوب: صغ من هذين التقريرين منشوراً واحداً رسمياً شاملاً يجمع كافة المواعيد والتفاصيل دون أي تكرار:"}
            ],
            "temperature": 0.35,
            "max_tokens": 1500
        }
        headers = {
            "Authorization": f"Bearer {AI_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "TelegramEducationalBot/3.0"
        }
        endpoint = f"{AI_BASE_URL}/chat/completions"

        try:
            req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers)
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if "choices" in data and len(data["choices"]) > 0:
                    ai_text = data["choices"][0]["message"]["content"].strip()
                    cleaned_ai = self.clean_text_from_sources(ai_text)
                    for lk in all_links:
                        if lk not in cleaned_ai:
                            cleaned_ai += f"\n\n🔗 <b>رابط البوابة الإلكترونية المعتمدة:</b>\n{lk}"
                    return cleaned_ai
        except Exception as e:
            logger.warning(f"ملاحظة في دمج الأخبار بالذكاء الاصطناعي: {e}")

        combined = f"🚨 <b>تحديث وتفاصيل مكملة - {univ_label}</b>\n\n▫️ {clean1[:300]}\n▫️ {clean2[:300]}"
        if all_links:
            combined += "\n\n🔗 <b>رابط البوابة الإلكترونية المعتمدة:</b>\n" + "\n".join(all_links)
        return combined

    def call_ai(self, raw_text: str, custom_instruction: str = "", system_prompt: Optional[str] = None, target_univ: Optional[str] = None) -> Optional[str]:
        clean_input = self.clean_text_from_sources(raw_text)
        if not clean_input or len(clean_input.strip()) < 5:
            return None

        # 1. فحص الفلترة الصارمة للشأن الطلابي (إسقاط أي أخبار سياسية أو اقتصادية أو حشو إعلامي)
        is_rel, rel_reason = is_relevant_student_news(clean_input, target_univ)
        if not is_rel:
            logger.info(f"🛡️ [فلترة الشأن الطلابي] تم استبعاد خبر غير طلابي أو حشو سياسي/اقتصادي ({rel_reason}): {clean_input[:60]}")
            return None

        # 2. كشف السياق والمناسبة الأكاديمية بدقة (تسجيل، سمر، اختبارات، تخرج، جمعة، استبيانات)
        ctx = detect_student_context(clean_input)
        is_prayer_or_motivational = (ctx in ["friday_prayer", "graduation"]) or any(w in clean_input for w in ["اللهم", "يا رب", "بالتوفيق", "دعواتنا", "أجمل التهاني", "مبارك التخرج", "صباح الخير", "جمعة مباركة", "إجازة سعيدة", "فالكم التوفيق"])

        context_hints = {
            "registration": "المحتوى يخص تسجيل المقررات أو الأدفايزر. خاطب الطلاب كزميل ناصح وحثهم يكلمون أدفايزراتهم يسجلون لهم المادة أو يفتحون السكاشن قبل يقفل السستم، مع إبراز المواعيد والروابط بـ <b>...</b>.",
            "summer_term": "المحتوى يخص الفصل الصيفي (السمر). صغ المنشور بأسلوب واضح ومحفز للسمر والشروط ومواعيد تنزيل المقررات.",
            "exams": "المحتوى يخص الاختبارات أو الفاينل. هدأ الطلاب واذكرهم بالأذكار والأدعية والصلاة على النبي ﷺ والتوكل على الله وفالهم الـ A+ وأعلى القريدات، وأبرز التواريخ والقاعات بـ <b>...</b>.",
            "graduation": "المحتوى يخص التخرج والنتائج. بارك لهم بحرارة وفرحة واطلب من المتخرجين يحطون قلب بالرياكشنات ❤️🎓 وعقبال الوظائف.",
            "friday_prayer": "المحتوى إيماني أو يوم الجمعة. صغه بروح أخوية دافئة مع الصلاة على النبي ﷺ والتذكير بسورة الكهف وساعة الاستجابة والدعاء للأهل والزملاء.",
            "student_project": "المحتوى استبيان أو مشروع تخرج لزميل. اطلب فزعة ودعم الزملاء لملء الرابط بأسلوب أخوي جميل.",
            "charity_volunteering": "المحتوى عمل خيري أو تطوع أو تبرع. شجع الطلاب على الخير والمشاركة واحتساب الأجر.",
            "general_academic": "تحديث أو إعلان أكاديمي مهم. ادخل في صلب الموضوع مباشرة بأسلوب ممثل دفعة ناصح ومحب بدون أي قوالب مكررة أو 'تنبيه لطلاب'."
        }
        ctx_guide = context_hints.get(ctx, context_hints["general_academic"])

        # استخراج كافة الروابط الخارجية (بوابات التقديم، PowerApps، الاستمارات، بوابات الجامعات) مع تنظيفها وفك روابط Google News
        ext_links = self.extract_external_links(raw_text, target_univ)

        active_system_prompt = system_prompt or SYSTEM_PROMPT_REPHRASE
        if target_univ:
            active_system_prompt += f"\n\n🚨 المنشور موجه لطلاب: ({target_univ}). تحدث كأنك زميلهم وممثل دفعتهم الناصح بأسلوب خليجي دافئ. ادخل في صلب الموضوع فوراً بدون أي قوالب إدارية نمطية. أبرز التواريخ والأوقات والمواعيد بخط عريض <b>...</b> وتخلص تماماً من أي حشو."

        instruction_addon = f"توجيهات إضافية من المشرف: {custom_instruction}\n\n" if custom_instruction else ""
        user_prompt = f"{instruction_addon}[توجيه سياقي ذكي: {ctx_guide}]\n\nالمحتوى المطلوب صياغته:\n{clean_input}"

        payload = {
            "model": PRIMARY_MODEL,
            "messages": [
                {"role": "system", "content": active_system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.4,
            "max_tokens": 1500
        }
        headers = {
            "Authorization": f"Bearer {AI_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "TelegramEducationalBot/3.0"
        }
        endpoint = f"{AI_BASE_URL}/chat/completions"

        def _process_ai_response(text: str) -> Optional[str]:
            cleaned_ai = self.clean_text_from_sources(text)
            for lk in ext_links:
                if lk not in cleaned_ai:
                    cleaned_ai += f"\n\n🔗 <b>رابط البوابة الإلكترونية المعتمدة:</b>\n{lk}"
            return cleaned_ai

        # محاولة كوكبة النماذج الذكية المتتالية (Failover Cluster) مع تجاوز أخطاء 503 تلقائياً
        for model_name in AI_MODELS_CASCADE:
            payload["model"] = model_name
            for attempt in range(2):
                try:
                    req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers)
                    with urllib.request.urlopen(req, context=ssl_ctx, timeout=30) as resp:
                        data = json.loads(resp.read().decode("utf-8"))
                        if "choices" in data and len(data["choices"]) > 0:
                            ai_text = data["choices"][0]["message"]["content"].strip()
                            res = _process_ai_response(ai_text)
                            if res:
                                return res
                except urllib.error.HTTPError as e:
                    if e.code in [502, 503, 504, 429]:
                        logger.warning(f"ملاحظة في نموذج الذكاء {model_name} (خطأ {e.code})، الانتقال الفوري للنموذج البديل...")
                        time.sleep(1.0)
                        continue
                    else:
                        logger.debug(f"خطأ HTTP {e.code} في النموذج {model_name}: {e}")
                        break
                except Exception as e:
                    logger.debug(f"استثناء في نموذج الذكاء {model_name} (محاولة {attempt+1}): {e}")
                    time.sleep(0.5)

        # صياغة بديلة إنسانية عفوية كزميل ناصح بحسب السياق في حال تعذر الذكاء
        clean_lines = [l.strip() for l in clean_input.split("\n") if l.strip() and not l.startswith("@") and "t.me/" not in l]
        text_lines = [l for l in clean_lines if not l.startswith("http://") and not l.startswith("https://") and l not in ["•", "-", "*", "📌", "🎓"]]
        if not text_lines:
            return None

        # إذا كان دعاء أو جمعة
        if is_prayer_or_motivational or ctx == "friday_prayer":
            full_msg = "\n".join(text_lines[:6])
            tag = f"#{target_univ.replace(' ', '_')}" if target_univ else "#مجتمع_الطلاب"
            return f"🤍 {full_msg}\n\nاللهم صلّ وسلم على نبينا محمد.. وفالكم التوفيق والخير دائماً 🤲\n{tag}"

        first_line = text_lines[0]
        first_line = re.sub(r'^[•\-\*#📌📢✨🎓▫️🚨]\s*', '', first_line).strip()
        title = first_line[:85] + "..." if len(first_line) > 90 else first_line

        body_lines = [l for l in text_lines[1:10] if len(l) > 3]
        clean_bullets = []
        for bl in body_lines:
            bl_text = re.sub(r'^[•\-\*▫️]\s*', '', bl).strip()
            # إبراز التواريخ والأوقات بالخط العريض تلقائياً
            bl_text = re.sub(r'(\d{1,2}[:/]\d{1,2}(?:[:/]\d{2,4})?|\d{1,4}/\d{1,2}/\d{1,4}|\b(?:الأحد|الإثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت)\b|\b(?:صباحاً|مساءً|م|ص)\b)', r'<b>\1</b>', bl_text)
            clean_bullets.append(f"▫️ {bl_text}")
        bullets = "\n".join(clean_bullets)

        links_block = ""
        if ext_links:
            links_block = "\n\n🔗 <b>رابط البوابة الإلكترونية المعتمدة:</b>\n" + "\n".join(ext_links)

        tag = f"#{target_univ.replace(' ', '_')}" if target_univ else "#شؤون_الطلاب"

        if ctx == "registration":
            header = f"تذكير بخصوص تسجيل المقررات - {target_univ} ⏰" if target_univ else "تذكير بخصوص تسجيل المقررات ⏰"
            footer = "يا شباب ويا بنات.. كلموا أدفايزراتكم ورتبوا جداولكم قبل يقفل السستم، وفالكم التوفيق والتساهيل 🤲"
        elif ctx == "summer_term":
            header = f"بخصوص السمر (الفصل الصيفي) - {target_univ} ☀️📚" if target_univ else "بخصوص السمر (الفصل الصيفي) ☀️📚"
            footer = "رتبوا جداولكم من بدري وشيكوا على الشعب، بالتوفيق للجميع 🤝"
        elif ctx == "exams":
            header = f"تذكير بموعد الاختبار - {target_univ} 📝" if target_univ else "تذكير بموعد الاختبار 📝"
            footer = "توكلوا على الله ولا تنسون أذكاركم وأدعيتكم، وفالكم أعلى القريدات والدرجات 🤲✨"
        elif ctx == "graduation":
            header = f"ألف ألف مبروك التخرج يا فخرنا 🎓✨"
            footer = "المتخرجين يثبتون وجودهم برياكشن قلب ❤️👇 وعقبال أعلى المناصب والوظائف"
        elif ctx == "student_project":
            header = "فزعتكم لزميلكم في استبيان التخرج 🤝"
            footer = "تعبئة الرابط ما تاخذ دقيقة وبتفرجون كربته، جزاكم الله خير 🤍"
        elif ctx == "charity_volunteering":
            header = "فرصة عمل خير وتطوع لطلابنا 🌱"
            footer = "ربي يكتب أجر الجميع ويسعدكم 🤲"
        else:
            header = f"تنويه هام: {title}"
            footer = "دعواتنا لكم بالتوفيق والنجاح الدائم 🤲\nشاركوا التنبيه مع زملائكم الطلاب 🤝"

        if bullets:
            return f"📌 <b>{header}</b>\n\n{bullets}{links_block}\n\n{footer}\n\n{tag} #مواعيد"
        else:
            return f"📌 <b>{header}</b>{links_block}\n\n{footer}\n\n{tag}"

    def call_ai_for_comment(self, comment_text: str, original_post: str = "", target_univ: Optional[str] = None) -> Optional[str]:
        """توليد رد أكاديمي ذكي وفوري على تعليقات واستفسارات الطلاب تحت منشورات القناة بأقصى طاقة استيعابية"""
        clean_comment = self.clean_text_from_sources(comment_text)
        if not clean_comment or len(clean_comment) < 2:
            return None

        univ_str = f"لـ ({target_univ})" if target_univ else "الأكاديمية"
        system_prompt = f"""أنت المستشار الأكاديمي والرد الرسمي لقناة الأخبار الجامعية {univ_str}.
مهمتك الرد المباشر والشامل والوافي على استفسارات الطلاب في قسم التعليقات بمنتهى اللباقة والاحترافية الأكاديمية العالية.
قواعد الرد:
1. قدّم إجابة شافية، واضحة ومباشرة مبنية على تفاصيل المنشور الأصلي والأنظمة الجامعية المتبعة.
2. إذا كان السؤال عن موعد أو شروط مذكورة في المنشور، لخصها للطالب بوضوح.
3. إذا كان هناك رابط رسمي للتقديم أو الاستعلام، أرشد الطالب إليه.
4. اكتب بلغة عربية فصيحة، راقية، ومهذبة بدون أي إطالة مصطنعة أو حشو.
5. لا تذكر أنك ذكاء اصطناعي أو بوت، تحدث بصفتك الفريق الأكاديمي الرسمي للقناة."""

        user_content = f"المنشور الأصلي في القناة:\n{original_post[:2000]}\n\nسؤال / تعليق الطالب:\n{clean_comment}\n\nالرد الأكاديمي المباشر والشامل للطالب:"
        payload = {
            "model": PRIMARY_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            "temperature": 0.35,
            "max_tokens": 1500
        }
        headers = {
            "Authorization": f"Bearer {AI_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "TelegramEducationalBot/3.0"
        }
        endpoint = f"{AI_BASE_URL}/chat/completions"

        for model_name in AI_MODELS_CASCADE:
            payload["model"] = model_name
            for attempt in range(2):
                try:
                    req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers)
                    with urllib.request.urlopen(req, context=ssl_ctx, timeout=25) as resp:
                        data = json.loads(resp.read().decode("utf-8"))
                        if "choices" in data and len(data["choices"]) > 0:
                            ans = data["choices"][0]["message"]["content"].strip()
                            if ans:
                                return ans
                except urllib.error.HTTPError as e:
                    if e.code in [502, 503, 504, 429]:
                        time.sleep(0.8)
                        continue
                    else:
                        break
                except Exception:
                    time.sleep(0.4)

        return f"أهلاً بك عزيزي الطالب 🌸\nبخصوص استفسارك، نرجو مراجعة التفاصيل والروابط الموضحة في المنشور أعلاه أو زيارة البوابة الرسمية للجامعة للاطلاع على كافة الشروط والمواعيد المعتمدة."

    # ----------------- المعالج غير المتزامن (Worker Thread) -----------------
    def worker_loop(self):
        logger.info("⚙️ بدء تشغيل خيط معالجة المنشورات (Background Worker Queue)...")
        while self.running:
            try:
                task = post_queue.get(timeout=1.0)
                if not task:
                    continue

                task_type = task.get("type")
                raw_text = task.get("text", "")
                photo = task.get("photo")
                video = task.get("video")
                media_group = task.get("media_group")
                animation = task.get("animation")
                document = task.get("document")
                media_type = task.get("media_type")
                target_channels = task.get("targets") or db.get_target_channels()
                target_univ_name = task.get("target_univ")
                user_id = task.get("user_id")

                # 1. كشف إعلانات المنافسين واستبدالها (فقط إذا كانت الميزة مفعلة صراحة من المشرف ومع التأكد الصارم)
                custom_ad = db.get_setting("custom_ad", "")
                ad_replacement_enabled = (db.get_setting("ad_replacement_enabled", "0") == "1")
                is_ad = False

                if ad_replacement_enabled and custom_ad and raw_text:
                    is_ad = any(kw in raw_text for kw in AD_KEYWORDS)

                if is_ad:
                    db.increment_setting("ad_replaced_count", 1)
                    for ch in target_channels:
                        if media_group:
                            res = self.send_media_group(ch, media_group, custom_ad)
                        elif video or media_type == "video":
                            res = self.send_video(ch, video, custom_ad)
                        elif photo or media_type == "photo":
                            res = self.send_photo(ch, photo, custom_ad)
                        else:
                            res = self.send_msg(ch, custom_ad)
                        db.record_channel_publish_result(ch, res.get("ok", False), res.get("description", ""))
                    logger.info(f"🎯 تم رصد إعلان تجاري منافس واستبداله ونشره في ({len(target_channels)}) قنوات!")
                    post_queue.task_done()
                    continue

                # 2. فحص الفلترة الصارمة للشأن الطلابي (إسقاط أي حشو سياسي أو اقتصادي خارجي)
                is_rel, rel_reason = is_relevant_student_news(raw_text, target_univ_name)
                if not is_rel and not has_media_item:
                    logger.info(f"🛡️ [فلترة الشأن الطلابي] تم استبعاد خبر غير طلابي أو حشو سياسي/اقتصادي ({rel_reason}): {(raw_text[:50] if raw_text else '')}...")
                    post_queue.task_done()
                    continue

                # 3. فحص نظام منع التكرار الذكي (Deduplication System خلال 24 ساعة)
                first_line = (raw_text.split("\n")[0] if raw_text else "")[:90]
                is_dup, past_story, score, reason = db.check_smart_duplicate(first_line, raw_text, target_univ=target_univ_name, hours=24)

                if is_dup and reason == "identical":
                    logger.info(f"🛡️ [منع التكرار الذكي] تم تخطي المنشور (تطابق {score*100:.1f}%) لوجود خبر مماثل نُشر خلال الـ 24 ساعة الماضية: {first_line[:40]}")
                    post_queue.task_done()
                    continue

                custom_instructions = db.get_setting("custom_instructions", "")

                # 4. دمج الأخبار المماثلة بالذكاء الاصطناعي (AI News Synthesis / Multi-Source Merging)
                if is_dup and reason == "similar_topic" and past_story:
                    logger.info(f"🔄 [الدمج الذكي بالذكاء الاصطناعي] تم رصد تفاصيل جديدة لنفس الفعالية المنشورة خلال 24 ساعة (تشابه {score*100:.1f}%). دمج المحتوى في منشور واحد شامل...")
                    merged_text = self.call_ai_merge_stories(past_story.get("clean_text", ""), raw_text, target_univ=target_univ_name)
                    rephrased = merged_text if merged_text else self.call_ai(raw_text, custom_instructions, target_univ=target_univ_name)
                else:
                    rephrased = self.call_ai(raw_text, custom_instructions, target_univ=target_univ_name)

                has_media_item = bool(photo or video or media_group or animation or document or media_type in ["photo", "video", "animation", "document"])

                # إذا تعذر الـ AI أو كان المنشور عبارة عن صورة/جدول بمفرده، نصيغ كابشن أخوي عفوي ولا نسقط الوسائط إطلاقاً
                if not rephrased:
                    if has_media_item or (raw_text and len(raw_text.strip()) > 3):
                        clean_t = self.clean_text_from_sources(raw_text).strip()
                        univ_tag = f"#{target_univ_name.replace(' ', '_')}" if target_univ_name else "#شؤون_الطلاب"
                        if clean_t:
                            rephrased = f"{clean_t}\n\nفالكم التوفيق والتساهيل يا ربعنا 🤲\n\n{univ_tag}"
                        else:
                            rephrased = f"📌 <b>مرفق أعلاه الجدول والتفاصيل المعتمدة كاملة لطلاب {target_univ_name or 'الجامعة'}</b>، يرجى مراجعته بدقة.\n\nدعواتنا لكم بالتوفيق دائماً 🤲\n\n{univ_tag}"
                    else:
                        logger.info(f"🛡️ تم تخطي منشور فارغ بدون أي نص أو وسائط.")
                        post_queue.task_done()
                        continue

                # 4. النشر في القنوات المستهدفة المخصصة واستخراج الروابط الرسمية النظيفة
                post_links = self.extract_external_links(rephrased, target_univ_name) or self.extract_external_links(raw_text, target_univ_name)
                post_kb = None
                if post_links:
                    post_kb = {
                        "inline_keyboard": [
                            [{"text": "🔗 فتح البوابة الإلكترونية الرسمية", "url": post_links[0]}]
                        ]
                    }

                success_targets = []
                failed_targets = []
                for ch in target_channels:
                    if media_group and len(media_group) > 1:
                        res = self.send_media_group(ch, media_group, rephrased, reply_markup=post_kb)
                    elif video or media_type == "video":
                        res = self.send_video(ch, video, rephrased, reply_markup=post_kb)
                    elif animation or media_type == "animation":
                        res = self.send_animation(ch, animation, rephrased, reply_markup=post_kb)
                    elif document or media_type == "document":
                        res = self.send_document(ch, document, rephrased, reply_markup=post_kb)
                    elif photo or media_type == "photo":
                        res = self.send_photo(ch, photo, rephrased, reply_markup=post_kb)
                    else:
                        res = self.send_msg(ch, rephrased, reply_markup=post_kb)

                    ok = res.get("ok", False)
                    desc = res.get("description", "")
                    db.record_channel_publish_result(ch, ok, desc)
                    if ok:
                        success_targets.append(ch)
                    else:
                        failed_targets.append((ch, desc))

                db.increment_setting("forwarded_count", 1)
                db.increment_setting("processed_count", 1)

                # 5. تسجيل الخبر في سجل الـ 24 ساعة للمقارنة ومنع التكرار والدمج القادم
                if success_targets:
                    story_title = (rephrased.split("\n")[0] if rephrased else first_line)[:100]
                    db.log_published_story(
                        post_id=str(int(time.time() * 1000)),
                        title=story_title,
                        clean_text=rephrased or raw_text,
                        target_channel=success_targets[0],
                        target_univ=target_univ_name
                    )

                # 6. النشر الصامت التام: لا تظهر أي رسائل في البوت إطلاقاً تلبية لطلب المشرف الصارم
                logger.info(f"✅ تم النشر المباشر بنجاح في القنوات: {', '.join(success_targets)}")
                if failed_targets:
                    logger.warning(f"⚠️ فشل النشر في بعض القنوات: {failed_targets}")

                post_queue.task_done()

            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"❌ خطأ أثناء معالجة مهمة في الطابور: {e}")

    # ----------------- البحث المباشر عبر الإنترنت واستجابة الاستفسارات الأكاديمية -----------------
    def search_web_live(self, query: str) -> List[Dict[str, str]]:
        """يبحث عبر الإنترنت في الأخبار والمواقع الأكاديمية والجامعية في الوقت الفعلي بدقة ومرونة فائقة"""
        clean_q = re.sub(r'^(ابحث عبر الانترنت|ابحث في الانترنت|ابحث عن|ابحث لي عن|ابحث|/search)\s*', '', query, flags=re.IGNORECASE).strip()
        clean_q = re.sub(r'^(اريد ان تبحث|أريد أن تبحث|اريد ان اعرف|أريد أن أعرف|هل تم اليوم|هل تم)\s*', '', clean_q, flags=re.IGNORECASE).strip()
        if not clean_q:
            clean_q = query.strip()

        # استخراج كلمات مفتاحية ذكية لتجنب فشل البحث بالعبارات الطويلة
        words = [w for w in clean_q.split() if w not in {'اريد', 'أريد', 'ان', 'أن', 'تبحث', 'هل', 'تم', 'اليوم', 'لي', 'عبر', 'الإنترنت', 'الانترنت', 'في', 'عن', 'من'}]
        candidate_queries = [
            clean_q,
            ' '.join(words),
            ' '.join([w for w in words if len(w) > 2][:4]),
            ' '.join([w for w in words if w.lower() in ['aum', 'ksu', 'hct', 'puc'] or any(k in w for k in ['جامع', 'إعان', 'مكاف', 'قبول', 'تسجيل'])])
        ]

        results = []
        seen_titles = set()
        seen_candidates = set()

        for cand in candidate_queries:
            cand = cand.strip()
            if not cand or cand in seen_candidates:
                continue
            seen_candidates.add(cand)
            encoded_q = urllib.parse.quote(cand)

            urls = [
                f"https://news.google.com/rss/search?q={encoded_q}&hl=ar&gl=KW&ceid=KW:ar",
                f"https://news.google.com/rss/search?q={encoded_q}&hl=ar&gl=SA&ceid=SA:ar"
            ]
            for url in urls:
                try:
                    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
                    with urllib.request.urlopen(req, context=ssl_ctx, timeout=7) as r:
                        root = ET.fromstring(r.read())
                        items = root.findall('.//item')
                        for it in items[:4]:
                            title = it.findtext("title") or ""
                            link = it.findtext("link") or ""
                            pub = it.findtext("pubDate") or ""
                            desc = it.findtext("description") or ""
                            clean_desc = re.sub(r'<[^>]+>', '', desc).strip()
                            if title and title not in seen_titles:
                                seen_titles.add(title)
                                results.append({
                                    "title": title,
                                    "link": link,
                                    "pub_date": pub,
                                    "snippet": clean_desc[:250]
                                })
                except Exception as e:
                    logger.debug(f"فحص محرك البحث لـ {url}: {e}")

            if len(results) >= 3:
                break

        return results

    def answer_search_or_chat_query(self, chat_id: int, user_query: str):
        """يجيب على أسئلة المشرف واستفسارات الطلاب بدقة مع دمج البحث الحي عبر الإنترنت"""
        self.send_msg(chat_id, "🔍 **جاري البحث الفوري عبر الإنترنت وتحليل البيانات بالذكاء الأكاديمي...**")

        search_results = self.search_web_live(user_query)
        web_context = ""
        if search_results:
            web_context = "\n\n🌐 نتائج البحث الحي المباشر من مصادر الإنترنت والأخبار:\n"
            for i, res in enumerate(search_results, 1):
                web_context += f"{i}. {res['title']} (التاريخ: {res['pub_date']})\n   {res['snippet']}\n   رابط المصدر: {res['link']}\n"

        system_prompt = f"""أنت مستشار وباحث أكاديمي وجامعي فائق الذكاء ومحرر محتوى متمكن.
تتحدث مع المشرف بحرية كاملة ودون أي قيود أو قوالب نمطية مصطنعة.
- إذا كان السؤال عن إعانة ومكافأة طلبة جامعة AUM (الكويت) أو الجامعات الخاصة: وضح أن المكافأة الاجتماعية (200 دينار كويتي شهرياً) تصرف عبر مجلس الجامعات الخاصة (PUC) ويتم إيداعها للبنوك عادة بين 20 إلى 26 من كل شهر ميلادي بعد اعتماد الكشوفات، ويمكن للطالب التأكد عبر تطبيق بنكه أو بوابة الطالب My AUM Portal أو التواصل مع شؤون الطلبة عبر هاتف 22260100.
- إذا كانت هناك روابط خارجية أو بوابات كليات ومعاهد، احتفظ بها واضحة ليتمكن الطلاب من النقر عليها وفتحها مباشرة.
- أسلوبك راقٍ، مباشر، عربي فصيح، بدون أي إيموجي رسومية تالفة، واستخدم النقاط المنظمة [•] أو [*].
{web_context}"""

        reply = self.call_ai(user_query, system_prompt=system_prompt)
        if not reply or len(reply) < 15:
            reply = f"بخصوص استفسارك عن: {user_query}\n\nتعتمد الأنظمة الجامعية الإعلانات الرسمية عبر بوابات الطلبة والتطبيقات المعتمدة."

        # حفظ الرد لتمكين النشر الفوري في القناة إذا رغب المشرف
        self.cached_forwarded_post[chat_id] = {
            "text": reply,
            "photo": None,
            "channel": db.get_target_channels()[0] if db.get_target_channels() else "@jhdhhdcj"
        }

        kb = {
            "inline_keyboard": [
                [{"text": "📢 نشر هذه الصياغة في قناتي (@jhdhhdcj)", "callback_data": "panel_test"}],
                [{"text": "💬 طرح سؤال جديد", "callback_data": "panel_cancel"}]
            ]
        }
        self.send_msg(chat_id, f"💡 **إجابة المساعد الأكاديمي الذكي (مدعومة بالبحث المباشر):**\n━━━━━━━━━━━━━━━━━━━\n\n{reply}", kb)

    # ----------------- مراقبة القنوات والمصادر (تليجرام + تويتر/X + RSS) -----------------
    def check_telegram_channel_scraper(self, src: Dict[str, Any], is_manual: bool = False, bound_univ: Optional[Dict[str, Any]] = None):
        channel_name = src.get("target", "").replace("@", "").replace("https://t.me/s/", "").replace("https://t.me/", "").strip()
        if not channel_name:
            return

        url = f"https://t.me/s/{channel_name}"
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept-Language": "ar,en-US;q=0.9,en;q=0.8"
            })
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=15) as resp:
                html = resp.read().decode("utf-8", errors="ignore")
                blocks = re.split(r'<div[^>]*class=[\'"][^\'"]*tgme_widget_message_wrap', html)
                if len(blocks) <= 1:
                    logger.warning(f"⚠️ تعذر سحب محتوى القناة {channel_name} عبر الويب (قد تكون القناة خاصة أو مقيدة).")
                    return

                posts_extracted = []
                for b in blocks[1:]:
                    post_id_m = re.search(r'data-post=[\'"]([^\'"]+)[\'"]', b)
                    if not post_id_m:
                        continue
                    pid = post_id_m.group(1)
                    raw_num_match = re.search(r'/(\d+)$', pid)
                    num_id = int(raw_num_match.group(1)) if raw_num_match else 0

                    photo_url = None
                    video_url = None
                    photos_found = []

                    # 1. استخراج الفيديو المباشر إن وجد في منشور القناة (مثل مقاطع الشرح أو خطوات التسجيل)
                    vid_m = re.search(r'<video[^>]+src=[\'"]?([^\'")\s]+)', b)
                    if vid_m:
                        v_src = vid_m.group(1).strip()
                        if not v_src.startswith("blob:"):
                            video_url = self.clean_media_url(v_src)
                    if not video_url:
                        vid_src_m = re.search(r'class=[\'"][^\'"]*tgme_widget_message_video[^\'"]*[\'"][^>]*src=[\'"]?([^\'")\s]+)', b)
                        if vid_src_m:
                            video_url = self.clean_media_url(vid_src_m.group(1))

                    # 2. استخراج كافة روابط خلفيات الصور المباشرة (بما في ذلك الألبومات والمجموعات)
                    all_bgs = re.findall(r'background-image:\s*url\([\'"]?([^\'")\s]+)', b)
                    for bg_raw in all_bgs:
                        clean_u = self.clean_media_url(bg_raw)
                        if clean_u and clean_u not in photos_found:
                            photos_found.append(clean_u)

                    # وسوم الصور <img>
                    if not photos_found:
                        img_matches = re.findall(r'<img[^>]+src=[\'"]?([^\'")\s]+)', b)
                        for im in img_matches:
                            clean_u = self.clean_media_url(im)
                            if clean_u and clean_u not in photos_found:
                                photos_found.append(clean_u)

                    if photos_found:
                        photo_url = photos_found[0]

                    media_group = None
                    if len(photos_found) > 1:
                        media_group = [{"type": "photo", "media": u} for u in photos_found]

                    text_m = re.search(r'class=[\'"][^\'"]*tgme_widget_message_text[^\'"]*[\'"][^>]*>(.*?)</div>', b, re.DOTALL)
                    text_content = ""
                    if text_m:
                        raw_h = text_m.group(1)
                        clean_h = re.sub(r'<br\s*/?>', '\n', raw_h)
                        text_content = re.sub(r'<[^>]+>', '', clean_h).strip()

                    if text_content or photo_url or video_url or media_group:
                        posts_extracted.append({
                            "id": pid,
                            "num_id": num_id,
                            "photo": photo_url,
                            "video": video_url,
                            "media_group": media_group,
                            "text": text_content
                        })

                if not posts_extracted:
                    return

                # ترتيب المنشورات تصاعدياً
                posts_extracted.sort(key=lambda x: x["num_id"])

                last_known = str(src.get("last_post_id") or "")
                last_known_num = 0
                if last_known:
                    num_match = re.search(r'(\d+)$', last_known)
                    if num_match:
                        last_known_num = int(num_match.group(1))

                # جلب الجامعة المعتمدة الافتراضية لضمان عدم ضياع أي خبر من المصدر
                all_univs = db.get_university_projects()
                active_univs = [u for u in all_univs if u.get("enabled", True)]
                default_target_ch = db.get_target_channels()[0] if db.get_target_channels() else "@jhdhhdcj"
                fallback_univ = active_univs[0] if active_univs else {"name": "أخبار الجامعة", "target_channel": default_target_ch}

                # إذا كانت أول مرة نسجل هذا المصدر: ننشر أحدث منشور متاح فوراً لتبدأ قناة الجامعة بالعمل مباشرة
                if not last_known or last_known_num == 0:
                    latest = posts_extracted[-1]
                    db.update_source_last_id(src.get("target"), latest["id"])
                    logger.info(f"📌 تمت تهيئة المصدر {src.get('target')} عند المنشور #{latest['id']}")
                    if latest.get("text") or latest.get("photo") or latest.get("video") or latest.get("media_group"):
                        p_hash = hashlib.md5((latest.get("text", "")[:80]).encode("utf-8")).hexdigest()
                        if not db.is_post_seen(latest["id"], p_hash):
                            matched_univ = bound_univ or db.find_university_for_post(src.get("target"), latest.get("text", "")) or fallback_univ
                            db.mark_post_seen(latest["id"], p_hash, src.get("target"))
                            logger.info(f"⚡️ [تهيئة فورية] نشر أحدث منشور من {src.get('target')} في قناة {matched_univ['target_channel']} ({matched_univ['name']})")
                            post_queue.put({
                                "type": "crawled_post",
                                "text": latest.get("text", ""),
                                "photo": latest.get("photo"),
                                "video": latest.get("video"),
                                "media_group": latest.get("media_group"),
                                "media_type": "video" if latest.get("video") else ("photo" if latest.get("photo") else "text"),
                                "targets": [matched_univ["target_channel"]],
                                "target_univ": matched_univ["name"],
                                "user_id": None
                            })
                    return

                # حلقة فحص ونشر كافة المنشورات الجديدة المتراكمة
                new_posts = [p for p in posts_extracted if p["num_id"] > last_known_num]
                for p in new_posts:
                    p_text = p.get("text", "")
                    p_photo = p.get("photo")
                    p_video = p.get("video")
                    p_media_group = p.get("media_group")
                    p_id = p["id"]

                    # استبعاد الإعلانات التجارية المنافسة والخدمات الطلابية فقط
                    is_ad = any(kw in p_text for kw in AD_KEYWORDS)
                    if is_ad:
                        logger.info(f"🛡️ استبعاد إعلان منافس/خدمات طلابية تجارية: {p_id}")
                        db.update_source_last_id(src.get("target"), p_id)
                        continue

                    # توجيه المنشور لقناة الجامعة دون اشتراط ذكر اسم الجامعة في النص
                    matched_univ = bound_univ or db.find_university_for_post(src.get("target"), p_text) or fallback_univ

                    p_hash = hashlib.md5((p_text[:80] + str(p_id)).encode("utf-8")).hexdigest()
                    if db.is_post_seen(p_id, p_hash):
                        continue

                    db.mark_post_seen(p_id, p_hash, src.get("target"))
                    db.update_source_last_id(src.get("target"), p_id)

                    media_label = 'ألبوم' if p_media_group else ('فيديو' if p_video else ('صورة' if p_photo else 'نص'))
                    logger.info(f"⚡️ منشور جديد تم التقاطه من {src.get('target')}: {p_id} موجه إلى {matched_univ['target_channel']} ({matched_univ['name']}) مع وسائط: {media_label}")
                    post_queue.put({
                        "type": "crawled_post",
                        "text": p_text,
                        "photo": p_photo,
                        "video": p_video,
                        "media_group": p_media_group,
                        "media_type": "video" if p_video else ("photo" if p_photo else "text"),
                        "targets": [matched_univ["target_channel"]],
                        "target_univ": matched_univ["name"],
                        "user_id": None
                    })

        except Exception as e:
            logger.debug(f"فحص القناة عبر Scraper {channel_name}: {e}")

    def extract_image_from_xml_item(self, it: ET.Element, desc: str = "") -> Optional[str]:
        """استخراج الصورة الحقيقية من عناصر XML وRSS بدقة"""
        try:
            # 1. فحص وسوم enclosure
            enclosure = it.find("enclosure")
            if enclosure is not None and enclosure.get("url"):
                url = enclosure.get("url", "").strip()
                enc_type = (enclosure.get("type") or "").lower()
                if "image" in enc_type or any(url.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp", ".avif"]):
                    return url

            # 2. فحص وسوم media:content و media:thumbnail
            for tag in [".//{http://search.yahoo.com/mrss/}content", ".//content", ".//{http://search.yahoo.com/mrss/}thumbnail", ".//thumbnail"]:
                m = it.find(tag)
                if m is not None and m.get("url"):
                    u = m.get("url", "").strip()
                    if u and "emoji" not in u and "icon" not in u:
                        return u

            # 3. فحص وسوم <img> داخل الوصف (description)
            if desc:
                img_m = re.search(r'<img[^>]+src=[\'"]([^\'"]+)[\'"]', desc, re.IGNORECASE)
                if img_m:
                    iu = img_m.group(1).strip()
                    if iu and "emoji" not in iu and "icon" not in iu and "transparent" not in iu:
                        if iu.startswith("//"):
                            return "https:" + iu
                        return iu
        except Exception:
            pass
        return None

    def check_twitter_feed(self, src: Dict[str, Any], is_manual: bool = False, bound_univ: Optional[Dict[str, Any]] = None):
        """يسحب التغريدات والأخبار من حسابات تويتر/X والمصادر التابعة مع استخراج الصور الحقيقية بدقة"""
        raw_target = src.get("target", "").replace("https://x.com/", "").replace("https://twitter.com/", "").strip()
        if not raw_target:
            return
        handle = raw_target.lstrip("@").split("/")[0].strip()

        matched_univ = bound_univ or db.find_university_for_post(handle, "") or db.find_university_for_post(f"@{handle}", "")
        univ_name = matched_univ["name"] if matched_univ else handle
        target_ch = matched_univ["target_channel"] if matched_univ else (db.get_target_channels()[0] if db.get_target_channels() else "@jhdhhdcj")

        # الاستراتيجية 1: فحص وجود قناة تيليجرام مطابقة للمعرف (حيث تنشر معظم الجامعات تغريداتها مباشرة مع الصور)
        try:
            tg_url = f"https://t.me/s/{handle}"
            req = urllib.request.Request(tg_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=8) as r:
                html = r.read().decode("utf-8", errors="ignore")
                blocks = re.split(r'<div[^>]*class=[\'"][^\'"]*tgme_widget_message_wrap', html)
                if len(blocks) > 1:
                    last_block = blocks[-1]
                    post_id_m = re.search(r'data-post=[\'"]([^\'"]+)[\'"]', last_block)
                    if post_id_m:
                        pid = post_id_m.group(1)
                        last_known = str(src.get("last_post_id") or "")
                        if pid != last_known:
                            text_m = re.search(r'class=[\'"][^\'"]*tgme_widget_message_text[^\'"]*[\'"][^>]*>(.*?)</div>', last_block, re.DOTALL)
                            clean_text = ""
                            if text_m:
                                clean_text = re.sub(r'<[^>]+>', '', re.sub(r'<br\s*/?>', '\n', text_m.group(1))).strip()

                            photo_url = None
                            bg_m = re.search(r'background-image:\s*url\([\'"]?([^\'")\s]+)[\'"]?\)', last_block)
                            if bg_m:
                                photo_url = bg_m.group(1).strip()
                            if not photo_url:
                                img_m = re.search(r'<img[^>]+src=[\'"]([^\'"]+)[\'"]', last_block)
                                if img_m:
                                    photo_url = img_m.group(1).strip()

                            if photo_url and photo_url.startswith("//"):
                                photo_url = "https:" + photo_url

                            p_hash = hashlib.md5((clean_text[:80]).encode("utf-8")).hexdigest()
                            if (clean_text or photo_url) and not db.is_post_seen(pid, p_hash):
                                db.update_source_last_id(src.get("target"), pid)
                                db.mark_post_seen(pid, p_hash, src.get("target"))
                                logger.info(f"⚡️ [Twitter/X Mirror] التقاط منشور وتغريدات من @{handle} موجه لـ {univ_name}")
                                post_queue.put({
                                    "type": "twitter_post",
                                    "text": clean_text,
                                    "photo": photo_url,
                                    "targets": [target_ch],
                                    "target_univ": univ_name,
                                    "user_id": None
                                })
                                return
        except Exception:
            pass

        # الاستراتيجية 2: استعلام الأخبار الرسمية وإعلانات الحساب عبر محرك الأخبار الذكي
        try:
            q = urllib.parse.quote(f'"{handle}" OR "{univ_name}" ("تويتر" OR "أعلنت" OR "مواعيد" OR "قبول" OR "تسجيل" OR "حساب")')
            url = f"https://news.google.com/rss/search?q={q}&hl=ar&gl=SA&ceid=SA:ar"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=12) as resp:
                root = ET.fromstring(resp.read())
                items = root.findall(".//item")
                if not items:
                    return

                for it in items[:6]:
                    t = it.findtext("title") or ""
                    l = it.findtext("link") or ""
                    d = it.findtext("description") or ""

                    clean_title = re.sub(r'\s*-\s*[^-]+$', '', t).strip()
                    clean_desc = re.sub(r'<[^>]+>', '', d).strip()
                    full_text = f"{clean_title}\n{clean_desc}".strip()
                    photo_url = self.extract_image_from_xml_item(it, d)

                    # استبعاد الإعلانات التجارية والممولة والخدمات المدفوعة فقط
                    if any(kw in full_text for kw in AD_KEYWORDS):
                        logger.info(f"🛡️ استبعاد إعلان منافس/خدمات طلابية من أخبار تويتر: {clean_title[:40]}")
                        continue

                    # فلترة الشأن الطلابي والجامعي الحقيقي (استبعاد السياسة والاقتصاد العام)
                    is_rel, rel_reason = is_relevant_student_news(full_text, univ_name)
                    if not is_rel:
                        logger.info(f"🛡️ [فلترة تويتر] تم استبعاد خبر غير طلابي ({rel_reason}): {clean_title[:40]}")
                        continue

                    # منع التكرار الصارم
                    norm_t = re.sub(r'[^\w\s]', '', clean_title)
                    norm_t = re.sub(r'\s+', ' ', norm_t).strip().lower()
                    story_hash = f"tw_{hashlib.sha256(norm_t.encode('utf-8')).hexdigest()[:24]}"

                    if db.is_post_seen(story_hash, story_hash):
                        continue

                    db.mark_post_seen(story_hash, story_hash, src.get("target"))
                    db.update_source_last_id(src.get("target"), story_hash)

                    logger.info(f"⚡️ [Twitter/X News] خبر جديد لـ @{handle} ({univ_name}) موجه إلى {target_ch} (صورة: {'نعم' if photo_url else 'لا'})")
                    post_queue.put({
                        "type": "twitter_post",
                        "text": f"{full_text}\n\n{l}",
                        "photo": photo_url,
                        "targets": [target_ch],
                        "target_univ": univ_name,
                        "user_id": None
                    })

                    if not is_manual:
                        break
        except Exception as e:
            logger.debug(f"خطأ في سحب تويتر/X للحساب {handle}: {e}")

    def check_rss_feed(self, src: Dict[str, Any], is_manual: bool = False):
        """يسحب الأخبار من روابط RSS مع استخراج الصور المرفقة الحقيقية"""
        url = src.get("target", "")
        if not url.startswith("http"):
            return
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=12) as resp:
                xml_data = resp.read()
                root = ET.fromstring(xml_data)
                items = root.findall(".//item")
                if not items:
                    return

                last_known = str(src.get("last_post_id") or "")
                new_items = []
                for it in items:
                    t = it.findtext("title") or ""
                    l = it.findtext("link") or ""
                    d = it.findtext("description") or ""
                    photo_url = self.extract_image_from_xml_item(it, d)
                    pid = l or t
                    if pid == last_known:
                        break
                    new_items.append((pid, t, d, photo_url))

                if new_items:
                    db.update_source_last_id(src.get("target"), new_items[0][0])
                    if not last_known and is_manual:
                        pid, t, d, photo_url = new_items[0]
                        clean_d = re.sub(r'<[^>]+>', '', d).strip()
                        full_txt = f"{t}\n{clean_d}"
                        matched_univ = db.find_university_for_post(url, full_txt)
                        if matched_univ:
                            p_hash = hashlib.md5(full_txt[:80].encode("utf-8")).hexdigest()
                            if not db.is_post_seen(pid, p_hash):
                                db.mark_post_seen(pid, p_hash, src.get("target"))
                                post_queue.put({
                                    "type": "rss_post",
                                    "text": full_txt,
                                    "photo": photo_url,
                                    "targets": [matched_univ["target_channel"]],
                                    "target_univ": matched_univ["name"],
                                    "user_id": ADMIN_ID
                                })
                        return

                    for pid, t, d, photo_url in reversed(new_items):
                        clean_d = re.sub(r'<[^>]+>', '', d).strip()
                        full_txt = f"{t}\n{clean_d}"
                        matched_univ = db.find_university_for_post(url, full_txt)
                        if not matched_univ:
                            continue
                        p_hash = hashlib.md5(full_txt[:80].encode("utf-8")).hexdigest()
                        if not db.is_post_seen(pid, p_hash):
                            db.mark_post_seen(pid, p_hash, src.get("target"))
                            post_queue.put({
                                "type": "rss_post",
                                "text": full_txt,
                                "photo": photo_url,
                                "targets": [matched_univ["target_channel"]],
                                "target_univ": matched_univ["name"],
                                "user_id": ADMIN_ID
                            })
        except Exception as e:
            logger.debug(f"فحص RSS {url}: {e}")

    def check_google_news_for_universities(self, is_manual: bool = False):
        """يبحث في أخبار جوجل الرسمية لكل جامعة على حدة وينشرها في قناة تلك الجامعة حصراً"""
        univs = db.get_university_projects()
        logger.info(f"🌐 [Google News] فحص أخبار جوجل الأكاديمية لـ ({len(univs)}) جامعة...")
        for univ in univs:
            if not univ.get("enabled") or not univ.get("google_news_enabled"):
                continue

            q = univ.get("google_news_query") or univ.get("name")
            target_ch = univ.get("target_channel")
            if not q or not target_ch:
                continue

            try:
                clean_q = re.sub(r'[\'"]', '', q).strip()
                encoded_q = urllib.parse.quote(clean_q)
                url = f"https://news.google.com/rss/search?q={encoded_q}&hl=ar&gl=SA&ceid=SA:ar"
                req = urllib.request.Request(url, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                })
                with urllib.request.urlopen(req, context=ssl_ctx, timeout=12) as resp:
                    root = ET.fromstring(resp.read())
                    items = root.findall(".//item")
                    if not items:
                        continue

                    # فحص أحدث 5 أخبار
                    for it in items[:5]:
                        title = it.findtext("title") or ""
                        link = it.findtext("link") or ""
                        desc = it.findtext("description") or ""

                        # تنظيف العنوان والمصدر من تذييلات جوجل
                        clean_title = re.sub(r'\s*-\s*[^-]+$', '', title).strip()
                        clean_desc = re.sub(r'<[^>]+>', '', desc).strip()
                        full_text = f"{clean_title}\n{clean_desc}".strip()
                        photo_url = self.extract_image_from_xml_item(it, desc)

                        # فلترة الأخبار والتأكد من صلتها المباشرة بالشأن الطلابي للجامعة
                        is_rel, rel_reason = is_relevant_student_news(full_text, univ.get("name"))
                        if not is_rel:
                            logger.info(f"🛡️ [فلترة أخبار جوجل] استبعاد خبر غير طلابي لـ {univ['name']} ({rel_reason}): {clean_title[:40]}")
                            continue

                        # منع التكرار الصارم عبر تجزئة الكلمات الجوهرية للعنوان
                        norm_clean = re.sub(r'[^\w\s]', '', clean_title)
                        norm_clean = re.sub(r'\s+', ' ', norm_clean).strip().lower()
                        story_hash = f"gnews_{hashlib.sha256(norm_clean.encode('utf-8')).hexdigest()[:24]}"

                        if db.is_post_seen(story_hash, story_hash):
                            continue

                        db.mark_post_seen(story_hash, story_hash, f"gnews_{univ['id']}")
                        logger.info(f"⚡️ [Google News] خبر جديد لـ {univ['name']} موجه حصراً إلى {target_ch} (صورة: {'نعم' if photo_url else 'لا'})")

                        clean_link = clean_and_resolve_url(link, univ.get("name"))
                        news_body = f"{full_text}\n\n{clean_link}" if clean_link else full_text

                        post_queue.put({
                            "type": "google_news_post",
                            "text": news_body,
                            "photo": photo_url,
                            "targets": [target_ch],
                            "target_univ": univ["name"],
                            "user_id": None
                        })

                        if not is_manual:
                            # في الفحص الدوري نكتفي بخبر واحد في الدورة لكل جامعة لعدم إغراق القناة
                            break

            except Exception as e:
                logger.debug(f"خطأ في سحب أخبار جوجل لـ {univ.get('name')}: {e}")

    def monitor_sources_loop(self):
        logger.info("📡 تشغيل دورة مراقبة المصادر التلقائية لكافة مشاريع الجامعات ومصادرها المخصصة...")
        loop_counter = 0
        while self.running:
            try:
                time.sleep(45)
                if db.get_setting("is_paused", "0") == "1":
                    continue

                # 1. فحص مصادر كل جامعة على حدة والتوجيه الحصري لقناتها المستهدفة
                active_univs = db.get_university_projects()
                for univ in active_univs:
                    if not univ.get("enabled", True):
                        continue

                    # فحص قنوات تيليجرام التابعة للجامعة
                    for tg_src in univ.get("telegram_sources", []):
                        if tg_src and tg_src.strip():
                            self.check_telegram_channel_scraper(
                                {"target": tg_src.strip(), "type": "telegram"},
                                is_manual=False,
                                bound_univ=univ
                            )

                    # فحص حسابات تويتر/X التابعة للجامعة
                    for tw_src in univ.get("twitter_sources", []):
                        if tw_src and tw_src.strip():
                            self.check_twitter_feed(
                                {"target": tw_src.strip(), "type": "twitter"},
                                is_manual=False,
                                bound_univ=univ
                            )

                # 2. فحص بقية المصادر المسجلة في جدول sources
                general_sources = db.get_sources()
                for s in general_sources:
                    s_type = s.get("type")
                    if s_type == "telegram":
                        self.check_telegram_channel_scraper(s, is_manual=False)
                    elif s_type == "rss":
                        self.check_rss_feed(s)
                    elif s_type in ["twitter", "x"]:
                        self.check_twitter_feed(s, is_manual=False)

                loop_counter += 1
                # كل 3 دقائق نفحص أخبار جوجل الأكاديمية لكل الجامعات
                if loop_counter % 4 == 0:
                    self.check_google_news_for_universities(is_manual=False)

            except Exception as e:
                logger.error(f"خطأ في دورة مراقبة المصادر: {e}")

    # ----------------- مراقبة MTProto عبر Telethon -----------------
    def start_telethon_userbot(self):
        if not TELETHON_AVAILABLE:
            logger.info("ℹ️ مكتبة Telethon غير مفعلة، يعمل البوت بنمط Bot API و Scraper المحسن.")
            return

        session_str = STRING_SESSION or db.get_setting("session_string", "")
        if not session_str:
            logger.info("ℹ️ لم يتم توفير StringSession لليوزربوت بعد. استخدم /login_mtproto لتسجيل الحساب.")
            return

        async def run_client():
            try:
                logger.info("🔐 جاري الاتصال بحساب اليوزربوت عبر MTProto Telethon...")
                client = TelegramClient(StringSession(session_str), TELEGRAM_API_ID, TELEGRAM_API_HASH)
                await client.start()
                self.telethon_client = client
                logger.info("✅ تم ربط وتشغيل اليوزربوت MTProto بنجاح لسحب القنوات العامة والخاصة!")

                @client.on(events.NewMessage)
                async def handle_new_channel_message(event):
                    try:
                        if not event.chat:
                            return
                        chat_username = f"@{event.chat.username}" if getattr(event.chat, "username", None) else str(event.chat_id)
                        sources = [s.get("target") for s in db.get_sources()]

                        # هل الرسالة من قناة مخصصة للمراقبة؟
                        if chat_username in sources or any(s in str(event.chat_id) for s in sources):
                            text = event.text or event.message.message or ""
                            has_media_evt = bool(event.photo or event.video or event.document or event.gif)

                            if len(text.strip()) < 3 and not has_media_evt:
                                return

                            # استبعاد الإعلانات التجارية والخدمات الطلابية
                            if any(kw in text for kw in AD_KEYWORDS):
                                logger.info(f"🛡️ [عزل MTProto] استبعاد إعلان منافس/خدمات طلابية من {chat_username}")
                                return

                            media_path = None
                            media_type = "text"
                            os.makedirs("/temp_media", exist_ok=True)

                            if event.video:
                                media_type = "video"
                                media_path = await event.download_media(file=f"/temp_media/vid_{event.id}.mp4")
                            elif event.photo:
                                media_type = "photo"
                                media_path = await event.download_media(file=f"/temp_media/img_{event.id}.jpg")
                            elif event.gif:
                                media_type = "animation"
                                media_path = await event.download_media(file=f"/temp_media/anim_{event.id}.mp4")
                            elif event.document:
                                media_type = "document"
                                media_path = await event.download_media(file="/temp_media/")

                            # توجيه الخبر دون اشتراط ذكر اسم الجامعة في النص
                            all_univs = db.get_university_projects()
                            active_univs = [u for u in all_univs if u.get("enabled", True)]
                            default_target = db.get_target_channels()[0] if db.get_target_channels() else "@jhdhhdcj"
                            fallback_univ = active_univs[0] if active_univs else {"name": "أخبار الجامعة", "target_channel": default_target}

                            matched_univ = db.find_university_for_post(chat_username, text) or fallback_univ

                            logger.info(f"📥 [MTProto] تم سحب منشور جديد من {chat_username} موجه إلى {matched_univ['target_channel']} ({matched_univ['name']}) مع وسائط: {media_type}")
                            post_queue.put({
                                "type": "mtproto_post",
                                "text": text,
                                "photo": media_path if media_type == "photo" else None,
                                "video": media_path if media_type == "video" else None,
                                "animation": media_path if media_type == "animation" else None,
                                "document": media_path if media_type == "document" else None,
                                "media_type": media_type,
                                "targets": [matched_univ["target_channel"]],
                                "target_univ": matched_univ["name"],
                                "user_id": ADMIN_ID
                            })
                    except Exception as err:
                        logger.error(f"خطأ معالجة حدث MTProto: {err}")

                await client.run_until_disconnected()
            except Exception as ex:
                logger.warning(f"ملاحظة في تشغيل عميل Telethon MTProto: {ex}")

        def telethon_thread_runner():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            self.telethon_loop = loop
            loop.run_until_complete(run_client())

        threading.Thread(target=telethon_thread_runner, daemon=True).start()

    # ----------------- الفحص الدوري لصلاحيات القنوات المعتمدة -----------------
    def health_check_channels_loop(self):
        """يفحص صلاحيات المشرف في القنوات كل 30 دقيقة وينبه المشرف إن انقطعت الصلاحية"""
        logger.info("🛡️ تشغيل الفاحص الدوري لصلاحيات القنوات (كل 30 دقيقة)...")
        while self.running:
            try:
                time.sleep(1800)  # 30 دقيقة
                channels = db.get_target_channels()
                lost_permissions = []

                for ch in channels:
                    check = self.tg_request("getChatAdministrators", {"chat_id": ch})
                    if not check.get("ok"):
                        err_desc = check.get("description", "تعذر التحقق")
                        db.update_channel_health(ch, "error_permission", err_desc)
                        lost_permissions.append((ch, err_desc))
                    else:
                        db.update_channel_health(ch, "active", "الصلاحيات مفعلة بنجاح")

                if lost_permissions:
                    alert_text = "🚨 **تنبيه عاجل من فاحص الصلاحيات الدوري!**\n"
                    alert_text += "انقطعت صلاحيات البوت في القنوات التالية:\n\n"
                    for ch, err in lost_permissions:
                        alert_text += f"• `{ch}`: {err}\n"
                    alert_text += "\n👉 يرجى الدخول للقناة والتأكد من وجود البوت كمشرف مع صلاحية نشر الرسائل."
                    self.send_msg(ADMIN_ID, alert_text)

            except Exception as e:
                logger.error(f"خطأ في فحص صلاحيات القنوات: {e}")

    # ----------------- معالجة المنشورات المجدولة -----------------
    def scheduled_posts_loop(self):
        logger.info("⏱️ تشغيل مراقب المنشورات المجدولة...")
        while self.running:
            try:
                time.sleep(30)
                due_posts = db.get_due_scheduled_posts()
                for p in due_posts:
                    db.mark_scheduled_post_status(p["id"], "processing")
                    post_queue.put({
                        "type": "scheduled_post",
                        "text": p["raw_text"],
                        "photo": p.get("photo_url"),
                        "targets": [p["target_channel"]] if p.get("target_channel") else db.get_target_channels(),
                        "user_id": p.get("user_id")
                    })
                    db.mark_scheduled_post_status(p["id"], "published")
            except Exception as e:
                logger.error(f"خطأ في نشر المنشورات المجدولة: {e}")

    def reply_to_channel_comment(self, chat_id: int, message_id: int, student_question: str, orig_post_text: str):
        """يرد على استفسارات الطلاب في تعليقات القناة بذكاء ولغة أكاديمية واضحة ومباشرة"""
        try:
            ai_reply = self.call_ai_for_comment(student_question, orig_post_text)
            if not ai_reply:
                ai_reply = "أهلاً بك عزيزي الطالب 🎓\nنشكر تواصلك، بخصوص استفسارك يرجى مراجعة التفاصيل والمواعيد الموضحة في المنشور أعلاه أو زيارة البوابة الرسمية للجامعة للاطلاع على الدليل الأكاديمي المحدث."
            self.send_msg(chat_id, ai_reply, reply_to_message_id=message_id)
        except Exception as e:
            logger.debug(f"خطأ في الرد على تعليق القناة: {e}")

    # ----------------- معالجة رسائل وأوامر المستخدمين -----------------
    def handle_message(self, msg: Dict[str, Any]):
        chat_id = msg["chat"]["id"]
        from_user = msg.get("from", {})
        text = msg.get("text", "") or msg.get("caption", "")

        # فحص التعليقات والاستفسارات في القناة أو مجموعة المناقشة المرتبطة بها (Channel Comments)
        chat_type = msg.get("chat", {}).get("type", "private")
        reply_to = msg.get("reply_to_message")
        if chat_type in ["group", "supergroup"]:
            # إذا كانت الرسالة من طالب/مستخدم وليست من بوت أو القناة ذاتها
            if not from_user.get("is_bot") and not msg.get("sender_chat"):
                clean_comment = text.strip()
                if clean_comment and len(clean_comment) >= 2:
                    if reply_to:
                        orig_post_text = reply_to.get("text", "") or reply_to.get("caption", "")
                        threading.Thread(
                            target=self.reply_to_channel_comment,
                            args=(chat_id, msg["message_id"], clean_comment, orig_post_text),
                            daemon=True
                        ).start()
                        return
                    elif any(q_word in clean_comment for q_word in ["متى", "كيف", "أين", "هل", "شروط", "رابط", "تقديم", "تسجيل", "قبول", "اختبار", "جامعة", "موعد", "مواعيد", "استفسار"]):
                        threading.Thread(
                            target=self.reply_to_channel_comment,
                            args=(chat_id, msg["message_id"], clean_comment, ""),
                            daemon=True
                        ).start()
                        return

        authorized, user_data = self.check_user_access(from_user)
        if not authorized:
            self.send_msg(chat_id, "⛔️ عذراً، تم حظر حسابك من استخدام هذا النظام بأمر المشرف.")
            return

        # 1. معالجة مشاركة رقم الهاتف (Contact Registration)
        contact = msg.get("contact")
        if contact:
            contact_user_id = contact.get("user_id")
            phone = contact.get("phone_number", "")
            if contact_user_id and contact_user_id != from_user.get("id"):
                self.send_msg(chat_id, "⚠️ **خطأ أمني**: يرجى مشاركة رقم هاتفك الحقيقي المسجل في حسابك عبر زر المشاركة الرسمي فقط.")
                return

            db.set_user_phone(chat_id, phone)
            success_msg = f"""🎉 **تم توثيق وربط رقم هاتفك بنجاح!**
📱 الرقم المعتمد: `{phone}`
🆔 المعرف: `{chat_id}`
👤 الاسم: {from_user.get('first_name', '')}

✅ تم فتح كافة صلاحيات البوت وحفظ حسابك بشكل دائم في قاعدة البيانات."""
            self.send_msg(chat_id, success_msg, self.get_main_reply_keyboard(user_data.get("role", "user")))
            return

        # 2. استخراج الميديا الشاملة (فيديوهات الشروحات، الصور، الرسوم المتحركة، المستندات وأدلة القبول)
        photo_id = None
        video_id = None
        animation_id = None
        document_id = None
        media_type = "text"

        if "photo" in msg and isinstance(msg["photo"], list) and len(msg["photo"]) > 0:
            photo_id = msg["photo"][-1]["file_id"]
            media_type = "photo"
        elif "video" in msg and isinstance(msg["video"], dict):
            video_id = msg["video"].get("file_id")
            media_type = "video"
        elif "animation" in msg and isinstance(msg["animation"], dict):
            animation_id = msg["animation"].get("file_id")
            media_type = "animation"
        elif "document" in msg and isinstance(msg["document"], dict):
            doc = msg["document"]
            mime = (doc.get("mime_type") or "").lower()
            if mime.startswith("video/"):
                video_id = doc.get("file_id")
                media_type = "video"
            elif mime.startswith("image/"):
                photo_id = doc.get("file_id")
                media_type = "photo"
            else:
                document_id = doc.get("file_id")
                media_type = "document"

        has_media = bool(photo_id or video_id or animation_id or document_id)

        # 3. النشر المباشر عند توجيه رسالة أو منشور من قناة دون أن يظهر في البوت
        fwd_chat = msg.get("forward_from_chat")
        if not fwd_chat and "forward_origin" in msg and isinstance(msg["forward_origin"], dict):
            if msg["forward_origin"].get("type") == "channel":
                fwd_chat = msg["forward_origin"].get("chat")

        if fwd_chat or msg.get("forward_date"):
            clean_fwd_text = text.strip()
            univs = db.get_university_projects()
            target_univ = None
            target_channels = None

            fwd_username = ("@" + fwd_chat.get("username").lower()) if (isinstance(fwd_chat, dict) and fwd_chat.get("username")) else ""
            fwd_title = (fwd_chat.get("title") or "").lower() if isinstance(fwd_chat, dict) else ""

            for u in univs:
                if not u.get("enabled", True):
                    continue
                # 1. مطابقة بمعرف القناة المصدر المسجلة ضمن الجامعة
                u_tgs = [s.lower().replace("@", "") for s in u.get("telegram_sources", [])]
                if fwd_username and (fwd_username.replace("@", "") in u_tgs):
                    target_univ = u["name"]
                    target_channels = [u["target_channel"]]
                    break
                # 2. مطابقة بعنوان القناة المصدر المسجل
                if fwd_title and (u["name"].lower() in fwd_title or fwd_title in u["name"].lower()):
                    target_univ = u["name"]
                    target_channels = [u["target_channel"]]
                    break
                # 3. مطابقة بنص المنشور
                if clean_fwd_text and u["name"].lower() in clean_fwd_text.lower():
                    target_univ = u["name"]
                    target_channels = [u["target_channel"]]
                    break

            if not target_channels:
                target_channels = db.get_target_channels()
            if not target_channels:
                target_channels = ["@jhdhhdcj"]

            post_queue.put({
                "type": "direct_post",
                "text": clean_fwd_text,
                "photo": photo_id,
                "video": video_id,
                "animation": animation_id,
                "document": document_id,
                "media_type": media_type,
                "targets": target_channels,
                "target_univ": target_univ,
                "user_id": None
            })
            media_desc = "فيديو" if video_id else ("صورة" if photo_id else ("مستند" if document_id else "نص"))
            logger.info(f"⚡ [نشر مباشر صامت] تم استلام منشور موجه ({media_desc}) وإرساله حصراً للقناة: {target_channels[0]} (الجامعة: {target_univ or 'عامة'})")
            return

        clean_text = text.strip()

        # معالجة الحالات المعلقة
        if chat_id in self.user_waiting_state:
            state = self.user_waiting_state.get(chat_id)

            if clean_text in ["/cancel", "إلغاء", "رجوع"]:
                self.user_waiting_state.pop(chat_id, None)
                self.univ_wizard_data.pop(chat_id, None)
                self.send_msg(chat_id, "تم إلغاء العملية والعودة للقائمة الرئيسية ✅", self.get_main_reply_keyboard(user_data.get("role", "user")))
                return

            if state == "waiting_for_new_source":
                self.user_waiting_state.pop(chat_id, None)
                self.process_add_source(chat_id, clean_text)
                return
            elif state == "waiting_for_target_channel":
                self.user_waiting_state.pop(chat_id, None)
                self.process_add_target(chat_id, clean_text)
                return
            elif state == "waiting_for_instant_post":
                self.user_waiting_state.pop(chat_id, None)
                univs = db.get_university_projects()
                first_target = [univs[0]["target_channel"]] if univs else db.get_target_channels()
                first_name = univs[0]["name"] if univs else None
                post_queue.put({
                    "type": "direct_post",
                    "text": clean_text,
                    "photo": photo_id,
                    "video": video_id,
                    "animation": animation_id,
                    "document": document_id,
                    "media_type": media_type,
                    "targets": first_target,
                    "target_univ": first_name,
                    "user_id": None
                })
                media_desc = "فيديو" if video_id else ("صورة" if photo_id else ("مستند" if document_id else "نص"))
                logger.info(f"⚡ [نشر صامت] تم استلام منشور فوري ({media_desc}) وتوجيهه للقناة: {first_target[0] if first_target else 'none'}")
                return
            elif state == "waiting_univ_target":
                self.process_univ_step1_target(chat_id, clean_text)
                return
            elif state == "waiting_univ_name":
                self.process_univ_step2_name(chat_id, clean_text)
                return
            elif state == "waiting_univ_tg":
                self.process_univ_step3_tg(chat_id, clean_text)
                return
            elif state == "waiting_univ_tw":
                self.process_univ_step4_tw(chat_id, clean_text)
                return
            elif state == "waiting_univ_gnews":
                self.process_univ_step5_gnews(chat_id, clean_text)
                return
            elif state.startswith("waiting_univ_post_"):
                target_uid = state.replace("waiting_univ_post_", "")
                self.user_waiting_state.pop(chat_id, None)
                target_univ = db.get_university_by_id(target_uid)
                target_ch = [target_univ["target_channel"]] if target_univ else db.get_target_channels()
                target_name = target_univ["name"] if target_univ else None
                post_queue.put({
                    "type": "direct_post",
                    "text": clean_text,
                    "photo": photo_id,
                    "video": video_id,
                    "animation": animation_id,
                    "document": document_id,
                    "media_type": media_type,
                    "targets": target_ch,
                    "target_univ": target_name,
                    "user_id": None
                })
                media_desc = "فيديو" if video_id else ("صورة" if photo_id else ("مستند" if document_id else "نص"))
                logger.info(f"⚡ [نشر صامت] تم استلام منشور مخصص لـ {target_name} ({media_desc}) وتوجيهه للقناة: {target_ch[0]}")
                return
            elif state == "waiting_for_custom_ad":
                self.user_waiting_state.pop(chat_id, None)
                db.set_setting("custom_ad", clean_text)
                self.send_msg(chat_id, "✅ **تم تحديث وحفظ نص إعلانك البديل بنجاح!**")
                self.show_ad_panel(chat_id)
                return

        # ----------------- الأوامر المباشرة -----------------
        if clean_text in ["🎯 إعلان خدماتي البديل", "/ad", "الإعلان", "/advertisement"]:
            self.show_ad_panel(chat_id)
            return

        if clean_text in ["/start", "/help", "🎛 لوحة التحكم الرئيسية", "🔙 إلغاء والعودة للرئيسية"]:
            self.show_welcome_panel(chat_id, user_data)
            return

        if clean_text in ["🏛️ إدارة الجامعات وقنوات النشر", "/universities", "/univ", "الجامعات"]:
            self.show_universities_panel(chat_id)
            return

        if clean_text in ["➕ إضافة جامعة وقناة نشر", "/add_university", "/new_univ"]:
            self.start_add_university_wizard(chat_id)
            return

        if clean_text in ["🌐 بحث أخبار جوجل للجامعة", "/google_news", "أخبار جوجل"]:
            self.trigger_google_news_search(chat_id)
            return

        if clean_text.startswith("/google_news "):
            custom_q = clean_text.replace("/google_news ", "").strip()
            self.trigger_google_news_search(chat_id, custom_q)
            return

        if clean_text.startswith("/del_university"):
            uid = clean_text.replace("/del_university", "").strip()
            if uid:
                db.delete_university_project(uid)
                self.send_msg(chat_id, f"🗑️ تم حذف مشروع الجامعة `{uid}` بنجاح!")
            self.show_universities_panel(chat_id)
            return

        if clean_text in ["/register", "📱 ربط رقم هاتفي (تحقق)"]:
            reg_text = """📱 **نظام توثيق الحساب بالهاتف (Official Telegram Verification):**
            
اضغط على الزر الكبير أدناه لمشاركة رقم هاتفك المعتمد في تيليجرام.
يقوم تيليجرام بإرسال رقمك مشفراً وموثقاً لحفظ حسابك واشتراكك بشكل دائم."""
            self.send_msg(chat_id, reg_text, self.get_contact_request_keyboard())
            return

        if clean_text in ["/my_account", "👤 حسابي والاشتراك"]:
            self.show_account_panel(chat_id, user_data)
            return

        if clean_text in ["📢 قنوات النشر المعتمدة", "قنوات النشر"]:
            self.show_channels_panel(chat_id)
            return

        if clean_text in ["➕ إضافة مصدر للمراقبة", "إضافة مصدر", "/add_source"]:
            self.user_waiting_state[chat_id] = "waiting_for_new_source"
            self.send_msg(chat_id, "📥 أرسل الآن رابط أو معرّف القناة أو رابط RSS المطلوب مراقبتها (مثال: `@KSU_News` أو رابط موقع):")
            return

        if clean_text in ["🔄 فحص وسحب المصادر الآن", "🔄 فحص وسحب أخبار الجامعات", "/crawl_sources", "/crawl"]:
            self.trigger_manual_crawl(chat_id)
            return

        if clean_text in ["📝 صياغة ونشر خبر فوري", "/new_post"]:
            self.user_waiting_state[chat_id] = "waiting_for_instant_post"
            self.send_msg(chat_id, "📝 أرسل الآن نص الخبر أو الصورة/الفيديو لنشرها فوراً في القنوات المعتمدة:")
            return

        if clean_text in ["🧪 تجربة الصياغة الفورية", "/test"]:
            self.run_demo_rephrase(chat_id)
            return

        # أوامر الإدارة المشرفة
        if self.is_admin(chat_id):
            if clean_text in ["👥 إدارة المستخدمين", "/users"]:
                self.show_users_admin_panel(chat_id)
                return

            if clean_text.startswith("/ban "):
                target_uid = safe_int(clean_text.replace("/ban ", "").strip(), 0)
                if target_uid > 0:
                    db.ban_user(target_uid, True)
                    self.send_msg(chat_id, f"✅ تم حظر المستخدم `{target_uid}` بنجاح.")
                else:
                    self.send_msg(chat_id, "⚠️ معرف المستخدم غير صحيح. استخدم: /ban <id>")
                return

            if clean_text.startswith("/unban "):
                target_uid = safe_int(clean_text.replace("/unban ", "").strip(), 0)
                if target_uid > 0:
                    db.ban_user(target_uid, False)
                    self.send_msg(chat_id, f"✅ تم إلغاء حظر المستخدم `{target_uid}` بنجاح.")
                else:
                    self.send_msg(chat_id, "⚠️ معرف المستخدم غير صحيح. استخدم: /unban <id>")
                return

            if clean_text.startswith("/set_role "):
                parts = clean_text.split()
                if len(parts) >= 3:
                    u_id = safe_int(parts[1], 0)
                    r = parts[2].lower()
                    if u_id > 0:
                        db.set_user_role(u_id, r)
                        self.send_msg(chat_id, f"✅ تم تعيين رتبة `{r}` للمستخدم `{u_id}`.")
                    else:
                        self.send_msg(chat_id, "⚠️ معرف المستخدم غير صحيح. استخدم: /set_role <id> <role>")
                return

            if clean_text.startswith("/set_ad"):
                new_ad = clean_text.replace("/set_ad", "").strip()
                if new_ad:
                    db.set_setting("custom_ad", new_ad)
                    self.send_msg(chat_id, "✅ تم تحديث إعلان خدماتك الطلابية البديل بنجاح!")
                return

            if clean_text in ["⏸ إيقاف / استئناف", "إيقاف"]:
                cur = db.get_setting("is_paused", "0")
                new_state = "0" if cur == "1" else "1"
                db.set_setting("is_paused", new_state)
                self.send_msg(chat_id, f"{'⏸ تم إيقاف النشر التلقائي مؤقتاً.' if new_state == '1' else '▶️ تم استئناف النشر التلقائي.'}")
                return

        # فحص إذا كانت الرسالة سؤالاً أو استفساراً أكاديمياً أو طلباً للبحث المباشر عبر الإنترنت
        is_search_or_question = (
            clean_text.startswith("/search") or
            clean_text.startswith("/chat") or
            clean_text.startswith("ابحث") or
            "ابحث عبر الانترنت" in clean_text or
            "ابحث في الانترنت" in clean_text or
            "ابحث لي" in clean_text or
            "هل تم" in clean_text or
            "ما هي" in clean_text or
            "متى موعد" in clean_text or
            clean_text.endswith("؟") or
            clean_text.endswith("?")
        )

        if is_search_or_question and not has_media:
            self.answer_search_or_chat_query(chat_id, clean_text)
            return

        # إذا كانت الرسالة نصاً أو خبراً أو صورة أو فيديو: يتم نشرها مباشرة في القناة دون أن تظهر في البوت
        if len(clean_text) > 5 or has_media:
            univs = db.get_university_projects()
            target_univ = None
            target_channels = db.get_target_channels()
            if clean_text:
                for u in univs:
                    if u.get("enabled", True) and u["name"].lower() in clean_text.lower():
                        target_univ = u["name"]
                        target_channels = [u["target_channel"]]
                        break
            if not target_channels:
                target_channels = ["@jhdhhdcj"]

            post_queue.put({
                "type": "direct_post",
                "text": clean_text,
                "photo": photo_id,
                "video": video_id,
                "animation": animation_id,
                "document": document_id,
                "media_type": media_type,
                "targets": target_channels,
                "target_univ": target_univ,
                "user_id": None
            })
            media_desc = "فيديو" if video_id else ("صورة" if photo_id else ("مستند" if document_id else "نص"))
            logger.info(f"⚡ [نشر مباشر صامت] تم استلام منشور ({media_desc}) وإرساله للنشر المباشر في: {target_channels[0]}")
            return

    # ----------------- معالجة أزرار الإنلاين (Callback Queries) -----------------
    def handle_callback_query(self, cb: Dict[str, Any]):
        cb_id = cb["id"]
        from_user = cb["from"]
        chat_id = cb["message"]["chat"]["id"]
        data = cb.get("data", "")

        authorized, user_data = self.check_user_access(from_user)
        if not authorized:
            self.answer_callback(cb_id, "⛔️ غير مصرح لك.", alert=True)
            return

        self.answer_callback(cb_id)

        if data == "panel_manage_channels":
            self.show_channels_panel(chat_id)

        elif data == "panel_prompt_add_channel":
            self.user_waiting_state[chat_id] = "waiting_for_target_channel"
            self.send_msg(chat_id, "📢 أرسل معرّف قناتك للنشر (مثال: `@jhdhhdcj`):")

        elif data.startswith("confirm_add_ch_"):
            target_ch = data.replace("confirm_add_ch_", "")
            db.add_target_channel(target_ch, target_ch, chat_id)
            self.send_msg(chat_id, f"✅ تم بنجاح ربط القناة الهدف: `{target_ch}`")

        elif data == "panel_test_publish":
            self.test_publish_all_channels(chat_id)

        # إصلاح الزر الميت المطلوب بدقة (panel_test)
        elif data == "panel_test":
            cached = self.cached_forwarded_post.get(chat_id)
            if cached and cached.get("text"):
                post_queue.put({
                    "type": "direct_post",
                    "text": cached.get("text"),
                    "photo": cached.get("photo"),
                    "targets": db.get_target_channels(),
                    "user_id": None
                })
            else:
                self.run_demo_rephrase(chat_id)

        elif data == "panel_add_source":
            self.user_waiting_state[chat_id] = "waiting_for_new_source"
            self.send_msg(chat_id, "📥 أرسل معرف القناة المصدر (مثال: `@KSU_News`):")

        elif data == "panel_sources":
            self.show_sources_list(chat_id)

        elif data == "panel_my_account":
            self.show_account_panel(chat_id, user_data)

        elif data == "panel_new_post":
            self.user_waiting_state[chat_id] = "waiting_for_instant_post"
            self.send_msg(chat_id, "📝 أرسل الآن نص الخبر أو وسائطه مباشرة:")

        elif data == "panel_toggle_pause":
            if self.is_admin(chat_id):
                cur = db.get_setting("is_paused", "0")
                new_val = "0" if cur == "1" else "1"
                db.set_setting("is_paused", new_val)
                self.send_msg(chat_id, f"{'⏸ تم الإيقاف المؤقت.' if new_val == '1' else '▶️ تم الاستئناف.'}")

        elif data == "panel_stats":
            self.show_stats_panel(chat_id)

        elif data == "panel_users":
            self.show_users_admin_panel(chat_id)

        elif data == "panel_universities":
            self.show_universities_panel(chat_id)

        elif data == "panel_add_university":
            self.start_add_university_wizard(chat_id)

        elif data == "panel_crawl":
            self.trigger_manual_crawl(chat_id)

        elif data == "panel_gnews":
            self.trigger_google_news_search(chat_id)

        elif data in ["panel_ad", "panel_advertisement"]:
            self.show_ad_panel(chat_id)

        elif data == "toggle_ad_replacement":
            cur = db.get_setting("ad_replacement_enabled", "0")
            new_val = "0" if cur == "1" else "1"
            db.set_setting("ad_replacement_enabled", new_val)
            self.show_ad_panel(chat_id)

        elif data == "panel_edit_ad":
            self.user_waiting_state[chat_id] = "waiting_for_custom_ad"
            self.send_msg(chat_id, "📝 أرسل الآن نص إعلانك البديل الجديد ليتم حفظه واستخدامه:")

        elif data == "panel_start":
            self.show_welcome_panel(chat_id, user_data)

        elif data.startswith("univ_view_"):
            univ_id = data.replace("univ_view_", "")
            self.show_single_university_dashboard(chat_id, univ_id)

        elif data.startswith("univ_toggle_"):
            univ_id = data.replace("univ_toggle_", "")
            new_st = db.toggle_university_status(univ_id)
            if new_st is not None:
                st_txt = "🟢 تم تفعيل النشر التلقائي للجامعة بنجاح!" if new_st else "⏸️ تم إيقاف النشر التلقائي لهذه الجامعة مؤقتاً."
                self.send_msg(chat_id, st_txt)
            self.show_single_university_dashboard(chat_id, univ_id)

        elif data.startswith("univ_crawl_") or data.startswith("crawl_univ_"):
            univ_id = data.replace("univ_crawl_", "").replace("crawl_univ_", "")
            self.crawl_single_university(chat_id, univ_id)

        elif data.startswith("univ_gnews_"):
            univ_id = data.replace("univ_gnews_", "")
            target_univ = db.get_university_by_id(univ_id)
            if target_univ:
                self.send_msg(chat_id, f"🌐 جاري فحص أخبار جوجل الحصرية لـ **{target_univ['name']}**...")
                threading.Thread(target=self.check_google_news_single_university, args=(target_univ, True), daemon=True).start()

        elif data.startswith("univ_post_"):
            univ_id = data.replace("univ_post_", "")
            target_univ = db.get_university_by_id(univ_id)
            if target_univ:
                self.user_waiting_state[chat_id] = f"waiting_univ_post_{univ_id}"
                self.send_msg(chat_id, f"📝 **أرسل الآن نص المنشور أو الصورة للنشر حصراً في قناة {target_univ['name']} (`{target_univ['target_channel']}`):**\n\n*(سيمر عبر الصياغة بالذكاء ولن يتداخل مع أي قناة أخرى)*")

        elif data.startswith("univ_del_") or data.startswith("del_univ_"):
            univ_id = data.replace("univ_del_", "").replace("del_univ_", "")
            target_univ = db.get_university_by_id(univ_id)
            db.delete_university_project(univ_id)
            self.send_msg(chat_id, f"🗑️ تم حذف مشروع الجامعة `{target_univ['name'] if target_univ else univ_id}` بنجاح!")
            self.show_universities_panel(chat_id)

        elif data == "panel_cancel":
            self.cached_forwarded_post.pop(chat_id, None)
            self.user_waiting_state.pop(chat_id, None)
            self.univ_wizard_data.pop(chat_id, None)
            self.send_msg(chat_id, "تم الإلغاء ✅")

    # ----------------- وظائف العرض والتحكم -----------------
    def show_welcome_panel(self, chat_id: int, user_data: Dict[str, Any]):
        channels = db.get_target_channels()
        role = user_data.get("role", "user")
        is_paused = db.get_setting("is_paused", "0") == "1"
        status_badge = "⏸ متوقف مؤقتاً" if is_paused else "🟢 نشط 24/7"

        text = f"""👋 **مرحباً بك في محرر وموجه المحتوى التعليمي الذكي V3!**
━━━━━━━━━━━━━━━━━━━
• **حالة البوت**: {status_badge}
• **رتبتك في النظام**: `{role}`
• **قناة النشر الهدف**: `{', '.join(channels)}`
• **النموذج الذكي**: `{PRIMARY_MODEL}`
• **المحرك وقاعدة البيانات**: `SQLite3 Persistent DB`
• **سحب المصادر**: مفعل (MTProto + Scraper)
━━━━━━━━━━━━━━━━━━━
👇 **اختر الإجراء المطلوب من الأزرار أدناه:**"""
        self.send_msg(chat_id, "⌨️ **لوحة المفاتيح الدائمة نشطة على شاشتك للتحكم السريع:**", self.get_main_reply_keyboard(role))
        self.send_msg(chat_id, text, self.get_control_panel_inline_keyboard(role == "admin"))

    def show_account_panel(self, chat_id: int, user_data: Dict[str, Any]):
        phone = user_data.get("phone_number") or "⚠️ غير موثق بعد (اضغط زر ربط الهاتف)"
        plan = user_data.get("plan", "free")
        expires = user_data.get("plan_expires_at", "غير محدد")
        if expires and "T" in expires:
            expires = expires.split("T")[0]

        text = f"""👤 **ملف الحساب والاشتراك:**
━━━━━━━━━━━━━━━━━━━
🆔 المعرف: `{chat_id}`
📱 الهاتف الموثق: `{phone}`
👑 الرتبة: `{user_data.get('role', 'user')}`
📦 الخطة الحالية: `{plan.upper()}`
📅 تاريخ انتهاء الخطة: `{expires}`
💰 الرصيد: `{user_data.get('balance', 0.0)}` نقطة
━━━━━━━━━━━━━━━━━━━
💡 *لتوثيق رقم هاتفك والاستفادة من النشر غير المحدود، أرسل /register*"""
        self.send_msg(chat_id, text)

    def show_channels_panel(self, chat_id: int):
        details = db.get_target_channels_detailed()
        text = "📢 **إدارة قنوات النشر المستهدفة وإحصائياتها:**\n━━━━━━━━━━━━━━━━━━━\n"
        for i, c in enumerate(details, 1):
            st = "🟢 ممتازة" if c["status"] == "active" else "🔴 مشكلة صلاحية"
            text += f"{i}. `{c['channel_id']}` ({st})\n   └ نجاح: {c['success_count']} | فشل: {c['fail_count']}\n"
            if c.get("last_error_msg"):
                text += f"   └ خطأ: {c['last_error_msg']}\n"

        text += "\n💡 *لإضافة قناة: أرسل /set_channel @اسم_قناتك أو اضغط الزر أدناه:*"
        kb = {
            "inline_keyboard": [
                [{"text": "➕ إضافة قناة جديدة", "callback_data": "panel_prompt_add_channel"}],
                [{"text": "🧪 اختبار النشر الآن", "callback_data": "panel_test_publish"}]
            ]
        }
        self.send_msg(chat_id, text, kb)

    def show_sources_list(self, chat_id: int):
        srcs = db.get_sources()
        text = f"📋 **المصادر المراقبة حالياً ({len(srcs)}):**\n━━━━━━━━━━━━━━━━━━━\n"
        for i, s in enumerate(srcs, 1):
            last_p = f" (آخر منشور: #{s['last_post_id']})" if s.get("last_post_id") else ""
            text += f"{i}. [{s['type']}] `{s['target']}`{last_p}\n"
        text += "\n➕ لإضافة مصدر أرسل: `/add_source @channel`"
        self.send_msg(chat_id, text)

    def show_users_admin_panel(self, chat_id: int):
        users = db.list_users(20)
        text = f"👥 **المستخدمون المسجلون ({len(users)}):**\n━━━━━━━━━━━━━━━━━━━\n"
        for u in users:
            banned = "🚫 محظور" if u["is_banned"] else "✅ نشط"
            ph = u["phone_number"] or "بلا هاتف"
            text += f"• `{u['user_id']}` (@{u.get('username') or 'بلا_يوزر'}) | {u['role']} | {banned}\n  📱 {ph}\n"
        self.send_msg(chat_id, text)

    def show_ad_panel(self, chat_id: int):
        custom_ad = db.get_setting("custom_ad", "")
        ad_enabled = (db.get_setting("ad_replacement_enabled", "0") == "1")
        status_text = "🟢 مفعل (يستبدل الإعلانات التجارية الصريحة فقط)" if ad_enabled else "🔴 معطل (موصى به لضمان نشر أخبار الجامعات الأصلية كاملة مع صورها)"

        msg = f"""🎯 **إدارة إعلان خدمات الطلاب وحماية المنشورات الأصلية:**
━━━━━━━━━━━━━━━━━━━━━━━━
• **الحالة**: {status_text}

🛡️ **سياسة الحماية والأمان:**
1. عند التعطيل (الوضع الافتراضي والموصى به): ينشر البوت منشورات الجامعات ومصادر الأخبار كاملة مع صورها الحقيقية دون أي استبدال.
2. عند التفعيل: يستبدل البوت حصراً إعلانات حل الواجبات التجارية بمقابل، ولا يمس منشورات شؤون الطلاب أو مشاريع التخرج الرسمية.

📝 **نص إعلانك الترويجي البديل:**
───────────────────
{custom_ad or '(لم يتم تعيين إعلان بعد)'}
───────────────────"""

        kb = {
            "inline_keyboard": [
                [{"text": "🔴 إيقاف الاستبدال (نشر الأخبار الأصلية)" if ad_enabled else "🟢 تفعيل استبدال الإعلانات التجارية", "callback_data": "toggle_ad_replacement"}],
                [{"text": "✏️ تعديل نص الإعلان", "callback_data": "panel_edit_ad"}],
                [{"text": "🔙 اللوحة الرئيسية", "callback_data": "panel_start"}]
            ]
        }
        self.send_msg(chat_id, msg, kb)

    def show_stats_panel(self, chat_id: int):
        proc = db.get_setting("processed_count", "0")
        fwd = db.get_setting("forwarded_count", "0")
        ads = db.get_setting("ad_replaced_count", "0")
        channels = db.get_target_channels()
        srcs = db.get_sources()
        text = f"""📊 **إحصائيات النظام الشاملة:**
━━━━━━━━━━━━━━━━━━━
• إجمالي المنشورات المعالجة: `{proc}`
• إجمالي المنشورات الصادرة: `{fwd}`
• إعلانات المنافسين المستبدلة: `{ads}`
• قنوات النشر النشطة: `{len(channels)}`
• المصادر المراقبة: `{len(srcs)}`
• قاعدة البيانات: `SQLite3 Persistent Engine`"""
        self.send_msg(chat_id, text)

    def process_add_source(self, chat_id: int, input_text: str):
        target = input_text.strip()
        src_type = "telegram"
        if "twitter.com" in target or "x.com" in target or target.startswith("twitter:") or target.startswith("x:"):
            src_type = "twitter"
            target = target.replace("twitter:", "").replace("x:", "").strip()
        elif target.startswith("http") and not ("t.me" in target):
            src_type = "rss"

        db.add_source(src_type, target, target, added_by=chat_id)
        self.send_msg(chat_id, f"✅ تمت إضافة المصدر `{target}` بنوع [{src_type}] بنجاح!\n⚡ جاري فحص وسحب أحدث المنشورات منه فوراً...")
        new_src = {"type": src_type, "target": target, "last_post_id": ""}
        if src_type == "telegram":
            threading.Thread(target=self.check_telegram_channel_scraper, args=(new_src, True), daemon=True).start()
        elif src_type in ["twitter", "x"]:
            threading.Thread(target=self.check_twitter_feed, args=(new_src, True), daemon=True).start()
        elif src_type == "rss":
            threading.Thread(target=self.check_rss_feed, args=(new_src, True), daemon=True).start()

    def process_add_target(self, chat_id: int, input_text: str):
        target = input_text.strip()
        db.add_target_channel(target, target, added_by=chat_id)
        self.send_msg(chat_id, f"✅ تم اعتماد قناة النشر `{target}` بنجاح!")

    def trigger_manual_crawl(self, chat_id: int):
        self.send_msg(chat_id, "🔄 جاري فحص وسحب أحدث المنشورات من كافة المصادر المعتمدة (تيليجرام + تويتر/X + أخبار جوجل الرسمية)...")
        sources = db.get_sources()
        for s in sources:
            s_type = s.get("type")
            if s_type == "telegram":
                threading.Thread(target=self.check_telegram_channel_scraper, args=(s, True), daemon=True).start()
            elif s_type == "rss":
                threading.Thread(target=self.check_rss_feed, args=(s, True), daemon=True).start()
            elif s_type in ["twitter", "x"]:
                threading.Thread(target=self.check_twitter_feed, args=(s, True), daemon=True).start()

        # فحص أخبار جوجل أيضاً لكل الجامعات
        threading.Thread(target=self.check_google_news_for_universities, args=(True,), daemon=True).start()

    def start_add_university_wizard(self, chat_id: int):
        self.user_waiting_state[chat_id] = "waiting_univ_target"
        self.univ_wizard_data[chat_id] = {}
        text = """🏛️ **معالج ربط وإعداد جامعة وقناة نشر جديدة (الخطوة 1 من 5):**
━━━━━━━━━━━━━━━━━━━
📢 **الخطوة الأولى: تحديد قناة النشر الهدف**
أرسل الآن **معرّف أو رابط قناة النشر** التي ترغب بنشر أخبار الجامعة إليها:
📌 **مثال**: `@jhdhhdcj` أو `@MyUnivChannel` أو قم بتوجيه رسالة من القناة هنا.

💡 *(تأكد من إضافة البوت مشرفاً Admin في القناة مع صلاحية نشر الرسائل)*
*(أرسل /cancel في أي وقت للإلغاء)*"""
        self.send_msg(chat_id, text)

    def process_univ_step1_target(self, chat_id: int, input_text: str):
        target_ch = input_text.strip()
        if not target_ch.startswith("@") and not target_ch.startswith("-100"):
            target_ch = "@" + target_ch

        if chat_id not in self.univ_wizard_data:
            self.univ_wizard_data[chat_id] = {}
        self.univ_wizard_data[chat_id]["target_channel"] = target_ch
        self.user_waiting_state[chat_id] = "waiting_univ_name"

        prompt = f"""✅ **تم اعتماد قناة النشر الهدف**: `{target_ch}`
━━━━━━━━━━━━━━━━━━━
🎓 **الخطوة 2 من 5: تحديد اسم الجامعة / القسم بالتفصيل**:

أرسل الاسم الرسمي والواضح للجامعة أو الكلية لتوجيه سياق الذكاء الاصطناعي بدقة تامة:
📌 **أمثلة**:
• `جامعة الشرق الأوسط الأمريكية AUM - الكويت`
• `جامعة الملك سعود - كلية الهندسة`
• `كليات التقنية العليا HCT`

💡 *(هذا الاسم هو المعيار الأساسي لعزل المنشورات وتوجيه صياغة الذكاء الاصطناعي)*"""
        self.send_msg(chat_id, prompt)

    def process_univ_step2_name(self, chat_id: int, input_text: str):
        name = input_text.strip()
        if len(name) < 3:
            self.send_msg(chat_id, "⚠️ اسم الجامعة قصير جداً! يرجى إرسال اسم الجامعة بوضوح مثل: `جامعة الشرق الأوسط الأمريكية AUM`")
            return

        if chat_id not in self.univ_wizard_data:
            self.univ_wizard_data[chat_id] = {}
        self.univ_wizard_data[chat_id]["name"] = name
        self.user_waiting_state[chat_id] = "waiting_univ_tg"

        prompt = f"""✅ **تم حفظ اسم الجامعة**: `{name}`
━━━━━━━━━━━━━━━━━━━
📡 **الخطوة 3 من 5: تحديد قنوات التليجرام المصدرة**:

أرسل معرفات قنوات التليجرام التي تريد سحب الأخبار منها **حصراً لهذه الجامعة** (مفصولة بمسافة):
📌 **مثال**: `@aum_news @aum_union`

💡 *إذا كنت ترغب بالاعتماد فقط على أخبار جوجل وتويتر، أرسل كلمة*: `تخطي`"""
        self.send_msg(chat_id, prompt)

    def process_univ_step3_tg(self, chat_id: int, input_text: str):
        tg_sources = []
        if input_text.strip().lower() not in ["تخطي", "skip", "-", "لا"]:
            parts = re.split(r'[\s,]+', input_text.strip())
            for p in parts:
                p = p.strip()
                if p:
                    if not p.startswith("@") and not p.startswith("https://"):
                        p = "@" + p
                    tg_sources.append(p)

        if chat_id not in self.univ_wizard_data:
            self.univ_wizard_data[chat_id] = {}
        self.univ_wizard_data[chat_id]["telegram_sources"] = tg_sources
        self.user_waiting_state[chat_id] = "waiting_univ_tw"

        tg_desc = "، ".join(tg_sources) if tg_sources else "تم التخطي"
        prompt = f"""✅ **تم ربط قنوات تليجرام ({len(tg_sources)})**: `{tg_desc}`
━━━━━━━━━━━━━━━━━━━
🐦 **الخطوة 4 من 5: تحديد حسابات تويتر (X) المصدرة**:

أرسل معرفات حسابات تويتر/X التابعة لهذه الجامعة (مفصولة بمسافة):
📌 **مثال**: `@aum_kw @moe_kw`

💡 *إن لم تتوفر حسابات تويتر حالياً، أرسل كلمة*: `تخطي`"""
        self.send_msg(chat_id, prompt)

    def process_univ_step4_tw(self, chat_id: int, input_text: str):
        tw_sources = []
        if input_text.strip().lower() not in ["تخطي", "skip", "-", "لا"]:
            parts = re.split(r'[\s,]+', input_text.strip())
            for p in parts:
                p = p.strip()
                if p:
                    if not p.startswith("@") and not p.startswith("https://"):
                        p = "@" + p
                    tw_sources.append(p)

        if chat_id not in self.univ_wizard_data:
            self.univ_wizard_data[chat_id] = {}
        self.univ_wizard_data[chat_id]["twitter_sources"] = tw_sources
        self.user_waiting_state[chat_id] = "waiting_univ_gnews"

        name = self.univ_wizard_data[chat_id].get("name", "الجامعة")
        tw_desc = "، ".join(tw_sources) if tw_sources else "تم التخطي"

        prompt = f"""✅ **تم ربط حسابات تويتر ({len(tw_sources)})**: `{tw_desc}`
━━━━━━━━━━━━━━━━━━━
🌐 **الخطوة 5 من 5: البحث التلقائي في أخبار جوجل (Google News)**:

أرسل عبارة البحث لجلب الأخبار والمقالات الأكاديمية الرسمية للجامعة.
📌 **العبارة المقترحة تلقائياً**: `\"{name}\"`

💡 *أرسل كلمة `تأكيد` للاعتماد الفوري، أو اكتب عبارة بحث مخصصة (مثال: `{name} مكافأة قبول تسجيل`):*"""
        self.send_msg(chat_id, prompt)

    def process_univ_step5_gnews(self, chat_id: int, input_text: str):
        wizard = self.univ_wizard_data.pop(chat_id, {})
        self.user_waiting_state.pop(chat_id, None)

        name = wizard.get("name", "جامعة جديدة")
        target_ch = wizard.get("target_channel", "@jhdhhdcj")
        tg_sources = wizard.get("telegram_sources", [])
        tw_sources = wizard.get("twitter_sources", [])

        input_clean = input_text.strip()
        if input_clean.lower() in ["تأكيد", "نعم", "موافق", "confirm", "ok", "تخطي"]:
            gnews_query = name
        else:
            gnews_query = input_clean or name

        # الكلمات المفتاحية المعزولة للجامعة
        keywords = [name]
        for w in name.split():
            w_c = w.strip()
            if len(w_c) > 3 and w_c not in ["جامعة", "كلية", "عمادة", "معهد", "الشرق", "الأوسط"]:
                keywords.append(w_c)
        keywords.extend(["قبول", "تسجيل", "مكافأة", "إعانة"])

        proj = db.add_university_project(
            name=name,
            target_channel=target_ch,
            telegram_sources=tg_sources,
            twitter_sources=tw_sources,
            google_news_query=gnews_query,
            keywords=keywords
        )

        # تسجيل المصادر في قاعدة البيانات للمراقبة المباشرة
        for tg in tg_sources:
            db.add_source("telegram", tg, f"{name} - تيليجرام", added_by=chat_id)
        for tw in tw_sources:
            db.add_source("twitter", tw, f"{name} - تويتر", added_by=chat_id)

        self.send_msg(chat_id, f"🎉 **تم إنشاء وربط مشروع الجامعة بنجاح تام!**\nكل مصادر {name} معزولة 100% وتصب حصراً في `{target_ch}`.\n⚡ جاري فحص وسحب أحدث منشورات لمصادر الجامعة فوراً...")
        self.show_single_university_dashboard(chat_id, proj["id"])

        # تشغيل سحب فوري لمصادر الجامعة الجديدة في الخلفية
        for tg in tg_sources:
            src_obj = {"type": "telegram", "target": tg, "last_post_id": ""}
            threading.Thread(target=self.check_telegram_channel_scraper, args=(src_obj, True, proj), daemon=True).start()
        for tw in tw_sources:
            src_obj = {"type": "twitter", "target": tw, "last_post_id": ""}
            threading.Thread(target=self.check_twitter_feed, args=(src_obj, True, proj), daemon=True).start()
        threading.Thread(target=self.check_google_news_single_university, args=(proj, True), daemon=True).start()

    def show_universities_panel(self, chat_id: int):
        """يعرض قائمة الجامعات، ولكل جامعة زر مستقل وخاص بها للتحكم الكامل"""
        univs = db.get_university_projects()
        text = f"🏛️ **قائمة الجامعات وقنوات النشر المستقلة ({len(univs)}):**\n"
        text += "🛡️ *نظام العزل الصارم (Strict Relational Mapping) نشط: كل جامعة لها مسار معزول تماماً ومصادر حصرية.*\n\n"
        text += "👇 **اضغط على زر أي جامعة أدناه للدخول للوحتها المستقلة وإدارتها:**"

        buttons = []
        for u in univs:
            st = "🟢 نشطة" if u.get("enabled", True) else "🔴 متوقفة"
            buttons.append([
                {"text": f"🎓 {u['name']} ({st}) ⮞ {u['target_channel']}", "callback_data": f"univ_view_{u['id']}"}
            ])

        buttons.append([
            {"text": "➕ معالج إضافة جامعة وقناة (5 خطوات)", "callback_data": "panel_add_university"},
            {"text": "🔄 فحص وسحب كافة الجامعات", "callback_data": "panel_crawl"}
        ])
        buttons.append([
            {"text": "📞 الدعم الفني المباشر (@M_S_F_G)", "url": "https://t.me/M_S_F_G"},
            {"text": "🎛 اللوحة الرئيسية", "callback_data": "panel_start"}
        ])

        self.send_msg(chat_id, text, {"inline_keyboard": buttons})

    def show_single_university_dashboard(self, chat_id: int, univ_id: str):
        """لوحة تحكم خاصة ومستقلة حصراً بجامعة محددة دون التأثير على الجامعات الأخرى"""
        univ = db.get_university_by_id(univ_id)
        if not univ:
            self.send_msg(chat_id, "⚠️ لم يتم العثور على الجامعة المحددة.")
            self.show_universities_panel(chat_id)
            return

        is_active = univ.get("enabled", True)
        st_badge = "🟢 نشطة (النشر التلقائي يعمل)" if is_active else "🔴 متوقفة مؤقتاً"
        tg_disp = "، ".join(univ.get("telegram_sources", [])) or "لا يوجد مصادر تيليجرام"
        tw_disp = "، ".join(univ.get("twitter_sources", [])) or "لا يوجد مصادر تويتر"
        gnews_q = univ.get("google_news_query", univ["name"])

        text = f"""🏛️ **لوحة التحكم المستقلة: {univ['name']}**
━━━━━━━━━━━━━━━━━━━
📢 **قناة النشر الحصرية**: `{univ['target_channel']}`
⚡ **الحالة الحالية**: {st_badge}
📡 **قنوات تيليجرام المصدرة**: `{tg_disp}`
🐦 **حسابات تويتر/X المصدرة**: `{tw_disp}`
🌐 **استعلام أخبار جوجل**: `\"{gnews_q}\"`
🔑 **معرف المشروع**: `{univ['id']}`
━━━━━━━━━━━━━━━━━━━
🛡️ **العزل الصارم**: جميع أخبار هذه المصادر تصاغ بالذكاء وتنشر حصراً في `{univ['target_channel']}` ولن تتداخل مع أي قناة أخرى."""

        btn_toggle_text = "⏸️ إيقاف النشر لهذه الجامعة" if is_active else "▶️ تفعيل واستئناف النشر"
        buttons = [
            [
                {"text": f"🔄 فحص وسحب أخبار {univ['name'][:16]}", "callback_data": f"univ_crawl_{univ['id']}"},
                {"text": btn_toggle_text, "callback_data": f"univ_toggle_{univ['id']}"}
            ],
            [
                {"text": f"🌐 أخبار جوجل المباشرة", "callback_data": f"univ_gnews_{univ['id']}"},
                {"text": f"📝 نشر خبر فوري في قناتها", "callback_data": f"univ_post_{univ['id']}"}
            ],
            [
                {"text": "🗑️ حذف هذه الجامعة من النظام", "callback_data": f"univ_del_{univ['id']}"}
            ],
            [
                {"text": "🔙 عودة لقائمة الجامعات", "callback_data": "panel_universities"},
                {"text": "🎛 اللوحة الرئيسية", "callback_data": "panel_start"}
            ]
        ]

        self.send_msg(chat_id, text, {"inline_keyboard": buttons})

    def check_google_news_single_university(self, target_univ: Dict[str, Any], is_manual: bool = False):
        """فحص وسحب أخبار جوجل لجامعة محددة حصراً وتوجيهها لقناتها الهدف"""
        try:
            q_str = target_univ.get("google_news_query") or target_univ["name"]
            encoded_q = urllib.parse.quote(q_str)
            target_ch = target_univ["target_channel"]

            urls = [
                f"https://news.google.com/rss/search?q={encoded_q}&hl=ar&gl=KW&ceid=KW:ar",
                f"https://news.google.com/rss/search?q={encoded_q}&hl=ar&gl=SA&ceid=SA:ar"
            ]

            for url in urls:
                try:
                    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
                    with urllib.request.urlopen(req, context=ssl_ctx, timeout=12) as resp:
                        root = ET.fromstring(resp.read())
                        items = root.findall(".//item")
                        for it in items[:6]:
                            title = it.findtext("title") or ""
                            link = it.findtext("link") or ""
                            desc = it.findtext("description") or ""
                            clean_desc = re.sub(r'<[^>]+>', '', desc).strip()
                            clean_title = re.sub(r'\s*-\s*[^-]+$', '', title).strip()
                            full_text = f"{clean_title}\n{clean_desc}".strip()
                            photo_url = self.extract_image_from_xml_item(it, desc)

                            # منع التكرار الصارم
                            norm_clean = re.sub(r'[^\w\s]', '', clean_title)
                            norm_clean = re.sub(r'\s+', ' ', norm_clean).strip().lower()
                            story_hash = f"gnews_{hashlib.sha256(norm_clean.encode('utf-8')).hexdigest()[:24]}"

                            if db.is_post_seen(story_hash, story_hash):
                                continue

                            db.mark_post_seen(story_hash, story_hash, f"gnews_{target_univ['id']}")
                            logger.info(f"⚡️ [Google News الحصري] خبر جديد لـ {target_univ['name']} موجه إلى {target_ch} (صورة: {'نعم' if photo_url else 'لا'})")

                            clean_link = clean_and_resolve_url(link, target_univ.get("name"))
                            news_body = f"{full_text}\n\n{clean_link}" if clean_link else full_text

                            post_queue.put({
                                "type": "google_news_post",
                                "text": news_body,
                                "photo": photo_url,
                                "targets": [target_ch],
                                "target_univ": target_univ["name"],
                                "user_id": None
                            })
                            if not is_manual:
                                break
                except Exception as e:
                    logger.debug(f"خطأ في سحب أخبار جوجل: {e}")
        except Exception as e:
            logger.error(f"خطأ في check_google_news_single_university: {e}")

    def trigger_google_news_search(self, chat_id: int, custom_query: str = ""):
        self.send_msg(chat_id, "🌐 **جاري البحث في Google News عن أحدث الأخبار الأكاديمية والجامعية...**")
        threading.Thread(target=self.check_google_news_for_universities, args=(True,), daemon=True).start()

    def crawl_single_university(self, chat_id: int, univ_id: str):
        univs = db.get_university_projects()
        target_univ = next((u for u in univs if u["id"] == univ_id), None)
        if not target_univ:
            self.send_msg(chat_id, "⚠️ لم يتم العثور على الجامعة المحددة.")
            return

        self.send_msg(chat_id, f"🔄 جاري فحص وسحب المصادر وأخبار جوجل لـ **{target_univ['name']}** ونشرها في `{target_univ['target_channel']}`...")

        # فحص قنوات تيليجرام التابعة للجامعة مع توجيهها حصراً لقناتها
        for tg in target_univ.get("telegram_sources", []):
            src_obj = {"type": "telegram", "target": tg, "last_post_id": ""}
            threading.Thread(target=self.check_telegram_channel_scraper, args=(src_obj, True, target_univ), daemon=True).start()

        # فحص حسابات تويتر التابعة للجامعة مع توجيهها حصراً لقناتها
        for tw in target_univ.get("twitter_sources", []):
            src_obj = {"type": "twitter", "target": tw, "last_post_id": ""}
            threading.Thread(target=self.check_twitter_feed, args=(src_obj, True, target_univ), daemon=True).start()

        # فحص أخبار جوجل لهذه الجامعة
        threading.Thread(target=self.check_google_news_single_university, args=(target_univ, True), daemon=True).start()

    def test_publish_all_channels(self, chat_id: int):
        channels = db.get_target_channels()
        self.send_msg(chat_id, f"⏳ جاري اختبار النشر في {len(channels)} قناة...")
        test_caption = """📌 **منشور تجريبي لاختبار صلاحيات البوت الأكاديمي**

• تم الربط والتحقق بنجاح مع محرك النشر الذكي V3
• البوت يمتلك صلاحية المشرف والنشر الفوري 24/7
• جميع المنشورات القادمة ستتم صياغتها باحترافية عالية وبدون ذكر أي مصادر

💬 نرحب بجميع الطلاب لمتابعة آخر المستجدات الأكاديمية!
#أخبار_الجامعة #دراسة #شؤون_الطلاب"""

        test_img = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/240px-Telegram_logo.svg.png"
        results = []
        for ch in channels:
            res = self.send_photo(ch, test_img, test_caption)
            ok = res.get("ok", False)
            desc = res.get("description", "")
            db.record_channel_publish_result(ch, ok, desc)
            if ok:
                results.append(f"✅ `{ch}`: تم النشر بنجاح! 🎉")
            else:
                results.append(f"❌ `{ch}`: فشل ({desc})")

        self.send_msg(chat_id, "📊 **نتائج فحص قنوات النشر:**\n\n" + "\n".join(results))

    def run_demo_rephrase(self, chat_id: int):
        sample = "تعلن عمادة القبول والتسجيل عن بدء استقبال طلبات الالتحاق للفصل القادم عبر البوابة ابتداءً من الأحد القادم ويستمر حتى نهاية الشهر."
        self.send_msg(chat_id, f"🧪 **جاري صياغة عينة خبر عبر DeepSeek:**\n`{sample}`")
        result = self.call_ai(sample)
        self.send_msg(chat_id, f"✨ **النتيجة بعد الصياغة:**\n───────────────────\n{result}")

    # ----------------- الحلقة الرئيسية وتشغيل getUpdates مع الـ Backoff -----------------
    def run(self):
        logger.info("=" * 65)
        logger.info("  🚀 تشغيل محرر المحتوى التعليمي والجامعي الذكي (النسخة الشاملة V3)")
        logger.info(f"  المشرف العام: @{ADMIN_USERNAME} ({ADMIN_ID})")
        logger.info(f"  قناة النشر الافتراضية: {db.get_target_channels()}")
        logger.info("=" * 65)

        # تشغيل الخيوط الخلفية
        threading.Thread(target=run_keepalive_server, daemon=True).start()
        threading.Thread(target=self.worker_loop, daemon=True).start()
        threading.Thread(target=self.monitor_sources_loop, daemon=True).start()
        threading.Thread(target=self.health_check_channels_loop, daemon=True).start()
        threading.Thread(target=self.scheduled_posts_loop, daemon=True).start()
        self.start_telethon_userbot()

        try:
            welcome_text = f"""🚀 **تم تشغيل محرر المحتوى التعليمي بنجاح (النسخة V3.0)!**
👑 المشرف: @{ADMIN_USERNAME} (`{ADMIN_ID}`)
📢 قنوات النشر: `{', '.join(db.get_target_channels())}`
💾 قاعدة البيانات: `SQLite3 Persistent DB`
🛡 فاحص الصلاحيات الدوري: يعمل كل 30 دقيقة
⚙️ طابور المعالجة المستقل: نشط لحماية البوت من التجمد"""
            self.send_msg(ADMIN_ID, welcome_text, self.get_main_reply_keyboard("admin"))
        except Exception as e:
            logger.warning(f"ملاحظة في إشعار البداية: {e}")

        offset = 0
        backoff_delay = 1
        logger.info("🎧 جاري الاستماع لتحديثات وأوامر تيليجرام...")

        # فحص وجود ويب هوك نشط
        webhook_info = self.tg_request("getWebhookInfo")
        has_active_webhook = bool(webhook_info.get("ok") and webhook_info.get("result", {}).get("url"))
        if has_active_webhook:
            logger.info(f"🔗 تم رصد Webhook نشط على: {webhook_info['result']['url']}")
            logger.info("⚡️ البوت يعمل بنمط التناغم الكامل: الأوامر التفاعلية عبر Webhook + الساحب الآلي المتقدم والمراقب في الخلفية 24/7")

        conflict_logged = False
        while self.running:
            try:
                # إذا كان الويب هوك نشطاً، نترك استقبال الرسائل للويب هوك ونبقي خيوط السحب والنشر نشطة
                if has_active_webhook:
                    time.sleep(25)
                    chk = self.tg_request("getWebhookInfo", timeout=10)
                    if chk.get("ok") and not chk.get("result", {}).get("url"):
                        has_active_webhook = False
                        logger.info("🔄 تم إلغاء Webhook، تفعيل الاستماع المباشر getUpdates فوراً...")
                    continue

                res = self.tg_request(f"getUpdates?offset={offset}&timeout=25", timeout=35)
                
                # فحص خطأ 409 Conflict (Bots.Business أو منصة أخرى تتولى استلام التحديثات)
                if not res.get("ok"):
                    http_code = res.get("http_code") or res.get("error_code")
                    if http_code == 409:
                        if not conflict_logged:
                            logger.info("ℹ️ منصة Bots.Business تتولى استلام التحديثات والتفاعل مع المستخدمين. سيعمل محرك بايثون بنمط المراقبة والزحف والنشر التلقائي في الخلفية 24/7 دون أي تعارض.")
                            conflict_logged = True
                        time.sleep(45)
                        continue
                    elif http_code == 429:
                        retry_after = res.get("parameters", {}).get("retry_after", 10)
                        time.sleep(retry_after)
                        continue
                    else:
                        time.sleep(3)
                        continue

                conflict_logged = False

                # إذا نجح الطلب، نعيد ضبط الـ Backoff
                backoff_delay = 1
                updates = res.get("result", [])

                for u in updates:
                    offset = u["update_id"] + 1
                    if "callback_query" in u:
                        self.handle_callback_query(u["callback_query"])
                    elif "message" in u:
                        self.handle_message(u["message"])
                    elif "channel_post" in u:
                        self.handle_message(u["channel_post"])
                    elif "edited_message" in u:
                        self.handle_message(u["edited_message"])
                    elif "edited_channel_post" in u:
                        self.handle_message(u["edited_channel_post"])

                time.sleep(0.2)

            except KeyboardInterrupt:
                logger.info("تم إيقاف البوت بواسطة المستخدم.")
                self.running = False
                break
            except Exception as e:
                logger.error(f"خطأ في حلقة الاستماع الرئيسية: {e}")
                time.sleep(3)


if __name__ == "__main__":
    bot = StandaloneTelegramEducationalBot()
    bot.run()
