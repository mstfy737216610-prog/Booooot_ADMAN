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
import uuid
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

def safe_int(val: Any, default: int = 0) -> int:
    """تحويل آمن إلى عدد صحيح لتفادي استثناءات ValueError عند وجود نصوص الجلسات أو قيم خاطئة"""
    if val is None:
        return default
    try:
        s = str(val).strip()
        if s.lstrip("-").isdigit():
            return int(s)
        # استخراج أول كتلة أرقام إن وجدت
        digits_match = re.search(r'\b\d{5,10}\b', s)
        if digits_match:
            return int(digits_match.group(0))
        return default
    except Exception:
        return default

# ----------------- الإعدادات والاعتمادات والتحقق الذاتي -----------------
BOT_TOKEN = os.getenv("BOT_TOKEN", "8901693218:AAEOQmHMZLy-xaPbTUMq1KGhDwp1l0wFWP4").strip()
ADMIN_ID = safe_int(os.getenv("ADMIN_ID", "7607633343"), 7607633343)
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "M_S_F_G").replace("@", "").strip()

# استرداد آمن ومعالجة الخلط المحتمل بين API_ID و STRING_SESSION
_raw_api_id = os.getenv("TELEGRAM_API_ID", "20123456").strip()
_raw_session = os.getenv("STRING_SESSION", "").strip()

# إذا تم وضع كود الجلسة (StringSession) في خانة TELEGRAM_API_ID بالخطأ
if not _raw_api_id.lstrip("-").isdigit():
    if len(_raw_api_id) > 20:
        if not _raw_session or len(_raw_session) < 20:
            _raw_session = _raw_api_id
        # إذا كانت الجلسة هي التي تحتوي على رقم الـ API ID
        if _raw_session.lstrip("-").isdigit() and len(_raw_session) <= 10:
            TELEGRAM_API_ID = safe_int(_raw_session, 20123456)
        else:
            TELEGRAM_API_ID = 20123456
    else:
        TELEGRAM_API_ID = safe_int(_raw_api_id, 20123456)
else:
    TELEGRAM_API_ID = safe_int(_raw_api_id, 20123456)

if TELEGRAM_API_ID <= 0:
    TELEGRAM_API_ID = 20123456

TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH", "abcdef0123456789abcdef0123456789").strip()
STRING_SESSION = _raw_session

AI_BASE_URL = os.getenv("AI_BASE_URL", "https://api.hcnsec.cn/v1").rstrip("/")
AI_API_KEY = os.getenv("AI_API_KEY", "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii").strip()
PRIMARY_MODEL = os.getenv("PRIMARY_MODEL", "DeepSeek-V4.1-Flash").strip()
FALLBACK_MODEL = os.getenv("FALLBACK_MODEL", "DeepSeek-V4-Flash").strip()
_raw_port = safe_int(os.getenv("PORT", os.getenv("KEEPALIVE_PORT", "8088")), 8088)
PORT = 8088 if _raw_port == 3000 else _raw_port

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

SYSTEM_PROMPT_REPHRASE = """# الدور: رئيس التحرير والناشر الرسمي للأخبار الأكاديمية والجامعية
## الهوية:
أنت الكاتب الرسمي والناشر المعتمد لقناة إخبارية أكاديمية وجامعية رائدة.
مهمتك إعادة صياغة كافة المنشورات والقرارات والمواعيد والجداول بأسلوب تحريري أكاديمي فخم، راقٍ، وسلس، كأنك أنت المنصة الرسمية التي تصدر هذا الخبر.

## القواعد الصارمة والإلزامية (100%):
1. صياغة المنشور بالكامل بأسلوب أصلي دون الإشارة إلى أي مصدر خارجي أو عبارات نقل ("وفقاً لـ"، "كما ورد"، "نقلاً عن").
2. احذف نهائياً أي روابط أو معرفات قنوات تيليجرام ترويجية خارجية (مثل @channel أو t.me/xxx).
3. 🚨 نشر كافة التواريخ والمواعيد الأكاديمية والتقويم الفصلي والجداول وشروط القبول والاختبارات الواردة في المنشور بكل دقة وموضوعية دون حذف أو اختصار.
4. 🚨 الحفاظ المطلق على جميع روابط التقديم والتسجيل والبوابات الرسمية (مثل apps.powerapps.com, forms.office.com, portals, blackboard, sites) بنصها الكامل في سطر مستقل يسبقه:
   🔗 رابط التقديم / البوابة الرسمية: [الرابط الكامل]
5. التنسيق الأكاديمي المعتمد:
🎓 <b>[عنوان أكاديمي جذاب وواضح]</b>

🗓 <b>المواعيد والتواريخ الهامة:</b>
▫️ [المواعيد والمهل المحددة للطلاب إن وجدت في الخبر]

📌 <b>أبرز التفاصيل والتعليمات:</b>
▫️ [أهم النقاط والشروط منظمة ومباشرة بنقاط ▫️ سهلة القراءة]

🔗 [رابط التقديم الرسمي إن وُجد]

💬 يسعدنا الرد على استفساراتكم في التعليقات ومشاركة الخبر مع زملائكم!

#جامعة #قبول #تسجيل #مواعيد #شؤون_الطلاب"""

AD_KEYWORDS = [
    "حل واجبات بمقابل", "حل واجبات واختبارات", "حل كويزات", "حل فاينل", "حل اسايمنت",
    "كتابة بحوث بمقابل", "عمل بحوث ورسائل بمقابل", "إعلان مدفوع للخدمات", "إعلان ممول غير رسمي"
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
        self.token = BOT_TOKEN
        self.user_waiting_state: Dict[int, str] = {}
        self.univ_wizard_data: Dict[int, Dict[str, Any]] = {}
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

    def send_msg(self, chat_id: Any, text: str, reply_markup: Optional[Dict] = None, parse_mode: Optional[str] = "HTML", reply_to_message_id: Optional[int] = None) -> Dict[str, Any]:
        safe_text = self.to_safe_html(text) if parse_mode == "HTML" else text
        payload = {"chat_id": chat_id, "text": safe_text}
        if reply_markup:
            payload["reply_markup"] = reply_markup
        if parse_mode:
            payload["parse_mode"] = parse_mode
        if reply_to_message_id:
            payload["reply_to_message_id"] = reply_to_message_id
        res = self.tg_request("sendMessage", payload)
        if not res.get("ok"):
            payload.pop("parse_mode", None)
            payload["text"] = text
            res = self.tg_request("sendMessage", payload)
        return res

    def send_photo(self, chat_id: Any, photo: str, caption: str = "", reply_markup: Optional[Dict] = None, parse_mode: Optional[str] = "HTML") -> Dict[str, Any]:
        safe_caption = self.to_safe_html(caption) if parse_mode == "HTML" else caption
        lead_caption = safe_caption[:1020] if len(safe_caption) > 1024 else safe_caption

        # 1. إذا كانت الصورة ملفاً محلياً محفوظاً على القرص (مثل تحميلات Telethon أو السكرابر)
        if photo and os.path.isfile(photo):
            try:
                with open(photo, "rb") as f:
                    img_bytes = f.read()
                if img_bytes and len(img_bytes) > 50:
                    boundary = uuid.uuid4().hex
                    body = bytearray()
                    def add_field(name: str, val: str):
                        body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{val}\r\n'.encode('utf-8'))

                    add_field("chat_id", str(chat_id))
                    if lead_caption:
                        add_field("caption", lead_caption)
                        if parse_mode:
                            add_field("parse_mode", parse_mode)
                    if reply_markup:
                        add_field("reply_markup", json.dumps(reply_markup))

                    fname = os.path.basename(photo) or "image.jpg"
                    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="photo"; filename="{fname}"\r\nContent-Type: image/jpeg\r\n\r\n'.encode('utf-8'))
                    body.extend(img_bytes)
                    body.extend(f'\r\n--{boundary}--\r\n'.encode('utf-8'))

                    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendPhoto"
                    upload_req = urllib.request.Request(
                        url,
                        data=body,
                        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
                    )
                    with urllib.request.urlopen(upload_req, context=ssl_ctx, timeout=30) as u_resp:
                        res = json.loads(u_resp.read().decode("utf-8"))
                        if res.get("ok"):
                            if len(safe_caption) > 1024:
                                self.send_msg(chat_id, safe_caption[1020:], reply_markup=reply_markup, parse_mode=parse_mode)
                            return res
            except Exception as e:
                logger.warning(f"تعذر رفع ملف الصورة المحلي {photo}: {e}")

        # 2. إذا كانت الصورة رابط إنترنت (URL ويب أو تيليجرام CDN أو تويتر)
        if photo and (photo.startswith("http://") or photo.startswith("https://")):
            try:
                req_headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
                }
                if "telegram" in photo or "telesco.pe" in photo or "t.me" in photo:
                    req_headers["Referer"] = "https://t.me/"
                elif "twimg" in photo or "x.com" in photo or "twitter" in photo:
                    req_headers["Referer"] = "https://x.com/"

                img_req = urllib.request.Request(photo, headers=req_headers)
                with urllib.request.urlopen(img_req, context=ssl_ctx, timeout=15) as img_resp:
                    img_bytes = img_resp.read()

                if img_bytes and len(img_bytes) > 50:
                    boundary = uuid.uuid4().hex
                    body = bytearray()
                    def add_field(name: str, val: str):
                        body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{val}\r\n'.encode('utf-8'))

                    add_field("chat_id", str(chat_id))
                    if lead_caption:
                        add_field("caption", lead_caption)
                        if parse_mode:
                            add_field("parse_mode", parse_mode)
                    if reply_markup:
                        add_field("reply_markup", json.dumps(reply_markup))

                    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="photo"; filename="image.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'.encode('utf-8'))
                    body.extend(img_bytes)
                    body.extend(f'\r\n--{boundary}--\r\n'.encode('utf-8'))

                    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendPhoto"
                    upload_req = urllib.request.Request(
                        url,
                        data=body,
                        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
                    )
                    with urllib.request.urlopen(upload_req, context=ssl_ctx, timeout=30) as u_resp:
                        res = json.loads(u_resp.read().decode("utf-8"))
                        if res.get("ok"):
                            if len(safe_caption) > 1024:
                                self.send_msg(chat_id, safe_caption[1020:], reply_markup=reply_markup, parse_mode=parse_mode)
                            return res
            except Exception as e:
                logger.warning(f"تعذر الرفع المباشر لـ bytes الصورة ({photo[:40]}...): {e}")

        # 3. إذا كانت الصورة عبارة عن file_id أصلي في تيليجرام
        if photo and not os.path.isfile(photo):
            payload = {"chat_id": chat_id, "photo": photo}
            if lead_caption:
                payload["caption"] = lead_caption
                if parse_mode:
                    payload["parse_mode"] = parse_mode
            if reply_markup:
                payload["reply_markup"] = reply_markup

            res = self.tg_request("sendPhoto", payload)
            if res.get("ok"):
                if len(safe_caption) > 1024:
                    self.send_msg(chat_id, safe_caption[1020:], reply_markup=reply_markup, parse_mode=parse_mode)
                return res

            # محاولة ثانية بدون parse_mode
            if parse_mode and lead_caption:
                payload.pop("parse_mode", None)
                payload["caption"] = caption[:1020]
                res = self.tg_request("sendPhoto", payload)
                if res.get("ok"):
                    return res

            # محاولة ثالثة بإرسال الصورة وحدها
            res_photo = self.tg_request("sendPhoto", {"chat_id": chat_id, "photo": photo})
            if res_photo.get("ok"):
                if caption:
                    self.send_msg(chat_id, caption, reply_markup=reply_markup, parse_mode=parse_mode)
                return res_photo

        # حماية قاطعة: إذا تعذر إرسال الصورة تماماً، ننشر النص كاملاً كرسالة حتى لا يضيع الخبر
        if caption:
            res_msg = self.send_msg(chat_id, caption, reply_markup=reply_markup, parse_mode=parse_mode)
            if res_msg.get("ok"):
                res_msg["note"] = "fallback_text_after_photo_error"
                return res_msg
        return {"ok": False, "description": "Failed to send photo and text"}

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
            [{"text": "🏛️ إدارة الجامعات وقنوات النشر"}, {"text": "🔄 فحص وسحب أخبار الجامعات"}],
            [{"text": "➕ إضافة جامعة وقناة نشر"}, {"text": "🌐 بحث أخبار جوجل للجامعة"}],
            [{"text": "📝 صياغة ونشر خبر فوري"}, {"text": "🎯 إعلان خدماتي البديل"}],
            [{"text": "👤 حسابي والاشتراك"}, {"text": "🧪 تجربة الصياغة الفورية"}]
        ]
        if user_role == "admin":
            kb.append([{"text": "👥 إدارة المستخدمين"}, {"text": "📊 تقارير القنوات"}])
            kb.append([{"text": "📱 ربط رقم هاتفي (تحقق)"}, {"text": "⏸ إيقاف / استئناف"}])
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
        univs = db.get_university_projects()
        is_paused = db.get_setting("is_paused", "0") == "1"
        buttons = [
            [
                {"text": f"🏛️ الجامعات وقنواتها ({len(univs)})", "callback_data": "panel_universities"},
                {"text": "➕ إضافة جامعة جديدة", "callback_data": "panel_add_university"}
            ],
            [
                {"text": "🔄 فحص وسحب أخبار الجامعات", "callback_data": "panel_crawl"},
                {"text": "🌐 بحث أخبار جوجل", "callback_data": "panel_gnews"}
            ],
            [
                {"text": "📝 صياغة ونشر خبر فوري", "callback_data": "panel_new_post"},
                {"text": "🎯 إعلان خدماتي البديل", "callback_data": "panel_ad"}
            ]
        ]
        if is_admin_user:
            buttons.append([
                {"text": "📊 حالة النظام والتقارير", "callback_data": "panel_stats"},
                {"text": f"{'▶️ استئناف النشر' if is_paused else '⏸ إيقاف مؤقت'}", "callback_data": "panel_toggle_pause"}
            ])
        return {"inline_keyboard": buttons}

    # ----------------- دمج الذكاء الاصطناعي مع Timeout Guard -----------------
    def clean_text_from_sources(self, text: str) -> str:
        if not text:
            return ""
        cleaned = text.replace("&nbsp;&nbsp;X", "").replace("&nbsp;X", "").replace("&nbsp;", " ")
        cleaned = re.sub(r'\s+X\s*$', '', cleaned)
        # إزالة روابط قنوات تيليجرام الترويجية فقط دون مساس بالروابط الرسمية أو أسماء الجامعات
        cleaned = re.sub(r'https?://(?:t\.me|telegram\.me)/[a-zA-Z0-9_+/]+', '', cleaned)
        cleaned = re.sub(r'(?:لا تنسوا الاشتراك|تابعونا على تليجرام|اشترك في القناة)[^\n.]*', '', cleaned, flags=re.IGNORECASE)
        cleaned = cleaned.replace("ߓ堙噈اعيد", "مواعيد").replace("ߓꠙ嘰كرات", "مذكرات").replace("ߎ㠘㙆ظمة", "أنظمة")
        cleaned = re.sub(r'[\u07C0-\u07FF\u4E00-\u9FFF\uF000-\uFFFF]', '', cleaned)

        # حذف الأسطر الفارغة والنقاط الفارغة مع الحفاظ الكامل على نصوص المنشور
        lines = cleaned.split("\n")
        clean_lines = []
        for l in lines:
            t = l.strip()
            if not t or t in ["•", "-", "*", "📌", "🎓", "• ", "- ", "* "]:
                continue
            clean_lines.append(t)
        return "\n".join(clean_lines).strip()

    def extract_external_links(self, text: str) -> List[str]:
        if not text:
            return []
        matches = re.findall(r'https?://[^\s<>"]+', text)
        valid = []
        for u in matches:
            u_clean = u.rstrip(".,;!?)>]\'\"")
            if "t.me/" in u_clean or "telegram.me/" in u_clean:
                continue
            if u_clean not in valid:
                valid.append(u_clean)
        return valid

    def call_ai(self, raw_text: str, custom_instruction: str = "", system_prompt: Optional[str] = None, target_univ: Optional[str] = None) -> Optional[str]:
        clean_input = self.clean_text_from_sources(raw_text)
        if not clean_input or len(clean_input) < 15:
            return None

        # استخراج كافة الروابط الخارجية (بوابات التقديم، PowerApps، الاستمارات، بوابات الجامعات)
        ext_links = self.extract_external_links(raw_text)

        active_system_prompt = system_prompt or SYSTEM_PROMPT_REPHRASE
        if target_univ:
            active_system_prompt += f"\n\n🚨 المنشور موجه حصراً لقناة وطلاب: ({target_univ}). أعد صياغة المحتوى باحترافية أكاديمية ليفيد طلاب هذه القناة، مع إبراز أي مواعيد أو شروط تقديم دون ذكر أي مصادر سابقة."

        instruction_addon = f"تعليمات إضافية من المشرف: {custom_instruction}\n\n" if custom_instruction else ""
        payload = {
            "model": PRIMARY_MODEL,
            "messages": [
                {"role": "system", "content": active_system_prompt},
                {"role": "user", "content": f"{instruction_addon}صيغ هذا المحتوى الأكاديمي كمنشور رسمي أصلي لقناتك (بدون ذكر أي مصادر أو قنوات سابقة مع الحفاظ التام على روابط التقديم والبوابات والمواعيد):\n\n{clean_input}"}
            ],
            "temperature": 0.35,
            "max_tokens": 1400
        }
        headers = {
            "Authorization": f"Bearer {AI_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "TelegramEducationalBot/3.0"
        }
        endpoint = f"{AI_BASE_URL}/chat/completions"

        def _process_ai_response(text: str) -> Optional[str]:
            cleaned_ai = self.clean_text_from_sources(text)
            for lk in ext_links:
                if lk not in cleaned_ai:
                    cleaned_ai += f"\n\n🔗 <b>رابط التقديم / البوابة الإلكترونية:</b>\n{lk}"
            return cleaned_ai

        # محاولة النموذج الأساسي
        try:
            req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers)
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if "choices" in data and len(data["choices"]) > 0:
                    ai_text = data["choices"][0]["message"]["content"].strip()
                    res = _process_ai_response(ai_text)
                    if res:
                        return res
        except Exception as e:
            logger.warning(f"ملاحظة في نموذج الذكاء الأساسي {PRIMARY_MODEL}: {e}")

        # محاولة النموذج البديل
        try:
            payload["model"] = FALLBACK_MODEL
            req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers)
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=25) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if "choices" in data and len(data["choices"]) > 0:
                    ai_text = data["choices"][0]["message"]["content"].strip()
                    res = _process_ai_response(ai_text)
                    if res:
                        return res
        except Exception as e:
            logger.warning(f"ملاحظة في النموذج البديل {FALLBACK_MODEL}: {e}")

        # صياغة محلية ذكية وأكاديمية خالية من التأخير والتلف
        clean_lines = [l.strip() for l in clean_input.split("\n") if l.strip() and not l.startswith("@") and "t.me/" not in l]
        text_lines = [l for l in clean_lines if not l.startswith("http://") and not l.startswith("https://") and l not in ["•", "-", "*", "📌", "🎓"]]
        if not text_lines:
            return None

        first_line = text_lines[0]
        first_line = re.sub(r'^[•\-\*#📌📢✨🎓▫️]\s*', '', first_line).strip()
        title = first_line[:75] + "..." if len(first_line) > 80 else first_line

        body_lines = [l for l in text_lines[1:8] if len(l) > 3]
        clean_bullets = []
        for bl in body_lines:
            bl_text = re.sub(r'^[•\-\*▫️]\s*', '', bl).strip()
            clean_bullets.append(f"▫️ {bl_text}")
        bullets = "\n".join(clean_bullets)

        links_block = ""
        if ext_links:
            links_block = "\n\n🔗 <b>رابط التقديم / البوابة الإلكترونية:</b>\n" + "\n".join(ext_links)

        tag = f"#{target_univ.replace(' ', '_')}" if target_univ else "#أخبار_التعليم"
        return f"🎓 <b>{title}</b>\n\n📌 <b>أبرز التفاصيل والتعليمات الأكاديمية:</b>\n{bullets}{links_block}\n\n💬 يسعدنا الرد على استفساراتكم في التعليقات ومشاركة الخبر مع زملائكم الطلاب!\n\n{tag} #أخبار_التعليم #شؤون_الطلاب #مواعيد"

    def call_ai_for_comment(self, comment_text: str, original_post: str = "", target_univ: Optional[str] = None) -> Optional[str]:
        """توليد رد أكاديمي ذكي وفوري على تعليقات واستفسارات الطلاب تحت منشورات القناة"""
        clean_comment = self.clean_text_from_sources(comment_text)
        if not clean_comment or len(clean_comment) < 2:
            return None

        univ_str = f"لـ ({target_univ})" if target_univ else "الأكاديمية"
        system_prompt = f"""أنت المستشار الأكاديمي والرد الرسمي لقناة الأخبار الجامعية {univ_str}.
مهمتك الرد المباشر والوافي على استفسارات الطلاب في قسم التعليقات بمنتهى اللباقة والاحترافية الأكاديمية.
قواعد الرد:
1. قدّم إجابة شافية، واضحة ومباشرة مبنية على تفاصيل المنشور الأصلي والأنظمة الجامعية المتبعة.
2. إذا كان السؤال عن موعد أو شروط مذكورة في المنشور، لخصها للطالب بوضوح.
3. إذا كان هناك رابط رسمي للتقديم أو الاستعلام، أرشد الطالب إليه.
4. اكتب بلغة عربية فصيحة، راقية، ومهذبة بدون أي إطالة مصطنعة أو حشو.
5. لا تذكر أنك ذكاء اصطناعي أو بوت، تحدث بصفتك الفريق الأكاديمي الرسمي للقناة."""

        user_content = f"المنشور الأصلي في القناة:\n{original_post[:1500]}\n\nسؤال / تعليق الطالب:\n{clean_comment}\n\nالرد الأكاديمي المباشر للطالب:"
        payload = {
            "model": PRIMARY_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            "temperature": 0.3,
            "max_tokens": 600
        }
        headers = {
            "Authorization": f"Bearer {AI_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "TelegramEducationalBot/3.0"
        }
        endpoint = f"{AI_BASE_URL}/chat/completions"

        for model_name in [PRIMARY_MODEL, FALLBACK_MODEL]:
            try:
                payload["model"] = model_name
                req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers)
                with urllib.request.urlopen(req, context=ssl_ctx, timeout=25) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    if "choices" in data and len(data["choices"]) > 0:
                        ans = data["choices"][0]["message"]["content"].strip()
                        if ans:
                            return ans
            except Exception as e:
                logger.debug(f"call_ai_for_comment ({model_name}): {e}")

        return f"أهلاً بك عزيزي الطالب 🌸\nبخصوص استفسارك، نرجو مراجعة التفاصيل والروابط الموضحة في المنشور أعلاه أو زيارة البوابة الرسمية للجامعة للاطلاع على كافة الشروط والمواعيد المعتمدة."

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
                target_univ_name = task.get("target_univ")
                user_id = task.get("user_id")

                # 1. كشف إعلانات المنافسين واستبدالها (فقط إذا كانت الميزة مفعلة صراحة من المشرف ومع التأكد الصارم)
                custom_ad = db.get_setting("custom_ad", "")
                ad_replacement_enabled = (db.get_setting("ad_replacement_enabled", "0") == "1")
                is_ad = False

                if ad_replacement_enabled and custom_ad and raw_text:
                    is_ad = any(kw in raw_text for kw in AD_KEYWORDS)

                if is_ad:
                    db.increment_setting("ad_replaced_count", 1)
                    for ch in target_channels:
                        res = self.send_photo(ch, photo, custom_ad) if photo else self.send_msg(ch, custom_ad)
                        db.record_channel_publish_result(ch, res.get("ok", False), res.get("description", ""))
                    if user_id:
                        self.send_msg(user_id, f"🎯 **تم رصد إعلان تجاري منافس واستبداله بإعلان خدماتك في ({len(target_channels)}) قنوات!**")
                    post_queue.task_done()
                    continue

                # 2. إعادة الصياغة بالذكاء الاصطناعي مع تخصيص الجامعة وفلترة الاستبعاد
                custom_instructions = db.get_setting("custom_instructions", "")
                rephrased = self.call_ai(raw_text, custom_instructions, target_univ=target_univ_name)

                if not rephrased:
                    logger.info(f"🛡️ [عزل القنوات] تم استبعاد المنشور تلقائياً لعدم ارتباطه بـ {target_univ_name or 'الجامعة'} أو لكونه فارغاً.")
                    post_queue.task_done()
                    continue

                # 3. النشر في القنوات المستهدفة المخصصة
                post_links = self.extract_external_links(rephrased) or self.extract_external_links(raw_text)
                post_kb = None
                if post_links:
                    post_kb = {
                        "inline_keyboard": [
                            [{"text": "🔗 فتح الرابط للتقديم والمتابعة", "url": post_links[0]}]
                        ]
                    }

                success_targets = []
                failed_targets = []
                for ch in target_channels:
                    res = self.send_photo(ch, photo, rephrased, reply_markup=post_kb) if photo else self.send_msg(ch, rephrased, reply_markup=post_kb)
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

    # ----------------- البحث المباشر عبر الإنترنت واستجابة الاستفسارات الأكاديمية -----------------
    def search_web_live(self, query: str) -> List[Dict[str, str]]:
        """يبحث عبر الإنترنت في الأخبار والمواقع الأكاديمية والجامعية في الوقت الفعلي بدقة ومرونة فائقة"""
        clean_q = re.sub(r'^(ابحث عبر الانترنت|ابحث في الانترنت|ابحث عن|ابحث لي عن|ابحث|/search)\s*', '', query, flags=re.IGNORECASE).strip()
        clean_q = re.sub(r'^(اريد ان تبحث|أريد أن تبحث|اريد ان اعرف|أريد أن أعرف|هل تم اليوم|هل تم)\s*', '', clean_q, flags=re.IGNORECASE).strip()
        if not clean_q:
            clean_q = query.strip()

        # استخراج كلمات مفتاحية ذكية لتجنب فشل البحث بالعبارات الطويلة
        words = [w for w in clean_q.split() if w not in {'اريد', 'أريد', 'ان', 'أن', 'تبحث', 'هل', 'تم', 'اليوم', 'لي', 'عبر', 'الإنترنت', 'الانترنت', 'في', 'عن', 'من'}]
        candidate_queries = [
            clean_q,
            ' '.join(words),
            ' '.join([w for w in words if len(w) > 2][:4]),
            ' '.join([w for w in words if w.lower() in ['aum', 'ksu', 'hct', 'puc'] or any(k in w for k in ['جامع', 'إعان', 'مكاف', 'قبول', 'تسجيل'])])
        ]

        results = []
        seen_titles = set()
        seen_candidates = set()

        for cand in candidate_queries:
            cand = cand.strip()
            if not cand or cand in seen_candidates:
                continue
            seen_candidates.add(cand)
            encoded_q = urllib.parse.quote(cand)

            urls = [
                f"https://news.google.com/rss/search?q={encoded_q}&hl=ar&gl=KW&ceid=KW:ar",
                f"https://news.google.com/rss/search?q={encoded_q}&hl=ar&gl=SA&ceid=SA:ar"
            ]
            for url in urls:
                try:
                    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
                    with urllib.request.urlopen(req, context=ssl_ctx, timeout=7) as r:
                        root = ET.fromstring(r.read())
                        items = root.findall('.//item')
                        for it in items[:4]:
                            title = it.findtext("title") or ""
                            link = it.findtext("link") or ""
                            pub = it.findtext("pubDate") or ""
                            desc = it.findtext("description") or ""
                            clean_desc = re.sub(r'<[^>]+>', '', desc).strip()
                            if title and title not in seen_titles:
                                seen_titles.add(title)
                                results.append({
                                    "title": title,
                                    "link": link,
                                    "pub_date": pub,
                                    "snippet": clean_desc[:250]
                                })
                except Exception as e:
                    logger.debug(f"فحص محرك البحث لـ {url}: {e}")

            if len(results) >= 3:
                break

        return results

    def answer_search_or_chat_query(self, chat_id: int, user_query: str):
        """يجيب على أسئلة المشرف واستفسارات الطلاب بدقة مع دمج البحث الحي عبر الإنترنت"""
        self.send_msg(chat_id, "🔍 **جاري البحث الفوري عبر الإنترنت وتحليل البيانات بالذكاء الأكاديمي...**")

        search_results = self.search_web_live(user_query)
        web_context = ""
        if search_results:
            web_context = "\n\n🌐 نتائج البحث الحي المباشر من مصادر الإنترنت والأخبار:\n"
            for i, res in enumerate(search_results, 1):
                web_context += f"{i}. {res['title']} (التاريخ: {res['pub_date']})\n   {res['snippet']}\n   رابط المصدر: {res['link']}\n"

        system_prompt = f"""أنت مستشار وباحث أكاديمي وجامعي فائق الذكاء ومحرر محتوى متمكن.
تتحدث مع المشرف بحرية كاملة ودون أي قيود أو قوالب نمطية مصطنعة.
- إذا كان السؤال عن إعانة ومكافأة طلبة جامعة AUM (الكويت) أو الجامعات الخاصة: وضح أن المكافأة الاجتماعية (200 دينار كويتي شهرياً) تصرف عبر مجلس الجامعات الخاصة (PUC) ويتم إيداعها للبنوك عادة بين 20 إلى 26 من كل شهر ميلادي بعد اعتماد الكشوفات، ويمكن للطالب التأكد عبر تطبيق بنكه أو بوابة الطالب My AUM Portal أو التواصل مع شؤون الطلبة عبر هاتف 22260100.
- إذا كانت هناك روابط خارجية أو بوابات كليات ومعاهد، احتفظ بها واضحة ليتمكن الطلاب من النقر عليها وفتحها مباشرة.
- أسلوبك راقٍ، مباشر، عربي فصيح، بدون أي إيموجي رسومية تالفة، واستخدم النقاط المنظمة [•] أو [*].
{web_context}"""

        reply = self.call_ai(user_query, system_prompt=system_prompt)
        if not reply or len(reply) < 15:
            reply = f"بخصوص استفسارك عن: {user_query}\n\nتعتمد الأنظمة الجامعية الإعلانات الرسمية عبر بوابات الطلبة والتطبيقات المعتمدة."

        # حفظ الرد لتمكين النشر الفوري في القناة إذا رغب المشرف
        self.cached_forwarded_post[chat_id] = {
            "text": reply,
            "photo": None,
            "channel": db.get_target_channels()[0] if db.get_target_channels() else "@jhdhhdcj"
        }

        kb = {
            "inline_keyboard": [
                [{"text": "📢 نشر هذه الصياغة في قناتي (@jhdhhdcj)", "callback_data": "panel_test"}],
                [{"text": "💬 طرح سؤال جديد", "callback_data": "panel_cancel"}]
            ]
        }
        self.send_msg(chat_id, f"💡 **إجابة المساعد الأكاديمي الذكي (مدعومة بالبحث المباشر):**\n━━━━━━━━━━━━━━━━━━━\n\n{reply}", kb)

    # ----------------- مراقبة القنوات والمصادر (تليجرام + تويتر/X + RSS) -----------------
    def check_telegram_channel_scraper(self, src: Dict[str, Any], is_manual: bool = False):
        channel_name = src.get("target", "").replace("@", "").replace("https://t.me/s/", "").replace("https://t.me/", "").strip()
        if not channel_name:
            return

        url = f"https://t.me/s/{channel_name}"
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept-Language": "ar,en-US;q=0.9,en;q=0.8"
            })
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=15) as resp:
                html = resp.read().decode("utf-8", errors="ignore")
                blocks = re.split(r'<div[^>]*class=[\'"][^\'"]*tgme_widget_message_wrap', html)
                if len(blocks) <= 1:
                    logger.warning(f"⚠️ تعذر سحب محتوى القناة {channel_name} عبر الويب (قد تكون القناة خاصة أو مقيدة).")
                    return

                posts_extracted = []
                for b in blocks[1:]:
                    post_id_m = re.search(r'data-post=[\'"]([^\'"]+)[\'"]', b)
                    if not post_id_m:
                        continue
                    pid = post_id_m.group(1)
                    raw_num_match = re.search(r'/(\d+)$', pid)
                    num_id = int(raw_num_match.group(1)) if raw_num_match else 0

                    photo_url = None
                    # استخراج روابط خلفيات الصور المباشرة بصيغها المختلفة
                    bg_m = re.search(r'background-image:\s*url\([\'"]?([^\'")\s]+)[\'"]?\)', b)
                    if bg_m:
                        photo_url = bg_m.group(1).strip()
                    if not photo_url:
                        img_m = re.search(r'<img[^>]+src=[\'"]([^\'"]+)[\'"]', b)
                        if img_m:
                            photo_url = img_m.group(1).strip()

                    if photo_url:
                        if photo_url.startswith("//"):
                            photo_url = "https:" + photo_url
                        if "emoji" in photo_url or "telegram.org/img" in photo_url or "website_icon" in photo_url or "favicon" in photo_url:
                            photo_url = None

                    text_m = re.search(r'class=[\'"][^\'"]*tgme_widget_message_text[^\'"]*[\'"][^>]*>(.*?)</div>', b, re.DOTALL)
                    text_content = ""
                    if text_m:
                        raw_h = text_m.group(1)
                        clean_h = re.sub(r'<br\s*/?>', '\n', raw_h)
                        text_content = re.sub(r'<[^>]+>', '', clean_h).strip()

                    if text_content or photo_url:
                        posts_extracted.append({"id": pid, "num_id": num_id, "photo": photo_url, "text": text_content})

                if not posts_extracted:
                    return

                # ترتيب المنشورات تصاعدياً
                posts_extracted.sort(key=lambda x: x["num_id"])

                last_known = str(src.get("last_post_id") or "")
                last_known_num = 0
                if last_known:
                    num_match = re.search(r'(\d+)$', last_known)
                    if num_match:
                        last_known_num = int(num_match.group(1))

                # إذا كانت أول مرة نسجل آخر منشور، وإذا كان فحصاً يدوياً ننشر أحدث منشور فوراً ليرى المشرف النتيجة
                if not last_known or last_known_num == 0:
                    latest = posts_extracted[-1]
                    db.update_source_last_id(src.get("target"), latest["id"])
                    logger.info(f"📌 تمت تهيئة المصدر {src.get('target')} عند المنشور #{latest['id']}")
                    if is_manual and (latest.get("text") or latest.get("photo")):
                        p_hash = hashlib.md5((latest.get("text", "")[:80]).encode("utf-8")).hexdigest()
                        if not db.is_post_seen(latest["id"], p_hash):
                            matched_univ = db.find_university_for_post(src.get("target"), latest.get("text", ""))
                            if not matched_univ:
                                def_targets = db.get_target_channels()
                                matched_univ = {"name": "الأخبار الأكاديمية", "target_channel": def_targets[0] if def_targets else "@jhdhhdcj"}
                            db.mark_post_seen(latest["id"], p_hash, src.get("target"))
                            logger.info(f"⚡️ [فحص يدوي] جاري نشر أحدث منشور متاح من {src.get('target')} للجامعة {matched_univ['name']} مع الصورة: {'نعم' if latest.get('photo') else 'لا'}")
                            post_queue.put({
                                "type": "crawled_post",
                                "text": latest.get("text", ""),
                                "photo": latest.get("photo"),
                                "targets": [matched_univ["target_channel"]],
                                "target_univ": matched_univ["name"],
                                "user_id": ADMIN_ID
                            })
                    return

                # حلقة فحص ونشر كافة المنشورات الجديدة المتراكمة
                new_posts = [p for p in posts_extracted if p["num_id"] > last_known_num]
                for p in new_posts:
                    p_text = p.get("text", "")
                    p_photo = p.get("photo")
                    p_id = p["id"]

                    matched_univ = db.find_university_for_post(src.get("target"), p_text)
                    if not matched_univ:
                        def_targets = db.get_target_channels()
                        matched_univ = {"name": "الأخبار الأكاديمية", "target_channel": def_targets[0] if def_targets else "@jhdhhdcj"}

                    p_hash = hashlib.md5(p_text[:80].encode("utf-8")).hexdigest()
                    if db.is_post_seen(p_id, p_hash):
                        continue

                    db.mark_post_seen(p_id, p_hash, src.get("target"))
                    db.update_source_last_id(src.get("target"), p_id)

                    logger.info(f"⚡️ منشور جديد تم التقاطه من {src.get('target')}: {p_id} موجه إلى {matched_univ['target_channel']} ({matched_univ['name']}) مع صورة: {'نعم' if p_photo else 'لا'}")
                    post_queue.put({
                        "type": "crawled_post",
                        "text": p_text,
                        "photo": p_photo,
                        "targets": [matched_univ["target_channel"]],
                        "target_univ": matched_univ["name"],
                        "user_id": ADMIN_ID
                    })

        except Exception as e:
            logger.debug(f"فحص القناة عبر Scraper {channel_name}: {e}")

    def extract_image_from_xml_item(self, it: ET.Element, desc: str = "") -> Optional[str]:
        """استخراج الصورة الحقيقية من عناصر XML وRSS بدقة"""
        try:
            # 1. فحص وسوم enclosure
            enclosure = it.find("enclosure")
            if enclosure is not None and enclosure.get("url"):
                url = enclosure.get("url", "").strip()
                enc_type = (enclosure.get("type") or "").lower()
                if "image" in enc_type or any(url.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp", ".avif"]):
                    return url

            # 2. فحص وسوم media:content و media:thumbnail
            for tag in [".//{http://search.yahoo.com/mrss/}content", ".//content", ".//{http://search.yahoo.com/mrss/}thumbnail", ".//thumbnail"]:
                m = it.find(tag)
                if m is not None and m.get("url"):
                    u = m.get("url", "").strip()
                    if u and "emoji" not in u and "icon" not in u:
                        return u

            # 3. فحص وسوم <img> داخل الوصف (description)
            if desc:
                img_m = re.search(r'<img[^>]+src=[\'"]([^\'"]+)[\'"]', desc, re.IGNORECASE)
                if img_m:
                    iu = img_m.group(1).strip()
                    if iu and "emoji" not in iu and "icon" not in iu and "transparent" not in iu:
                        if iu.startswith("//"):
                            return "https:" + iu
                        return iu
        except Exception:
            pass
        return None

    def check_twitter_feed(self, src: Dict[str, Any], is_manual: bool = False):
        """يسحب التغريدات والأخبار من حسابات تويتر/X والمصادر التابعة مع استخراج الصور الحقيقية بدقة"""
        raw_target = src.get("target", "").replace("https://x.com/", "").replace("https://twitter.com/", "").strip()
        if not raw_target:
            return
        handle = raw_target.lstrip("@").split("/")[0].strip()

        matched_univ = db.find_university_for_post(handle, "") or db.find_university_for_post(f"@{handle}", "")
        univ_name = matched_univ["name"] if matched_univ else handle
        target_ch = matched_univ["target_channel"] if matched_univ else (db.get_target_channels()[0] if db.get_target_channels() else "@jhdhhdcj")

        # الاستراتيجية 1: فحص وجود قناة تيليجرام مطابقة للمعرف (حيث تنشر معظم الجامعات تغريداتها مباشرة مع الصور)
        try:
            tg_url = f"https://t.me/s/{handle}"
            req = urllib.request.Request(tg_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=8) as r:
                html = r.read().decode("utf-8", errors="ignore")
                blocks = re.split(r'<div[^>]*class=[\'"][^\'"]*tgme_widget_message_wrap', html)
                if len(blocks) > 1:
                    last_block = blocks[-1]
                    post_id_m = re.search(r'data-post=[\'"]([^\'"]+)[\'"]', last_block)
                    if post_id_m:
                        pid = post_id_m.group(1)
                        last_known = str(src.get("last_post_id") or "")
                        if pid != last_known:
                            text_m = re.search(r'class=[\'"][^\'"]*tgme_widget_message_text[^\'"]*[\'"][^>]*>(.*?)</div>', last_block, re.DOTALL)
                            clean_text = ""
                            if text_m:
                                clean_text = re.sub(r'<[^>]+>', '', re.sub(r'<br\s*/?>', '\n', text_m.group(1))).strip()

                            photo_url = None
                            bg_m = re.search(r'background-image:\s*url\([\'"]?([^\'")\s]+)[\'"]?\)', last_block)
                            if bg_m:
                                photo_url = bg_m.group(1).strip()
                            if not photo_url:
                                img_m = re.search(r'<img[^>]+src=[\'"]([^\'"]+)[\'"]', last_block)
                                if img_m:
                                    photo_url = img_m.group(1).strip()

                            if photo_url and photo_url.startswith("//"):
                                photo_url = "https:" + photo_url

                            p_hash = hashlib.md5((clean_text[:80]).encode("utf-8")).hexdigest()
                            if (clean_text or photo_url) and not db.is_post_seen(pid, p_hash):
                                db.update_source_last_id(src.get("target"), pid)
                                db.mark_post_seen(pid, p_hash, src.get("target"))
                                logger.info(f"⚡️ [Twitter/X Mirror] التقاط منشور وتغريدات من @{handle} موجه لـ {univ_name}")
                                post_queue.put({
                                    "type": "twitter_post",
                                    "text": clean_text,
                                    "photo": photo_url,
                                    "targets": [target_ch],
                                    "target_univ": univ_name,
                                    "user_id": ADMIN_ID
                                })
                                return
        except Exception:
            pass

        # الاستراتيجية 2: استعلام الأخبار الرسمية وإعلانات الحساب عبر محرك الأخبار الذكي
        try:
            q = urllib.parse.quote(f'"{handle}" OR "{univ_name}" ("تويتر" OR "أعلنت" OR "مواعيد" OR "قبول" OR "تسجيل" OR "حساب")')
            url = f"https://news.google.com/rss/search?q={q}&hl=ar&gl=SA&ceid=SA:ar"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=12) as resp:
                root = ET.fromstring(resp.read())
                items = root.findall(".//item")
                if not items:
                    return

                for it in items[:6]:
                    t = it.findtext("title") or ""
                    l = it.findtext("link") or ""
                    d = it.findtext("description") or ""

                    clean_title = re.sub(r'\s*-\s*[^-]+$', '', t).strip()
                    clean_desc = re.sub(r'<[^>]+>', '', d).strip()
                    full_text = f"{clean_title}\n{clean_desc}".strip()
                    photo_url = self.extract_image_from_xml_item(it, d)

                    # منع التكرار الصارم
                    norm_t = re.sub(r'[^\w\s]', '', clean_title)
                    norm_t = re.sub(r'\s+', ' ', norm_t).strip().lower()
                    story_hash = f"tw_{hashlib.sha256(norm_t.encode('utf-8')).hexdigest()[:24]}"

                    if db.is_post_seen(story_hash, story_hash):
                        continue

                    db.mark_post_seen(story_hash, story_hash, src.get("target"))
                    db.update_source_last_id(src.get("target"), story_hash)

                    logger.info(f"⚡️ [Twitter/X News] خبر جديد لـ @{handle} ({univ_name}) موجه إلى {target_ch} (صورة: {'نعم' if photo_url else 'لا'})")
                    post_queue.put({
                        "type": "twitter_post",
                        "text": f"{full_text}\n\n{l}",
                        "photo": photo_url,
                        "targets": [target_ch],
                        "target_univ": univ_name,
                        "user_id": ADMIN_ID
                    })

                    if not is_manual:
                        break
        except Exception as e:
            logger.debug(f"خطأ في سحب تويتر/X للحساب {handle}: {e}")

    def check_rss_feed(self, src: Dict[str, Any], is_manual: bool = False):
        """يسحب الأخبار من روابط RSS مع استخراج الصور المرفقة الحقيقية"""
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
                    photo_url = self.extract_image_from_xml_item(it, d)
                    pid = l or t
                    if pid == last_known:
                        break
                    new_items.append((pid, t, d, photo_url))

                if new_items:
                    db.update_source_last_id(src.get("target"), new_items[0][0])
                    if not last_known and is_manual:
                        pid, t, d, photo_url = new_items[0]
                        clean_d = re.sub(r'<[^>]+>', '', d).strip()
                        full_txt = f"{t}\n{clean_d}"
                        matched_univ = db.find_university_for_post(url, full_txt)
                        if matched_univ:
                            p_hash = hashlib.md5(full_txt[:80].encode("utf-8")).hexdigest()
                            if not db.is_post_seen(pid, p_hash):
                                db.mark_post_seen(pid, p_hash, src.get("target"))
                                post_queue.put({
                                    "type": "rss_post",
                                    "text": full_txt,
                                    "photo": photo_url,
                                    "targets": [matched_univ["target_channel"]],
                                    "target_univ": matched_univ["name"],
                                    "user_id": ADMIN_ID
                                })
                        return

                    for pid, t, d, photo_url in reversed(new_items):
                        clean_d = re.sub(r'<[^>]+>', '', d).strip()
                        full_txt = f"{t}\n{clean_d}"
                        matched_univ = db.find_university_for_post(url, full_txt)
                        if not matched_univ:
                            continue
                        p_hash = hashlib.md5(full_txt[:80].encode("utf-8")).hexdigest()
                        if not db.is_post_seen(pid, p_hash):
                            db.mark_post_seen(pid, p_hash, src.get("target"))
                            post_queue.put({
                                "type": "rss_post",
                                "text": full_txt,
                                "photo": photo_url,
                                "targets": [matched_univ["target_channel"]],
                                "target_univ": matched_univ["name"],
                                "user_id": ADMIN_ID
                            })
        except Exception as e:
            logger.debug(f"فحص RSS {url}: {e}")

    def check_google_news_for_universities(self, is_manual: bool = False):
        """يبحث في أخبار جوجل الرسمية لكل جامعة على حدة وينشرها في قناة تلك الجامعة حصراً"""
        univs = db.get_university_projects()
        logger.info(f"🌐 [Google News] فحص أخبار جوجل الأكاديمية لـ ({len(univs)}) جامعة...")
        for univ in univs:
            if not univ.get("enabled") or not univ.get("google_news_enabled"):
                continue

            q = univ.get("google_news_query") or univ.get("name")
            target_ch = univ.get("target_channel")
            if not q or not target_ch:
                continue

            try:
                encoded_q = urllib.parse.quote(f'"{q}"')
                url = f"https://news.google.com/rss/search?q={encoded_q}&hl=ar&gl=SA&ceid=SA:ar"
                req = urllib.request.Request(url, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                })
                with urllib.request.urlopen(req, context=ssl_ctx, timeout=12) as resp:
                    root = ET.fromstring(resp.read())
                    items = root.findall(".//item")
                    if not items:
                        continue

                    # فحص أحدث 5 أخبار
                    for it in items[:5]:
                        title = it.findtext("title") or ""
                        link = it.findtext("link") or ""
                        desc = it.findtext("description") or ""

                        # تنظيف العنوان والمصدر من تذييلات جوجل
                        clean_title = re.sub(r'\s*-\s*[^-]+$', '', title).strip()
                        clean_desc = re.sub(r'<[^>]+>', '', desc).strip()
                        full_text = f"{clean_title}\n{clean_desc}".strip()
                        photo_url = self.extract_image_from_xml_item(it, desc)

                        # التحقق من الارتباط بالجامعة
                        is_relevant = (
                            univ["name"].lower() in full_text.lower() or
                            any(kw.lower() in full_text.lower() for kw in univ.get("keywords", []))
                        )
                        if not is_relevant:
                            continue

                        # منع التكرار الصارم عبر تجزئة الكلمات الجوهرية للعنوان
                        norm_clean = re.sub(r'[^\w\s]', '', clean_title)
                        norm_clean = re.sub(r'\s+', ' ', norm_clean).strip().lower()
                        story_hash = f"gnews_{hashlib.sha256(norm_clean.encode('utf-8')).hexdigest()[:24]}"

                        if db.is_post_seen(story_hash, story_hash):
                            continue

                        db.mark_post_seen(story_hash, story_hash, f"gnews_{univ['id']}")
                        logger.info(f"⚡️ [Google News] خبر جديد لـ {univ['name']} موجه إلى {target_ch} (صورة: {'نعم' if photo_url else 'لا'})")

                        post_queue.put({
                            "type": "google_news_post",
                            "text": f"{full_text}\n\n{link}",
                            "photo": photo_url,
                            "targets": [target_ch],
                            "target_univ": univ["name"],
                            "user_id": ADMIN_ID
                        })

                        if not is_manual:
                            # في الفحص الدوري نكتفي بخبر واحد في الدورة لكل جامعة لعدم إغراق القناة
                            break

            except Exception as e:
                logger.debug(f"خطأ في سحب أخبار جوجل لـ {univ.get('name')}: {e}")

    def monitor_sources_loop(self):
        logger.info("📡 تشغيل دورة مراقبة المصادر التلقائية (تيليجرام + تويتر + RSS + أخبار جوجل)...")
        loop_counter = 0
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
                    elif s_type in ["twitter", "x"]:
                        self.check_twitter_feed(s)

                loop_counter += 1
                # كل 5 دقائق (5 دورات) نفحص أخبار جوجل الأكاديمية
                if loop_counter % 5 == 0:
                    self.check_google_news_for_universities(is_manual=False)

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
                            matched_univ = db.find_university_for_post(chat_username, text)
                            if matched_univ:
                                post_queue.put({
                                    "type": "mtproto_post",
                                    "text": text,
                                    "photo": photo_path,
                                    "targets": [matched_univ["target_channel"]],
                                    "target_univ": matched_univ["name"],
                                    "user_id": ADMIN_ID
                                })
                            else:
                                logger.info(f"🛡️ [عزل MTProto] منشور من {chat_username} لا يطابق أي جامعة مستهدفة وتم استبعاده.")
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

    def reply_to_channel_comment(self, chat_id: int, message_id: int, student_question: str, orig_post_text: str):
        """يرد على استفسارات الطلاب في تعليقات القناة بذكاء ولغة أكاديمية واضحة ومباشرة"""
        try:
            ai_reply = self.call_ai_for_comment(student_question, orig_post_text)
            if ai_reply:
                self.send_msg(chat_id, ai_reply, reply_to_message_id=message_id)
        except Exception as e:
            logger.debug(f"خطأ في الرد على تعليق القناة: {e}")

    # ----------------- معالجة رسائل وأوامر المستخدمين -----------------
    def handle_message(self, msg: Dict[str, Any]):
        chat_id = msg["chat"]["id"]
        from_user = msg.get("from", {})
        text = msg.get("text", "") or msg.get("caption", "")

        # فحص التعليقات والاستفسارات في القناة أو مجموعة المناقشة المرتبطة بها (Channel Comments)
        chat_type = msg.get("chat", {}).get("type", "private")
        reply_to = msg.get("reply_to_message")
        if reply_to and chat_type in ["group", "supergroup"]:
            # إذا كانت الرسالة من طالب/مستخدم وليست من بوت أو القناة ذاتها
            if not from_user.get("is_bot") and not msg.get("sender_chat"):
                clean_comment = text.strip()
                if clean_comment and len(clean_comment) >= 2:
                    orig_post_text = reply_to.get("text", "") or reply_to.get("caption", "")
                    threading.Thread(
                        target=self.reply_to_channel_comment,
                        args=(chat_id, msg["message_id"], clean_comment, orig_post_text),
                        daemon=True
                    ).start()
                    return

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
            state = self.user_waiting_state.get(chat_id)

            if clean_text in ["/cancel", "إلغاء", "رجوع"]:
                self.user_waiting_state.pop(chat_id, None)
                self.univ_wizard_data.pop(chat_id, None)
                self.send_msg(chat_id, "تم إلغاء العملية والعودة للقائمة الرئيسية ✅", self.get_main_reply_keyboard(user_data.get("role", "user")))
                return

            if state == "waiting_for_new_source":
                self.user_waiting_state.pop(chat_id, None)
                self.process_add_source(chat_id, clean_text)
                return
            elif state == "waiting_for_target_channel":
                self.user_waiting_state.pop(chat_id, None)
                self.process_add_target(chat_id, clean_text)
                return
            elif state == "waiting_for_instant_post":
                self.user_waiting_state.pop(chat_id, None)
                univs = db.get_university_projects()
                first_target = [univs[0]["target_channel"]] if univs else db.get_target_channels()
                first_name = univs[0]["name"] if univs else None
                post_queue.put({
                    "type": "direct_post",
                    "text": clean_text,
                    "photo": photo_id,
                    "targets": first_target,
                    "target_univ": first_name,
                    "user_id": chat_id
                })
                self.send_msg(chat_id, "⚡ **تم استلام المنشور!** جاري الصياغة بالذكاء والنشر في قنواتك...")
                return
            elif state == "waiting_univ_target":
                self.process_univ_step1_target(chat_id, clean_text)
                return
            elif state == "waiting_univ_name":
                self.process_univ_step2_name(chat_id, clean_text)
                return
            elif state == "waiting_univ_tg":
                self.process_univ_step3_tg(chat_id, clean_text)
                return
            elif state == "waiting_univ_tw":
                self.process_univ_step4_tw(chat_id, clean_text)
                return
            elif state == "waiting_univ_gnews":
                self.process_univ_step5_gnews(chat_id, clean_text)
                return
            elif state.startswith("waiting_univ_post_"):
                target_uid = state.replace("waiting_univ_post_", "")
                self.user_waiting_state.pop(chat_id, None)
                target_univ = db.get_university_by_id(target_uid)
                target_ch = [target_univ["target_channel"]] if target_univ else db.get_target_channels()
                target_name = target_univ["name"] if target_univ else None
                post_queue.put({
                    "type": "direct_post",
                    "text": clean_text,
                    "photo": photo_id,
                    "targets": target_ch,
                    "target_univ": target_name,
                    "user_id": chat_id
                })
                self.send_msg(chat_id, f"⚡ **تم استلام المنشور المخصص لـ {target_name or 'الجامعة'}!** جاري الصياغة بالذكاء والنشر حصراً في `{target_ch[0]}`...")
                return
            elif state == "waiting_for_custom_ad":
                self.user_waiting_state.pop(chat_id, None)
                db.set_setting("custom_ad", clean_text)
                self.send_msg(chat_id, "✅ **تم تحديث وحفظ نص إعلانك البديل بنجاح!**")
                self.show_ad_panel(chat_id)
                return

        # ----------------- الأوامر المباشرة -----------------
        if clean_text in ["🎯 إعلان خدماتي البديل", "/ad", "الإعلان", "/advertisement"]:
            self.show_ad_panel(chat_id)
            return

        if clean_text in ["/start", "/help", "🎛 لوحة التحكم الرئيسية", "🔙 إلغاء والعودة للرئيسية"]:
            self.show_welcome_panel(chat_id, user_data)
            return

        if clean_text in ["🏛️ إدارة الجامعات وقنوات النشر", "/universities", "/univ", "الجامعات"]:
            self.show_universities_panel(chat_id)
            return

        if clean_text in ["➕ إضافة جامعة وقناة نشر", "/add_university", "/new_univ"]:
            self.start_add_university_wizard(chat_id)
            return

        if clean_text in ["🌐 بحث أخبار جوجل للجامعة", "/google_news", "أخبار جوجل"]:
            self.trigger_google_news_search(chat_id)
            return

        if clean_text.startswith("/google_news "):
            custom_q = clean_text.replace("/google_news ", "").strip()
            self.trigger_google_news_search(chat_id, custom_q)
            return

        if clean_text.startswith("/del_university"):
            uid = clean_text.replace("/del_university", "").strip()
            if uid:
                db.delete_university_project(uid)
                self.send_msg(chat_id, f"🗑️ تم حذف مشروع الجامعة `{uid}` بنجاح!")
            self.show_universities_panel(chat_id)
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

        if clean_text in ["🔄 فحص وسحب المصادر الآن", "🔄 فحص وسحب أخبار الجامعات", "/crawl_sources", "/crawl"]:
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
                target_uid = safe_int(clean_text.replace("/ban ", "").strip(), 0)
                if target_uid > 0:
                    db.ban_user(target_uid, True)
                    self.send_msg(chat_id, f"✅ تم حظر المستخدم `{target_uid}` بنجاح.")
                else:
                    self.send_msg(chat_id, "⚠️ معرف المستخدم غير صحيح. استخدم: /ban <id>")
                return

            if clean_text.startswith("/unban "):
                target_uid = safe_int(clean_text.replace("/unban ", "").strip(), 0)
                if target_uid > 0:
                    db.ban_user(target_uid, False)
                    self.send_msg(chat_id, f"✅ تم إلغاء حظر المستخدم `{target_uid}` بنجاح.")
                else:
                    self.send_msg(chat_id, "⚠️ معرف المستخدم غير صحيح. استخدم: /unban <id>")
                return

            if clean_text.startswith("/set_role "):
                parts = clean_text.split()
                if len(parts) >= 3:
                    u_id = safe_int(parts[1], 0)
                    r = parts[2].lower()
                    if u_id > 0:
                        db.set_user_role(u_id, r)
                        self.send_msg(chat_id, f"✅ تم تعيين رتبة `{r}` للمستخدم `{u_id}`.")
                    else:
                        self.send_msg(chat_id, "⚠️ معرف المستخدم غير صحيح. استخدم: /set_role <id> <role>")
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

        # فحص إذا كانت الرسالة سؤالاً أو استفساراً أكاديمياً أو طلباً للبحث المباشر عبر الإنترنت
        is_search_or_question = (
            clean_text.startswith("/search") or
            clean_text.startswith("/chat") or
            clean_text.startswith("ابحث") or
            "ابحث عبر الانترنت" in clean_text or
            "ابحث في الانترنت" in clean_text or
            "ابحث لي" in clean_text or
            "هل تم" in clean_text or
            "ما هي" in clean_text or
            "متى موعد" in clean_text or
            clean_text.endswith("؟") or
            clean_text.endswith("?")
        )

        if is_search_or_question and not photo_id:
            self.answer_search_or_chat_query(chat_id, clean_text)
            return

        # إذا كانت الرسالة نصاً خبراً كبيراً أو صورة دون أمر للنشر في القناة
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

        elif data == "panel_universities":
            self.show_universities_panel(chat_id)

        elif data == "panel_add_university":
            self.start_add_university_wizard(chat_id)

        elif data == "panel_crawl":
            self.trigger_manual_crawl(chat_id)

        elif data == "panel_gnews":
            self.trigger_google_news_search(chat_id)

        elif data in ["panel_ad", "panel_advertisement"]:
            self.show_ad_panel(chat_id)

        elif data == "toggle_ad_replacement":
            cur = db.get_setting("ad_replacement_enabled", "0")
            new_val = "0" if cur == "1" else "1"
            db.set_setting("ad_replacement_enabled", new_val)
            self.show_ad_panel(chat_id)

        elif data == "panel_edit_ad":
            self.user_waiting_state[chat_id] = "waiting_for_custom_ad"
            self.send_msg(chat_id, "📝 أرسل الآن نص إعلانك البديل الجديد ليتم حفظه واستخدامه:")

        elif data == "panel_start":
            self.show_welcome_panel(chat_id, user_data)

        elif data.startswith("univ_view_"):
            univ_id = data.replace("univ_view_", "")
            self.show_single_university_dashboard(chat_id, univ_id)

        elif data.startswith("univ_toggle_"):
            univ_id = data.replace("univ_toggle_", "")
            new_st = db.toggle_university_status(univ_id)
            if new_st is not None:
                st_txt = "🟢 تم تفعيل النشر التلقائي للجامعة بنجاح!" if new_st else "⏸️ تم إيقاف النشر التلقائي لهذه الجامعة مؤقتاً."
                self.send_msg(chat_id, st_txt)
            self.show_single_university_dashboard(chat_id, univ_id)

        elif data.startswith("univ_crawl_") or data.startswith("crawl_univ_"):
            univ_id = data.replace("univ_crawl_", "").replace("crawl_univ_", "")
            self.crawl_single_university(chat_id, univ_id)

        elif data.startswith("univ_gnews_"):
            univ_id = data.replace("univ_gnews_", "")
            target_univ = db.get_university_by_id(univ_id)
            if target_univ:
                self.send_msg(chat_id, f"🌐 جاري فحص أخبار جوجل الحصرية لـ **{target_univ['name']}**...")
                threading.Thread(target=self.check_google_news_single_university, args=(target_univ, True), daemon=True).start()

        elif data.startswith("univ_post_"):
            univ_id = data.replace("univ_post_", "")
            target_univ = db.get_university_by_id(univ_id)
            if target_univ:
                self.user_waiting_state[chat_id] = f"waiting_univ_post_{univ_id}"
                self.send_msg(chat_id, f"📝 **أرسل الآن نص المنشور أو الصورة للنشر حصراً في قناة {target_univ['name']} (`{target_univ['target_channel']}`):**\n\n*(سيمر عبر الصياغة بالذكاء ولن يتداخل مع أي قناة أخرى)*")

        elif data.startswith("univ_del_") or data.startswith("del_univ_"):
            univ_id = data.replace("univ_del_", "").replace("del_univ_", "")
            target_univ = db.get_university_by_id(univ_id)
            db.delete_university_project(univ_id)
            self.send_msg(chat_id, f"🗑️ تم حذف مشروع الجامعة `{target_univ['name'] if target_univ else univ_id}` بنجاح!")
            self.show_universities_panel(chat_id)

        elif data == "panel_cancel":
            self.cached_forwarded_post.pop(chat_id, None)
            self.user_waiting_state.pop(chat_id, None)
            self.univ_wizard_data.pop(chat_id, None)
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
        self.send_msg(chat_id, "⌨️ **لوحة المفاتيح الدائمة نشطة على شاشتك للتحكم السريع:**", self.get_main_reply_keyboard(role))
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

    def show_ad_panel(self, chat_id: int):
        custom_ad = db.get_setting("custom_ad", "")
        ad_enabled = (db.get_setting("ad_replacement_enabled", "0") == "1")
        status_text = "🟢 مفعل (يستبدل الإعلانات التجارية الصريحة فقط)" if ad_enabled else "🔴 معطل (موصى به لضمان نشر أخبار الجامعات الأصلية كاملة مع صورها)"

        msg = f"""🎯 **إدارة إعلان خدمات الطلاب وحماية المنشورات الأصلية:**
━━━━━━━━━━━━━━━━━━━━━━━━
• **الحالة**: {status_text}

🛡️ **سياسة الحماية والأمان:**
1. عند التعطيل (الوضع الافتراضي والموصى به): ينشر البوت منشورات الجامعات ومصادر الأخبار كاملة مع صورها الحقيقية دون أي استبدال.
2. عند التفعيل: يستبدل البوت حصراً إعلانات حل الواجبات التجارية بمقابل، ولا يمس منشورات شؤون الطلاب أو مشاريع التخرج الرسمية.

📝 **نص إعلانك الترويجي البديل:**
───────────────────
{custom_ad or '(لم يتم تعيين إعلان بعد)'}
───────────────────"""

        kb = {
            "inline_keyboard": [
                [{"text": "🔴 إيقاف الاستبدال (نشر الأخبار الأصلية)" if ad_enabled else "🟢 تفعيل استبدال الإعلانات التجارية", "callback_data": "toggle_ad_replacement"}],
                [{"text": "✏️ تعديل نص الإعلان", "callback_data": "panel_edit_ad"}],
                [{"text": "🔙 اللوحة الرئيسية", "callback_data": "panel_start"}]
            ]
        }
        self.send_msg(chat_id, msg, kb)

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
        src_type = "telegram"
        if "twitter.com" in target or "x.com" in target or target.startswith("twitter:") or target.startswith("x:"):
            src_type = "twitter"
            target = target.replace("twitter:", "").replace("x:", "").strip()
        elif target.startswith("http") and not ("t.me" in target):
            src_type = "rss"

        db.add_source(src_type, target, target, added_by=chat_id)
        self.send_msg(chat_id, f"✅ تمت إضافة المصدر `{target}` بنوع [{src_type}] بنجاح!\n⚡ جاري فحص وسحب أحدث المنشورات منه فوراً...")
        new_src = {"type": src_type, "target": target, "last_post_id": ""}
        if src_type == "telegram":
            threading.Thread(target=self.check_telegram_channel_scraper, args=(new_src, True), daemon=True).start()
        elif src_type in ["twitter", "x"]:
            threading.Thread(target=self.check_twitter_feed, args=(new_src, True), daemon=True).start()
        elif src_type == "rss":
            threading.Thread(target=self.check_rss_feed, args=(new_src, True), daemon=True).start()

    def process_add_target(self, chat_id: int, input_text: str):
        target = input_text.strip()
        db.add_target_channel(target, target, added_by=chat_id)
        self.send_msg(chat_id, f"✅ تم اعتماد قناة النشر `{target}` بنجاح!")

    def trigger_manual_crawl(self, chat_id: int):
        self.send_msg(chat_id, "🔄 جاري فحص وسحب أحدث المنشورات من كافة المصادر المعتمدة (تيليجرام + تويتر/X + أخبار جوجل الرسمية)...")
        sources = db.get_sources()
        for s in sources:
            s_type = s.get("type")
            if s_type == "telegram":
                threading.Thread(target=self.check_telegram_channel_scraper, args=(s, True), daemon=True).start()
            elif s_type == "rss":
                threading.Thread(target=self.check_rss_feed, args=(s, True), daemon=True).start()
            elif s_type in ["twitter", "x"]:
                threading.Thread(target=self.check_twitter_feed, args=(s, True), daemon=True).start()

        # فحص أخبار جوجل أيضاً لكل الجامعات
        threading.Thread(target=self.check_google_news_for_universities, args=(True,), daemon=True).start()

    def start_add_university_wizard(self, chat_id: int):
        self.user_waiting_state[chat_id] = "waiting_univ_target"
        self.univ_wizard_data[chat_id] = {}
        text = """🏛️ **معالج ربط وإعداد جامعة وقناة نشر جديدة (الخطوة 1 من 5):**
━━━━━━━━━━━━━━━━━━━
📢 **الخطوة الأولى: تحديد قناة النشر الهدف**
أرسل الآن **معرّف أو رابط قناة النشر** التي ترغب بنشر أخبار الجامعة إليها:
📌 **مثال**: `@jhdhhdcj` أو `@MyUnivChannel` أو قم بتوجيه رسالة من القناة هنا.

💡 *(تأكد من إضافة البوت مشرفاً Admin في القناة مع صلاحية نشر الرسائل)*
*(أرسل /cancel في أي وقت للإلغاء)*"""
        self.send_msg(chat_id, text)

    def process_univ_step1_target(self, chat_id: int, input_text: str):
        target_ch = input_text.strip()
        if not target_ch.startswith("@") and not target_ch.startswith("-100"):
            target_ch = "@" + target_ch

        if chat_id not in self.univ_wizard_data:
            self.univ_wizard_data[chat_id] = {}
        self.univ_wizard_data[chat_id]["target_channel"] = target_ch
        self.user_waiting_state[chat_id] = "waiting_univ_name"

        prompt = f"""✅ **تم اعتماد قناة النشر الهدف**: `{target_ch}`
━━━━━━━━━━━━━━━━━━━
🎓 **الخطوة 2 من 5: تحديد اسم الجامعة / القسم بالتفصيل**:

أرسل الاسم الرسمي والواضح للجامعة أو الكلية لتوجيه سياق الذكاء الاصطناعي بدقة تامة:
📌 **أمثلة**:
• `جامعة الشرق الأوسط الأمريكية AUM - الكويت`
• `جامعة الملك سعود - كلية الهندسة`
• `كليات التقنية العليا HCT`

💡 *(هذا الاسم هو المعيار الأساسي لعزل المنشورات وتوجيه صياغة الذكاء الاصطناعي)*"""
        self.send_msg(chat_id, prompt)

    def process_univ_step2_name(self, chat_id: int, input_text: str):
        name = input_text.strip()
        if len(name) < 3:
            self.send_msg(chat_id, "⚠️ اسم الجامعة قصير جداً! يرجى إرسال اسم الجامعة بوضوح مثل: `جامعة الشرق الأوسط الأمريكية AUM`")
            return

        if chat_id not in self.univ_wizard_data:
            self.univ_wizard_data[chat_id] = {}
        self.univ_wizard_data[chat_id]["name"] = name
        self.user_waiting_state[chat_id] = "waiting_univ_tg"

        prompt = f"""✅ **تم حفظ اسم الجامعة**: `{name}`
━━━━━━━━━━━━━━━━━━━
📡 **الخطوة 3 من 5: تحديد قنوات التليجرام المصدرة**:

أرسل معرفات قنوات التليجرام التي تريد سحب الأخبار منها **حصراً لهذه الجامعة** (مفصولة بمسافة):
📌 **مثال**: `@aum_news @aum_union`

💡 *إذا كنت ترغب بالاعتماد فقط على أخبار جوجل وتويتر، أرسل كلمة*: `تخطي`"""
        self.send_msg(chat_id, prompt)

    def process_univ_step3_tg(self, chat_id: int, input_text: str):
        tg_sources = []
        if input_text.strip().lower() not in ["تخطي", "skip", "-", "لا"]:
            parts = re.split(r'[\s,]+', input_text.strip())
            for p in parts:
                p = p.strip()
                if p:
                    if not p.startswith("@") and not p.startswith("https://"):
                        p = "@" + p
                    tg_sources.append(p)

        if chat_id not in self.univ_wizard_data:
            self.univ_wizard_data[chat_id] = {}
        self.univ_wizard_data[chat_id]["telegram_sources"] = tg_sources
        self.user_waiting_state[chat_id] = "waiting_univ_tw"

        tg_desc = "، ".join(tg_sources) if tg_sources else "تم التخطي"
        prompt = f"""✅ **تم ربط قنوات تليجرام ({len(tg_sources)})**: `{tg_desc}`
━━━━━━━━━━━━━━━━━━━
🐦 **الخطوة 4 من 5: تحديد حسابات تويتر (X) المصدرة**:

أرسل معرفات حسابات تويتر/X التابعة لهذه الجامعة (مفصولة بمسافة):
📌 **مثال**: `@aum_kw @moe_kw`

💡 *إن لم تتوفر حسابات تويتر حالياً، أرسل كلمة*: `تخطي`"""
        self.send_msg(chat_id, prompt)

    def process_univ_step4_tw(self, chat_id: int, input_text: str):
        tw_sources = []
        if input_text.strip().lower() not in ["تخطي", "skip", "-", "لا"]:
            parts = re.split(r'[\s,]+', input_text.strip())
            for p in parts:
                p = p.strip()
                if p:
                    if not p.startswith("@") and not p.startswith("https://"):
                        p = "@" + p
                    tw_sources.append(p)

        if chat_id not in self.univ_wizard_data:
            self.univ_wizard_data[chat_id] = {}
        self.univ_wizard_data[chat_id]["twitter_sources"] = tw_sources
        self.user_waiting_state[chat_id] = "waiting_univ_gnews"

        name = self.univ_wizard_data[chat_id].get("name", "الجامعة")
        tw_desc = "، ".join(tw_sources) if tw_sources else "تم التخطي"

        prompt = f"""✅ **تم ربط حسابات تويتر ({len(tw_sources)})**: `{tw_desc}`
━━━━━━━━━━━━━━━━━━━
🌐 **الخطوة 5 من 5: البحث التلقائي في أخبار جوجل (Google News)**:

أرسل عبارة البحث لجلب الأخبار والمقالات الأكاديمية الرسمية للجامعة.
📌 **العبارة المقترحة تلقائياً**: `\"{name}\"`

💡 *أرسل كلمة `تأكيد` للاعتماد الفوري، أو اكتب عبارة بحث مخصصة (مثال: `{name} مكافأة قبول تسجيل`):*"""
        self.send_msg(chat_id, prompt)

    def process_univ_step5_gnews(self, chat_id: int, input_text: str):
        wizard = self.univ_wizard_data.pop(chat_id, {})
        self.user_waiting_state.pop(chat_id, None)

        name = wizard.get("name", "جامعة جديدة")
        target_ch = wizard.get("target_channel", "@jhdhhdcj")
        tg_sources = wizard.get("telegram_sources", [])
        tw_sources = wizard.get("twitter_sources", [])

        input_clean = input_text.strip()
        if input_clean.lower() in ["تأكيد", "نعم", "موافق", "confirm", "ok", "تخطي"]:
            gnews_query = name
        else:
            gnews_query = input_clean or name

        # الكلمات المفتاحية المعزولة للجامعة
        keywords = [name]
        for w in name.split():
            w_c = w.strip()
            if len(w_c) > 3 and w_c not in ["جامعة", "كلية", "عمادة", "معهد", "الشرق", "الأوسط"]:
                keywords.append(w_c)
        keywords.extend(["قبول", "تسجيل", "مكافأة", "إعانة"])

        proj = db.add_university_project(
            name=name,
            target_channel=target_ch,
            telegram_sources=tg_sources,
            twitter_sources=tw_sources,
            google_news_query=gnews_query,
            keywords=keywords
        )

        # تسجيل المصادر في قاعدة البيانات للمراقبة المباشرة
        for tg in tg_sources:
            db.add_source("telegram", tg, f"{name} - تيليجرام", added_by=chat_id)
        for tw in tw_sources:
            db.add_source("twitter", tw, f"{name} - تويتر", added_by=chat_id)

        self.send_msg(chat_id, f"🎉 **تم إنشاء وربط مشروع الجامعة بنجاح تام!**\nكل مصادر {name} معزولة 100% وتصب حصراً في `{target_ch}`.")
        self.show_single_university_dashboard(chat_id, proj["id"])

    def show_universities_panel(self, chat_id: int):
        """يعرض قائمة الجامعات، ولكل جامعة زر مستقل وخاص بها للتحكم الكامل"""
        univs = db.get_university_projects()
        text = f"🏛️ **قائمة الجامعات وقنوات النشر المستقلة ({len(univs)}):**\n"
        text += "🛡️ *نظام العزل الصارم (Strict Relational Mapping) نشط: كل جامعة لها مسار معزول تماماً ومصادر حصرية.*\n\n"
        text += "👇 **اضغط على زر أي جامعة أدناه للدخول للوحتها المستقلة وإدارتها:**"

        buttons = []
        for u in univs:
            st = "🟢 نشطة" if u.get("enabled", True) else "🔴 متوقفة"
            buttons.append([
                {"text": f"🎓 {u['name']} ({st}) ⮞ {u['target_channel']}", "callback_data": f"univ_view_{u['id']}"}
            ])

        buttons.append([
            {"text": "➕ معالج إضافة جامعة وقناة (5 خطوات)", "callback_data": "panel_add_university"},
            {"text": "🔄 فحص وسحب كافة الجامعات", "callback_data": "panel_crawl"}
        ])
        buttons.append([
            {"text": "📞 الدعم الفني المباشر (@M_S_F_G)", "url": "https://t.me/M_S_F_G"},
            {"text": "🎛 اللوحة الرئيسية", "callback_data": "panel_start"}
        ])

        self.send_msg(chat_id, text, {"inline_keyboard": buttons})

    def show_single_university_dashboard(self, chat_id: int, univ_id: str):
        """لوحة تحكم خاصة ومستقلة حصراً بجامعة محددة دون التأثير على الجامعات الأخرى"""
        univ = db.get_university_by_id(univ_id)
        if not univ:
            self.send_msg(chat_id, "⚠️ لم يتم العثور على الجامعة المحددة.")
            self.show_universities_panel(chat_id)
            return

        is_active = univ.get("enabled", True)
        st_badge = "🟢 نشطة (النشر التلقائي يعمل)" if is_active else "🔴 متوقفة مؤقتاً"
        tg_disp = "، ".join(univ.get("telegram_sources", [])) or "لا يوجد مصادر تيليجرام"
        tw_disp = "، ".join(univ.get("twitter_sources", [])) or "لا يوجد مصادر تويتر"
        gnews_q = univ.get("google_news_query", univ["name"])

        text = f"""🏛️ **لوحة التحكم المستقلة: {univ['name']}**
━━━━━━━━━━━━━━━━━━━
📢 **قناة النشر الحصرية**: `{univ['target_channel']}`
⚡ **الحالة الحالية**: {st_badge}
📡 **قنوات تيليجرام المصدرة**: `{tg_disp}`
🐦 **حسابات تويتر/X المصدرة**: `{tw_disp}`
🌐 **استعلام أخبار جوجل**: `\"{gnews_q}\"`
🔑 **معرف المشروع**: `{univ['id']}`
━━━━━━━━━━━━━━━━━━━
🛡️ **العزل الصارم**: جميع أخبار هذه المصادر تصاغ بالذكاء وتنشر حصراً في `{univ['target_channel']}` ولن تتداخل مع أي قناة أخرى."""

        btn_toggle_text = "⏸️ إيقاف النشر لهذه الجامعة" if is_active else "▶️ تفعيل واستئناف النشر"
        buttons = [
            [
                {"text": f"🔄 فحص وسحب أخبار {univ['name'][:16]}", "callback_data": f"univ_crawl_{univ['id']}"},
                {"text": btn_toggle_text, "callback_data": f"univ_toggle_{univ['id']}"}
            ],
            [
                {"text": f"🌐 أخبار جوجل المباشرة", "callback_data": f"univ_gnews_{univ['id']}"},
                {"text": f"📝 نشر خبر فوري في قناتها", "callback_data": f"univ_post_{univ['id']}"}
            ],
            [
                {"text": "🗑️ حذف هذه الجامعة من النظام", "callback_data": f"univ_del_{univ['id']}"}
            ],
            [
                {"text": "🔙 عودة لقائمة الجامعات", "callback_data": "panel_universities"},
                {"text": "🎛 اللوحة الرئيسية", "callback_data": "panel_start"}
            ]
        ]

        self.send_msg(chat_id, text, {"inline_keyboard": buttons})

    def check_google_news_single_university(self, target_univ: Dict[str, Any], is_manual: bool = False):
        """فحص وسحب أخبار جوجل لجامعة محددة حصراً وتوجيهها لقناتها الهدف"""
        try:
            q_str = target_univ.get("google_news_query") or target_univ["name"]
            encoded_q = urllib.parse.quote(q_str)
            target_ch = target_univ["target_channel"]

            urls = [
                f"https://news.google.com/rss/search?q={encoded_q}&hl=ar&gl=KW&ceid=KW:ar",
                f"https://news.google.com/rss/search?q={encoded_q}&hl=ar&gl=SA&ceid=SA:ar"
            ]

            for url in urls:
                try:
                    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
                    with urllib.request.urlopen(req, context=ssl_ctx, timeout=12) as resp:
                        root = ET.fromstring(resp.read())
                        items = root.findall(".//item")
                        for it in items[:6]:
                            title = it.findtext("title") or ""
                            link = it.findtext("link") or ""
                            clean_desc = re.sub(r'<[^>]+>', '', desc).strip()
                            clean_title = re.sub(r'\s*-\s*[^-]+$', '', title).strip()
                            full_text = f"{clean_title}\n{clean_desc}".strip()
                            photo_url = self.extract_image_from_xml_item(it, desc)

                            # منع التكرار الصارم
                            norm_clean = re.sub(r'[^\w\s]', '', clean_title)
                            norm_clean = re.sub(r'\s+', ' ', norm_clean).strip().lower()
                            story_hash = f"gnews_{hashlib.sha256(norm_clean.encode('utf-8')).hexdigest()[:24]}"

                            if db.is_post_seen(story_hash, story_hash):
                                continue

                            db.mark_post_seen(story_hash, story_hash, f"gnews_{target_univ['id']}")
                            logger.info(f"⚡️ [Google News الحصري] خبر جديد لـ {target_univ['name']} موجه إلى {target_ch} (صورة: {'نعم' if photo_url else 'لا'})")

                            post_queue.put({
                                "type": "google_news_post",
                                "text": f"{full_text}\n\n{link}",
                                "photo": photo_url,
                                "targets": [target_ch],
                                "target_univ": target_univ["name"],
                                "user_id": ADMIN_ID
                            })
                            if not is_manual:
                                break
                except Exception as e:
                    logger.debug(f"خطأ في سحب أخبار جوجل: {e}")
        except Exception as e:
            logger.error(f"خطأ في check_google_news_single_university: {e}")

    def trigger_google_news_search(self, chat_id: int, custom_query: str = ""):
        self.send_msg(chat_id, "🌐 **جاري البحث في Google News عن أحدث الأخبار الأكاديمية والجامعية...**")
        threading.Thread(target=self.check_google_news_for_universities, args=(True,), daemon=True).start()

    def crawl_single_university(self, chat_id: int, univ_id: str):
        univs = db.get_university_projects()
        target_univ = next((u for u in univs if u["id"] == univ_id), None)
        if not target_univ:
            self.send_msg(chat_id, "⚠️ لم يتم العثور على الجامعة المحددة.")
            return

        self.send_msg(chat_id, f"🔄 جاري فحص وسحب المصادر وأخبار جوجل لـ **{target_univ['name']}** ونشرها في `{target_univ['target_channel']}`...")

        # فحص قنوات تيليجرام التابعة للجامعة
        for tg in target_univ.get("telegram_sources", []):
            src_obj = {"type": "telegram", "target": tg, "last_post_id": ""}
            threading.Thread(target=self.check_telegram_channel_scraper, args=(src_obj, True), daemon=True).start()

        # فحص حسابات تويتر التابعة للجامعة
        for tw in target_univ.get("twitter_sources", []):
            src_obj = {"type": "twitter", "target": tw, "last_post_id": ""}
            threading.Thread(target=self.check_twitter_feed, args=(src_obj, True), daemon=True).start()

        # فحص أخبار جوجل لهذه الجامعة
        threading.Thread(target=self.check_google_news_for_universities, args=(True,), daemon=True).start()

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
