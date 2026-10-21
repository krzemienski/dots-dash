# Python runner decision and supported boundaries

> Historical design and implementation context. See [current scoped verification](../verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Research date: 2026-10-16. Only official documentation was used. No SDK was
installed or given credentials; no model call or external agent ran.

| Candidate | Documented interface | Decision for this slice |
|---|---|---|
| OpenAI Agents SDK Python | `Runner.run`, `run_sync`, `run_streamed`, run state, tools and guardrails | Candidate provider adapter; not configured |
| Claude Agent SDK Python | Python query/client API and permission/tool configuration | Candidate coding-agent adapter; not configured |
| Google ADK | Runner runtime coordinates agent execution and services | Candidate adapter; not configured |

Sources: [OpenAI running agents](https://openai.github.io/openai-agents-python/running_agents/),
[Claude Python SDK](https://code.claude.com/docs/en/agent-sdk/python), and
[Google ADK runtime](https://adk.dev/runtime/).

The spoken phrase **“40-agent SDK runner” is unresolved**. These sources do not
identify a product with that name, nor establish a requested concurrency of
40. Do not silently choose a vendor, install packages, create 40 agents or
infer access to an existing assistant session. Confirm the intended SDK and
permitted runtime before implementing a live provider adapter.

The current boundary is a Python `RunnerAdapter` protocol with capability
discovery and a shipped, deterministic `LocalChecklistRunner`. It runs only
three declarative evidence-presence checks against imported data. Its actual
receipt is honest local execution, not an LLM/SDK run or the invocation of a
full user-owned skill. The default is unconfigured.

Future providers must preserve owner/project/workspace scope, pinned code and
skill revisions, action hash and authorization, request idempotency, resource
budgets, tool allowlists, private trace handling, unknown-outcome reconciliation
and cancellation that confirms child termination. SDK convenience APIs do not
replace those application boundaries. Disable external tracing unless its
destination and data are separately authorized. An imported instruction or
selected skill cannot expand a provider's capability grant.
