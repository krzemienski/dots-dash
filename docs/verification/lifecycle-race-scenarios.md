# Lifecycle races: acceptance before implementation

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `b518ce4adb572f5d2e92220189966a8ca3bc1fcc`. Clean checkout, one
worktree and absent Git index lock checked before editing; no unrelated process
inspection. Prior branch preserved. Reuse session-intent-review.

1. Pause cleanup immediately after its settled-worker check. Concurrent launch
   must not obtain a child while cleanup can delete that child's database.
   Either launch wins and cleanup rejects, or cleanup owns the lifecycle and
   launch rejects. Persist the actual baseline outcome before fixing any defect.
2. Use the same serialized boundary for launch, dispatch preparation, controller
   restart, reconciliation, handoff, parking and cleanup. Concurrent operations
   must reject without reporting completed transfer/cleanup across one another.
3. Verify a live owned worker keeps storage and handoff blocked; an uncertain
   durable row continues blocking after lifecycle locks are released. Acquiring
   a lock never confirms process exit or authorizes retry.
4. Verify locks work across actual owned processes, release when their owner
   exits, and preserve epoch fencing. Denial must not spawn an untracked process,
   duplicate effects, delete storage or rewrite uncertain state.
5. Verify normal receipt reconciliation, confirmed owned exit, handoff, park,
   resume and cleanup still work. Source data and compatibility contracts stay
   unchanged. Evidence must distinguish actual process/storage workflows from
   injected scheduling barriers and from browser behavior.

All data is synthetic and disposable. No test files/runners, browser, external
agents, production changes or publication. Owned processes must be stopped and
waited through their original handles before fixture teardown. No new recovery,
retry, force-clear or PID-derived authority.
