"""
العقل المدبر - النواة الإدراكية والذكاء التحليلي للجامعات والطلاب
Mastermind AI Engine & Cognitive Learning Hub
يدير عُقد المعرفة، الفحص الأكاديمي، منع التوليد الوهمي، والرد على قضايا الطلاب
"""

from __future__ import annotations

import os
import sys
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("BrainMastermind")

BASE_DIR = Path(__file__).resolve().parent

# هيكل الذاكرة المعرفية للعقل المدبر
MASTERMIND_KNOWLEDGE_BASE = {
    "version": "4.2.0",
    "updated_at": datetime.now().isoformat(),
    "constitution": {
        "identity": "الممثل الأكاديمي وصوت الطالب المعتمد ورفيق مسيرته الجامعية",
        "zero_hallucination": [
            "يمنع منعاً باتاً اختلاق أي موعد، ساعة، يوم، أو نسبة غير مذكورة نصاً في المصدر المعتمد.",
            "إذا سأل الطالب عن موعد غير معلن، يجب التصريح بوضوح: 'لم تعلن العمادة الموعد رسمياً بعد'.",
            "عزل الجامعات واللهجات: لكل جامعة مسارها وقناتها المستقلة حصرياً.",
            "حظر الروابط الوهمية: عدم طباعة أي رابط إلا إذا كان رابطاً حقيقياً معتمداً للبوابة الأكاديمية.",
            "استبعاد أي إعلانات تجارية أو خدمات حل واجبات مدفوعة مخالفة للوائح الجامعية."
        ]
    },
    "universities": {
        "جامعة_نجران": {
            "name": "جامعة نجران",
            "country": "المملكة العربية السعودية",
            "portal_url": "https://edugate.nu.edu.sa",
            "twitter_handle": "@Najran_Students",
            "target_channel": "@jhdhhdcj",
            "theme_color": "#0284c7",
            "key_regulations": {
                "غياب_وحرمان": "يحرم الطالب من دخول الاختبار النهائي إذا تجاوزت نسبة غيابه 25% من مجموع الساعات المقررة دون عذر مقبول.",
                "مكافأة_جامعية": "تصرف المكافأة بنهاية كل شهر ميلادي للطلبة السعوديين المنتظمين وفق المدة النظامية للكلية.",
                "حذف_وإضافة": "يتم الحذف والإضافة عبر البوابة الإلكترونية وفق المواعيد المعلنة لكل مستوى أكاديمي.",
                "أعذار_طبية": "ترفع الأعذار الطبية عبر بوابة النظام الأكاديمي خلال 5 أيام عمل من تاريخ الانقطاع."
            }
        },
        "جامعة_الملك_سعود": {
            "name": "جامعة الملك سعود",
            "country": "المملكة العربية السعودية",
            "portal_url": "https://edugate.ksu.edu.sa",
            "twitter_handle": "@KSU_StudentVoice",
            "target_channel": "@jhdhhdcj",
            "theme_color": "#059669",
            "key_regulations": {
                "غياب_وحرمان": "تطبق نسبة الحرمان 25% تلقائياً عبر النظام في حال عدم اعتماد الأعذار الأكاديمية من عمادة الكلية.",
                "مكافأة_جامعية": "إيداع المكافأة في حسابات الطلبة المنتظمين في اليوم 27 من كل شهر ميلادي.",
                "تحويل_داخلي": "يشترط للتحويل اجتياز السنة الأولى بمعدل تراكمي لا يقل عن الحد الأدنى المحدد لكل كلية."
            }
        },
        "جامعة_AUM": {
            "name": "جامعة الشرق الأوسط الأمريكية (AUM)",
            "country": "دولة الكويت",
            "portal_url": "https://www.aum.edu.kw",
            "twitter_handle": "@AUM_StudentHub",
            "target_channel": "@jhdhhdcj",
            "theme_color": "#d97706",
            "key_regulations": {
                "نظام_الدراسة": "التعليم الجامعي باللغة الإنجليزية، وتقديم طلبات الإرشاد عبر بوابة Moodle و Banner Links.",
                "المواعيد": "الاعتماد الحصري على التقويم الأكاديمي الصادر عن مسجل الجامعة (Registrar)."
            }
        }
    },
    "student_concerns_rubric": [
        {
            "topic": "المكافأة الجامعية والمساعدات المالية",
            "priority": "قصوى",
            "rule": "التأكيد على شرط الانتظام، وتوضيح أثر الإنذار الأكاديمي على صرف المكافأة."
        },
        {
            "topic": "الحرمان والغياب والأعذار الطبية",
            "priority": "قصوى",
            "rule": "تنبيه الطالب برفع العذر خلال 5 أيام وقبل بلوغ نسبة 25% لتفادي الحرمان النهائي."
        },
        {
            "topic": "الحذف والإضافة والاعتذار عن الفصل",
            "priority": "عالية",
            "rule": "التحذير من إغلاق الشعب والتأكيد على مراجعة المرشد الأكاديمي بالكلية."
        },
        {
            "topic": "التحويل الداخلي والمعدلات التراكمية",
            "priority": "عالية",
            "rule": "توضيح شروط المعدل وسعة الكليات مع توجيه الرابط للبوابة الرسمية حصراً."
        }
    ]
}


class BrainMastermind:
    """العقل المدبر لإدارة الذكاء التحليلي والربط المعرفي"""

    def __init__(self):
        self.data = dict(MASTERMIND_KNOWLEDGE_BASE)

    def get_university_info(self, university_name: str) -> Optional[Dict[str, Any]]:
        """استرجاع بيانات الجامعة ولائحتها الرسمية"""
        for k, v in self.data["universities"].items():
            if k in university_name or v["name"] in university_name:
                return v
        return self.data["universities"].get("جامعة_نجران")

    def format_student_response(self, question: str, university_name: str) -> str:
        """توليد إجابة من المعرفة المعتمدة بدون هلوسة"""
        info = self.get_university_info(university_name)
        regs = info.get("key_regulations", {}) if info else {}

        q = question.lower()
        if "مكافأة" in q or "مكافاه" in q or "فلوس" in q:
            rule = regs.get("مكافأة_جامعية", "تصرف المكافأة بنهاية كل شهر ميلادي للطلبة المنتظمين.")
            return f"حياك الله زميلنا 🌹\nبخصوص المكافأة في {info['name']}:\n• {rule}\nفالك التوفيق والنجاح 🤲"

        if "حرمان" in q or "غياب" in q or "عذر" in q:
            rule = regs.get("غياب_وحرمان", "نسبة الحرمان 25% من مجموع ساعات المقرر.")
            return f"أهلاً بك 🌹\nبشأن الغياب والأعذار في {info['name']}:\n• {rule}\n• سارع برفع عذرك الطبي عبر البوابة الإلكترونية قبل رصد الحرمان."

        if "تحويل" in q:
            rule = regs.get("تحويل_داخلي", "يشترط اجتياز الساعات المقررة بمعدل تنافسي.")
            return f"مرحباً بك 🌹\nشروط التحويل في {info['name']}:\n• {rule}\n• التقديم متاح إلكترونياً عبر: {info['portal_url']}"

        return f"أهلاً بك زميلنا في {info['name']} 🌹\nنحن هنا دائماً لصوت الطالب ومساعدتك في مسيرتك الأكاديمية.\nيمكنك متابعة بوابة الجامعة المعتمدة: {info['portal_url']}"

    def export_brain_files(self, target_dir: Path):
        """تصدير ملفات العقل المدبر كاملة للمجلد المحدد"""
        target_dir.mkdir(parents=True, exist_ok=True)

        # 1. ملف العقل المدبر JSON
        json_file = target_dir / "العقل_المدبر.json"
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)

        # 2. ملف الدستور المعرفي وقواعد الذكاء Markdown
        md_file = target_dir / "دستور_العقل_المدبر_وقواعد_الذكاء.md"
        with open(md_file, "w", encoding="utf-8") as f:
            f.write(f"""# 🧠 دستور العقل المدبر الأكاديمي (Mastermind Constitution)
تاريخ التحديث: {datetime.now().strftime('%Y-%m-%d %H:%M')}
النسخة: {self.data['version']}

## 1. الهوية والروح:
{self.data['constitution']['identity']}

## 2. ضوابط حاسمة لمنع التوليد الوهمي (Zero Hallucination Rules):
""" + "\n".join(f"- {r}" for r in self.data['constitution']['zero_hallucination']) + f"""

## 3. سلم قضايا الطلاب الحقيقية (Student Concerns Rubric):
""" + "\n".join(f"### • {c['topic']} (أولوية: {c['priority']})\nالقاعدة: {c['rule']}\n" for c in self.data['student_concerns_rubric']) + """
""")

        logger.info(f"✅ تم تصدير ملفات العقل المدبر إلى: {target_dir}")


mastermind = BrainMastermind()

if __name__ == "__main__":
    out = BASE_DIR / "ملف_النشر" / "العقل_المدبر"
    mastermind.export_brain_files(out)
    print("Mastermind brain exported successfully!")
