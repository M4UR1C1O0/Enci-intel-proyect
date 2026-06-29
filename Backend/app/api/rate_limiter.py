import threading
from collections import defaultdict
from datetime import datetime, date, timezone
from typing import Literal

_lock = threading.Lock()
_counts: dict[str, dict[str, int]] = defaultdict(dict)

DAILY_LIMIT = 50  # chat endpoints


def _window_key(window: Literal["minute", "hour", "day"]) -> str:
    now = datetime.now(timezone.utc)
    if window == "minute":
        return now.strftime("%Y-%m-%dT%H:%M")
    if window == "hour":
        return now.strftime("%Y-%m-%dT%H")
    return str(date.today())


def check_and_increment(
    uid: str,
    limit: int = DAILY_LIMIT,
    window: Literal["minute", "hour", "day"] = "day",
) -> bool:
    key = _window_key(window)
    with _lock:
        user_counts = _counts[uid]
        count = user_counts.get(key, 0)
        if count >= limit:
            return False
        user_counts[key] = count + 1
    return True
