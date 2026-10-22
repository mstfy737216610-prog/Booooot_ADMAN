#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
أداة الإعداد السريع لبيانات التيليجرام في Termux
"""
import os
import sys

print("=" * 65)
print("🔑 معالج إعداد بيانات التيليجرام (Telegram Credentials Setup)")
print("=" * 65)
print("هذه الأداة تحفظ بياناتك بأمان في ملف .env ليستخدمها سكريبت اليوزربوت.")
print("احصل على بياناتك الحقيقية مجاناً من: https://my.telegram.org")
print("-" * 65)

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")

while True:
    api_id = input("👉 1. أدخل API_ID (أرقام فقط): ").strip()
    if api_id.isdigit() and len(api_id) >= 5:
        break
    print("❌ خطأ: الـ API_ID يجب أن يتكون من أرقام فقط (مثال: 27819234)")

while True:
    api_hash = input("👉 2. أدخل API_HASH (32 خانة): ").strip()
    if len(api_hash) >= 20:
        break
    print("❌ خطأ: الـ API_HASH غير صالح. انسخه كاملاً من my.telegram.org")

phone = input("👉 3. أدخل رقم هاتفك مع مفتاح الدولة (مثال: +966501234567): ").strip()

lines = []
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            if not any(line.strip().startswith(k) for k in ("TELEGRAM_API_ID=", "TELEGRAM_API_HASH=", "TELEGRAM_PHONE=")):
                lines.append(line)

lines.append(f"TELEGRAM_API_ID={api_id}\n")
lines.append(f"TELEGRAM_API_HASH={api_hash}\n")
if phone:
    lines.append(f"TELEGRAM_PHONE={phone}\n")

with open(env_path, "w", encoding="utf-8") as f:
    f.writelines(lines)

print("=" * 65)
print(f"✅ تم حفظ الإعدادات بنجاح في ملف: {env_path}")
print("🚀 يمكنك الآن تشغيل اليوزربوت مباشرة عبر الأمر:")
print("python userbot_publisher.py")
print("=" * 65)
