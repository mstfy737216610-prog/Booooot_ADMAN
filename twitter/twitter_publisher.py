"""
==============================================================================
وحدة نشر بطاقات وتغريدات تويتر المستقلة (Twitter Publisher & Card Designer)
==============================================================================
1. توليد بطاقات أكاديمية فائقة الدقة (1080x1350) بالخط العربي المعتمد (Tajawal).
2. تطبيق هوية وقالب الحساب والشعار وشريط التمييز اللوني.
3. دمج ونشر الوسائط بطريقة آمنة بدون API رسمي.
==============================================================================
"""

import sys
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import twitter_engine as te
from ai_engine.ai_memory import record_post_processed

logger = logging.getLogger("TwitterPublisher")


def create_and_publish_card(
    title: str,
    body: str,
    account_info: Optional[Dict[str, Any]] = None,
    width: int = 1080,
    height: int = 1350
) -> Dict[str, Any]:
    """
    تصميم بطاقة إعلانية جامعية بدقة 1080x1350 وحفظها وتسجيلها في الذاكرة
    """
    try:
        local_path, web_url = te.render_student_card(
            title=title,
            body_text=body,
            account=account_info,
            width=width,
            height=height
        )
        record_post_processed(
            text=f"{title}\n{body}",
            platform="twitter_card",
            source_id=web_url,
            channel=account_info.get("username", "@StudentVoice") if account_info else "@StudentVoice",
            status="published"
        )
        return {
            "ok": True,
            "local_path": local_path,
            "web_url": web_url,
            "message": "تم تصميم وحفظ البطاقة الأكاديمية بنجاح فائق الدقة."
        }
    except Exception as e:
        logger.error(f"❌ خطأ أثناء تصميم بطاقة تويتر: {e}")
        return {"ok": False, "error": str(e)}
