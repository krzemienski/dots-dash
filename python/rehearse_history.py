"""Rehearse sanitized history batches on disposable storage using local file authority.

--owner and --source-account are expected bindings, not authentication or consent.
No production write route, source discovery, network access or redactor exists.
"""
import argparse
import json
import sys
from dots_engineering.contracts import Rejected
from dots_engineering.history_rehearsal import HistoryRehearsal


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True)
    parser.add_argument("--scratch-root", required=True)
    parser.add_argument("--owner", required=True)
    parser.add_argument("--source-account", help="Expected account for correspondence in the selected sanitized export")
    args = parser.parse_args()
    try:
        raw = sys.stdin.buffer.read(900001)
        if len(raw) > 900000:
            raise Rejected("Input too large", 413)
        try:
            def no_duplicates(pairs):
                value = {}
                for key, item in pairs:
                    if key in value:
                        raise ValueError("Duplicate JSON key")
                    value[key] = item
                return value
            batches = json.loads(raw, object_pairs_hook=no_duplicates,
                                 parse_constant=lambda _: (_ for _ in ()).throw(ValueError("Nonfinite JSON")))
        except (ValueError, UnicodeDecodeError, RecursionError) as error:
            raise Rejected("Invalid batch JSON", 400) from error
        if not isinstance(batches, list) or not 1 <= len(batches) <= 20:
            raise Rejected("Provide 1–20 history batches", 400)
        with HistoryRehearsal(args.source, args.scratch_root, args.owner, args.owner, source_account=args.source_account) as rehearsal:
            results = []
            for batch in batches:
                try:
                    results.append(dict(status=200, body=rehearsal.save(args.owner, batch)))
                except Rejected as error:
                    results.append(dict(status=error.status, error=str(error)))
            output = dict(mode="disposable_history_rehearsal", sourceModified=False, externalExecution=False,
                          snapshotFileHash=rehearsal.snapshot_file_hash, results=results, finalWork=rehearsal.read(args.owner))
        output["scratchRemoved"] = True
        print(json.dumps(output))
        return 0
    except Rejected as error:
        print(json.dumps(dict(status=error.status, error=str(error))))
        return 1
    except Exception:
        print(json.dumps(dict(status=503, error="Rehearsal unavailable; no application writer was changed.")))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
