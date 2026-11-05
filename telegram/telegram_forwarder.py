"""
==============================================================================
وحدة النشر وإعادة التوجيه الأكاديمي لتيليجرام (Telegram Forwarder & Publisher)
==============================================================================
1. صياغة المنشور الأكاديمي بكامل تفاصيله وفق أسلوب ممثل الدفعة.
2. عدم اقتطاع أي جزء من المنشور، وإبراز المواعيد بخط عريض <b>...</b>.
3. التحقق من عدم التكرار عبر ذاكرة الذكاء الاصطناعي (ai_memory).
4. استبدال أرقام المساعدة والقروبات بمعرف المشرف تلقائياً.
==============================================================================
"""

import re
import sys
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from ai_engine.ai_memory import is_post_duplicate, record_post_processed
from ai_engine.smart_ocr import replace_external_contacts

logger = logging.getLogger("TelegramForwarder")


def format_academic_telegram_post(raw_text: str, source_title: str = "", university_name: str = "") -> str:
    """
    تنسيق المنشور الأكاديمي بأعلى معايير الرقي والأمانة المهنية:
    - إبراز المواعيد والتواريخ بخط عريض <b>...</b>
    - استبدال أرقام التواصل الخارجية
    - الاحتفاظ بكامل نص الخبر والشروط دون أي حذف أو اقتطاع
    """
    cleaned = replace_external_contacts(raw_text.strip())

    # إبراز التواريخ والأيام (الأحد، الإثنين... التواريخ 144X / 202X)
    date_pattern = r"(\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}/\d{1,2}/\d{1,2}|يوم (?:الأحد|الإثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت))\b)"
    formatted = re.sub(date_pattern, r"<b>\1</b>", cleaned)

    header = f"🎓 <b>{university_name or 'تحديث أكاديمي معتمد'}</b>"
    if source_title:
        header += f" | <i>{source_title}</i>"

    footer = "\n\n━━━━━━━━━━━━━━━━━━━━\n✨ <i>صوت الطالب والزميل الأكاديمي الموثوق</i> 🌸"
    return f"{header}\n\n{formatted}{footer}"
