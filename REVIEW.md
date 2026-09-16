# Review

## Periodefilter capaciteitsgrafiek — 12 september 2026

Van/Tot en met en Volledige periode sturen uitsluitend de grafiek 'Minder netafname per batterij'. Dagsommen behouden lading van vóór de selectie. Eindgrens is de Brusselse dag van periode.einde minus één milliseconde. Ongeldige/lege bereiken en oude rapporten zonder dagdata zijn expliciet afgehandeld. Root heeft code gecontroleerd en build, alle tests (65 core/92 web/67 bridge) en typecheck met succes uitgevoerd. De webserver levert de nieuwe filtercode. Status READY FOR BROWSER REVIEW; geen browserbediening uitgevoerd en geen browser-PASS.

## Actueel — interactief dagrapport — 11 september 2026

Status: READY FOR BROWSER REVIEW, 12 september 2026. Datumselectie, batterijfilter, dag-KPI's, klikbare dag-/capaciteitsvergelijking, vier kwartiergrafieken en controletabellen zijn geïmplementeerd. Dagaggregaten blijven expliciet bewaarbaar; detail blijft tijdelijk en wordt bij dagwissel vrijgegeven. Oude rapporten krijgen een herinleesactie. Agent A heeft root build, tests en typecheck succesvol uitgevoerd (web 90/90, bridge 67/67, core-suite groen). Codebevindingen over verliesvalidatie en datumselectie zijn opgelost. Geen volledige APPROVED-status: browser-PASS staat open. Bewijs: `docs/battery-daily-report-review.md`.

## Task 035 — herstelronde afgerond — 10 september 2026

De zes eerder gevonden codeblockers zijn hersteld. Een technische run zonder prijsgegevens kan nu expliciet worden bewaard; optionele prijsvelden worden niet als `undefined` opgeslagen. Een nieuwe CSV gebruikt uitsluitend de eigen kwaliteit en periode en neemt geen eerder financieel snapshot over. Heropenen gebruikt het bewaarde snapshot zonder opnieuw de financiële vergelijkingsmotor te draaien. Technische rapporten kunnen later expliciet financieel worden aangevuld. Legacy- en corrupte opslag blijven zichtbaar en niet-destructief; opslag- en verwijderfouten behouden de zichtbare state. Readerfouten, annulering en dispose sluiten exact eenmaal op.

De CSV-upload blijft toetsenbordbereikbaar via een focusbare native input-overlay met zichtbare focusrand. De bridge-testfixture voor `today/raw_today` gebruikt nu de juiste `currentPrice`-configuratie.

De batterijweergave toont nu per capaciteit de vermeden netafname, opgevangen injectie, verlies/niet-benutte energie, eindlading en de extra vermeden netafname tegenover de vorige capaciteit. De periode wordt expliciet als meetperiode getoond; oudere opgeslagen details met het herkenbare aangevulde nulverliespatroon worden als niet bevestigd gemarkeerd.

**Automatisch bewijs:** `pnpm build` geslaagd; `pnpm test` geslaagd met core 63/63, web 83/83 en bridge 67/67; `pnpm typecheck` geslaagd. De gerichte Task 035-suite bevat 27 gerichte tests plus een synthetisch jaartraject met 70.080 kwartierregels van controle → technische run → bewaren zonder prijzen → financiële aanvulling → refresh → verwijderen.

**Status:** READY FOR BROWSER REVIEW. Geen browser gestart. De resterende releaseblokkade is de vereiste Agent C-browsergate voor schoon profiel, refresh, legacy, foutstate, verwijderen, 1280 px en 375 px. Zie [docs/task-035-release-check.md](docs/task-035-release-check.md).

---

## Geïntegreerde lokale release — 9 september 2026

Energiepaspoort v2 bewaart nu naast veilige totalen ook bronvolgorde, gaten, dubbels en overlap. Oude v1-profielen blijven leesbaar met expliciet `onbekend` voor ontbrekende integriteit. Het duurzame batterijrapport toont technische capaciteit, datakwaliteit, terminale lading/verliezen en — uitsluitend na bevestigde contract/offerte-input — een bewaard financieel snapshot. De nieuwe contractpagina vergelijkt twee door de gebruiker ingevoerde vaste/variabele energiecomponenten over exact hetzelfde lokale profiel, met gemeten en geschatte bedragen apart.

De hoofdroute is permanent zichtbaar als Data → Rapport → Batterij → Contract. Een bestaand batterijresultaat vraagt niet opnieuw om dezelfde CSV; een nieuwe upload is een bewuste keuze.

**Automatisch bewijs:** core 63/63, web 73/73, alle workspaces typecheck groen en webproductiebundel groen. De bridgebuild is groen; de bridge-test-runner kon op deze host niet starten door `uv_os_get_passwd ENOMEM`, vóór uitvoering van assertions. De menselijke browsergate is niet uitgevoerd omdat de gebruiker schermovername expliciet verbiedt.

**Status:** READY FOR USER REVIEW, niet volledig `APPROVED`. Open: handmatige CSV/save→refresh/mobilecontrole en expliciete opslag van contractvergelijkingen.

---

## Task 035 — gerichte herstelupdate — 8 september 2026

De zeven gekende codeblockers zijn hersteld: geen impliciete profielopslag, geldige optionele v3-velden, juiste corrupte sleutel, strikte financiële snapshotvalidatie, geen herberekening bij reload, volledige read-only financiële weergave en deterministische controle van alle opgeslagen bedragen. Webtypecheck en 69/69 webtests slagen.

**Status:** READY FOR BROWSER REVIEW. De eerdere browsergate bewees alleen first-run, navigatie en offline-state; CSV-upload, save→refresh, legacy, verwijderen en 375px blijven nog `NOT RUN`. Daarom nog geen `APPROVED`.

---

## Task 035 — eerste releasegate — 8 september 2026

**Status:** CHANGES REQUIRED

Automatisch bewijs: webtypecheck geslaagd en 64/64 webtests geslaagd. Dit is geen releasegoedkeuring.

Blockers:

1. `Batterijsimulatie starten` bewaart nog stilzwijgend het Energiepaspoort.
2. Een v3-reportliteral met aanwezige `undefined`-sleutels faalt de eigen exacte validator.
3. Een corrupte v1/v2-state onthoudt niet welke sleutel expliciet verwijderd moet worden.
4. De v3-validator bewijst onvoldoende financiële grenzen, quality eligibility en interne snapshotconsistentie.
5. Een opgeslagen financieel snapshot doorloopt bij reload nog de vergelijking, ondanks de no-recalculation-eis.
6. Agent C kon de browsergate niet uitvoeren: `http://127.0.0.1:5173/` gaf `ERR_CONNECTION_REFUSED` en Agent B leverde nog geen veilige browserfixture-handoff.

Volgens de twee-rondesregel stopt de huidige uitvoering. De volgende hervatting mag uitsluitend deze zes punten herstellen; geen nieuwe functionaliteit of brede refactor.

`CHANGES REQUIRED`

---

## Actuele releasebeslissing — 7 september 2026

| Onderdeel | Modulebewijs | Productrelease |
|---|---|---|
| Live Home Assistant + daggrafiek/prijzen | APPROVED | beschikbaar met geconfigureerde lokale bridge |
| Streaming Fluvius-controle | APPROVED | beschikbaar voor lokale preview |
| Energiepaspoort | READY FOR REVIEW | herstel in Task 036 |
| Batterijmotor en technische vergelijking | MODULE APPROVED | productrelease ingetrokken; Task 035 actief |
| Financieel batterijrapport na refresh | niet bewezen | NIET VRIJGEGEVEN |
| Persoonlijke contractvergelijking | pure coreberekening bewezen | NIET VRIJGEGEVEN; huidige UI onbereikbaar |

De audit in `PRODUCT_AUDIT.md` heeft vastgesteld dat eerdere modulegoedkeuringen ten onrechte als volledige productgoedkeuring werden geïnterpreteerd. Historische reviews hieronder blijven auditlog, maar alleen deze actuele tabel en een latere expliciete review van Task 035–038 bepalen releasegereedheid.

**Current verdict:** `CHANGES REQUIRED`

---

## Task 028 — Echte Fluvius-mapping en privacyveilige kwartierpreview — finale herreview

**Status:** APPROVED

- De synthetische fixture behoudt nu het werkelijk bewezen `HH:mm:ss`-formaat en wordt end-to-end door de bestaande CSV-parser en DST-mapper getest.
- Mapping dekt exacte headers, komma-decimalen, registers, kwaliteiten, kwartierduur, 23/25-uursdagen en het dubbele winteruur per registerstroom.
- Gemeten en geschatte totalen blijven zichtbaar gescheiden; redenen, integriteitsmetingen en eerste/laatste veilige intervallen zijn beschikbaar.
- Bestandsnaam en identificatievelden zijn uit preview/fouten verwijderd; selectie-, paginawissel- en unmountcleanup voorkomen stale inhoud. Het echte bronbestand blijft buiten repository en build.
- Rootvalidatie: build geslaagd, 143 tests geslaagd en typecheck geslaagd.

`APPROVED`

---

## Task 027 — Echte dagprijs in de bestaande grafiek — finale herreview

**Status:** APPROVED

- Gisteren blijft ook na hide/show exact één fetch; een initieel verborgen Vandaag/Morgen doet nul calls tot de pagina zichtbaar wordt.
- Zichtbare Today/Tomorrow-polling pauzeert verborgen, hervat onmiddellijk en behoudt laatste geldige data bij een achtergrondfout.
- Power en prijs blijven visueel onafhankelijk; Morgen toont uitsluitend echte prijs en meldt expliciet dat vermogen pas morgen wordt gemeten.
- Gele prijsnullijn, rechterlabels in `ct/kWh`, dynamische aria-labels, partial-waarschuwing, negatieve/nulprijzen en step-eindpunt zijn aanwezig.
- Rootvalidatie: 32/32 webtests en typecheck geslaagd.

`APPROVED`

---

## Task 026 — Veilig endpoint voor echte dagprijzen — herreview

**Status:** APPROVED

- Exact lokale middernacht retourneert Vandaag veilig `incomplete` met lege punten en doet nul Home Assistant-fetches.
- De morgenunit wordt vóór `notPublished` gevalideerd; ontbrekende/verkeerde unit wordt veilig als niet geconfigureerd afgewezen.
- Aparte expliciete morgenentity, echte numerieke `raw_tomorrow`, half-open DST-vensters, malformed-versus-missing en veilige publieke foutvormen zijn bewezen.
- Rootvalidatie: 64/64 bridgetests en typecheck geslaagd.

`APPROVED`

---

## Task 025 — half-open daggrens — herreview

**Status:** APPROVED

- De kalenderdag gebruikt nu correct `[start, end)`: start is inclusief en een punt exact op de volgende lokale middernacht wordt als outside geteld.
- De gerichte regressietest bewijst tevens aangepaste exclusieve tellingen en behoud van last-valid deduplicatie.
- Rootvalidatie: 54/54 bridgetests geslaagd.

`APPROVED`

---

## Task 025 — grenscorrectie vereist

**Status:** CHANGES REQUIRED

- Blocker: het huidige venster is eind-inclusief. Een kalenderdag moet `[start, end)` zijn; een prijspunt exact op de volgende lokale middernacht behoort tot de volgende dag.
- Wijzig de outside-check naar `timestamp >= end`, pas de bestaande telling/verwachting aan en bewijs expliciet start-inclusief plus end-exclusief.
- Alle overige normalisatiecriteria zijn goedgekeurd. De eerdere APPROVED-notitie hieronder is hiermee ingetrokken.

`CHANGES REQUIRED`

---

## Task 025 — Pure normalisatie van Home Assistant-prijshistory

**Status:** APPROVED

- Alleen expliciete EUR/kWh-varianten worden na trim/case-normalisatie aanvaard; vensterfouten hebben prioriteit en beide fouttypen hebben vaste veilige codes.
- Nul en negatieve prijzen, inclusieve grenzen, absolute offsettimestamps, deterministische last-valid deduplicatie en chronologische output zijn bewezen.
- Invalid, outside-window en duplicate worden exclusief geteld; empty/all-invalid is veilig leeg en frozen input blijft ongemuteerd.
- Publieke output bevat uitsluitend punten en drie tellingen; ruwe attributen, unit en entity-ID lekken niet.
- Onafhankelijk reviewbewijs: root rapporteert 54/54 bridgetests en groene typecheck.

`APPROVED`

---

## Task 024 — Toegankelijke Gisteren/Vandaag/Morgen-selector — herreview

**Status:** APPROVED

- Positieve Home Assistant-exportwaarden worden uitsluitend voor de grafiek naar negatieve waarden vertaald en aantoonbaar onder de nullijn getekend, zonder API-data te muteren.
- Kop en SVG-label noemen de geselecteerde kalenderdag en concrete datum; de incomplete-waarschuwing claimt geen onbewezen tijdsgaten.
- Morgen doet nul fetches en rendert een expliciete tweeregelige toekomststate zonder SVG. De smalle layout behoudt drie gelijke segmenten.
- Een mislukte achtergrondverversing behoudt de laatst geldige grafiek en toont een veilige waarschuwing; step-paden stoppen bij het laatste meetpunt.
- Onafhankelijke eindvalidatie is gebaseerd op roots volledige groene run: build geslaagd, 110 tests geslaagd en typecheck geslaagd.

`APPROVED`

---

## Task 023 — 25-uurs historygrens en future-guard

**Status:** APPROVED

- Exact 25 uur (inclusief de Brusselse winterdag) is toegestaan; langer, nul en omgekeerd worden vóór de loader geweigerd.
- `end === now` is geldig; iedere toekomstige eindtijd wordt strict geweigerd. Deze expliciete policy stuurt nooit toekomst naar Home Assistant; de serverklok wordt eenmaal per request geïnjecteerd/evaluated.
- Gerichte bridgevalidatie: 48/48 tests geslaagd; typecheck exitcode 0.
- Agent-3-klokskewadvies is beoordeeld: strict reject is gekozen boven clamp vanwege de harde no-future-garantie en lokale client/bridge-opzet.

`APPROVED`

---

## Task 022 — Brusselse kalenderdagvensters

**Status:** CHANGES REQUIRED

- Normale dag, 23-uurs zomertijdstart, 25-uurs wintertijdstart, Brusselse datum rond UTC-middernacht, vandaag-tot-now en morgen zonder fetchvenster zijn correct bewezen.
- Blocker: exact op lokale 00:00 levert `Vandaag` momenteel `state: "ready"` met `start === end`. Het bridgecontract accepteert alleen positieve vensters; dit moet een expliciete non-fetch empty/no-measurements-state worden, met regressietest.
- Voeg bij de gerichte correctie ook `Vandaag`-tests tijdens beide DST-overgangen toe; gisteren alleen bewijst de live-refreshgrens niet volledig.
- Gerichte validatie Agent A: webtests 17/17 geslaagd; webtypecheck exitcode 0.

`CHANGES REQUIRED`

---

## Task 020 — Begrensd bridge-endpoint voor echte import-/exporthistory — herreview

**Status:** APPROVED

## Opgeloste bevinding

- `handleBridgeRoutePrelude` is nu de gedeelde productie- en testcompositie: eerst het historypad, daarna alleen voor overige paden de bestaande generieke OPTIONS-204.
- Een regressietest bewijst `OPTIONS /api/history/power` → 405 én `OPTIONS /api/current` → 204 met ongewijzigde CORS/no-store-headers.
- `server.ts` gebruikt exact deze gedeelde prelude vóór health/current/stream; de test importeert de luisterende productieserver niet.
- Aanvullende tests bewijzen zowel HTTP-falen als fetch-rejectie tijdens de twee historycalls ná één geslaagde states-resolutie en veilige mapping naar `HISTORY_UPSTREAM_ERROR`.

## Volledige acceptance-herbevestiging

- Queryvorm, positief venster, exacte 24-uursgrens, offsetcanonicalisatie, methodes en headers zijn bewezen.
- Simulatie levert unavailable zonder HA-call; configuratieresolutie doet één states-GET en geldige uitvoering exact twee read-only historycalls.
- Succes bevat exact start/end/quality/import/export; leeg is incomplete HTTP 200 en ruwe HA-data lekt niet.
- Publieke query-, window-, unavailable-, not-configured-, upstream- en internal-fouten hebben vaste veilige bodies.
- Health/current/stream/polling blijven ongewijzigd en alle regressietests zijn groen.

## Validatie Agent A

- `pnpm build`: exitcode 0; core, bridge en web gebouwd.
- `pnpm test`: exitcode 0; core 38/38, bridge 46/46 en web 8/8 geslaagd (92 totaal).
- `pnpm typecheck`: exitcode 0; core, bridge en web geslaagd.

## Decision

`APPROVED`

---

## Task 020 — Begrensd bridge-endpoint voor echte import-/exporthistory

**Status:** CHANGES REQUIRED

## Bewezen correct

- Queryvalidatie vereist exact één niet-lege geldige start en end, canonicaliseert offsets en begrenst positief op maximaal exact 24 uur.
- Home Assistant-service doet één states-GET, resolveert exact één import-/exportentity met expliciete W/kW-unit en doet daarna exact twee bestaande read-only historycalls.
- Task-019-normalisatie, measured/incomplete kwaliteit en de vijfvelden-succesresponse zijn correct geïntegreerd.
- Simulatie levert geen fake history; configuratie-, upstream- en interne fouten worden naar vaste veilige publieke bodies gemapt.
- Tests gebruiken synthetische waarden, lokale fetch-/route-stubs en cleanup in `finally`; er is geen secret- of raw-recordlek gevonden.

## Verplichte correctie

1. De echte `server.ts` handelt alle `OPTIONS` af vóór `handlePowerHistoryRequest`. Daardoor geeft `OPTIONS /api/history/power` in productie HTTP 204, terwijl het acceptancecriterium en de geïsoleerde routetest vereisen dat ieder niet-GET request naar dit pad 405 geeft. Maak de productiecompositie consistent zonder andere routes of globale CORS-semantiek te wijzigen, en voeg een side-effectvrije regressietest toe die de daadwerkelijke handler-/routevolgorde bewijst. Alleen een test van `handlePowerHistoryRequest` in isolatie is onvoldoende voor deze integratiefout.

## Aanbevolen aanvullend bewijs

- Voeg binnen dezelfde gerichte testlaag één case toe waarin `/api/states` slaagt en een historycall 401/500 of reject geeft, zodat veilige `HISTORY_UPSTREAM_ERROR`-mapping na kanaalresolutie rechtstreeks bewezen is. De huidige code lijkt correct, maar de nieuwe upstreamtest faalt uitsluitend vóór resolutie.

## Validatie Agent A

- `pnpm build`: exitcode 0; core, bridge en web gebouwd.
- `pnpm test`: exitcode 0; core 38/38, bridge 44/44 en web 8/8 geslaagd (90 totaal), maar de productieroutevolgorde valt buiten de huidige testnaad.
- `pnpm typecheck`: exitcode 0; core, bridge en web geslaagd.

## Decision

`CHANGES REQUIRED`

---

## Task 019 — Pure normalisatie van Home Assistant power-history

**Status:** APPROVED

## Acceptance Criteria Check

- [x] Publiek punt-type bevat exact timestamp/powerW en resultaat exact points plus invalid-, outside-window- en duplicate-teller.
- [x] De implementatie roept rechtstreeks de bestaande `normalizePowerInWatts` aan; W/kW trim/case, afronding, nul en negatieve eindige waarden zijn met vaste tests bewezen.
- [x] Alle vereiste ongeldige record-, state- en timestampvormen worden uitsluitend invalid en broninhoud verschijnt niet in het resultaat.
- [x] `last_changed` wint wanneer aanwezig; alleen een ontbrekend veld gebruikt `last_updated`. Een aanwezige ongeldige primary timestamp valt niet terug.
- [x] Offsetvenster wordt als tijdinstants vergeleken, grenzen zijn inclusief en output is canonieke UTC-ISO.
- [x] Ongeordende punten worden chronologisch gesorteerd; bij canoniek gelijke timestamps blijft het laatste geldige bronrecord staan.
- [x] Leeg en volledig invalid leveren lege punten met exacte tellers zonder exception.
- [x] Venster wordt vóór eenheid gevalideerd met vaste klassen/codes `INVALID_HISTORY_WINDOW` en `INVALID_HISTORY_UNIT`, zonder ruwe invoer in meldingen.
- [x] Classificatievolgorde is invalid → outside → duplicate en tests bewijzen dat punten plus tellers elk bronrecord exact eenmaal verklaren.
- [x] Frozen array en records blijven ongemuteerd; tests zijn puur en synthetisch.
- [x] Geen request, endpoint, UI, resampling, clamping, prijsserie, logging of dependency toegevoegd.
- [x] De voorgeschreven validatie is door Agent A uitgevoerd in volgorde build → test → typecheck.

## Validatie Agent A

- `pnpm build`: exitcode 0; core, bridge en web gebouwd.
- `pnpm test`: exitcode 0; core 38/38, bridge 35/35 en web 8/8 geslaagd (81 totaal).
- `pnpm typecheck`: exitcode 0; core, bridge en web geslaagd.

## Decision

`APPROVED`

---

## Nieuwe scope — echte Home Assistant-historygrafiek

**Status:** PLANNED

## Inspectiebewijs

- De overzichtspagina bevat momenteel twee hardcoded SVG-polylines (`chartA` en `chartB`) en noemt ze expliciet een demoprofiel.
- De bridge heeft sinds Task 014 een getest read-only raw-historytransport, maar nog geen normalisatie of publiek historyendpoint.
- De webapp consumeert alleen current/SSE-data; er bestaat nog geen historyfetch, async state of echte SVG-schaalfunctie.

## Beslissing

- Drie taken zijn de kleinste veilige keten: Task 019 normaliseert puur, Task 020 begrenst en publiceert veilig, Task 021 rendert responsief.
- Task 019 is inmiddels `APPROVED`; exact Task 020 is `READY`. Task 021 blijft `PLANNED` en krijgt pas na review van Task 020 zijn definitieve handoff.
- De statische demo wordt pas in Task 021 verwijderd, maar mag niet worden hernoemd of gepresenteerd als echte history in de tussentijd.
- Task 009 blijft onafhankelijk `BLOCKED` op de echte Fluvius-fixture.

---

## Task 018 — Expliciet productie-startpunt voor de bridge

**Status:** APPROVED

## Acceptance Criteria Check

- [x] `apps/bridge` heeft exact `start: node dist/server.js`; het gebruikt geen watcher, `tsx` of TypeScriptbron als productie-entrypoint.
- [x] Root `start:bridge` is exact `pnpm --filter @crems/bridge start` en richt zich niet op web of core.
- [x] De manifesttest bewijst beide exacte waarden en het bestaan van `apps/bridge/dist/server.js`.
- [x] Bridge `pretest` voert eerst de gerichte bridgebuild uit; de smoketest vertrouwt daardoor niet op een oude `dist`.
- [x] Het subprocess krijgt een gesaneerde omgeving met alleen `CREMS_BRIDGE_PORT=synthetic-invalid-port`, heeft een timeout van 3000 ms en stopte bij Agent A in circa 150 ms met niet-nul status, zonder signaal of timeout.
- [x] De ongeldige poort wordt vóór serverconstructie afgewezen; er wordt geen socket of blijvende timer gestart.
- [x] Output bevat de vaste foutklasse/-melding, niet de ruwe synthetische waarde en geen `HASS_TOKEN`, `HASS_URL`, entityvariabele of `process.env`-dump.
- [x] README documenteert exact `pnpm build` gevolgd door `pnpm start:bridge`, localhostbinding en de nog afzonderlijke beveiligings-/platformbeslissing.
- [x] Geen systemd-unit, Home Assistant add-on, Dockerfile, installer, externe bindoptie, proxy-, firewall- of Tailscalewijziging toegevoegd.
- [x] Runtimecode, routes, polling, bronselectie en listenconfiguratie zijn ongewijzigd; alle bestaande tests blijven groen.
- [x] Geen nieuwe dependency en geen wijziging buiten manifests, gerichte test en README.
- [x] De voorgeschreven validatie is door Agent A uitgevoerd in volgorde build → test → typecheck.

## Scope / Quality Review

- Het startcommando compileert bewust niets; build-first is zichtbaar en de testworkflow borgt verse output afzonderlijk.
- `spawnSync` begrenst en ruimt het testproces op; een timeout of signaal zou de assertions laten falen.
- De platform-specifieke installatie blijft terecht onbeslist zolang niet is vastgesteld of de Raspberry Pi Home Assistant OS, Supervised, Container of een gewone Linux-installatie gebruikt.

## Validatie Agent A

- `pnpm build`: exitcode 0; core, bridge en web gebouwd.
- `pnpm test`: exitcode 0; bridge `pretest` bouwde vers; core 38/38, bridge 27/27 en web 8/8 geslaagd (73 totaal).
- `pnpm typecheck`: exitcode 0; core, bridge en web geslaagd.

## Decision

`APPROVED`

---

## Task 017 — Veilige bridge-listenconfiguratie

**Status:** APPROVED

## Acceptance Criteria Check

- [x] `undefined`, leeg en whitespace leveren exact loopbackhost `127.0.0.1` en defaultpoort 8787.
- [x] Ondergrens 1, getrimde middenwaarde 12345 en bovengrens 65535 worden exact als integers geaccepteerd.
- [x] Nul, negatief, 65536, decimaal, exponentnotatie, plusprefix, tekstprefix/-suffix, `NaN` en beide oneindigheden worden afgewezen.
- [x] Alle ongeldige waarden geven `InvalidBridgePortError` met vaste code `INVALID_BRIDGE_PORT` en vaste veilige melding zonder de invoerwaarde.
- [x] Een expliciet ongeldige waarde bereikt de defaulttak niet; alleen ontbrekend of leeg na trim gebruikt 8787.
- [x] `server.ts` leest `CREMS_BRIDGE_PORT` exact eenmaal via `parseBridgeListenConfig` en geeft exact `listenConfig.port` en `listenConfig.host` aan `listen`.
- [x] Host is zowel in type als returnwaarde vast `127.0.0.1`; er is geen externe bind- of hostconfiguratie toegevoegd.
- [x] De nieuwe tests importeren alleen de pure parser en starten geen server, timer, netwerk of `.env`.
- [x] Health, routes, polling, bronselectie en alle bestaande tests blijven groen.
- [x] Geen nieuwe dependency en geen wijziging buiten de toegestane bridgebestanden.
- [x] De voorgeschreven validatie is door Agent A uitgevoerd in volgorde build → test → typecheck.

## Scope / Quality Review

- De regex voorkomt JavaScripts ruime numerieke coercie vóór de aparte integer- en bereikcontrole.
- De default en expliciet geldige waarden leveren steeds een nieuw klein configuratieobject; invoer of procesconfiguratie wordt niet gemuteerd.
- Task 009 blijft geblokkeerd op een echte gesaniteerde Fluvius-fixture en is niet als uitvoerbaar werk naar voren gehaald.

## Validatie Agent A

- `pnpm build`: exitcode 0; core, bridge en web gebouwd.
- `pnpm test`: exitcode 0; core 38/38, bridge 25/25 en web 8/8 geslaagd (71 totaal).
- `pnpm typecheck`: exitcode 0; core, bridge en web geslaagd.

## Decision

`APPROVED`

---

## Task 016 — Veilige en testbare bridge-healthresponse

**Status:** APPROVED

## Acceptance Criteria Check

- [x] Home Assistant zonder fout levert exact vijf velden met `ok`, `configured: true`, `simulation: false` en de aangeleverde clientteller.
- [x] Simulatie zonder fout levert exact dezelfde vijf velden met `configured: false` en `simulation: true`.
- [x] Een foutindicator wordt uitsluitend `status: "degraded"`; de synthetische fouttekst verschijnt niet in object of JSON.
- [x] Tests bewijzen exact vijf keys en afwezigheid van error-, token-, entity-, timestamp-, URL- en meterkeys; serverintegratie levert alleen de vaste actieve bronnaam aan.
- [x] Negatieve, `NaN`, positieve en negatieve oneindige clientaantallen geven `InvalidHealthClientCountError` met vaste code `INVALID_HEALTH_CLIENT_COUNT`; nul is getest via simulatie.
- [x] `GET /api/health` geeft HTTP 200 JSON met `Cache-Control: no-store` en beide bestaande CORS-headers.
- [x] `POST /api/health` geeft 405 en wordt niet als succesvolle healthcheck behandeld.
- [x] De lokale routetest gebruikt een willekeurige loopbackpoort en sluit de server gegarandeerd in `finally`; productiepoort, pollingtimer, `.env` en Home Assistant worden niet gestart.
- [x] `/api/current`, `/api/stream`, polling en bronselectie zijn inhoudelijk onaangeroerd en alle bestaande tests blijven groen.
- [x] Geen nieuwe dependency en geen wijziging buiten de toegestane bridgebestanden.
- [x] De voorgeschreven validatie is door Agent A uitgevoerd in volgorde build → test → typecheck.

## Scope / Quality Review

- `mapHealthResponse` is puur; `handleHealthRequest` is afzonderlijk routeerbaar zonder import van de side-effectvolle productieserver.
- De gedegradeerde status bewaart alleen foutaanwezigheid. De bestaande interne fouttekst blijft bruikbaar voor proceslogica maar verlaat de healthroute niet.
- Het extern door root herstelde Home Assistant-dashboard is niet geïnspecteerd of gewijzigd als onderdeel van Task 016.

## Validatie Agent A

- `pnpm build`: exitcode 0; core, bridge en web gebouwd.
- `pnpm test`: exitcode 0; core 38/38, bridge 22/22 en web 8/8 geslaagd (68 totaal).
- `pnpm typecheck`: exitcode 0; core, bridge en web geslaagd.

## Resterend niet-blokkerend risico

- `HealthResponseInput.source` is nog als algemene string getypeerd. De actieve productieroute voert uitsluitend de vaste namen `home-assistant` en `simulated-p1` aan; een smallere gedeelde bronnaam-union kan later typeveiligheid versterken zonder het goedgekeurde runtimegedrag te wijzigen.

## Decision

`APPROVED`

---

## Task 015 — Transparante vergelijking van twee vlakke contracten

**Status:** APPROVED

## Acceptance Criteria Check

- [x] Beide contracten worden in vaste volgorde met exact dezelfde readonly intervallijst door `aggregateFlatIntervalCosts` berekend; de resultaten zijn gelijk aan afzonderlijke aggregatie-aanroepen.
- [x] `candidateMinusCurrentEur` is exact kandidaat-nettokost min huidige nettokost, zonder afronding of formatting.
- [x] Tests bewijzen negatief/`candidate`, positief/`current` en exact nul/`equal`.
- [x] `id` en `sourceLabel` van beide synthetische contracten blijven exact behouden; er wordt geen metadata afgeleid of verrijkt.
- [x] Een lege intervallijst geeft tweemaal de bestaande zesdelige nulaggregatie, verschil nul en `equal`, zonder tarieven.
- [x] Bestaande missing-, invalid-volume- en invalid-rate-fouten worden onveranderd gepropageerd; een ongeldig huidig contract wint aantoonbaar van een eveneens ongeldige kandidaat.
- [x] Frozen intervallen, intervalobjecten en beide contractobjecten worden niet gemuteerd.
- [x] Er is geen afronding, leveranciersfeed, marktclaim, ranglijst, jaarlijkse extrapolatie of extra kostencomponent toegevoegd.
- [x] Tests zijn pure vaste-waardetests zonder netwerk, klok, `.env` of persoonsgegevens.
- [x] Geen nieuwe dependency en geen wijziging buiten de toegestane corebestanden.
- [x] De voorgeschreven validatie is door Agent A uitgevoerd in volgorde build → test → typecheck.

## Scope / Quality Review

- De taaktekst noemde eenmaal de niet-bestaande naam `aggregateFlatEnergyCost`; de bestaande en in Task 013 goedgekeurde publieke functie heet `aggregateFlatIntervalCosts`. De implementatie hergebruikt correct die source-of-truthfunctie en de taakdocumentatie is hiermee rechtgezet.
- De winnerbepaling gebruikt uitsluitend het ongewijzigde signed verschil en introduceert geen epsilon of verborgen afronding.
- De publieke naam `winner` betekent aantoonbaar alleen winnaar van het aangeleverde paar; er is geen UI-tekst of marktbrede claim toegevoegd.

## Validatie Agent A

- `pnpm build`: exitcode 0; core, bridge en web gebouwd.
- `pnpm test`: exitcode 0; core 38/38, bridge 17/17 en web 8/8 geslaagd (63 totaal).
- `pnpm typecheck`: exitcode 0; core, bridge en web geslaagd.

## Decision

`APPROVED`

---

## Task 014 — Read-only Home Assistant-historytransport

**Status:** APPROVED

## Acceptance Criteria Check

- [x] Eén aanroep doet exact één expliciete `GET` naar `/api/history/period/{start}`; de test vergelijkt het gedecodeerde pad en alle queryparameters via `URL`/`URLSearchParams`.
- [x] Start- en eindtijd met `+01:00` blijven exact behouden en `sensor.synthetic_power_1` komt als één onvervormde `filter_entity_id` aan.
- [x] Request gebruikt exact `Authorization: Bearer fake-history-token` en `Content-Type: application/json`; uitsluitend synthetische credentials zijn gebruikt.
- [x] `[[state1, state2]]` geeft exact de eerste ruwe reeks terug; zowel `[]` als `[[]]` geeft `[]`.
- [x] HTTP 401 en 500 behouden de statusmelding; een fetch-rejectie wordt onveranderd doorgegeven. Geen fouttekst bevat het fake token.
- [x] Alle fetch-stubs zijn lokaal en worden via `finally` hersteld; er is geen echt netwerk, klok-, `.env`- of persoonsgegevensgebruik.
- [x] `read()` en alle bestaande tests blijven groen.
- [x] De productiewijziging blijft beperkt tot het historytransport en het ruwe publieke historytype; er is geen server- of UI-koppeling.
- [x] Geen nieuwe dependency en geen scope drift naar mapping, resampling, opslag, retry of cache.
- [x] De voorgeschreven validatie is door Agent A uitgevoerd in volgorde build → test → typecheck.

## Scope / Quality Review

- De starttijd wordt als pathsegment gecodeerd; alle querywaarden worden uitsluitend met `URLSearchParams` opgebouwd.
- De flags `minimal_response` en `no_attributes` zijn elk exact eenmaal als lege queryparameter aanwezig.
- De returnwaarde blijft bewust `Record<string, unknown>[]`; vormvalidatie en omzetting naar domeinpunten horen niet bij deze transporttaak.

## Validatie Agent A

- `pnpm build`: exitcode 0; core, bridge en web gebouwd.
- `pnpm test`: exitcode 0; core 32/32, bridge 17/17 en web 8/8 geslaagd (57 totaal).
- `pnpm typecheck`: exitcode 0; core, bridge en web geslaagd.

## Resterend niet-blokkerend risico

- Een syntactisch geldige maar onverwachte JSON-vorm van Home Assistant wordt nog niet runtime-gevalideerd. Task 014 specificeert alleen de geldige één-reeks- en lege vormen; domeinmapping blijft bewust uitgesteld.

## Decision

`APPROVED`

---

## Task 013 — Transparante aggregatie van vlakke energiekosten

**Status:** APPROVED

## Acceptance Criteria Check

- [x] Publiek resultaat-type bevat exact zes velden: intervalCount, twee volumetotalen, importkost, exportcredit en netto energiekost.
- [x] Drie binaire-exacte synthetische intervallen leveren exact 3.5 kWh import, 2 kWh export en intervalCount 3.
- [x] Importkost en exportcredit zijn exact totaalvolume × vlak tarief; een aparte test bewijst negatieve netto energiekost bij hogere credit.
- [x] Netto is exact importkost minus exportcredit en gelijk aan de som van `calculateFlatIntervalCost` per interval.
- [x] Lege invoer levert zes expliciete nulwaarden zonder tarieven te vereisen.
- [x] Een richting die in alle intervallen nul is vereist geen tarief.
- [x] Bestaande missing-, invalid-volume- en invalid-rate-fouten worden via de bestaande intervalfunctie gepropageerd; eerste ongeldige interval wint.
- [x] Frozen array en frozen intervalobjecten worden zonder mutatie verwerkt.
- [x] Geen afronding, formatting, netkosten, belastingen, capaciteit of vaste kosten toegevoegd.
- [x] Tests zijn pure vaste-waardetests; geen dependency of wijziging buiten core.
- [x] De voorgeschreven validatie is door Agent A uitgevoerd in volgorde build → test → typecheck.

## Scope / Quality Review

- Elk interval wordt vóór accumulatie door `calculateFlatIntervalCost` gevalideerd; validatieregels zijn niet gedupliceerd.
- Componenten worden uit gevalideerde totalen berekend en behouden de vlakke-tariefidentiteit.
- Inputtypes zijn readonly en runtime-frozentests leveren aanvullend mutatiebewijs.

## Validatie Agent A

- `pnpm build`: exitcode 0; core, bridge en web gebouwd.
- `pnpm test`: exitcode 0; core 32/32, bridge 13/13 en web 8/8 geslaagd (53 totaal).
- `pnpm typecheck`: exitcode 0; core, bridge en web geslaagd.

## Decision

`APPROVED`

---

## Task 012 — Eindige gebruikte tarieven voor vlakke kosten

**Status:** APPROVED

## Acceptance Criteria Check

- [x] `NaN`, `Infinity` en `-Infinity` importtarieven geven bij positief importvolume `INVALID_IMPORT_RATE`.
- [x] Dezelfde drie exporttarieven geven bij positief exportvolume `INVALID_EXPORT_RATE`.
- [x] Wanneer beide gebruikte tarieven ongeldig zijn, wordt import deterministisch eerst gemeld.
- [x] Beide volumecontroles staan vóór ontbrekende en ongeldige tarieven; volume-error behoudt prioriteit.
- [x] Ontbrekende gebruikte tarieven behouden hun bestaande missing-code door expliciete `undefined`-checks vóór `Number.isFinite`.
- [x] Niet-eindige tarieven bij exact nulvolume blokkeren niet en komen dankzij aparte cost/credit-takken niet in `0 * NaN` terecht.
- [x] Expliciet nul en eindige negatieve tarieven blijven geldig; alle eerdere costtests blijven groen.
- [x] Foutcode-union en specifieke foutklasse zijn publiek geëxporteerd met vaste berichten.
- [x] Tests zijn pure vaste-waardetests zonder netwerk, klok, `.env` of persoonsgegevens.
- [x] Geen nieuwe dependency en geen wijziging buiten toegestane corebestanden.
- [x] De voorgeschreven validatie is door Agent A uitgevoerd in volgorde build → test → typecheck.

## Scope / Quality Review

- Validatievolgorde is: importvolume, exportvolume, missing import, invalid import, missing export, invalid export.
- De formule is opgesplitst in importkost en exportcredit om ongebruikte niet-eindige tarieven veilig buiten de rekenexpressie te houden.
- Eindige negatieve tarieven blijven bewust onderdeel van de bestaande formule.

## Validatie Agent A

- `pnpm build`: exitcode 0; core, bridge en web gebouwd.
- `pnpm test`: exitcode 0; core 26/26, bridge 13/13 en web 8/8 geslaagd (47 totaal).
- `pnpm typecheck`: exitcode 0; core, bridge en web geslaagd.

## Decision

`APPROVED`

---

## Task 011 — Geldige volumes voor vlakke kosten

**Status:** APPROVED

## Acceptance Criteria Check

- [x] Negatief, `NaN`, `Infinity` en `-Infinity` importvolume leveren `InvalidFlatVolumeError` met `INVALID_IMPORT_VOLUME`.
- [x] Dezelfde vier exportwaarden leveren bij geldige import `INVALID_EXPORT_VOLUME`.
- [x] Wanneer beide volumes ongeldig zijn, wordt import deterministisch eerst gerapporteerd.
- [x] Volumevalidatie staat vóór beide missing-rate-controles; ongeldige import met ontbrekende tarieven geeft volume-error.
- [x] Exact nul en alle bestaande formule-, missing-rate- en zero-rate-tests blijven groen.
- [x] Een aanwezig negatief import- en exporttarief blijft volgens de bestaande formule berekenbaar.
- [x] Foutcode-union en specifieke foutklasse zijn publiek geëxporteerd met vaste berichten.
- [x] Tests zijn pure vaste-waardetests zonder netwerk, klok, `.env` of persoonsgegevens.
- [x] Geen nieuwe dependency en geen wijziging buiten toegestane corebestanden.
- [x] De voorgeschreven validatie is door Agent A uitgevoerd in volgorde build → test → typecheck.

## Scope / Quality Review

- Implementatie gebruikt `Number.isFinite` en `< 0`; `0` en `-0` blijven wiskundig geldig nulvolume.
- Import wordt vóór export gevalideerd en beide volumes vóór tarieven.
- De kostenformule is voor geldige invoer ongewijzigd.

## Validatie Agent A

- `pnpm build`: exitcode 0; core, bridge en web gebouwd.
- `pnpm test`: exitcode 0; core 21/21, bridge 13/13 en web 8/8 geslaagd (42 totaal).
- `pnpm typecheck`: exitcode 0; core, bridge en web geslaagd.

## Resterend niet-blokkerend risico

- Een gebruikt tarief met `NaN` of oneindigheid kan nog een niet-eindige kostenuitkomst geven. Eindige negatieve tarieven zijn daarentegen bewust geldig. Dit wordt afzonderlijk afgebakend.

## Decision

`APPROVED`

---

## Task 010 — Geen stilzwijgende nulprijzen in vlakke kosten

**Status:** APPROVED

## Acceptance Criteria Check

- [x] Positief importvolume zonder importtarief werpt `MissingFlatRateError` met code `MISSING_IMPORT_RATE`.
- [x] Positief exportvolume zonder exporttarief werpt code `MISSING_EXPORT_RATE`.
- [x] Bij beide ontbrekende benodigde tarieven wordt import deterministisch eerst gecontroleerd.
- [x] Expliciete import- en exporttarieven `0` blijven geldig en geven voor de testvolumes uitkomst `0`.
- [x] Exact nulvolume vereist voor die richting geen tarief; import-only, export-only en volledig nul zijn getest.
- [x] De drie eerder goedgekeurde formulecases blijven ongewijzigd groen.
- [x] Tests zijn pure vaste-waardetests zonder netwerk, klok, `.env` of persoonsgegevens.
- [x] Geen nieuwe dependency en geen wijziging buiten toegestane corebestanden.
- [x] De voorgeschreven validatie is door Agent A uitgevoerd in volgorde build → test → typecheck.

## Scope / Quality Review

- De foutcode is een geëxporteerde string-union en de specifieke foutklasse bewaart code en vaste Nederlandstalige melding.
- Expliciete `undefined`-checks voorkomen dat tarief `0` als ontbrekend wordt gezien.
- De bestaande formule is inhoudelijk ongewijzigd wanneer de benodigde tarieven aanwezig zijn.

## Validatie Agent A

- `pnpm build`: exitcode 0; core, bridge en web gebouwd.
- `pnpm test`: exitcode 0; core 16/16, bridge 13/13 en web 8/8 geslaagd (37 totaal).
- `pnpm typecheck`: exitcode 0; core, bridge en web geslaagd.

## Resterend niet-blokkerend risico

- Negatieve, `NaN`- en oneindige kWh-volumes kunnen nog een onbetrouwbare uitkomst produceren of een ontbrekend tarief omzeilen. Dit was expliciet geen onderdeel van Task 010 en wordt afzonderlijk gevalideerd.

## Decision

`APPROVED`

---

## Task 008 — Begrensde en race-geteste lokale CSV-selectie

**Status:** APPROVED

## Acceptance Criteria Check

- [x] `MAX_LOCAL_CSV_BYTES` is exact `10 * 1024 * 1024`; exact de grens roept `text()` eenmaal aan en `+1` levert `FILE_TOO_LARGE` zonder `text()`-aanroep.
- [x] Groottefout gebruikt een vaste niet-technische melding zonder bestandsinhoud of interne details.
- [x] Deferred-promise-test bewijst dat oud succes na nieuwer succes geen state meer wijzigt.
- [x] Deferred-promise-test bewijst dat oude rejectie na nieuwer succes geen state meer wijzigt.
- [x] Lege selectie wist naam/preview en invalideert een pending read.
- [x] Iedere selectie publiceert synchroon eerst `{ fileName, preview: null }`; dit is expliciet getest na een eerdere succespreview.
- [x] Controller gebruikt alleen structurele `name`, `size`, `text`; geen DOM, netwerk, storage, logging, klok, timer of echt bestand.
- [x] React gebruikt één gememoiseerde controller en behoudt de bestaande privacy- en previewoutput.
- [x] Alle bestaande preview-, core- en bridge-tests blijven groen; geen nieuwe dependency of scope drift.
- [x] De voorgeschreven validatie is door Agent A uitgevoerd in volgorde build → test → typecheck.

## Scope / Quality Review

- De limiet wordt vóór iedere async leesactie gecontroleerd.
- Dezelfde monotone sequence beschermt parse-succes, parse/leesfout en lege selecties.
- Tests sturen resolutievolgorde zonder timers en zijn daardoor deterministisch.

## Validatie Agent A

- `pnpm build`: exitcode 0; core, bridge en web gebouwd.
- `pnpm test`: exitcode 0; core 11/11, bridge 13/13 en web 8/8 geslaagd (32 totaal).
- `pnpm typecheck`: exitcode 0; core, bridge en web geslaagd.

## Decision

`APPROVED`

---

## Task 007 — Lokale structurele CSV-importpreview

**Status:** APPROVED

## Acceptance Criteria Check

- [x] Succespreview rendert uitsluitend bestandsnaam, delimiter, datarijenaantal en headers; `mapCsvPreview` neemt geen rowwaarden over.
- [x] UI gebruikt herhaaldelijk “structuurcontrole” en zegt expliciet dat dit geen bevestiging van een geldige Fluvius-export is.
- [x] `CsvParseError` wordt gemapt naar de stabiele foutcode en een vaste niet-technische melding; foutstate vervangt de gewiste succespreview.
- [x] Onbekende/File.text-fouten worden `LOCAL_READ_ERROR` zonder originele melding, stack of bestandsinhoud.
- [x] Iedere selectie verhoogt eerst het selectienummer en wist onmiddellijk bestandsnaam/preview; lege selectie stopt daarna schoon.
- [x] Zowel succes- als catch-pad negeren een verouderde async selectie via dezelfde sequence-check.
- [x] Pure mappertests dekken succes, bekende parsefout en onbekende fout met synthetische strings.
- [x] Importcode gebruikt alleen `File.text()`; geen fetch, bridge, storage of logging. Datarijen worden niet gerenderd of in previewstate bewaard.
- [x] Web-testscript voert drie echte tests uit; bestaande core- en bridge-tests blijven groen.
- [x] Geen nieuwe dependency en geen wijziging buiten toegestane webbestanden.
- [x] De voorgeschreven validatie is door Agent A uitgevoerd in volgorde build → test → typecheck.

## Structurele smokecheck

- Productiebundel bevat succes-, fout- en expliciete niet-Fluvius-validiteitsteksten.
- Productiebundel bevat niet de synthetische test-rowwaarde `verborgen waarde`.
- Gebouwde CSS bevat de preview- en foutstatusregels.

## Validatie Agent A

- `pnpm build`: exitcode 0; core, bridge en web gebouwd.
- `pnpm test`: exitcode 0; core 11/11, bridge 13/13 en web 3/3 geslaagd (27 totaal).
- `pnpm typecheck`: exitcode 0; core, bridge en web geslaagd.

## Resterend niet-blokkerend risico

- De sequence-check is door code-inspectie symmetrisch correct, maar nog niet rechtstreeks met deferred promises getest.
- Er is nog geen expliciete bestandsgroottelimiet vóór `File.text()`; dit wordt de volgende afgebakende hardeningtaak.

## Decision

`APPROVED`

---

## Task 006 — Pure CSV-structuurlaag voor Fluvius-import

**Status:** APPROVED

## Acceptance Criteria Check

- [x] BOM/puntkomma/CRLF en komma/LF leveren dezelfde headers en rows met de correcte expliciete delimiter.
- [x] Een delimiter binnen quotes en `""` als escaped quote zijn getest.
- [x] Alleen headers worden getrimd; onder meer `" 001 "` en een ongequote waarde met spaties blijven strings en behouden whitespace.
- [x] `EMPTY_INPUT`, `EMPTY_HEADER`, `DUPLICATE_HEADER`, `TOO_FEW_FIELDS` en `TOO_MANY_FIELDS` zijn onderscheiden en via `CsvParseError.code` getest.
- [x] Trailing lege regels verdwijnen; een lege waarde in een echte rij blijft aanwezig.
- [x] Parser en fixtures bevatten geen echte EAN, adres, meter-ID of andere persoonsgegevens.
- [x] Tests zijn pure stringtests zonder bestandssysteem, netwerk, klok of `.env`.
- [x] Alle bestaande core- en bridge-tests blijven groen.
- [x] Geen nieuwe dependency en geen wijziging buiten de toegestane corebestanden.
- [x] De voorgeschreven validatie is door Agent A uitgevoerd in volgorde build → test → typecheck.

## Scope / Quality Review

- De parser doet uitsluitend CSV-structuur en claimt geen Fluvius-validiteit of energiemapping.
- Delimiterdetectie negeert delimiters binnen gequote headerwaarden; CRLF en LF worden beide ondersteund.
- `UNCLOSED_QUOTE` bestaat als aanvullende stabiele foutcode; dit gedrag is geïmplementeerd maar nog niet afzonderlijk getest. Dat is een klein vervolgpunt, geen gemist criterium.
- De publieke subpath-export `@crems/core/csv` is vanuit `apps/web` rechtstreeks geïmporteerd en functioneel aangeroepen; parse-uitkomst was correct.

## Validatie Agent A

- `pnpm build`: exitcode 0; core, bridge en web gebouwd.
- `pnpm test`: exitcode 0; core 11/11 en bridge 13/13 geslaagd (24 tests totaal; web heeft nog 0 tests).
- `pnpm typecheck`: exitcode 0; core, bridge en web geslaagd.
- Publieke subpath-smoketest vanuit `apps/web`: exitcode 0, exports `CsvParseError,parseCsv` beschikbaar.

## Decision

`APPROVED`

---

## Task 005 — Testbare Home Assistant- versus simulatiebronselectie

**Status:** APPROVED

## Acceptance Criteria Check

- [x] Geldige URL en token leveren `home-assistant`; een requesttest bewijst dat beide vóór constructie zijn getrimd.
- [x] Zeven configuraties dekken volledig ontbrekend, iedere afzonderlijk ontbrekende kant, leeg en whitespace voor URL/token; alle leveren `simulated-p1`.
- [x] De volledige geconfigureerde entitymapping is zonder netwerkcall ongewijzigd zichtbaar via `detectedEntities`.
- [x] `server.ts` roept `createMeterSource` exact één keer aan en bevat geen tweede URL/token-keuze.
- [x] `source-factory.ts` heeft geen toegang tot `process.env`, netwerk, klok of logging en construeert alleen de gekozen bron.
- [x] Tests gebruiken fake configuratie; de enige fetch wordt lokaal gestubd en in `finally` hersteld.
- [x] Alle bestaande core- en bridge-tests blijven groen.
- [x] Geen nieuwe dependency en geen wijziging buiten factory, server en bridgetests.
- [x] De voorgeschreven validatie is door Agent A uitgevoerd in volgorde build → test → typecheck.

## Scope / Quality Review

- De startupsemantiek blijft gelijk: alleen een niet-lege URL én token activeren Home Assistant; er is geen runtime fallback toegevoegd.
- De factory accepteert de entitymapping als data en muteert ze niet.
- De server blijft verantwoordelijk voor `.env` en procesconfiguratie; de factory blijft zuiver.

## Validatie Agent A

- `pnpm build`: exitcode 0; core, bridge en web gebouwd.
- `pnpm test`: exitcode 0; core 3/3 en bridge 13/13 geslaagd (16 tests totaal; web heeft nog 0 tests).
- `pnpm typecheck`: exitcode 0; core, bridge en web geslaagd.

## Decision

`APPROVED`

---

## Task 004 — Read-only Home Assistant-transport en HTTP-fouten

**Status:** APPROVED

## Acceptance Criteria Check

- [x] `HomeAssistantSource` gebruikt expliciet `GET` en tests bewijzen exact `http://home-assistant.invalid/api/states` voor een base-URL met en zonder trailing slash.
- [x] Tests bewijzen exact `Authorization: Bearer fake-test-token` en `Content-Type: application/json`; er wordt uitsluitend een fake token gebruikt.
- [x] HTTP 401 en 500 leveren exact `Home Assistant API antwoordde met <status>` en bevatten de tokenwaarde niet.
- [x] Een lokale fetch-rejectie wordt als fout doorgegeven en produceert geen `LiveMeterReading`.
- [x] De zeven bestaande normalisatie-/read-tests blijven groen.
- [x] Alle transporttests gebruiken lokale stubs en veroorzaken geen echte netwerk-, klok- of `.env`-toegang.
- [x] Node's test runner geeft bij assertion failure een niet-nul exitstatus.
- [x] Geen nieuwe dependency of wijziging buiten de toegestane bridgebestanden.
- [x] De voorgeschreven validatie is door Agent A uitgevoerd in volgorde build → test → typecheck.

## Scope / Quality Review

- De enige productiegedragswijziging is de expliciete HTTP-methode `GET`; URL, headers, timeout en foutsemantiek zijn verder behouden.
- De gedeelde `withFetchStub` herstelt `globalThis.fetch` in `finally`; de oudere read-fouttest doet hetzelfde rechtstreeks.
- De statusfouttekst bevat geen response body, request headers of token.

## Validatie Agent A

- `pnpm build`: exitcode 0; core, bridge en web gebouwd.
- `pnpm test`: exitcode 0; core 3/3 en bridge 10/10 geslaagd (13 tests totaal; web heeft nog 0 tests).
- `pnpm typecheck`: exitcode 0; core, bridge en web geslaagd.

## Decision

`APPROVED`

---

## Task 003 — Betrouwbare Home Assistant-vermogensnormalisatie

**Status:** APPROVED

## Acceptance Criteria Check

- [x] Tests bewijzen `250 W → 250 W`, `0.25 kW → 250 W`, behoud van een negatieve genormaliseerde waarde en afronding van decimale watt.
- [x] `unknown`, `unavailable`, `none`, lege, whitespace- en niet-numerieke states leveren `undefined` op.
- [x] `HomeAssistantSource.read()` gebruikt de normalisatie en werpt de bestaande fout wanneer import en export beide ongeldig zijn.
- [x] Een echte state `"0"` blijft geldig als `0 W`; de implementatie gebruikt expliciete `undefined`-checks en verwart nul niet met afwezigheid.
- [x] Tests gebruiken een lokale fetch-stub en vaste waarden; geen live netwerk, `.env` of echt token.
- [x] Het bridge-testscript gebruikt Node's test runner; falende assertions geven een niet-nul exitstatus.
- [x] Geen nieuwe dependency en geen wijziging buiten de toegestane productie-/testbestanden waargenomen.
- [x] Build en typecheck slagen; de testsuite slaagt buiten de beperkte sandbox met 7/7 tests.
- [x] Eenheden worden getrimd en hoofdletterongevoelig verwerkt; ontbrekend/leeg gebruikt de compatibele W-default en expliciete `MW`/`VA` wordt geweigerd.

## Opgeloste reviewbevinding

1. De eerste implementatie interpreteerde onbekende of vervuilde eenheden als watt. De correctie normaliseert trim/case, accepteert alleen `w`/`kw`, behoudt uitsluitend voor ontbrekend/leeg de W-default en geeft voor `MW`/`VA` `undefined` terug. Gerichte regressietests bewijzen dit gedrag.

## Herreviewbewijs

- Productiewijziging beperkt tot de vereiste eenheidsvalidatie in `normalizePowerInWatts`.
- Nieuwe tests bewijzen `" kW "`, `" w "`, ontbrekende eenheid, lege eenheid en afwijzing van `MW` en `VA`.
- Geen wijziging aan detectielogica, andere sensortypes, servercode of dependencies.

## Validatie Agent A

- `pnpm build`: exitcode 0.
- `pnpm test`: exitcode 0; core 3/3 en bridge 7/7 geslaagd (10 tests totaal; web heeft nog 0 tests).
- `pnpm typecheck`: exitcode 0.

## Decision

`APPROVED`

---

## Task 002 — Gedragsbewijs voor vlakke intervalkost

**Status:** APPROVED

## Acceptance Criteria Check

- [x] `packages/core/test/calculate-flat-interval-cost.test.ts` bevat drie onafhankelijke tests voor alleen import, alleen export en de gecombineerde formule.
- [x] Iedere case geeft zowel import- als exporttarief expliciet door; ontbrekende tarieven worden niet getest of genormeerd.
- [x] De tests gebruiken uitsluitend vaste objectwaarden en hebben geen netwerk-, klok-, token- of `.env`-toegang.
- [x] `packages/core/package.json` voert het testbestand met Node's test runner uit; assertions worden door de runner als falende test en niet-nul processtatus behandeld.
- [x] Geen dependency of productiecode gewijzigd. De bestaande functie in `packages/core/src/index.ts` is ongewijzigd.
- [x] De voorgeschreven validatie is door Agent A opnieuw uitgevoerd in volgorde build → test → typecheck.

## Testbewijs Agent A

- `pnpm build`: exitcode 0; core, bridge en web gebouwd. De eerste sandboxpoging werd door Windows-toegang voor esbuild geblokkeerd; dezelfde ongewijzigde build slaagde met de bestaande runtime buiten die beperking.
- `pnpm test`: exitcode 0; 3 tests gevonden, 3 geslaagd, 0 gefaald. Bridge en web hebben nog 0 tests, buiten scope van Task 002.
- `pnpm typecheck`: exitcode 0; core, bridge en web geslaagd.

## Scope / Quality Review

- De wijziging is minimaal: één core-testbestand en het bestaande core-testscript.
- De assertions bewijzen zowel exacte bedragen als, voor de enkelvoudige cases, de tekenrichting.
- Het importeren van TypeScript-broncode werkt met de vastgelegde Node 24-runtime. Een expliciete minimale Node-versie is nog niet gedocumenteerd; dit is geen blocker voor deze lokale taak.

## Decision

`APPROVED`

---

## Task 001 — Projectstructuur en projectgeheugen

**Status:** APPROVED

## Acceptance Criteria Check

- [x] Actieve productiecode staat uitsluitend in `apps/` en `packages/`.
- [x] Prototype en onderzoek zijn fysiek gescheiden.
- [x] Secrets zijn uitgesloten van repositoryzoekresultaten en `.gitignore` dekt `.env`.
- [x] Requirements, architectuur, plan en één huidige taak zijn vastgelegd.
- [x] Typecontrole, testscripts en build opnieuw uitgevoerd na herstructurering.

## Findings

- Geen geautomatiseerde producttests aanwezig; bestaande `node --test` scripts leveren nog geen gedragsbewijs.
- Geen Git-repository aanwezig, waardoor review niet op een echte diff kan steunen.
- Live Home Assistant polling is functioneel maar nog niet efficiënt.

## Test Review

- `pnpm test`: geslaagd, maar momenteel 0 tests; dit is expliciet Task 002.
- `pnpm typecheck`: geslaagd voor core, bridge en web.
- `pnpm build`: geslaagd voor core, bridge en web.

## Scope / Architecture Review

- Geen productiecode verwijderd of functioneel gewijzigd tijdens de herstructurering.
- Oude demo, onderzoek en integratiereferenties zijn behouden en duidelijk gescheiden.
- Workspace-builds omvatten uitsluitend `apps/*` en `packages/*`.

## Decision

`APPROVED`
## Task 021 — eindreview

**Status:** APPROVED

- Productiebuild, volledige testreeks en typecontrole slagen.
- De websiteproxy levert gemeten Home Assistant-history voor exact de voorbije 24 uur.
- De SVG bewaart uitsluitend gevalideerde import- en exportpunten binnen het responsevenster.
- Een lege richting tekent geen lijn; het laatste echte punt wordt niet naar nu of morgen doorgetrokken.
- Loading, offline, fout, leeg en gedeeltelijke data hebben afzonderlijke zichtbare staten.
- `chartA`, `chartB`, demo-, morgen- en prijsgrafiekartefacten zijn afwezig uit bron en productiebuild.
