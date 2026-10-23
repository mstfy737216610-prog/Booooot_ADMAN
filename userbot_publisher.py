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
import telethon.errors

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(message)s",
    level=logging.INFO
)

# ----------------- دالة تحميل ملف .env محلياً -----------------
def load_env_file():
    env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(env_file):
        try:
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip().strip("'\""))
        except Exception:
            pass
    return env_file

ENV_PATH = load_env_file()

def safe_int(val: Any, default: int = 0) -> int:
    if val is None:
        return default
    try:
        s = str(val).strip()
        if s.lstrip("-").isdigit():
            return int(s)
        digits_match = re.search(r'\b\d{5,10}\b', s)
        if digits_match:
            return int(digits_match.group(0))
        return default
    except Exception:
        return default

# ----------------- إعدادات الاعتماد الأساسية -----------------
_raw_api_id = os.getenv("TELEGRAM_API_ID", "20123456").strip()
_raw_session = os.getenv("STRING_SESSION", "").strip()

if not _raw_api_id.lstrip("-").isdigit():
    if len(_raw_api_id) > 20 and (not _raw_session or len(_raw_session) < 20):
        _raw_session = _raw_api_id
    API_ID = 20123456
else:
    API_ID = safe_int(_raw_api_id, 20123456)
if API_ID <= 0:
    API_ID = 20123456

API_HASH = os.getenv("TELEGRAM_API_HASH", "abcdef0123456789abcdef0123456789")
STRING_SESSION = _raw_session
PHONE_NUMBER = os.getenv("TELEGRAM_PHONE", "")

# إعدادات الـ API الخاص بكم
AI_BASE_URL = os.getenv("AI_BASE_URL", "https://api.hcnsec.cn/v1/chat/completions")
AI_API_KEY = os.getenv("AI_API_KEY", "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii")
AI_MODEL = os.getenv("PRIMARY_MODEL", "DeepSeek-V4.1-Flash")

TARGET_CHANNEL = os.getenv("TARGET_CHANNEL", "@jhdhhdcj")

# القنوات المصدر والقنوات المستهدفة المنفصلة (Multi-Source Mapping)
CHANNEL_MAPPINGS = [
    {
        "target": TARGET_CHANNEL,
        "sources": ["@KSU_News", "@moe_gov_sa", "@mstfyuhhh"],
        "name": "قناة النشر الرسمية (أ)"
    }
]

# تجميع كافة المصادر المراقبة تلقائياً من المخطط
SOURCE_CHANNELS = list(set([s for m in CHANNEL_MAPPINGS for s in m.get("sources", [])]))
if not SOURCE_CHANNELS:
    SOURCE_CHANNELS = ["@KSU_News", "@moe_gov_sa", "@mstfyuhhh"]
DESTINATION_CHANNELS = list(set([m["target"] for m in CHANNEL_MAPPINGS]))

# حساب المشرف
ADMIN_ID = safe_int(os.getenv("ADMIN_ID", "7607633343"), 7607633343)
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "M_S_F_G").replace("@", "")

# إعلانات المنافسين لاستبدالها (حل واجبات وكويزات بمقابل تجاري فقط)
AD_KEYWORDS = [
    "حل واجبات بمقابل", "حل واجبات واختبارات", "حل كويزات", "حل فاينل", "حل اسايمنت", "كتابة بحوث بمقابل", "عمل بحوث ورسائل بمقابل", "إعلان مدفوع للخدمات"
]
CUSTOM_STUDENT_AD = """🎓 خدمات طلابية معتمدة وأكاديمية متكاملة 🎓
يسرنا تقديم الدعم الأكاديمي الشامل للطلبة والباحثين:
• مساعدة في البحوث والمشاريع الأكاديمية
• التدقيق اللغوي وتنسيق الرسائل الجامعية
• تلخيص المحاضرات والمقررات الدراسية

📞 للتواصل والطلب مباشرة عبر المشرف: @M_S_F_G
✨ جودة أكاديمية، سرعة في الإنجاز، وأسعار مناسبة للطلاب!"""

def ensure_valid_credentials():
    """التحقق من صحة API_ID و API_HASH وسؤال المستخدم تفاعلياً إذا كانت قيم افتراضية"""
    global API_ID, API_HASH, PHONE_NUMBER

    raw_id_str = str(API_ID).strip()
    raw_hash_str = str(API_HASH).strip()

    is_placeholder = (
        raw_id_str in ("20123456", "0", "") or
        raw_hash_str in ("abcdef0123456789abcdef0123456789", "0123456789abcdef0123456789abcdef", "")
    )

    if is_placeholder:
        print("\n" + "=" * 65)
        print("🔑 إعداد بيانات الاعتماد الخاصة بك في تيليجرام (مطلوب لأول مرة فقط)")
        print("=" * 65)
        print("⚠️ تنبيه: القيمة الحالية لـ API_ID هي قيمة تجريبية، ويرفضها تيليجرام.")
        print("للحصول على بياناتك الحقيقية مجاناً في دقيقة واحدة:")
        print("1. افتح المتصفح وادخل: https://my.telegram.org")
        print("2. سجّل الدخول برقم هاتفك وأدخل الكود.")
        print("3. اضغط على 'API development tools'.")
        print("4. انسخ App api_id و App api_hash.")
        print("-" * 65)

        while True:
            inp_id = input("👉 1. أدخل API_ID الخاص بك (أرقام فقط): ").strip()
            if inp_id.isdigit() and len(inp_id) >= 5:
                API_ID = int(inp_id)
                break
            print("❌ يجب إدخال أرقام صحيحة لـ API_ID (مثال: 28491823)")

        while True:
            inp_hash = input("👉 2. أدخل API_HASH الخاص بك: ").strip()
            if len(inp_hash) >= 20:
                API_HASH = inp_hash
                break
            print("❌ الـ API_HASH غير صحيح (يجب أن يكون شفرة نصية من my.telegram.org)")

        inp_phone = input("👉 3. أدخل رقم هاتفك مع مفتاح الدولة (مثال: +966501234567): ").strip()
        if inp_phone:
            PHONE_NUMBER = inp_phone

        # حفظ تلقائي في ملف .env
        try:
            with open(ENV_PATH, "a+", encoding="utf-8") as f:
                f.write(f"\nTELEGRAM_API_ID={API_ID}\n")
                f.write(f"TELEGRAM_API_HASH={API_HASH}\n")
                if PHONE_NUMBER:
                    f.write(f"TELEGRAM_PHONE={PHONE_NUMBER}\n")
            print(f"✅ تم حفظ الإعدادات تلقائياً في {ENV_PATH} ولن تحتاج لإدخالها ثانية.")
        except Exception as e:
            logging.warning(f"تعذر الحفظ في .env: {e}")

        print("=" * 65 + "\n")

def process_post_with_ai(post_text: str) -> str:
    """معالجة النص عبر API الذكاء الاصطناعي الخاص بكم حصرياً"""
    if not post_text or not post_text.strip():
        return ""

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
                    "أنت محرر محتوى تعليمي جامعي متميز. مهمتك إعادة صياغة المنشور التالي بأسلوب شيق وواضح "
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

    endpoint = AI_BASE_URL.strip().rstrip("/")
    if not endpoint.endswith("/chat/completions"):
        endpoint += "/chat/completions"

    try:
        response = requests.post(endpoint, headers=headers, json=payload, timeout=25)
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
    ensure_valid_credentials()

    logging.info("=" * 60)
    logging.info("🚀 تشغيل بوت النشر الآلي (Telethon UserBot)")
    logging.info(f"النموذج: {AI_MODEL} | القنوات المصدر: {len(SOURCE_CHANNELS)}")
    logging.info("=" * 60)

    # إعداد بصمة الجهاز التلقائية لتظهر في إشعارات تيليجرام كـ (متصفح: Chrome 154 on Android)
    device_model = "Chrome 154 on Android"
    system_version = "Android 14"
    app_version = "1.0.0"
    lang_code = "ar"
    system_lang_code = "ar"

    if STRING_SESSION:
        client = TelegramClient(
            StringSession(STRING_SESSION),
            API_ID,
            API_HASH,
            device_model=device_model,
            system_version=system_version,
            app_version=app_version,
            lang_code=lang_code,
            system_lang_code=system_lang_code
        )
    else:
        client = TelegramClient(
            "userbot_session",
            API_ID,
            API_HASH,
            device_model=device_model,
            system_version=system_version,
            app_version=app_version,
            lang_code=lang_code,
            system_lang_code=system_lang_code
        )

    try:
        await client.start(phone=PHONE_NUMBER if PHONE_NUMBER else None)
    except telethon.errors.rpcerrorlist.ApiIdInvalidError:
        print("\n" + "!" * 65)
        print("❌ خطأ من تيليجرام: ApiIdInvalidError")
        print("الـ API_ID أو API_HASH غير صحيح أو يحتوي على فراغات!")
        print("💡 الحل:")
        print("1. افتح https://my.telegram.org وسجل الدخول.")
        print("2. انسخ App api_id و App api_hash بدقة.")
        print(f"3. افتح ملف {ENV_PATH} وعدله، أو احذف الملف وأعد تشغيل السكريبت.")
        print("!" * 65 + "\n")
        sys.exit(1)

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

            # 3. توجيه المنشور فقط للقنوات الهدف المخصصة لمتابعة هذا المصدر (Multi-Source Mapping)
            chat_username = f"@{chat.username}" if getattr(chat, 'username', None) else ""
            matched_targets = []
            for m in CHANNEL_MAPPINGS:
                for s in m.get("sources", []):
                    s_clean = s.lower().replace("@", "").strip()
                    if (chat_username and s_clean in chat_username.lower()) or (s in chat_title) or (str(event.chat_id) in s):
                        matched_targets.append(m["target"])
                        break

            if not matched_targets:
                matched_targets = DESTINATION_CHANNELS

            for dest in set(matched_targets):
                try:
                    if media:
                        # تحميل ونشر الوسائط الأصلية (صور، فيديو، مستند، صوت) مع النص المعالج
                        await client.send_file(dest, media, caption=final_caption)
                    else:
                        await client.send_message(dest, final_caption)
                    logging.info(f"✅ تم النشر بنجاح في القناة المخصصة: {dest}")
                except Exception as pub_err:
                    logging.error(f"❌ فشل النشر في {dest}: {pub_err}")

        except Exception as e:
            logging.error(f"خطأ أثناء معالجة الحدث: {e}")

    logging.info("👀 جاري مراقبة القنوات 24/7... اضغط Ctrl+C للإيقاف")
    await client.run_until_disconnected()

if __name__ == "__main__":
    asyncio.run(main())
