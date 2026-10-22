#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
استخراج كود StringSession لتيليجرام (Telethon)
لتشغيل اليوزربوت في السحابة دون الحاجة لملفات .session
"""
from telethon.sync import TelegramClient
from telethon.sessions import StringSession

print("=" * 60)
print("🔑 استخراج كود الجلسة المشفرة StringSession لليوزربوت")
print("=" * 60)

api_id_input = input("أدخل API_ID الخاص بك من my.telegram.org: ").strip()
api_id = int(api_id_input)
api_hash = input("أدخل API_HASH الخاص بك: ").strip()

with TelegramClient(StringSession(), api_id, api_hash) as client:
    print("\n" + "=" * 60)
    print("✅ تم تسجيل الدخول وإنشاء الجلسة بنجاح! هذا هو كود STRING_SESSION:")
    print("=" * 60 + "\n")
    print(client.session.save())
    print("\n" + "=" * 60)
    print("💡 انسخ الكود أعلاه وضعه في ملف .env أو في لوحة التحكم تحت بند STRING_SESSION")
