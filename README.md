# CREMS

Zelfstandige energie-app die naast Home Assistant draait. De productiecode staat in een TypeScript-monorepo; prototypes en onderzoek zijn duidelijk van het actieve product gescheiden.

## Huidige status

- responsive dashboard met live verbruik en echte daggrafiek wanneer Home Assistant beschikbaar is;
- bridge-API met status, huidige meterstand en live SSE-stream;
- lokale streamingcontrole van Fluvius-kwartierdata en veilige Energiepaspoort-totalen;
- technische batterijmotor en pure kostenberekeningen;
- zelfstandige frontend met Home Assistant als optionele read-only databron;
- lokaal gebonden aan `127.0.0.1`.

Nog niet vrijgegeven als complete productflow: duurzaam financieel batterijrapport, persoonlijke contractvergelijking en Raspberry Pi-deployment. Zie `PRODUCT_AUDIT.md` en de actieve Task 035.

## Structuur

- `apps/web`: React-webapp;
- `apps/bridge`: lokale read-only Home Assistant/P1-bridge;
- `packages/core`: gedeeld energiemodel en berekeningen;
- `integrations/home-assistant`: Home Assistant-dashboardreferenties;
- `docs`: verdiepende productdocumentatie;
- `archive`: niet-actieve prototypes;
- `research`: externe broncode en audits, niet opgenomen in builds.

De files `REQUIREMENTS.md`, `ARCHITECTURE.md`, `PLAN.md`, `TASKS.md` en `REVIEW.md` vormen het blijvende projectgeheugen voor de architect/implementer-workflow.

## Lokaal starten

Vereisten: Node.js 24 en pnpm 11.

```powershell
pnpm install
pnpm dev
```

Open daarna `http://127.0.0.1:5173`. De bridge luistert alleen lokaal op `http://127.0.0.1:8787`.

De productiebridge start build-first vanaf de repositoryroot:

```powershell
pnpm build
pnpm start:bridge
```

Dit start uitsluitend de gebouwde bridge op `127.0.0.1`; het startcommando compileert niets en start geen webapp. Externe toegang en de platforminstallatie op een Raspberry Pi vereisen nog een afzonderlijke beveiligings- en installatiebeslissing.

Controles:

```powershell
pnpm typecheck
pnpm build
```

## Belangrijke grens

De bridge leest momenteel de echte digitale-metersensoren via Home Assistants lokale REST API en valt zonder lokale configuratie expliciet terug op simulatie. Het token staat uitsluitend in `apps/bridge/.env` en wordt door Git genegeerd.

Een module met groene tests is niet automatisch een vrijgegeven gebruikersfunctie. Zichtbaar gedrag vereist voortaan ook de browser/end-to-end releasegate uit `AGENT_PLAYBOOK.md`.
