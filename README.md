# CREMS

Zelfstandige energie-app die naast Home Assistant draait. De productiecode staat in een TypeScript-monorepo; prototypes en onderzoek zijn duidelijk van het actieve product gescheiden.

## Huidige status

- responsive dashboard met live verbruik en echte daggrafiek wanneer Home Assistant beschikbaar is;
- bridge-API met status, huidige meterstand en live SSE-stream;
- lokale streamingcontrole van Fluvius-kwartierdata en veilige Energiepaspoort-totalen;
- technische batterijmotor en pure kostenberekeningen;
- zelfstandige frontend met Home Assistant als optionele read-only databron;
- lokaal gebonden aan `127.0.0.1`.

De webapp bevat Energiepaspoort v2, batterijrapport v3 en persoonlijke contractvergelijking. De P1-codebevindingen uit de audit van 24 september zijn hersteld met regressies. Release 0.1.13 is gepubliceerd en de actuele Supervisor-info van 1 oktober bevestigt dat deze op de Pi draait. Task 061 bevestigt Pi-adres `192.168.88.253`; open [CREMS Energie](http://192.168.88.253:8123/hassio/ingress/350f0e24_crems_energy) vanuit het thuisnetwerk. Directe LAN-HTTP gaf vanaf de huidige host timeout; Ingress via Tailscale gaf HTTP 200. De volledige actuele Pi-browsergate, runtimecache- en rollbackcontroles blijven open; zie `PRODUCT_AUDIT.md` en `TASKS.md`.

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

Dit start de gebouwde bridge op `127.0.0.1`; het startcommando compileert niets en start geen webapp. De Home Assistant-add-on gebruikt een gecombineerde runtime achter geauthenticeerde Ingress. Vanaf hetzelfde netwerk open je `http://<Pi-LAN-adres>:8123`, meld je aan en kies je CREMS Energie. Poort 8099 is intern en wordt niet rechtstreeks gepubliceerd. De actuele bereikbaarheid wordt afzonderlijk bewezen in Task 061. Zie `docs/release-home-assistant.md`.

Controles:

```powershell
pnpm typecheck
pnpm build
```

## Belangrijke grens

De bridge leest momenteel de echte digitale-metersensoren via Home Assistants lokale REST API en valt zonder lokale configuratie expliciet terug op simulatie. Het token staat uitsluitend in `apps/bridge/.env` en wordt door Git genegeerd.

Een module met groene tests is niet automatisch een vrijgegeven gebruikersfunctie. Zichtbaar gedrag vereist voortaan ook de browser/end-to-end releasegate uit `AGENT_PLAYBOOK.md`.

Actuele netwerkbevinding Task 061 (1 oktober): de huidige pc heeft Wi-Fi-adres `192.168.0.243/24`, gateway `192.168.0.1`; de Pi heeft `192.168.88.253/24`, gateway `192.168.88.1`. Ze zitten in verschillende IPv4-subnets. De directe timeout past bij ontbrekende routering tussen deze netwerken; de routerconfiguratie is niet gecontroleerd of gewijzigd. De pc moet toegang krijgen tot het Pi-subnet (bijvoorbeeld hetzelfde niet-geïsoleerde thuisnetwerk) of een bestaande route gebruiken. De tijdens deze run werkende toegang gebruikt [Home Assistant via Tailscale](http://homeassistant.tail582404.ts.net:8123/hassio/ingress/350f0e24_crems_energy). Er is geen bewijs dat een willekeurig apparaat op het Pi-subnet niet kan verbinden.
