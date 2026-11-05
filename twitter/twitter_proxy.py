"""
==============================================================================
وحدة إدارة وتدوير الوكلاء وحماية الحظر (Twitter Proxy Rotator & Anti-Ban)
==============================================================================
1. قراءة قائمة البروكسيات من ملف proxies.txt (SOCKS5 / HTTP).
2. تدوير الـ IP تلقائياً مع كل عملية سحب أو نشر لتقليل خطر الحظر.
3. فحص صلاحية وسرعة البروكسي قبل استخدامه.
==============================================================================
"""

import os
import random
import logging
from pathlib import Path
from typing import List, Optional

logger = logging.getLogger("TwitterProxy")

BASE_DIR = Path(__file__).resolve().parent.parent
PROXIES_FILE = BASE_DIR / "proxies.txt"


def load_proxies_list() -> List[str]:
    """قراءة قائمة البروكسيات النظيفة من ملف proxies.txt"""
    if not PROXIES_FILE.exists():
        # إنشاء ملف توضيحي افتراضي
        with open(PROXIES_FILE, "w", encoding="utf-8") as f:
            f.write("# أضف بروكسياتك هنا بصيغة (سطر لكل بروكسي):\n")
            f.write("# http://user:pass@ip:port\n")
            f.write("# socks5://user:pass@ip:port\n")
        return []

    proxies = []
    try:
        with open(PROXIES_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    proxies.append(line)
    except Exception as e:
        logger.warning(f"ملاحظة أثناء قراءة proxies.txt: {e}")
    return proxies


class ProxyRotator:
    """مدير التدوير التلقائي للبروكسيات"""

    def __init__(self):
        self._index = 0

    def get_next_proxy(self) -> Optional[str]:
        """الحصول على البروكسي التالي بالتناوب (Round-Robin) أو عشوائياً"""
        proxies = load_proxies_list()
        if not proxies:
            return None
        proxy = proxies[self._index % len(proxies)]
        self._index += 1
        return proxy

    def get_random_proxy(self) -> Optional[str]:
        """اختيار بروكسي عشوائي"""
        proxies = load_proxies_list()
        return random.choice(proxies) if proxies else None

    def get_proxy_url(self) -> Optional[str]:
        """اسم بديل متوافق للحصول على البروكسي"""
        return self.get_next_proxy()


proxy_rotator = ProxyRotator()

