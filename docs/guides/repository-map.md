# CREMS repositorykaart

Onderhoudsaudit: 2 oktober 2026. Deze kaart beschrijft broncode en buildconfiguratie; zij is geen browser-, hardware- of releasegoedkeuring.

## Waar werk hoort

| Map / bestand | Verantwoordelijkheid | Eerste ingang |
|---|---|---|
| `apps/web/src` | React-schermen, tijdelijke CSV, browserkopieën, API-clients | `main.tsx`, `App.tsx` |
| `apps/web/test` | Client-, component-, opslag- en presentatieregressies | test van het gewijzigde onderdeel |
| `apps/web/scripts` | esbuild developmentserver en productie-assets | `dev.mjs`, `build.mjs` |
| `apps/bridge/src` | HTTP/SSE, HA-bronnen, prijzen, opslag en provideradapter | `server.ts`; daarna relevante route/service |
| `apps/bridge/test` | Transport-, validator-, security- en productiestarttests | `production-start.test.ts` en onderdeeltest |
| `packages/core/src` | Pure CSV-, energie-, batterij- en contractberekeningen | `index.ts` en gerichte subpath-exports |
| `packages/core/test` | Synthetische domeinregressies | test van de berekening/parser |
| `apps/home-assistant-addon/crems` | Canonieke Dockerfile, runtime-launcher en buildmetadata | `Dockerfile`, `run.mjs`, `config.yaml` |
| `crems` | Rootmetadata die Home Assistant als repository ontdekt | `config.yaml`, `DOCS.md` |
| `integrations/home-assistant` | Dashboard-/sensorreferenties, geen runtime-import | YAML-referenties |
| `tools` | Lokale checks, release- en Supervisorhelpers | `harness.mjs`, `release-crems.ps1` |
| `.github/workflows` | ARM64-imagepublicatie met versiecontrole | `home-assistant-image.yml` |
| `.agents/skills` | Repo-scoped Codex-workflows, geen appcode | `crems-workflow/SKILL.md` |
| `docs` | Ontwerp, procedures en gedateerde bewijsrapporten | passende route hieronder |
| `docs/guides`, `docs/research`, `docs/reviews`, `docs/history` | Nieuwe handleidingen, brononderzoek, onderhoudsreviews en bewaarde plannen | [documentatie-index](../README.md) |
| `.harness`, `.runtime-logs`, `dist`, `node_modules` | Gegenereerde/lokale bestanden | geen bron van releasegoedkeuring |
| `apps/bridge/data/runtime` | Persoonlijke runtimeopslag | niet lezen voor een structuuraudit |
| `archive`, `research` | Oude prototypes en onderzoek | geen actieve build-input |

`pnpm-workspace.yaml` selecteert `apps/*` en `packages/*`; de drie package manifests bepalen de uitvoerbare workspaces. De Dockerfile kopieert expliciet core/web/bridge, de launcher en het openbare BELPEX-archief. Rootmetadata en addonmetadata blijven gespiegeld: beide `config.yaml`-bestanden en beide `repository.yaml`-bestanden moeten overeenkomen. De dubbele map is dus doelbewust, geen cleanup-afval.

## Logica en uitvoerketens

- Browser: `main.tsx` → `App.tsx` → scherm/client/controller → relatieve `api/…`-route. CSV-parser en berekeningen draaien lokaal; veilige samenvattingen worden alleen door de bestaande expliciete acties bewaard.
- Backend: `server.ts` → Ingress-peercheck/prefix → route → service/bron/validator. HA is meterbron; Energy-Charts levert spotprijzen; contractprovider blijft apart en opt-in.
- Lokaal: `pnpm dev` start web op `127.0.0.1:5173` en bridge op `127.0.0.1:8787`; web proxy't API-routes. `localhost` wijst naar het browserapparaat, niet naar de Pi.
- Pi: Home Assistant op 8123 → geauthenticeerde Ingress → interne 8099. Geen gepubliceerde bridgepoort; exacte Supervisor-peer `172.30.32.2` blijft vereist.
- Release: volledige checks → onafhankelijke review/browserbewijs → gate → onveranderlijke tag/ARM64-image → appbackup/update → afzonderlijke Pi-runtime/LAN/herstart/rollbackchecks. Zie [releaseprocedure](../release-home-assistant.md).

## Kies alleen relevante instructies

Begin bij `AGENTS.md`, requirements/ADR's en de actuele scope in `TASKS.md`. De rolbestanden zijn rollen, geen automatisch ontdekte skills. Gebruik de repo-skill als router en lees vervolgens alleen de passende verdieping:

| Vraag | Code / documentatie |
|---|---|
| Navigatie/CSV/batterijscherm | `apps/web/src/App.tsx`, controller/client, bijbehorende webtest |
| Berekeningscorrectheid/DST/CSV | `packages/core/src`, pure tests, relevante ADR |
| Meter/prijzen/history | bridge route/service/source plus webparser/controller |
| Opslag/refresh/delete/migratie | centrale validator/route, lokale serializers/client, componenttests; [opslagontwerp](../central-storage-plan.md) |
| Pi/release/Ingress | manifests, Dockerfile/launcher, workflow, releasehelper; [HA-ontwerp](../task-037-haos-app.md) |
| Bewijs/status | actuele top van `TASKS.md`, `PRODUCT_AUDIT.md`, gedateerd rapport; [harness](../harness.md) |
| Externe skill-router | [Jev-onderzoek](../research/skill-routing-research.md) |

## Auditbevindingen en grenzen

1. **Hersteld:** een latere gelijkgenummerde taakkop overschreef de actieve harnessstatus met `UNKNOWN`. De parser behoudt de eerste taakdefinitie; de latere scopebeschrijving blijft in TASKS leesbaar.
2. **Hersteld:** de fingerprint miste PowerShell-releasecode, Dockerfile, workflow, root-HA-metadata en agent-/skillinstructies. Deze bronnen tellen nu mee; wijzigingen vereisen nieuwe controles en attestaties.
3. **Hersteld:** README gebruikte nog de oudere 0.1.13-baseline; de actuele vastgelegde baseline is 0.1.14, lokale kandidaat 0.1.15. Dit is rapportbewijs, geen nieuwe Supervisoraanvraag.
4. **Hersteld:** web-tsconfig verwees naar een niet-bestaande `vite.config.ts`; frontend gebruikt esbuild.
5. **Onderhoudsbacklog:** `App.tsx` is circa 75 kB met meerdere schermen/opslagflows. Splitsen vraagt een aparte, beperkte write set en gedragsregressies; deze audit verplaatst geen productiecode.
6. **Bewijsgrens:** Node 24 is de lokale ontwikkelbaseline; Dockerfile gebruikt Node 22. Een lokale PASS bewijst geen verse containerbuild. Historische gepubliceerde images zijn traceerbaar; een runtime-upgrade is een aparte taak.

De audit inspecteert alle actieve mappen en hun configuratiegrenzen, geen volledige regel-voor-regel securityaudit en geen inhoud van persoonlijke opslag, secrets, archive of research. Open release-/productgates blijven in TASKS staan.
