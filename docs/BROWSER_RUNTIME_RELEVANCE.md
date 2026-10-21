# On-demand dependency and environment relevance

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Local branch: `feature/local-runtime-relevance`. Verified runtime source revision:
`87dae3019f86976c63c8a4be91f3ebe10a371790`.

The owned receipt view now adds a read-only dependency/environment assessment.
Each refresh or page read compares the permitted recorded inputs again. A proven
change marks this assessment stale; missing bindings, unavailable bytes and
unmeasurable fields remain unknown. The historical result, receipt hash,
environment fingerprint, source attribution and review coverage do not change.
No monitoring, execution, automatic rerun or receipt mutation was added.

## Allowlist and host binding

The [acceptance definition](verification/browser-runtime-relevance-scenarios.md)
was written before implementation and lists every permitted dependency path.
The [measurement module](../server/browser-runtime-relevance.mjs) reads only ten
fixed React, React DOM and scheduler files if their hashes occur in the original
build-input manifest. It uses the existing explicit measurement root. Recorded
source/build recipe files remain covered by the separate source assessment.
Unrecognized dependency names produce unknown coverage and are never opened.
This is neither full package inventory nor dependency discovery.

The host may supply `runtimeMeasurement` to `createBrowserReceiptReader`:

| Binding | Compared with the immutable receipt |
| --- | --- |
| `nodeExecutable` | `environment.nodeExecutableHash` |
| `pythonExecutable` | `environment.pythonExecutableHash` |
| `browserExecutable` | `environment.browserLauncherHash` |
| `playwrightModule` | Canonical whole-library hash and package version |
| `includeHostFacts: true` | Node process version, platform, architecture and OS release |

These are explicit canonical absolute host paths to the same inputs measured by
the producer. No API query, export or receipt supplies a runtime path. Bindings
are optional and unconfigured by default; no CLI environment-variable discovery
or global settings were added. The existing standard server still has no runtime
bindings, so its runtime coverage stays unknown unless its host integration
explicitly supplies them. Node version is available only when the bound Node
executable is the current reader process executable. No program or imported
module is executed for a measurement.

Symlinks/noncanonical runtime bindings and nonregular files are unknown. Reads
are bounded: dependency/library files at 32 MB each, runtime executables at
256 MB each, library traversal at 5,000 entries, depth 30 and 128 MB total.
The library digest uses the producer's canonical file-map algorithm. File paths
outside the dependency allowlist and all absolute runtime paths are omitted
from the response. Comparisons are deduplicated per manifest/environment within
one request, with no cross-request cached match.

Python and browser version strings, viewport, locale and timezone cannot be
established by these file reads. Historical builder Node/esbuild versions do not
establish a new build. Those seven fields remain explicitly unknown. Accordingly,
unchanged measurable inputs yield matching dependency/field results and **unknown
overall coverage**, not complete environment verification. A proven difference
still takes precedence as stale, with unknown fields retained alongside it.

## Actual user workflow and persisted evidence

The workflow record (historical local artifact omitted from the public package)
contains a fresh actual completed receipt, each read-only API projection, a
persisted owner observation and cleanup results. The verification index (historical local artifact omitted from the public package)
binds source/artifact hashes. A fresh owned browser and loopback viewer used
sanitized TEST DATA and isolated Node/Python/SQLite storage. The viewer imported
the matching sanitized review through the actual UI. Measurement changes were
made only to disposable copies; changed executable bytes were never executed.

| Performed case | Observed outcome |
| --- | --- |
| Unchanged inputs | Ten dependency files and nine measurable runtime/host fields matched; seven unmeasurable fields remained unknown |
| Changed dependency copy | React entry file identified as changed; assessment stale; original completed/pass and receipt hash preserved |
| Changed Python executable copy | `pythonExecutableHash` changed; stale, without running that copy |
| Changed Playwright package bytes without version change | Library hash changed while the parsed version still matched |
| Missing dependency, Python copy and Playwright package file | Each became unknown, including library hash; no cached match survived |
| Dependency symlink | Unknown; the symlink target was not accepted for measurement |
| No runtime bindings | Runtime fields unknown while dependency comparisons still matched |
| Restored copies and repeated reads | Measured fields matched again; unmeasurable fields stayed unknown |
| Owner observation, reload and readback | Report retained `owner_reported`/gap; review version 2 remained distinct from receipt coverage at version 1 |
| Immutable history and no automatic execution | Same one-run ledger and receipt hash throughout; receipt content, ledger bytes and producer application database bytes unchanged |
| Narrow viewport and cleanup | No horizontal overflow or application JavaScript errors; owned browser/server/coordinator closed and disposable storage removed |

Screenshots: unchanged (historical local artifact omitted from the public package),
changed dependency (historical local artifact omitted from the public package),
changed runtime (historical local artifact omitted from the public package),
unavailable (historical local artifact omitted from the public package), and
mobile (historical local artifact omitted from the public package).
The rendered readback (historical local artifact omitted from the public package)
retains the visible field comparisons and attribution.

Two earlier verification attempts are retained: noncanonical disposable host
bindings correctly produced unknowns; a later attempt completed the measurement
cases but tried to fill a still-collapsed observation form. Both cleaned up their
owned resources. Correcting the verification setup required no application code
change. The final workflow completed the full acceptance sequence. Viewer
observations remain separate from the producer's fixed workflow receipt.
Typecheck, production build, module syntax and diff checks passed separately;
no test files or test runner were added.

## Precise limits

This is a time-stamped read, not a filesystem snapshot, watcher, proof of live
process memory or semantic impact analysis. The browser launcher hash does not
cover the whole browser installation; executable hashes do not cover dynamically
loaded libraries. Only recorded allowlisted build dependencies are compared,
not every installed package. Same-user mutable host storage remains the existing
trust boundary; this is not remote attestation. Unsupported fields stay unknown
rather than invoking programs or requesting new access. Production verification,
lost-coordinator recovery and broader V310 acceptance remain open. No production
writer, Python/storage schema, compatibility policy, prior receipt or historical
branch changed. Nothing was pushed, published or deployed.
