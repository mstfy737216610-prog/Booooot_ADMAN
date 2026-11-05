"""
==============================================================================
المحرك المستقل لبوت تيليجرام (Independent Telegram Bot Engine)
==============================================================================
يعمل كخدمة مستقلة تماماً ومفصولة عن واجهة الويب وعن تويتر:
- يمكن تشغيله مباشرة عبر: python3 telegram/telegram_bot.py
- يراقب القنوات المعتمدة.
- يستقبل الصور ويحللها عبر Smart OCR وقراءة الرؤية البصرية.
- يصيغ الأخبار الجامعية بالذكاء الاصطناعي DeepSeek-V4-Flash.
- ينشر في قنوات النشر المحددة من المشرف.
==============================================================================
"""

import os
import sys
import logging
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

# تحميل متغيرات البيئة
from dotenv import load_dotenv
load_dotenv(str(BASE_DIR / ".env"))

import main as main_bot

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] TelegramBot: %(message)s"
)
logger = logging.getLogger("TelegramStandalone")

if __name__ == "__main__":
    logger.info("🚀 بدء تشغيل محرك تيليجرام الأكاديمي المستقل 24/7...")
    main_bot.main()
