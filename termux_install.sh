#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# مثبت محرك بوت النشر الأكاديمي والجامعي الذكي الشامل لبيئة Termux (Android)
# مجهز بنظام التعرف الضوئي (OCR) والمزامنة المباشرة مع GitHub
# ==============================================================================

set -e

echo "🚀 [Termux Installer] بدء إعداد وتثبيت بوت النشر الأكاديمي..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. تحديث مستودعات تيرمكس
echo "📦 1. تحديث مستودعات وحزم Termux..."
pkg update -y || apt update -y
pkg install -y python git clang libjpeg-turbo libffi openssl libxml2 libxslt || true

# 2. تثبيت محرك التعرف الضوئي Tesseract مع دعم اللغة العربية (OCR)
echo "🔍 2. تثبيت محرك التعرف الضوئي (OCR) وقارئ المستندات..."
pkg install -y tesseract tesseract-ocr-ara || echo "ملاحظة: سيتم الاعتماد على التعرف الضوئي السحابي عبر Gemini Vision"

# 3. ترقية pip وتثبيت متطلبات بايثون
echo "🐍 3. تثبيت مكتبات بايثون الأساسية (Telethon, Requests, Aiohttp, Feedparser)..."
python3 -m pip install --upgrade pip setuptools wheel
python3 -m pip install -r requirements.txt || pip install requests python-dotenv telethon feedparser aiohttp

# 4. تهيئة ملف البيئة .env إن لم يكن موجوداً
if [ ! -f .env ]; then
    echo "⚙️ 4. إنشاء ملف الإعدادات والاعتمادات .env..."
    cat << 'EOF' > .env
BOT_TOKEN=8901693218:AAH0hoZdTq9qGaLYOhu_Cvxg9TEzTPAVADw
ADMIN_ID=7607633343
ADMIN_USERNAME=M_S_F_G
AI_BASE_URL=https://api.hcnsec.cn/v1
AI_API_KEY=sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii
PRIMARY_MODEL=DeepSeek-V4-Flash
PORT=8088
EOF
fi

# 5. ضبط أذونات التشغيل
chmod +x termux_start.sh || true
chmod +x main.py || true

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 تم التثبيت بنجاح تام في Termux!"
echo "⚡ لتشغيل البوت الآن، اكتب الأمر التالي:"
echo "   ./termux_start.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
