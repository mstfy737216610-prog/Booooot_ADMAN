import type { BotConfig, SourceItem } from '../types/index.ts';

/**
 * Validates a Telegram API ID (typically a 6-9 digit integer from my.telegram.org)
 */
export function validateApiId(apiId: string): { valid: boolean; error?: string } {
  const trimmed = apiId.trim();
  if (!trimmed) {
    return { valid: false, error: 'الرجاء إدخال API ID من my.telegram.org' };
  }
  if (!/^\d{5,10}$/.test(trimmed)) {
    return { valid: false, error: 'يجب أن يكون API ID رقماً صحيحاً مكوناً من 5 إلى 10 أرقام' };
  }
  return { valid: true };
}

/**
 * Validates a Telegram API HASH (32 character hex string from my.telegram.org)
 */
export function validateApiHash(apiHash: string): { valid: boolean; error?: string } {
  const trimmed = apiHash.trim();
  if (!trimmed) {
    return { valid: false, error: 'الرجاء إدخال API HASH من my.telegram.org' };
  }
  if (!/^[a-fA-F0-9]{32}$/.test(trimmed)) {
    return { valid: false, error: 'API HASH يجب أن يتكون من 32 خانة بنظام الست عشري (Hex)' };
  }
  return { valid: true };
}

/**
 * Validates a Telethon or Pyrogram StringSession
 */
export function validateStringSession(session: string): { valid: boolean; library?: 'telethon' | 'pyrogram'; error?: string } {
  const trimmed = session.trim();
  if (!trimmed) {
    return { valid: false, error: 'جلسة StringSession فارغة' };
  }
  // Telethon StringSessions typically start with '1' and are base64-like, ~350-400 chars
  // Pyrogram StringSessions are longer (~300-360 chars, base64)
  if (trimmed.length < 50) {
    return { valid: false, error: 'كود الجلسة قصير جداً وغير مكتمل' };
  }
  const library = trimmed.startsWith('1') && trimmed.length > 300 ? 'telethon' : 'pyrogram';
  return { valid: true, library };
}

/**
 * Answers the user's core question:
 * "لماذا لا يستطيع البوت العادي قراءة الرسائل من القنوات؟"
 */
export function getBotVsUserBotComparison(): {
  botApiReasons: string[];
  userBotAdvantages: string[];
  widgetExplanation: string;
} {
  return {
    botApiReasons: [
      'سياسة الخصوصية الرسمية لتيليجرام (Privacy Mode): بوتات BotFather لا يمكنها التجسس على القنوات العامة أو المجموعات ولا تستلم تحديثات getUpdates إلا إذا كانت مشرفة (Admin).',
      'البوت العادي لا يملك حساب مستخدم حقيقي (User Account) ولا يستطيع النقر على "انضمام" أو تصفح القنوات كعضو عادي.',
      'إذا كانت القناة مغلقة أو لا تمنح البوت صلاحية قراءة الرسائل، يرجع سيرفر تيليجرام خطأ Chat_Admin_Required.',
    ],
    userBotAdvantages: [
      'يعمل بحساب حقيقي عبر MTProto Client (Telethon / Pyrogram)، كأنه تطبيق تيليجرام حقيقي يعمل على مدار 24 ساعة.',
      'يستطيع قراءة وسحب أي منشور من أي قناة عامة أو خاصة هو عضو فيها دون الحاجة لرتبة مشرف.',
      'يلتقط الميديا بدقتها الكاملة (صور فائقة الجودة، فيديوهات MP4، ملفات PDF، ومستندات) فور نزولها ويحفظها.',
      'يقوم بالمعالجة الفورية عبر API الذكاء الاصطناعي (DeepSeek-V4.1-Flash) وإعادة النشر فوراً إلى القنوات الهدف.',
    ],
    widgetExplanation: 'تسجيل الدخول عبر Telegram Widget (مثل إشعار virtualsms.de) هو تفويض ويب (OAuth Web Login) يمنح الموقع هويتك ومعرفك فقط، لكنه لا ينشئ جلسة تحكم تلقائي للمنشورات؛ بينما اليوزربوت (StringSession) يمنح السكريبت تصريحاً مشفراً للعمل كبوت نشر آلي 24/7.',
  };
}

/**
 * Generates the Python script for Telethon UserBot with AI integration
 */
export function generateTelethonUserBotCode(config: BotConfig, sources: SourceItem[]): string {
  const targetChannels = config.targetChannels && config.targetChannels.length > 0
    ? config.targetChannels
    : ['@MyUniversityChannel'];
  const targetsJson = JSON.stringify(targetChannels, null, 2);

  const monitoredSources = sources.filter(s => s.enabled && s.type === 'telegram').map(s => s.target);
  const sourcesJson = JSON.stringify(monitoredSources.length > 0 ? monitoredSources : ['@KSU_News', '@moe_gov_sa'], null, 2);

  return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
🤖 بوت النشر الآلي تيليجرام (Telegram Auto-Publisher UserBot)
================================================================================
المطور المشرف: @${config.adminUsername} (ID: ${config.adminId})
المحرك: Telethon MTProto Client + StringSession
مزود الذكاء الاصطناعي: ${config.ai.primaryModel} (${config.ai.apiBase})
مفتاح الـ API: ${config.ai.apiKey ? config.ai.apiKey.substring(0, 8) + '...' : 'Configured'}
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

# ----------------- إعدادات الاتصال -----------------
API_ID = ${config.telethon.apiId ? Number(config.telethon.apiId) : 20123456}
API_HASH = "${config.telethon.apiHash || 'YOUR_API_HASH'}"
STRING_SESSION = "${config.telethon.stringSession || ''}"  # كود جلسة Telethon المشفرة للعمل بدون ملفات
PHONE_NUMBER = "${config.telethon.phoneNumber || '+966500000000'}"

# إعدادات الذكاء الاصطناعي الخاص بكم
AI_BASE_URL = "${config.ai.apiBase}/chat/completions"
AI_API_KEY = "${config.ai.apiKey}"
AI_MODEL = "${config.ai.primaryModel}"  # DeepSeek-V4.1-Flash / DeepSeek-V4-Flash / Qwen3.8-27B / glm-5.3

# القنوات المراقبة والمستهدفة
SOURCE_CHANNELS = ${sourcesJson}
DESTINATION_CHANNELS = ${targetsJson}

# معرف الآدمن للتنبيهات
ADMIN_ID = ${config.adminId || 7607633343}
ADMIN_USERNAME = "@${config.adminUsername || 'M_S_F_G'}"

# الكلمات المفتاحية لإعلانات المنافسين لاستبدالها
AD_KEYWORDS = ${JSON.stringify(config.adReplacement.adDetectionKeywords, null, 2)}
CUSTOM_STUDENT_AD = """${config.adReplacement.customStudentAd}"""

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

def ensure_valid_credentials():
    """التحقق من صحة API_ID و API_HASH وسؤال المستخدم تفاعلياً إذا كانت قيم افتراضية"""
    global API_ID, API_HASH, PHONE_NUMBER

    raw_id_str = str(API_ID).strip()
    raw_hash_str = str(API_HASH).strip()

    is_placeholder = (
        raw_id_str in ("20123456", "0", "") or
        raw_hash_str in ("abcdef0123456789abcdef0123456789", "0123456789abcdef0123456789abcdef", "YOUR_API_HASH", "")
    )

    if is_placeholder:
        print("\\n" + "=" * 65)
        print("🔑 مطلوب إدخال بيانات تيليجرام الخاصة بك (API_ID & API_HASH)")
        print("=" * 65)
        print("⚠️ تنبيه: القيمة الحالية لـ API_ID تجريبية ويرفضها سيرفر تيليجرام.")
        print("احصل على بياناتك الحقيقية مجاناً في دقيقة واحدة من موقع تيليجرام الرسمي:")
        print("👉 https://my.telegram.org (سجل دخول واختر API development tools)")
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
            print("❌ يجب إدخال كود الـ API_HASH من my.telegram.org")

        inp_phone = input("👉 3. أدخل رقم هاتفك مع مفتاح الدولة (مثال: +966501234567): ").strip()
        if inp_phone:
            PHONE_NUMBER = inp_phone

        # حفظ تلقائي في ملف .env
        env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
        try:
            with open(env_file, "a+", encoding="utf-8") as f:
                f.write(f"\\nTELEGRAM_API_ID={API_ID}\\n")
                f.write(f"TELEGRAM_API_HASH={API_HASH}\\n")
                if PHONE_NUMBER:
                    f.write(f"TELEGRAM_PHONE={PHONE_NUMBER}\\n")
            print(f"✅ تم حفظ الإعدادات تلقائياً في {env_file} ولن يطلبها ثانية.")
        except Exception:
            pass

        print("=" * 65 + "\\n")

async def main():
    ensure_valid_credentials()

    logging.info("=" * 60)
    logging.info("🚀 تشغيل بوت النشر الآلي (Telethon UserBot)")
    logging.info(f"النموذج: {AI_MODEL} | القنوات المصدر: {len(SOURCE_CHANNELS)}")
    logging.info("=" * 60)

    # إنشاء العميل بجلسة StringSession أو ملف محلي
    if STRING_SESSION:
        client = TelegramClient(StringSession(STRING_SESSION), API_ID, API_HASH)
    else:
        client = TelegramClient("userbot_session", API_ID, API_HASH)

    try:
        await client.start(phone=PHONE_NUMBER if PHONE_NUMBER else None)
    except Exception as auth_err:
        if "ApiIdInvalidError" in str(type(auth_err)) or "ApiIdInvalid" in str(auth_err):
            print("\\n" + "!" * 65)
            print("❌ خطأ من تيليجرام: ApiIdInvalidError")
            print("الـ API_ID أو API_HASH غير صحيح أو يحتوي على فراغات إضافية!")
            print("💡 الحل:")
            print("1. افتح https://my.telegram.org وسجل الدخول.")
            print("2. انسخ App api_id و App api_hash بدقة.")
            print("3. احذف ملف .env وأعد تشغيل السكريبت لإدخالهما مجدداً.")
            print("!" * 65 + "\\n")
            sys.exit(1)
        raise auth_err

    me = await client.get_me()
    logging.info(f"✅ تم تسجيل دخول اليوزربوت بنجاح باسم: {me.first_name} (@{me.username or me.phone})")

    # إرسال إشعار للآدمن بجاهزية البوت
    try:
        await client.send_message(
            ADMIN_ID,
            f"✅ **تم تشغيل بوت النشر الآلي (UserBot) بنجاح!**\\n\\n"
            f"👤 الحساب: @{me.username or me.first_name}\\n"
            f"🤖 نموذج الذكاء: \`{AI_MODEL}\`\\n"
            f"📡 القنوات المصدر المراقبة: {len(SOURCE_CHANNELS)}\\n"
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
`;
}

/**
 * Generates the full Pyrogram V2 dual-client bot script with FSM Auth & Scraping Engine
 */
export function generatePyrogramFSMUserBotCode(config: BotConfig, sources: SourceItem[]): string {
  const targetChannels = config.targetChannels && config.targetChannels.length > 0
    ? config.targetChannels
    : ['@MyUniversityChannel'];
  const targetsJson = JSON.stringify(targetChannels, null, 2);

  const monitoredSources = sources.filter(s => s.enabled && s.type === 'telegram').map(s => s.target);
  const sourcesJson = JSON.stringify(monitoredSources.length > 0 ? monitoredSources : ['@KSU_News', '@moe_gov_sa'], null, 2);

  return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
🤖 بوت النشر الأكاديمي الذكي المتقدم (Pyrogram V2 + FSM Control + UserBot)
================================================================================
المشرف المعتمد: @${config.adminUsername || 'M_S_F_G'} (ID: ${config.adminId || '7607633343'})
توكن البوت: ${config.botToken}
المحرك: Pyrogram v2.0+ (Dual Bot + UserBot Client)
نظام الحالات: Finite State Machine (FSM) مدمج داخل الشات
الذكاء الاصطناعي: ${config.ai.primaryModel} (Base: ${config.ai.apiBase})
================================================================================
"""

import os
import sys
import json
import time
import asyncio
import logging
import re
from typing import Dict, Any, Optional, List

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    level=logging.INFO
)
logger = logging.getLogger("PyrogramPublisher")

from pyrogram import Client, filters, enums
from pyrogram.types import (
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    CallbackQuery,
    Message
)
from pyrogram.errors import (
    SessionPasswordNeeded,
    PhoneCodeInvalid,
    PhoneCodeExpired,
    PasswordHashInvalid,
    FloodWait
)
import aiohttp

BOT_TOKEN = "${config.botToken}"
ADMIN_ID = ${config.adminId || 7607633343}
ADMIN_USERNAME = "${config.adminUsername || 'M_S_F_G'}".replace("@", "")
API_ID = ${config.telethon.apiId ? Number(config.telethon.apiId) : 20123456}
API_HASH = "${config.telethon.apiHash || 'abcdef0123456789abcdef0123456789'}"
STRING_SESSION = "${config.telethon.stringSession || ''}"

AI_BASE_URL = "${config.ai.apiBase}".rstrip("/")
AI_API_KEY = "${config.ai.apiKey}"
PRIMARY_MODEL = "${config.ai.primaryModel}"

TARGET_CHANNELS = ${targetsJson}
SOURCE_CHANNELS = ${sourcesJson}

CUSTOM_STUDENT_AD = """${config.adReplacement.customStudentAd}"""
AD_KEYWORDS = ${JSON.stringify(config.adReplacement.adDetectionKeywords, null, 2)}

# FSM States
class States:
    IDLE = "IDLE"
    AWAITING_PHONE = "AWAITING_PHONE"
    AWAITING_CODE = "AWAITING_CODE"
    AWAITING_2FA = "AWAITING_2FA"

user_fsm: Dict[int, Dict[str, Any]] = {}

bot_app = Client("controller_bot", bot_token=BOT_TOKEN, api_id=API_ID, api_hash=API_HASH, in_memory=True)
userbot_app: Optional[Client] = None

def make_inline_menu():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("📊 الإحصائيات", callback_data="status"), InlineKeyboardButton("🔐 تسجيل الدخول (FSM)", callback_data="login")],
        [InlineKeyboardButton("📥 القنوات المصدرية", callback_data="sources"), InlineKeyboardButton("📤 قنوات النشر", callback_data="targets")],
        [InlineKeyboardButton("🤖 اختيار النموذج", callback_data="ai_models"), InlineKeyboardButton("⚡ فحص السرعة", callback_data="ping")],
        [InlineKeyboardButton("📢 إعلان خدماتك", callback_data="ad_view"), InlineKeyboardButton("🚪 تسجيل الخروج", callback_data="logout")]
    ])

@bot_app.on_message(filters.command(["start", "help"]) & filters.private)
async def start_handler(c: Client, m: Message):
    if m.from_user.id != ADMIN_ID:
        await m.reply_text("⛔ عذراً، البوت مخصص للمشرف المعتمد فقط.")
        return
    await m.reply_text("👋 أهلاً بك في لوحة تحكم Pyrogram الذكية!", reply_markup=make_inline_menu())

# تشغيل البوت واليوزربوت
async def main():
    await bot_app.start()
    logger.info("🤖 عميل البوت التفاعلي يعمل الآن...")
    if STRING_SESSION:
        global userbot_app
        userbot_app = Client("ub_session", session_string=STRING_SESSION, api_id=API_ID, api_hash=API_HASH, in_memory=True)
        await userbot_app.start()
        logger.info("✅ تم بدء اليوزربوت بنجاح لمراقبة القنوات.")
    await asyncio.Event().wait()

if __name__ == "__main__":
    asyncio.run(main())
`;
}

/**
 * Generates StringSession Extraction Script
 */
export function generateStringSessionScript(): string {
  return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
استخراج كود StringSession لتيليجرام (Telethon / Pyrogram)
لتشغيل اليوزربوت في السحابة دون الحاجة لملفات .session
"""
from telethon.sync import TelegramClient
from telethon.sessions import StringSession

api_id = int(input("أدخل API_ID الخاص بك من my.telegram.org: "))
api_hash = input("أدخل API_HASH الخاص بك: ").strip()

with TelegramClient(StringSession(), api_id, api_hash) as client:
    print("\\n" + "=" * 60)
    print("✅ تم إنشاء الجلسة بنجاح! هذا هو كود STRING_SESSION الخاص بك:")
    print("=" * 60 + "\\n")
    print(client.session.save())
    print("\\n" + "=" * 60)
    print("انسخ الكود أعلاه وضعه في ملف .env أو في لوحة التحكم تحت بند STRING_SESSION")
`;
}

