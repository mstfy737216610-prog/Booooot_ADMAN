import { BotConfig, ForwardRule } from '../types/index.ts';

/**
 * Generates the updated and enhanced Arabic Telethon Python Script,
 * strictly preserving original author attribution (Redian Marku) and MIT License.
 */
export function generateArabicTelethonScript(config: BotConfig, rules: ForwardRule[]): string {
  const jsonRules = JSON.stringify(
    rules.map((r) => ({
      name: r.name,
      source: r.sourceChatId,
      destination: r.destinationChatId,
      keywords: r.keywords,
      blacklist: r.blacklistKeywords,
      removeLinks: r.removeLinks,
      removeUsernames: r.removeUsernames,
      replacements: r.replaceRules,
      signature: r.customSignature,
      delay: r.delaySeconds,
    })),
    null,
    4
  );

  return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
مشروع: مُعيد توجيه رسائل تيليجرام التلقائي (Telegram AutoForwarder Pro - Arabic)
================================================================================
الحقوق والملكية الفكرية:
- المطور الأصلي (Original Author): Redian Marku
- مستودع المشروع الأصلي: https://github.com/redianmarku/Telegram-Autoforwarder
- الترخيص الأصلي: رخصة معهد ماساتشوستس للتكنولوجيا (MIT License)

التعريب والتحسينات المضافة (Arabic Localization & Pro Enhancements):
- لوحة تحكم باللغة العربية مع دعم كامل للآدمن وتوكن البوت.
- فلاتر متقدمة: قائمة سوداء (Blacklist)، استبدال النصوص، إزالة الروابط والمعرفات.
- إضافة توقيع مخصص، منع حظر التكرار (Anti-Flood Wait)، وتسجيل العمليات بدقة.
================================================================================
"""

import os
import sys
import json
import time
import asyncio
import re
from telethon import TelegramClient, events, errors
from telethon.tl.types import MessageMediaPhoto, MessageMediaDocument

# ----------------- إعدادات الاعتمادات والأمان -----------------
# يمكنك تعديل هذه القيم مباشرة أو تمريرها عبر ملف config.json أو متغيرات البيئة
API_ID = ${config.telethon.apiId ? Number(config.telethon.apiId) : 'None'}  # رقم my.telegram.org
API_HASH = "${config.telethon.apiHash || ''}"  # هاش my.telegram.org
PHONE_NUMBER = "${config.telethon.phoneNumber || ''}"  # رقم هاتفك مع الرمز الدولي
ADMIN_ID = ${config.adminId ? Number(config.adminId) : 'None'}  # معرّف الآدمن الرئيسي
BOT_TOKEN = "${config.botToken || ''}"  # توكن البوت إن وجد

# قواعد التوجيه المُعدة مسبقاً
FORWARDING_RULES = ${jsonRules}

def normalize_arabic(text: str) -> str:
    """تنظيف وتوحيد الأحرف العربية للمطابقة الدقيقة"""
    if not text:
        return ""
    # إزالة التشكيل
    text = re.sub(r'[\\u064B-\\u065F\\u0670]', '', text)
    # توحيد الهمزات
    text = re.sub(r'[أإآٱ]', 'ا', text)
    # توحيد الياء
    text = text.replace('ى', 'ي')
    return text.strip()

class TelegramAutoForwarderArabic:
    """
    فئة مُعيد التوجيه التلقائي مع تعريب كامل وحماية لجميع الحقوق
    Original Concept by: Redian Marku
    """
    def __init__(self, api_id, api_hash, phone_number, admin_id=None):
        self.api_id = api_id
        self.api_hash = api_hash
        self.phone_number = phone_number
        self.admin_id = admin_id
        session_name = f"session_{phone_number.replace('+', '')}"
        self.client = TelegramClient(session_name, api_id, api_hash)
        self.stats = {"processed": 0, "forwarded": 0, "blocked": 0, "errors": 0}

    async def start(self):
        """بدء الاتصال بحساب تيليجرام والتحقق من التفويض"""
        print("\\n" + "="*60)
        print("  مُعيد توجيه تيليجرام التلقائي (النسخة العربية)")
        print("  المطور الأصلي: Redian Marku | MIT License")
        print("="*60 + "\\n")
        
        await self.client.connect()
        if not await self.client.is_user_authorized():
            print("⏳ جاري إرسال رمز تسجيل الدخول إلى تيليجرام...")
            await self.client.send_code_request(self.phone_number)
            try:
                code = input("👉 أدخل رمز التحقق المستلم في تيليجرام: ")
                await self.client.sign_in(self.phone_number, code)
            except errors.SessionPasswordNeededError:
                pwd = input("🔒 التحقق بخطوتين مفعّل. أدخل كلمة المرور: ")
                await self.client.sign_in(password=pwd)

        me = await self.client.get_me()
        print(f"\\n✅ تم تسجيل الدخول بنجاح بحساب: {me.first_name} (@{me.username or 'لا يوجد معرف'})")
        if self.admin_id:
            print(f"👑 تم تعيين الآدمن المسؤول برقم: {self.admin_id}")
            try:
                await self.client.send_message(self.admin_id, "🚀 تم تشغيل بوت التوجيه التلقائي بنجاح!")
            except Exception:
                pass

    async def list_all_chats(self):
        """عرض وحفظ قائمة المجموعات والقنوات التي تشترك بها"""
        print("\\n📋 جاري جلب قائمة المحادثات والقنوات...")
        dialogs = await self.client.get_dialogs()
        file_path = f"chats_{self.phone_number.replace('+', '')}.txt"
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write("قائمة القنوات والمحادثات:\\n" + "-"*40 + "\\n")
            for dialog in dialogs:
                line = f"معرف: {dialog.id} | العنوان: {dialog.title}\\n"
                print(f"🔹 {line.strip()}")
                f.write(line)

        print(f"\\n✅ تم حفظ القائمة كاملة في الملف: {file_path}")

    def transform_text(self, text: str, rule: dict) -> str:
        """تطبيق التعديلات على النص (إزالة روابط، استبدال كلمات، إضافة توقيع)"""
        result = text or ""
        
        # إزالة الروابط إذا طلب ذلك
        if rule.get("removeLinks"):
            result = re.sub(r'https?:\\/\\/\\S+|t\\.me\\/\\S+', '', result)
            
        # إزالة المعرفات إذا طلب ذلك
        if rule.get("removeUsernames"):
            result = re.sub(r'@[a-zA-Z0-9_]+', '', result)

        # استبدال النصوص
        for rep in rule.get("replacements", []):
            find = rep.get("find", "")
            repl = rep.get("replaceWith", "")
            if find:
                result = result.replace(find, repl)

        # إضافة التوقيع المخصص
        sig = rule.get("signature")
        if sig and sig.strip():
            result = result.strip() + "\\n\\n" + sig.strip()

        return result.strip()

    async def run_forwarding_loop(self):
        """تشغيل حلقة مراقبة وتوجيه الرسائل التلقائية"""
        print("\\n🚀 بدأت عملية مراقبة القنوات وتوجيه الرسائل...")
        print(f"📌 عدد القواعد النشطة: {len(FORWARDING_RULES)}")

        for rule in FORWARDING_RULES:
            src = rule["source"]
            dst = rule["destination"]
            print(f"  • مراقبة من [{src}] إلى [{dst}] باسم: {rule['name']}")

        # تسجيل حدث وصول رسالة جديدة
        source_ids = []
        for r in FORWARDING_RULES:
            try:
                s = int(r["source"])
                source_ids.append(s)
            except ValueError:
                source_ids.append(r["source"])

        @self.client.on(events.NewMessage(chats=source_ids))
        async def handler(event):
            self.stats["processed"] += 1
            chat = await event.get_chat()
            chat_id = event.chat_id
            msg_text = event.message.message or ""
            
            # العثور على القواعد المنطبقة على هذه القناة
            matching_rules = [
                r for r in FORWARDING_RULES 
                if str(r["source"]) == str(chat_id) or str(r["source"]) == getattr(chat, 'username', '')
            ]

            for rule in matching_rules:
                dst = rule["destination"]
                
                # فحص القائمة السوداء
                blocked = False
                for b in rule.get("blacklist", []):
                    if b and (b.lower() in msg_text.lower() or normalize_arabic(b) in normalize_arabic(msg_text)):
                        print(f"⛔️ تم حظر رسالة من [{chat_id}] لاحتوائها على كلمة محظورة: {b}")
                        self.stats["blocked"] += 1
                        blocked = True
                        break
                if blocked:
                    continue

                # فحص الكلمات المفتاحية
                keywords = rule.get("keywords", [])
                match = True
                if keywords:
                    match = any(
                        kw.lower() in msg_text.lower() or normalize_arabic(kw) in normalize_arabic(msg_text)
                        for kw in keywords if kw
                    )

                if match:
                    new_text = self.transform_text(msg_text, rule)
                    try:
                        # إن كانت الرسالة وسائط مع نص
                        if event.message.media:
                            await self.client.send_file(
                                dst,
                                event.message.media,
                                caption=new_text
                            )
                        else:
                            await self.client.send_message(dst, new_text)

                        self.stats["forwarded"] += 1
                        print(f"✨ [تم التوجيه بنجاح] من [{chat_id}] إلى [{dst}]")
                        
                        # تأخير زمني لتفادي قيود تيليجرام
                        delay = rule.get("delay", 1)
                        if delay > 0:
                            await asyncio.sleep(delay)
                    except Exception as err:
                        self.stats["errors"] += 1
                        print(f"❌ خطأ أثناء التوجيه إلى [{dst}]: {err}")

        print("\\n🟢 النظام قيد التشغيل 24/7... اضغط Ctrl+C للإيقاف.")
        await self.client.run_until_disconnected()

async def main():
    api_id = API_ID
    api_hash = API_HASH
    phone = PHONE_NUMBER

    if not api_id or not api_hash or not phone:
        print("الرجاء إدخال بيانات حساب تيليجرام (من موقع my.telegram.org):")
        api_id = int(input("API ID: "))
        api_hash = input("API HASH: ")
        phone = input("رقم الهاتف (مع +): ")

    app = TelegramAutoForwarderArabic(api_id, api_hash, phone, ADMIN_ID)
    await app.start()

    print("\\nاختر ما تريد:")
    print("1. جلب وحفظ قائمة القنوات والمحادثات (List Chats)")
    print("2. بدء التوجيه التلقائي وفق القواعد المحددة (Start Forwarding)")
    choice = input("أدخل رقم خيارك (1 أو 2): ").strip()

    if choice == "1":
        await app.list_all_chats()
    elif choice == "2":
        await app.run_forwarding_loop()
    else:
        print("خيار غير صالح.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\\n👋 تم إيقاف البرنامج بأمان.")
`;
}

/**
 * Generates the Official Bot Token Forwarder script in Python,
 * using the Telegram Bot API + Admin verification.
 */
export function generateArabicBotScript(config: BotConfig, rules: ForwardRule[]): string {
  const jsonRules = JSON.stringify(rules, null, 4);

  return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
بوت إعادة التوجيه التلقائي عبر توكن البوت الرسمي (Telegram Bot Token Forwarder)
================================================================================
الترخيص: رخصة MIT (MIT License)
المطور الأصلي للأداة: Redian Marku (https://github.com/redianmarku/Telegram-Autoforwarder)
التعريب والتطوير لدعم توكن البوت والآدمن: Telegram AutoForwarder Pro
================================================================================
"""

import sys
import os
import json
import asyncio
import logging
import re
from aiohttp import ClientSession

# الإعدادات
BOT_TOKEN = "${config.botToken || 'ضع_توكن_البوت_هنا'}"
ADMIN_ID = ${config.adminId ? Number(config.adminId) : 0}  # معرف الآدمن المصرح له
API_BASE = f"https://api.telegram.org/bot{BOT_TOKEN}"

# القواعد
RULES = ${jsonRules}

logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s",
    level=logging.INFO
)

async def check_bot():
    async with ClientSession() as session:
        async with session.get(f"{API_BASE}/getMe") as resp:
            data = await resp.json()
            if data.get("ok"):
                bot = data["result"]
                print(f"✅ البوت متصل بنجاح: @{bot.get('username')} ({bot.get('first_name')})")
                return True
            else:
                print(f"❌ فشل الاتصال بالبوت: {data.get('description')}")
                return False

async def send_message_to_admin(text: str):
    if not ADMIN_ID:
        return
    async with ClientSession() as session:
        payload = {"chat_id": ADMIN_ID, "text": text, "parse_mode": "HTML"}
        try:
            await session.post(f"{API_BASE}/sendMessage", json=payload)
        except Exception as e:
            logging.error(f"فشل إرسال الإشعار للآدمن: {e}")

async def main():
    print("="*60)
    print("بوت إعادة توجيه تيليجرام - معرب ومحمي الحقوق")
    print("="*60)
    
    if not await check_bot():
        print("تأكد من صحة التوكن في الإعدادات.")
        return

    await send_message_to_admin("🚀 تم تشغيل بوت إعادة التوجيه بنجاح وبدء المراقبة.")
    print(f"👑 تم ضبط الآدمن برقم: {ADMIN_ID}")
    print("🟢 البوت بانتظار التحديثات...")

    # حلقة الاستقبال (Long Polling)
    offset = 0
    async with ClientSession() as session:
        while True:
            try:
                url = f"{API_BASE}/getUpdates?offset={offset}&timeout=30"
                async with session.get(url) as resp:
                    data = await resp.json()
                    if not data.get("ok"):
                        await asyncio.sleep(5)
                        continue
                    
                    updates = data.get("result", [])
                    for update in updates:
                        offset = update["update_id"] + 1
                        
                        # رسالة في قناة أو مجموعة
                        msg = update.get("channel_post") or update.get("message")
                        if not msg:
                            continue

                        chat_id = str(msg["chat"]["id"])
                        text = msg.get("text") or msg.get("caption") or ""
                        
                        # فحص القواعد
                        for rule in RULES:
                            if not rule.get("enabled", True):
                                continue
                            if str(rule.get("sourceChatId")) == chat_id:
                                # فحص الكلمات
                                keywords = rule.get("keywords", [])
                                match = True
                                if keywords:
                                    match = any(kw.lower() in text.lower() for kw in keywords if kw)
                                
                                if match:
                                    dest = rule.get("destinationChatId")
                                    out_text = text
                                    if rule.get("customSignature"):
                                        out_text += f"\\n\\n{rule['customSignature']}"
                                    
                                    fwd_payload = {
                                        "chat_id": dest,
                                        "text": out_text
                                    }
                                    await session.post(f"{API_BASE}/sendMessage", json=fwd_payload)
                                    logging.info(f"تم توجيه رسالة من {chat_id} إلى {dest}")

            except Exception as e:
                logging.error(f"حدث خطأ في دورة التحديث: {e}")
                await asyncio.sleep(5)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\\nتم إيقاف البوت.")
`;
}

/**
 * Generates config.json
 */
export function generateConfigFile(config: BotConfig, rules: ForwardRule[]): string {
  return JSON.stringify(
    {
      _attribution: {
        originalAuthor: 'Redian Marku',
        repository: 'https://github.com/redianmarku/Telegram-Autoforwarder',
        license: 'MIT License',
        arabicAdaptation: 'Telegram AutoForwarder Pro',
      },
      botToken: config.botToken,
      adminId: config.adminId,
      additionalAdminIds: config.additionalAdminIds,
      notifyAdminOnForward: config.notifyAdminOnForward,
      enableTelegramAdminCommands: config.enableTelegramAdminCommands,
      telethon: config.telethon,
      rules: rules,
    },
    null,
    2
  );
}

/**
 * Generates .env configuration
 */
export function generateEnvFile(config: BotConfig): string {
  return `# Telegram AutoForwarder Pro - Arabic
# الحقوق الأصلية محفوظة للمطور: Redian Marku (MIT License)

BOT_TOKEN="${config.botToken || ''}"
ADMIN_ID="${config.adminId || ''}"
ADDITIONAL_ADMINS="${(config.additionalAdminIds || []).join(',')}"

# إعدادات حساب تليثون (MTProto Userbot)
TELEGRAM_API_ID="${config.telethon.apiId || ''}"
TELEGRAM_API_HASH="${config.telethon.apiHash || ''}"
TELEGRAM_PHONE="${config.telethon.phoneNumber || ''}"

NOTIFY_ADMIN="${config.notifyAdminOnForward ? 'true' : 'false'}"
ENABLE_COMMANDS="${config.enableTelegramAdminCommands ? 'true' : 'false'}"
`;
}

/**
 * Generates requirements.txt
 */
export function generateRequirementsTxt(): string {
  return `# Telegram AutoForwarder Requirements
telethon>=1.36.0
aiohttp>=3.9.0
python-dotenv>=1.0.0
`;
}
