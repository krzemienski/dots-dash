"""Explicit operator migration; never invoked by HTTP requests."""
import argparse
from dots_engineering.request_claims import migrate
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--database', required=True)
parser.add_argument('--owner', required=True)
args = parser.parse_args()
migrate(args.database, args.owner)
print('Action claim companion ready; no claims, source access or execution created.')
