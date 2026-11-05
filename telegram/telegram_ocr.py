"""
==============================================================================
وحدة القراءة البصرية للصور والملصقات في تيليجرام (Telegram Vision OCR)
==============================================================================
حل المشكلة المحددة من المستخدم: «تلجرام يعمل لكن لا يستطيع قراءة الصور بدقة»
- ربط الصور المستلمة مباشرة بـ Smart OCR المستند على MiniCPM-V-4.7-35B-A3B.
- استخراج جداول الاختبارات، التقويم، الشروط، ونسب القبول والتحويل.
- استبدال أرقام المساعدة الخارجية بأرقام ومعرف الآدمن المعتمد تلقائياً.
==============================================================================
"""

import sys
import logging
from pathlib import Path
from typing import Any, Dict, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from ai_engine.smart_ocr import extract_academic_text_from_image, replace_external_contacts

logger = logging.getLogger("TelegramOCR")


def process_telegram_image_flyer(image_file_path: str, caption: str = "") -> Dict[str, Any]:
    """
    معالجة وتحليل صورة مستلمة من قناة أو رسالة تيليجرام واستخراج النص بدقة متناهية
    """
    logger.info(f"🖼️ [Telegram OCR] جاري تحليل الإعلان/الصورة الأكاديمية: {image_file_path}")
    
    ocr_res = extract_academic_text_from_image(
        image_file_path,
        custom_prompt="اقرأ كل ما في هذه الصورة بدقة واستخرج المواعيد والتواريخ والتعليمات كاملة:"
    )

    if not ocr_res.get("ok"):
        return ocr_res

    extracted_text = ocr_res.get("text", "")
    # دمج الكابشن إن وجد مع النص المستخرج
    full_academic_post = extracted_text
    if caption and len(caption.strip()) > 5:
        sanitized_cap = replace_external_contacts(caption.strip())
        full_academic_post = f"📌 {sanitized_cap}\n\n{extracted_text}"

    return {
        "ok": True,
        "full_text": full_academic_post,
        "extracted_ocr": extracted_text,
        "model": ocr_res.get("model")
    }
