#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# مشغل البوت الأكاديمي والجامعي الذكي لبيئة Termux مع حماية إعادة التشغيل التلقائي 24/7
# يدعم سحب التحديثات من GitHub وتشغيل واجهة الويب ومحرك تيليجرام معاً
# ==============================================================================

set -e

# ألوان العرض
GREEN='\033[0;32m'
SKY='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${SKY}==================================================================${NC}"
echo -e "${GREEN}  👑 [Termux Studio] تشغيل النظام الأكاديمي الجامعي المزدوج${NC}"
echo -e "${SKY}  المشرف العام: @M_S_F_G | المستودع: Booooot_ADMAN${NC}"
echo -e "${SKY}==================================================================${NC}"

# الانتقال لمسار المشروع
cd "$(dirname "$0")"

# 1. سحب التحديثات من GitHub تلقائياً
echo -e "\n${YELLOW}📡 سحب أحدث التحديثات من مستودع GitHub (فرع main)...${NC}"
git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || true

# 2. مزامنة التخزين الداخلي للهاتف وحزمة ملف_النشر
python3 -c "
import database as db
import publish_files_manager as pfm
db.sync_all_storages()
pfm.build_and_sync_publish_package()
print('✅ تمت مزامنة ملف_النشر في مجلد التنزيلات بالهاتف.')
" 2>/dev/null || true

echo -e "\n${SKY}  🌐 رابط واجهة التحكم الموحدة على هاتفك:${NC}"
echo -e "${YELLOW}     👉 http://localhost:3000${NC}"
echo -e "${SKY}  📁 مسار ملفات النشر على هاتفك: /sdcard/Download/ملف_النشر${NC}\n"

# 3. تشغيل الواجهتين معاً (واجهة الويب + محرك تيليجرام في الخلفية)
if command -v npm &>/dev/null; then
    echo -e "${GREEN}🚀 جاري تشغيل واجهة الويب (Port 3000) ومحرك تيليجرام وتويتر معاً...${NC}"
    exec npm run dev
else
    # في حال عدم توفر node/npm، تشغيل محرك بايثون وتيليجرام فقط بنمط الاستمرار
    echo -e "${YELLOW}ℹ️ تشغيل محرك بايثون وتيليجرام بنمط الاستمرار 24/7...${NC}"
    while true; do
        python3 main.py
        EXIT_CODE=$?
        echo "⚠️ توقف البوت مع كود: $EXIT_CODE"
        if [ $EXIT_CODE -eq 0 ]; then
            break
        fi
        echo "🔄 إعادة التشغيل التلقائي خلال 5 ثوانٍ..."
        sleep 5
    done
fi

