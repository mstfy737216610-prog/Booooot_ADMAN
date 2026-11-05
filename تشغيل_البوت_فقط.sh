#!/bin/bash
# ==============================================================================
# سكربت تشغيل محرك بايثون وتيليجرام وتويتر فقط (Bot Engine Only)
# يعمل بشكل مستقل ومباشر في الطرفية (Termux / Linux) مع حماية التراجع الزمني (Backoff)
# مناسب للتشغيل كخدمة خلفية 24/7 دون الحاجة لواجهة الويب
# ==============================================================================

GREEN='\033[0;32m'
SKY='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd "$(dirname "$0")"

echo -e "${SKY}==================================================================${NC}"
echo -e "${GREEN}  🤖 تشغيل محرك تيليجرام وتويتر الأكاديمي المستقل (Bot Engine Only)${NC}"
echo -e "${SKY}  النمط: مستقل ومنفصل 100% 24/7 | حماية Backoff من التوقف المفاجئ${NC}"
echo -e "${SKY}==================================================================${NC}\n"

if ! command -v python3 &>/dev/null; then
    echo -e "${RED}❌ python3 غير مثبت على جهازك!${NC}"
    exit 1
fi

RETRY_DELAY=5
MAX_DELAY=60

while true; do
    START_TIME=$(date +%s)
    echo -e "${GREEN}🚀 بدء تشغيل محرك بايثون (python3 main.py)...${NC}"
    python3 main.py
    EXIT_CODE=$?
    END_TIME=$(date +%s)
    RUN_DURATION=$((END_TIME - START_TIME))

    echo -e "${YELLOW}⚠️ توقف محرك بايثون (رمز الخروج: $EXIT_CODE | استمر التشغيل: ${RUN_DURATION} ثانية)${NC}"

    if [ $EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✅ انتهت عملية البوت بنجاح وطبيعياً.${NC}"
        break
    fi

    if [ $RUN_DURATION -gt 30 ]; then
        RETRY_DELAY=5
    else
        RETRY_DELAY=$((RETRY_DELAY * 2))
        if [ $RETRY_DELAY -gt $MAX_DELAY ]; then
            RETRY_DELAY=$MAX_DELAY
        fi
    fi

    echo -e "${YELLOW}🔄 إعادة التشغيل التلقائي مع تأخير وقائي (Backoff) بعد ${RETRY_DELAY} ثوانٍ...${NC}"
    sleep $RETRY_DELAY
done
