"""
مدير ملف النشر والتخزين الداخلي للهاتف (Termux & Internal Storage)
يقوم بإنشاء ومزامنة هيكل المجلدات المطلوب:
- ملف_النشر/
  ├── تويتر/
  ├── تيليجرام/
  ├── ملفات_الجامعات/
  │    ├── جامعة_نجران/
  │    ├── جامعة_الملك_سعود/
  │    └── جامعة_AUM/
  ├── العقل_المدبر/
  └── سجل_الرقابة_والمنشورات/
"""

from __future__ import annotations

import os
import sys
import json
import shutil
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

logger = logging.getLogger("PublishFilesManager")

BASE_DIR = Path(__file__).resolve().parent

# المسارات المستهدفة في وحدة التخزين الداخلية لهاتف أندرويد وTermux
PHONE_STORAGE_CANDIDATES = [
    Path("/sdcard/Download/ملف_النشر"),
    Path("/storage/emulated/0/Download/ملف_النشر"),
    Path.home() / "storage/downloads/ملف_النشر",
    Path.home() / "storage/shared/Download/ملف_النشر",
    BASE_DIR / "storage_downloads" / "ملف_النشر"
]


def get_active_publish_folder_paths() -> List[Path]:
    """تحديد المسارات الفعالة لوحدة التخزين الداخلية للهاتف"""
    active_paths: List[Path] = []
    for candidate in PHONE_STORAGE_CANDIDATES:
        try:
            parent = candidate.parent
            if parent.exists() or Path("/sdcard").exists() or Path("/storage/emulated/0").exists():
                candidate.mkdir(parents=True, exist_ok=True)
                active_paths.append(candidate)
        except Exception:
            pass

    # ضمان وجود المسار المحلي دائماً
    local_path = BASE_DIR / "storage_downloads" / "ملف_النشر"
    local_path.mkdir(parents=True, exist_ok=True)
    if local_path not in active_paths:
        active_paths.append(local_path)

    return active_paths


def build_and_sync_publish_package() -> Dict[str, Any]:
    """
    إنشاء وتنظيم حزمة «ملف النشر» وتصدير كافة ملفات تويتر، تيليجرام،
    ملفات الجامعات، والعقل المدبر إلى مجلد التنزيلات
    """
    import database as db

    try:
        from العقل_المدبر import mastermind
    except Exception:
        mastermind = None

    paths = get_active_publish_folder_paths()
    synced_locations: List[str] = []

    # جلب أحدث البيانات من قاعدة البيانات
    tw_accounts = db.get_twitter_accounts() if hasattr(db, "get_twitter_accounts") else []
    tw_settings = db.get_twitter_settings() if hasattr(db, "get_twitter_settings") else {}
    tw_replies = db.get_twitter_reply_logs(limit=100) if hasattr(db, "get_twitter_reply_logs") else []
    cards_history = db.get_designed_cards(limit=50) if hasattr(db, "get_designed_cards") else []

    audit_logs = db.get_audit_logs(limit=200) if hasattr(db, "get_audit_logs") else []
    published_logs = [l for l in audit_logs if l.get("status") == "published"]
    rejected_logs = [l for l in audit_logs if l.get("status") == "rejected"]
    future_ideas = db.get_future_ideas() if hasattr(db, "get_future_ideas") else []

    full_cfg = db.get_full_config() if hasattr(db, "get_full_config") else {}
    univs = db.get_university_projects() if hasattr(db, "get_university_projects") else []

    now_iso = datetime.now().isoformat()

    for root_dir in paths:
        try:
            # 1. المجلد الرئيسي: تويتر (Twitter)
            twitter_dir = root_dir / "تويتر"
            tw_sessions_dir = twitter_dir / "جلسات_وكوكيز_الحسابات"
            tw_cards_dir = twitter_dir / "استوديو_البطاقات_المصممة"

            twitter_dir.mkdir(parents=True, exist_ok=True)
            tw_sessions_dir.mkdir(parents=True, exist_ok=True)
            tw_cards_dir.mkdir(parents=True, exist_ok=True)

            # ملف إعدادات حسابات تويتر
            with open(twitter_dir / "إعدادات_حسابات_تويتر.json", "w", encoding="utf-8") as f:
                json.dump({
                    "_info": "حسابات تويتر المتعددة والمستقلة بالكامل",
                    "last_synced": now_iso,
                    "accounts_count": len(tw_accounts),
                    "global_settings": tw_settings,
                    "accounts": tw_accounts
                }, f, ensure_ascii=False, indent=2)

            # حفظ كوكيز كل حساب في ملف مستقل
            for acc in tw_accounts:
                acc_user = acc.get("username", "").replace("@", "")
                acc_file = tw_sessions_dir / f"جلسة_{acc_user}.json"
                session_payload = {
                    "account_id": acc.get("id"),
                    "username": acc.get("username"),
                    "university": acc.get("university"),
                    "auth_token": acc.get("auth_token"),
                    "ct0": acc.get("ct0"),
                    "status": acc.get("status"),
                    "cookies_json": acc.get("cookies_json"),
                    "proxy": acc.get("proxy")
                }
                with open(acc_file, "w", encoding="utf-8") as f:
                    json.dump(session_payload, f, ensure_ascii=False, indent=2)

            # سجل الردود على تعليقات الطلاب
            with open(twitter_dir / "سجل_الردود_على_استفسارات_الطلاب.json", "w", encoding="utf-8") as f:
                json.dump({
                    "total_replies": len(tw_replies),
                    "replies": tw_replies
                }, f, ensure_ascii=False, indent=2)

            # نسخ صور البطاقات المصممة
            local_cards = BASE_DIR / "public" / "storage_downloads" / "cards"
            if local_cards.exists():
                for card_img in local_cards.glob("*.png"):
                    shutil.copy2(card_img, tw_cards_dir / card_img.name)

            # 2. المجلد الرئيسي: تيليجرام (Telegram)
            telegram_dir = root_dir / "تيليجرام"
            tg_sessions_dir = telegram_dir / "جلسات_اليوزربوت"
            tg_media_dir = telegram_dir / "الوسائط_المحملة"

            telegram_dir.mkdir(parents=True, exist_ok=True)
            tg_sessions_dir.mkdir(parents=True, exist_ok=True)
            tg_media_dir.mkdir(parents=True, exist_ok=True)

            with open(telegram_dir / "إعدادات_البوت_والقنوات.json", "w", encoding="utf-8") as f:
                json.dump(full_cfg, f, ensure_ascii=False, indent=2)

            sources_path = BASE_DIR / "sources.json"
            if sources_path.exists():
                shutil.copy2(sources_path, telegram_dir / "مصادر_وقنوات_المراقبة.json")

            # نسخ ملفات الجلسة Telethon إن وجدت
            for sess_file in BASE_DIR.glob("*.session*"):
                shutil.copy2(sess_file, tg_sessions_dir / sess_file.name)

            # 3. المجلد الرئيسي: ملفات الجامعات (University Files)
            univs_dir = root_dir / "ملفات_الجامعات"
            univs_dir.mkdir(parents=True, exist_ok=True)

            # تجميع ملفات الجامعات المضافة فعلياً فقط من قاعدة البيانات
            active_univs = []
            for u_db in univs:
                u_name = (u_db.get("name") or "").strip()
                if not u_name:
                    continue
                safe_folder = u_name.replace(" ", "_").replace("«", "").replace("»", "").replace("/", "_")
                active_univs.append({
                    "folder": safe_folder,
                    "name": u_name,
                    "country": u_db.get("country", "عام"),
                    "target_channel": u_db.get("target_channel", ""),
                    "twitter_account": u_db.get("twitter_account", ""),
                    "theme_color": u_db.get("theme_color", "#0284c7"),
                    "portal_url": u_db.get("portal_url", ""),
                    "sources": (u_db.get("telegram_sources") or []) + (u_db.get("twitter_sources") or [])
                })

            for u_item in active_univs:
                u_sub = univs_dir / u_item["folder"]
                u_sub.mkdir(parents=True, exist_ok=True)

                # ملف بيانات الجامعة والهوية
                with open(u_sub / "بيانات_الجامعة_والهوية.json", "w", encoding="utf-8") as f:
                    json.dump(u_item, f, ensure_ascii=False, indent=2)

                # ملف قنوات المراقبة والمصادر
                with open(u_sub / "قنوات_المراقبة_والمصادر.json", "w", encoding="utf-8") as f:
                    json.dump({
                        "university": u_item["name"],
                        "target_channel": u_item["target_channel"],
                        "sources_watchlist": u_item["sources"]
                    }, f, ensure_ascii=False, indent=2)

                # نسخ الشعار إن توفر
                logo_file = BASE_DIR / "assets" / "default_logo.png"
                if logo_file.exists():
                    shutil.copy2(logo_file, u_sub / "شعار_الجامعة.png")

            # 4. المجلد الرئيسي: العقل المدبر (Brain Mastermind)
            brain_dir = root_dir / "العقل_المدبر"
            brain_dir.mkdir(parents=True, exist_ok=True)

            if mastermind:
                mastermind.export_brain_files(brain_dir)
            else:
                src_brain = BASE_DIR / "العقل_المدبر.py"
                if src_brain.exists():
                    shutil.copy2(src_brain, brain_dir / "العقل_المدبر.py")

            # 5. المجلد الرئيسي: سجل الرقابة والمنشورات (Audit Logs & Ideas)
            audit_dir = root_dir / "سجل_الرقابة_والمنشورات"
            audit_dir.mkdir(parents=True, exist_ok=True)

            with open(audit_dir / "المنشورات_المعتمدة.json", "w", encoding="utf-8") as f:
                json.dump({"total": len(published_logs), "published_posts": published_logs}, f, ensure_ascii=False, indent=2)

            with open(audit_dir / "المنشورات_المرفوضة_مع_الأسباب.json", "w", encoding="utf-8") as f:
                json.dump({"total": len(rejected_logs), "rejected_posts": rejected_logs}, f, ensure_ascii=False, indent=2)

            with open(audit_dir / "بنك_الأفكار_المستقبلية.json", "w", encoding="utf-8") as f:
                json.dump({"total": len(future_ideas), "ideas": future_ideas}, f, ensure_ascii=False, indent=2)

            # 6. دليل تشغيل النظام من الهاتف
            readme_text = f"""================================================================================
📂 حزمة «ملف النشر» - النظام الجامعي الأكاديمي الموحد (Termux & Internal Storage)
================================================================================
تاريخ التوليد والمزامنة: {datetime.now().strftime('%Y-%m-%d %I:%M %p')}
المسار في ذاكرة الهاتف: /sdcard/Download/ملف_النشر

📁 هيكل الحزمة الداخلي:
├── تويتر/
│   ├── إعدادات_حسابات_تويتر.json (جميع حسابات تويتر المستقلة والمعرفات)
│   ├── جلسات_وكوكيز_الحسابات/ (كوكيز وجلسات auth_token و ct0 المنفصلة لكل حساب)
│   ├── استوديو_البطاقات_المصممة/ (بطاقات 1080x1350 و 1080x1080 فائقة الدقة)
│   └── سجل_الردود_على_استفسارات_الطلاب.json (سجل الردود الأكاديمية على الطلاب)
│
├── تيليجرام/
│   ├── إعدادات_البوت_والقنوات.json (توكن البوت، الآدمن، والقنوات الهدف)
│   ├── مصادر_وقنوات_المراقبة.json (قنوات ومصادر المراقبة التلقائية)
│   ├── جلسات_اليوزربوت/ (ملفات جلسة Telethon لسحب القنوات الخاصة)
│   └── الوسائط_المحملة/ (الصور والملصقات والمستندات المسحوبة)
│
├── ملفات_الجامعات/
│   └── (مجلدات الجامعات ومصادرها المضافة فعلياً من لوحة التحكم)
│
├── العقل_المدبر/
│   ├── العقل_المدبر.py (النواة الإدراكية للذكاء الاصطناعي الأكاديمي)
│   ├── العقل_المدبر.json (عقد التعلم، القواعد الأكاديمية، وسلم قضايا الطلاب)
│   └── دستور_العقل_المدبر_وقواعد_الذكاء.md (ضوابط منع التوليد الوهمي)
│
└── سجل_الرقابة_والمنشورات/
    ├── المنشورات_المعتمدة.json (سجل المنشورات التي تم نشرها وتوقيتها)
    ├── المنشورات_المرفوضة_مع_الأسباب.json (سجل المنشورات المستبعدة مع السبب)
    └── بنك_الأفكار_المستقبلية.json (الأفكار والتوجيهات التشغيلية لتطوير المحتوى)

🌐 للتشغيل بواجهة موحدة على هاتفك عبر Termux:
افتح متصفح هاتفك (Chrome أو Brave) وادخل على:
http://localhost:3000
================================================================================"""

            with open(root_dir / "دليل_حزمة_ملف_النشر.txt", "w", encoding="utf-8") as f:
                f.write(readme_text)

            synced_locations.append(str(root_dir))
        except Exception as e:
            logger.warning(f"ملاحظة أثناء كتابة حزمة ملف النشر في {root_dir}: {e}")

    return {
        "success": True,
        "synced_locations": synced_locations,
        "package_name": "ملف_النشر",
        "last_synced": now_iso
    }


if __name__ == "__main__":
    res = build_and_sync_publish_package()
    print("Publish Package sync result:", json.dumps(res, ensure_ascii=False, indent=2))
