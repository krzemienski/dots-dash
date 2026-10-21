"""Exact millisecond comparison matching lib/work/history-time.mjs.

This is a comparison value, never a replacement for source evidence strings.
"""
import re
from datetime import datetime, timezone
from .contracts import Rejected


def snapshot_instant(value):
    message = "Invalid snapshot timestamp; explicit reconciliation required"
    if not isinstance(value, str) or not re.fullmatch(
            r"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,3})?(?:Z|[+-][0-9]{2}:[0-9]{2})", value):
        raise Rejected(message, 400)
    if not value.endswith("Z") and (int(value[-5:-3]) > 23 or int(value[-2:]) > 59):
        raise Rejected(message, 400)
    if int(value[11:13]) > 23 or int(value[14:16]) > 59 or int(value[17:19]) > 59:
        raise Rejected(message, 400)
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if (parsed.year, parsed.month, parsed.day) != (int(value[:4]), int(value[5:7]), int(value[8:10])):
            raise Rejected(message, 400)
        delta = parsed - datetime(1970, 1, 1, tzinfo=timezone.utc)
        return delta.days * 86400000 + delta.seconds * 1000 + delta.microseconds // 1000
    except ValueError as error:
        raise Rejected(message, 400) from error
