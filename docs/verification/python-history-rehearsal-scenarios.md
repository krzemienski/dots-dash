# History rehearsal acceptance before implementation

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `9ca433e33a52192779bf9f5bcdf23d1727342d80`. Apply the project-owned
session-intent-review workflow. Only selected synthetic inputs and disposable
SQLite snapshots are permitted. Node remains the application writer.

| User outcome | Performed operation | Expected observation |
|---|---|---|
| Review a linked history snapshot | Import all nine supported history groups | Readback preserves source references, classifications and redacted text; correspondence delivery stays not_established |
| Retry a batch safely | Submit the same batch twice | Same marker/hash, replayed:true, no extra versions or audit entries |
| Detect altered replay | Reuse batch ID with changed content | 400 as in Node; no partial changes |
| Preserve newer evidence | Import older/equal timestamps with new batch IDs, then a newer snapshot | Older/equal record data/version unchanged; newer data increments version once; every accepted batch has a marker |
| Preserve source identity | Correspondence with matching configured account and known opportunity | Accepted; wrong/missing account or unknown opportunity rejected before writes |
| Reject malformed input | Bad/duplicate IDs, invalid dates, missing fields, wrong types, invalid lists, oversized payload | 400/413; no partial records or markers |
| Keep source links safe | HTTPS links, Gmail thread identity, credential-bearing/non-HTTPS/query links | Supported links preserved; unsafe or unsupported links rejected; no fetching |
| Keep privacy boundaries explicit | Pre-redacted text and unknown synthetic fields | Redacted text preserved; unknown fields excluded from records; no automatic free-text sanitization claim |
| Keep effects atomic | Force audit insertion failure on scratch | Record updates, audit entries and batch marker roll back; recovery succeeds |
| Serialize import retries | Concurrent identical or conflicting batch IDs | One import plus replay, or one success plus conflict; single marker |
| Preserve existing work | Read tasks/instructions and counts before/after | Preserved records and counts unchanged |
| Retain isolation | Wrong principal, mixed owner, closed rehearsal, source hash and cleanup | Denied access, unchanged source, disposable files removed |
| Preserve application boundary | Invoke unconfigured app import and unsupported Python worker mode | Import stays disabled; worker rejects rehearsal mode |

Compare canonical cases with real Node API calls on separate synthetic SQLite
copies. Exclude generated timestamps from cross-writer comparison. No browser
claim, private source discovery, test files, credentials or external operations.
Known date/URL/JSON representation differences must be reported, not hidden.
