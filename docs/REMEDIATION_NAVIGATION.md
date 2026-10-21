# Remediation context and return navigation

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Follow-up: [journey acceptance review](JOURNEY_ACCEPTANCE_REVIEW.md) fixes an
unqualified historical assessment after an observation is recorded, without
changing status semantics or closing the independent-verification gate.

Baseline: `d970d9bc8a428cfdbf2b7e8068808099e0b4e2b6`. Prior branches
preserved; clean checkout and absent Git index lock checked before edits.
This scoped UI change follows the repository session-intent-review workflow
and the user-owned Playwright skill. [Acceptance scenarios](verification/remediation-navigation-scenarios.md)
preceded code and baseline browser inspection.

## User impact

Each remediation card now identifies its linked goal and offers **View goal**
and **Record verification**. The first moves focus to the goal and acceptance
steps; the second opens the matching evidence form and focuses its first field.
Back buttons return to the initiating remediation, including after saving.
Repeated visits update the return destination even when cards share one goal.

Each card separately shows **No checklist receipt for this remediation** or a
count and **View latest checklist receipt**. The link uses that task's actual
saved run, with its pinned skill revision. Receipt cards return to their own
task. Selecting a skill creates no invocation claim. Goal-less drift shows
unresolved scope and offers no invented verification target. Existing event
source links still navigate to their source record.

Navigation uses local component state, namespaced DOM anchors and focus/scroll
targets. It does not change the page's workspace hash, backend contract,
authorization, capability settings, receipt history, observation attribution,
remediation status or compatibility policy. Return context is not persisted
across a full page reload; choosing a card again establishes its return path.

## Actual browser workflow

The baseline was inspected in a newly created headless Chrome profile, using a
loopback-only development host, real React assets, Node APIs, the fixed Python
worker and temporary SQLite. A controlled synthetic principal was injected only
into that ephemeral verification host. No credentials, production login,
application tabs or external agents were used. Sandbox allowances were needed
for the local server and browser daemon. No test files/runners were created.

The labeled synthetic export (historical local artifact omitted from the public package)
was imported through the rendered form. Its two goals produced seven remediation
cards. In the baseline, none had goal, verification or receipt navigation controls.
The baseline screenshot (historical local artifact omitted from the public package)
records that view.

Observed after implementation:

1. Four goal round trips covered the first task, another task sharing its goal,
   a second goal, and the original task again. Focus and return IDs matched.
   The original claim source link still focused its event. Goal-less drift had
   no verification control.
2. Selecting the applicable checklist produced no receipt. Explicitly authorizing
   the enabled local checklist produced one real receipt. Two receipt round trips
   returned to its task; the other task continued to show no receipt.
3. Verification opened and focused the correct form. After manually collapsing
   it, navigation from a different card sharing that goal reopened it and updated
   the return destination.
4. Performed browser steps were saved once as an owner-reported observation.
   The return button reached the original card. Reloading the page, reopening
   Session review and reading the goal displayed the persisted report. The first
   receipt remained byte-for-byte unchanged and remediation stayed
   reviewed_not_remediated.
5. A second explicit checklist authorization produced a new latest receipt.
   Its acceptance was pass with owner_reported attribution and still
   not_independently_verified. The older missing-observation receipt remained.
6. Tab/Enter activated goal and return navigation. Receipt/form/return actions
   also worked at 390×844; measured page width was 390, with no horizontal
   overflow. Desktop screenshots were also inspected.
7. Final browser/API readback showed review version 5, two goals, seven tasks,
   two receipts and one observation. Six cards correctly still lacked receipts.

Machine-readable observations (historical local artifact omitted from the public package)
record the actual IDs, results and immutable receipt comparison. Screenshots:
navigation (historical local artifact omitted from the public package),
form (historical local artifact omitted from the public package),
receipt history (historical local artifact omitted from the public package),
persisted observation (historical local artifact omitted from the public package),
narrow viewport (historical local artifact omitted from the public package).
The final accessible snapshot (historical local artifact omitted from the public package)
also contains only synthetic records.

One driver lookup for the Result label timed out before submission. A fresh
snapshot identified the combobox; the corrected role-based interaction confirmed
zero prior observations and submitted once. No product change was made for that
driver issue. Console output contained only the development host's missing
favicon 404; no application JavaScript error was observed.

The isolated browser and server were closed successfully; their temporary
profile and databases were removed. Only selected labeled evidence artifacts
remain in the checkout. Typecheck, build and diff checks passed separately.

## Limits

This verifies the synthetic local browser journey, not production authentication,
provider SDK execution, full-skill invocation or independent product truth.
No real mobile device, full screen-reader audit, failed-network/version-conflict
browser recovery, or cross-review return-state scenario was exercised. The user
still owns application browser tabs and publication decisions. Node remains the
live writer; input compatibility choices remain unanswered and unchanged.
