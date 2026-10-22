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

import os
import sys
import json
import time
import ssl
import re
import queue
import hashlib
import logging
import threading
import asyncio
import urllib.request
import urllib.parse
import urllib.error
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Dict, Any, Optional, List, Tuple

# استيراد وحدة قاعدة البيانات الدائمة
import database as db

# تحميل متغيرات البيئة
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# استيراد Telethon لسحب MTProto للقنوات العامة والخاصة
try:
    from telethon import TelegramClient, events
    from telethon.sessions import StringSession
    TELETHON_AVAILABLE = True
except ImportError:
    TELETHON_AVAILABLE = False

# ----------------- الإعدادات والاعتمادات -----------------
BOT_TOKEN = os.getenv("BOT_TOKEN", "8901693218:AAEOQmHMZLy-xaPbTUMq1KGhDwp1l0wFWP4").strip()
ADMIN_ID = int(os.getenv("ADMIN_ID", "7607633343"))
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "M_S_F_G").replace("@", "").strip()

TELEGRAM_API_ID = int(os.getenv("TELEGRAM_API_ID", "20123456"))
TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH", "abcdef0123456789abcdef0123456789").strip()
STRING_SESSION = os.getenv("STRING_SESSION", "").strip()

AI_BASE_URL = os.getenv("AI_BASE_URL", "https://api.hcnsec.cn/v1").rstrip("/")
AI_API_KEY = os.getenv("AI_API_KEY", "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii").strip()
PRIMARY_MODEL = os.getenv("PRIMARY_MODEL", "DeepSeek-V4-Flash").strip()
FALLBACK_MODEL = os.getenv("FALLBACK_MODEL", "DeepSeek-V4.1-Flash").strip()
PORT = int(os.getenv("PORT", os.getenv("KEEPALIVE_PORT", "8088")))

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    level=logging.INFO,
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("PublisherBot")

# إعداد SSL آمن ونظامي (بدون CERT_NONE)
ssl_ctx = ssl.create_default_context()

# طابور معالجة الرسائل والمنشورات غير المتزامن لمنع تجمد البوت
post_queue = queue.Queue(maxsize=100)

SYSTEM_PROMPT_REPHRASE = """# الدور: الناشر والكاتب الرسمي للمحتوى التعليمي والجامعي
## الهوية:
أنت الكاتب الرسمي والناشر الحصري لقناة تعليمية وجامعية رائدة.
مهمتك كتابة وصياغة المنشورات بأسلوبك الخاص الأصيل كأنك أنت المصدر الأول والأساسي للخبر.

## قواعد صارمة جداً (إلزامية 100%):
1. ممنوع منعاً باتاً ذكر اسم القناة الأصلية أو المصدر أو الحساب المنقول منه، وممنوع استخدام عبارات مثل "وفقاً للمصدر" أو "بحسب القناة" أو "معاد صياغته" أو "كما ورد" أو أي تنويه بأن المنشور منقول.
2. احذف نهائياً أي روابط أو معرفات قنوات تيليجرام أخرى (مثل @channel أو t.me).
3. اكتب بأسلوب عربي فصيح، راقٍ، منظم بنقاط واضحة ومباشرة للطلاب.
4. حافظ بدقة تامة على الأرقام، النسب، التواريخ، والمواعيد الرسمية، والشروط دون أي تحريف.
5. احتفظ فقط بالروابط الحكومية والجامعية الرسمية المباشرة (مثل مواقع الجامعات الرسمية أو الوزارة).

## التنسيق المطلوب:
📌 [عنوان بارز وجذاب بدون أي إشارة لمصادر]

[المحتوى منظم في نقاط محددة وسهلة القراءة تبرز المواعيد والخطوات والشروط]

💬 [دعوة تفاعلية قصيرة للطلاب للمشاركة أو الاستفسار]

[2 إلى 4 هاشتاجات ملائمة: #جامعة #قبول #تسجيل #امتحانات]"""

AD_KEYWORDS = [
    "إعلان مدفوع", "ترويج لخدمات طلابية", "حل واجبات", "بحوث تخرج",
    "خدمات طلابية", "مشاريع تخرج", "كتابة أبحاث", "إعلان ممول", "برعاية", "للتواصل تليجرام"
]


# ----------------- خادم Keep-Alive للصحة والمراقبة -----------------
class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "application/json; charset=utf-8")
        self.end_headers()
        targets = db.get_target_channels()
        res = {
            "status": "online",
            "bot": "@admiuin_bot",
            "admin": f"@{ADMIN_USERNAME}",
            "primary_model": PRIMARY_MODEL,
            "target_channels": targets,
            "database": "SQLite3 Persistent",
            "mtproto_supported": TELETHON_AVAILABLE,
            "queue_size": post_queue.qsize(),
            "timestamp": int(time.time()),
            "message": "محرر المحتوى الأكاديمي الذكي V3 يعمل بنجاح 24/7"
        }
        self.wfile.write(json.dumps(res, ensure_ascii=False).encode("utf-8"))

    def log_message(self, format, *args):
        pass


def run_keepalive_server():
    for p in [PORT, 8088, 8089, 8090, 8000]:
        try:
            server = HTTPServer(("0.0.0.0", p), HealthCheckHandler)
            logger.info(f"🌐 خادم Health-Check يعمل بنجاح على المنفذ: {p}")
            server.serve_forever()
            break
        except Exception:
            continue


# ----------------- فئة البوت الرئيسية -----------------
class StandaloneTelegramEducationalBot:
    def __init__(self):
        self.user_waiting_state: Dict[int, str] = {}
        self.cached_forwarded_post: Dict[int, Dict[str, Any]] = {}
        self.telethon_client: Optional[Any] = None
        self.telethon_loop: Optional[asyncio.AbstractEventLoop] = None
        self.running = True

    # ----------------- طلبات تيليجرام الأساسية -----------------
    def tg_request(self, method: str, payload: Optional[Dict] = None, timeout: int = 25) -> Dict[str, Any]:
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/{method}"
        data_bytes = None
        headers = {"User-Agent": "TelegramEducationalBot/3.0"}
        if payload is not None:
            data_bytes = json.dumps(payload).encode("utf-8")
            headers["Content-Type"] = "application/json"

        try:
            req = urllib.request.Request(url, data=data_bytes, headers=headers)
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            logger.warning(f"تيليجرام HTTP ({method}) [{e.code}]: {err_body}")
            try:
                res_json = json.loads(err_body)
                res_json["http_code"] = e.code
                return res_json
            except Exception:
                return {"ok": False, "http_code": e.code, "description": err_body}
        except Exception as e:
            return {"ok": False, "description": str(e)}

    def to_safe_html(self, text: str) -> str:
        if not text:
            return ""
        s = text
        s = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', s)
        return s

    def send_msg(self, chat_id: Any, text: str, reply_markup: Optional[Dict] = None, parse_mode: Optional[str] = "HTML") -> Dict[str, Any]:
        safe_text = self.to_safe_html(text) if parse_mode == "HTML" else text
        payload = {"chat_id": chat_id, "text": safe_text}
        if reply_markup:
            payload["reply_markup"] = reply_markup
        if parse_mode:
            payload["parse_mode"] = parse_mode
        res = self.tg_request("sendMessage", payload)
        if not res.get("ok"):
            payload.pop("parse_mode", None)
            payload["text"] = text
            res = self.tg_request("sendMessage", payload)
        return res

    def send_photo(self, chat_id: Any, photo: str, caption: str = "", parse_mode: Optional[str] = "HTML") -> Dict[str, Any]:
        safe_caption = self.to_safe_html(caption) if parse_mode == "HTML" else caption
        if len(safe_caption) <= 1024:
            payload = {"chat_id": chat_id, "photo": photo, "caption": safe_caption}
            if parse_mode:
                payload["parse_mode"] = parse_mode
            res = self.tg_request("sendPhoto", payload)
            if res.get("ok"):
                return res
            payload.pop("parse_mode", None)
            payload["caption"] = caption
            res = self.tg_request("sendPhoto", payload)
            if res.get("ok"):
                return res

        res_photo = self.tg_request("sendPhoto", {"chat_id": chat_id, "photo": photo})
        if res_photo.get("ok"):
            if caption:
                self.send_msg(chat_id, caption, parse_mode=parse_mode)
            return res_photo

        # حماية قاطعة: إذا تعذر تحميل الصورة على سيرفر تيليجرام (failed to get HTTP URL content)، ننشر النص فوراً حتى لا يضيع المنشور
        if caption:
            res_msg = self.send_msg(chat_id, caption, parse_mode=parse_mode)
            if res_msg.get("ok"):
                res_msg["note"] = "fallback_text_after_photo_error"
                return res_msg
        return res_photo

    def answer_callback(self, cb_id: str, text: Optional[str] = None, alert: bool = False):
        payload = {"callback_query_id": cb_id}
        if text:
            payload["text"] = text
            payload["show_alert"] = alert
        return self.tg_request("answerCallbackQuery", payload)

    # ----------------- فحص الصلاحيات والأدوار -----------------
    def check_user_access(self, from_user: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        user_id = from_user.get("id")
        username = (from_user.get("username") or "").replace("@", "")
        first_name = from_user.get("first_name", "")

        user = db.get_user(user_id)
        if not user:
            role = "admin" if user_id == ADMIN_ID else "user"
            user = db.upsert_user(user_id, username, first_name, role)

        if user.get("is_banned"):
            return False, user

        return True, user

    def is_admin(self, user_id: int) -> bool:
        if user_id == ADMIN_ID:
            return True
        u = db.get_user(user_id)
        return bool(u and u.get("role") in ["admin", "superadmin"])

    def is_moderator(self, user_id: int) -> bool:
        if self.is_admin(user_id):
            return True
        u = db.get_user(user_id)
        return bool(u and u.get("role") in ["admin", "moderator"])

    # ----------------- لوحات المفاتيح والأزرار -----------------
    def get_main_reply_keyboard(self, user_role: str = "user") -> Dict[str, Any]:
        kb = [
            [{"text": "🎛 لوحة التحكم الرئيسية"}, {"text": "👤 حسابي والاشتراك"}],
            [{"text": "📢 قنوات النشر المعتمدة"}, {"text": "➕ إضافة مصدر للمراقبة"}],
            [{"text": "🔄 فحص وسحب المصادر الآن"}, {"text": "📝 صياغة ونشر خبر فوري"}],
            [{"text": "📱 ربط رقم هاتفي (تحقق)"}, {"text": "🧪 تجربة الصياغة الفورية"}]
        ]
        if user_role == "admin":
            kb.append([{"text": "👥 إدارة المستخدمين"}, {"text": "📊 إحصائيات القنوات"}])
            kb.append([{"text": "🎯 إعلاني البديل"}, {"text": "⏸ إيقاف / استئناف"}])
        return {"keyboard": kb, "resize_keyboard": True, "persistent": True}

    def get_contact_request_keyboard(self) -> Dict[str, Any]:
        return {
            "keyboard": [
                [{"text": "📱 مشاركة رقم هاتفي للتحقق الرسمي", "request_contact": True}],
                [{"text": "🔙 إلغاء والعودة للرئيسية"}]
            ],
            "resize_keyboard": True,
            "one_time_keyboard": True
        }

    def get_control_panel_inline_keyboard(self, is_admin_user: bool = False) -> Dict[str, Any]:
        channels = db.get_target_channels()
        is_paused = db.get_setting("is_paused", "0") == "1"
        buttons = [
            [
                {"text": f"📢 قنوات النشر ({len(channels)})", "callback_data": "panel_manage_channels"},
                {"text": "🧪 اختبار النشر الآن", "callback_data": "panel_test_publish"}
            ],
            [
                {"text": "➕ إضافة مصدر مراقبة", "callback_data": "panel_add_source"},
                {"text": "📋 المصادر المراقبة", "callback_data": "panel_sources"}
            ],
            [
                {"text": "📝 صياغة خبر فوري", "callback_data": "panel_new_post"},
                {"text": "👤 حسابي والتحقق", "callback_data": "panel_my_account"}
            ]
        ]
        if is_admin_user:
            buttons.append([
                {"text": "🎯 إعلان خدماتي البديل", "callback_data": "panel_ad"},
                {"text": "⚙️ تعليمات المحرر", "callback_data": "panel_instructions"}
            ])
            buttons.append([
                {"text": "📊 تقارير القنوات والمستخدمين", "callback_data": "panel_stats"},
                {"text": f"{'▶️ استئناف النشر' if is_paused else '⏸ إيقاف مؤقت'}", "callback_data": "panel_toggle_pause"}
            ])
        return {"inline_keyboard": buttons}

    # ----------------- دمج الذكاء الاصطناعي مع Timeout Guard -----------------
    def clean_text_from_sources(self, text: str) -> str:
        cleaned = re.sub(r'@[a-zA-Z0-9_]+', '', text)
        cleaned = re.sub(r'https?://t\.me/[^\s]+', '', cleaned)
        cleaned = re.sub(r'(وفقاً لـ?|بحسب|نقلاً عن|المصدر:|قناة|حساب)\s+[^\s\n]+', '', cleaned)
        cleaned = re.sub(r'لا تنسوا الاشتراك[^\n.]*', '', cleaned)
        cleaned = re.sub(r'تابعونا على[^\n.]*', '', cleaned)
        cleaned = re.sub(r'انضموا إلى[^\n.]*', '', cleaned)
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned).strip()
        return cleaned

    def call_ai(self, raw_text: str, custom_instruction: str = "") -> str:
        clean_input = self.clean_text_from_sources(raw_text)
        if not clean_input:
            clean_input = raw_text

        instruction_addon = f"تعليمات إضافية من المشرف: {custom_instruction}\n\n" if custom_instruction else ""
        payload = {
            "model": PRIMARY_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT_REPHRASE},
                {"role": "user", "content": f"{instruction_addon}صيغ هذا المحتوى الأكاديمي كمنشور رسمي أصلي لقناتك (بدون ذكر أي مصادر أو قنوات سابقة):\n\n{clean_input}"}
            ],
            "temperature": 0.35,
            "max_tokens": 800
        }
        headers = {
            "Authorization": f"Bearer {AI_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "TelegramEducationalBot/3.0"
        }
        endpoint = f"{AI_BASE_URL}/chat/completions"

        # محاولة النموذج الأساسي
        try:
            req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers)
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=14) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if "choices" in data and len(data["choices"]) > 0:
                    ai_text = data["choices"][0]["message"]["content"].strip()
                    return self.clean_text_from_sources(ai_text)
        except Exception as e:
            logger.warning(f"ملاحظة في نموذج الذكاء الأساسي {PRIMARY_MODEL}: {e}")

        # محاولة النموذج البديل
        try:
            payload["model"] = FALLBACK_MODEL
            req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers)
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if "choices" in data and len(data["choices"]) > 0:
                    ai_text = data["choices"][0]["message"]["content"].strip()
                    return self.clean_text_from_sources(ai_text)
        except Exception as e:
            logger.warning(f"ملاحظة في النموذج البديل {FALLBACK_MODEL}: {e}")

        # صياغة محلية ذكية خالية من التأخير
        lines = [l.strip() for l in clean_input.split("\n") if l.strip() and not l.startswith("http")]
        title = lines[0] if lines else "تحديث جامعي وأكاديمي هام"
        if len(title) > 65:
            title = title[:62] + "..."
        bullets = "\n".join([f"• {l}" for l in lines[1:6]]) if len(lines) > 1 else f"• {clean_input}"
        return f"📌 **{title}**\n\n{bullets}\n\n💬 يسعدنا استقبال استفساراتكم ومشاركة المنشور مع زملائكم الطلاب!\n\n#جامعة #أخبار_التعليم #شؤون_الطلاب #مواعيد"

    # ----------------- المعالج غير المتزامن (Worker Thread) -----------------
    def worker_loop(self):
        logger.info("⚙️ بدء تشغيل خيط معالجة المنشورات (Background Worker Queue)...")
        while self.running:
            try:
                task = post_queue.get(timeout=1.0)
                if not task:
                    continue

                task_type = task.get("type")
                raw_text = task.get("text", "")
                photo = task.get("photo")
                target_channels = task.get("targets") or db.get_target_channels()
                user_id = task.get("user_id")

                # 1. كشف إعلانات المنافسين واستبدالها
                custom_ad = db.get_setting("custom_ad", "")
                is_ad = any(kw in raw_text for kw in AD_KEYWORDS)

                if is_ad and custom_ad:
                    db.increment_setting("ad_replaced_count", 1)
                    for ch in target_channels:
                        res = self.send_photo(ch, photo, custom_ad) if photo else self.send_msg(ch, custom_ad)
                        db.record_channel_publish_result(ch, res.get("ok", False), res.get("description", ""))
                    if user_id:
                        self.send_msg(user_id, f"🎯 **تم رصد إعلان منافس واستبداله بإعلان خدماتك في ({len(target_channels)}) قنوات!**")
                    post_queue.task_done()
                    continue

                # 2. إعادة الصياغة بالذكاء الاصطناعي
                custom_instructions = db.get_setting("custom_instructions", "")
                rephrased = self.call_ai(raw_text, custom_instructions)

                # 3. النشر في كافة القنوات المستهدفة
                success_targets = []
                failed_targets = []
                for ch in target_channels:
                    res = self.send_photo(ch, photo, rephrased) if photo else self.send_msg(ch, rephrased)
                    ok = res.get("ok", False)
                    desc = res.get("description", "")
                    db.record_channel_publish_result(ch, ok, desc)
                    if ok:
                        success_targets.append(ch)
                    else:
                        failed_targets.append((ch, desc))

                db.increment_setting("forwarded_count", 1)
                db.increment_setting("processed_count", 1)

                # 4. إشعار المستخدم / المشرف
                report = f"✅ **تم نشر الخبر بنجاح في ({len(success_targets)}) قناة!**\n"
                if success_targets:
                    report += f"📢 القنوات: `{', '.join(success_targets)}`\n"
                if failed_targets:
                    report += f"\n⚠️ **فشل النشر في:**\n"
                    for f_ch, f_err in failed_targets:
                        report += f"• `{f_ch}`: {f_err}\n"
                report += f"\n👁️ **معاينة المنشور:**\n───────────────────\n{rephrased}"

                if user_id:
                    self.send_msg(user_id, report)

                post_queue.task_done()

            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"❌ خطأ أثناء معالجة مهمة في الطابور: {e}")

    # ----------------- مراقبة القنوات والمصادر (MTProto + Scraper) -----------------
    def check_telegram_channel_scraper(self, src: Dict[str, Any]):
        channel_name = src.get("target", "").replace("@", "").replace("https://t.me/s/", "").replace("https://t.me/", "").strip()
        if not channel_name:
            return

        url = f"https://t.me/s/{channel_name}"
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept-Language": "ar,en-US;q=0.9,en;q=0.8"
            })
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=12) as resp:
                html = resp.read().decode("utf-8")
                blocks = html.split('class="tgme_widget_message_wrap')
                if len(blocks) <= 1:
                    return

                posts_extracted = []
                for b in blocks[1:]:
                    post_id_m = re.search(r'data-post=\"([^\"]+)\"', b)
                    if not post_id_m:
                        continue
                    pid = post_id_m.group(1)
                    raw_num_match = re.search(r'/(\d+)$', pid)
                    num_id = int(raw_num_match.group(1)) if raw_num_match else 0

                    photo_m = re.search(r'background-image:url\(\'([^\']+)\'\)', b)
                    photo_url = photo_m.group(1) if photo_m else None

                    # الإصلاح الحرج للـ Regex كما طلب المشرف بدقة:
                    text_m = re.search(r'class=\"tgme_widget_message_text[^\"]*js-message_text\"[^>]*>(.*?)</div>', b, re.DOTALL)
                    text_content = ""
                    if text_m:
                        raw_h = text_m.group(1)
                        # استبدال سليم لوسوم br دون تفريغ النمط
                        clean_h = re.sub(r'<br\s*/?>', '\n', raw_h)
                        text_content = re.sub(r'<[^>]+>', '', clean_h).strip()

                    posts_extracted.append({"id": pid, "num_id": num_id, "photo": photo_url, "text": text_content})

                if not posts_extracted:
                    return

                # ترتيب المنشورات تصاعدياً لضمان نشر المنشورات بالترتيب الزمني الصحيح
                posts_extracted.sort(key=lambda x: x["num_id"])

                last_known = str(src.get("last_post_id") or "")
                last_known_num = 0
                if last_known:
                    num_match = re.search(r'(\d+)$', last_known)
                    if num_match:
                        last_known_num = int(num_match.group(1))

                # إذا كانت أول مرة نسجل فقط آخر منشور لمنع نشر الأرشيف القديم
                if not last_known or last_known_num == 0:
                    latest = posts_extracted[-1]
                    db.update_source_last_id(src.get("target"), latest["id"])
                    logger.info(f"📌 تمت تهيئة المصدر {src.get('target')} عند المنشور #{latest['id']}")
                    return

                # حلقة فحص ونشر كافة المنشورات الجديدة المتراكمة وليس آخر واحد فقط!
                new_posts = [p for p in posts_extracted if p["num_id"] > last_known_num]
                for p in new_posts:
                    p_text = p.get("text", "")
                    p_photo = p.get("photo")
                    p_id = p["id"]

                    p_hash = hashlib.md5(p_text[:80].encode("utf-8")).hexdigest()
                    if db.is_post_seen(p_id, p_hash):
                        continue

                    db.mark_post_seen(p_id, p_hash, src.get("target"))
                    db.update_source_last_id(src.get("target"), p_id)

                    logger.info(f"⚡️ منشور جديد تم التقاطه من {src.get('target')}: {p_id}")
                    post_queue.put({
                        "type": "crawled_post",
                        "text": p_text,
                        "photo": p_photo,
                        "targets": db.get_target_channels(),
                        "user_id": ADMIN_ID
                    })

        except Exception as e:
            logger.debug(f"فحص القناة عبر Scraper {channel_name}: {e}")

    def check_rss_feed(self, src: Dict[str, Any]):
        url = src.get("target", "")
        if not url.startswith("http"):
            return
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=12) as resp:
                xml_data = resp.read()
                root = ET.fromstring(xml_data)
                items = root.findall(".//item")
                if not items:
                    return

                last_known = str(src.get("last_post_id") or "")
                new_items = []
                for it in items:
                    t = it.findtext("title") or ""
                    l = it.findtext("link") or ""
                    d = it.findtext("description") or ""
                    pid = l or t
                    if pid == last_known:
                        break
                    new_items.append((pid, t, d))

                if new_items:
                    # تحديث آخر ID
                    db.update_source_last_id(src.get("target"), new_items[0][0])
                    for pid, t, d in reversed(new_items):
                        clean_d = re.sub(r'<[^>]+>', '', d).strip()
                        full_txt = f"{t}\n{clean_d}"
                        p_hash = hashlib.md5(full_txt[:80].encode("utf-8")).hexdigest()
                        if not db.is_post_seen(pid, p_hash):
                            db.mark_post_seen(pid, p_hash, src.get("target"))
                            post_queue.put({
                                "type": "rss_post",
                                "text": full_txt,
                                "photo": None,
                                "targets": db.get_target_channels(),
                                "user_id": ADMIN_ID
                            })
        except Exception as e:
            logger.debug(f"فحص RSS {url}: {e}")

    def monitor_sources_loop(self):
        logger.info("📡 تشغيل دورة مراقبة المصادر التلقائية...")
        while self.running:
            try:
                time.sleep(60)
                if db.get_setting("is_paused", "0") == "1":
                    continue

                sources = db.get_sources()
                for s in sources:
                    s_type = s.get("type")
                    if s_type == "telegram":
                        self.check_telegram_channel_scraper(s)
                    elif s_type == "rss":
                        self.check_rss_feed(s)

            except Exception as e:
                logger.error(f"خطأ في دورة مراقبة المصادر: {e}")

    # ----------------- مراقبة MTProto عبر Telethon -----------------
    def start_telethon_userbot(self):
        if not TELETHON_AVAILABLE:
            logger.info("ℹ️ مكتبة Telethon غير مفعلة، يعمل البوت بنمط Bot API و Scraper المحسن.")
            return

        session_str = STRING_SESSION or db.get_setting("session_string", "")
        if not session_str:
            logger.info("ℹ️ لم يتم توفير StringSession لليوزربوت بعد. استخدم /login_mtproto لتسجيل الحساب.")
            return

        async def run_client():
            try:
                logger.info("🔐 جاري الاتصال بحساب اليوزربوت عبر MTProto Telethon...")
                client = TelegramClient(StringSession(session_str), TELEGRAM_API_ID, TELEGRAM_API_HASH)
                await client.start()
                self.telethon_client = client
                logger.info("✅ تم ربط وتشغيل اليوزربوت MTProto بنجاح لسحب القنوات العامة والخاصة!")

                @client.on(events.NewMessage)
                async def handle_new_channel_message(event):
                    try:
                        if not event.chat:
                            return
                        chat_username = f"@{event.chat.username}" if getattr(event.chat, "username", None) else str(event.chat_id)
                        sources = [s.get("target") for s in db.get_sources()]

                        # هل الرسالة من قناة مخصصة للمراقبة؟
                        if chat_username in sources or any(s in str(event.chat_id) for s in sources):
                            text = event.text or event.message.message or ""
                            if len(text) < 10 and not event.photo:
                                return

                            photo_path = None
                            if event.photo:
                                photo_path = await event.download_media()

                            logger.info(f"📥 [MTProto] تم سحب منشور جديد من {chat_username}")
                            post_queue.put({
                                "type": "mtproto_post",
                                "text": text,
                                "photo": photo_path,
                                "targets": db.get_target_channels(),
                                "user_id": ADMIN_ID
                            })
                    except Exception as err:
                        logger.error(f"خطأ معالجة حدث MTProto: {err}")

                await client.run_until_disconnected()
            except Exception as ex:
                logger.warning(f"ملاحظة في تشغيل عميل Telethon MTProto: {ex}")

        def telethon_thread_runner():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            self.telethon_loop = loop
            loop.run_until_complete(run_client())

        threading.Thread(target=telethon_thread_runner, daemon=True).start()

    # ----------------- الفحص الدوري لصلاحيات القنوات المعتمدة -----------------
    def health_check_channels_loop(self):
        """يفحص صلاحيات المشرف في القنوات كل 30 دقيقة وينبه المشرف إن انقطعت الصلاحية"""
        logger.info("🛡️ تشغيل الفاحص الدوري لصلاحيات القنوات (كل 30 دقيقة)...")
        while self.running:
            try:
                time.sleep(1800)  # 30 دقيقة
                channels = db.get_target_channels()
                lost_permissions = []

                for ch in channels:
                    check = self.tg_request("getChatAdministrators", {"chat_id": ch})
                    if not check.get("ok"):
                        err_desc = check.get("description", "تعذر التحقق")
                        db.update_channel_health(ch, "error_permission", err_desc)
                        lost_permissions.append((ch, err_desc))
                    else:
                        db.update_channel_health(ch, "active", "الصلاحيات مفعلة بنجاح")

                if lost_permissions:
                    alert_text = "🚨 **تنبيه عاجل من فاحص الصلاحيات الدوري!**\n"
                    alert_text += "انقطعت صلاحيات البوت في القنوات التالية:\n\n"
                    for ch, err in lost_permissions:
                        alert_text += f"• `{ch}`: {err}\n"
                    alert_text += "\n👉 يرجى الدخول للقناة والتأكد من وجود البوت كمشرف مع صلاحية نشر الرسائل."
                    self.send_msg(ADMIN_ID, alert_text)

            except Exception as e:
                logger.error(f"خطأ في فحص صلاحيات القنوات: {e}")

    # ----------------- معالجة المنشورات المجدولة -----------------
    def scheduled_posts_loop(self):
        logger.info("⏱️ تشغيل مراقب المنشورات المجدولة...")
        while self.running:
            try:
                time.sleep(30)
                due_posts = db.get_due_scheduled_posts()
                for p in due_posts:
                    db.mark_scheduled_post_status(p["id"], "processing")
                    post_queue.put({
                        "type": "scheduled_post",
                        "text": p["raw_text"],
                        "photo": p.get("photo_url"),
                        "targets": [p["target_channel"]] if p.get("target_channel") else db.get_target_channels(),
                        "user_id": p.get("user_id")
                    })
                    db.mark_scheduled_post_status(p["id"], "published")
            except Exception as e:
                logger.error(f"خطأ في نشر المنشورات المجدولة: {e}")

    # ----------------- معالجة رسائل وأوامر المستخدمين -----------------
    def handle_message(self, msg: Dict[str, Any]):
        chat_id = msg["chat"]["id"]
        from_user = msg.get("from", {})
        text = msg.get("text", "") or msg.get("caption", "")

        authorized, user_data = self.check_user_access(from_user)
        if not authorized:
            self.send_msg(chat_id, "⛔️ عذراً، تم حظر حسابك من استخدام هذا النظام بأمر المشرف.")
            return

        # 1. معالجة مشاركة رقم الهاتف (Contact Registration)
        contact = msg.get("contact")
        if contact:
            contact_user_id = contact.get("user_id")
            phone = contact.get("phone_number", "")
            if contact_user_id and contact_user_id != from_user.get("id"):
                self.send_msg(chat_id, "⚠️ **خطأ أمني**: يرجى مشاركة رقم هاتفك الحقيقي المسجل في حسابك عبر زر المشاركة الرسمي فقط.")
                return

            db.set_user_phone(chat_id, phone)
            success_msg = f"""🎉 **تم توثيق وربط رقم هاتفك بنجاح!**
📱 الرقم المعتمد: `{phone}`
🆔 المعرف: `{chat_id}`
👤 الاسم: {from_user.get('first_name', '')}

✅ تم فتح كافة صلاحيات البوت وحفظ حسابك بشكل دائم في قاعدة البيانات."""
            self.send_msg(chat_id, success_msg, self.get_main_reply_keyboard(user_data.get("role", "user")))
            return

        # 2. استخراج الميديا إن وجدت
        photo_id = None
        if "photo" in msg and isinstance(msg["photo"], list) and len(msg["photo"]) > 0:
            photo_id = msg["photo"][-1]["file_id"]

        # 3. ميزة كشف القناة عند توجيه رسالة (Forward)
        fwd_chat = msg.get("forward_from_chat")
        if not fwd_chat and "forward_origin" in msg and isinstance(msg["forward_origin"], dict):
            if msg["forward_origin"].get("type") == "channel":
                fwd_chat = msg["forward_origin"].get("chat")

        if fwd_chat and fwd_chat.get("type") == "channel":
            ch_id = fwd_chat.get("id")
            ch_title = fwd_chat.get("title", "قناتك")
            ch_user = fwd_chat.get("username")
            ch_target = f"@{ch_user}" if ch_user else str(ch_id)

            # تخزين المنشور للتعامل معه بزر "إعادة صياغة هذا المنشور فقط"
            self.cached_forwarded_post[chat_id] = {
                "text": text,
                "photo": photo_id,
                "channel": ch_target
            }

            prompt_kb = {
                "inline_keyboard": [
                    [{"text": f"✅ اعتماد [{ch_title}] كقناة نشر", "callback_data": f"confirm_add_ch_{ch_target}"}],
                    [{"text": "✍️ إعادة صياغة ونشر هذا المنشور فوراً", "callback_data": "panel_test"}],
                    [{"text": "❌ تجاهل", "callback_data": "panel_cancel"}]
                ]
            }
            detect_msg = f"""🎉 **تم التعرف على قناتك من المنشور الموجه!**
📢 القناة: **{ch_title}**
🆔 المعرف: `{ch_target}`

اختر الإجراء المطلوب من الأزرار أدناه:"""
            self.send_msg(chat_id, detect_msg, prompt_kb)
            return

        clean_text = text.strip()

        # معالجة الحالات المعلقة
        if chat_id in self.user_waiting_state:
            state = self.user_waiting_state.pop(chat_id)
            if state == "waiting_for_new_source":
                self.process_add_source(chat_id, clean_text)
                return
            elif state == "waiting_for_target_channel":
                self.process_add_target(chat_id, clean_text)
                return
            elif state == "waiting_for_instant_post":
                post_queue.put({
                    "type": "direct_post",
                    "text": clean_text,
                    "photo": photo_id,
                    "targets": db.get_target_channels(),
                    "user_id": chat_id
                })
                self.send_msg(chat_id, "⚡ **تم استلام المنشور!** جاري الصياغة بالذكاء والنشر في قنواتك...")
                return

        # ----------------- الأوامر المباشرة -----------------
        if clean_text in ["/start", "/help", "🎛 لوحة التحكم الرئيسية"]:
            self.show_welcome_panel(chat_id, user_data)
            return

        if clean_text in ["/register", "📱 ربط رقم هاتفي (تحقق)"]:
            reg_text = """📱 **نظام توثيق الحساب بالهاتف (Official Telegram Verification):**
            
اضغط على الزر الكبير أدناه لمشاركة رقم هاتفك المعتمد في تيليجرام.
يقوم تيليجرام بإرسال رقمك مشفراً وموثقاً لحفظ حسابك واشتراكك بشكل دائم."""
            self.send_msg(chat_id, reg_text, self.get_contact_request_keyboard())
            return

        if clean_text in ["/my_account", "👤 حسابي والاشتراك"]:
            self.show_account_panel(chat_id, user_data)
            return

        if clean_text in ["📢 قنوات النشر المعتمدة", "قنوات النشر"]:
            self.show_channels_panel(chat_id)
            return

        if clean_text in ["➕ إضافة مصدر للمراقبة", "إضافة مصدر", "/add_source"]:
            self.user_waiting_state[chat_id] = "waiting_for_new_source"
            self.send_msg(chat_id, "📥 أرسل الآن رابط أو معرّف القناة أو رابط RSS المطلوب مراقبتها (مثال: `@KSU_News` أو رابط موقع):")
            return

        if clean_text in ["🔄 فحص وسحب المصادر الآن", "/crawl_sources", "/crawl"]:
            self.trigger_manual_crawl(chat_id)
            return

        if clean_text in ["📝 صياغة ونشر خبر فوري", "/new_post"]:
            self.user_waiting_state[chat_id] = "waiting_for_instant_post"
            self.send_msg(chat_id, "📝 أرسل الآن نص الخبر أو الصورة/الفيديو لنشرها فوراً في القنوات المعتمدة:")
            return

        if clean_text in ["🧪 تجربة الصياغة الفورية", "/test"]:
            self.run_demo_rephrase(chat_id)
            return

        # أوامر الإدارة المشرفة
        if self.is_admin(chat_id):
            if clean_text in ["👥 إدارة المستخدمين", "/users"]:
                self.show_users_admin_panel(chat_id)
                return

            if clean_text.startswith("/ban "):
                target_uid = int(clean_text.replace("/ban ", "").strip())
                db.ban_user(target_uid, True)
                self.send_msg(chat_id, f"✅ تم حظر المستخدم `{target_uid}` بنجاح.")
                return

            if clean_text.startswith("/unban "):
                target_uid = int(clean_text.replace("/unban ", "").strip())
                db.ban_user(target_uid, False)
                self.send_msg(chat_id, f"✅ تم إلغاء حظر المستخدم `{target_uid}` بنجاح.")
                return

            if clean_text.startswith("/set_role "):
                parts = clean_text.split()
                if len(parts) >= 3:
                    u_id, r = int(parts[1]), parts[2].lower()
                    db.set_user_role(u_id, r)
                    self.send_msg(chat_id, f"✅ تم تعيين رتبة `{r}` للمستخدم `{u_id}`.")
                return

            if clean_text.startswith("/set_ad"):
                new_ad = clean_text.replace("/set_ad", "").strip()
                if new_ad:
                    db.set_setting("custom_ad", new_ad)
                    self.send_msg(chat_id, "✅ تم تحديث إعلان خدماتك الطلابية البديل بنجاح!")
                return

            if clean_text in ["⏸ إيقاف / استئناف", "إيقاف"]:
                cur = db.get_setting("is_paused", "0")
                new_state = "0" if cur == "1" else "1"
                db.set_setting("is_paused", new_state)
                self.send_msg(chat_id, f"{'⏸ تم إيقاف النشر التلقائي مؤقتاً.' if new_state == '1' else '▶️ تم استئناف النشر التلقائي.'}")
                return

        # إذا كانت الرسالة نصاً خبراً كبيراً أو صورة دون أمر
        if len(clean_text) > 20 or photo_id:
            post_queue.put({
                "type": "direct_post",
                "text": clean_text,
                "photo": photo_id,
                "targets": db.get_target_channels(),
                "user_id": chat_id
            })
            self.send_msg(chat_id, "⚡ **تم استلام المنشور!** جاري المعالجة بالذكاء والنشر في قنواتك...")

    # ----------------- معالجة أزرار الإنلاين (Callback Queries) -----------------
    def handle_callback_query(self, cb: Dict[str, Any]):
        cb_id = cb["id"]
        from_user = cb["from"]
        chat_id = cb["message"]["chat"]["id"]
        data = cb.get("data", "")

        authorized, user_data = self.check_user_access(from_user)
        if not authorized:
            self.answer_callback(cb_id, "⛔️ غير مصرح لك.", alert=True)
            return

        self.answer_callback(cb_id)

        if data == "panel_manage_channels":
            self.show_channels_panel(chat_id)

        elif data == "panel_prompt_add_channel":
            self.user_waiting_state[chat_id] = "waiting_for_target_channel"
            self.send_msg(chat_id, "📢 أرسل معرّف قناتك للنشر (مثال: `@jhdhhdcj`):")

        elif data.startswith("confirm_add_ch_"):
            target_ch = data.replace("confirm_add_ch_", "")
            db.add_target_channel(target_ch, target_ch, chat_id)
            self.send_msg(chat_id, f"✅ تم بنجاح ربط القناة الهدف: `{target_ch}`")

        elif data == "panel_test_publish":
            self.test_publish_all_channels(chat_id)

        # إصلاح الزر الميت المطلوب بدقة (panel_test)
        elif data == "panel_test":
            cached = self.cached_forwarded_post.get(chat_id)
            if cached and cached.get("text"):
                self.send_msg(chat_id, "⏳ جاري إعادة صياغة المنشور الموجه بالذكاء الاصطناعي...")
                post_queue.put({
                    "type": "direct_post",
                    "text": cached.get("text"),
                    "photo": cached.get("photo"),
                    "targets": db.get_target_channels(),
                    "user_id": chat_id
                })
            else:
                self.run_demo_rephrase(chat_id)

        elif data == "panel_add_source":
            self.user_waiting_state[chat_id] = "waiting_for_new_source"
            self.send_msg(chat_id, "📥 أرسل معرف القناة المصدر (مثال: `@KSU_News`):")

        elif data == "panel_sources":
            self.show_sources_list(chat_id)

        elif data == "panel_my_account":
            self.show_account_panel(chat_id, user_data)

        elif data == "panel_new_post":
            self.user_waiting_state[chat_id] = "waiting_for_instant_post"
            self.send_msg(chat_id, "📝 أرسل الآن نص الخبر أو وسائطه مباشرة:")

        elif data == "panel_toggle_pause":
            if self.is_admin(chat_id):
                cur = db.get_setting("is_paused", "0")
                new_val = "0" if cur == "1" else "1"
                db.set_setting("is_paused", new_val)
                self.send_msg(chat_id, f"{'⏸ تم الإيقاف المؤقت.' if new_val == '1' else '▶️ تم الاستئناف.'}")

        elif data == "panel_stats":
            self.show_stats_panel(chat_id)

        elif data == "panel_cancel":
            self.cached_forwarded_post.pop(chat_id, None)
            self.send_msg(chat_id, "تم الإلغاء ✅")

    # ----------------- وظائف العرض والتحكم -----------------
    def show_welcome_panel(self, chat_id: int, user_data: Dict[str, Any]):
        channels = db.get_target_channels()
        role = user_data.get("role", "user")
        is_paused = db.get_setting("is_paused", "0") == "1"
        status_badge = "⏸ متوقف مؤقتاً" if is_paused else "🟢 نشط 24/7"

        text = f"""👋 **مرحباً بك في محرر وموجه المحتوى التعليمي الذكي V3!**
━━━━━━━━━━━━━━━━━━━
• **حالة البوت**: {status_badge}
• **رتبتك في النظام**: `{role}`
• **قناة النشر الهدف**: `{', '.join(channels)}`
• **النموذج الذكي**: `{PRIMARY_MODEL}`
• **المحرك وقاعدة البيانات**: `SQLite3 Persistent DB`
• **سحب المصادر**: مفعل (MTProto + Scraper)
━━━━━━━━━━━━━━━━━━━
👇 **اختر الإجراء المطلوب من الأزرار أدناه:**"""
        self.send_msg(chat_id, text, self.get_control_panel_inline_keyboard(role == "admin"))

    def show_account_panel(self, chat_id: int, user_data: Dict[str, Any]):
        phone = user_data.get("phone_number") or "⚠️ غير موثق بعد (اضغط زر ربط الهاتف)"
        plan = user_data.get("plan", "free")
        expires = user_data.get("plan_expires_at", "غير محدد")
        if expires and "T" in expires:
            expires = expires.split("T")[0]

        text = f"""👤 **ملف الحساب والاشتراك:**
━━━━━━━━━━━━━━━━━━━
🆔 المعرف: `{chat_id}`
📱 الهاتف الموثق: `{phone}`
👑 الرتبة: `{user_data.get('role', 'user')}`
📦 الخطة الحالية: `{plan.upper()}`
📅 تاريخ انتهاء الخطة: `{expires}`
💰 الرصيد: `{user_data.get('balance', 0.0)}` نقطة
━━━━━━━━━━━━━━━━━━━
💡 *لتوثيق رقم هاتفك والاستفادة من النشر غير المحدود، أرسل /register*"""
        self.send_msg(chat_id, text)

    def show_channels_panel(self, chat_id: int):
        details = db.get_target_channels_detailed()
        text = "📢 **إدارة قنوات النشر المستهدفة وإحصائياتها:**\n━━━━━━━━━━━━━━━━━━━\n"
        for i, c in enumerate(details, 1):
            st = "🟢 ممتازة" if c["status"] == "active" else "🔴 مشكلة صلاحية"
            text += f"{i}. `{c['channel_id']}` ({st})\n   └ نجاح: {c['success_count']} | فشل: {c['fail_count']}\n"
            if c.get("last_error_msg"):
                text += f"   └ خطأ: {c['last_error_msg']}\n"

        text += "\n💡 *لإضافة قناة: أرسل /set_channel @اسم_قناتك أو اضغط الزر أدناه:*"
        kb = {
            "inline_keyboard": [
                [{"text": "➕ إضافة قناة جديدة", "callback_data": "panel_prompt_add_channel"}],
                [{"text": "🧪 اختبار النشر الآن", "callback_data": "panel_test_publish"}]
            ]
        }
        self.send_msg(chat_id, text, kb)

    def show_sources_list(self, chat_id: int):
        srcs = db.get_sources()
        text = f"📋 **المصادر المراقبة حالياً ({len(srcs)}):**\n━━━━━━━━━━━━━━━━━━━\n"
        for i, s in enumerate(srcs, 1):
            last_p = f" (آخر منشور: #{s['last_post_id']})" if s.get("last_post_id") else ""
            text += f"{i}. [{s['type']}] `{s['target']}`{last_p}\n"
        text += "\n➕ لإضافة مصدر أرسل: `/add_source @channel`"
        self.send_msg(chat_id, text)

    def show_users_admin_panel(self, chat_id: int):
        users = db.list_users(20)
        text = f"👥 **المستخدمون المسجلون ({len(users)}):**\n━━━━━━━━━━━━━━━━━━━\n"
        for u in users:
            banned = "🚫 محظور" if u["is_banned"] else "✅ نشط"
            ph = u["phone_number"] or "بلا هاتف"
            text += f"• `{u['user_id']}` (@{u.get('username') or 'بلا_يوزر'}) | {u['role']} | {banned}\n  📱 {ph}\n"
        self.send_msg(chat_id, text)

    def show_stats_panel(self, chat_id: int):
        proc = db.get_setting("processed_count", "0")
        fwd = db.get_setting("forwarded_count", "0")
        ads = db.get_setting("ad_replaced_count", "0")
        channels = db.get_target_channels()
        srcs = db.get_sources()
        text = f"""📊 **إحصائيات النظام الشاملة:**
━━━━━━━━━━━━━━━━━━━
• إجمالي المنشورات المعالجة: `{proc}`
• إجمالي المنشورات الصادرة: `{fwd}`
• إعلانات المنافسين المستبدلة: `{ads}`
• قنوات النشر النشطة: `{len(channels)}`
• المصادر المراقبة: `{len(srcs)}`
• قاعدة البيانات: `SQLite3 Persistent Engine`"""
        self.send_msg(chat_id, text)

    def process_add_source(self, chat_id: int, input_text: str):
        target = input_text.strip()
        src_type = "rss" if target.startswith("http") else "telegram"
        db.add_source(src_type, target, target, added_by=chat_id)
        self.send_msg(chat_id, f"✅ تمت إضافة المصدر `{target}` بنجاح!")

    def process_add_target(self, chat_id: int, input_text: str):
        target = input_text.strip()
        db.add_target_channel(target, target, added_by=chat_id)
        self.send_msg(chat_id, f"✅ تم اعتماد قناة النشر `{target}` بنجاح!")

    def trigger_manual_crawl(self, chat_id: int):
        self.send_msg(chat_id, "🔄 جاري فحص وسحب أحدث المنشورات من كافة المصادر المعتمدة...")
        sources = db.get_sources()
        for s in sources:
            if s.get("type") == "telegram":
                threading.Thread(target=self.check_telegram_channel_scraper, args=(s,), daemon=True).start()
            elif s.get("type") == "rss":
                threading.Thread(target=self.check_rss_feed, args=(s,), daemon=True).start()

    def test_publish_all_channels(self, chat_id: int):
        channels = db.get_target_channels()
        self.send_msg(chat_id, f"⏳ جاري اختبار النشر في {len(channels)} قناة...")
        test_caption = """📌 **منشور تجريبي لاختبار صلاحيات البوت الأكاديمي**

• تم الربط والتحقق بنجاح مع محرك النشر الذكي V3
• البوت يمتلك صلاحية المشرف والنشر الفوري 24/7
• جميع المنشورات القادمة ستتم صياغتها باحترافية عالية وبدون ذكر أي مصادر

💬 نرحب بجميع الطلاب لمتابعة آخر المستجدات الأكاديمية!
#أخبار_الجامعة #دراسة #شؤون_الطلاب"""

        test_img = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/240px-Telegram_logo.svg.png"
        results = []
        for ch in channels:
            res = self.send_photo(ch, test_img, test_caption)
            ok = res.get("ok", False)
            desc = res.get("description", "")
            db.record_channel_publish_result(ch, ok, desc)
            if ok:
                results.append(f"✅ `{ch}`: تم النشر بنجاح! 🎉")
            else:
                results.append(f"❌ `{ch}`: فشل ({desc})")

        self.send_msg(chat_id, "📊 **نتائج فحص قنوات النشر:**\n\n" + "\n".join(results))

    def run_demo_rephrase(self, chat_id: int):
        sample = "تعلن عمادة القبول والتسجيل عن بدء استقبال طلبات الالتحاق للفصل القادم عبر البوابة ابتداءً من الأحد القادم ويستمر حتى نهاية الشهر."
        self.send_msg(chat_id, f"🧪 **جاري صياغة عينة خبر عبر DeepSeek:**\n`{sample}`")
        result = self.call_ai(sample)
        self.send_msg(chat_id, f"✨ **النتيجة بعد الصياغة:**\n───────────────────\n{result}")

    # ----------------- الحلقة الرئيسية وتشغيل getUpdates مع الـ Backoff -----------------
    def run(self):
        logger.info("=" * 65)
        logger.info("  🚀 تشغيل محرر المحتوى التعليمي والجامعي الذكي (النسخة الشاملة V3)")
        logger.info(f"  المشرف العام: @{ADMIN_USERNAME} ({ADMIN_ID})")
        logger.info(f"  قناة النشر الافتراضية: {db.get_target_channels()}")
        logger.info("=" * 65)

        # تشغيل الخيوط الخلفية
        threading.Thread(target=run_keepalive_server, daemon=True).start()
        threading.Thread(target=self.worker_loop, daemon=True).start()
        threading.Thread(target=self.monitor_sources_loop, daemon=True).start()
        threading.Thread(target=self.health_check_channels_loop, daemon=True).start()
        threading.Thread(target=self.scheduled_posts_loop, daemon=True).start()
        self.start_telethon_userbot()

        try:
            welcome_text = f"""🚀 **تم تشغيل محرر المحتوى التعليمي بنجاح (النسخة V3.0)!**
👑 المشرف: @{ADMIN_USERNAME} (`{ADMIN_ID}`)
📢 قنوات النشر: `{', '.join(db.get_target_channels())}`
💾 قاعدة البيانات: `SQLite3 Persistent DB`
🛡 فاحص الصلاحيات الدوري: يعمل كل 30 دقيقة
⚙️ طابور المعالجة المستقل: نشط لحماية البوت من التجمد"""
            self.send_msg(ADMIN_ID, welcome_text, self.get_main_reply_keyboard("admin"))
        except Exception as e:
            logger.warning(f"ملاحظة في إشعار البداية: {e}")

        offset = 0
        backoff_delay = 1
        logger.info("🎧 جاري الاستماع لتحديثات وأوامر تيليجرام...")

        # فحص وجود ويب هوك نشط
        webhook_info = self.tg_request("getWebhookInfo")
        has_active_webhook = bool(webhook_info.get("ok") and webhook_info.get("result", {}).get("url"))
        if has_active_webhook:
            logger.info(f"🔗 تم رصد Webhook نشط على: {webhook_info['result']['url']}")
            logger.info("⚡️ البوت يعمل بنمط التناغم الكامل: الأوامر التفاعلية عبر Webhook + الساحب الآلي المتقدم والمراقب في الخلفية 24/7")

        while self.running:
            try:
                # إذا كان الويب هوك نشطاً، نترك استقبال الرسائل للويب هوك ونبقي خيوط السحب والنشر نشطة
                if has_active_webhook:
                    time.sleep(25)
                    # فحص دوري كل دقيقة إذا تغيرت حالة الويب هوك
                    chk = self.tg_request("getWebhookInfo", timeout=10)
                    if chk.get("ok") and not chk.get("result", {}).get("url"):
                        has_active_webhook = False
                        logger.info("🔄 تم إلغاء Webhook، تفعيل الاستماع المباشر getUpdates فوراً...")
                    continue

                res = self.tg_request(f"getUpdates?offset={offset}&timeout=25", timeout=35)
                
                # فحص خطأ 409 Conflict (نسخة أخرى تعمل أو ويب هوك مفعل)
                if not res.get("ok"):
                    http_code = res.get("http_code") or res.get("error_code")
                    if http_code == 409:
                        chk = self.tg_request("getWebhookInfo", timeout=10)
                        if chk.get("ok") and chk.get("result", {}).get("url"):
                            has_active_webhook = True
                            logger.info(f"🔗 تم تفعيل الويب هوك على {chk['result']['url']} - الانتقال لنمط مراقبة السحب الخلفي.")
                            continue
                        time.sleep(backoff_delay)
                        backoff_delay = min(backoff_delay * 2, 60)
                        continue
                    elif http_code == 429:
                        retry_after = res.get("parameters", {}).get("retry_after", 10)
                        logger.warning(f"⚠️ خطأ 429 Too Many Requests. الانتظار لمدة {retry_after} ثانية...")
                        time.sleep(retry_after)
                        continue
                    else:
                        time.sleep(2)
                        continue

                # إذا نجح الطلب، نعيد ضبط الـ Backoff
                backoff_delay = 1
                updates = res.get("result", [])

                for u in updates:
                    offset = u["update_id"] + 1
                    if "callback_query" in u:
                        self.handle_callback_query(u["callback_query"])
                    elif "message" in u:
                        self.handle_message(u["message"])
                    elif "channel_post" in u:
                        self.handle_message(u["channel_post"])
                    elif "edited_message" in u:
                        self.handle_message(u["edited_message"])
                    elif "edited_channel_post" in u:
                        self.handle_message(u["edited_channel_post"])

                time.sleep(0.2)

            except KeyboardInterrupt:
                logger.info("تم إيقاف البوت بواسطة المستخدم.")
                self.running = False
                break
            except Exception as e:
                logger.error(f"خطأ في حلقة الاستماع الرئيسية: {e}")
                time.sleep(3)


if __name__ == "__main__":
    bot = StandaloneTelegramEducationalBot()
    bot.run()
