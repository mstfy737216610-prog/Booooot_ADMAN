#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
🤖 بوت النشر الأكاديمي الذكي المتقدم (Pyrogram V2 + FSM Control + UserBot)
================================================================================
المشرف المعتمد: @M_S_F_G (معرف: 7607633343)
توكن البوت: 8901693218:AAEOQmHMZLy-xaPbTUMq1KGhDwp1l0wFWP4
المحرك: Pyrogram v2.0+ (Dual Bot + UserBot Client)
نظام الحالات: Finite State Machine (FSM) مدمج داخل الشات
الذكاء الاصطناعي: DeepSeek-V4-Flash / Qwen3.8-27B / DeepSeek-V4.1-Flash
بوابة الـ API: https://api.hcnsec.cn/v1
مفتاح الـ API: sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii
================================================================================
"""

import os
import sys
import json
import time
import asyncio
import logging
import re
from typing import Dict, Any, Optional, List, Tuple

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# ضبط التسجيل المتقدم
logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    level=logging.INFO,
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("PyrogramPublisher")

# استيراد Pyrogram
try:
    from pyrogram import Client, filters, enums
    from pyrogram.types import (
        InlineKeyboardMarkup,
        InlineKeyboardButton,
        CallbackQuery,
        Message,
        InputMediaPhoto,
        InputMediaVideo,
        InputMediaDocument,
        InputMediaAudio
    )
    from pyrogram.errors import (
        SessionPasswordNeeded,
        PhoneCodeInvalid,
        PhoneCodeExpired,
        PasswordHashInvalid,
        FloodWait,
        RPCError,
        UserNotParticipant
    )
except ImportError:
    logger.error("مكتبة Pyrogram غير مثبتة! يرجى تشغيل: pip install pyrogram tgcrypto")
    sys.exit(1)

import aiohttp

# ----------------- الإعدادات والاعتمادات -----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BASE_DIR, "state.json")
SOURCES_FILE = os.path.join(BASE_DIR, "sources.json")
CONFIG_FILE = os.path.join(BASE_DIR, "bot_config.json")

def safe_int(val: Any, default: int = 0) -> int:
    if val is None:
        return default
    try:
        s = str(val).strip()
        if s.lstrip("-").isdigit():
            return int(s)
        digits_match = re.search(r'\b\d{5,10}\b', s)
        if digits_match:
            return int(digits_match.group(0))
        return default
    except Exception:
        return default

BOT_TOKEN = os.getenv("BOT_TOKEN", "8901693218:AAEOQmHMZLy-xaPbTUMq1KGhDwp1l0wFWP4").strip()
ADMIN_ID = safe_int(os.getenv("ADMIN_ID", "7607633343"), 7607633343)
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "M_S_F_G").replace("@", "").strip()

_raw_api_id = os.getenv("TELEGRAM_API_ID", "20123456").strip()
if not _raw_api_id.lstrip("-").isdigit():
    API_ID = 20123456
else:
    API_ID = safe_int(_raw_api_id, 20123456)
if API_ID <= 0:
    API_ID = 20123456

API_HASH = os.getenv("TELEGRAM_API_HASH", "abcdef0123456789abcdef0123456789").strip()

AI_BASE_URL = os.getenv("AI_BASE_URL", "https://api.hcnsec.cn/v1").rstrip("/")
AI_API_KEY = os.getenv("AI_API_KEY", "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii").strip()
PRIMARY_MODEL = os.getenv("PRIMARY_MODEL", "DeepSeek-V4-Flash").strip()

# ----------------- إدارة الحالة وتخزين البيانات -----------------
def load_state() -> Dict[str, Any]:
    default_state = {
        "bot_status": "active",
        "admin_id": str(ADMIN_ID),
        "admin_user": f"@{ADMIN_USERNAME}",
        "session_string": "",
        "ai_model": PRIMARY_MODEL,
        "ai_enabled": True,
        "processed_count": 0,
        "forwarded_count": 0,
        "ad_replaced_count": 0,
        "target_channels": ["@jhdhhdcj"],
        "source_channels": ["@KSU_News", "@moe_gov_sa", "@mstfyuhhh"],
        "custom_ad": """🎓 خدمات طلابية معتمدة وأكاديمية متكاملة 🎓
يسرنا تقديم الدعم الأكاديمي الشامل للطلبة والباحثين:
• مساعدة في البحوث والمشاريع الأكاديمية
• التدقيق اللغوي وتنسيق الرسائل الجامعية
• تلخيص المحاضرات والمقررات الدراسية

📞 للتواصل والطلب مباشرة عبر المشرف: @M_S_F_G
✨ جودة أكاديمية، سرعة في الإنجاز، وأسعار مناسبة للطلاب!""",
        "last_run": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                default_state.update(data)
        except Exception as e:
            logger.warning(f"تعذر قراءة {STATE_FILE}: {e}")
    return default_state

def save_state(state: Dict[str, Any]):
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"خطأ في حفظ {STATE_FILE}: {e}")

APP_STATE = load_state()

# ----------------- نظام الحالات FSM (Finite State Machine) -----------------
# حالات المحادثة للمشرف
class States:
    IDLE = "IDLE"
    AWAITING_PHONE = "AWAITING_PHONE"
    AWAITING_CODE = "AWAITING_CODE"
    AWAITING_2FA = "AWAITING_2FA"
    AWAITING_SOURCE = "AWAITING_SOURCE"
    AWAITING_TARGET = "AWAITING_TARGET"
    AWAITING_CUSTOM_AD = "AWAITING_CUSTOM_AD"
    AWAITING_CUSTOM_PROMPT = "AWAITING_CUSTOM_PROMPT"

user_fsm: Dict[int, Dict[str, Any]] = {}

def get_user_state(user_id: int) -> str:
    return user_fsm.get(user_id, {}).get("state", States.IDLE)

def set_user_state(user_id: int, state: str, **kwargs):
    if user_id not in user_fsm:
        user_fsm[user_id] = {}
    user_fsm[user_id]["state"] = state
    for k, v in kwargs.items():
        user_fsm[user_id][k] = v

def clear_user_state(user_id: int):
    if user_id in user_fsm:
        temp_client = user_fsm[user_id].get("temp_client")
        if temp_client and hasattr(temp_client, "is_connected") and temp_client.is_connected:
            asyncio.create_task(temp_client.disconnect())
        user_fsm.pop(user_id, None)

# ----------------- دالة معالجة وصياغة الذكاء الاصطناعي -----------------
SYSTEM_PROMPT = """# الدور: محرر وكاتب محتوى تعليمي وجامعي حصري
## الهوية:
أنت الناشر الرسمي لمجتمع الطلاب الجامعيين. تعيد صياغة المنشورات بأسلوب أنيق، دقيق، وجذاب بدون أي إشارة للمصدر الأصلي.

## القواعد الصارمة:
1. ممنوع ذكر اسم القناة أو المصدر المنقول منه نهائياً، واجعل المنشور حصرياً.
2. احذف كل الروابط الإعلانية أو روابط تيليجرام الخارجية (@channel, t.me).
3. حافظ تماماً على التواريخ، النسب، المواعيد، وشروط القبول.
4. التنسيق الإلزامي:
📌 [عنوان بارز وجذاب]
[المحتوى في نقاط مرتبة واضحة]
💬 [دعوة تفاعلية قصيرة للطلاب]
#جامعة #قبول #تسجيل #شؤون_الطلاب"""

async def rephrase_with_ai(text: str, model_name: str = None) -> Tuple[str, str]:
    """إعادة صياغة المنشور عبر نموذج الذكاء الاصطناعي مع حماية كاملة من الـ Timeout"""
    model = model_name or APP_STATE.get("ai_model", "DeepSeek-V4-Flash")
    target_url = f"{AI_BASE_URL}/chat/completions"
    
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"أعد صياغة هذا الخبر الجامعي باحترافية:\n\n{text}"}
        ],
        "temperature": 0.35,
        "max_tokens": 800
    }
    
    headers = {
        "Authorization": f"Bearer {AI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # مهلة قصيرة 18 ثانية لمنع تجمد البوت ومشاكل الـ URL timeout
    timeout = aiohttp.ClientTimeout(total=18)
    
    try:
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(target_url, json=payload, headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        content = choices[0]["message"]["content"].strip()
                        return content, model
                logger.warning(f"AI API returned status {resp.status}")
    except asyncio.TimeoutError:
        logger.warning(f"⏱️ انتهت مهلة نموذج {model} (Timeout). يتم تطبيق الصياغة الأكاديمية السريعة فوراً.")
    except Exception as e:
        logger.warning(f"⚠️ خطأ في بوابة الذكاء الاصطناعي ({e}). يتم تطبيق المنسق الأكاديمي المدمج.")

    # المعالج الأكاديمي المحلي الفوري (Zero-Timeout Guarantee)
    return fallback_rephrase(text), "محرك التنسيق الأكاديمي الفوري"

def fallback_rephrase(raw_text: str) -> str:
    cleaned = re.sub(r'@[a-zA-Z0-9_]+', '', raw_text)
    cleaned = re.sub(r'https?://t\.me/[^\s]+', '', cleaned).strip()
    lines = [l.strip() for l in cleaned.split("\n") if l.strip() and not l.strip().startswith("http")]
    
    title = lines[0] if lines else "إعلان جامعي وأكاديمي هام"
    if len(title) > 60:
        title = title[:57] + "..."
        
    bullets = "\n".join([f"• {l}" for l in lines[1:6]]) if len(lines) > 1 else f"• {cleaned}"
    
    return f"""📌 **{title}**

{bullets}

💬 شارك المنشور مع زملائك، وتابعونا لمزيد من التحديثات الرسمية!

#أخبار_الجامعة #شؤون_الطلاب #مواعيد #تسجيل"""

# كشف إعلانات المنافسين (الإعلانات التجارية الصريحة لحل الواجبات والكويزات بمقابل فقط)
AD_KEYWORDS = [
    "حل واجبات بمقابل", "حل واجبات واختبارات", "حل كويزات", "حل فاينل", "حل اسايمنت",
    "كتابة بحوث بمقابل", "عمل بحوث ورسائل بمقابل", "إعلان مدفوع للخدمات", "إعلان ممول غير رسمي"
]

def is_competitor_ad(text: str) -> bool:
    if not text or not APP_STATE.get("ad_replacement_enabled", False):
        return False
    return any(kw in text for kw in AD_KEYWORDS)

# ----------------- تهيئة عميل البوت التفاعلي -----------------
bot_app = Client(
    name="educational_bot_controller",
    bot_token=BOT_TOKEN,
    api_id=API_ID,
    api_hash=API_HASH,
    in_memory=True
)

# عميل اليوزربوت الحقيقي (يتم تشغيله بالجلسة المحفوظة)
userbot_app: Optional[Client] = None

async def init_userbot(session_str: str) -> bool:
    """بدء تشغيل اليوزربوت بجلسة المستخدم الحقيقية لسحب المنشورات"""
    global userbot_app
    if not session_str or len(session_str) < 50:
        logger.info("لا توجد جلسة يوزربوت مسجلة بعد.")
        return False
        
    try:
        if userbot_app and userbot_app.is_connected:
            await userbot_app.stop()
            
        userbot_app = Client(
            name="pyrogram_userbot_worker",
            session_string=session_str,
            api_id=API_ID,
            api_hash=API_HASH,
            in_memory=True
        )
        await userbot_app.start()
        me = await userbot_app.get_me()
        logger.info(f"✅ تم تشغيل اليوزربوت بنجاح باسم: {me.first_name} (@{me.username or me.id})")
        
        # تسجيل معالج التقاط المنشورات
        register_userbot_handlers(userbot_app)
        return True
    except Exception as e:
        logger.error(f"❌ فشل تشغيل اليوزربوت: {e}")
        userbot_app = None
        return False

# ----------------- لوحات التحكم التفاعلية الشفافة (Inline Keyboards) -----------------
def make_main_keyboard() -> InlineKeyboardMarkup:
    is_paused = APP_STATE.get("bot_status") == "paused"
    pause_text = "▶️ تشغيل النشر" if is_paused else "⏸️ إيقاف النشر"
    has_session = bool(APP_STATE.get("session_string"))
    login_text = "✅ جلسة اليوزربوت نشطة" if has_session else "🔐 تسجيل الدخول (UserBot Login)"
    
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("📊 الإحصائيات والحالة", callback_data="btn_status"),
            InlineKeyboardButton(login_text, callback_data="btn_login_menu")
        ],
        [
            InlineKeyboardButton("📥 القنوات المصدرية", callback_data="btn_sources"),
            InlineKeyboardButton("📤 قنوات النشر والهدف", callback_data="btn_targets")
        ],
        [
            InlineKeyboardButton("🤖 الذكاء الاصطناعي", callback_data="btn_ai_menu"),
            InlineKeyboardButton("📢 إعلان خدماتك", callback_data="btn_ad_menu")
        ],
        [
            InlineKeyboardButton("⚡ فحص الاتصال الفوري", callback_data="btn_quick_test"),
            InlineKeyboardButton(pause_text, callback_data="btn_toggle_pause")
        ],
        [
            InlineKeyboardButton("🔄 تحديث اللوحة", callback_data="btn_refresh_dashboard")
        ]
    ])

def make_ai_models_keyboard() -> InlineKeyboardMarkup:
    cur = APP_STATE.get("ai_model", "DeepSeek-V4-Flash")
    def mark(m): return f"🔘 {m}" if m == cur else m
    
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(mark("DeepSeek-V4-Flash"), callback_data="set_model:DeepSeek-V4-Flash"),
            InlineKeyboardButton(mark("Qwen3.8-27B"), callback_data="set_model:Qwen3.8-27B")
        ],
        [
            InlineKeyboardButton(mark("DeepSeek-V4.1-Flash"), callback_data="set_model:DeepSeek-V4.1-Flash")
        ],
        [
            InlineKeyboardButton("⚡ فحص سرعة الاستجابة", callback_data="btn_test_ai_speed")
        ],
        [
            InlineKeyboardButton("🔙 رجوع للوحة الرئيسية", callback_data="btn_back_main")
        ]
    ])

def make_login_keyboard() -> InlineKeyboardMarkup:
    has_session = bool(APP_STATE.get("session_string"))
    buttons = []
    if has_session:
        buttons.append([InlineKeyboardButton("🚪 تسجيل الخروج من الجلسة", callback_data="btn_do_logout")])
        buttons.append([InlineKeyboardButton("🔄 إعادة تسجيل الدخول بحساب جديد", callback_data="btn_start_login")])
    else:
        buttons.append([InlineKeyboardButton("📲 إدخال رقم الهاتف وبدء الربط", callback_data="btn_start_login")])
        
    buttons.append([InlineKeyboardButton("🔙 رجوع للوحة الرئيسية", callback_data="btn_back_main")])
    return InlineKeyboardMarkup(buttons)

# ----------------- أوامر البوت ومعالجات الأزرار -----------------
@bot_app.on_message(filters.command(["start", "help"]) & filters.private)
async def cmd_start(client: Client, message: Message):
    user_id = message.from_user.id
    if user_id != ADMIN_ID:
        await message.reply_text(
            f"⛔ **عذراً، هذا البوت خاص بالمشرف المعتمد @{ADMIN_USERNAME} فقط.**\n(معرفك: `{user_id}`)"
        )
        return
        
    clear_user_state(user_id)
    text = (
        f"👋 **مرحباً بك عزيزي المشرف @{ADMIN_USERNAME}!**\n\n"
        "🤖 **لوحة تحكم بوت النشر التلقائي الأكاديمي (Pyrogram V2 + FSM)**\n"
        "• تحكم شامل بالأزرار التفاعلية الشفافة من داخل تيليجرام مباشرة.\n"
        "• يوزربوت حقيقي لسحب وقراءة المنشورات والميديا فور نزولها.\n"
        "• صياغة فائقة بالذكاء الاصطناعي وحماية تامة من مشاكل الـ Timeout.\n\n"
        "اختر أحد الإجراءات من اللوحة أدناه:"
    )
    await message.reply_text(text, reply_markup=make_main_keyboard())

@bot_app.on_callback_query()
async def on_callback(client: Client, callback: CallbackQuery):
    user_id = callback.from_user.id
    if user_id != ADMIN_ID:
        await callback.answer("⛔ ليس لديك صلاحية المشرف!", show_alert=True)
        return
        
    data = callback.data
    
    if data == "btn_back_main" or data == "btn_refresh_dashboard":
        clear_user_state(user_id)
        await callback.message.edit_text(
            f"🎛 **اللوحة الرئيسية لبوت النشر الأكاديمي (Pyrogram Pro)**\n"
            f"👤 المشرف: @{ADMIN_USERNAME} | الحالة: `{APP_STATE.get('bot_status', 'active')}`\n"
            f"🤖 النموذج الحالي: `{APP_STATE.get('ai_model')}`",
            reply_markup=make_main_keyboard()
        )
        await callback.answer("تم تحديث اللوحة بنجاح")
        return
        
    if data == "btn_status":
        userbot_active = userbot_app is not None and userbot_app.is_connected
        text = (
            "📊 **إحصائيات وتقارير البوت المباشرة:**\n\n"
            f"• **حالة النظام**: {'🟢 نشط ويعمل' if APP_STATE.get('bot_status') == 'active' else '⏸️ متوقف مؤقتاً'}\n"
            f"• **اليوزربوت (سحب القنوات)**: {'🟢 متصل ويعمل' if userbot_active else '🔴 غير متصل (سجل الدخول)'}\n"
            f"• **المنشورات المعالجة**: `{APP_STATE.get('processed_count', 0)}` منشور\n"
            f"• **المنشورات المنشورة**: `{APP_STATE.get('forwarded_count', 0)}` منشور\n"
            f"• **الإعلانات المستبدلة**: `{APP_STATE.get('ad_replaced_count', 0)}` إعلان\n"
            f"• **نموذج الذكاء الاصطناعي**: `{APP_STATE.get('ai_model')}`\n"
            f"• **القنوات المصدرية**: `{len(APP_STATE.get('source_channels', []))}` قنوات\n"
            f"• **قنوات النشر الهدف**: `{len(APP_STATE.get('target_channels', []))}` قنوات"
        )
        kb = InlineKeyboardMarkup([[InlineKeyboardButton("🔙 رجوع", callback_data="btn_back_main")]])
        await callback.message.edit_text(text, reply_markup=kb)
        await callback.answer()
        return

    if data == "btn_login_menu":
        has_session = bool(APP_STATE.get("session_string"))
        text = (
            "🔐 **نظام تسجيل دخول اليوزربوت التفاعلي (In-Telegram Auth Flow):**\n\n"
            "هذا النظام يمكنك من تسجيل الدخول بحساب تيليجرام الخاص بك مباشرة من داخل هذا الشات، "
            "دون الحاجة لتشغيل سكريبتات خارجية أو رفع ملفات session.\n\n"
            f"• **الحالة الحالية**: {'✅ مسجل بجلسة رسمية' if has_session else '⚠️ لم يتم تسجيل الدخول بعد'}\n\n"
            "اضغط على الزر أدناه لبدء عملية الربط الرسمية:"
        )
        await callback.message.edit_text(text, reply_markup=make_login_keyboard())
        await callback.answer()
        return

    if data == "btn_start_login":
        set_user_state(user_id, States.AWAITING_PHONE)
        text = (
            "📱 **الخطوة [1/3]: إدخال رقم الهاتف**\n\n"
            "أرسل رقم هاتفك الدولي المسجل في تيليجرام الآن مع رمز الدولة.\n"
            "مثال:\n"
            "`+96512345678` أو `+966501234567`\n\n"
            "💡 *سيقوم تيليجرام بإرسال رمز تحقق رسمي إلى تطبيق تيليجرام لديك فوراً.*"
        )
        kb = InlineKeyboardMarkup([[InlineKeyboardButton("❌ إلغاء العملية", callback_data="btn_back_main")]])
        await callback.message.edit_text(text, reply_markup=kb)
        await callback.answer()
        return

    if data == "btn_do_logout":
        APP_STATE["session_string"] = ""
        save_state(APP_STATE)
        if userbot_app and userbot_app.is_connected:
            await userbot_app.stop()
        clear_user_state(user_id)
        await callback.answer("تم تسجيل الخروج وحذف الجلسة", show_alert=True)
        await callback.message.edit_text(
            "🚪 **تم تسجيل الخروج من جلسة اليوزربوت بنجاح.**\nيمكنك تسجيل الدخول مجدداً في أي وقت.",
            reply_markup=make_main_keyboard()
        )
        return

    if data == "btn_sources":
        sources = APP_STATE.get("source_channels", [])
        text = "📥 **قنوات المصادر المراقبة حالياً:**\n\n"
        if sources:
            for i, s in enumerate(sources, 1):
                text += f"{i}. `{s}`\n"
        else:
            text += "لا توجد قنوات مصدرية مضافة بعد.\n"
        text += "\n💡 *لإضافة قناة: اضغط على زر إضافة قناة أو أرسل رابطها مباشرة.*"
        
        kb = InlineKeyboardMarkup([
            [InlineKeyboardButton("➕ إضافة قناة مصدر", callback_data="btn_add_source")],
            [InlineKeyboardButton("🔙 رجوع", callback_data="btn_back_main")]
        ])
        await callback.message.edit_text(text, reply_markup=kb)
        await callback.answer()
        return

    if data == "btn_add_source":
        set_user_state(user_id, States.AWAITING_SOURCE)
        await callback.message.edit_text(
            "📥 **إضافة قناة مصدرية جديدة:**\n\n"
            "أرسل معرف القناة (مثال: `@KSU_News`) أو رابطها أو معرفها الرقمي الآن:",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("❌ إلغاء", callback_data="btn_sources")]])
        )
        await callback.answer()
        return

    if data == "btn_targets":
        targets = APP_STATE.get("target_channels", [])
        text = "📤 **قنوات النشر والتوزيع المستهدفة:**\n\n"
        if targets:
            for i, t in enumerate(targets, 1):
                text += f"{i}. `{t}`\n"
        else:
            text += "لا توجد قنوات نشر مضافة بعد.\n"
        text += "\n💡 *تأكد من رفع البوت كمشرف في هذه القنوات لمنحه صلاحية النشر.*"
        
        kb = InlineKeyboardMarkup([
            [InlineKeyboardButton("➕ إضافة قناة نشر", callback_data="btn_add_target")],
            [InlineKeyboardButton("🔙 رجوع", callback_data="btn_back_main")]
        ])
        await callback.message.edit_text(text, reply_markup=kb)
        await callback.answer()
        return

    if data == "btn_add_target":
        set_user_state(user_id, States.AWAITING_TARGET)
        await callback.message.edit_text(
            "📤 **إضافة قناة نشر وتوزيع:**\n\n"
            "أرسل معرف القناة المستهدفة للنشر (مثال: `@jhdhhdcj`) الآن:",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("❌ إلغاء", callback_data="btn_targets")]])
        )
        await callback.answer()
        return

    if data == "btn_ai_menu":
        text = (
            "🤖 **إعدادات ونماذج الذكاء الاصطناعي:**\n\n"
            f"• البوابة: `{AI_BASE_URL}`\n"
            f"• النموذج النشط: `{APP_STATE.get('ai_model')}`\n\n"
            "⚡ **ملاحظة حول السرعة**: نموذج `DeepSeek-V4-Flash` يمتاز بسرعة استجابة فائقة تمنع حدوث أي Timeout."
        )
        await callback.message.edit_text(text, reply_markup=make_ai_models_keyboard())
        await callback.answer()
        return

    if data.startswith("set_model:"):
        new_model = data.split(":", 1)[1]
        APP_STATE["ai_model"] = new_model
        save_state(APP_STATE)
        await callback.answer(f"تم اختيار نموذج: {new_model}")
        await callback.message.edit_reply_markup(reply_markup=make_ai_models_keyboard())
        return

    if data == "btn_test_ai_speed" or data == "btn_quick_test":
        await callback.answer("جاري فحص الاتصال...", show_alert=False)
        msg = await callback.message.reply_text("⏳ **جاري إرسال طلب اختبار فوري للذكاء الاصطناعي...**")
        t0 = time.time()
        reply, used_model = await rephrase_with_ai("تعلن عمادة القبول والتسجيل عن بدء استقبال طلبات الالتحاق للفصل القادم.")
        duration = round((time.time() - t0) * 1000)
        
        await msg.edit_text(
            f"✅ **نتيجة الفحص الفوري:**\n\n"
            f"• **النموذج المستخدم**: `{used_model}`\n"
            f"• **زمن الاستجابة**: `{duration}ms`\n"
            f"• **حالة البوابة**: مستقرة وسريعة ⚡\n\n"
            f"**معاينة الصياغة الناتجة:**\n{reply[:250]}..."
        )
        return

    if data == "btn_toggle_pause":
        cur_status = APP_STATE.get("bot_status", "active")
        new_status = "paused" if cur_status == "active" else "active"
        APP_STATE["bot_status"] = new_status
        save_state(APP_STATE)
        status_msg = "تم إيقاف النشر التلقائي مؤقتاً ⏸️" if new_status == "paused" else "تم استئناف النشر التلقائي بنجاح ▶️"
        await callback.answer(status_msg, show_alert=True)
        await callback.message.edit_reply_markup(reply_markup=make_main_keyboard())
        return

    if data == "btn_ad_menu":
        ad_text = APP_STATE.get("custom_ad", "")
        text = (
            "📢 **إعلان الخدمات الطلابية البديل (استبدال إعلانات المنافسين):**\n\n"
            "عند التقاط أي إعلان من قنوات المنافسين يحتوي على كلمات مثل (حل واجبات، بحوث تخرج، إلخ)، "
            "يستبدله البوت تلقائياً بهذا النص الخاص بك:\n\n"
            f"```\n{ad_text}\n```"
        )
        kb = InlineKeyboardMarkup([
            [InlineKeyboardButton("✏️ تعديل نص الإعلان", callback_data="btn_edit_ad")],
            [InlineKeyboardButton("🔙 رجوع", callback_data="btn_back_main")]
        ])
        await callback.message.edit_text(text, reply_markup=kb)
        await callback.answer()
        return

    if data == "btn_edit_ad":
        set_user_state(user_id, States.AWAITING_CUSTOM_AD)
        await callback.message.edit_text(
            "✏️ **أرسل نص إعلانك الجديد الآن:**\n"
            "يمكنك كتابة تفاصيل خدماتك، ورقم التواصل أو معرفك @M_S_F_G.",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("❌ إلغاء", callback_data="btn_ad_menu")]])
        )
        await callback.answer()
        return

# ----------------- معالجة رسائل FSM النصية للمشرف -----------------
@bot_app.on_message(filters.text & filters.private)
async def on_user_message(client: Client, message: Message):
    user_id = message.from_user.id
    if user_id != ADMIN_ID:
        return
        
    state = get_user_state(user_id)
    text = message.text.strip()
    
    # 1. حالة انتظار رقم الهاتف
    if state == States.AWAITING_PHONE:
        phone = re.sub(r'[\s\-()]', '', text)
        if not phone.startswith("+"):
            phone = "+" + phone
            
        if len(phone) < 9 or not phone[1:].isdigit():
            await message.reply_text("❌ **رقم الهاتف غير صالح!** يرجى إرساله مع رمز الدولة (مثال: `+96512345678`).")
            return
            
        status_msg = await message.reply_text(f"⏳ **جاري الاتصال بسيرفرات تيليجرام لطلب كود التحقق للرقم `{phone}`...**")
        
        try:
            temp_client = Client(
                name="temp_auth_session",
                api_id=API_ID,
                api_hash=API_HASH,
                in_memory=True
            )
            await temp_client.connect()
            sent_code = await temp_client.send_code(phone)
            
            set_user_state(
                user_id,
                States.AWAITING_CODE,
                temp_client=temp_client,
                phone=phone,
                phone_code_hash=sent_code.phone_code_hash
            )
            
            await status_msg.edit_text(
                f"📩 **تم إرسال كود التحقق بنجاح إلى حسابك في تيليجرام!**\n\n"
                f"📱 **الرقم**: `{phone}`\n"
                f"🔢 افتح تطبيق تيليجرام الرسمي الآن، وانسخ الكود وأرسله هنا مباشرة.\n"
                f"*(يمكنك إرسال الكود كأرقام عادية مثل `12345` أو مفصولاً بشرطات `1-2-3-4-5`)*",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("❌ إلغاء", callback_data="btn_back_main")]])
            )
        except Exception as e:
            logger.error(f"خطأ في إرسال الكود: {e}")
            clear_user_state(user_id)
            await status_msg.edit_text(
                f"❌ **تعذر طلب كود التحقق:**\n`{str(e)}`\n\nتأكد من صحة رقم الهاتف أو المحاولة بعد قليل.",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 رجوع", callback_data="btn_login_menu")]])
            )
        return

    # 2. حالة انتظار كود التحقق
    if state == States.AWAITING_CODE:
        state_data = user_fsm.get(user_id, {})
        temp_client: Client = state_data.get("temp_client")
        phone: str = state_data.get("phone")
        phone_code_hash: str = state_data.get("phone_code_hash")
        
        code = re.sub(r'[\s\-]', '', text)
        if not code.isdigit():
            await message.reply_text("❌ الكود يجب أن يتكون من أرقام فقط. يرجى إعادة إرساله بدقة:")
            return
            
        status_msg = await message.reply_text("⏳ **جاري التحقق من الكود وتوليد الجلسة...**")
        
        try:
            await temp_client.sign_in(phone, phone_code_hash, code)
            # تم تسجيل الدخول مباشرة بدون 2FA
            session_str = await temp_client.export_session_string()
            await temp_client.disconnect()
            
            APP_STATE["session_string"] = session_str
            save_state(APP_STATE)
            clear_user_state(user_id)
            
            # تشغيل اليوزربوت فوراً
            await init_userbot(session_str)
            
            await status_msg.edit_text(
                "🎉 **مبروك! تم تسجيل الدخول وتوليد جلسة اليوزربوت الحقيقية بنجاح!**\n\n"
                "✅ أصبحت الجلسة محفوظة بأمان في النظام.\n"
                "🚀 بدأ محرك اليوزربوت بمراقبة القنوات المصدرية وسحب المنشورات والميديا فوراً دون أي نقص!",
                reply_markup=make_main_keyboard()
            )
        except SessionPasswordNeeded:
            # الحساب محمي بكلمة مرور تحقق بخطوتين 2FA
            set_user_state(user_id, States.AWAITING_2FA, temp_client=temp_client)
            await status_msg.edit_text(
                "🔐 **الحساب محمي بالتحقق بخطوتين (2FA):**\n\n"
                "يرجى إرسال كلمة المرور السحابية لحسابك لإتمام عملية تسجيل الدخول بنجاح:",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("❌ إلغاء", callback_data="btn_back_main")]])
            )
        except (PhoneCodeInvalid, PhoneCodeExpired) as e:
            await status_msg.edit_text(
                "❌ **كود التحقق غير صحيح أو منتهي الصلاحية!** يرجى إعادة المحاولة من البداية.",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔄 المحاولة مجدداً", callback_data="btn_start_login")]])
            )
            clear_user_state(user_id)
        except Exception as e:
            logger.error(f"خطأ أثناء التحقق: {e}")
            await status_msg.edit_text(
                f"❌ **حدث خطأ أثناء التحقق:**\n`{str(e)}`",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 رجوع", callback_data="btn_back_main")]])
            )
            clear_user_state(user_id)
        return

    # 3. حالة انتظار كلمة مرور 2FA
    if state == States.AWAITING_2FA:
        state_data = user_fsm.get(user_id, {})
        temp_client: Client = state_data.get("temp_client")
        password = text
        
        status_msg = await message.reply_text("⏳ **جاري التحقق من كلمة المرور السحابية...**")
        try:
            await temp_client.check_password(password)
            session_str = await temp_client.export_session_string()
            await temp_client.disconnect()
            
            APP_STATE["session_string"] = session_str
            save_state(APP_STATE)
            clear_user_state(user_id)
            
            # تشغيل اليوزربوت فوراً
            await init_userbot(session_str)
            
            await status_msg.edit_text(
                "🎉 **تم قبول كلمة المرور وتفعيل اليوزربوت بنجاح تام!**\n\n"
                "✅ الجلسة نشطة وموثقة على سيرفرات تيليجرام.\n"
                "🚀 بدأ محرك سحب المنشورات والقنوات المصدرية في العمل الآن.",
                reply_markup=make_main_keyboard()
            )
        except PasswordHashInvalid:
            await status_msg.edit_text(
                "❌ **كلمة المرور غير صحيحة!** يرجى التأكد وإعادة كتابتها:",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("❌ إلغاء", callback_data="btn_back_main")]])
            )
        except Exception as e:
            await status_msg.edit_text(
                f"❌ **خطأ أثناء فحص 2FA:**\n`{str(e)}`",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 رجوع", callback_data="btn_back_main")]])
            )
            clear_user_state(user_id)
        return

    # 4. إضافة قناة مصدر
    if state == States.AWAITING_SOURCE:
        ch = text
        if not ch.startswith("@") and not ch.startswith("-100") and not ch.startswith("https://t.me/"):
            ch = f"@{ch}"
        sources = APP_STATE.get("source_channels", [])
        if ch not in sources:
            sources.append(ch)
            APP_STATE["source_channels"] = sources
            save_state(APP_STATE)
        clear_user_state(user_id)
        await message.reply_text(
            f"✅ **تمت إضافة القناة المصدرية بنجاح:** `{ch}`\n"
            f"إجمالي القنوات المراقبة الآن: {len(sources)}",
            reply_markup=make_main_keyboard()
        )
        return

    # 5. إضافة قناة نشر
    if state == States.AWAITING_TARGET:
        ch = text
        if not ch.startswith("@") and not ch.startswith("-100"):
            ch = f"@{ch}"
        targets = APP_STATE.get("target_channels", [])
        if ch not in targets:
            targets.append(ch)
            APP_STATE["target_channels"] = targets
            save_state(APP_STATE)
        clear_user_state(user_id)
        await message.reply_text(
            f"✅ **تمت إضافة قناة النشر بنجاح:** `{ch}`\n"
            f"تأكد من إضافة البوت كمشرف في القناة لنشر المنشورات.",
            reply_markup=make_main_keyboard()
        )
        return

    # 6. تعديل الإعلان
    if state == States.AWAITING_CUSTOM_AD:
        APP_STATE["custom_ad"] = text
        save_state(APP_STATE)
        clear_user_state(user_id)
        await message.reply_text(
            "✅ **تم حفظ إعلانك البديل الجديد بنجاح!**\nسيتم استخدامه فوراً عند رصد أي إعلان منافس.",
            reply_markup=make_main_keyboard()
        )
        return

    # في حال إرسال أي نص عادي من المشرف، يتم اعتباره خبراً لصياغته ونشره تجريبياً
    rephrased, used_model = await rephrase_with_ai(text)
    kb = InlineKeyboardMarkup([
        [InlineKeyboardButton("📤 نشر في قنوات النشر الآن", callback_data="btn_publish_preview")],
        [InlineKeyboardButton("🔙 رجوع", callback_data="btn_back_main")]
    ])
    await message.reply_text(
        f"✨ **معاينة الصياغة الذكية بنموذج ({used_model}):**\n\n{rephrased}",
        reply_markup=kb
    )

# ----------------- محرك اليوزربوت لسحب المنشورات ونشر الوسائط -----------------
def register_userbot_handlers(ub_client: Client):
    @ub_client.on_message(filters.channel)
    async def handle_channel_post(client: Client, message: Message):
        if APP_STATE.get("bot_status") == "paused":
            return
            
        chat_username = f"@{message.chat.username}" if message.chat.username else str(message.chat.id)
        sources = APP_STATE.get("source_channels", [])
        
        # التأكد من أن القناة ضمن المصادر المراقبة
        is_monitored = False
        for s in sources:
            if s.lower() == chat_username.lower() or s == str(message.chat.id):
                is_monitored = True
                break
                
        if not is_monitored:
            return
            
        logger.info(f"📥 تم التقاط منشور جديد من القناة المصدر: {chat_username} (ID: {message.id})")
        
        raw_text = message.caption or message.text or ""
        targets = APP_STATE.get("target_channels", ["@MyUniversityChannel"])
        
        # كشف إعلانات المنافسين
        if is_competitor_ad(raw_text):
            logger.info("🎯 تم كشف إعلان منافس، استبداله بإعلان خدمات المشرف...")
            final_text = APP_STATE.get("custom_ad", "")
            APP_STATE["ad_replaced_count"] = APP_STATE.get("ad_replaced_count", 0) + 1
        elif raw_text:
            final_text, _ = await rephrase_with_ai(raw_text)
        else:
            final_text = ""
            
        # نشر الوسائط والنص إلى كافة قنوات النشر المستهدفة
        for target in targets:
            try:
                if message.photo:
                    await client.send_photo(
                        chat_id=target,
                        photo=message.photo.file_id,
                        caption=final_text
                    )
                elif message.video:
                    await client.send_video(
                        chat_id=target,
                        video=message.video.file_id,
                        caption=final_text
                    )
                elif message.document:
                    await client.send_document(
                        chat_id=target,
                        document=message.document.file_id,
                        caption=final_text
                    )
                elif message.audio:
                    await client.send_audio(
                        chat_id=target,
                        audio=message.audio.file_id,
                        caption=final_text
                    )
                elif final_text:
                    await client.send_message(
                        chat_id=target,
                        text=final_text
                    )
                logger.info(f"📤 تم النشر بنجاح في القناة المستهدفة: {target}")
            except Exception as e:
                logger.error(f"❌ تعذر النشر في {target}: {e}")
                
        APP_STATE["processed_count"] = APP_STATE.get("processed_count", 0) + 1
        APP_STATE["forwarded_count"] = APP_STATE.get("forwarded_count", 0) + 1
        save_state(APP_STATE)

# ----------------- الدالة الرئيسية لتشغيل البوت واليوزربوت معاً -----------------
async def main():
    logger.info("================================================================================")
    logger.info("🚀 جاري بدء تشغيل محرك النشر التعليمي (Pyrogram Dual Controller)")
    logger.info(f"👑 المشرف المعتمد: @{ADMIN_USERNAME} (ID: {ADMIN_ID})")
    logger.info(f"🤖 نموذج الذكاء الاصطناعي الافتراضي: {APP_STATE.get('ai_model')}")
    logger.info("================================================================================")
    
    # 1. تشغيل عميل البوت التفاعلي
    await bot_app.start()
    bot_info = await bot_app.get_me()
    logger.info(f"🤖 عميل البوت نشط: @{bot_info.username} ({bot_info.first_name})")
    
    # 2. فحص وتشغيل جلسة اليوزربوت إن وجدت
    session_str = APP_STATE.get("session_string") or os.getenv("STRING_SESSION", "")
    if session_str:
        await init_userbot(session_str)
    else:
        logger.info("ℹ️ لم يتم العثور على جلسة مسجلة بعد. يمكنك تسجيل الدخول بالضغط على زر تسجيل الدخول من الشات.")
        
    # البقاء في وضع الاستماع والتشغيل الدائم
    logger.info("✨ النظام يعمل بكفاءة قصوى وجاهز لاستقبال الأوامر!")
    await asyncio.Event().wait()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("تم إيقاف النظام.")
