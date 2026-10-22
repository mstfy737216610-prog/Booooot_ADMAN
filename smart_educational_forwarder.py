#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
محرر وناشر المحتوى الأكاديمي والجامعي الذكي (النسخة الإنتاجية الشاملة V3.0)
Telegram University Content Editor & Automated Multi-Channel Publisher
================================================================================
المشرف العام المعتمد: @M_S_F_G (معرف: 7607633343)
قناة النشر الافتراضية المعتمدة: @jhdhhdcj
الذكاء الاصطناعي: DeepSeek-V4-Flash / DeepSeek-V4.1-Flash (https://api.hcnsec.cn/v1)
قاعدة البيانات: SQLite3 الدائمة (bot_database.db) مع مزامنة Bots.Business
محرك السحب المزدوج: MTProto (Telethon) + Scraper محسن مع حماية كاملة
معالجة غير متزامنة: Worker Thread + Queue لمنع التجمد أثناء استدعاء الـ AI
================================================================================
"""

from main import StandaloneTelegramEducationalBot

if __name__ == "__main__":
    bot = StandaloneTelegramEducationalBot()
    bot.run()
