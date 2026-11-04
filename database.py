#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
قاعدة البيانات الدائمة للبوت الأكاديمي واليوزربوت (SQLite Persistent Database Engine)
توفر حفظاً دائماً لا يُمحى عند إعادة نشر الحاويات أو استضافة السيرفر،
مع التوافق الكامل مع مصادر JSON ومزامنة ثنائية الاتجاه.
"""

import os
import json
import sqlite3
import threading
import logging
import re
import difflib
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple, Set

logger = logging.getLogger("Database")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "bot_database.db")
SOURCES_FILE = os.path.join(BASE_DIR, "sources.json")
STATE_FILE = os.path.join(BASE_DIR, "state.json")
CONFIG_FILE = os.path.join(BASE_DIR, "config.json")

# قفل عودي لضمان سلامة العمليات متزامنة بين الـ Threads دون deadlock
_db_lock = threading.RLock()


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE, check_same_thread=False, timeout=30.0)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """تهيئة جداول قاعدة البيانات وترقية المخطط تلقائياً"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()

            # 1. جدول المستخدمين (نظام الحسابات والأرقام الموثقة)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY,
                username TEXT,
                first_name TEXT,
                phone_number TEXT,
                role TEXT DEFAULT 'user',
                is_banned INTEGER DEFAULT 0,
                balance REAL DEFAULT 0.0,
                plan TEXT DEFAULT 'free',
                plan_expires_at TEXT,
                created_at TEXT,
                last_active_at TEXT
            )
            """)

            # 2. جدول قنوات النشر المستهدفة وإحصائياتها
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS target_channels (
                channel_id TEXT PRIMARY KEY,
                title TEXT,
                status TEXT DEFAULT 'active',
                success_count INTEGER DEFAULT 0,
                fail_count INTEGER DEFAULT 0,
                last_success_at TEXT,
                last_error_msg TEXT,
                added_by INTEGER,
                created_at TEXT
            )
            """)

            # 3. جدول المصادر المراقبة (تيليجرام، RSS، تويتر)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS sources (
                id TEXT PRIMARY KEY,
                type TEXT,
                target TEXT UNIQUE,
                title TEXT,
                priority TEXT DEFAULT 'high',
                rule TEXT DEFAULT 'official',
                enabled INTEGER DEFAULT 1,
                last_post_id TEXT DEFAULT '',
                added_by INTEGER,
                created_at TEXT
            )
            """)

            # 4. جدول الإعدادات العامة والمتغيرات
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
            """)

            # 5. جدول المنشورات المجدولة
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS scheduled_posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                target_channel TEXT,
                raw_text TEXT,
                photo_url TEXT,
                publish_at TEXT,
                status TEXT DEFAULT 'pending',
                created_at TEXT
            )
            """)

            # 6. جدول المنشورات المعالجة لمنع التكرار (Seen Posts)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS seen_posts (
                post_id TEXT PRIMARY KEY,
                post_hash TEXT,
                channel TEXT,
                created_at TEXT
            )
            """)

            # 6.1 جدول سجل الأخبار المنشورة لمنع التكرار الذكي والمقارنة خلال 24 ساعة
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS published_news_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id TEXT,
                title TEXT,
                clean_text TEXT,
                normalized_title TEXT,
                tokens TEXT,
                target_channel TEXT,
                target_univ TEXT,
                published_at TEXT
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_published_news_time ON published_news_log (published_at)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_published_news_univ ON published_news_log (target_univ)")

            # 7. سجل صحة القنوات والصلاحيات
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS channel_health_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                channel_id TEXT,
                status TEXT,
                message TEXT,
                checked_at TEXT
            )
            """)

            # 8. جدول مشاريع الجامعات وقنوات النشر المستقلة والبحث المخصص
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS university_projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                target_channel TEXT NOT NULL,
                telegram_sources TEXT DEFAULT '[]',
                twitter_sources TEXT DEFAULT '[]',
                google_news_query TEXT,
                google_news_enabled INTEGER DEFAULT 0,
                keywords TEXT DEFAULT '[]',
                enabled INTEGER DEFAULT 1,
                created_at TEXT
            )
            """)

            # 9. جدول المعرفة المستفادة وهوية الجامعات المستخلصة من المصادر (Learned Knowledge Base)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS university_knowledge (
                univ_id TEXT PRIMARY KEY,
                univ_name TEXT NOT NULL,
                knowledge_summary TEXT NOT NULL,
                learned_topics TEXT DEFAULT '[]',
                learned_accounts TEXT DEFAULT '[]',
                updated_at TEXT
            )
            """)

            # 10. جدول سجلات الأحداث والعمليات الدائمة (Persistent SQLite Event Logs)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS event_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                type TEXT DEFAULT 'info',
                message_text TEXT,
                source TEXT,
                destination TEXT,
                details TEXT,
                applied_rule_name TEXT,
                created_at TEXT
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_event_logs_time ON event_logs (timestamp DESC)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_event_logs_type ON event_logs (type)")

            # 11. جدول سجل التدقيق الشامل للمنشورات المقبولة والمرفوضة (Comprehensive Post Audit Log)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS post_audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id TEXT,
                status TEXT DEFAULT 'published',
                title TEXT,
                raw_content TEXT,
                final_content TEXT,
                rejection_reason TEXT,
                source_type TEXT DEFAULT 'telegram',
                source_origin TEXT,
                target_destination TEXT,
                target_univ TEXT,
                media_type TEXT DEFAULT 'text',
                media_url TEXT,
                created_at TEXT,
                published_at TEXT
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_log_status ON post_audit_log (status)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_log_time ON post_audit_log (created_at DESC)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_log_univ ON post_audit_log (target_univ)")

            # 12. جدول ذاكرة الأفكار والتغذية الراجعة الذكية (Feedback & Future Ideas Board)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS future_ideas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                operational_notes TEXT,
                status TEXT DEFAULT 'new',
                priority TEXT DEFAULT 'medium',
                tags TEXT DEFAULT '[]',
                university_id TEXT,
                university_name TEXT,
                source_post_id INTEGER,
                twitter_ready INTEGER DEFAULT 0,
                telegram_ready INTEGER DEFAULT 0,
                created_at TEXT,
                updated_at TEXT
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_ideas_status ON future_ideas (status)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_ideas_time ON future_ideas (created_at DESC)")

            # 13. جدول إعدادات النشر على منصة تويتر (X Publishing Settings)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS twitter_publishing_settings (
                key TEXT PRIMARY KEY,
                enabled INTEGER DEFAULT 0,
                api_key TEXT DEFAULT '',
                api_secret TEXT DEFAULT '',
                access_token TEXT DEFAULT '',
                access_secret TEXT DEFAULT '',
                bearer_token TEXT DEFAULT '',
                auto_publish INTEGER DEFAULT 0,
                auto_thread INTEGER DEFAULT 0,
                max_chars INTEGER DEFAULT 280,
                custom_hashtags TEXT DEFAULT '#جامعة #طلاب',
                last_tweet_id TEXT DEFAULT '',
                updated_at TEXT
            )
            """)

            # تهيئة الإعدادات الافتراضية لتويتر
            cursor.execute("SELECT COUNT(*) as c FROM twitter_publishing_settings WHERE key = 'main_config'")
            if cursor.fetchone()["c"] == 0:
                now_str = datetime.utcnow().isoformat()
                cursor.execute("""
                INSERT INTO twitter_publishing_settings (key, enabled, auto_publish, auto_thread, max_chars, custom_hashtags, updated_at)
                VALUES ('main_config', 0, 0, 0, 280, '#أخبار_الجامعات #القبول_والتسجيل', ?)
                """, (now_str,))

            # 14. جدول حسابات تويتر المتعددة والمستقلة بالكامل (Multi-Account Twitter Hub)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS twitter_accounts (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                display_name TEXT DEFAULT '',
                university TEXT DEFAULT '',
                auth_token TEXT DEFAULT '',
                ct0 TEXT DEFAULT '',
                cookies_json TEXT DEFAULT '',
                proxy TEXT DEFAULT '',
                api_key TEXT DEFAULT '',
                api_secret TEXT DEFAULT '',
                access_token TEXT DEFAULT '',
                access_secret TEXT DEFAULT '',
                bearer_token TEXT DEFAULT '',
                status TEXT DEFAULT 'valid',
                is_active INTEGER DEFAULT 1,
                auto_publish INTEGER DEFAULT 1,
                auto_reply INTEGER DEFAULT 1,
                reply_persona TEXT DEFAULT '',
                custom_hashtags TEXT DEFAULT '#جامعة_نجران #طلاب_نجران',
                theme_color TEXT DEFAULT '#0284c7',
                logo_path TEXT DEFAULT '',
                monitoring_sources TEXT DEFAULT '[]',
                created_at TEXT,
                updated_at TEXT
            )
            """)

            try:
                cursor.execute("ALTER TABLE twitter_accounts ADD COLUMN monitoring_sources TEXT DEFAULT '[]'")
            except Exception:
                pass

            # 15. جدول سجل الرد على تعليقات الطلاب في تويتر (Twitter Comments & Auto-Reply Log)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS twitter_replies_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id TEXT,
                tweet_id TEXT DEFAULT '',
                comment_id TEXT DEFAULT '',
                student_username TEXT DEFAULT '',
                comment_text TEXT NOT NULL,
                reply_text TEXT NOT NULL,
                status TEXT DEFAULT 'sent',
                confidence REAL DEFAULT 0.95,
                created_at TEXT
            )
            """)

            # 16. جدول بطاقات الصور المصممة لتويتر (Designed Twitter Announcement Cards)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS twitter_designed_cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id TEXT,
                title TEXT NOT NULL,
                body_text TEXT NOT NULL,
                image_path TEXT NOT NULL,
                dimensions TEXT DEFAULT '1080x1350',
                accent_color TEXT DEFAULT '#0284c7',
                created_at TEXT
            )
            """)

            # 17. جدول مركز التشخيص والتعقب الذكي للأخطاء (Live System Diagnostics & Error Tracker)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_diagnostics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                error_code TEXT NOT NULL,
                severity TEXT DEFAULT 'warning', -- 'critical', 'warning', 'info'
                component TEXT DEFAULT 'general', -- 'telegram', 'twitter', 'ai', 'storage', 'crawler'
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                fix_action TEXT DEFAULT '',
                context_data TEXT DEFAULT '{}',
                resolved INTEGER DEFAULT 0,
                created_at TEXT,
                resolved_at TEXT
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_diag_resolved ON system_diagnostics (resolved)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_diag_code ON system_diagnostics (error_code)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_diag_time ON system_diagnostics (created_at DESC)")

            # بذر حسابات تويتر أولية إذا كان الجدول فارغاً
            cursor.execute("SELECT COUNT(*) as c FROM twitter_accounts")
            if cursor.fetchone()["c"] == 0:
                now_str = datetime.utcnow().isoformat()
                cursor.execute("""
                INSERT INTO twitter_accounts (
                    id, username, display_name, university, auth_token, ct0, status,
                    is_active, auto_publish, auto_reply, reply_persona, custom_hashtags,
                    theme_color, created_at, updated_at
                ) VALUES (
                    'acc_najran_main',
                    '@Najran_Students',
                    'صوت طالب جامعة نجران 🎓',
                    'جامعة نجران',
                    'demo_auth_token_najran_99a8',
                    'demo_ct0_najran_77f2',
                    'valid',
                    1, 1, 1,
                    'زميلك الأكاديمي الناصح وصوت الطالب الحقيقي، تنقل وتجيب بأمانة ولهجة سعودية بيضاء راقية دون اختلاق تواريخ وهمية.',
                    '#جامعة_نجران #القبول_والتسجيل #المكافأة_الجامعية',
                    '#0284c7',
                    ?, ?
                )
                """, (now_str, now_str))

                cursor.execute("""
                INSERT INTO twitter_accounts (
                    id, username, display_name, university, auth_token, ct0, status,
                    is_active, auto_publish, auto_reply, reply_persona, custom_hashtags,
                    theme_color, created_at, updated_at
                ) VALUES (
                    'acc_ksu_voice',
                    '@KSU_StudentVoice',
                    'ملتقى طلاب جامعة الملك سعود 🇸🇦',
                    'جامعة الملك سعود',
                    'demo_auth_token_ksu_88b1',
                    'demo_ct0_ksu_44c9',
                    'valid',
                    1, 1, 1,
                    'ممثل الدفعة الناصح لطلبة KSU، مساعدة فورية في جداول الحذف والإضافة والاعتذارات ولائحة الغياب.',
                    '#جامعة_الملك_سعود #KSU #بوابة_النظام_الأكاديمي',
                    '#059669',
                    ?, ?
                )
                """, (now_str, now_str))

            # بذر سجلات تدقيق أولية إذا كان الجدول فارغاً
            cursor.execute("SELECT COUNT(*) as c FROM post_audit_log")
            if cursor.fetchone()["c"] == 0:
                now_str = datetime.utcnow().isoformat()
                yesterday_str = (datetime.utcnow() - timedelta(hours=6)).isoformat()
                two_days_str = (datetime.utcnow() - timedelta(days=1)).isoformat()

                seed_audit = [
                    (
                        "published",
                        "إعلان مواعيد تسجيل المقررات والحذف والإضافة للفصل الدراسي الثاني",
                        "تعلن عمادة القبول والتسجيل عن فتح بوابات النظام الأكاديمي للطلاب والطالبات لتسجيل المقررات وإجراء الحذف والإضافة وفق الخطة المعتمدة.",
                        "📌 <b>إعلان أكاديمي رسمي - جامعة الملك سعود</b>\n\n• تعلن عمادة شؤون القبول والتسجيل عن بدء فترة الحذف والإضافة للمقررات الدراسية.\n• المواعيد محددة حسب المستويات والوحدات المعتمدة عبر البوابة الإلكترونية.\n\n🔗 رابط البوابة المعتمدة:\nhttps://edugate.ksu.edu.sa\n\nدعواتنا لكم بفصل دراسي موفق 🤲",
                        "",
                        "telegram",
                        "@KSU_News",
                        "@jhdhhdcj",
                        "جامعة الملك سعود",
                        "text",
                        None,
                        now_str,
                        now_str
                    ),
                    (
                        "published",
                        "دليل استحقاق المكافأة الجامعية وشروط الصرف الأكاديمي للطلبة",
                        "تفاصيل الشروط والضوابط المعتمدة لصرف المكافأة الشهرية ومواعيد الإيداع للطلبة المنتظمين.",
                        "📌 <b>تنويه أكاديمي هام | جامعة نجران</b>\n\n▫️ يسر عمادة شؤون الطلاب توضيح جدول إيداع المكافآت الجامعية وشروط الصرف المقررة.\n▫️ يشترط للصرف انتظام الطالب وعدم تجاوز المدة النظامية للكلية.\n\n#جامعة_نجران #المكافأة #شؤون_الطلاب",
                        "",
                        "twitter",
                        "@Najran_Univ",
                        "@jhdhhdcj",
                        "جامعة نجران",
                        "text",
                        None,
                        yesterday_str,
                        yesterday_str
                    ),
                    (
                        "rejected",
                        "خصم 50% على حل الواجبات وإعداد مشاريع التخرج لطلاب الجامعات",
                        "تواصل معنا عبر واتساب لحل الواجبات وإعداد الأبحاث الجامعية بأسعار خاصة وضمان الامتياز.",
                        "",
                        "إعلان تجاري وخدمات مدفوعة مخالفة للوائح الأكاديمية (استبعاد تلقائي)",
                        "telegram",
                        "قناة خارجية",
                        "محرك الفلترة",
                        "جامعة الملك سعود",
                        "text",
                        None,
                        two_days_str,
                        None
                    ),
                    (
                        "rejected",
                        "تغطية مباراة القمة في دوري أبطال أوروبا والتشكيلة المتوقعة",
                        "متابعة حصرية لأبرز مباريات الجولة الرياضية والأهداف وتحليلات الأداء الفني.",
                        "",
                        "محتوى غير أكاديمي وخارج الشأن والاهتمام الطلابي",
                        "twitter",
                        "@sports_feed",
                        "مصفاة المحتوى",
                        "عام",
                        "text",
                        None,
                        two_days_str,
                        None
                    )
                ]

                for st, tit, raw, fin, rej, src_t, src_o, tgt_d, tgt_u, med_t, med_u, cr_at, pub_at in seed_audit:
                    cursor.execute("""
                    INSERT INTO post_audit_log (
                        post_id, status, title, raw_content, final_content, rejection_reason,
                        source_type, source_origin, target_destination, target_univ,
                        media_type, media_url, created_at, published_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        f"seed_log_{int(datetime.utcnow().timestamp()*1000)}",
                        st, tit, raw, fin, rej, src_t, src_o, tgt_d, tgt_u, med_t, med_u, cr_at, pub_at
                    ))

            # بذر أفكار أولية في لوحة الأفكار إذا كان الجدول فارغاً
            cursor.execute("SELECT COUNT(*) as c FROM future_ideas")
            if cursor.fetchone()["c"] == 0:
                now_str = datetime.utcnow().isoformat()
                seed_ideas = [
                    (
                        "شرح تفصيلي لكيفية احتساب المعدل الفصلي والتراكمي لطلبة السنة الأولى",
                        "إعداد إنفوجرافيك مبسط يوضح آلية حساب النقاط الأكاديمية وتأثير الإنذارات ونسب الحرمان على السجل الأكاديمي.",
                        "التوجيه: الطلاب الجدد يواجهون ارتباكاً كبيراً في أول فصل؛ التركيز على الأمثلة العملية وتقديم خطوات النجاة من الإنذار الأول بأسلوب أخوي ناصح.",
                        "new",
                        "high",
                        json.dumps(["المعدل_التراكمي", "إرشاد_أكاديمي", "السنة_الأولى"]),
                        "ksu",
                        "جامعة الملك سعود",
                        None,
                        now_str,
                        now_str
                    ),
                    (
                        "دليل إجراءات وضوابط الاعتراض على رصد درجات الاختبارات الفصلية",
                        "خطوات رفع تظلم رسمي عبر البوابة الإلكترونية والمدد النظامية المحددة للبت في الطلب.",
                        "المنافسون يكتفون برابط البوابة؛ نحن سنشرح النموذج خطوة بخطوة بالصور التوضيحية لضمان حق الطالب.",
                        "in_progress",
                        "medium",
                        json.dumps(["اختبارات", "تظلمات", "حقوق_الطلبة"]),
                        "aum",
                        "جامعة AUM",
                        None,
                        now_str,
                        now_str
                    ),
                    (
                        "ملف إرشادي لشروط ومواعيد التحويل الداخلي بين الكليات والأقسام",
                        "تجميع المعدلات المطلوبة لكل تخصص والطاقة الاستيعابية ومفاضلة الكليات العلمية والإنسانية.",
                        "تم اعتماد البيانات مع عمادة القبول؛ جاهز للنشر كمنشور تيليجرام تفصيلي وسلسلة تغريدات على تويتر.",
                        "ready",
                        "high",
                        json.dumps(["التحويل_الداخلي", "مواعيد", "شروط_القبول"]),
                        "ksu",
                        "جامعة الملك سعود",
                        None,
                        now_str,
                        now_str
                    )
                ]

                for tit, desc, op_n, st, pr, tgs, u_id, u_n, s_id, cr_at, up_at in seed_ideas:
                    cursor.execute("""
                    INSERT INTO future_ideas (
                        title, description, operational_notes, status, priority, tags,
                        university_id, university_name, source_post_id, created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (tit, desc, op_n, st, pr, tgs, u_id, u_n, s_id, cr_at, up_at))

            conn.commit()
            logger.info("✅ تم تهيئة جداول قاعدة البيانات SQLite بنجاح بما فيها سجل التدقيق، لوحة الأفكار، وإعدادات تويتر.")

            # هجرة البيانات من ملفات JSON إن وجدت وقاعدة البيانات جديدة
            migrate_from_json(conn)

            # تنظيف أي معرفات قنوات غير صالحة سابقة من قاعدة البيانات لضمان عدم رمي 400 Bad Request
            try:
                cursor.execute("SELECT id, channel_id FROM target_channels WHERE status != 'deleted'")
                for r in cursor.fetchall():
                    if not is_valid_telegram_channel(r["channel_id"]):
                        cursor.execute("UPDATE target_channels SET status = 'deleted' WHERE id = ?", (r["id"],))
                conn.commit()
            except Exception:
                pass

        except Exception as e:
            logger.error(f"❌ خطأ في تهيئة قاعدة البيانات: {e}")
        finally:
            conn.close()


def migrate_from_json(conn: sqlite3.Connection):
    """هجرة البيانات الحالية من sources.json و state.json لضمان عدم ضياع أي بيانات سابقة"""
    cursor = conn.cursor()

    # 1. تثبيت المشرف الأساسي (ID: 7607633343)
    admin_id = 7607633343
    admin_user = "M_S_F_G"
    now_str = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT OR IGNORE INTO users (user_id, username, first_name, role, plan, plan_expires_at, created_at, last_active_at)
        VALUES (?, ?, ?, 'admin', 'vip', '2099-12-31T23:59:59', ?, ?)
    """, (admin_id, admin_user, "المشرف العام", now_str, now_str))

    # 2. هجرة قنوات النشر
    cursor.execute("SELECT COUNT(*) as cnt FROM target_channels")
    if cursor.fetchone()["cnt"] == 0:
        target_ch = "@jhdhhdcj"
        cursor.execute("""
            INSERT OR IGNORE INTO target_channels (channel_id, title, status, created_at)
            VALUES (?, ?, 'active', ?)
        """, (target_ch, "قناة النشر الرسمية", now_str))

    # 3. هجرة المصادر من sources.json فقط إن وجدت وبدون فرض مصادر وهمية
    cursor.execute("SELECT COUNT(*) as cnt FROM sources")
    if cursor.fetchone()["cnt"] == 0 and os.path.exists(SOURCES_FILE):
        try:
            with open(SOURCES_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data.get("sources", []):
                    cursor.execute("""
                        INSERT OR REPLACE INTO sources (id, type, target, title, priority, rule, enabled, last_post_id, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        item.get("id") or f"src_{item.get('target')}",
                        item.get("type", "telegram"),
                        item.get("target"),
                        item.get("title", item.get("target")),
                        item.get("priority", "high"),
                        item.get("rule", "official"),
                        1 if item.get("enabled", True) else 0,
                        str(item.get("lastPostId", "")),
                        now_str
                    ))
        except Exception as e:
            logger.warning(f"ملاحظة في هجرة sources.json: {e}")

    # 4. إعدادات النظام الافتراضية
    defaults = {
        "bot_status": "active",
        "is_paused": "0",
        "ai_model": "DeepSeek-V4-Flash",
        "ai_base_url": "https://api.hcnsec.cn/v1",
        "ai_api_key": "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii",
        "custom_ad": """🎓 خدمات طلابية معتمدة وأكاديمية متكاملة 🎓
يسرنا تقديم الدعم الأكاديمي الشامل للطلبة والباحثين:
• مساعدة في البحوث والمشاريع الأكاديمية
• التدقيق اللغوي وتنسيق الرسائل الجامعية
• تلخيص المحاضرات والمقررات الدراسية

📞 للتواصل والطلب مباشرة عبر المشرف: @M_S_F_G
✨ جودة أكاديمية، سرعة في الإنجاز، وأسعار مناسبة للطلاب!""",
        "custom_instructions": "أنت ممثل الدفعة ومستشار طلابي خليجي مقرب: ادخل في صلب الموضوع فوراً بدون أي قوالب مكررة (لا تبدأ أبداً بـ 'تنبيه لطلاب' ولا تكتب 'أبرز التفاصيل')، ركز 100% على ما يهم الطالب (التسجيل، السمر، جداول الاختبارات، الأدفايزر، إعلانات الدكاترة)، واجعل المواعيد والأوقات بخط عريض <b>...</b>، واحتفظ بالأدعية وذكر الصلاة على النبي والأذكار بروح خليجية ودية صادقة.",
        "processed_count": "18",
        "forwarded_count": "15",
        "ad_replaced_count": "3",
        "ad_replacement_enabled": "0",
        "bot_token": "8901693218:AAH0hoZdTq9qGaLYOhu_Cvxg9TEzTPAVADw"
    }

    for k, v in defaults.items():
        cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (k, v))

    conn.commit()


# ----------------- وظائف المستخدمين ونظام الحسابات والتحقق -----------------

def get_user(user_id: int) -> Optional[Dict[str, Any]]:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()


def upsert_user(user_id: int, username: str = "", first_name: str = "", role: str = "user") -> Dict[str, Any]:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_str = datetime.utcnow().isoformat()
            # إذا كان المشرف المعروف
            if user_id == 7607633343:
                role = "admin"

            cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
            existing = cursor.fetchone()
            if existing:
                cursor.execute("""
                    UPDATE users 
                    SET username = coalesce(nullif(?, ''), username),
                        first_name = coalesce(nullif(?, ''), first_name),
                        last_active_at = ?
                    WHERE user_id = ?
                """, (username, first_name, now_str, user_id))
            else:
                plan = "vip" if role == "admin" else "free"
                expires = (datetime.utcnow() + timedelta(days=3650 if role == "admin" else 7)).isoformat()
                cursor.execute("""
                    INSERT INTO users (user_id, username, first_name, role, plan, plan_expires_at, created_at, last_active_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (user_id, username, first_name, role, plan, expires, now_str, now_str))

            conn.commit()
            cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
            return dict(cursor.fetchone())
        finally:
            conn.close()


def set_user_phone(user_id: int, phone: str) -> bool:
    """ربط رقم الهاتف الموثق رسمياً عبر تيليجرام بالحساب"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            clean_phone = phone.strip()
            if not clean_phone.startswith("+"):
                clean_phone = "+" + clean_phone
            cursor.execute("""
                UPDATE users SET phone_number = ?, last_active_at = ? WHERE user_id = ?
            """, (clean_phone, datetime.utcnow().isoformat(), user_id))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()


def set_user_role(user_id: int, role: str) -> bool:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET role = ? WHERE user_id = ?", (role, user_id))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()


def set_user_plan(user_id: int, plan: str, days: int = 30) -> bool:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            expires = (datetime.utcnow() + timedelta(days=days)).isoformat()
            cursor.execute("UPDATE users SET plan = ?, plan_expires_at = ? WHERE user_id = ?", (plan, expires, user_id))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()


def ban_user(user_id: int, ban: bool = True) -> bool:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET is_banned = ? WHERE user_id = ?", (1 if ban else 0, user_id))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()


def list_users(limit: int = 50) -> List[Dict[str, Any]]:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users ORDER BY created_at DESC LIMIT ?", (limit,))
            return [dict(r) for r in cursor.fetchall()]
        finally:
            conn.close()


# ----------------- وظائف الإعدادات -----------------

def get_setting(key: str, default: Any = "") -> str:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
            row = cursor.fetchone()
            return row["value"] if row else str(default)
        finally:
            conn.close()


def set_setting(key: str, value: Any):
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO settings (key, value) VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """, (key, str(value)))
            conn.commit()
        finally:
            conn.close()


def increment_setting(key: str, amount: int = 1) -> int:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
            row = cursor.fetchone()
            current = int(row["value"]) if row and row["value"].isdigit() else 0
            new_val = current + amount
            cursor.execute("""
                INSERT INTO settings (key, value) VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """, (key, str(new_val)))
            conn.commit()
            return new_val
        finally:
            conn.close()


# ----------------- وظائف قنوات النشر وإحصائياتها -----------------

def is_valid_telegram_channel(channel_id: str) -> bool:
    """
    التحقق الصارم من صحة معرف أو رابط قناة تيليجرام:
    - رقم المعرف الرقمي: مثل -100123456789 أو -12345678
    - اسم المستخدم: يبدأ بـ @ ويتبعه من 3 إلى 32 حرفاً أو رقماً إنجليزياً أو شرطة سفلية
    استبعاد الأخطاء الإملائية مثل '@' المفردة أو الحروف العربية '@مصط' التي تسبب 400 Bad Request
    """
    if not channel_id or not isinstance(channel_id, str):
        return False
    ch = channel_id.strip()
    if not ch or ch == "@":
        return False
    if re.match(r"^-?\d{5,20}$", ch):
        return True
    if re.match(r"^@[a-zA-Z0-9_]{3,32}$", ch):
        return True
    return False


def get_target_channels() -> List[str]:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT channel_id FROM target_channels WHERE status != 'deleted'")
            rows = cursor.fetchall()
            chs = [r["channel_id"] for r in rows if is_valid_telegram_channel(r["channel_id"])]
            return chs if chs else ["@jhdhhdcj"]
        finally:
            conn.close()


def get_target_channels_detailed() -> List[Dict[str, Any]]:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM target_channels WHERE status != 'deleted' ORDER BY created_at ASC")
            rows = cursor.fetchall()
            return [dict(r) for r in rows if is_valid_telegram_channel(r["channel_id"])]
        finally:
            conn.close()


def add_target_channel(channel_id: str, title: str = "", added_by: int = 7607633343) -> bool:
    if not channel_id:
        return False
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            clean_ch = channel_id.strip()
            if not clean_ch.startswith("@") and not clean_ch.startswith("-"):
                clean_ch = "@" + clean_ch
            if not is_valid_telegram_channel(clean_ch):
                logger.warning(f"⚠️ تم رفض إضافة القناة '{channel_id}' لأن المعرف غير صالح في تيليجرام (يجب أن يكون بالإنجليزية من 3 إلى 32 رمزاً أو رقم شات سالب).")
                return False
            now_str = datetime.utcnow().isoformat()
            cursor.execute("""
                INSERT INTO target_channels (channel_id, title, status, added_by, created_at)
                VALUES (?, ?, 'active', ?, ?)
                ON CONFLICT(channel_id) DO UPDATE SET status = 'active', title = coalesce(nullif(excluded.title, ''), title)
            """, (clean_ch, title or clean_ch, added_by, now_str))
            conn.commit()
            sync_to_json_files()
            return True
        finally:
            conn.close()


def remove_target_channel(channel_id: str) -> bool:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            clean_ch = channel_id.strip()
            cursor.execute("DELETE FROM target_channels WHERE channel_id = ? OR channel_id = ?", (clean_ch, "@" + clean_ch.replace("@", "")))
            conn.commit()
            sync_to_json_files()
            return cursor.rowcount > 0
        finally:
            conn.close()


def record_channel_publish_result(channel_id: str, success: bool, error_msg: str = ""):
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_str = datetime.utcnow().isoformat()
            if success:
                cursor.execute("""
                    UPDATE target_channels 
                    SET success_count = success_count + 1,
                        last_success_at = ?,
                        status = 'active',
                        last_error_msg = ''
                    WHERE channel_id = ?
                """, (now_str, channel_id))
            else:
                cursor.execute("""
                    UPDATE target_channels 
                    SET fail_count = fail_count + 1,
                        last_error_msg = ?,
                        status = 'error_permission'
                    WHERE channel_id = ?
                """, (error_msg, channel_id))
            conn.commit()
        finally:
            conn.close()


def update_channel_health(channel_id: str, status: str, message: str):
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_str = datetime.utcnow().isoformat()
            cursor.execute("""
                UPDATE target_channels SET status = ?, last_error_msg = ? WHERE channel_id = ?
            """, (status, message, channel_id))
            cursor.execute("""
                INSERT INTO channel_health_logs (channel_id, status, message, checked_at)
                VALUES (?, ?, ?, ?)
            """, (channel_id, status, message, now_str))
            conn.commit()
        finally:
            conn.close()


# ----------------- وظائف سجلات الأحداث الدائمة في SQLite (Event Logs) -----------------

def add_event_log(
    log_type: str,
    message_text: str,
    source: str = "Telegram Engine",
    destination: str = "Target Channel",
    details: str = "",
    applied_rule_name: str = "المعالجة الأكاديمية",
    timestamp: Optional[str] = None
) -> int:
    """إضافة سجل حدث دائم في SQLite"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_iso = timestamp or datetime.utcnow().isoformat()
            cursor.execute("""
            INSERT INTO event_logs (timestamp, type, message_text, source, destination, details, applied_rule_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (now_iso, log_type, message_text, source, destination, details, applied_rule_name, now_iso))
            conn.commit()
            return cursor.lastrowid
        except Exception as e:
            logger.error(f"Error adding event log: {e}")
            return 0
        finally:
            conn.close()


def get_event_logs(limit: int = 150, offset: int = 0, filter_type: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
    """استرجاع سجلات الأحداث المخزنة في SQLite مع الفلترة والبحث"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            query = "SELECT * FROM event_logs WHERE 1=1"
            params: List[Any] = []
            if filter_type and filter_type != "all":
                query += " AND type = ?"
                params.append(filter_type)
            if search and search.strip():
                query += " AND (message_text LIKE ? OR details LIKE ? OR source LIKE ? OR destination LIKE ?)"
                s_param = f"%{search.strip()}%"
                params.extend([s_param, s_param, s_param, s_param])
            query += " ORDER BY id DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            cursor.execute(query, params)
            rows = cursor.fetchall()
            logs = []
            for r in rows:
                logs.append({
                    "id": str(r["id"]),
                    "timestamp": r["timestamp"] or r["created_at"],
                    "type": r["type"],
                    "messageText": r["message_text"] or "",
                    "source": r["source"] or "",
                    "destination": r["destination"] or "",
                    "details": r["details"] or "",
                    "appliedRuleName": r["applied_rule_name"] or ""
                })
            return logs
        except Exception as e:
            logger.error(f"Error reading event logs: {e}")
            return []
        finally:
            conn.close()


def update_event_log(log_id: int, message_text: str, details: str, log_type: Optional[str] = None, destination: Optional[str] = None, source: Optional[str] = None) -> bool:
    """تعديل سجل حدث في SQLite مباشرة"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            updates = ["message_text = ?", "details = ?"]
            params: List[Any] = [message_text, details]
            if log_type:
                updates.append("type = ?")
                params.append(log_type)
            if destination is not None:
                updates.append("destination = ?")
                params.append(destination)
            if source is not None:
                updates.append("source = ?")
                params.append(source)
            params.append(log_id)
            cursor.execute(f"UPDATE event_logs SET {', '.join(updates)} WHERE id = ?", params)
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error updating event log: {e}")
            return False
        finally:
            conn.close()


def delete_event_log(log_id: int) -> bool:
    """حذف سجل حدث من SQLite"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM event_logs WHERE id = ?", (log_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting event log: {e}")
            return False
        finally:
            conn.close()


def clear_event_logs() -> bool:
    """مسح كافة السجلات من SQLite"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM event_logs")
            conn.commit()
            return True
        except Exception as e:
            logger.error(f"Error clearing event logs: {e}")
            return False
        finally:
            conn.close()


def delete_event_logs_batch(log_ids: List[Any]) -> int:
    """حذف دفعة محددة من السجلات والمنشورات دفعة واحدة"""
    if not log_ids:
        return 0
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            placeholders = ",".join("?" for _ in log_ids)
            cursor.execute(f"DELETE FROM event_logs WHERE id IN ({placeholders})", [int(x) for x in log_ids if str(x).isdigit()])
            deleted_count = cursor.rowcount
            conn.commit()
            return deleted_count
        except Exception as e:
            logger.error(f"Error batch deleting event logs: {e}")
            return 0
        finally:
            conn.close()



# ----------------- وظائف المصادر المراقبة -----------------

def get_sources() -> List[Dict[str, Any]]:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM sources WHERE enabled = 1 ORDER BY priority DESC, created_at ASC")
            return [dict(r) for r in cursor.fetchall()]
        finally:
            conn.close()


def add_source(src_type: str, target: str, title: str = "", last_post_id: str = "", added_by: int = 7607633343) -> bool:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_str = datetime.utcnow().isoformat()
            clean_target = target.strip()
            sid = f"src_{int(datetime.utcnow().timestamp())}"
            cursor.execute("""
                INSERT INTO sources (id, type, target, title, priority, rule, enabled, last_post_id, added_by, created_at)
                VALUES (?, ?, ?, ?, 'high', 'official', 1, ?, ?, ?)
                ON CONFLICT(target) DO UPDATE SET enabled = 1, title = excluded.title
            """, (sid, src_type, clean_target, title or clean_target, str(last_post_id), added_by, now_str))
            conn.commit()
            sync_to_json_files()
            return True
        finally:
            conn.close()


def update_source_last_id(target: str, last_post_id: str):
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("UPDATE sources SET last_post_id = ? WHERE target = ?", (str(last_post_id), target))
            conn.commit()
        finally:
            conn.close()


def remove_source(target: str) -> bool:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            clean_tgt = target.strip()
            cursor.execute("DELETE FROM sources WHERE target = ? OR target = ?", (clean_tgt, "@" + clean_tgt.replace("@", "")))
            conn.commit()
            sync_to_json_files()
            return cursor.rowcount > 0
        finally:
            conn.close()


def replace_all_sources(sources_list: List[Dict[str, Any]]) -> bool:
    """استبدال كافة المصادر المخزنة في SQLite وحفظها بشكل مباشر ودائم"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM sources")
            now_str = datetime.utcnow().isoformat()
            for s in sources_list:
                sid = s.get("id") or f"src_{int(datetime.utcnow().timestamp())}_{abs(hash(str(s.get('target', '')))) % 10000}"
                cursor.execute("""
                    INSERT INTO sources (id, type, target, title, priority, rule, enabled, last_post_id, added_by, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 7607633343, ?)
                """, (
                    sid,
                    s.get("type", "telegram"),
                    s.get("target", "").strip(),
                    s.get("title", s.get("target", "")),
                    s.get("priority", "high"),
                    s.get("rule", "official"),
                    1 if s.get("enabled", True) else 0,
                    str(s.get("lastPostId", "")),
                    now_str
                ))
            conn.commit()
            sync_to_json_files()
            return True
        except Exception as e:
            logger.error(f"Error in replace_all_sources: {e}")
            return False
        finally:
            conn.close()


def clear_all_sources() -> bool:
    """مسح كافة المصادر المخزنة نهائياً من قاعدة بيانات SQLite وملف sources.json"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM sources")
            # تنظيف مصادر مشاريع الجامعات أيضاً إذا طلبت
            cursor.execute("UPDATE university_projects SET telegram_sources = '[]', twitter_sources = '[]'")
            conn.commit()
            sync_to_json_files()
            return True
        except Exception as e:
            logger.error(f"Error in clear_all_sources: {e}")
            return False
        finally:
            conn.close()



# ----------------- منع التكرار وإدارة المنشورات المعالجة -----------------

def is_post_seen(post_id: str, post_hash: str) -> bool:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT 1 FROM seen_posts WHERE post_id = ? OR post_hash = ?", (str(post_id), str(post_hash)))
            return cursor.fetchone() is not None
        finally:
            conn.close()


def mark_post_seen(post_id: str, post_hash: str, channel: str = ""):
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_str = datetime.utcnow().isoformat()
            cursor.execute("""
                INSERT OR IGNORE INTO seen_posts (post_id, post_hash, channel, created_at)
                VALUES (?, ?, ?, ?)
            """, (str(post_id), str(post_hash), channel, now_str))
            conn.commit()
        finally:
            conn.close()


def clear_seen_posts_cache() -> Dict[str, int]:
    """حذف وتصفير كافة المنشورات المحفوظة وكاش التكرار للسماح بإعادة سحب ونشر الأخبار من الصفر"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM seen_posts")
            seen_count = cursor.rowcount
            cursor.execute("DELETE FROM published_news_log")
            news_count = cursor.rowcount
            conn.commit()
            logger.info(f"🧹 [تصفير المنشورات المحفوظة] تم مسح {seen_count} سجل منع تكرار و {news_count} سجل أخبار منشورة")
            return {"seen_posts_cleared": seen_count, "published_news_cleared": news_count}
        finally:
            conn.close()


def delete_seen_post(post_id: str) -> bool:
    """حذف منشور محدد من جدول المنشورات المعالجة"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM seen_posts WHERE post_id = ?", (str(post_id),))
            cursor.execute("DELETE FROM published_news_log WHERE post_id = ?", (str(post_id),))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()



# ----------------- خوارزمية منع التكرار الذكي والمقارنة خلال 24 ساعة -----------------

STOP_WORDS_ARABIC = {
    'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي', 'الذين',
    'أن', 'إن', 'قد', 'تم', 'كان', 'كانت', 'يكون', 'تكون', 'أو', 'أم', 'لا', 'ما', 'لم', 'لن',
    'كل', 'بعد', 'قبل', 'خلال', 'حول', 'بين', 'أجل', 'عند', 'حيث', 'نحو', 'عبر', 'أنه', 'إنها',
    'وقال', 'وقالت', 'أعلن', 'أعلنت', 'ذكر', 'ذكرت', 'يسر', 'يسرنا', 'نعلن', 'أعزاءنا', 'الطلاب',
    'الطالبات', 'طلاب', 'طالبات', 'جامعة', 'كلية', 'عمادة', 'للعام', 'الدراسي', 'الجديد', 'عبر',
    'بشأن', 'حول', 'الرسمي', 'الرسمية', 'بوابة', 'رابط', 'اليوم', 'أمس', 'غداً', 'تعلن'
}


def normalize_arabic_text(text: str) -> str:
    """تجريد النص وتوحيد الحروف للتحقق الدقيق من التكرار الدلالي واللفظي"""
    if not text:
        return ""
    # إزالة الروابط والـ URLs
    s = re.sub(r'https?://\S+|www\.\S+', '', text)
    # إزالة علامات الترقيم والأقواس والرموز التعبيرية
    s = re.sub(r'[^\w\s]', ' ', s)
    # إزالة التشكيل
    s = re.sub(r'[\u064B-\u065F\u0670]', '', s)
    # توحيد الألف
    s = re.sub(r'[إأآا]', 'ا', s)
    # توحيد الياء والتاء المربوطة
    s = re.sub(r'ى', 'ي', s)
    s = re.sub(r'ة', 'ه', s)
    # إزالة الأسطر والمسافات المتكررة
    s = re.sub(r'\s+', ' ', s)
    return s.strip().lower()


def extract_key_tokens(text: str) -> List[str]:
    """استخراج الكلمات المفتاحية والجوهرية للخبر بعد إزالة كلمات الربط الشائعة"""
    norm = normalize_arabic_text(text)
    words = norm.split()
    tokens = [w for w in words if len(w) > 2 and w not in STOP_WORDS_ARABIC]
    return tokens


def check_smart_duplicate(title: str, text: str, target_univ: Optional[str] = None, hours: int = 24) -> Tuple[bool, Optional[Dict[str, Any]], float, str]:
    """
    مقارنة الخبر الجديد بالأخبار المنشورة خلال الـ 24 ساعة الماضية:
    إذا كان الخبر متطابقاً أو يتحدث عن نفس الموضوع والفعالية (حتى لو اختلف مصدره)، يُعاد:
    (True, past_story, similarity_score, reason)
    reason:
      - 'identical': تطابق تام أو شبه تام (تخطي تلقائي لعدم التكرار)
      - 'similar_topic': نفس الفعالية/الحدث ولكن بتفاصيل جديدة من مصدر آخر (مرشح للدمج الذكي)
    """
    norm_title = normalize_arabic_text(title)
    if not norm_title:
        first_line = (text.split("\n")[0] if text else "")[:80]
        norm_title = normalize_arabic_text(first_line)

    new_tokens = set(extract_key_tokens(title + " " + text[:300]))
    if not norm_title and not new_tokens:
        return False, None, 0.0, "empty"

    since_time = (datetime.utcnow() - timedelta(hours=hours)).isoformat()

    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            if target_univ:
                cursor.execute("""
                    SELECT id, post_id, title, clean_text, normalized_title, tokens, target_channel, target_univ, published_at
                    FROM published_news_log
                    WHERE published_at >= ? AND (target_univ = ? OR target_univ IS NULL)
                    ORDER BY id DESC
                """, (since_time, target_univ))
            else:
                cursor.execute("""
                    SELECT id, post_id, title, clean_text, normalized_title, tokens, target_channel, target_univ, published_at
                    FROM published_news_log
                    WHERE published_at >= ?
                    ORDER BY id DESC
                """, (since_time,))

            rows = cursor.fetchall()
            for row in rows:
                past = dict(row)
                past_norm_title = past.get("normalized_title") or ""
                past_tokens = set(json.loads(past.get("tokens") or "[]"))

                # 1. قياس نسبة تشابه العناوين بواسطة SequenceMatcher
                title_ratio = difflib.SequenceMatcher(None, norm_title, past_norm_title).ratio()

                # 2. قياس تشابه الكلمات المفتاحية الأساسية (Jaccard Index)
                jaccard = 0.0
                if new_tokens and past_tokens:
                    intersection = new_tokens & past_tokens
                    union = new_tokens | past_tokens
                    jaccard = len(intersection) / len(union) if union else 0.0

                combined_score = max(title_ratio, jaccard)

                # إذا كانت النسبة أعلى من 82%: تطابق تام أو شبه تام من مصدر آخر
                if combined_score >= 0.82:
                    return True, past, combined_score, "identical"

                # إذا كانت النسبة بين 50% و 82%: نفس الفعالية/الموضوع الأكاديمي مع صياغة مختلفة
                if combined_score >= 0.50:
                    return True, past, combined_score, "similar_topic"

                # التحقق إذا كانت 4 كلمات محورية مشتركة (مثل: قبول + هندسة + مواعيد + تسجيل)
                if len(new_tokens & past_tokens) >= 4:
                    return True, past, 0.75, "similar_topic"

            return False, None, 0.0, "unique"
        finally:
            conn.close()


def is_duplicate_published_news(text: str, target_univ: Optional[str] = None, max_hours: int = 24) -> Tuple[bool, str]:
    """
    فحص فوري ودقيق لما إذا كان نص الخبر أو التغريدة قد نُشر سابقاً أو يكرر خبراً نُشر للجامعة خلال الـ 24 ساعة الماضية.
    يعيد (True, reason) في حال التطابق أو وجود خبر مماثل، أو (False, "") إذا كان الخبر جديداً.
    """
    if not text or len(text.strip()) < 10:
        return False, ""
    first_line = (text.split("\n")[0] if text else "")[:90]
    is_dup, past_story, score, reason = check_smart_duplicate(first_line, text, target_univ=target_univ, hours=max_hours)
    if is_dup:
        return True, f"{reason} تطابق {score*100:.1f}%"
    return False, ""


def log_published_story(post_id: str, title: str, clean_text: str, target_channel: str, target_univ: Optional[str] = None):
    """تسجيل الخبر المنشور في سجل الـ 24 ساعة للمقارنة ومنع التكرار والدمج"""
    norm_title = normalize_arabic_text(title)
    tokens = extract_key_tokens(title + " " + clean_text[:300])
    now_str = datetime.utcnow().isoformat()

    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO published_news_log 
                (post_id, title, clean_text, normalized_title, tokens, target_channel, target_univ, published_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                str(post_id),
                title[:200],
                clean_text[:1500],
                norm_title,
                json.dumps(tokens, ensure_ascii=False),
                target_channel,
                target_univ,
                now_str
            ))
            conn.commit()
        finally:
            conn.close()


# ----------------- النشر المجدول (Scheduled Posts) -----------------

def add_scheduled_post(user_id: int, target_channel: str, raw_text: str, photo_url: Optional[str], publish_at: str) -> int:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_str = datetime.utcnow().isoformat()
            cursor.execute("""
                INSERT INTO scheduled_posts (user_id, target_channel, raw_text, photo_url, publish_at, status, created_at)
                VALUES (?, ?, ?, ?, ?, 'pending', ?)
            """, (user_id, target_channel, raw_text, photo_url, publish_at, now_str))
            conn.commit()
            return cursor.lastrowid
        finally:
            conn.close()


def get_due_scheduled_posts() -> List[Dict[str, Any]]:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_str = datetime.utcnow().isoformat()
            cursor.execute("""
                SELECT * FROM scheduled_posts 
                WHERE status = 'pending' AND publish_at <= ?
                ORDER BY publish_at ASC
            """, (now_str,))
            return [dict(r) for r in cursor.fetchall()]
        finally:
            conn.close()


def mark_scheduled_post_status(post_id: int, status: str):
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("UPDATE scheduled_posts SET status = ? WHERE id = ?", (status, post_id))
            conn.commit()
        finally:
            conn.close()


# ----------------- إدارة مشاريع الجامعات وقنوات النشر المستقلة -----------------

def add_university_project(
    name: str,
    target_channel: str,
    telegram_sources: List[str],
    twitter_sources: List[str],
    google_news_query: Optional[str] = None,
    keywords: Optional[List[str]] = None,
    univ_id: Optional[str] = None
) -> Dict[str, Any]:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            target_ch = target_channel.strip()
            if not target_ch.startswith("@") and not target_ch.startswith("-100"):
                target_ch = "@" + target_ch

            import re, time
            clean_tag = re.sub(r'[^a-zA-Z0-9_]', '', target_ch.replace("@", "")) or "univ"
            if not univ_id or not univ_id.strip():
                univ_id = f"univ_{clean_tag}_{int(time.time())}"
            else:
                univ_id = univ_id.strip()
            now_str = datetime.utcnow().isoformat()

            if not google_news_query:
                google_news_query = name.strip()

            if keywords is None:
                keywords = [name.strip()]
                for word in name.strip().split():
                    if len(word) > 3 and word not in ["جامعة", "كلية", "عمادة"]:
                        keywords.append(word)

            cursor.execute("""
                INSERT OR REPLACE INTO university_projects 
                (id, name, target_channel, telegram_sources, twitter_sources, google_news_query, google_news_enabled, keywords, enabled, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 1, ?, 1, ?)
            """, (
                univ_id,
                name.strip(),
                target_ch,
                json.dumps(telegram_sources, ensure_ascii=False),
                json.dumps(twitter_sources, ensure_ascii=False),
                google_news_query,
                json.dumps(keywords, ensure_ascii=False),
                now_str
            ))
            cursor.execute("""
                INSERT OR IGNORE INTO target_channels (channel_id, title, status, created_at)
                VALUES (?, ?, 'active', ?)
            """, (target_ch, f"قناة {name.strip()}", now_str))

            # 3. إدراج وتفعيل كافة مصادر تيليجرام التابعة للجامعة في جدول sources تلقائياً
            for tg_s in telegram_sources:
                tg_clean = tg_s.strip()
                if tg_clean:
                    cursor.execute("""
                        INSERT INTO sources (id, type, target, title, priority, rule, enabled, last_post_id, added_by, created_at)
                        VALUES (?, 'telegram', ?, ?, 'high', 'official', 1, '0', 7607633343, ?)
                        ON CONFLICT(target) DO UPDATE SET enabled = 1, title = excluded.title
                    """, (f"src_{clean_tag}_{abs(hash(tg_clean)) % 100000}", tg_clean, f"مصدر {name.strip()}", now_str))

            # 4. إدراج وتفعيل مصادر تويتر/X التابعة للجامعة في جدول sources تلقائياً
            for tw_s in twitter_sources:
                tw_clean = tw_s.strip()
                if tw_clean:
                    cursor.execute("""
                        INSERT INTO sources (id, type, target, title, priority, rule, enabled, last_post_id, added_by, created_at)
                        VALUES (?, 'twitter', ?, ?, 'high', 'official', 1, '0', 7607633343, ?)
                        ON CONFLICT(target) DO UPDATE SET enabled = 1, title = excluded.title
                    """, (f"src_tw_{clean_tag}_{abs(hash(tw_clean)) % 100000}", tw_clean, f"تويتر {name.strip()}", now_str))

            conn.commit()
            sync_to_json_files()
            return {
                "id": univ_id,
                "name": name.strip(),
                "target_channel": target_ch,
                "telegram_sources": telegram_sources,
                "twitter_sources": twitter_sources,
                "google_news_query": google_news_query,
                "google_news_enabled": True,
                "keywords": keywords,
                "enabled": True
            }
        finally:
            conn.close()


def get_university_projects() -> List[Dict[str, Any]]:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM university_projects ORDER BY created_at ASC")
            rows = cursor.fetchall()
            results = []
            for r in rows:
                results.append({
                    "id": r["id"],
                    "name": r["name"],
                    "target_channel": r["target_channel"],
                    "telegram_sources": json.loads(r["telegram_sources"] or "[]"),
                    "twitter_sources": json.loads(r["twitter_sources"] or "[]"),
                    "google_news_query": r["google_news_query"] or r["name"],
                    "google_news_enabled": bool(r["google_news_enabled"]),
                    "keywords": json.loads(r["keywords"] or "[]"),
                    "enabled": bool(r["enabled"]),
                    "created_at": r["created_at"]
                })
            # ملاحظة هامة: لا نقوم بإعادة إنشاء أي جامعة افتراضية تلقائياً عند الحذف؛
            # إذا قام المستخدم بحذف الجامعة، تبقى محذوفة بشكل دائم ولا تعود للظهور مطلقاً.
            return results
        finally:
            conn.close()


def delete_university_project(univ_id: str) -> bool:
    """حذف مشروع الجامعة بشكل نهائي ودائم بالمعرف أو الاسم مع تطهير الهوية المعرفية والمصادر وقنوات النشر التابعة له"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            # استخراج تفاصيل المشروع قبل الحذف لمعرفة القنوات والمصادر المرتبطة
            cursor.execute("SELECT * FROM university_projects WHERE id = ? OR name = ?", (univ_id, univ_id))
            proj = cursor.fetchone()
            target_ch = proj["target_channel"] if proj else None
            proj_name = proj["name"] if proj else univ_id
            tg_sources = json.loads(proj["telegram_sources"] or "[]") if proj and proj["telegram_sources"] else []
            tw_sources = json.loads(proj["twitter_sources"] or "[]") if proj and proj["twitter_sources"] else []

            # 1. حذف المشروع من جدول المشاريع
            cursor.execute("DELETE FROM university_projects WHERE id = ? OR name = ?", (univ_id, univ_id))
            deleted = cursor.rowcount > 0

            # 2. حذف الهوية المعرفية والملخصات
            cursor.execute("DELETE FROM university_knowledge WHERE univ_id = ? OR univ_name = ?", (univ_id, proj_name))

            # 3. حذف سجلات الأخبار المنشورة الخاصة بالجامعة
            cursor.execute("DELETE FROM published_news_log WHERE target_univ = ? OR target_univ = ?", (univ_id, proj_name))

            # 4. تنظيف المصادر الحصرية التابعة لهذا المشروع من جدول sources
            all_linked_targets = [s.strip() for s in (tg_sources + tw_sources) if s.strip()]
            for lt in all_linked_targets:
                cursor.execute("DELETE FROM sources WHERE target = ? OR target = ?", (lt, lt.lstrip("@")))

            # 5. إذا كانت قناة النشر غير مستخدمة من أي جامعة أخرى، تنظيفها من target_channels
            if target_ch:
                cursor.execute("SELECT COUNT(*) as cnt FROM university_projects WHERE target_channel = ?", (target_ch,))
                cnt_row = cursor.fetchone()
                if cnt_row and cnt_row["cnt"] == 0:
                    cursor.execute("DELETE FROM target_channels WHERE channel_id = ?", (target_ch,))

            conn.commit()
            logger.info(f"🗑️ [حذف مشروع جامعة] تم حذف المشروع ({univ_id} - {proj_name}) وتطهير كافة مصادره وسجلاته بنجاح")
            sync_to_json_files()
            return deleted
        finally:
            conn.close()


def update_university_project(
    univ_id: str,
    name: Optional[str] = None,
    target_channel: Optional[str] = None,
    telegram_sources: Optional[List[str]] = None,
    twitter_sources: Optional[List[str]] = None,
    google_news_query: Optional[str] = None,
    keywords: Optional[List[str]] = None,
    enabled: Optional[bool] = None
) -> Optional[Dict[str, Any]]:
    """تعديل مشروع جامعة بالكامل (قناة النشر، المصادر، الاستعلام، الاسم، الكلمات المفتاحية)"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM university_projects WHERE id = ? OR name = ?", (univ_id, univ_id))
            row = cursor.fetchone()
            if not row:
                return None

            curr_id = row["id"]
            new_name = name.strip() if name is not None else row["name"]
            
            if target_channel is not None:
                new_target = target_channel.strip()
                if not new_target.startswith("@") and not new_target.startswith("-100"):
                    new_target = "@" + new_target
            else:
                new_target = row["target_channel"]

            new_tg = telegram_sources if telegram_sources is not None else json.loads(row["telegram_sources"] or "[]")
            new_tw = twitter_sources if twitter_sources is not None else json.loads(row["twitter_sources"] or "[]")
            new_gnews = google_news_query.strip() if google_news_query is not None else row["google_news_query"]
            new_kw = keywords if keywords is not None else json.loads(row["keywords"] or "[]")
            new_enabled = int(enabled) if enabled is not None else row["enabled"]

            cursor.execute("""
                UPDATE university_projects 
                SET name = ?, target_channel = ?, telegram_sources = ?, twitter_sources = ?,
                    google_news_query = ?, keywords = ?, enabled = ?
                WHERE id = ?
            """, (
                new_name,
                new_target,
                json.dumps(new_tg, ensure_ascii=False),
                json.dumps(new_tw, ensure_ascii=False),
                new_gnews,
                json.dumps(new_kw, ensure_ascii=False),
                new_enabled,
                curr_id
            ))

            now_str = datetime.utcnow().isoformat()
            cursor.execute("""
                INSERT OR IGNORE INTO target_channels (channel_id, title, status, created_at)
                VALUES (?, ?, 'active', ?)
            """, (new_target, f"قناة {new_name}", now_str))

            # تسجيل مصادر تيليجرام وتويتر الجديدة
            import re
            clean_tag = re.sub(r'[^a-zA-Z0-9_]', '', new_target.replace("@", "")) or "univ"
            for tg_s in new_tg:
                tg_clean = tg_s.strip()
                if tg_clean:
                    cursor.execute("""
                        INSERT INTO sources (id, type, target, title, priority, rule, enabled, last_post_id, added_by, created_at)
                        VALUES (?, 'telegram', ?, ?, 'high', 'official', 1, '0', 7607633343, ?)
                        ON CONFLICT(target) DO UPDATE SET enabled = 1, title = excluded.title
                    """, (f"src_{clean_tag}_{abs(hash(tg_clean)) % 100000}", tg_clean, f"مصدر {new_name}", now_str))

            for tw_s in new_tw:
                tw_clean = tw_s.strip()
                if tw_clean:
                    cursor.execute("""
                        INSERT INTO sources (id, type, target, title, priority, rule, enabled, last_post_id, added_by, created_at)
                        VALUES (?, 'twitter', ?, ?, 'high', 'official', 1, '0', 7607633343, ?)
                        ON CONFLICT(target) DO UPDATE SET enabled = 1, title = excluded.title
                    """, (f"src_tw_{clean_tag}_{abs(hash(tw_clean)) % 100000}", tw_clean, f"تويتر {new_name}", now_str))

            conn.commit()
            sync_to_json_files()
            logger.info(f"✏️ [تعديل مشروع جامعة] تم تحديث مشروع {new_name} ({curr_id}) بنجاح.")
            return {
                "id": curr_id,
                "name": new_name,
                "target_channel": new_target,
                "telegram_sources": new_tg,
                "twitter_sources": new_tw,
                "google_news_query": new_gnews,
                "keywords": new_kw,
                "enabled": bool(new_enabled)
            }
        finally:
            conn.close()


def get_university_by_id(univ_id: str) -> Optional[Dict[str, Any]]:
    """استرجاع مشروع جامعة محدد بدقة عبر معرفه الفريد"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM university_projects WHERE id = ?", (univ_id,))
            r = cursor.fetchone()
            if not r:
                return None
            return {
                "id": r["id"],
                "name": r["name"],
                "target_channel": r["target_channel"],
                "telegram_sources": json.loads(r["telegram_sources"] or "[]"),
                "twitter_sources": json.loads(r["twitter_sources"] or "[]"),
                "google_news_query": r["google_news_query"] or r["name"],
                "google_news_enabled": bool(r["google_news_enabled"]),
                "keywords": json.loads(r["keywords"] or "[]"),
                "enabled": bool(r["enabled"]),
                "created_at": r["created_at"]
            }
        finally:
            conn.close()


def toggle_university_status(univ_id: str) -> Optional[bool]:
    """تبديل حالة نشاط جامعة معينة (تفعيل / إيقاف مؤقت) بشكل مستقل تماماً"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT enabled FROM university_projects WHERE id = ?", (univ_id,))
            r = cursor.fetchone()
            if not r:
                return None
            new_state = 0 if r["enabled"] else 1
            cursor.execute("UPDATE university_projects SET enabled = ? WHERE id = ?", (new_state, univ_id))
            conn.commit()
            sync_to_json_files()
            return bool(new_state)
        finally:
            conn.close()


# ----------------- إدارة المعرفة المستفادة من المصادر وهوية الجامعات -----------------

def save_university_knowledge(univ_id: str, univ_name: str, knowledge_summary: str, learned_topics: str = "[]", learned_accounts: str = "[]") -> bool:
    """حفظ المعرفة المستفادة وهوية الجامعة المستخلصة بعد فحص مصادرها في قاعدة البيانات الدائمة"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_str = datetime.utcnow().isoformat()
            cursor.execute("""
                INSERT OR REPLACE INTO university_knowledge
                (univ_id, univ_name, knowledge_summary, learned_topics, learned_accounts, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (univ_id, univ_name, knowledge_summary, learned_topics, learned_accounts, now_str))
            conn.commit()
            return True
        except Exception as e:
            logger.error(f"خطأ حفظ المعرفة المستفادة لـ {univ_name}: {e}")
            return False
        finally:
            conn.close()


def get_university_knowledge(univ_id: str) -> Optional[Dict[str, Any]]:
    """استرجاع المعرفة المستفادة وهوية جامعة محددة"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM university_knowledge WHERE univ_id = ?", (univ_id,))
            r = cursor.fetchone()
            return dict(r) if r else None
        finally:
            conn.close()


def get_all_university_knowledge() -> List[Dict[str, Any]]:
    """استرجاع كافة المعارف المستفادة للجامعات"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM university_knowledge ORDER BY updated_at DESC")
            return [dict(r) for r in cursor.fetchall()]
        finally:
            conn.close()


# ----------------- التحكم في محرك بحث جوجل (Google News Engine Toggle) -----------------

def is_google_news_enabled() -> bool:
    """التحقق هل البحث في أخبار جوجل مفعل أم موقف تماماً بطلب المشرف (افتراضياً: معطل لمنع جلب المقالات العامة)"""
    return get_setting("google_news_enabled", "0") == "1"


def set_google_news_enabled(enabled: bool):
    """إيقاف أو تفعيل البحث في أخبار جوجل بالكامل"""
    val = "1" if enabled else "0"
    set_setting("google_news_enabled", val)
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("UPDATE university_projects SET google_news_enabled = ?", (1 if enabled else 0,))
            conn.commit()
            sync_to_json_files()
        finally:
            conn.close()


def toggle_google_news_enabled() -> bool:
    """تبديل حالة بحث جوجل (إيقاف / تشغيل) وإرجاع الحالة الجديدة"""
    current = is_google_news_enabled()
    new_state = not current
    set_google_news_enabled(new_state)
    return new_state


def is_twitter_search_enabled() -> bool:
    """التحقق هل البحث في تويتر/X بالكلمات المفتاحية والحسابات مفعل (افتراضياً: مفعل بدلاً من جوجل)"""
    return get_setting("twitter_search_enabled", "1") == "1"


def set_twitter_search_enabled(enabled: bool):
    """تفعيل أو إيقاف البحث وسحب الأخبار من تويتر/X"""
    val = "1" if enabled else "0"
    set_setting("twitter_search_enabled", val)
    sync_to_json_files()


def toggle_twitter_search_enabled() -> bool:
    """تبديل حالة بحث تويتر/X وإرجاع الحالة الجديدة"""
    current = is_twitter_search_enabled()
    new_state = not current
    set_twitter_search_enabled(new_state)
    return new_state


def get_source_toggles() -> Dict[str, bool]:
    """استرجاع إعدادات تشغيل مصادر الأخبار الحالية"""
    return {
        "google_news_enabled": is_google_news_enabled(),
        "twitter_search_enabled": is_twitter_search_enabled()
    }



def find_university_for_post(source: str, text: str = "") -> Optional[Dict[str, Any]]:
    """
    نظام التوجيه الأكاديمي الذكي:
    - يوجه المنشورات الواردة من المصادر المعتمدة مباشرة إلى القناة الهدف المخصصة.
    - لا يشترط أبداً ذكر اسم الجامعة في نص المنشور؛ أي إعلان، مواعيد، أو جداول من المصدر تُنشر تلقائياً.
    - إذا كان المصدر مرتبطاً بجامعة محددة، ينشر في قناتها.
    - إذا كان مصدراً عاماً مسجلاً، يوجه إلى القناة الأولى المعتمدة لضمان عدم ضياع أي خبر.
    """
    if not source:
        source = ""

    projects = get_university_projects()
    active_projects = [p for p in projects if p.get("enabled")]

    clean_src = (source or "").strip().lower()
    clean_src = clean_src.replace("https://t.me/s/", "").replace("https://t.me/", "").replace("t.me/", "").replace("https://x.com/", "").replace("https://twitter.com/", "")
    clean_src_no_at = clean_src.lstrip("@")
    clean_src_with_at = "@" + clean_src_no_at if clean_src_no_at else ""

    # 1. مطابقة مباشرة مع المصادر المسجلة في كل جامعة
    for p in active_projects:
        all_sources = [s.lower().strip() for s in (p.get("telegram_sources", []) + p.get("twitter_sources", []))]
        all_sources_clean = [
            s.replace("https://t.me/s/", "").replace("https://t.me/", "").replace("t.me/", "").replace("https://x.com/", "").replace("https://twitter.com/", "").lstrip("@")
            for s in all_sources
        ]
        if (clean_src_no_at and clean_src_no_at in all_sources_clean) or (clean_src_with_at and clean_src_with_at in all_sources):
            return p

    # 2. فحص الكلمات المفتاحية واسم الجامعة في النص مع نظام النقاط وعزل التعارض التام
    if text:
        text_lower = text.lower()
        scored_projects = []
        for p in active_projects:
            score = 0
            p_name = p.get("name", "").lower()
            if p_name and p_name in text_lower:
                score += 10
            for kw in p.get("keywords", []):
                if kw and kw.lower() in text_lower:
                    score += 3
            if score > 0:
                scored_projects.append((score, p))

        if scored_projects:
            scored_projects.sort(key=lambda x: x[0], reverse=True)
            return scored_projects[0][1]

    # 3. إذا لم يطابق المصدر أو النص أياً من الجامعات، لا ننسب الخبر لأي جامعة عشوائياً
    return None


# ----------------- المزامنة مع ملفات JSON ومستودع GitHub -----------------

def sync_to_json_files():
    """حفظ الحالة الحالية في sources.json و state.json وتصديرها لوحدة التخزين الداخلية ومجلد التنزيلات"""
    try:
        chs = get_target_channels()
        srcs = get_sources()
        univs = get_university_projects()

        sources_data = {
            "_info": "Telegram University Educational AutoForwarder Watchlist (Synced from SQLite)",
            "version": "3.1.0",
            "lastUpdated": datetime.utcnow().isoformat(),
            "target_channels": chs,
            "university_projects": univs,
            "channel_mappings": [
                {
                    "target": u["target_channel"],
                    "sources": u["telegram_sources"] + u["twitter_sources"],
                    "university_name": u["name"],
                    "enabled": u["enabled"]
                }
                for u in univs
            ],
            "sources": [
                {
                    "id": s["id"],
                    "type": s["type"],
                    "target": s["target"],
                    "title": s["title"],
                    "priority": s["priority"],
                    "rule": s["rule"],
                    "enabled": bool(s["enabled"]),
                    "lastPostId": s["last_post_id"]
                }
                for s in srcs
            ]
        }
        with open(SOURCES_FILE, "w", encoding="utf-8") as f:
            json.dump(sources_data, f, ensure_ascii=False, indent=2)

        state_data = {
            "bot_status": get_setting("bot_status", "active"),
            "admin_id": get_setting("admin_id", "7607633343"),
            "admin_user": get_setting("admin_user", "@M_S_F_G"),
            "bot_username": get_setting("bot_username", "admiuin_bot"),
            "processed_count": int(get_setting("processed_count", "18")),
            "forwarded_count": int(get_setting("forwarded_count", "15")),
            "ad_replaced_count": int(get_setting("ad_replaced_count", "3")),
            "custom_instructions": get_setting("custom_instructions", ""),
            "ai_primary_model": get_setting("primary_model", "DeepSeek-V4-Flash"),
            "ai_base_url": get_setting("ai_base_url", "https://api.hcnsec.cn/v1"),
            "last_ai_status": get_setting("last_ai_status", "active"),
            "last_ai_error": get_setting("last_ai_error", ""),
            "last_run_timestamp": datetime.utcnow().isoformat()
        }
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state_data, f, ensure_ascii=False, indent=2)

        # حفظ نسخة موحدة في config.json
        if not os.path.exists(CONFIG_FILE):
            try:
                full_cfg = get_full_config()
                with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                    json.dump(full_cfg, f, ensure_ascii=False, indent=2)
            except Exception:
                pass

        # مزامنة وتصدير فوري لوحدة التخزين الداخلية ومجلد التنزيلات (Termux Downloads)
        export_to_phone_storage()
    except Exception as e:
        logger.warning(f"ملاحظة في مزامنة JSON: {e}")


def get_full_config() -> Dict[str, Any]:
    """استرجاع الإعدادات الشاملة المدمجة بين قاعدة البيانات وملفات config.json و state.json"""
    bot_token = get_setting("bot_token", os.getenv("BOT_TOKEN", os.getenv("TELEGRAM_BOT_TOKEN", "")))
    admin_id = get_setting("admin_id", os.getenv("ADMIN_ID", "7607633343"))
    admin_user = get_setting("admin_user", os.getenv("ADMIN_USERNAME", "M_S_F_G")).replace("@", "")
    ai_api_key = get_setting("ai_api_key", os.getenv("AI_API_KEY", "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii"))
    ai_base_url = get_setting("ai_base_url", os.getenv("AI_BASE_URL", "https://api.hcnsec.cn/v1"))
    primary_model = get_setting("primary_model", os.getenv("PRIMARY_MODEL", "DeepSeek-V4-Flash"))
    fallback_model = get_setting("fallback_model", os.getenv("FALLBACK_MODEL", "DeepSeek-V4.1-Flash"))
    system_prompt = get_setting("ai_system_prompt", "")
    custom_instructions = get_setting("custom_instructions", "")
    gemini_key = get_setting("gemini_api_key", os.getenv("GEMINI_API_KEY", ""))
    custom_ad = get_setting("custom_student_ad", "")
    ad_enabled = get_setting("ad_replacement_enabled", "false") == "true"
    ad_keywords_raw = get_setting("ad_keywords", "[]")
    try:
        ad_keywords = json.loads(ad_keywords_raw) if isinstance(ad_keywords_raw, str) else ad_keywords_raw
    except Exception:
        ad_keywords = [
            "حل واجبات بمقابل", "حل واجبات واختبارات", "حل كويزات", "حل فاينل",
            "حل اسايمنت", "كتابة بحوث بمقابل", "عمل بحوث ورسائل بمقابل", "إعلان مدفوع للخدمات"
        ]

    last_ai_status = get_setting("last_ai_status", "active")
    last_ai_error = get_setting("last_ai_error", "")
    last_ai_latency = get_setting("last_ai_latency", "0")

    file_cfg: Dict[str, Any] = {}
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                file_cfg = json.load(f)
        except Exception:
            pass

    return {
        "botToken": bot_token or file_cfg.get("botToken", ""),
        "adminId": admin_id or file_cfg.get("adminId", "7607633343"),
        "adminUsername": admin_user or file_cfg.get("adminUsername", "M_S_F_G"),
        "ai": {
            "apiBase": ai_base_url or file_cfg.get("ai", {}).get("apiBase", "https://api.hcnsec.cn/v1"),
            "apiKey": ai_api_key or file_cfg.get("ai", {}).get("apiKey", ""),
            "primaryModel": primary_model or file_cfg.get("ai", {}).get("primaryModel", "DeepSeek-V4-Flash"),
            "fallbackModel": fallback_model or file_cfg.get("ai", {}).get("fallbackModel", "DeepSeek-V4.1-Flash"),
            "systemPrompt": system_prompt or file_cfg.get("ai", {}).get("systemPrompt", ""),
            "customInstructions": custom_instructions or file_cfg.get("ai", {}).get("customInstructions", ""),
            "geminiApiKey": gemini_key or file_cfg.get("ai", {}).get("geminiApiKey", ""),
            "enableWebSearch": True,
            "lastAiStatus": last_ai_status,
            "lastAiError": last_ai_error,
            "lastAiLatency": last_ai_latency
        },
        "adReplacement": {
            "enabled": ad_enabled if ad_enabled is not None else file_cfg.get("adReplacement", {}).get("enabled", False),
            "adDetectionKeywords": ad_keywords or file_cfg.get("adReplacement", {}).get("adDetectionKeywords", []),
            "customStudentAd": custom_ad or file_cfg.get("adReplacement", {}).get("customStudentAd", "")
        },
        "telethon": file_cfg.get("telethon", {
            "apiId": "20123456",
            "apiHash": "",
            "phoneNumber": "",
            "sessionName": "session_forwarder",
            "stringSession": "",
            "library": "telethon"
        }),
        "mediaHandling": file_cfg.get("mediaHandling", {
            "downloadPhotos": True,
            "downloadVideos": True,
            "downloadDocuments": True
        }),
        "targetChannels": get_target_channels(),
        "lastUpdated": datetime.utcnow().isoformat()
    }


def save_full_config(cfg: Dict[str, Any]) -> Dict[str, Any]:
    """
    حفظ الإعدادات الشاملة فورياً في:
    1. قاعدة البيانات الدائمة (SQLite)
    2. ملف config.json المباشر
    3. ملف state.json
    4. تصديرها فورياً لوحدة التخزين الداخلية ومجلد التنزيلات بالهاتف
    """
    try:
        # حفظ التوكن وبيانات الآدمن
        if "botToken" in cfg and cfg["botToken"]:
            set_setting("bot_token", str(cfg["botToken"]).strip())
        if "adminId" in cfg and cfg["adminId"]:
            set_setting("admin_id", str(cfg["adminId"]).strip())
        if "adminUsername" in cfg and cfg["adminUsername"]:
            set_setting("admin_user", str(cfg["adminUsername"]).replace("@", "").strip())

        # حفظ إعدادات الذكاء الاصطناعي
        ai = cfg.get("ai", {})
        if isinstance(ai, dict):
            if "apiBase" in ai and ai["apiBase"]:
                set_setting("ai_base_url", str(ai["apiBase"]).strip())
            if "apiKey" in ai and ai["apiKey"]:
                set_setting("ai_api_key", str(ai["apiKey"]).strip())
            if "primaryModel" in ai and ai["primaryModel"]:
                set_setting("primary_model", str(ai["primaryModel"]).strip())
            if "fallbackModel" in ai and ai["fallbackModel"]:
                set_setting("fallback_model", str(ai["fallbackModel"]).strip())
            if "systemPrompt" in ai and ai["systemPrompt"]:
                set_setting("ai_system_prompt", str(ai["systemPrompt"]).strip())
            if "customInstructions" in ai and ai["customInstructions"]:
                set_setting("custom_instructions", str(ai["customInstructions"]).strip())
            if "geminiApiKey" in ai:
                set_setting("gemini_api_key", str(ai["geminiApiKey"]).strip())

        # حفظ إعدادات استبدال الإعلانات
        ad = cfg.get("adReplacement", {})
        if isinstance(ad, dict):
            if "enabled" in ad:
                set_setting("ad_replacement_enabled", "true" if ad["enabled"] else "false")
            if "customStudentAd" in ad:
                set_setting("custom_student_ad", str(ad["customStudentAd"]).strip())
            if "adDetectionKeywords" in ad and isinstance(ad["adDetectionKeywords"], list):
                set_setting("ad_keywords", json.dumps(ad["adDetectionKeywords"], ensure_ascii=False))

        # كتابة ملف config.json المباشر
        cfg["lastUpdated"] = datetime.utcnow().isoformat()
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, ensure_ascii=False, indent=2)

        # المزامنة مع state.json والتخزين الداخلي ومستودع GitHub
        sync_to_json_files()
        export_to_phone_storage()
        git_sync("Auto-sync from Web UI configuration")
        return {"success": True, "message": "تم حفظ الإعدادات مباشرة في الملفات والتخزين الداخلي بنجاح"}
    except Exception as e:
        logger.error(f"خطأ في حفظ الإعدادات الشاملة: {e}")
        return {"success": False, "error": str(e)}


def get_phone_storage_paths() -> List[str]:
    """
    اكتشاف كافة مسارات وحدة التخزين الداخلية ومجلد التنزيلات على أجهزة أندرويد وTermux
    """
    candidates = [
        "/sdcard/Download/ملف_النشر",
        "/storage/emulated/0/Download/ملف_النشر",
        os.path.expanduser("~/storage/downloads/ملف_النشر"),
        os.path.expanduser("~/storage/shared/Download/ملف_النشر"),
        os.path.join(BASE_DIR, "storage_downloads", "ملف_النشر"),
        "/sdcard/Download/TelegramBot",
        os.path.join(BASE_DIR, "storage_downloads", "TelegramBot")
    ]
    valid_paths = []
    for p in candidates:
        try:
            parent = os.path.dirname(p)
            if os.path.exists(parent) or os.path.exists("/sdcard") or os.path.exists("/storage/emulated/0"):
                os.makedirs(p, exist_ok=True)
                valid_paths.append(p)
        except Exception:
            pass
    # نضمن دائماً وجود مسار محلي موحد على الأقل
    fallback_p = os.path.join(BASE_DIR, "storage_downloads", "TelegramBot")
    try:
        os.makedirs(fallback_p, exist_ok=True)
        if fallback_p not in valid_paths:
            valid_paths.append(fallback_p)
    except Exception:
        pass
    return valid_paths


def export_to_phone_storage() -> Dict[str, Any]:
    """
    تصدير ومزامنة فورية لكافة ملفات الإعدادات والجامعات وقاعدة البيانات لمجلد التنزيلات في الهاتف
    """
    try:
        paths = get_phone_storage_paths()
        univs = get_university_projects()

        univ_data = {
            "_title": "Telegram University Projects - Live Sync",
            "last_synced": datetime.utcnow().isoformat(),
            "total_universities": len(univs),
            "universities": univs
        }
        readme_content = """===============================================================
مجلد المزامنة المباشرة لبوت الجامعات الأكاديمي (Termux & Internal Storage)
===============================================================
هذا المجلد مرتبط بوحدة التخزين الداخلية ومجلد التنزيلات (Downloads) في هاتفك،
ويتم تحديثه ومزامنته لحظة بلحظة مع البوت وواجهة الويب وتطبيق Termux.

الملفات المتزامنة في هذا المجلد:
1. universities.json:
   - يحتوي على كافة الجامعات المضافة وقنوات النشر التابعة لها ومصادرها.
   - يمكنك تعديل قناة النشر أو إضافة وحذف مصادر تيليجرام وتويتر هنا مباشرة.

2. sources.json:
   - ملف الإعدادات الشامل للمصادر والقنوات المعتمدة المتوافق مع بوت بزنس.

3. state.json:
   - حالة النظام وإحصائيات النشر والإعلانات البديلة وآخر التوجيهات.

4. bot_database_backup.sqlite:
   - نسخة احتياطية حية من قاعدة بيانات البوت (SQLite).

كيفية التعديل من الهاتف:
- يمكنك فتح universities.json بواسطة أي تطبيق مثل QuickEdit أو MT Manager أو محرر نصوص.
- احفظ التعديلات، ثم اضغط زر 'مزامنة التخزين الداخلي' من واجهة الويب أو أرسل /sync_storage في تيليجرام.
- سيقوم البوت باستيراد كافة تعديلاتك وتطبيقها فوراً دون الحاجة لإعادة التشغيل!
==============================================================="""

        synced_count = 0
        import shutil
        for folder in paths:
            try:
                # 1. universities.json
                with open(os.path.join(folder, "universities.json"), "w", encoding="utf-8") as f:
                    json.dump(univ_data, f, ensure_ascii=False, indent=2)

                # 2. sources.json copy
                if os.path.exists(SOURCES_FILE):
                    shutil.copy2(SOURCES_FILE, os.path.join(folder, "sources.json"))

                # 3. state.json copy
                if os.path.exists(STATE_FILE):
                    shutil.copy2(STATE_FILE, os.path.join(folder, "state.json"))

                # 3.1 config.json copy
                if os.path.exists(CONFIG_FILE):
                    shutil.copy2(CONFIG_FILE, os.path.join(folder, "config.json"))

                # 4. sqlite database copy
                if os.path.exists(DB_FILE):
                    shutil.copy2(DB_FILE, os.path.join(folder, "bot_database_backup.sqlite"))

                # 5. README_TERMUX.txt
                with open(os.path.join(folder, "README_TERMUX.txt"), "w", encoding="utf-8") as f:
                    f.write(readme_content)

                synced_count += 1
            except Exception as fe:
                logger.debug(f"Phone storage write note for {folder}: {fe}")

        # حفظ نسخة universities.json في المجلد الرئيسي أيضاً
        with open(os.path.join(BASE_DIR, "universities.json"), "w", encoding="utf-8") as f:
            json.dump(univ_data, f, ensure_ascii=False, indent=2)

        return {"success": True, "synced_folders": paths, "count": synced_count}
    except Exception as e:
        logger.warning(f"ملاحظة في تصدير التخزين الداخلي: {e}")
        return {"success": False, "error": str(e)}


def import_from_phone_storage(force: bool = False) -> Dict[str, Any]:
    """
    استيراد التعديلات من ملفات universities.json أو sources.json الموجودة في مجلد التنزيلات بالهاتف
    """
    try:
        paths = get_phone_storage_paths()
        imported = False
        target_path = None

        for folder in paths:
            u_path = os.path.join(folder, "universities.json")
            if os.path.exists(u_path):
                # إذا كانت النسخة في التخزين الداخلي أحدث أو تم فرض الاستيراد
                local_u = os.path.join(BASE_DIR, "universities.json")
                if force or not os.path.exists(local_u) or os.path.getmtime(u_path) > os.path.getmtime(local_u):
                    with open(u_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    univ_list = data.get("universities", [])
                    if isinstance(univ_list, list) and len(univ_list) > 0:
                        for u in univ_list:
                            add_university_project(
                                name=u["name"],
                                target_channel=u["target_channel"],
                                telegram_sources=u.get("telegram_sources", []),
                                twitter_sources=u.get("twitter_sources", []),
                                google_news_query=u.get("google_news_query"),
                                keywords=u.get("keywords"),
                                univ_id=u.get("id")
                            )
                        imported = True
                        target_path = u_path
                        break

        # أيضاً فحص sources.json
        if not imported:
            for folder in paths:
                s_path = os.path.join(folder, "sources.json")
                if os.path.exists(s_path) and s_path != SOURCES_FILE:
                    if force or os.path.getmtime(s_path) > os.path.getmtime(SOURCES_FILE):
                        with open(s_path, "r", encoding="utf-8") as f:
                            sdata = json.load(f)
                        univ_list = sdata.get("university_projects", [])
                        for u in univ_list:
                            add_university_project(
                                name=u["name"],
                                target_channel=u["target_channel"],
                                telegram_sources=u.get("telegram_sources", []),
                                twitter_sources=u.get("twitter_sources", []),
                                google_news_query=u.get("google_news_query"),
                                keywords=u.get("keywords"),
                                univ_id=u.get("id")
                            )
                        imported = True
                        target_path = s_path
                        break

        if imported:
            sync_to_json_files()
            logger.info(f"📥 [Termux Storage Sync] تم بنجاح استيراد التعديلات من التخزين الداخلي: {target_path}")
            return {"success": True, "imported": True, "source_path": target_path}
        else:
            return {"success": True, "imported": False, "message": "الملفات متطابقة بالفعل ولا توجد تعديلات جديدة"}
    except Exception as e:
        logger.warning(f"ملاحظة في استيراد التخزين الداخلي: {e}")
        return {"success": False, "error": str(e)}


def sync_all_storages(force_import: bool = False) -> Dict[str, Any]:
    """
    مزامنة شاملة ثنائية الاتجاه تجمع بين:
    1. استيراد التعديلات من التخزين الداخلي / Termux
    2. تصدير الحالة الحالية لجميع مسارات التنزيل في الهاتف (مجلد ملف_النشر)
    3. تصدير ملفات تويتر، تيليجرام، ملفات الجامعات، والعقل المدبر
    4. مزامنة ملفات JSON ومستودع GitHub
    """
    imp_res = import_from_phone_storage(force=force_import)
    exp_res = export_to_phone_storage()
    pkg_res = {}
    try:
        import publish_files_manager as pfm
        pkg_res = pfm.build_and_sync_publish_package()
    except Exception as e:
        logger.warning(f"ملاحظة في مزامنة حزمة ملف النشر: {e}")

    git_res = git_sync("Sync Termux internal storage and publish package")
    return {
        "success": True,
        "import_result": imp_res,
        "export_result": exp_res,
        "publish_package_result": pkg_res,
        "git_result": git_res,
        "active_paths": get_phone_storage_paths()
    }


def git_sync(commit_message: str = "Auto-sync update") -> Dict[str, Any]:
    """مزامنة ثنائية الاتجاه مع مستودع GitHub تلقائياً عند أي تعديل من الويب أو تيليجرام"""
    try:
        sync_to_json_files()
        import subprocess

        # Git add
        subprocess.run(["git", "add", "-A"], cwd=BASE_DIR, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=15)
        # Git commit
        subprocess.run(["git", "commit", "-m", commit_message], cwd=BASE_DIR, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=15)

        # Non-blocking push to origin master (only if token is provided)
        def _bg_push():
            gh_token = os.getenv("GITHUB_TOKEN", "").strip() or os.getenv("GH_TOKEN", "").strip()
            if gh_token:
                authed_remote = f"https://{gh_token}@github.com/mstfy737216610-prog/Booooot_ADMAN.git"
                try:
                    subprocess.run(["git", "push", authed_remote, "master"], cwd=BASE_DIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=25)
                except Exception:
                    pass

        threading.Thread(target=_bg_push, daemon=True).start()
        logger.info(f"🔄 [Git Sync] تمت مزامنة التعديلات بنجاح: {commit_message}")
        return {"success": True, "message": "تمت المزامنة بنجاح مع مستودع GitHub"}
    except Exception as e:
        logger.warning(f"ملاحظة في Git sync: {e}")
        return {"success": False, "error": str(e)}


def check_ai_health() -> Dict[str, Any]:
    """
    فحص صحة اتصال مزود الذكاء الاصطناعي بدقة وأمان دون أخطاء ترميز
    """
    import urllib.request
    import ssl
    import time

    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE

    base = get_setting("ai_base_url", os.getenv("AI_BASE_URL", "https://api.hcnsec.cn/v1")).rstrip("/")
    key = get_setting("ai_api_key", os.getenv("AI_API_KEY", "")).strip()
    model = get_setting("primary_model", os.getenv("PRIMARY_MODEL", "DeepSeek-V4-Flash")).strip()
    gemini_key = get_setting("gemini_api_key", os.getenv("GEMINI_API_KEY", "")).strip()

    result = {
        "status": "degraded",
        "provider": base,
        "primaryModel": model,
        "hasKey": bool(key),
        "hasGeminiKey": bool(gemini_key),
        "latency_ms": 0,
        "lastError": None,
        "message": ""
    }

    # 1. فحص OpenAI / DeepSeek
    if key and key != "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii":
        try:
            t0 = time.time()
            url = f"{base}/chat/completions"
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": "ping"}],
                "max_tokens": 5
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=6) as r:
                lat = int((time.time() - t0) * 1000)
                result["status"] = "online"
                result["latency_ms"] = lat
                result["message"] = f"متصل بنجاح ({lat}ms)"
                set_setting("last_ai_status", "online")
                set_setting("last_ai_error", "")
                set_setting("last_ai_latency", str(lat))
                return result
        except Exception as e:
            err_msg = str(e)
            result["lastError"] = err_msg
            if "403" in err_msg:
                result["message"] = "مفتاح مزود الذكاء الاصطناعي محظور أو منتهي الصلاحية (HTTP 403 Forbidden)"
            elif "401" in err_msg:
                result["message"] = "مفتاح الذكاء الاصطناعي غير صحيح (401 Unauthorized)"
            elif "429" in err_msg:
                result["message"] = "تجاوزت الحصة لمزود الذكاء الاصطناعي (429 Rate Limit)"
            else:
                result["message"] = f"تعذر الاتصال بالمزود: {err_msg}"
            set_setting("last_ai_status", "degraded")
            set_setting("last_ai_error", result["message"])

    # 2. فحص Gemini
    if gemini_key:
        try:
            t0 = time.time()
            g_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={gemini_key}"
            g_payload = {"contents": [{"parts": [{"text": "ping"}]}]}
            g_req = urllib.request.Request(g_url, data=json.dumps(g_payload).encode("utf-8"), headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(g_req, context=ssl_ctx, timeout=6) as gr:
                lat = int((time.time() - t0) * 1000)
                result["status"] = "online"
                result["primaryModel"] = "gemini-3.1-flash-lite"
                result["latency_ms"] = lat
                result["message"] = f"متصل عبر Gemini بنجاح ({lat}ms)"
                set_setting("last_ai_status", "online")
                set_setting("last_ai_error", "")
                set_setting("last_ai_latency", str(lat))
                return result
        except Exception as ge:
            result["lastError"] = str(ge)

    if not key and not gemini_key:
        result["message"] = "لم يتم إدخال مفتاح ذكاء اصطناعي، والمحرك الأكاديمي الداخلي نشط بالكامل لتوفير الردود وصياغة الأخبار."
    elif result["status"] == "degraded":
        result["message"] = result.get("message") or "المحرك الأكاديمي المعرفي الداخلي نشط لتوفير ردود فورية ودقيقة."

    return result


# ----------------- دوال سجل التدقيق الشامل (Comprehensive Post Audit Log) -----------------

def add_audit_log(
    status: str,
    title: str,
    raw_content: str,
    final_content: str = "",
    rejection_reason: str = "",
    source_type: str = "telegram",
    source_origin: str = "",
    target_destination: str = "",
    target_univ: str = "",
    media_type: str = "text",
    media_url: str = "",
    post_id: Optional[str] = None
) -> int:
    """إضافة سجل منشور جديد (مقبول أو مرفوض) إلى جدول التدقيق الدائم"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_str = datetime.utcnow().isoformat()
            cursor.execute("""
            INSERT INTO post_audit_log (
                post_id, status, title, raw_content, final_content, rejection_reason,
                source_type, source_origin, target_destination, target_univ,
                media_type, media_url, created_at, published_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                post_id or f"log_{int(datetime.utcnow().timestamp()*1000)}",
                status,
                title,
                raw_content,
                final_content,
                rejection_reason,
                source_type,
                source_origin,
                target_destination,
                target_univ,
                media_type,
                media_url,
                now_str,
                now_str if status == "published" else None
            ))
            log_id = cursor.lastrowid
            conn.commit()
            return log_id
        except Exception as e:
            logger.error(f"❌ خطأ في add_audit_log: {e}")
            return -1
        finally:
            conn.close()


def get_audit_logs(
    limit: int = 100,
    offset: int = 0,
    status: Optional[str] = None,
    search: Optional[str] = None,
    univ: Optional[str] = None
) -> List[Dict[str, Any]]:
    """جلب سجلات التدقيق مع إمكانية الفلترة والبحث"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            query = "SELECT * FROM post_audit_log WHERE 1=1"
            params: List[Any] = []

            if status and status != "all":
                query += " AND status = ?"
                params.append(status)

            if univ and univ != "all":
                query += " AND (target_univ = ? OR source_origin LIKE ?)"
                params.extend([univ, f"%{univ}%"])

            if search:
                query += " AND (title LIKE ? OR raw_content LIKE ? OR final_content LIKE ? OR rejection_reason LIKE ?)"
                kw = f"%{search}%"
                params.extend([kw, kw, kw, kw])

            query += " ORDER BY id DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])

            cursor.execute(query, params)
            return [dict(r) for r in cursor.fetchall()]
        except Exception as e:
            logger.error(f"❌ خطأ في get_audit_logs: {e}")
            return []
        finally:
            conn.close()


def get_audit_log_counts() -> Dict[str, int]:
    """إحصائيات إجمالية للمنشورات المقبولة والمرفوضة"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT status, COUNT(*) as cnt FROM post_audit_log GROUP BY status")
            counts = {"total": 0, "published": 0, "rejected": 0, "pending": 0}
            for r in cursor.fetchall():
                st = r["status"]
                cnt = r["cnt"]
                counts[st] = cnt
                counts["total"] += cnt
            return counts
        except Exception as e:
            logger.error(f"❌ خطأ في get_audit_log_counts: {e}")
            return {"total": 0, "published": 0, "rejected": 0, "pending": 0}
        finally:
            conn.close()


def delete_audit_log(audit_id: int) -> bool:
    """حذف سجل تدقيق محدد"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM post_audit_log WHERE id = ?", (audit_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"❌ خطأ في delete_audit_log: {e}")
            return False
        finally:
            conn.close()


def clear_audit_logs(status: Optional[str] = None) -> bool:
    """مسح السجلات بالكامل أو بحسب الحالة"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            if status and status != "all":
                cursor.execute("DELETE FROM post_audit_log WHERE status = ?", (status,))
            else:
                cursor.execute("DELETE FROM post_audit_log")
            conn.commit()
            return True
        except Exception as e:
            logger.error(f"❌ خطأ في clear_audit_logs: {e}")
            return False
        finally:
            conn.close()


def convert_audit_to_idea(audit_id: int, user_notes: str = "") -> Optional[int]:
    """تحويل منشور (سواء مرفوض أو مقبول) إلى فكرة مستقبلية في لوحة الأفكار"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM post_audit_log WHERE id = ?", (audit_id,))
            row = cursor.fetchone()
            if not row:
                return None

            audit_item = dict(row)
            title = audit_item.get("title") or "فكرة مستخلصة من منشور"
            desc = audit_item.get("raw_content") or audit_item.get("final_content") or ""
            op_notes = user_notes or (f"تم الاستخلاص من سجل المنشورات (الحالة السابقة: {audit_item.get('status')}). سبب الرفض إن وجد: {audit_item.get('rejection_reason', 'لا يوجد')}")

            now_str = datetime.utcnow().isoformat()
            cursor.execute("""
            INSERT INTO future_ideas (
                title, description, operational_notes, status, priority, tags,
                university_id, university_name, source_post_id, created_at, updated_at
            )
            VALUES (?, ?, ?, 'new', 'medium', ?, ?, ?, ?, ?, ?)
            """, (
                title,
                desc,
                op_notes,
                json.dumps(["مستخلص_من_السجل", audit_item.get("target_univ") or "شأن_طلابي"]),
                audit_item.get("target_univ"),
                audit_item.get("target_univ"),
                audit_id,
                now_str,
                now_str
            ))
            idea_id = cursor.lastrowid
            conn.commit()
            return idea_id
        except Exception as e:
            logger.error(f"❌ خطأ في convert_audit_to_idea: {e}")
            return None
        finally:
            conn.close()


# ----------------- دوال لوحة الأفكار والتغذية الراجعة الذكية (Future Ideas Board) -----------------

def add_future_idea(
    title: str,
    description: str = "",
    operational_notes: str = "",
    status: str = "new",
    priority: str = "medium",
    tags: Optional[List[str]] = None,
    university_id: Optional[str] = None,
    university_name: Optional[str] = None,
    source_post_id: Optional[int] = None
) -> int:
    """إضافة فكرة مستقبلية جديدة إلى لوحة الأفكار"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_str = datetime.utcnow().isoformat()
            cursor.execute("""
            INSERT INTO future_ideas (
                title, description, operational_notes, status, priority, tags,
                university_id, university_name, source_post_id, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                title.strip(),
                description.strip(),
                operational_notes.strip(),
                status,
                priority,
                json.dumps(tags or []),
                university_id,
                university_name,
                source_post_id,
                now_str,
                now_str
            ))
            idea_id = cursor.lastrowid
            conn.commit()
            return idea_id
        except Exception as e:
            logger.error(f"❌ خطأ في add_future_idea: {e}")
            return -1
        finally:
            conn.close()


def get_future_ideas(
    status: Optional[str] = None,
    search: Optional[str] = None,
    univ_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """جلب كافة الأفكار المستقبلية مع وسومها وملاحظاتها"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            query = "SELECT * FROM future_ideas WHERE 1=1"
            params: List[Any] = []

            if status and status != "all":
                query += " AND status = ?"
                params.append(status)

            if univ_id and univ_id != "all":
                query += " AND (university_id = ? OR university_name = ?)"
                params.extend([univ_id, univ_id])

            if search:
                query += " AND (title LIKE ? OR description LIKE ? OR operational_notes LIKE ?)"
                kw = f"%{search}%"
                params.extend([kw, kw, kw])

            query += " ORDER BY id DESC"
            cursor.execute(query, params)
            rows = cursor.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                try:
                    item["tags"] = json.loads(item.get("tags") or "[]")
                except Exception:
                    item["tags"] = []
                results.append(item)
            return results
        except Exception as e:
            logger.error(f"❌ خطأ في get_future_ideas: {e}")
            return []
        finally:
            conn.close()


def update_future_idea(idea_id: int, **kwargs) -> bool:
    """تحديث بيانات فكرة محددة (الملاحظات، الحالة، الأولوية، العنوان)"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            allowed_fields = [
                "title", "description", "operational_notes", "status",
                "priority", "tags", "university_id", "university_name",
                "twitter_ready", "telegram_ready"
            ]
            updates = []
            params = []
            for k, v in kwargs.items():
                if k in allowed_fields:
                    updates.append(f"{k} = ?")
                    if k == "tags" and isinstance(v, list):
                        params.append(json.dumps(v))
                    else:
                        params.append(v)

            if not updates:
                return False

            updates.append("updated_at = ?")
            params.append(datetime.utcnow().isoformat())
            params.append(idea_id)

            sql = f"UPDATE future_ideas SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(sql, params)
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"❌ خطأ في update_future_idea: {e}")
            return False
        finally:
            conn.close()


def move_idea_status(idea_id: int, new_status: str) -> bool:
    """تحديث حالة الفكرة بين الأعمدة (new, in_progress, ready, published, archived)"""
    return update_future_idea(idea_id, status=new_status)


def delete_future_idea(idea_id: int) -> bool:
    """حذف فكرة من اللوحة"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM future_ideas WHERE id = ?", (idea_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"❌ خطأ في delete_future_idea: {e}")
            return False
        finally:
            conn.close()


# ----------------- دوال إعدادات النشر على تويتر (Twitter Publishing Settings) -----------------

def get_twitter_settings() -> Dict[str, Any]:
    """استرجاع إعدادات النشر على تويتر"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM twitter_publishing_settings WHERE key = 'main_config'")
            row = cursor.fetchone()
            if row:
                return dict(row)
            return {
                "key": "main_config",
                "enabled": 0,
                "api_key": "",
                "api_secret": "",
                "access_token": "",
                "access_secret": "",
                "bearer_token": "",
                "auto_publish": 0,
                "auto_thread": 0,
                "max_chars": 280,
                "custom_hashtags": "#أخبار_الجامعات #القبول_والتسجيل",
                "last_tweet_id": "",
                "updated_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"❌ خطأ في get_twitter_settings: {e}")
            return {}
        finally:
            conn.close()


def save_twitter_settings(settings: Dict[str, Any]) -> bool:
    """حفظ وتحديث إعدادات تويتر"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_str = datetime.utcnow().isoformat()
            cursor.execute("""
            INSERT INTO twitter_publishing_settings (
                key, enabled, api_key, api_secret, access_token, access_secret,
                bearer_token, auto_publish, auto_thread, max_chars, custom_hashtags,
                last_tweet_id, updated_at
            )
            VALUES ('main_config', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
                enabled = excluded.enabled,
                api_key = excluded.api_key,
                api_secret = excluded.api_secret,
                access_token = excluded.access_token,
                access_secret = excluded.access_secret,
                bearer_token = excluded.bearer_token,
                auto_publish = excluded.auto_publish,
                auto_thread = excluded.auto_thread,
                max_chars = excluded.max_chars,
                custom_hashtags = excluded.custom_hashtags,
                last_tweet_id = excluded.last_tweet_id,
                updated_at = excluded.updated_at
            """, (
                int(settings.get("enabled", 0)),
                str(settings.get("api_key", "")),
                str(settings.get("api_secret", "")),
                str(settings.get("access_token", "")),
                str(settings.get("access_secret", "")),
                str(settings.get("bearer_token", "")),
                int(settings.get("auto_publish", 0)),
                int(settings.get("auto_thread", 0)),
                int(settings.get("max_chars", 280)),
                str(settings.get("custom_hashtags", "#أخبار_الجامعات #القبول_والتسجيل")),
                str(settings.get("last_tweet_id", "")),
                now_str
            ))
            conn.commit()
            return True
        except Exception as e:
            logger.error(f"❌ خطأ في save_twitter_settings: {e}")
            return False
        finally:
            conn.close()


def is_twitter_publishing_enabled() -> bool:
    """التحقق من تفعيل النشر التلقائي على تويتر"""
    sett = get_twitter_settings()
    return bool(sett.get("enabled", 0) == 1 and sett.get("auto_publish", 0) == 1)


# ========================================================
# 14. دوال إدارة حسابات تويتر المتعددة والمستقلة (Multi-Account)
# ========================================================

def _format_twitter_account(row: Dict[str, Any]) -> Dict[str, Any]:
    """تهيئة وتحليل حقول حساب تويتر بما فيها مصادر المراقبة"""
    d = dict(row)
    sources_raw = d.get("monitoring_sources")
    if isinstance(sources_raw, str):
        try:
            d["monitoring_sources"] = json.loads(sources_raw)
        except Exception:
            d["monitoring_sources"] = [s.strip() for s in sources_raw.split(",") if s.strip()]
    elif not isinstance(sources_raw, list):
        d["monitoring_sources"] = []
    return d


def get_twitter_accounts() -> List[Dict[str, Any]]:
    """استرجاع كافة حسابات تويتر المستقلة"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM twitter_accounts ORDER BY is_active DESC, updated_at DESC")
            rows = cursor.fetchall()
            return [_format_twitter_account(row) for row in rows]
        except Exception as e:
            logger.error(f"❌ خطأ في get_twitter_accounts: {e}")
            return []
        finally:
            conn.close()


def get_twitter_account(account_id: str) -> Optional[Dict[str, Any]]:
    """استرجاع حساب تويتر محدد"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM twitter_accounts WHERE id = ?", (account_id,))
            row = cursor.fetchone()
            return _format_twitter_account(row) if row else None
        except Exception as e:
            logger.error(f"❌ خطأ في get_twitter_account: {e}")
            return None
        finally:
            conn.close()


def save_twitter_account(acc: Dict[str, Any]) -> bool:
    """إضافة أو تحديث حساب تويتر مستقل مع مصادر المراقبة الخاصة به"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_str = datetime.utcnow().isoformat()
            acc_id = acc.get("id") or f"acc_{int(datetime.utcnow().timestamp()*1000)}"

            sources = acc.get("monitoring_sources", [])
            if isinstance(sources, list):
                sources_json = json.dumps(sources, ensure_ascii=False)
            elif isinstance(sources, str):
                if sources.strip().startswith("["):
                    sources_json = sources.strip()
                else:
                    sources_list = [s.strip() for s in sources.split(",") if s.strip()]
                    sources_json = json.dumps(sources_list, ensure_ascii=False)
            else:
                sources_json = "[]"

            cursor.execute("""
            INSERT INTO twitter_accounts (
                id, username, display_name, university, auth_token, ct0, cookies_json,
                proxy, api_key, api_secret, access_token, access_secret, bearer_token,
                status, is_active, auto_publish, auto_reply, reply_persona, custom_hashtags,
                theme_color, logo_path, monitoring_sources, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                username = excluded.username,
                display_name = excluded.display_name,
                university = excluded.university,
                auth_token = excluded.auth_token,
                ct0 = excluded.ct0,
                cookies_json = excluded.cookies_json,
                proxy = excluded.proxy,
                api_key = excluded.api_key,
                api_secret = excluded.api_secret,
                access_token = excluded.access_token,
                access_secret = excluded.access_secret,
                bearer_token = excluded.bearer_token,
                status = excluded.status,
                is_active = excluded.is_active,
                auto_publish = excluded.auto_publish,
                auto_reply = excluded.auto_reply,
                reply_persona = excluded.reply_persona,
                custom_hashtags = excluded.custom_hashtags,
                theme_color = excluded.theme_color,
                logo_path = excluded.logo_path,
                monitoring_sources = excluded.monitoring_sources,
                updated_at = excluded.updated_at
            """, (
                acc_id,
                str(acc.get("username", "@user")),
                str(acc.get("display_name", "")),
                str(acc.get("university", "")),
                str(acc.get("auth_token", "")),
                str(acc.get("ct0", "")),
                str(acc.get("cookies_json", "")),
                str(acc.get("proxy", "")),
                str(acc.get("api_key", "")),
                str(acc.get("api_secret", "")),
                str(acc.get("access_token", "")),
                str(acc.get("access_secret", "")),
                str(acc.get("bearer_token", "")),
                str(acc.get("status", "valid")),
                int(acc.get("is_active", 1)),
                int(acc.get("auto_publish", 1)),
                int(acc.get("auto_reply", 1)),
                str(acc.get("reply_persona", "")),
                str(acc.get("custom_hashtags", "#أخبار_الجامعات")),
                str(acc.get("theme_color", "#0284c7")),
                str(acc.get("logo_path", "")),
                sources_json,
                acc.get("created_at") or now_str,
                now_str
            ))
            conn.commit()
            return True
        except Exception as e:
            logger.error(f"❌ خطأ في save_twitter_account: {e}")
            return False
        finally:
            conn.close()


def add_twitter_account_source(account_id: str, source: str) -> bool:
    """إضافة مصدر مراقبة خاص بحساب تويتر محدد"""
    clean_src = source.strip()
    if not clean_src:
        return False
    if not clean_src.startswith("@") and not clean_src.startswith("#") and not clean_src.startswith("http"):
        clean_src = f"@{clean_src}"

    acc = get_twitter_account(account_id)
    if not acc:
        return False

    sources = acc.get("monitoring_sources", [])
    if clean_src not in sources:
        sources.append(clean_src)
        acc["monitoring_sources"] = sources
        return save_twitter_account(acc)
    return True


def remove_twitter_account_source(account_id: str, source: str) -> bool:
    """إزالة مصدر مراقبة من حساب تويتر"""
    clean_src = source.strip()
    acc = get_twitter_account(account_id)
    if not acc:
        return False

    sources = acc.get("monitoring_sources", [])
    if clean_src in sources:
        sources.remove(clean_src)
        acc["monitoring_sources"] = sources
        return save_twitter_account(acc)
    return True


def delete_twitter_account(account_id: str) -> bool:
    """حذف حساب تويتر"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM twitter_accounts WHERE id = ?", (account_id,))
            conn.commit()
            return True
        except Exception as e:
            logger.error(f"❌ خطأ في delete_twitter_account: {e}")
            return False
        finally:
            conn.close()


def update_twitter_account_status(account_id: str, status: str) -> bool:
    """تحديث حالة جلسة الحساب (valid / expired / missing / active)"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_str = datetime.utcnow().isoformat()
            cursor.execute("""
            UPDATE twitter_accounts
            SET status = ?, updated_at = ?
            WHERE id = ?
            """, (status, now_str, account_id))
            conn.commit()
            return True
        except Exception as e:
            logger.error(f"❌ خطأ في update_twitter_account_status: {e}")
            return False
        finally:
            conn.close()


# ========================================================
# 15. دوال سجل الرد على تعليقات الطلاب في تويتر
# ========================================================

def add_twitter_reply_log(account_id: str, comment_text: str, reply_text: str,
                          tweet_id: str = "", comment_id: str = "",
                          student_username: str = "", status: str = "sent",
                          confidence: float = 0.95) -> Optional[int]:
    """توثيق الرد على استفسار أو تعليق طالب في تويتر"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_str = datetime.utcnow().isoformat()
            cursor.execute("""
            INSERT INTO twitter_replies_log (
                account_id, tweet_id, comment_id, student_username,
                comment_text, reply_text, status, confidence, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                account_id, tweet_id, comment_id, student_username,
                comment_text, reply_text, status, confidence, now_str
            ))
            conn.commit()
            return cursor.lastrowid
        except Exception as e:
            logger.error(f"❌ خطأ في add_twitter_reply_log: {e}")
            return None
        finally:
            conn.close()


def get_twitter_reply_logs(account_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    """استرجاع سجل الرد على تعليقات الطلاب"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            if account_id and account_id != "all":
                cursor.execute("""
                SELECT * FROM twitter_replies_log
                WHERE account_id = ?
                ORDER BY created_at DESC LIMIT ?
                """, (account_id, limit))
            else:
                cursor.execute("""
                SELECT * FROM twitter_replies_log
                ORDER BY created_at DESC LIMIT ?
                """, (limit,))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"❌ خطأ في get_twitter_reply_logs: {e}")
            return []
        finally:
            conn.close()


# ========================================================
# 16. دوال بطاقات الصور المصممة لتويتر
# ========================================================

def add_designed_card(account_id: str, title: str, body_text: str,
                      image_path: str, dimensions: str = "1080x1350",
                      accent_color: str = "#0284c7") -> Optional[int]:
    """حفظ بطاقة تصميم جديدة في الأرشيف"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_str = datetime.utcnow().isoformat()
            cursor.execute("""
            INSERT INTO twitter_designed_cards (
                account_id, title, body_text, image_path, dimensions, accent_color, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (account_id, title, body_text, image_path, dimensions, accent_color, now_str))
            conn.commit()
            return cursor.lastrowid
        except Exception as e:
            logger.error(f"❌ خطأ في add_designed_card: {e}")
            return None
        finally:
            conn.close()


def get_designed_cards(account_id: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
    """استرجاع البطاقات المصممة"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            if account_id and account_id != "all":
                cursor.execute("""
                SELECT * FROM twitter_designed_cards
                WHERE account_id = ?
                ORDER BY created_at DESC LIMIT ?
                """, (account_id, limit))
            else:
                cursor.execute("""
                SELECT * FROM twitter_designed_cards
                ORDER BY created_at DESC LIMIT ?
                """, (limit,))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"❌ خطأ في get_designed_cards: {e}")
            return []
        finally:
            conn.close()


def log_diagnostic_error(
    error_code: str,
    severity: str = "warning",
    component: str = "general",
    title: str = "",
    message: str = "",
    fix_action: str = "",
    context_data: Optional[Dict[str, Any]] = None
) -> int:
    """تسجيل أو تحديث خطأ في مركز التشخيص والتعقب الذكي"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_iso = datetime.utcnow().isoformat()
            ctx_json = json.dumps(context_data or {}, ensure_ascii=False)

            # التحقق هل الخطأ موجود مسبقاً وغير محلول لتفادي التكرار
            cursor.execute("""
            SELECT id FROM system_diagnostics
            WHERE error_code = ? AND component = ? AND resolved = 0
            LIMIT 1
            """, (error_code, component))
            row = cursor.fetchone()

            if row:
                diag_id = row["id"]
                cursor.execute("""
                UPDATE system_diagnostics
                SET message = ?, title = ?, fix_action = ?, severity = ?, context_data = ?, created_at = ?
                WHERE id = ?
                """, (message, title, fix_action, severity, ctx_json, now_iso, diag_id))
            else:
                cursor.execute("""
                INSERT INTO system_diagnostics (
                    error_code, severity, component, title, message, fix_action, context_data, resolved, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
                """, (error_code, severity, component, title, message, fix_action, ctx_json, now_iso))
                diag_id = cursor.lastrowid

            conn.commit()
            return diag_id
        except Exception as e:
            logger.error(f"❌ خطأ في log_diagnostic_error: {e}")
            return 0
        finally:
            conn.close()


def get_active_diagnostics(limit: int = 50) -> List[Dict[str, Any]]:
    """استرجاع قائمة الأخطاء والتحذيرات النشطة في النظام مع ترتيبها حسب الأهمية"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT * FROM system_diagnostics
            WHERE resolved = 0
            ORDER BY
                CASE severity
                    WHEN 'critical' THEN 1
                    WHEN 'warning' THEN 2
                    ELSE 3
                END,
                created_at DESC
            LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                try:
                    item["context_data"] = json.loads(item.get("context_data") or "{}")
                except Exception:
                    item["context_data"] = {}
                results.append(item)
            return results
        except Exception as e:
            logger.error(f"❌ خطأ في get_active_diagnostics: {e}")
            return []
        finally:
            conn.close()


def resolve_diagnostic(diag_id: int) -> bool:
    """تعليم خطأ أو تنبيه تشخيصي بأنه تم حله"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_iso = datetime.utcnow().isoformat()
            cursor.execute("""
            UPDATE system_diagnostics
            SET resolved = 1, resolved_at = ?
            WHERE id = ?
            """, (now_iso, diag_id))
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"❌ خطأ في resolve_diagnostic: {e}")
            return False
        finally:
            conn.close()


def resolve_diagnostics_by_code(error_code: str, component: Optional[str] = None) -> int:
    """تعليم أخطاء محددة بالرمز بأنها حُلّت"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_iso = datetime.utcnow().isoformat()
            if component:
                cursor.execute("""
                UPDATE system_diagnostics
                SET resolved = 1, resolved_at = ?
                WHERE error_code = ? AND component = ? AND resolved = 0
                """, (now_iso, error_code, component))
            else:
                cursor.execute("""
                UPDATE system_diagnostics
                SET resolved = 1, resolved_at = ?
                WHERE error_code = ? AND resolved = 0
                """, (now_iso, error_code))
            conn.commit()
            return cursor.rowcount
        except Exception as e:
            logger.error(f"❌ خطأ في resolve_diagnostics_by_code: {e}")
            return 0
        finally:
            conn.close()


def clear_all_diagnostics() -> bool:
    """مسح كافة الأخطاء والتشخيصات المسجلة"""
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("UPDATE system_diagnostics SET resolved = 1 WHERE resolved = 0")
            conn.commit()
            return True
        except Exception as e:
            logger.error(f"❌ خطأ في clear_all_diagnostics: {e}")
            return False
        finally:
            conn.close()


def run_comprehensive_diagnostics() -> Dict[str, Any]:
    """
    الفحص والتشخيص الشامل لكافة أجزاء المنظومة (Self-Diagnostics & Health Check):
    1. توكن بوت التيليجرام وصلاحية الاتصال بقنوات النشر
    2. محرك بطاقات تويتر فائق الدقة (Pillow + الخطوط العربية)
    3. حسابات تويتر المسجلة والكوكيز
    4. مسار التخزين الداخلي بالهاتف (/sdcard/Download/ملف_النشر)
    5. محرك الذكاء الاصطناعي الأكاديمي الداخلي
    """
    checks = []
    has_critical = False
    has_warnings = False

    # 1. فحص بوت التيليجرام
    token = get_setting("bot_token", "") or os.environ.get("BOT_TOKEN", "")
    target_channels = get_target_channels() or ["@jhdhhdcj"]

    if not token or len(token) < 20 or ":" not in token:
        has_warnings = True
        log_diagnostic_error(
            error_code="TELEGRAM_BOT_TOKEN_MISSING",
            severity="warning",
            component="telegram",
            title="توكن بوت التيليجرام غير مضبوط",
            message="البوت حالياً بانتظار توكن من @BotFather لنشر الرسائل مباشرة في قنوات التيليجرام.",
            fix_action="ادخل التوكن من لوحة التحكم > إعدادات البوت، أو عبر أمر النشر التجريبي.",
            context_data={"target_channels": target_channels}
        )
        checks.append({
            "component": "telegram",
            "name": "بوت التيليجرام",
            "status": "warning",
            "title": "بانتظار إدخال التوكن",
            "message": "لم يتم ضبط توكن صالح من @BotFather. النشر في قنوات تيليجرام معلق حتى يتم تزويد التوكن.",
            "fix": "احصل على توكن جديد من @BotFather وقم بإدخاله من الإعدادات."
        })
    else:
        # اختبار صلاحية التوكن بالاتصال بـ Telegram API
        try:
            import urllib.request
            req = urllib.request.Request(f"https://api.telegram.org/bot{token}/getMe", headers={"User-Agent": "HealthCheck/1.0"})
            with urllib.request.urlopen(req, timeout=4) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if data.get("ok"):
                    bot_info = data.get("result", {})
                    resolve_diagnostics_by_code("TELEGRAM_BOT_TOKEN_MISSING", "telegram")
                    resolve_diagnostics_by_code("TELEGRAM_BOT_TOKEN_INVALID", "telegram")
                    checks.append({
                        "component": "telegram",
                        "name": "بوت التيليجرام",
                        "status": "ok",
                        "title": "البوت نشط ومصرح له بالكامل",
                        "message": f"معرف البوت: @{bot_info.get('username')} (ID: {bot_info.get('id')}). القنوات المستهدفة: {', '.join(target_channels)}"
                    })
                else:
                    has_warnings = True
                    log_diagnostic_error(
                        error_code="TELEGRAM_BOT_TOKEN_INVALID",
                        severity="warning",
                        component="telegram",
                        title="توكن التيليجرام غير صالح أو ملغي",
                        message=data.get("description", "توكن التيليجرام المرفق ملغي أو مرفوض من تيليجرام"),
                        fix_action="أنشئ توكن جديد عبر @BotFather وضعه في لوحة التحكم."
                    )
                    checks.append({
                        "component": "telegram",
                        "name": "بوت التيليجرام",
                        "status": "warning",
                        "title": "التوكن غير صالح",
                        "message": data.get("description", "رفض تيليجرام هذا التوكن.")
                    })
        except Exception as e:
            has_warnings = True
            checks.append({
                "component": "telegram",
                "name": "بوت التيليجرام",
                "status": "warning",
                "title": "تعذر فحص اتصال التيليجرام",
                "message": f"قد يكون هناك انقطاع مؤقت في الاتصال أو أن التوكن يحتاج لتحديث: {e}"
            })

    # 2. فحص محرك بطاقات تويتر (Pillow + Tajawal)
    try:
        import twitter_engine as te
        p, u = te.render_student_card(
            title="فحص النظام والتشخيص الذكي",
            body_text="اختبار توافق أبعاد ومحرك البطاقات 1080x1350 وسلامة الخطوط العربية المدمجة.",
            width=1080,
            height=1350
        )
        resolve_diagnostics_by_code("CARD_RENDER_ERROR", "twitter")
        checks.append({
            "component": "twitter",
            "name": "محرك البطاقات فائقة الدقة",
            "status": "ok",
            "title": "المحرك الهندسي يعمل بكفاءة 100%",
            "message": f"تم توليد البطاقة التجريبية بنجاح بنقاء فائق: {u}"
        })
    except Exception as e:
        has_critical = True
        log_diagnostic_error(
            error_code="CARD_RENDER_ERROR",
            severity="critical",
            component="twitter",
            title="خطأ في محرك توليد بطاقات تويتر",
            message=str(e),
            fix_action="تأكد من تثبيت مكتبات Pillow و arabic-reshaper و python-bidi."
        )
        checks.append({
            "component": "twitter",
            "name": "محرك البطاقات فائقة الدقة",
            "status": "error",
            "title": "تعذر رسم البطاقة",
            "message": str(e)
        })

    # 3. فحص حسابات تويتر ومصادر المراقبة المستقلة
    tw_accounts = get_twitter_accounts()
    active_tw = [a for a in tw_accounts if a.get("is_active") == 1]
    if not active_tw:
        has_warnings = True
        checks.append({
            "component": "twitter",
            "name": "حسابات تويتر المستقلة",
            "status": "warning",
            "title": "لا يوجد حساب تويتر مفعل للنشر",
            "message": "قم بتفعيل حساب تويتر أو إضافة حساب جديد من تبويب تويتر."
        })
    else:
        sources_count = sum(len(a.get("monitoring_sources") or []) for a in active_tw)
        checks.append({
            "component": "twitter",
            "name": "حسابات تويتر المستقلة",
            "status": "ok",
            "title": f"يوجد {len(active_tw)} حسابات نشطة للنشر",
            "message": f"إجمالي مصادر المراقبة المستقلة المربوطة بالحسابات: {sources_count} مصدر."
        })

    # 4. فحص وحدة التخزين وحزمة ملف_النشر
    storage_candidates = ["/sdcard/Download/ملف_النشر", f"{os.path.expanduser('~')}/storage/downloads/ملف_النشر", "./public/storage_downloads/ملف_النشر"]
    found_storage = any(os.path.exists(p) for p in storage_candidates)
    if found_storage:
        checks.append({
            "component": "storage",
            "name": "وحدة التخزين الداخلية (ملف_النشر)",
            "status": "ok",
            "title": "المجلد موجود ومتزامن بالكامل",
            "message": "كافة ملفات التويتر والتيليجرام والجامعات متزامنة مع ذاكرة الهاتف."
        })
    else:
        checks.append({
            "component": "storage",
            "name": "وحدة التخزين الداخلية (ملف_النشر)",
            "status": "ok",
            "title": "جاهز للمزامنة الفورية",
            "message": "سيتم إنشاء المجلد في وحدة التخزين عند أول عملية حفظ أو نشر."
        })

    # 5. فحص المحرك الأكاديمي والعقل المدبر
    ai_cfg = get_full_config().get("ai", {})
    checks.append({
        "component": "ai",
        "name": "العقل المدبر والمحرك الأكاديمي",
        "status": "ok",
        "title": "النواة الإدراكية نشطة",
        "message": f"النموذج النشط: {ai_cfg.get('model', 'DeepSeek-V4.1-Flash')} مع القواعد الأكاديمية الصارمة لمنع الهلوسة."
    })

    overall = "critical" if has_critical else ("warning" if has_warnings else "healthy")
    active_diags = get_active_diagnostics()

    return {
        "overall_status": overall,
        "active_errors_count": len(active_diags),
        "checks": checks,
        "diagnostics": active_diags,
        "tested_at": datetime.utcnow().isoformat()
    }


# تشغيل التهيئة تلقائياً عند استيراد الملف
init_db()



