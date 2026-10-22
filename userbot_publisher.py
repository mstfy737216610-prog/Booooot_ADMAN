#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
🤖 بوت النشر الآلي تيليجرام (Telegram Auto-Publisher UserBot)
================================================================================
المطور المشرف: @M_S_F_G (ID: 7607633343)
المحرك: Telethon MTProto Client + StringSession
مزود الذكاء الاصطناعي: DeepSeek-V4.1-Flash (https://api.hcnsec.cn/v1)
مفتاح الـ API: sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii
================================================================================
سير العمل الفني:
1. يراقب قنوات المصدر المحددة في sources.json عبر جلسة UserBot حقيقية (بدون الحاجة لرتبة مشرف).
2. يلتقط المنشورات الجديدة فور نزولها بجميع وسائطها (صور، فيديوهات، مستندات، PDF).
3. يرسل النص إلى https://api.hcnsec.cn/v1/chat/completions لإعادة صياغته باحترافية وتنسيقه للطلاب.
4. ينشر المنشور الجديد مع الوسائط الأصلية في القنوات المستهدفة المحددة بدقة متناهية.
================================================================================
"""

import os
import sys
import json
import time
import asyncio
import logging
import requests
from telethon import TelegramClient, events
from telethon.sessions import StringSession

# ----------------- إعدادات الاعتماد -----------------
API_ID = int(os.getenv("TELEGRAM_API_ID", "20123456"))  # من my.telegram.org
API_HASH = os.getenv("TELEGRAM_API_HASH", "abcdef0123456789abcdef0123456789")  # من my.telegram.org
STRING_SESSION = os.getenv("STRING_SESSION", "")  # كود جلسة Telethon المشفرة للعمل بالسحابة بدون ملفات
PHONE_NUMBER = os.getenv("TELEGRAM_PHONE", "+966500000000")

# إعدادات الـ API الخاص بكم
AI_BASE_URL = os.getenv("AI_BASE_URL", "https://api.hcnsec.cn/v1/chat/completions")
AI_API_KEY = os.getenv("AI_API_KEY", "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii")
AI_MODEL = os.getenv("PRIMARY_MODEL", "DeepSeek-V4.1-Flash")  # متاح: DeepSeek-V4-Flash, DeepSeek-V4-Pro, Qwen3.8-27B, glm-5.3

# القنوات المصدر والقنوات المستهدفة
SOURCE_CHANNELS = ["@KSU_News", "@moe_gov_sa"]
DESTINATION_CHANNELS = ["@MyUniversityChannel"]

# حساب المشرف
ADMIN_ID = int(os.getenv("ADMIN_ID", "7607633343"))
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "M_S_F_G").replace("@", "")

# إعلانات المنافسين لاستبدالها
AD_KEYWORDS = [
    "إعلان مدفوع", "حل واجبات", "بحوث تخرج", "خدمات طلابية", "مشاريع تخرج", "كتابة بحوث"
]
CUSTOM_STUDENT_AD = """🎓 خدمات طلابية معتمدة وأكاديمية متكاملة 🎓
يسرنا تقديم الدعم الأكاديمي الشامل للطلبة والباحثين:
• مساعدة في البحوث والمشاريع الأكاديمية
• التدقيق اللغوي وتنسيق الرسائل الجامعية
• تلخيص المحاضرات والمقررات الدراسية

📞 للتواصل والطلب مباشرة عبر المشرف: @M_S_F_G
✨ جودة أكاديمية، سرعة في الإنجاز، وأسعار مناسبة للطلاب!"""

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(message)s",
    level=logging.INFO
)

def process_post_with_ai(post_text: str) -> str:
    """
    إرسال النص إلى API الذكاء الاصطناعي الخاص بكم لإعادة صياغته باحترافية
    مع الحفاظ على المعنى والروابط الأكاديمية وإزالة ترويج القنوات الأخرى.
    """
    if not post_text or len(post_text.strip()) < 5:
        return post_text

    headers = {
        "Authorization": f"Bearer {AI_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": AI_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "أنت محرر محتوى طلابي وجامعي محترف. قم بإعادة صياغة المنشور التالي بأسلوب شيق وواضح "
                    "مع وضع عنوان بارز وتنسيق النقاط المهمة والمواعيد بدقة، واستخدام إيموجيات ملائمة، "
                    "مع الحفاظ على الروابط الأكاديمية الرسمية وعدم ذكر أي أسماء قنوات منافسة."
                )
            },
            {
                "role": "user",
                "content": post_text
            }
        ],
        "temperature": 0.4,
        "max_tokens": 800
    }

    try:
        response = requests.post(AI_BASE_URL, headers=headers, json=payload, timeout=25)
        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"].strip()
        else:
            logging.error(f"AI API Error ({response.status_code}): {response.text}")
            return post_text
    except Exception as e:
        logging.error(f"AI Connection Exception: {e}")
        return post_text

def is_competitor_ad(text: str) -> bool:
    """فحص إذا كان المنشور إعلاناً لمنافس لاستبداله بإعلان خدمات الطلاب الخاص بك"""
    if not text:
        return False
    return any(kw in text for kw in AD_KEYWORDS)

async def main():
    logging.info("=" * 60)
    logging.info("🚀 تشغيل بوت النشر الآلي (Telethon UserBot)")
    logging.info(f"النموذج: {AI_MODEL} | القنوات المصدر: {len(SOURCE_CHANNELS)}")
    logging.info("=" * 60)

    # إنشاء العميل بجلسة StringSession أو ملف محلي
    if STRING_SESSION:
        client = TelegramClient(StringSession(STRING_SESSION), API_ID, API_HASH)
    else:
        client = TelegramClient("userbot_session", API_ID, API_HASH)

    await client.start(phone=PHONE_NUMBER)
    me = await client.get_me()
    logging.info(f"✅ تم تسجيل دخول اليوزربوت بنجاح باسم: {me.first_name} (@{me.username or me.phone})")

    # إرسال إشعار للآدمن بجاهزية البوت
    try:
        await client.send_message(
            ADMIN_ID,
            f"✅ **تم تشغيل بوت النشر الآلي (UserBot) بنجاح!**\n\n"
            f"👤 الحساب: @{me.username or me.first_name}\n"
            f"🤖 نموذج الذكاء: `{AI_MODEL}`\n"
            f"📡 القنوات المصدر المراقبة: {len(SOURCE_CHANNELS)}\n"
            f"🎯 قنوات النشر الهدف: {len(DESTINATION_CHANNELS)}"
        )
    except Exception:
        pass

    # معالج الرسائل الجديدة من القنوات المحددة
    @client.on(events.NewMessage(chats=SOURCE_CHANNELS))
    async def handler(event):
        try:
            chat = await event.get_chat()
            chat_title = getattr(chat, 'title', str(event.chat_id))
            raw_text = event.message.message or ""
            media = event.message.media

            logging.info(f"📥 التقاط منشور جديد من: [{chat_title}]")

            # 1. فحص الإعلانات المنافسة
            if is_competitor_ad(raw_text):
                logging.info("🎯 كشف إعلان منافس -> استبدال بإعلان خدمات الطالب الخاصة بك")
                final_caption = CUSTOM_STUDENT_AD
            else:
                # 2. المعالجة بذكاء اصطناعي عبر API
                logging.info(f"🧠 جاري معالجة النص بواسطة {AI_MODEL}...")
                final_caption = process_post_with_ai(raw_text)

            # 3. النشر في كافة القنوات المستهدفة مع الوسائط
            for dest in DESTINATION_CHANNELS:
                try:
                    if media:
                        # تحميل ونشر الوسائط الأصلية (صور، فيديو، مستند، صوت) مع النص المعالج
                        await client.send_file(dest, media, caption=final_caption)
                    else:
                        await client.send_message(dest, final_caption)
                    logging.info(f"✅ تم النشر بنجاح في القناة المستهدفة: {dest}")
                except Exception as pub_err:
                    logging.error(f"❌ فشل النشر في {dest}: {pub_err}")

        except Exception as e:
            logging.error(f"خطأ أثناء معالجة الحدث: {e}")

    logging.info("👀 جاري مراقبة القنوات 24/7... اضغط Ctrl+C للإيقاف")
    await client.run_until_disconnected()

if __name__ == "__main__":
    asyncio.run(main())
