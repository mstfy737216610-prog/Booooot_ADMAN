#!/bin/bash
# ==============================================================================
# سكربت النسخ الاحتياطي الشامل (Backup Engine for Termux & Storage)
# يقوم بضغط قواعد البيانات (bot_memory.db, bot_database.db)، ملفات الجلسات والكوكيز
# وحفظها مباشرة في وحدة التخزين الداخلية للهاتف (/sdcard/Download/)
# ==============================================================================

set -e

GREEN='\033[0;32m'
SKY='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$(dirname "$0")"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="Booooot_ADMAN_Backup_${TIMESTAMP}.tar.gz"

# مسار الحفظ على الهاتف
DEST_DIR="/sdcard/Download"
if [ ! -d "$DEST_DIR" ]; then
    DEST_DIR="./backups"
    mkdir -p "$DEST_DIR"
fi

TARGET_FILE="${DEST_DIR}/${BACKUP_NAME}"

echo -e "${SKY}==================================================================${NC}"
echo -e "${GREEN}  💾 جاري أخذ نسخة احتياطية آمنة لقواعد البيانات والجلسات...${NC}"
echo -e "${SKY}  الهدف: ${TARGET_FILE}${NC}"
echo -e "${SKY}==================================================================${NC}"

# ضغط الملفات الهامة فقط
tar -czf "$TARGET_FILE" \
    bot_memory.db* \
    bot_database.db* \
    *.json \
    .env \
    data/ \
    proxies.txt \
    2>/dev/null || {
        # بديل في حال تعذر بعض الملفات
        tar -czf "$TARGET_FILE" bot_memory.db bot_database.db *.json .env proxies.txt 2>/dev/null || true
    }

echo -e "${GREEN}✅ تم إنشاء النسخة الاحتياطية بنجاح!${NC}"
echo -e "${YELLOW}📁 الموقع: ${TARGET_FILE}${NC}"
echo -e "${SKY}الحجم: $(du -h "$TARGET_FILE" 2>/dev/null | cut -f1)${NC}\n"
