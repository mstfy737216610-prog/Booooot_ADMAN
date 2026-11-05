"""
==============================================================================
النواة الإدراكية وذاكرة التعلم الذاتي (AI Memory & Rule Learning Engine)
==============================================================================
تطبيق آلية "التعلم القائم على القواعد والتاريخ" (History-based Rule Learning):
1. قاعدة بيانات محلية SQLite (bot_memory.db) خفيفة وسريعة.
2. حلقة التغذية الراجعة (Feedback Loop) لتعلم أسباب الرفض واستبعاد الإعلانات مستقبلاً.
3. منع التكرار التام (Deduplication Cache) بحساب التجزئة (Hash) ومعرفات المنشورات.
4. التنظيف التلقائي للسجلات الأقدم من 3 أشهر لتقليل الحجم على ذاكرة الهاتف.
==============================================================================
"""

import os
import sqlite3
import hashlib
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("AIMemory")

BASE_DIR = Path(__file__).resolve().parent.parent
MEMORY_DB_PATH = BASE_DIR / "bot_memory.db"


def get_memory_db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(MEMORY_DB_PATH), timeout=25.0)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
    except Exception:
        pass
    return conn


def init_memory_db():
    """تهيئة جداول الذاكرة والتعلم التراكمي"""
    with get_memory_db() as conn:
        cursor = conn.cursor()

        # 1. جدول منع التكرار التام (Deduplication)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS post_dedup_cache (
            content_hash TEXT PRIMARY KEY,
            source_platform TEXT,
            source_id TEXT,
            channel_or_handle TEXT,
            status TEXT DEFAULT 'processed',
            first_seen_at TEXT,
            published_at TEXT
        )
        """)

        # 2. جدول أسباب الرفض والتعلم التراكمي (Rejection Rules / Feedback Loop)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS learned_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rule_type TEXT DEFAULT 'exclusion', -- exclusion | preference | replacement
            keyword_or_topic TEXT NOT NULL,
            reason_text TEXT NOT NULL,
            user_comment TEXT,
            source_post_snippet TEXT,
            hit_count INTEGER DEFAULT 1,
            created_at TEXT,
            updated_at TEXT
        )
        """)

        # 3. جدول جلسات مزودي الذكاء الاصطناعي (AI Sessions)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            provider_name TEXT NOT NULL,
            session_type TEXT DEFAULT 'cookie', -- cookie | token | api_key
            account_id TEXT,
            session_path TEXT,
            cookies_json TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT,
            updated_at TEXT
        )
        """)

        # 4. جدول سجل الرقابة والقرارات (Decisions History)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS moderation_decisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id TEXT,
            platform TEXT,
            title TEXT,
            snippet TEXT,
            decision TEXT, -- approved | rejected | modified
            reason TEXT,
            confidence REAL DEFAULT 1.0,
            reviewed_by TEXT DEFAULT 'ai',
            created_at TEXT
        )
        """)

        conn.commit()


# تهيئة الجداول فور استدعاء الملف
init_memory_db()


def compute_content_hash(text: str, extra: str = "") -> str:
    """توليد تجزئة فريدة للمحتوى لمنع التكرار حتى مع تغييرات طفيفة"""
    clean = "".join(text.split())
    raw = f"{clean}:{extra}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def is_post_duplicate(text: str, source_id: str = "") -> bool:
    """فحص هل المنشور تم نشره أو معالجته مسبقاً لمنع التكرار 100%"""
    c_hash = compute_content_hash(text)
    with get_memory_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 1 FROM post_dedup_cache 
            WHERE content_hash = ? OR (source_id = ? AND source_id != '')
            LIMIT 1
        """, (c_hash, source_id))
        return cursor.fetchone() is not None


def record_post_processed(text: str, platform: str, source_id: str, channel: str, status: str = "published"):
    """تسجيل المنشور في ذاكرة منع التكرار"""
    c_hash = compute_content_hash(text)
    now_iso = datetime.utcnow().isoformat()
    with get_memory_db() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO post_dedup_cache 
            (content_hash, source_platform, source_id, channel_or_handle, status, first_seen_at, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (c_hash, platform, source_id, channel, status, now_iso, now_iso))
        conn.commit()


def add_user_feedback_rule(keyword: str, reason: str, user_comment: str = "", snippet: str = ""):
    """
    تسجيل قاعدة تعلم جديدة بناءً على تعليق أو رفض المستخدم من واجهة الويب.
    يتم حقن هذه القواعد تلقائياً في سياق الذكاء الاصطناعي (Feedback Loop)
    """
    now_iso = datetime.utcnow().isoformat()
    clean_k = keyword.strip()
    with get_memory_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, hit_count FROM learned_rules WHERE keyword_or_topic = ? LIMIT 1", (clean_k,))
        row = cursor.fetchone()
        if row:
            conn.execute("""
                UPDATE learned_rules 
                SET hit_count = hit_count + 1, reason_text = ?, user_comment = ?, updated_at = ?
                WHERE id = ?
            """, (reason, user_comment, now_iso, row["id"]))
        else:
            conn.execute("""
                INSERT INTO learned_rules 
                (rule_type, keyword_or_topic, reason_text, user_comment, source_post_snippet, created_at, updated_at)
                VALUES ('exclusion', ?, ?, ?, ?, ?, ?)
            """, (clean_k, reason, user_comment, snippet[:250], now_iso, now_iso))
        conn.commit()
    logger.info(f"🧠 [AI Memory] تم حفظ وتثبيت قاعدة تعلم جديدة: {clean_k} (السبب: {reason})")


def get_learned_rules_context() -> str:
    """
    استرجاع كافة القواعد وأسباب الرفض السابقة ليتم إرسالها للنموذج كـ Context في System Prompt
    """
    with get_memory_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT keyword_or_topic, reason_text, user_comment, hit_count 
            FROM learned_rules 
            ORDER BY hit_count DESC, updated_at DESC 
            LIMIT 30
        """)
        rows = cursor.fetchall()

    if not rows:
        return ""

    lines = ["## 🧠 القواعد والتفضيلات المستفادة من قرارات المشرف السابقة (Feedback Loop):"]
    for r in rows:
        c_note = f" (ملاحظة المشرف: {r['user_comment']})" if r['user_comment'] else ""
        lines.append(f"- استبعد وحظر منشورات [{r['keyword_or_topic']}]: السبب: {r['reason_text']}{c_note}")
    return "\n".join(lines)


def prune_old_memory(days: int = 90) -> int:
    """
    حذف السجلات الأقدم من 3 أشهر تلقائياً لمنع تضخم قاعدة البيانات على ذاكرة الهاتف
    """
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
    with get_memory_db() as conn:
        c1 = conn.execute("DELETE FROM post_dedup_cache WHERE first_seen_at < ?", (cutoff,)).rowcount
        c2 = conn.execute("DELETE FROM moderation_decisions WHERE created_at < ?", (cutoff,)).rowcount
        conn.commit()
        # ضغط قاعدة البيانات لتفريغ المساحة الفعلية
        conn.execute("VACUUM;")
    logger.info(f"🧹 [AI Memory] تم تنظيف {c1 + c2} سجل قديم وضغط ذاكرة SQLite.")
    return c1 + c2
