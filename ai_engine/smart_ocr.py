"""
==============================================================================
محرك التعرف الضوئي وقراءة الصور الأكاديمية فائق الدقة (Smart OCR & Vision Engine)
==============================================================================
حل مشكلة: «تلجرام يعمل لكن لا يستطيع قراءة الصور بدقة»
1. استخدام نموذج الرؤية البصرية MiniCPM-V-4.7-35B-A3B عبر HCNSEC لقراءة الإعلانات العربية.
2. استخراج التواريخ، الجداول، الشروط، والمواعيد بدقة 100%.
3. استبدال أرقام الهواتف أو روابط القروبات الطلابية برقم ومعرف المشرف المعتمد تلقائياً.
==============================================================================
"""

import os
import re
import json
import base64
import logging
import urllib.request
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger("SmartOCR")

BASE_DIR = Path(__file__).resolve().parent.parent
API_ENDPOINT = "https://api.hcnsec.cn/v1/chat/completions"
VISION_MODEL = "MiniCPM-V-4.7-35B-A3B"
PRIMARY_KEY = "sk-ZimPNQ7NBOAqouWIL9Wa15qczOorNkLY72ns3zUfxoUmU307"
BACKUP_KEY = "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii"


def load_admin_contact() -> Tuple[str, str]:
    """قراءة رقم وهندل الآدمن لاستبدال الأرقام الخارجية بأرقام المشرف"""
    admin_id = os.getenv("ADMIN_ID", "7607633343")
    admin_user = os.getenv("ADMIN_USERNAME", "M_S_F_G").lstrip("@")
    return admin_id, f"@{admin_user}"


def encode_image_to_base64(image_path_or_bytes) -> Tuple[str, str]:
    """تحويل الصورة إلى صيغة base64 مع تحديد نوع MIME"""
    if isinstance(image_path_or_bytes, (str, Path)):
        p = Path(image_path_or_bytes)
        ext = p.suffix.lower().replace(".", "")
        mime = "image/jpeg"
        if ext in ("png", "webp", "gif"):
            mime = f"image/{ext}"
        with open(p, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        return b64, mime
    else:
        # bytes
        b64 = base64.b64encode(image_path_or_bytes).decode("utf-8")
        return b64, "image/jpeg"


def replace_external_contacts(text: str) -> str:
    """
    استبدال أرقام الهواتف وروابط المساعدة الخارجية برقم ومعرف الآدمن المعتمد:
    'إذا نشر الشخص منشورات تخص المساعدة الطلابية أو القروبات، ينشر رقمي بدلاً من رقمه'
    """
    admin_id, admin_user = load_admin_contact()

    # أنماط أرقام الجوالات (السعودية، الكويت، دول الخليج والوطن العربي)
    phone_pattern = r"(?:\+?966|00966|0)?5\d{8}|(?:\+?965|00965)?[569]\d{7}|(?:\+?967|00967)?7\d{8}|(?:\+?20|0020)?1[0125]\d{8}|\b05\d{8}\b|\b09\d{8}\b"
    
    # استبدال روابط قروبات الواتساب والتواصل الشخصي
    whatsapp_pattern = r"https?://chat\.whatsapp\.com/[A-Za-z0-9]+"

    text_replaced = re.sub(phone_pattern, f"للتواصل والمساعدة: {admin_user}", text)
    text_replaced = re.sub(whatsapp_pattern, f"https://t.me/{admin_user.lstrip('@')}", text_replaced)

    return text_replaced


# اسم بديل متطابق مع استدعاءات الوحدات الأخرى
sanitize_contact_info = replace_external_contacts


def extract_academic_text_from_image(image_input, custom_prompt: str = "") -> Dict[str, Any]:
    """
    التحليل البصري الذكي للإعلانات والجداول الجامعية عبر MiniCPM-V-4.7-35B-A3B:
    يرجع نصاً دقيقاً باللغة العربية مع إبراز المواعيد والتواريخ واستبدال أرقام التواصل.
    """
    try:
        b64_data, mime_type = encode_image_to_base64(image_input)
    except Exception as e:
        logger.error(f"❌ فشل تشفير الصورة: {e}")
        return {"ok": False, "error": f"تعذر قراءة ملف الصورة: {e}", "text": ""}

    system_instruction = """أنت مستشار أكاديمي وقارئ وثائق وجداول وإعلانات جامعية عالي الدقة.
مهمتك:
1. قراءة واستخراج كافة النصوص والمواعيد والتواريخ والشروط المكتوبة في هذه الصورة الأكاديمية بدقة متناهية 100%.
2. كتابة النص العربي مرتباً بدون أخطاء إملائية.
3. إبراز التواريخ والمهل الزمنية والشروط بخط واضح ومحدد.
4. عدم اختلاق أي تاريخ أو نسبة أو معلومة لم ترد صراحة في الإعلان.
5. استخراج أي رابط أو بريد رسمي مكتوب في الصورة."""

    user_text = custom_prompt or "اقرأ هذا الإعلان الجامعي بدقة واكتب نصه الكامل مع المواعيد والتعليمات بالتفصيل:"

    payload = {
        "model": VISION_MODEL,
        "messages": [
            {"role": "system", "content": system_instruction},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_text},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{b64_data}"
                        }
                    }
                ]
            }
        ],
        "temperature": 0.1,
        "max_tokens": 1200
    }

    # تجربة المفتاح الأساسي ثم الاحتياطي
    keys_to_try = [PRIMARY_KEY, BACKUP_KEY]
    last_error = ""

    for key in keys_to_try:
        try:
            req = urllib.request.Request(
                API_ENDPOINT,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json"
                }
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                raw_extracted = data["choices"][0]["message"]["content"].strip()
                
                # تطبيق قاعدة استبدال الأرقام الخارجية ببيانات الآدمن
                sanitized_text = replace_external_contacts(raw_extracted)

                logger.info(f"✅ [Smart OCR] تم استخراج {len(sanitized_text)} حرف بنجاح فائق من الصورة.")
                return {
                    "ok": True,
                    "model": VISION_MODEL,
                    "text": sanitized_text,
                    "raw_text": raw_extracted
                }
        except Exception as e:
            last_error = str(e)
            logger.warning(f"ملاحظة أثناء استدعاء الرؤية البصرية عبر {key[:10]}...: {e}")

    return {
        "ok": False,
        "error": f"تعذر استخراج النص عبر Vision AI: {last_error}",
        "text": ""
    }
