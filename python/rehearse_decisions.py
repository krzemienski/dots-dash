"""Rehearse approval decisions on new disposable snapshots, never the app store.

Uses explicit local filesystem authority; --owner is not an identity provider.
Only decision requests are supported. No external execution is implemented.
"""
from dots_engineering.decision_rehearsal import DecisionRehearsal
from rehearse_instructions import main


if __name__ == "__main__":
    raise SystemExit(main(DecisionRehearsal, "disposable_decision_rehearsal"))
