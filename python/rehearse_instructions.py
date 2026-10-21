"""Local operator tool: rehearse instruction saves, print readback, discard clone.

Uses local filesystem authority, not an HTTP identity provider. Never expose
this CLI as an authenticated service. Input and output may contain owner data.
"""
import argparse
import json
import sys
from dots_engineering.contracts import Rejected
from dots_engineering.instruction_rehearsal import InstructionRehearsal


def main(rehearsal_type=InstructionRehearsal, mode="disposable_instruction_rehearsal"):
    parser = argparse.ArgumentParser(description="Rehearse local operations on a disposable snapshot; never an authentication service.")
    parser.add_argument("--source", required=True, help="Explicit authorized legacy SQLite source; opened read-only")
    parser.add_argument("--scratch-root", required=True, help="Existing private scratch directory")
    parser.add_argument("--owner", required=True, help="Expected owner of this isolated database")
    args = parser.parse_args()
    try:
        raw = sys.stdin.buffer.read(240001)
        if len(raw) > 240000:
            raise Rejected("Input too large", 413)
        try:
            operations = json.loads(raw)
        except (json.JSONDecodeError, UnicodeDecodeError) as error:
            raise Rejected("Invalid operation JSON", 400) from error
        if not isinstance(operations, list) or not 1 <= len(operations) <= 20:
            raise Rejected("Provide 1–20 operations", 400)
        with rehearsal_type(args.source, args.scratch_root, args.owner, args.owner) as rehearsal:
            results = []
            for operation in operations:
                try:
                    results.append({"status": 200, "body": rehearsal.save(args.owner, operation)})
                except Rejected as error:
                    results.append({"status": error.status, "error": str(error)})
            output = {"mode": mode, "sourceModified": False,
                      "externalExecution": False, "snapshotFileHash": rehearsal.snapshot_file_hash,
                      "results": results, "finalWork": rehearsal.read(args.owner)}
        output["scratchRemoved"] = True
        print(json.dumps(output))
    except Rejected as error:
        print(json.dumps({"status": error.status, "error": str(error)}))
        return 1
    except Exception:
        print(json.dumps({"status": 503, "error": "Rehearsal unavailable; no application writer was changed."}))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
