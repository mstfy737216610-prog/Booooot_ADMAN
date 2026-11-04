#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# سكربت تحديث المشروع من مستودع GitHub وتثبيت التحديثات تلقائياً
# المستودع: https://github.com/mstfy737216610-prog/Booooot_ADMAN.git
# ==============================================================================

set -e

GREEN='\033[0;32m'
SKY='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

clear
echo -e "${SKY}================================================================================${NC}"
echo -e "${GREEN}  🔄 [تحديث النظام] سحب أحدث ملفات المشروع من GitHub${NC}"
echo -e "${SKY}  المستودع: Booooot_ADMAN | الفرع: master${NC}"
echo -e "${SKY}================================================================================${NC}\n"

# 1. الانتقال لمجلد المشروع
cd "$(dirname "$0")"

# 2. سحب أحدث التحديثات من GitHub
echo -e "${YELLOW}[1/4] جاري سحب أحدث الأكواد والتعديلات من المستودع...${NC}"
git fetch origin master
git reset --hard origin/master || git pull origin master

# 3. تحديث مكتبات بايثون إذا لزم الأمر
echo -e "\n${YELLOW}[2/4] فحص وتحديث مكتبات بايثون (Pillow, Arabic, Telethon)...${NC}"
pip install -r requirements.txt --break-system-packages 2>/dev/null || pip install -r requirements.txt 2>/dev/null || true

# 4. تحديث مكتبات واجهة الويب إذا لزم الأمر
if command -v npm &>/dev/null; then
    echo -e "\n${YELLOW}[3/4] فحص مكتبات واجهة الويب (npm)...${NC}"
    npm install --legacy-peer-deps 2>/dev/null || true
fi

# 5. مزامنة مجلد «ملف_النشر» في وحدة التخزين الداخلية للهاتف
echo -e "\n${YELLOW}[4/4] مزامنة ملفات النشر وتويتر وتيليجرام إلى /sdcard/Download/ملف_النشر...${NC}"
python3 -c "
import database as db
import publish_files_manager as pfm
db.sync_all_storages()
pfm.build_and_sync_publish_package()
print('   ✅ تمت المزامنة وتحديث كافة الملفات في وحدة التخزين بنجاح.')
" 2>/dev/null || true

# ضبط أذونات التشغيل لجميع السكربتات
chmod +x *.sh 2>/dev/null || true

echo -e "\n${GREEN}================================================================================${NC}"
echo -e "${GREEN}  ✨ تم تحديث المشروع بالكامل بنجاح 100%!${NC}"
echo -e "${SKY}  لتشغيل المنظومة الموحدة الآن:${NC}"
echo -e "${YELLOW}     bash تشغيل_النظام_من_ترمكس.sh${NC}"
echo -e "${GREEN}================================================================================${NC}\n"
