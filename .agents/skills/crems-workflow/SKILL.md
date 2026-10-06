---
name: crems-workflow
description: Route CREMS repository maintenance, implementation, review and Home Assistant release work to the right code, task scope and verification. Use inside CREMS; do not use for unrelated artifact creation or as authorization for browser or deployment actions.
---

# CREMS workflow router

Find the current bounded step in TASKS.md and read AGENTS.md plus applicable requirements/ADR decisions before changing files. The current task has one production writer and a recorded write set; preserve existing working-tree changes.

Use the [repository map](../../../docs/guides/repository-map.md) for code entrypoints and folder boundaries. Load the role relevant to the work: [reviewer](../../../AGENT_A_ARCHITECT_REVIEWER.md), [implementer](../../../AGENT_B_IMPLEMENTER.md), or [QA](../../../AGENT_C_UX_BROWSER_QA.md). A role is a responsibility, not an automatic subagent or model switch. Delegation follows the user's authorization and project rules.

## Select a route

- UI/navigation/CSV/report: inspect App.tsx and the specific client/controller/serializer plus its web tests; consult core only when calculation semantics change.
- Energy/CSV/battery/tariff calculation: inspect the relevant packages/core module, its pure tests and the governing ADR.
- Meter/price/history: inspect bridge route/service/source and matching web response parser; measured, estimated and incomplete stay distinct.
- Storage/refresh/delete: read the [storage plan](../../../docs/central-storage-plan.md), relevant local/central validators and mutation/component tests. Use synthetic data; do not read personal runtime storage for general orientation.
- Pi/release/Ingress: read the [release procedure](../../../docs/release-home-assistant.md) and manifests/launcher/Dockerfile/workflow. Localhost is the browser device. Ingress requires relative routes, exact server-side peer 172.30.32.2 and no wildcard storage CORS.
- Structure/skills/tooling: use `pnpm check:structure`, `pnpm test:harness`, the repository map and [router research](../../../docs/research/skill-routing-research.md). Native local skill selection needs no hosted router.

## Verify the current step

Run targeted behavioral tests while editing; use full harness checks after final source/configuration is frozen when preparing a release. Follow [harness evidence](../../../docs/harness.md): changed inputs invalidate previous fingerprints, and historical reports never create a current approval.

Browser QA requires a new explicit user instruction under this repository's rules. Otherwise record NOT RUN; code/component tests cannot become browser PASS. Do not manufacture reviewer/browser attestations. Release publication and Pi installation follow their existing gate and backup requirements.

For an artifact request, use the matching available document/spreadsheet/presentation/image skill only if the output actually needs it. For Codex/OpenAI configuration consult official documentation. Do not install external routers, send prompts to a provider or edit global configuration merely to route this task.

Report what changed, actual verification and remaining gates. Keep the active task's open Pi/LAN/persistence/rollback/provider gates visible until corresponding current evidence exists.
