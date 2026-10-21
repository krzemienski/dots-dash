# Remediation navigation acceptance before implementation

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `d970d9bc8a428cfdbf2b7e8068808099e0b4e2b6`. Clean checkout, no
Git index lock, sole implementation worktree; preserve prior branches. Apply
the repository session-intent-review workflow and user-owned Playwright skill.

1. Inspect the current local UI in a newly allocated development browser/profile
   using only synthetic export data and disposable SQLite. Establish the current
   navigation gap before changing UI code. Never attach to application tabs.
2. From a remediation card, open its associated goal/acceptance steps and return
   to that same card. Repeat between different tasks, including shared goals;
   focus and return destination must follow the latest navigation.
3. From a task with no run, show no receipt honestly. Selecting a checklist is
   not invocation. After explicitly authorizing the enabled local checklist,
   navigate to that task's actual receipt and back. Do not show another task's
   receipt or imply provider/skill execution beyond the declarative checklist.
4. From the card, open its goal's verification form, record steps actually
   performed in this isolated browser and save an owner-reported observation.
   Return to the original task after save, then reload and read the persisted
   observation through the UI. Historical receipts and remediation semantics
   remain unchanged; a saved observation is not independent verification.
5. A task without a goal shows unresolved scope and no invented goal/form link.
   Existing source-event navigation remains usable. Repeated navigation must
   reopen a collapsed verification form and work after state refresh.
6. Inspect desktop and a smaller viewport, capture actual browser evidence and
   report gaps. No test files/runners, production identity, provider runs,
   credentials, external agents, publication, compatibility changes or outside
   application tabs. This authorizes only the isolated local development browser.
