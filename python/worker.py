"""Fixed stdin/stdout worker launched only by the authenticated Node host."""
import json
import sys
from dots_engineering.contracts import Rejected
from dots_engineering.runner import LocalChecklistRunner
from dots_engineering.service import Service
from dots_engineering.legacy_read import read_legacy
from dots_engineering.context_links import handle_context
from dots_engineering.source_inventory import handle_inventory
from dots_engineering.snapshot_associations import handle_associations
from dots_engineering.owner_reviews import handle_owner_reviews
from dots_engineering.request_claims import handle_claims
from dots_engineering.operation_lookup import lookup_operation


def main():
    try:
        data = sys.stdin.buffer.read(300001)
        if len(data) > 300000:
            raise Rejected("Request too large", 413)
        envelope = json.loads(data)
        if envelope.get("mode", "engineering") == "legacy_read":
            result = read_legacy(envelope["database"], envelope["owner"], envelope["principal"],
                                 envelope["method"], envelope.get("body"))
        elif envelope.get("mode", "engineering") == "engineering" and envelope["method"] == "OPERATION_LOOKUP":
            result = lookup_operation(envelope["database"], envelope["owner"], envelope["principal"],
                                      envelope.get("body"), envelope.get("allowOperationLookup") is True)
        elif envelope.get("mode", "engineering") == "engineering" and envelope["method"] in ("CLAIMS_GET", "CLAIMS_POST"):
            result = handle_claims(envelope["database"], envelope["owner"], envelope["principal"],
                                   envelope["method"], envelope.get("body"), envelope.get("sources"),
                                   envelope.get("allowRequestActionClaims") is True)
        elif envelope.get("mode", "engineering") == "engineering" and envelope["method"] in ("REPORT_GET", "REPORT_POST"):
            result = handle_owner_reviews(envelope["database"], envelope["owner"], envelope["principal"],
                                           envelope["method"], envelope.get("body"), envelope.get("allowOwnerReviewReports") is True)
        elif envelope.get("mode", "engineering") == "engineering" and envelope["method"] in ("ASSOCIATION_GET", "ASSOCIATION_POST"):
            result = handle_associations(envelope["database"], envelope["owner"], envelope["principal"],
                                         envelope["method"], envelope.get("body"), envelope.get("allowSnapshotAssociations") is True)
        elif envelope.get("mode", "engineering") == "engineering" and envelope["method"] in ("COVERAGE_GET", "COVERAGE_POST"):
            result = handle_inventory(envelope["database"], envelope["owner"], envelope["principal"],
                                      envelope["method"], envelope.get("body"), envelope.get("allowSourceInventory") is True)
        elif envelope.get("mode", "engineering") == "engineering" and envelope["method"] in ("CONTEXT_GET", "CONTEXT_POST"):
            result = handle_context(envelope["database"], envelope["owner"], envelope["principal"],
                                    envelope["method"], envelope.get("body"), envelope.get("sources"),
                                    envelope.get("allowContextLinks") is True)
        elif envelope.get("mode", "engineering") == "engineering":
            service = Service(envelope["database"], envelope["owner"], envelope["allowImport"],
                              LocalChecklistRunner() if envelope["allowRunner"] else None,
                              envelope.get("allowOperationLookup") is True)
            result = service.handle(envelope["principal"], envelope["method"], envelope.get("body"))
        else:
            raise Rejected("Unsupported worker mode", 400)
        response = {"status": 200, "body": result}
    except Rejected as error:
        response = {"status": error.status, "body": {"error": str(error)}}
    except Exception:
        # Never echo exception values, private paths, payloads or credentials.
        response = {"status": 503, "body": {"error": "Operation not confirmed. Refresh before retrying."}}
    sys.stdout.write(json.dumps(response))


if __name__ == "__main__":
    main()
