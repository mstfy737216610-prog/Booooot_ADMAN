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
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger("Database")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "bot_database.db")
SOURCES_FILE = os.path.join(BASE_DIR, "sources.json")
STATE_FILE = os.path.join(BASE_DIR, "state.json")

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
                google_news_enabled INTEGER DEFAULT 1,
                keywords TEXT DEFAULT '[]',
                enabled INTEGER DEFAULT 1,
                created_at TEXT
            )
            """)

            conn.commit()
            logger.info("✅ تم تهيئة جداول قاعدة البيانات SQLite بنجاح.")

            # هجرة البيانات من ملفات JSON إن وجدت وقاعدة البيانات جديدة
            migrate_from_json(conn)

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

    # 3. هجرة المصادر من sources.json
    cursor.execute("SELECT COUNT(*) as cnt FROM sources")
    if cursor.fetchone()["cnt"] == 0:
        default_sources = [
            ("src_tg_univ_news", "telegram", "@KSU_News", "أخبار الجامعة والقبول الرسمي", "184920"),
            ("src_x_moe", "twitter", "@moe_gov_sa", "الحساب الرسمي لوزارة التعليم", "178294104"),
            ("src_tg_mstfy", "telegram", "@mstfyuhhh", "قناة المحتوى الطلابي", ""),
            ("src_bot_next", "telegram", "@Next_Plus_BOT0", "مصدر الأخبار Next Plus", ""),
            ("src_rss_dept", "rss", "https://news.ksu.edu.sa/ar/rss", "بوابة الأخبار والفعاليات الجامعية", "rss_item_9402")
        ]
        if os.path.exists(SOURCES_FILE):
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
        else:
            for sid, stype, stgt, stitle, slast in default_sources:
                cursor.execute("""
                    INSERT OR IGNORE INTO sources (id, type, target, title, priority, rule, enabled, last_post_id, created_at)
                    VALUES (?, ?, ?, ?, 'high', 'official', 1, ?, ?)
                """, (sid, stype, stgt, stitle, slast, now_str))

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
        "custom_instructions": "كن مثل مشرفين القروبات الذي يبحث عن الأخبار الجديدة ويعطيها للطلاب بوضوح دون أي إشارة للمصادر",
        "processed_count": "18",
        "forwarded_count": "15",
        "ad_replaced_count": "3",
        "ad_replacement_enabled": "0"
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

def get_target_channels() -> List[str]:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT channel_id FROM target_channels WHERE status != 'deleted'")
            rows = cursor.fetchall()
            chs = [r["channel_id"] for r in rows]
            return chs if chs else ["@jhdhhdcj"]
        finally:
            conn.close()


def get_target_channels_detailed() -> List[Dict[str, Any]]:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM target_channels WHERE status != 'deleted' ORDER BY created_at ASC")
            return [dict(r) for r in cursor.fetchall()]
        finally:
            conn.close()


def add_target_channel(channel_id: str, title: str = "", added_by: int = 7607633343) -> bool:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            clean_ch = channel_id.strip()
            if not clean_ch.startswith("@") and not clean_ch.startswith("-100"):
                clean_ch = "@" + clean_ch
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
    keywords: Optional[List[str]] = None
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
            univ_id = f"univ_{clean_tag}_{int(time.time())}"
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
            if not results:
                def_proj = add_university_project(
                    name="جامعة الملك سعود",
                    target_channel="@jhdhhdcj",
                    telegram_sources=["@KSU_News"],
                    twitter_sources=["@ksu_news"],
                    google_news_query="جامعة الملك سعود",
                    keywords=["جامعة الملك سعود", "الملك سعود", "KSU", "قبول", "تسجيل"]
                )
                results.append(def_proj)
            return results
        finally:
            conn.close()


def delete_university_project(univ_id: str) -> bool:
    with _db_lock:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM university_projects WHERE id = ?", (univ_id,))
            conn.commit()
            sync_to_json_files()
            return cursor.rowcount > 0
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

    # 2. فحص الكلمات المفتاحية في النص إن وجدت عدة جامعات
    if text:
        text_lower = text.lower()
        for p in active_projects:
            kws = p.get("keywords", []) + [p.get("name", "")]
            for kw in kws:
                if kw and kw.lower() in text_lower:
                    return p

    # 3. إذا كان المصدر مسجلاً في جدول المصادر العام أو تم الفحص اليدوي
    # نوجهه لأول مشروع جامعة مفعل أو للقناة المستهدفة الأولى لضمان عدم ضياع أي موعد أو إعلان
    if active_projects:
        return active_projects[0]

    # 4. في حالة عدم وجود أي مشروع جامعة، نوجهه للقناة المستهدفة الافتراضية
    target_chs = get_target_channels()
    if target_chs:
        return {
            "id": "default_academic",
            "name": "الأخبار والخدمات الأكاديمية",
            "target_channel": target_chs[0],
            "enabled": True
        }

    return None


# ----------------- المزامنة مع ملفات JSON لدعم Bots.Business -----------------

def sync_to_json_files():
    """حفظ الحالة الحالية في sources.json و state.json لضمان عمل بوت بزنس وأي أداة خارجية"""
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
            "admin_id": "7607633343",
            "admin_user": "@M_S_F_G",
            "bot_username": "admiuin_bot",
            "processed_count": int(get_setting("processed_count", "18")),
            "forwarded_count": int(get_setting("forwarded_count", "15")),
            "ad_replaced_count": int(get_setting("ad_replaced_count", "3")),
            "last_run_timestamp": datetime.utcnow().isoformat()
        }
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.warning(f"ملاحظة في مزامنة JSON: {e}")


# تشغيل التهيئة تلقائياً عند استيراد الملف
init_db()
