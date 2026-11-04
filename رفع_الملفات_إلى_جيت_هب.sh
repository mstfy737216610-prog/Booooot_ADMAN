#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# سكربت رفع التحديثات إلى مستودع GitHub (Booooot_ADMAN)
# الفرع الأساسي: main
# ==============================================================================

set -e

GREEN='\033[0;32m'
SKY='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

clear
echo -e "${SKY}================================================================================${NC}"
echo -e "${GREEN}  🚀 [رفع التحديثات إلى GitHub] مستودع: Booooot_ADMAN${NC}"
echo -e "${SKY}  الفرع: main | المشرف: @M_S_F_G${NC}"
echo -e "${SKY}================================================================================${NC}\n"

cd "$(dirname "$0")"

# 1. فحص توكن GitHub
GH_TOKEN="${1:-$GITHUB_TOKEN}"

if [ -z "$GH_TOKEN" ]; then
    echo -e "${YELLOW}🔑 سبب عدم إمكانية الرفع بدون توكن:${NC}"
    echo -e "   منصة GitHub أوقفت كلمات المرور العادية منذ عام 2021 وتطلب"
    echo -e "   رمز وصول شخصي (Personal Access Token) يبدأ بـ ghp_ بصلاحية (repo).\n"
    
    echo -e "${SKY}📌 كيفية استخراج التوكن في دقيقة واحدة:${NC}"
    echo -e "   1. ادخل على: https://github.com/settings/tokens"
    echo -e "   2. اضغط 'Generate new token (classic)'"
    echo -e "   3. ضع علامة صح ✅ على صلاحية [repo]"
    echo -e "   4. انسخ التوكن (يبدأ بـ ghp_...)\n"
    
    read -p "ألصق التوكن الخاص بك هنا واضغط Enter: " INPUT_TOKEN
    GH_TOKEN="$INPUT_TOKEN"
fi

if [ -z "$GH_TOKEN" ]; then
    echo -e "\n${RED}❌ لم يتم إدخال التوكن؛ تم إلغاء عملية الرفع.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}📦 تجهيز وتوثيق كافة الملفات المحدثة...${NC}"
git config --global user.name "Mstfy" 2>/dev/null || true
git config --global user.email "aum.ku.s1@gmail.com" 2>/dev/null || true
git config --global --add safe.directory "$PWD" 2>/dev/null || true

git branch -M main 2>/dev/null || true
git add -A

COMMIT_MSG="تحديث تلقائي شامل: تويتر المتعدد، استوديو البطاقات، العقل المدبر، وحزمة ملف النشر"
git commit -m "$COMMIT_MSG" 2>/dev/null || echo "لا توجد تعديلات جديدة للتوثيق"

echo -e "\n${YELLOW}📡 جاري رفع الملفات إلى مستودع GitHub (فرع main)...${NC}"
AUTHED_REMOTE="https://${GH_TOKEN}@github.com/mstfy737216610-prog/Booooot_ADMAN.git"

if git push "$AUTHED_REMOTE" main; then
    echo -e "\n${GREEN}================================================================================${NC}"
    echo -e "${GREEN}  🎉 تم رفع التحديثات بالكامل إلى مستودع GitHub بنجاح!${NC}"
    echo -e "${SKY}  رابط المستودع المحدث: https://github.com/mstfy737216610-prog/Booooot_ADMAN${NC}"
    echo -e "${GREEN}================================================================================${NC}\n"
else
    echo -e "\n${RED}⚠️ تعذر الرفع؛ يرجى التأكد من صلاحية التوكن واختيار صلاحية [repo] عند إنشائه.${NC}"
    exit 1
fi
