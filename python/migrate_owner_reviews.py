"""Explicit local operator migration. Never called by an HTTP request."""
import argparse
from dots_engineering.owner_reviews import migrate

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--database", required=True)
parser.add_argument("--owner", required=True)
args = parser.parse_args()
migrate(args.database, args.owner)
print("Owner review companion schema ready; no reports or source access created.")
