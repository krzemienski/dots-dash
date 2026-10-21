# On-demand dependency and environment relevance acceptance

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `8913b6f0914dc9f735c950f2aee0a989c143201d`.
Defined before implementation using `OwnedBrowserReceipts.start`, its input
manifest, and the existing owner-bound read-only projection.

## Exact permitted inputs

- Existing source/bundle measurement remains separate and unchanged.
- Dependency bytes: only the recorded build-input hashes for these files beneath
  the already selected measurement root: `node_modules/react/jsx-runtime.js`,
  `node_modules/react/index.js`, `node_modules/react/cjs/react.production.js`,
  `node_modules/react/cjs/react-jsx-runtime.production.js`,
  `node_modules/react-dom/client.js`, `node_modules/react-dom/index.js`,
  `node_modules/react-dom/cjs/react-dom-client.production.js`,
  `node_modules/react-dom/cjs/react-dom.production.js`,
  `node_modules/scheduler/index.js`, and
  `node_modules/scheduler/cjs/scheduler.production.js`.
  Unrecognized recorded dependencies are unknown and are never opened. No
  dependency discovery, installation, resolution or evaluation is permitted.
- Explicit host bindings for the same runtime inputs the producer records:
  Node executable hash, Python executable hash, browser launcher hash,
  Playwright package version and canonical whole-library hash. Bindings are
  host-only; paths cannot arrive through an API request or imported evidence.
  Reads reject symlinks and enforce file/count/total-byte bounds.
- With explicit host-fact opt-in: current process Node version (only if its
  executable is the configured Node binding), platform, architecture and OS
  release. No environment-variable inventory or machine identity is read.
- Python version, browser version, viewport, locale and timezone remain unknown:
  executable bytes are not proof of version or a newly launched context. The
  recorded build-tool versions describe historical production, not a new build;
  current builder version observations remain unknown. No commands, module loads,
  browser launch or rerun may be performed by the assessment.

Every field compares only against its original recorded value. Missing bindings,
missing/unsafe/oversized files and unsupported fields are explicit unknowns.
Any proven difference makes the new assessment stale; otherwise any unknown
makes it unknown. Matching measured fields remain visible alongside unknown
coverage. The original receipt/result/hash and owner/import attribution never
change. Measurement time is read time, not continuous validity.

## Actual end-user outcomes

1. Produce a fresh completed fixed browser receipt with owned disposable
   resources. Import its sanitized matching review into a fresh isolated viewer.
2. Refresh the rendered view with unchanged permitted inputs. Recorded dependency
   hashes and safely measurable environment fields match; unmeasurable version/
   context/build fields stay unknown. Preserve the historical pass and receipt.
3. Change a copied recorded dependency, then refresh. Show its changed identity,
   stale assessment and original pass/hash. Restore the copy and refresh again.
4. Change a copied runtime executable, then refresh. Show the changed named
   runtime input and stale assessment without executing it. Restore it.
5. Remove a copied dependency/runtime input, then refresh. Show unknown coverage;
   do not claim success or retain a stale cached match. Restore and reread.
6. Leave runtime bindings unconfigured and reject an unsafe symlink in disposable
   measurement storage: unknown, with no path disclosure or execution.
7. Repeat reads, save an owner-reported observation, reload and inspect SQLite/API
   readback: receipt and producer database bytes remain unchanged; owner reports
   retain their attribution and version boundary. No additional runs are started.
8. Capture a narrow viewport, empty JavaScript-error list and cleanup confirmation.

Use the project session-intent-review and owned Playwright workflow. No test
files, production/application tabs, external writes, monitoring, automatic reruns,
new source discovery, credentials or compatibility-policy changes.
