#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# سكربت التثبيت والإعداد الشامل لتطبيق Termux (أندرويد)
# يقوم بتهيئة الصلاحيات، تثبيت الحزم، جلب المستودع، وتشغيل البوت والويب معاً
# مستودع: https://github.com/mstfy737216610-prog/Booooot_ADMAN.git
# ==============================================================================

set -e

GREEN='\033[0;32m'
SKY='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

clear
echo -e "${SKY}==================================================================${NC}"
echo -e "${GREEN}  📲 التثبيت والإعداد التلقائي الشامل في Termux (أندرويد)${NC}"
echo -e "${SKY}  Telegram Bot & Web Studio (Dual Architecture)${NC}"
echo -e "${SKY}==================================================================${NC}\n"

# 1. طلب إذن الوصول إلى وحدة التخزين الداخلية للهاتف ومجلد التنزيلات
echo -e "${YELLOW}[1/6] طلب صلاحية الوصول لوحدة التخزين الداخلية (مجلد Downloads)...${NC}"
termux-setup-storage 2>/dev/null || true
sleep 1

# 2. تحديث مستودعات Termux وتثبيت الحزم المطلوبة
echo -e "\n${YELLOW}[2/6] تحديث حزم Termux وتثبيت الأدوات الأساسية (Git, Python, Node.js)...${NC}"
pkg update -y && pkg upgrade -y
pkg install -y git python nodejs-lts clang make libjpeg-turbo libcrypt

# 3. التحقق من وجود مجلد المشروع أو الانتقال إليه
echo -e "\n${YELLOW}[3/6] التحقق من مسار المشروع والمستودع...${NC}"
REPO_DIR="$HOME/Booooot_ADMAN"

if [ ! -d "$REPO_DIR" ]; then
    echo -e "   جاري استنساخ المستودع من GitHub لأول مرة..."
    git clone https://github.com/mstfy737216610-prog/Booooot_ADMAN.git "$REPO_DIR"
    cd "$REPO_DIR"
else
    echo -e "   المشروع موجود مسبقاً، جاري الانتقال وسحب أحدث التحديثات..."
    cd "$REPO_DIR"
    git pull origin master || true
fi

# 4. تثبيت مكتبات بايثون المطلوبة
echo -e "\n${YELLOW}[4/6] تثبيت مكتبات بايثون (Telethon, Requests, Dotenv, Feedparser)...${NC}"
pip install --upgrade pip
pip install -r requirements.txt || pip install requests python-dotenv telethon feedparser

# 5. تثبيت مكتبات Node.js وواجهة الويب
echo -e "\n${YELLOW}[5/6] تثبيت مكتبات واجهة الويب (npm install)...${NC}"
npm install --legacy-peer-deps

# 6. ضبط أذونات التشغيل وتشغيل النظام
echo -e "\n${YELLOW}[6/6] تهيئة إذن التشغيل لكافة سكربتات التشغيل...${NC}"
chmod +x *.sh 2>/dev/null || true

echo -e "\n${GREEN}==================================================================${NC}"
echo -e "${GREEN}  ✅ اكتمل الإعداد بنجاح تام!${NC}"
echo -e "${SKY}  • رابط واجهة الويب على هاتفك:  http://localhost:3000${NC}"
echo -e "${SKY}  • ملفات الهاتف المتزامنة:       /sdcard/Download/TelegramBot/${NC}"
echo -e "${GREEN}==================================================================${NC}\n"

# تشغيل النظام مباشرة
exec bash start.sh
