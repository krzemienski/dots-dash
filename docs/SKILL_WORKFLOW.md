# Skill discovery, use and improvement

This is a maintained project workflow, not an installed-skill reader, automatic
invocation service or background job. Use [skill-use-review](../.agents/skills/skill-use-review/SKILL.md)
for a requested skill audit or a demonstrated routing/use gap. Use
[session-intent-review](../.agents/skills/session-intent-review/SKILL.md) for selected
session evidence and session-accountability behavior. Routine unrelated edits
need neither skill. An explicitly requested available skill still takes priority.

## Selection and ownership

Discover filenames and manifest candidates before reading bodies. Keep a private
per-root inventory with observation time, enumerated boundaries, pending directory
cursors, exclusions, symlinks not followed, errors, size/mtime/hash and source
classification. A file hit is not proof a host loaded it; a manifest candidate is
not proof a plugin is active. Disk uid is not edit authorization. Permission errors
remain gaps; do not retry through another route. Keep private/runtime directories
excluded, including case variants of credential directory names.

Select by concrete outcome, not keyword frequency or catalog size. Same-name
skills can have different versions and instructions; identify the chosen source
and hash. Matching SKILL.md bytes alone do not prove equal referenced files or
runtime behavior. A skill's external-action suggestions do not expand current
permission. Installed/vendor assets stay read-only unless separately authorized;
project improvements require known ownership and a safe single-writer checkout.

For this project, the observed gap was missing persistent evidence of **manual
skill use**, despite an existing distinction between checklist selection and
execution. The narrow correction adds routing boundaries and an evidence record;
it does not claim that every available skill is relevant or automatically invoked.

## Evidence record

Append a record to an existing verification ledger after a meaningful workflow.
For private work, use ignored owner-private storage. A public record uses repository
links or opaque references and omits machine inventories and private instructions.
Keep old records bound to their original skill/input/source hashes; append feedback
and corrections rather than rewriting previous outcomes. Suggested fields:

| Field | Meaning |
|---|---|
| task / outcome | Authorized user goal and observable acceptance |
| skillRef / skillHash | Exact chosen entrypoint; pin relevant reference hashes too |
| source / ownershipBasis | Provider/project origin and evidence authorizing any edit |
| routingReason / alternatives | Why selected; relevant candidates declined and why |
| available | Located/exposed at an observation time; host activation may be unknown |
| selected | Chosen for this task, with rationale |
| read | Entry/reference version actually read and when |
| applied | Specific decision or artifact shaped by that guidance; otherwise false/unknown |
| verification | Observed outcome, evidence reference, source/input binding and pass/fail/gap |
| executionBasis | Manual guidance, structural check, checklist receipt or provider receipt |
| feedback / revision | Demonstrated issue and narrow change, or no change warranted |
| limits / nextImprovement | Remaining coverage/behavior gaps and concrete next task |

These are separate claims, not a status ladder that advances automatically.
`verification` may be a gap despite application. A catalog hit can remain merely
available. A successful structural validator cannot verify routing, and routing
exercises cannot verify a production workflow. Do not call self-reported manual
application an independently verified invocation.

## Persistent improvement cycle

For skill work, read the available Skill Creator guidance before authoring. Start
with a real missed trigger, excessive trigger or workflow failure. Capture the
expected outcome, apply a small project-owned change, exercise realistic positive
and negative requests, and record what happened. Structural validation complements
that exercise. If a skill already fits, keep it unchanged. Do not bulk-rewrite
vendor copies, create filler skills or add global activation/configuration changes.

The [initial evidence ledger](verification/skill-workflow.json) records the actual
manual routing exercise and bounded source audit performed for this revision.
Further use should append evidence with fresh hashes and observed outcomes; it
must not copy a prior pass into a claim that a new workflow ran. A host may discover
project skills normally, but this document cannot guarantee activation by every
agent or retrospectively establish which installed skills were used.
