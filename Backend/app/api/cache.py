import time

_store: dict = {}


def get(key: str):
    entry = _store.get(key)
    if entry and time.monotonic() < entry["exp"]:
        return entry["val"]
    return None


def set(key: str, val, ttl: int = 120):
    _store[key] = {"val": val, "exp": time.monotonic() + ttl}


def invalidate(key: str):
    _store.pop(key, None)
