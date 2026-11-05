"""
==============================================================================
وحدة كشط وسحب تغريدات تويتر المستقلة بدون API رسمي (Twitter Crawler Engine)
==============================================================================
1. تستخدم مكتبة twscrape المعتمدة على الكوكيز الحقيقية للمستخدم (auth_token & ct0).
2. تعمل بدون أي مفاتيح مدفوعة أو واجهات رسمية (No API).
3. فحص التكرار التام عبر ai_memory لمنع سحب أو تكرار نفس التغريدة.
4. دعم تدوير البروكسيات للحماية من الحظر.
==============================================================================
"""

import sys
import asyncio
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import twitter_engine as te
from ai_engine.ai_memory import is_post_duplicate, record_post_processed
from twitter.twitter_proxy import proxy_rotator

logger = logging.getLogger("TwitterCrawler")


def fetch_account_tweets_clean(handle: str, limit: int = 15, custom_cookies: Optional[str] = None) -> Dict[str, Any]:
    """
    سحب أحدث التغريدات الحقيقية لحساب معين مع التحقق من عدم التكرار.
    """
    clean_h = handle.lstrip("@").strip()
    if not clean_h:
        return {"ok": False, "error": "اسم الحساب فارغ.", "tweets": []}

    logger.info(f"🐦 [Twitter Crawler] جلب أحدث تغريدات @{clean_h} عبر twscrape...")
    
    # استدعاء محرك twscrape المعتمد
    res = te.fetch_tweets(clean_h, limit=limit, custom_cookies=custom_cookies)
    if not res.get("ok"):
        return res

    raw_tweets = res.get("tweets", [])
    filtered_tweets = []

    for t in raw_tweets:
        t_id = t.get("id") or ""
        t_text = t.get("text") or ""
        
        # فحص هل تم سحبها مسبقاً
        if is_post_duplicate(t_text, source_id=t_id):
            continue

        filtered_tweets.append(t)
        # تسجيلها في الذاكرة لمنع تكرارها
        record_post_processed(t_text, platform="twitter", source_id=t_id, channel=f"@{clean_h}", status="crawled")

    logger.info(f"✅ [Twitter Crawler] تم سحب {len(filtered_tweets)} تغريدة جديدة غير مكررة لـ @{clean_h}")
    return {
        "ok": True,
        "target": f"@{clean_h}",
        "count": len(filtered_tweets),
        "total_crawled": len(raw_tweets),
        "tweets": filtered_tweets
    }
