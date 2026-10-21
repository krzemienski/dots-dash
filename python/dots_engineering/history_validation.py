"""Bounded canonical counterpart of lib/work/history-validation.mjs.

Inputs must already be sanitized. No URL fetching or free-text redaction occurs.
Timezone-bearing ISO snapshot/event times, safe
integral JSON numbers and query-free HTTPS links form the supported subset.
"""
import json
import math
import re
from datetime import datetime
from urllib.parse import urlsplit
from .contracts import Rejected
from .instruction_rehearsal import JS_WHITESPACE, utf16_length
from .history_time import snapshot_instant

GROUPS = dict(opportunities="opportunity", correspondence="correspondence", coverage="coverage",
              projects="project", artifacts="artifact", schedule="schedule", commitments="commitment",
              observations="observation", engineering="engineering")


def require(condition):
    if not condition:
        raise Rejected("Request rejected: invalid or conflicting input", 400)


def string(value, limit=4000, blank=False):
    return isinstance(value, str) and utf16_length(value) <= limit and (blank or bool(value.strip(JS_WHITESPACE)))


def event_stamp(value):
    """Validate supported ISO forms without rewriting their source text."""
    try:
        snapshot_instant(value)
        return True
    except Rejected:
        return False


def day(value):
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        return False
    try:
        datetime.strptime(value, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def verified(value):
    return value is None or event_stamp(value) or day(value)


def url(value):
    if not isinstance(value, str) or utf16_length(value) >= 5000 or any(c.isspace() or ord(c) < 32 for c in value) or "\\" in value:
        return False
    try:
        parsed = urlsplit(value)
        hostname = parsed.hostname or ""
        # Deliberately limit the rehearsal to ordinary ASCII DNS hostnames.
        # urllib accepts malformed percent-encoded hosts that WHATWG URL rejects.
        dns = re.fullmatch(r"[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?", hostname)
        return (value.startswith("https://") and bool(dns) and parsed.username is None
                and parsed.password is None and not parsed.query and "?" not in value
                and (parsed.port is None or 0 < parsed.port < 65536))
    except ValueError:
        return False


def gmail(value):
    return url(value) and bool(re.fullmatch(r"https://mail\.google\.com/mail/#all/[a-zA-Z0-9]+", value))


def array(value, limit, predicate):
    return isinstance(value, list) and len(value) <= limit and all(predicate(v) for v in value)


def canonical_json(value):
    """Match JSON.stringify for the explicitly bounded JSON input domain."""
    def bounded(x, depth=0):
        require(depth <= 30)
        if x is None or type(x) is bool:
            return x
        if type(x) is int:
            require(abs(x) <= 2**53 - 1)
            return x
        if type(x) is float:
            require(math.isfinite(x) and x.is_integer() and abs(x) <= 2**53 - 1)
            # JSON.stringify uses one numeric type: 1.0 => 1 and -0.0 => 0.
            return int(x)
        if isinstance(x, str):
            require(not any(0xD800 <= ord(c) <= 0xDFFF for c in x))
            return x
        if isinstance(x, list):
            return [bounded(v, depth + 1) for v in x]
        require(isinstance(x, dict) and all(isinstance(k, str) for k in x))
        def index(k):
            return bool(re.fullmatch(r"0|[1-9][0-9]{0,9}", k)) and int(k) < 2**32 - 1
        keys = sorted((k for k in x if index(k)), key=int) + [k for k in x if not index(k)]
        return {bounded(k, depth + 1): bounded(x[k], depth + 1) for k in keys}
    return json.dumps(bounded(value), ensure_ascii=False, separators=(",", ":"), allow_nan=False)


def validate_history(body, source_account=None):
    require(isinstance(body, dict) and string(body.get("batchId"), 120) and event_stamp(body.get("verifiedAt")))
    rows, ids = [], set()
    for group, kind in GROUPS.items():
        items = body.get(group, [])
        require(isinstance(items, list) and len(items) <= 200 and len(rows) + len(items) <= 350)
        for x in items:
            require(isinstance(x, dict) and string(x.get("id"), 600) and bool(re.fullmatch(r"[a-zA-Z0-9_.:-]+", x["id"]))
                    and "verifiedAt" in x and verified(x["verifiedAt"]))
            identifier = kind + ":" + x["id"]
            require(identifier not in ids)
            ids.add(identifier)
            data = dict(id=x["id"], verifiedAt=x["verifiedAt"], snapshotReviewedAt=body["verifiedAt"])

            def field(key, predicate):
                require(key in x and predicate(x[key]))
                data[key] = x[key]

            def strings(**limits):
                for key, limit in limits.items():
                    field(key, lambda v: string(v, limit))

            def choice(key, values):
                field(key, lambda v: isinstance(v, str) and v in values.split())

            def optional(key, limit, default=None):
                value = x.get(key)
                data[key] = value.encode("utf-16-le")[:limit * 2].decode("utf-16-le", errors="surrogatepass") if isinstance(value, str) else default

            def links():
                field("sourceUrls", lambda v: array(v, 30, url))

            if kind == "opportunity":
                strings(title=500, organization=300, status=200, nextStep=4000)
                choice("category", "role consulting project_advice unknown")
                choice("classificationBasis", "explicit inferred")
                field("summary", lambda v: string(v, 4000, True))
                field("threadUrls", lambda v: array(v, 20, gmail))
                optional("sourceStatus", 200)
                optional("counterpartyEmail", 500)
            elif kind == "correspondence":
                strings(opportunityId=600, messageId=300, threadId=300, subject=1000, summary=4000)
                field("threadUrl", gmail)
                require(x["threadUrl"].endswith("/" + x["threadId"]) and x["id"] == "gmail-" + x["messageId"])
                field("channel", lambda v: v == "email")
                field("sourceAccount", lambda v: string(source_account, 500) and v == source_account)
                choice("direction", "outbound inbound")
                choice("status", "sent received cancelled")
                choice("evidence", "provider_send_receipt mailbox_message")
                require(x["status"] != "sent" or x["direction"] == "outbound")
                require(x["status"] != "received" or x["direction"] == "inbound")
                field("participants", lambda v: array(v, 20, lambda s: string(s, 400)))
                field("occurredAt", lambda v: v is None or event_stamp(v))
                field("occurredDate", lambda v: v is None or day(v))
                data["delivery"] = "not_established"
            elif kind == "commitment":
                strings(title=500, requestSummary=8000, nextStep=8000)
                choice("status", "completed partial pending blocked paused needs_user")
                for key in ("completedSummary", "pendingSummary"):
                    field(key, lambda v: string(v, 8000, True))
                field("needsUser", lambda v: type(v) is bool)
                field("requestedAt", verified)
                links()
                for key, limit in dict(owner=300, blocker=4000, evidenceLevel=1000, userSourceMessageId=300).items():
                    optional(key, limit)
                data["followupNeeded"] = x.get("followupNeeded") is True
                for key in ("relatedOpportunityIds", "relatedTaskIds", "relatedProjectIds", "relatedScheduleIds"):
                    field(key, lambda v: array(v, 50, lambda s: string(s, 600)))
            elif kind == "observation":
                strings(title=500, status=200, known=8000, unknown=8000, nextStep=8000, owner=300)
                field("requested", lambda v: v is False)
                links()
            elif kind == "engineering":
                strings(title=500, status=300, summary=8000, verifiedEvidence=8000, gaps=8000, nextStep=8000)
                choice("evidenceType", "historical_pass missing_proof recorded_failure metadata_only partial")
                field("revision", lambda v: v is None or string(v, 100))
                field("sourceRefs", lambda v: array(v, 30, lambda s: string(s, 1000)))
                links()
            elif kind == "coverage":
                strings(label=300, state=200, summary=8000)
            elif kind == "project":
                strings(title=500, status=200, summary=8000)
                choice("category", "open_source professional personal unknown")
                choice("classificationBasis", "explicit inferred")
                field("nextStep", lambda v: v is None or string(v))
                links()
                optional("relationship", 1000)
            elif kind == "artifact":
                strings(title=500, summary=8000)
                field("url", url)
                choice("kind", "resume portfolio github other")
            elif kind == "schedule":
                strings(title=500, timeZone=100, status=200, summary=8000, nextStep=4000, sourceLabel=500)
                choice("kind", "confirmed_event inferred_deadline")
                field("sourceUrl", lambda v: v is None or url(v))
                field("startAt", lambda v: v is None and day(x.get("startDate")) if x.get("allDay") is True else event_stamp(v))
                field("endAt", lambda v: v is None or event_stamp(v))
                data["calendarScope"] = "organization_subscription" if x.get("calendarScope") == "organization_subscription" else "personal"
                optional("participation", 200, "unknown")
                optional("calendarName", 300)
                optional("location", 500)
                require(x.get("joinUrl") is None or x.get("joinUrl") == "" or url(x["joinUrl"]))
                data["joinUrl"] = x.get("joinUrl") or None
                data["needsUser"] = x.get("needsUser") is True
                data["allDay"] = x.get("allDay") is True
                for key in ("startDate", "endDate"):
                    require(x.get(key) is None or x.get(key) == "" or day(x[key]))
                    data[key] = x.get(key) or None
            rows.append(dict(id=identifier, kind=kind, data=data))
    require(bool(rows))
    return rows
