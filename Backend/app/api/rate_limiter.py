import threading
from collections import defaultdict
from datetime import date

DAILY_LIMIT = 50
_lock = threading.Lock()
_counts: dict[str, dict[str, int]] = defaultdict(dict)


def check_and_increment(uid: str) -> bool:
    today = str(date.today())
    with _lock:
        user_counts = _counts[uid]
        count = user_counts.get(today, 0)
        if count >= DAILY_LIMIT:
            return False
        user_counts[today] = count + 1
    return True
