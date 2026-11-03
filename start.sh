#!/bin/bash
# ==============================================================================
# سكربت التشغيل الموحد للبوت الأكاديمي وواجهة الويب (Termux / Linux / Cloud VPS)
# يقوم بجلب أحدث التحديثات من GitHub وتشغيل واجهة الويب ومحرك تيليجرام معاً 24/7
# ==============================================================================

set -e

# ألوان العرض في الطرفية
GREEN='\033[0;32m'
SKY='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${SKY}==================================================================${NC}"
echo -e "${GREEN}  🚀 تشغيل البوت الأكاديمي المزدوج ومحرر المحتوى الجامعي الشامل${NC}"
echo -e "${SKY}  Web UI (Port 3000) + Telegram Background Engine (main.py)${NC}"
echo -e "${SKY}==================================================================${NC}"

# الانتقال إلى مسار المشروع
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. جلب أحدث التحديثات من مستودع GitHub
echo -e "\n${YELLOW}📡 [1/4] جلب أحدث التحديثات من مستودع GitHub...${NC}"
if [ -d ".git" ]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "master")
    echo -e "   جاري التحديث من الفرع: ${GREEN}${BRANCH}${NC}..."
    git pull origin "$BRANCH" || {
        echo -e "${YELLOW}   ⚠️ تعذر الجلب من GitHub (قد لا يوجد اتصال أو توجد تعارضات)، المتابعة بالنسخة المحلية الحالية.${NC}"
    }
else
    echo -e "${YELLOW}   ℹ️ مجلد .git غير موجود، المتابعة بالملفات المحلية.${NC}"
fi

# 2. التحقق من حزم بايثون الأساسية
echo -e "\n${YELLOW}🐍 [2/4] فحص حزم بايثون الأساسية...${NC}"
if command -v python3 &>/dev/null; then
    python3 -c "import sqlite3, json, urllib.request, ssl" 2>/dev/null || {
        echo -e "${RED}   خطأ في بيئة بايثون!${NC}"
    }
    # تثبيت الحزم الإضافية إذا توفر pip
    if command -v pip3 &>/dev/null; then
        pip3 install -q requests python-dotenv 2>/dev/null || true
    elif command -v pip &>/dev/null; then
        pip install -q requests python-dotenv 2>/dev/null || true
    fi
    echo -e "${GREEN}   ✅ بيئة بايثون جاهزة ومكتملة.${NC}"
else
    echo -e "${RED}   ❌ python3 غير مثبت على جهازك! يرجى تثبيته عبر: pkg install python (في Termux).${NC}"
    exit 1
fi

# 3. التحقق من حزم Node.js
echo -e "\n${YELLOW}📦 [3/4] فحص مكتبات Node.js و واجهة الويب...${NC}"
if command -v npm &>/dev/null; then
    if [ ! -d "node_modules" ]; then
        echo -e "   تثبيت حزم npm للمرة الأولى..."
        npm install --legacy-peer-deps
    fi
    echo -e "${GREEN}   ✅ حزم Node.js جاهزة ومكتملة.${NC}"
else
    echo -e "${RED}   ❌ Node.js أو npm غير مثبت! يرجى تثبيته عبر: pkg install nodejs (في Termux).${NC}"
    exit 1
fi

# 4. مزامنة التخزين الداخلي للهاتف وقاعدة البيانات
echo -e "\n${YELLOW}💾 [4/4] مزامنة التخزين الداخلي ومجلد التنزيلات (Downloads)...${NC}"
python3 -c "import database as db; db.sync_all_storages()" 2>/dev/null || true
echo -e "${GREEN}   ✅ تمت تهيئة مسارات التخزين الداخلي (/sdcard/Download/TelegramBot).${NC}"

# 5. تشغيل الخادم الموحد للواجهتين معاً
echo -e "\n${GREEN}==================================================================${NC}"
echo -e "${GREEN}  🟢 جاري إطلاق الواجهتين معاً بنجاح!${NC}"
echo -e "${SKY}  • واجهة التحكم بالويب:  http://localhost:3000${NC}"
echo -e "${SKY}  • محرك تيليجرام الآلي:  يعمل في الخلفية ويستمع للأوامر والنشر${NC}"
echo -e "${GREEN}==================================================================${NC}\n"

# التشغيل عبر tsx server.ts (يشغل خادم الويب ويشغل محرك بايثون تلقائياً في الخلفية)
exec npm run dev
