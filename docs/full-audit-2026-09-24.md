# Volledige audit — 24 september 2026

## Follow-up audit — 25 september 2026

De onderstaande oorspronkelijke bevindingen zijn historische momentopnamen en door latere taken hersteld. De Astra-agent zelf kon door een usage-limiet niet afronden; een aparte read-only agent (`/root/pi_api_audit`, exact onderliggend model niet zichtbaar in de agentruntime) deed de vervolgaudit en hercontrole. Die agent vond vijf extra punten: HA Ingress absolute asset/API-paden, ontbrekende server-side Supervisor-peerrestrictie, onvolledige meetkwaliteit niet zichtbaar in de UI, een lege-response die een gelijktijdige opslagfout overschreef en in de laatste review een genormaliseerd API-pad dat niet aan de routehandlers werd doorgegeven. Root heeft ieder punt geverifieerd en in Task 054 gecorrigeerd; de laatste read-only hercontrole vond geen concrete codebevindingen.

**Automatisch bewijs:** volledige actuele run `pnpm test`: core 65/65, web 121/121, bridge 91/91; `pnpm build` PASS; `pnpm typecheck` PASS voor alle workspaces; `pnpm test:harness` 5/5 PASS; `git diff --check` PASS. Web regressies bewijzen error-over-empty en geen fictieve 0 W bij incomplete readings. Bridge regressies bewijzen Ingress-padnormalisatie tot en met een echte lokale health-routehandler, doorgifte van het genormaliseerde pad vóór alle routehandlers, Supervisor-peerallowlist en afwezigheid van wildcard CORS.

**Releasegates blijven open:** HAOS-image 0.1.10 is niet gebouwd/gepubliceerd/geïnstalleerd; Docker/Podman, GitHub CLI en de gebruikers-Pi ontbreken op deze werkplek. Er is geen Agent C browser-PASS uitgevoerd, dus Ingress-assets/SSE en zichtbare responsive states zijn nog geen end-to-end bewezen gedrag. Een officiële, toegestane consumer-contract-API met rechten/toegang is niet vastgesteld. Geen externe API of Pi is als werkend geclaimd. Releasebesluit blijft `CHANGES REQUIRED / NOT DEPLOYED`.

De officiële Home Assistant Ingress-richtlijn vereist dat alleen peer `172.30.32.2` wordt toegelaten en beschrijft `X-Ingress-Path`; zie [Home Assistant Developer Docs — Ingress](https://developers.home-assistant.io/docs/apps/presentation/#ingress). De codecontrole hiervoor is unit-/structuurmatig; echte add-on-runtimecontrole blijft open.

Deze audit beoordeelt de huidige werkboom tegen `REQUIREMENTS.md`, de goedgekeurde ADR's, de actieve taak en de bestaande tests. De aangevraagde Astra-agent leverde concrete read-only bevindingen over bridge en opslag, maar kon zijn audit niet afronden wegens een usage-limiet. De root-agent verifieerde die bevindingen tegen de code en controleerde de weblaag, harness en validatie. De dekking is dus gedeeltelijk; er is geen browser bediend en dit is geen releasegoedkeuring.

## Validatie

- `pnpm build`: geslaagd wanneer buiten de beperkte sandbox uitgevoerd; de sandbox zelf blokkeerde esbuild op een bovenliggende directory.
- `pnpm test`: core 65/65, web 118/118 en bridge-suite geslaagd.
- `pnpm typecheck`: alle drie workspaces geslaagd.
- `pnpm test:harness`: 5/5 geslaagd.
- Browsergate: OPEN. Er is geen Agent C PASS-rapport voor deze werkboom.

## Bevindingen

### P1 — Centrale corruptie wordt als leeg behandeld en kan daarna overschreven worden

`apps/bridge/src/central-storage.ts` behandelt corrupte of ongeldige opslag als een lege state. Een volgende PUT of DELETE kan daardoor de herstelbare corrupte inhoud vervangen zonder zichtbare herstelstate. Dat strijdt met FR-012 en ADR-011: onbekende/corrupte lokale data moet blijven staan tot expliciete verwijdering. `apps/bridge/test/central-storage.test.ts` bevat zelfs een test die corrupte opslag als leeg behandelt en daarna `put` toestaat. Herstel vereist een afzonderlijke taak.

### P1 — Centrale result-endpoints hebben geen origin- of hostauthenticatie

`apps/bridge/src/central-storage-route.ts` stelt GET/PUT/DELETE voor energieprofielen en batterijrapporten beschikbaar zonder autorisatie en met `Access-Control-Allow-Origin: *`. De route accepteert bovendien preflight `OPTIONS` en `Content-Type`. De standaardbinding aan localhost beperkt netwerkbereik, maar een andere lokale webcontext kan zo in beginsel opslag lezen of wijzigen. Dit vereist een securitybeslissing en reproduceerbare browser-/HTTP-test voordat centrale opslag als deploymentfunctie wordt vrijgegeven.

### P1 — Gemeten kwaliteit kan worden geclaimd met ontbrekende bronkanalen

`apps/bridge/src/meter-source.ts` laat één geldig vermogenskanaal volstaan, vult het ontbrekende kanaal met nul aan en publiceert de hele reading als `measured`. `SimulatedP1Source` publiceert eveneens `quality: "measured"` met `source: "simulator"`. De initiële webfallback in `apps/web/src/use-live-meter.ts` is daarentegen correct `estimated`; de eerdere audittekst stelde dit ten onrechte anders. Nul is alleen een meting wanneer de bron expliciet nul leverde. Voeg gerichte tests toe voor ontbrekende kanalen, onbekende states en simulatoruitvoer.

### P1 — Financiële allowlist en periodegate moeten onafhankelijk opnieuw worden bewezen

De Astra-controle rapporteerde dat `validateCentralResult` in `apps/bridge/src/central-storage.ts` een financiële fixture met contractperiode buiten de meetperiode accepteert en extra geneste velden in `investmentsEur` niet uitsluit. De code bevestigt beide ontbrekende controles: `validFinancial` controleert slechts dat contracteind na contractstart ligt en toetst alleen de vijf vereiste investeringssleutels. De webvalidator in `apps/web/src/local-battery-analysis.ts` controleert de periodedekking wel. Centrale validatie moet minimaal dezelfde semantiek afdwingen en geneste extra velden weigeren; voeg gerichte regressies toe.

## Releasebeslissing

Status: `CHANGES REQUIRED` voor de productrelease. Task 042 is afgerond als auditdocumentatie, maar de hierboven genoemde herstelpunten blijven open. Task 041 en eerdere zichtbare taken blijven `READY FOR BROWSER REVIEW`; geen enkele taak krijgt `APPROVED` zonder een actuele Agent C PASS voor schoon profiel, refresh, fout- en lege states, keyboard/focus, 375 px, 1280 px en privacy.

## Volgende veilige taken

1. Herstel centrale corruptie-/herstelstate en voeg regressies toe.
2. Leg origin/hostauthenticatie voor centrale opslag vast en implementeer die afzonderlijk.
3. Maak bronkwaliteit strikt voor meteradapter en simulator en bewijs dit met tests.
4. Harmoniseer de financiële nested allowlist en periodevalidatie tussen client, bridge en opgeslagen snapshot.
5. Voer daarna de browsergate uit en heropen de release-review.
