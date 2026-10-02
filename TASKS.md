# Tasks

## Current Task

### Task 061 — Operationele audit, release afronden en LAN-toegang — 1 oktober 2026

**Status:** CHANGES REQUIRED — aanvullende centrale-opslagrobuustheid in uitvoering; eerdere tool-/test-/documentatiewijzigingen APPROVED; Supervisor-versie en Ingress-HTTP geverifieerd. Directe LAN-bereikbaarheid en actuele browsergate blijven open (NOT RUN). Task 060 is historisch APPROVED, geen tweede actieve implementatietaak.

Doel: de bestaande ongeconfigureerde release 0.1.13 controleren, veilig op Home Assistant bijwerken en toegang vanaf het thuisnetwerk via Home Assistant Ingress bewijzen. Geen nieuwe productfunctie, providerrequest of directe ongeauthenticeerde bridgepoort. Het netwerkadres moet uit actuele waarneming blijken, niet uit een vermoeden. Read-only netwerkinfo bevestigt inmiddels `192.168.88.253`; de gebruikerslink is [CREMS Energie](http://192.168.88.253:8123/hassio/ingress/350f0e24_crems_energy).

Owner productie-/toolcode: root, de enige schrijver. Exacte write set root: `tools/release-crems.ps1`, `tools/ha-supervisor.mjs`, `tools/ha-supervisor.test.mjs`, `apps/bridge/src/server.ts` uitsluitend voor de bewezen overlappende meterpoll-reparatie, `apps/bridge/test/production-start.test.ts` voor peer-403 en meterpollregressies, `apps/web/src/App.tsx` voor opslagprivacytekst en de concreet bewezen veilige verwijdergrens, `apps/web/test/battery-flow-structure.test.ts` voor tekst/render/verwijder/hydratieraces, `apps/web/src/local-energy-profile.ts` en `apps/web/test/local-energy-profile.test.ts` voor bewezen lokale verwijderfailure, `apps/bridge/src/central-storage.ts`, `apps/bridge/test/central-storage.test.ts`, `apps/bridge/src/central-storage-route.ts` en indien nodig `apps/bridge/test/central-storage-route.test.ts` voor het concreet gereproduceerde ongeldige-snapshotherstel. Agent A schrijft uitsluitend `TASKS.md`, `REQUIREMENTS.md`, `ARCHITECTURE.md`, `README.md`, `PRODUCT_AUDIT.md`, `docs/release-home-assistant.md`, `docs/task-061-review.md`, `REVIEW.md`, `PLAN.md`, `docs/{central-storage-plan,full-audit-2026-09-24,harness,task-036-navigation-check,task-037-haos-app,architecture}.md`, `crems/DOCS.md`, `apps/home-assistant-addon/crems/README.md`. Agent B voert tests read-only uit; Agent C voert read-only QA uit. Geen wijzigingen aan `.harness`-attestaties, dependencies, manifests, opslag-/syncworkflow of frontendlayout binnen deze taak. Zichtbare frontendwijziging uitsluitend juiste opslagprivacytekst. Productiewijzigingen uitsluitend bewezen centrale opslagvalidatie/HTTP-grenzen en overlappende meterpolls.

Acceptatie: actuele build/tests/typecheck en toolregressies PASS; diffcheck en onafhankelijke code-review; Git bevat alleen gecontroleerde wijzigingen; onveranderde gepubliceerde v0.1.13/image blijft traceerbaar; Supervisor bevestigt doelversie en draaiende toestand; alleen bij benodigde appupdate wordt backup afgedwongen; LAN-Home Assistant is bereikbaar en CREMS opent via geauthenticeerde Ingress. Geen tokens, opties of persoonsgegevens in uitvoer. Bij onzekere updatestatus eerst read-only verifiëren voordat een mutatie opnieuw wordt uitgevoerd.

Gebruikersroute: open `http://<actueel-Pi-LAN-adres>:8123`, meld aan bij Home Assistant en open CREMS Energie. De add-on luistert intern op 8099 en laat uitsluitend Supervisor-peer `172.30.32.2` toe. Desktop/mobiel, refresh/opslag, live waarden, foutstaten en runtimecachecontrole vereisen een actuele Agent C-browser-PASS; zonder nieuwe expliciete browseropdracht blijft die gate NOT RUN. Historische browserrapporten zijn geen actuele Pi-goedkeuring.

Actueel bewijs 1 oktober: geauthenticeerde Supervisor-info bevestigt `version=0.1.13`, `version_latest=0.1.13`, `state=started`. Geen update uitgevoerd; appbackup niet gemaakt of gecontroleerd in deze run. Pi-netwerkinfo bevestigt LAN-adres `192.168.88.253/24` (end0, gateway `192.168.88.1`). Direct LAN-HTTP vanaf de huidige host liep in timeout; via Tailscale gaven HA en geauthenticeerde Ingress HTTP 200. Dit bewijst geen rechtstreekse LAN-bereikbaarheid vanaf deze host. Core 65/65, web 134/134, bridge 101/101 vóór de nieuwe test, build/typecheck PASS; productie-start inclusief peerregressie 9/9 en helper/harness 11/11 PASS. De eerdere finale harness hoort bij commit 489addc. Na de aanvullende opslag-/meterpollfixes is een nieuwe volledige finale harness/build/typecheck vereist. Gerichte opslag-/productiestartregressies zijn door Agent A onafhankelijk 21/21 PASS herhaald; nieuwe code nog niet uitgerold. Bewijs en resterende beperkingen worden vastgelegd in `docs/task-061-review.md`. Beperkte wijzigingen zijn APPROVED; Task 061 blijft CHANGES REQUIRED tot directe LAN- en browsercriteria bewezen zijn. Er wordt geen volledige releasegoedkeuring geclaimd.

### Aanvullende bewezen opslagbevinding — Task 061

Een technische snapshot met een null/primitief entry veroorzaakt een TypeError in de centrale validator; ook ongeldige geneste financiële resultaten moeten vóór property-toegang worden begrensd. Root is de enige schrijver van deze reparatie. Acceptance: null/primitieve technische entries en malformed financiële geneste resultaten geven `false` zonder throw; ongeldige PUT krijgt `invalid_result`/400; corrupte opgeslagen JSON met zulke inhoud geeft `StorageCorruptError` en veilige recovery-responses zonder overschrijven van bestaande bytes. Aanvullend concreet bewezen: oversized streamende opslag-PUT sluit de socket in plaats van 413; de route moet begrensd lezen en HTTP 413 `body_too_large` teruggeven zonder opslagwijziging. Backend accepteert ongeldige daglabels zoals `2025-99-99` die de webvalidator afwijst. Dagvalidatie moet canonieke Brusselse kalenderdagen, intervalgrenzen/aantallen, geschatte/gatmetadata en fysieke energiebalansen overeenkomstig het bestaande webcontract controleren; oude geldige snapshots blijven geldig. Geen frontend- of schemawijziging. Aanvullend gereproduceerd: twee afzonderlijk geldige snapshots onder de requestlimiet kunnen samen `results.json` boven 4 MiB maken en volgende reads als corrupt blokkeren. Acceptance: vóór iedere write wordt de geserialiseerde gecombineerde store op 4 MiB begrensd; overschrijding geeft `StorageValidationError`/HTTP `invalid_result` 400 en behoudt bestaande bytes/readbaarheid. Test een daadwerkelijk geldige near-boundary snapshot gevolgd door een tweede geldige snapshot via echte API. Geen self-corruption of gedeeltelijke write. Tests gebruiken uitsluitend synthetische gegevens. Nieuwe finale build/tests/typecheck zijn vereist; de eerdere groene fingerprint geldt niet voor deze bronwijziging.

Aanvullend bewezen met synthetische HA-runtime: eerste lezing 2,5 seconden en volgende lezingen 100 ms veroorzaken twee gelijktijdige reads en voltooiingsvolgorde `[2,3,1,4]`; publieke gemeten waarden lopen 200→300→100→400 terug. Root repareert de bestaande eensecondetimer met een singleflight-guard en `finally`-vrijgave. Acceptance: maximaal één actieve bronlezing, nooit overschrijven door oudere overlappende lezing, gebruikelijke snelle eensecondecadans behouden en een mislukte read blokkeert volgende reads niet. Echte tijdelijke productie-serverregressie met uitsluitend synthetische HA-bron. Zichtbare runtimegate blijft vereist; geen nieuwe deploymentclaim.

### Volgende sequentiële stap — opslagprivacytekst

Commit `a930624` met de backend-/documentatiereparaties is op main gepusht; niet op de Pi uitgerold. De gebruiker heeft voortzetten expliciet opgedragen. Root blijft de enige productiecode-/testschrijver van dezelfde actieve Task 061.

Concreet probleem: `App.tsx` zegt op het overzicht en rapport "op dit toestel" terwijl expliciet bewaren een browserkopie bewaart en synchronisatie van veilige snapshots naar de Pi probeert. Acceptance: vóór Bewaar energiebalans, Bewaar technisch/volledig batterijrapport en legacy-omzetting staat zichtbaar dat alleen veilige samenvattingen in deze browser worden bewaard en met de Raspberry Pi worden gesynchroniseerd, waar gebruikers met toegang tot deze Home Assistant/CREMS-installatie ze kunnen bekijken. CSV, EAN, meter-ID, bestandsnaam en kwartierregels blijven tijdelijk/niet opgeslagen. Overzicht en rapportbadge mogen geen exclusieve device-only opslag beloven. Formulering mag geen synchronisatiesucces claimen voordat dat bevestigd is; bestaande foutstatus en fallback blijven exact behouden.

Geen nieuwe opslag, syncgedrag, toestemmingscheckbox, layout, afhankelijkheid of contract-/berekeningswijziging. Tekst/renderregressies controleren de genoemde savepaden en afwezigheid van oude device-only belofte. Agent C mag tekst/SSR read-only verifiëren; dat levert geen browser-PASS. Actuele browsergate blijft NOT RUN zonder nieuwe expliciete browserbedieningsopdracht. Privacycopy is door root geïmplementeerd; onafhankelijke Agent A-code/componentreview vindt geen concrete blocker en gerichte tests 19/19 PASS. Niet op de Pi uitgerold. Nieuwe finale build/tests/typecheck/fingerprint zijn nodig voor de gewijzigde frontend; volledige release blijft CHANGES REQUIRED.

## Previously approved task

### Task 060 — Fluvius-CSV gebruiken voor contractjaarverbruik — 29 september 2026

**Status:** APPROVED — volledige tests/build/typecheck PASS, Astra/Agent A-review PASS en Agent C volledige localhost-flow PASS. Tag `v0.1.13` en linux/arm64-image zijn gepubliceerd; Pi-installatie wacht op een long-lived HA-token die de gebruiker veilig in de terminalprompt invoert. Geen providerrequest.

Doel: op de contractpagina een keuze bieden om jaarverbruik uit een Fluvius-CSV lokaal te controleren en daarna expliciet dag-/nacht-afname en injectie in het vergelijkingsformulier over te nemen. CSV-inhoud, EAN, meter-ID, bestandsnaam en kwartierregels worden niet opgeslagen of meegestuurd. Automatisch invullen vereist minstens 364 dagen dekking in elk van de vier registers, aansluiting op dezelfde begin-/eindperiode, betrouwbare volgorde en nul schattingen, gaps, overlaps, dubbels en afgekeurde rijen. Een latere vergelijking blijft afzonderlijk achter de bestaande privacycheckbox en actie.

Write set (één schrijver: root): `packages/core/src/fluvius-stream-preview.ts`, `packages/core/test/fluvius-stream-preview.test.ts`, `apps/web/src/{App.tsx,csv-preview.ts,contract-csv.ts,styles.css}`, `apps/web/test/contract-csv.test.ts`, `apps/home-assistant-addon/crems/config.yaml`, `crems/config.yaml`, `apps/bridge/test/production-start.test.ts`, `tools/release-crems.ps1`, `docs/release-home-assistant.md`, `TASKS.md`, `REVIEW.md`, `PRODUCT_AUDIT.md`, `docs/task-037-haos-app.md`. De eerder gegeven gebruikersopdracht om de website op de Raspberry Pi te publiceren geldt voor deze nieuwe ongeconfigureerde release; er wordt geen providerrequest gedaan.

Agent C-browserrapport `docs/task-060-browser-report.md`: verse geïsoleerde localhost-test zonder opgeslagen profiel; postcode 1000/gewest Brussel, huishouden 4, variabel tarief en domiciliëring Nee bleven behouden nadat contractpagina naar CSV en terug navigeerde. Synthetisch 2025-bestand leverde 3.504 kWh per register; alle vier jaarvelden werden correct gevuld, consent bleef uit en compare disabled. Geen profiel opgeslagen of providerverzoek. Console-inspectie en Pi-runtime zijn niet in dit lokale rapport getest.

Agent A/Astra-audit `docs/task-060-review.md`: PASS na fixes voor behouden formulierstate, gebruik zonder lokaal Energiepaspoort, volledige commitcontrole vóór release en exacte taggebonden workflow-/linux-arm64-imageverificatie.

Validatie: `pnpm harness check` PASS met 65 core-tests, 101 bridge-tests, 134 webtests, alle builds en typechecks; PowerShell-parser, `git diff --check` PASS; onafhankelijke review en browserflow PASS. Release `v0.1.13` gebruikt workflow [36600366405](https://github.com/xXRobinXx/crems/actions/runs/36600366405), OCI-index `sha256:bd8000e778e61b94ac5a312b2f546e67e4943aa5a8adb9779858283e0ddc5add`, linux/arm64 `sha256:39c2ce281cbb8198ce6be876e8f44a1bf27ad82a94b02a89e8adb7d45925fccd`. Herhaalbare Windows-releaseprocedure staat in `tools/release-crems.ps1`; gebruik is beschreven in `docs/release-home-assistant.md`. Na de onderbroken eerste run is de resumefunctie gereviewd om exact deze tag veilig af te ronden. De HA-installatie moet nog worden bevestigd; provider blijft ongeconfigureerd.

## Previous Tasks

### Task 059 — Belgische contractcatalogus en opt-in vergelijking via Aanbieders.be — 28 september 2026

**Status:** ongeconfigureerde release `v0.1.12` is gepubliceerd en op de Pi geïnstalleerd. Offline code/UI acceptatie PASS. Live partnerrechten, credentials en providerresponse ontbreken; de feature blijft veilig ongeconfigureerd en doet geen providerrequest.

Gebruikersdoel: actuele Belgische elektriciteitsproducten via de gedocumenteerde e-Contract API raadplegen en, na expliciete invoer/actie, aanbiedingen laten vergelijken. Backend houdt HMAC credentials geheim; geen scraping of automatische verzending van lokaal Energiepaspoort. De gebruiker voert regio/postcode, gezin, afname dag/nacht en injectie expliciet in en ziet vóór verzenden dat deze invoer naar Aanbieders.be gaat. Resultaten krijgen bron, ophaaltijd, productstatus, regio-/tariefdetails en een waarschuwing dat eventuele ongedekte factuuronderdelen ontbreken.

Write set (één schrijver: root): `apps/bridge/src/contract-catalog.ts`, `apps/bridge/src/contract-catalog-route.ts`, `apps/bridge/src/server.ts`, bridge regressietest(en); `apps/home-assistant-addon/crems/config.yaml`, `apps/home-assistant-addon/crems/run.mjs`, `crems/config.yaml`, `apps/bridge/test/production-start.test.ts`; `apps/web/src/{App.tsx,contract-market.ts}`, `apps/web/src/styles.css`, web regressietest(en); `docs/task-037-haos-app.md`, `TASKS.md`, `PRODUCT_AUDIT.md`, `REVIEW.md`. Gebruiker heeft Raspberry Pi-publicatie eerder expliciet gevraagd; release is uitsluitend ongeconfigureerd, met lege optionele e-Contract-velden. Geen credentials opslaan, providerrequests, live account, voorwaarden of betaalplan.

Implementatie: de bridge gebruikt uitsluitend de vaste HTTPS-host, HMAC-SHA1 met epochseconden/unieke nonce en gedocumenteerde query-authvelden. POST-input is JSON-only, strikt geallowlist, postcode/gewest-consistent, volumes begrensd, body maximaal 8 KiB; upstream timeout 8 s, body maximaal 2 MB, redirect uit, no-store en vaste foutcodes. Vergelijkingsresponse normaliseert product en de aparte sibling-`pricing`-node; UI-client valideert het volledige responsecontract vóór render. Resultaatvelden omvatten veilige naam/leverancier/standaardprijs/actieprijs/regio/status/tarief/datum/duur/HTTPS-link. UI gebruikt een relatieve bridge-URL onder HA Ingress. Dag- en nacht-injectie zijn aparte velden. Elke profielwijziging trekt privacytoestemming in en wist oude resultaten. De UI vult niets uit het lokale profiel over, vraagt expliciete privacybevestiging vóór verzending en onderscheidt basis- en actieprijs met waarschuwing over onvolledige factuurkosten. Add-onvelden zijn optioneel; private key gebruikt password-schema en komt alleen als backend-omgevingsvariabele beschikbaar.

Auditfixes: contractaanbiedingen gebruiken relatieve HA-Ingress-routing; e-Contract vergelijkt aparte `product`- en `pricing`-objecten; postcode 0000/9999 wordt geweigerd; status en tarieftype worden getoond; malformed aanbodobjecten worden client-side geweigerd; streamende oversized input antwoordt met 413 vóór de verbinding na response wordt gesloten; rate-limit klokinjectie werkt; zonne-injectie dag/nacht wordt apart verstuurd.

Validatie 28 september: bridge 101/101, web 131/131, full workspace typecheck/build, harness tests 5/5, harnessstatuscontrole en `git diff --check` PASS. Agent C controleerde `app-51db17918b449385.js` en `app-534f814ff1623d45.css` met synthetische fixtures: 320/375/768/1280 px, opt-in/reset, dag/nachtpayload, postcode 0000/9999, productkaart, Ingress-prefix, veilige malformed/502, focus en geen page-errors. Nieuwe regressie bewijst dat beide contractroutes bij lege sleutels `503`/`no-store` teruggeven en geen upstreamrequest doen; releaseversieschema en optionele passwordvelden worden getest. Agent Pi/API bevestigde de ongeconfigureerde startupsemantiek. GitHub Actions [36473247556](https://github.com/xXRobinXx/crems/actions/runs/36473247556) publiceerde de OCI-index `sha256:d517cc7bfea835d4d610135cd527b337b0e21b3910c4f167344a41b60a10f688` en linux/arm64-image `sha256:b7b3a30e071852fb92030ab1a906ccf2d6021d55d851936ce0139a3ad90ec858`. Agent C installeerde `0.1.12` via de add-onupdate met app-specifieke backupoptie aan; Back-ups bevat nu herstelpunt `CREMS Energie 0.1.11` (10 KB). Ingress en contractpagina laden; geen vergelijkingsverzoek is verstuurd. Exacte Pi-viewports 375/1280, Pi-cacheheaders/warm herlaad en consolecapture zijn NOT RUN door ontbrekende inspectiebediening in de beschikbare CUA-context; Task 058 blijft open voor deze gates. Echte marktdata, hergebruikrecht, voorwaarden/kosten en credentials ontbreken; de API is pas bruikbaar na partnerbevestiging en geldige installatieconfiguratie.

### Task 058 — Geoptimaliseerde versie op de Raspberry Pi publiceren — 27 september 2026

**Status:** IN PROGRESS — `v0.1.12` draait op de Pi via Ingress. Update maakte eerst het app-herstelpunt `CREMS Energie 0.1.11` (10 KB); geen hostrestart. Exacte 375/1280 Pi-browser/console-controle, cacheheaders/overdracht en rollbackproef blijven open.

Doel: de goedgekeurde taken 055–059 als addonrelease op de ingestelde Home Assistant-Pi installeren en werkelijk gedrag controleren. Write set: manifesten, `apps/bridge/test/production-start.test.ts`, productcode uit Task 059, `docs/task-037-haos-app.md`, `TASKS.md`, `PRODUCT_AUDIT.md`, `REVIEW.md`; release naar 0.1.12 is expliciet door de gebruiker opgedragen. De contract-API blijft ongeconfigureerd; geen providerrequest of live credentials. Geen HA-hostrestart.

Acceptatie: volledige tests/build/typecheck groen; exacte tag en image-digest vastgelegd; appbackup van 0.1.11 vóór update; alleen add-on bijwerken; Home Assistant meldt 0.1.12 en draait via Ingress. Controleer op Pi 375/1280 px, hard refresh met hash-assets, actuele meter en prijzen, oningestelde API geeft veilige state, geen browserfouten, profiel blijft na add-onrestart, cacheheaders/overdracht, en documenteer rollback naar 0.1.11. Bekijk add-onlogs uitsluitend op configuratie-/tokenlek met redactie; lees of rapporteer geen geheimen. Herstel 0.1.11 bij regressie. Agent C rapporteert per scenario; geen hostrestart. Het resultaat bewijst Pi-deployment, geen hardwareprestatieclaim tenzij cold/warm metingen zijn vastgelegd.

Releasebewijs 27 september 2026: commit `7e386977cfc01f2f0df6944838ded0a701092a29`, GitHub Actions [run 36306593824](https://github.com/xXRobinXx/crems/actions/runs/36306593824) groen; tag `v0.1.11`, OCI-index `sha256:7da16f75a6f4d335ff62b0c719e06cedf1aabaf17871079fc02835a6c3790398`, ARM64-image `sha256:cd8402cd0de5aae6e1812ec54d312a67c0a390abb5093b598ac8f44de1f79b70`. In Home Assistant toont CREMS Energie `0.1.11`, `Wordt uitgevoerd`; de update-back-up is `CREMS Energie 0.1.10` (10 KB, versleuteld, 27 september 2026 10:41). Op dezelfde app-selectie werd de knop Terugzetten actief; rollback zelf is niet uitgevoerd omdat 0.1.11 werkt.

Pi-browsercontrole na add-onupdate: Ingress opent; de eerdere controle op 891×910 toonde Home Assistant-vermogen/injectie, Belgische Energy-Charts spotprijzen en 96 dagwaarden; na add-onrestart bleef het lokale profiel zichtbaar. Hercontrole 27 september (11:11) vond eerst `Bridge offline` met meter-update `11:11:03`; na openen van een verse Ingress-sessie meldde de UI `Home Assistant live`. Twee opeenvolgende inspecties toonden timestamps 11:16:20 en 11:16:40, telkens injectiewaarde 406 W, en de grafiekstatus liep mee tot 11:16 GMT+2. De eerder zichtbare 0 W werd niet als actuele waarde geïnterpreteerd; het kan een legitieme nul zijn, maar was onderdeel van de stale state. Live polling slaagde in deze hercontrole; de oorzaak van de eerdere stale badge is niet vastgesteld. Geïsoleerde Pi-checks op 375×812 en 1280×900 werden vóór HTTP-response geblokkeerd met `ERR_NETWORK_ACCESS_DENIED`. Pi-console/Network, cacheheaders, transfermetingen en cold/warm LCP blijven NOT RUN. Lokale Agent C-matrix/cachechecks zijn geen Pi-bewijs.

Na de update getoonde add-onlogregels bevatten uitsluitend bridge-start en `day-price=missing/configured`; in de weergegeven regels stond geen tokenwaarde of secret. Er was geen volledige add-onlogdump of geheiminhoud opgeslagen. Geen HA-hostrestart uitgevoerd.

### Task 057 — Eerste-lading assets verkleinen en veilig cachen — 27 september 2026

**Status:** APPROVED — code/tests/build/typecheck en Agent C productiebridge-/Ingress-controle PASS; geen Pi-deployment.

Gebruikersdoel: koude en herhaalde paginalading versnellen zonder verouderde UI, live meterdata of persoonlijke opslag te cachen. Write set: `apps/web/scripts/build.mjs`, `apps/web/scripts/dev.mjs`, `apps/bridge/src/server.ts`, `apps/bridge/test/production-start.test.ts`, `TASKS.md`, `REVIEW.md`. Productie-JS/CSS minificeren, source maps niet publiceren, JS/CSS-bestandsnamen van een inhoudshash voorzien, HTML op `no-store` houden, uitsluitend gehashte statische assets immutable cachebaar maken; live meter/prijs-, overige API-, SSE- en centrale opslagresponses blijven `no-store`. Behoud de bestaande publieke BELPEX-archiefresponse-cache (`max-age=86400`) voor die onveranderlijke historische data. Development behoudt de bestaande vaste assetnamen en source maps. Geen nieuwe dependency, prijs-/metersemantiek of Pi-deployment in deze taak.

Baseline: JS 1.300.754 B (gzip 231.040 B; Brotli 175.884 B), CSS 23.389 B (gzip 4.723 B; Brotli 4.057 B). Productie: JS 316.771 B (gzip 94.644 B; Brotli 82.147 B), CSS 18.353 B (gzip 4.310 B; Brotli 3.731 B). Geen HTTP-compressie toegevoegd of Pi-LCP geclaimd. Gehashte JS/CSS alleen krijgen `public, max-age=31536000, immutable`; HTML/API/SSE/opslag/ongehashte onbekende assets `no-store`; BELPEX-archief behoudt 24-uurcache. Bridge regressietest controleert productieassets/hashverandering/devmodus en echte HTTP-headers via root- en Ingresspaden. Volledige suites core 65, bridge 93, web 127; typecheck, build en diff-check PASS.

Agent C productiebridge op root en `/api/hassio_ingress/test-session/`: huidige hashes (`app-ad1e8539488a9532.js`, `app-58ce05b39059b9c8.css`) geven 200 en immutable cache; warme reload draagt 0 assetbytes over, hard refresh haalt de volledige assets opnieuw op. HTML, live API's, SSE en opslag no-store; BELPEX max-age=86400; unknown hash/file levert geen oude JS op. Verse geïsoleerde browsercontext met schema-valide synthetische prijs-/verbruiksrespons gaf nul console/page errors en nul 5xx; de echte HTML/assets kwamen van de bridge. Zonder fixtures gaf het afgesloten externe prijsverzoek 502; UI bleef veilig zonder crash. Dit is geen Pi-metingenbewijs. Geen screenshot of Pi wijziging.

## Backlog

- Pi-release na Task 057: nieuwe addonimage publiceren/installeren, koude en warme load meten, profielbehoud en rollback verifiëren; open checks uit Task 052 blijven van kracht.
- Security: verifieer runtime logs zonder token/PII en opslagroutes in Pi-runtime; statische code toont alleen Supervisor-peerrestrictie, geen CORS allow-origin.

### Task 056 — Compact mobiel overzicht — 27 september 2026

**Status:** APPROVED — code/tests/build PASS; Agent C 320/375/768/1280/1440, refresh, keyboard en foutafhandeling PASS.

Write set: `apps/web/src/styles.css`, `apps/web/test/overview-responsive.test.ts`, `TASKS.md`, `REVIEW.md`. Bestaande desktop/tablet-layout behouden; onder 520 px overzichtskaarten 2 kolommen met 1 kolom alleen onder 360 px; bridge/data-status blijft zichtbaar met wrap; knop-/nav-touchtargets minimaal 44 px; voorkom viewport-horizontale overflow bij 320/375 px. Geen inhoudelijke dashboard-, API-, polling- of securitywijziging. Acceptance: gerichte responsive-structuurtests voor breakpoints/touchtargets/status; web typecheck/build; Agent C visuele controle op 320/375/768/1280.

Root review: CSS-wijziging volgt de vastgelegde breakpoints; regressietests dekken kolommen/status/touchtarget. Agent C controleerde lokaal in geïsoleerde headless-browsercontexten: desktop 1440×1000, mobiel 375×1100 en 320×1100; aanvullende controle op 768×900 en 1280×900. Op alle gemeten breedtes document-, client-, scroll- en bodybreedtes zijn gelijk; geen overflow of browserfouten. KPI's staan op 375 px in twee kolommen, op 320 px in één kolom, op 768 px in twee bij twee en op desktop in vier kolommen. Status, prijzen, grafiek en knoppen blijven zichtbaar; nav-, dagkeuze- en CSV-touchtargets zijn ≥44 px. Hard refresh zonder cache herstelt data en grafiek; keyboardfocus is zichtbaar; geïsoleerde prijs-API-fout toont veilige melding terwijl live meterdata doorwerkt. Screenshots: 320, 375 en 1440 px, lokaal vastgelegd buiten repository.

Validatie door review: responsive-tests 2/2 PASS; volledige websuite 127/127 PASS; `pnpm build` PASS; `pnpm typecheck` PASS; `git diff --check` PASS. Normale sandbox-run van webtests werd door Windows-bestandstoegang geblokkeerd; dezelfde tests slaagden ongewijzigd buiten de sandbox. Geen Pi-deployment in deze taak.

### Task 055 — Spotprijsrespons hergebruiken in browsercache — 25 september 2026

**Status:** APPROVED — volledige build, tests en typecheck PASS; Agent C desktop/refresh PASS; mobiele viewport is buiten scope en staat apart in Task 056.

Gebruikersdoel: sneller overzicht na navigatie of refresh zonder verouderde prijzen of wijzigingen aan HA-/profieldata. Write set: `apps/web/src/price-history.ts`, `apps/web/test/price-history.test.ts`, `TASKS.md`, `REVIEW.md`. Benchmark met vaste fake response: verse load, herhaling binnen TTL, TTL-verval, fout en dagwissel. In-memory cache per Brussel-dag, maximaal 60 seconden, alleen gevalideerde succesvolle payloads, coalescing van overlappende requests; server blijft authoritative 10-minuten upstreamcache. Geen persistent/browser storage, geen cache van meterdata/centrale resultaten, geen dependencies en geen wijziging van prijsemantiek. Acceptatie: herhaalde verse dagrequest = 0 extra fetch; overlappendzelfde query = 1 fetch; verlopen/andere dag = fetch; fout/invalid niet bewaren; abort annuleert alleen caller-wachten; bron/timestamps/payload behouden. Agent C browsercontrole blijft aparte releasegate.

Synthetische tests bewijzen 1 fetch voor twee overlappende identieke requests, 0 extra fetch binnen TTL, nieuwe fetch na TTL-verval en Brussel-middernacht, hergebruik van een volledige 96-kwartierreeks zonder extra responsebytes, geen cache van foutresponses en abort-isolatie. Definitieve controles: core 65/65, bridge 91/91, web 125/125, typecheck alle workspaces, volledige build, harness 5/5 en diff-check PASS. Agent C-browserrapport: lokaal desktop 1900×912 en refresh PASS; live meter/prijs/grafiek na refresh, geen horizontale overflow. Mobiel 375/320 NOT RUN wegens ontbrekende viewportinstelling in browserinstrumentatie; dat blijft expliciet open onder Task 056. Geen Pi-deployment in deze taak.

### Previous tasks

### Task 054 — Onafhankelijke audit-follow-up: Ingress-runtime en statusweergave — 25 september 2026

**Status:** CODE FIXES COMPLETE — automatische checks PASS; release blijft open tot actuele Agent C-browsercontrole en externe Pi-gates.

Root is enige productiecode- en testschrijver. De Astra-agent was wegens zijn usage-limiet niet beschikbaar; read-only review en vervolgcontrole kwamen van `/root/pi_api_audit` (exact onderliggend model wordt niet door de agentruntime getoond). Write set: `apps/bridge/src/ingress.ts`, `apps/bridge/src/server.ts`, `apps/bridge/src/{central-storage-route,bridge-route-prelude,health,power-history-route,price-history-route,belpex-history-route}.ts`, `apps/bridge/test/ingress.test.ts`, `apps/bridge/test/{production-start,health,power-history-route}.test.ts`, `apps/home-assistant-addon/crems/Dockerfile`, `apps/web/scripts/build.mjs`, `apps/web/src/{App,belpex-history,central-results-client,power-history,price-history,use-live-meter}.ts*`, `apps/web/test/{battery-flow-structure,central-results-client}.test.ts`, beide addonmanifesten en auditdocumentatie.

Ingress gebruikt relatieve assets en API/SSE-paden; bridge normaliseert het geneste Home Assistant Ingress-pad en weigert, in de addoncontainer, peers behalve `172.30.32.2`. Bridge-endpoints verlenen geen wildcard CORS. Incomplete meterdata wordt zichtbaar onvolledig zonder ontbrekende nullen als metingen te tonen; gecombineerde centrale fout/lege responses behouden de foutmelding. Addonversie is 0.1.10.

Acceptatie: regressies voor Ingress-assets/API-prefix en Supervisor-peer, nul CORS-toegang, incomplete-meter UI, error-over-empty, add-onversies en bestaande volledige suites; actuele Pi/browsergedraging blijft apart bewijs.

### Task 045 — Correcte kwaliteitslabels voor meterbronnen — 25 september 2026

**Status:** APPROVED — rootreview en 84/84 bridge-tests/typecheck geslaagd.

Doel: voldoe aan de bestaande data-semantiek voor live afname/injectie. Write set: `apps/bridge/src/meter-source.ts`, `apps/bridge/test/meter-source.test.ts`, `TASKS.md`, `REVIEW.md`. Beide vermogenskanalen moeten als geldige W/kW-states aanwezig zijn voordat de reading `measured` heet; een ontbrekend/ongeldig kanaal blijft zichtbaar als `incomplete`, niet als gemeten nul. De simulator blijft `estimated`. Behoud read-only HA-verzoeken en prijssemantiek. Tests bewijzen echte nul, ontbrekend/unknown kanaal en simulator; geen nieuw framework/dependency. Gerichte bridge-suite en typecheck valideren de taak. Daarna aparte review en volgende P1-taak.

### Task 046 — Centrale opslag faalt veilig bij corrupte data

**Status:** APPROVED — 84/84 bridge-tests, typecheck en code-review geslaagd.

Write set: `apps/bridge/src/central-storage.ts`, `apps/bridge/src/central-storage-route.ts`, `apps/bridge/test/central-storage.test.ts`, `TASKS.md`, `REVIEW.md`. Een ontbrekend bestand is leeg; corrupt, te groot, onbekend schema of ongeldige opgeslagen inhoud blijft intact en wordt als herstelbare fout gemeld. GET mag geen nep-lege uitkomst geven; PUT/DELETE mogen de onbekende store niet herschrijven. Fouten blijven privacyveilig. Tests controleren bytes vóór/na GET/PUT/DELETE en tonen dat geldige stores hun bestaande gedrag behouden. Geen automatische backup/delete/migratie.

### Task 047 — Lokale rapporten uitsluiten van het Raspberry Pi-image

**Status:** APPROVED — 85/85 bridge-tests en imagecontext-regressie geslaagd.

Write set: `.gitignore`, `.dockerignore`, `apps/home-assistant-addon/crems/Dockerfile`, `apps/bridge/test/production-start.test.ts`, `TASKS.md`, `REVIEW.md`. Runtime-resultaten, `.env`-bestanden, `.git`, dependencies en lokale builduitvoer mogen nooit in imagecontext of image-layers belanden. Dockerfile neemt alleen de benodigde openbare BELPEX-archiefdata over. Regressietest controleert exclusion en selectieve copy zonder runtime-inhoud te lezen. Geen image publiceren in deze taak.

### Task 048 — Raspberry Pi-app alleen via Home Assistant Ingress aanbieden

**Status:** APPROVED — 86/86 bridge-tests en addonmanifesttest geslaagd.

Write set: `crems/config.yaml`, `apps/home-assistant-addon/crems/config.yaml`, `apps/bridge/test/production-start.test.ts`, `docs/task-037-haos-app.md`, `TASKS.md`, `REVIEW.md`. Verwijder direct gepubliceerde add-onpoort en bied de UI uitsluitend aan via Home Assistant Ingress op interne poort 8099. Zo blijft de centrale GET/PUT/DELETE-opslag achter de geauthenticeerde Home Assistant-ingang. Beide manifesten moeten dezelfde Ingress-configuratie hebben; bestaande lokale devproxy blijft bruikbaar. Geen publieke poort of internetpublicatie.

### Task 049 — Centrale financiële snapshots strikt valideren

**Status:** APPROVED — 86/86 bridge-tests, typecheck en code-review geslaagd.

Write set: `apps/bridge/src/central-storage.ts`, `apps/bridge/test/central-storage.test.ts`, `TASKS.md`, `REVIEW.md`. De opslagvalidatie moet `effectiveStart <= quality.period.start`, `effectiveEnd >= quality.period.end` afdwingen en `investmentsEur` exact de vijf capaciteitsvelden laten bevatten. Bestaande financiële rekenkundige verificatie en veilige allowlists behouden. Regressies bewijzen dat afwijkende periode en genest extra veld geweigerd worden; geldige fixture blijft accepteren. Bridge-tests/typecheck.

### Task 050 — Eén versie voor de HAOS-installer en ARM64-image

**Status:** APPROVED — 87/87 bridge-tests, typecheck en release-configuratiereview geslaagd.

Write set: `crems/config.yaml`, `apps/home-assistant-addon/crems/config.yaml`, `.github/workflows/home-assistant-image.yml`, `apps/bridge/test/production-start.test.ts`, `docs/task-037-haos-app.md`, `TASKS.md`, `REVIEW.md`. Synchroniseer beide addonmanifesten op één nieuwe versie; tagpush `v<versie>` bouwt ARM64 met exact die versie, workflowdispatch vraagt die versie expliciet en valideert manifesten vóór publicatie. Verwijder de hardcoded oude imagetag. Behoud `latest` alleen naast de versie-tag. Geen image push tijdens deze taak.

### Task 051 — Browserkopieën behouden bij lege of onbereikbare centrale opslag

**Status:** APPROVED — webtests 119/119 en integratiereview geslaagd.

Write set: `apps/web/src/App.tsx`, `apps/web/test/battery-flow-structure.test.ts`, `TASKS.md`, `REVIEW.md`. Wanneer centrale GET leeg is of faalt, blijven geldige expliciet bewaarde browserresultaten staan. Een remote snapshot wordt alleen gebruikt wanneer die aanwezig en geldig is. Lege/failed reads triggeren nooit een write/delete en geven een veilige zichtbare status wanneer lokale data behouden blijft of centrale opslag onleesbaar is. Tests gebruiken component-hook host en fake fetch; bewijzen opslagbytes/states en foutmelding. Geen UI-browse benodigd voor statecontroller bewijs.

### Task 052 — Raspberry Pi-installatie en herstartcontrole

**Status:** PARTIAL — 0.1.10 gepubliceerd en geïnstalleerd; live Ingress/Pi herstart- en rollbackgates blijven open.

Doel: publiceer de actuele versie 0.1.10, installeer via HAOS custom app-repository en controleer Ingress. Releasebewijs 25 september 2026: GitHub Actions `36168814889` geslaagd; ARM64-image `ghcr.io/xxrobinxx/crems-energy:0.1.10`, digest `sha256:d491733674854d52a2c185726ed36cee78ed721b70ef954be80a9a9cb3fd8cdd`; via reeds ingestelde custom repository op gebruikers-HA geïnstalleerd met bewaarde backup. HA meldt huidige versie 0.1.10, `Wordt uitgevoerd`, Ingress aanwezig. `Web UI openen` laadt de app via `/api/hassio_ingress/.../`; live meterwaarde (447–449 W) ververst, Energy-Charts-info België geeft huidige en volgende spotprijs (25,5 en 24,4 ct/kWh) en vandaag 96 gepubliceerde waarden. Acceptance blijft open: lokale profielen na add-on-/HA-herstart, rollback-uitvoerbaarheid, Agent C/browser PASS op 375 px en desktop en exacte host-/peer/tokenconfiguratie vanuit HA logs. Geen HA-hostherstart uitgevoerd.

### Task 053 — Belgische contract-API toegang verkrijgen en aansluiten

**Status:** ONDERZOEK + CODE AFGESPLITST — broninventarisatie staat hier; de adapter/UI-implementatie is Task 059. Live gebruiksrechten/toegang/credentials ontbreken nog.

Onderzoek 27 september 2026: de Vlaamse Nutsregulator publiceert maandelijks V-testbestanden onder [V-test-data en energieprijscurves](https://www.vlaamsenutsregulator.be/cijfers/v-test-data-en-energieprijscurves). De gepubliceerde dataset omvat producten die die maand in de V-test stonden; vaste producten staan apart van variabele/dynamische producten. Prijzen zijn exclusief btw en de dataset bevat geen nettarieven of heffingen. De [open-data-licentie](https://www.vlaamsenutsregulator.be/disclaimer) staat hergebruik van datasets onder Cijfers toe met bronvermelding en zonder officiële-endorsementclaim. Dit is een downloadbare maandelijkse dataset, geen gedocumenteerde API.

BRUGEL beschrijft voor BruSim een maandelijkse aanlevering van tariefkaarten door leveranciers en een protocol voor toegang; dit bewijst geen openbare consumer-API of algemene hergebruikrechten. CompaCWaPE beschrijft een maandelijkse vergelijker die werkt op door leveranciers meegedeelde tariefkaarten; in de geraadpleegde officiële informatie is geen publiek API-contract aangetroffen. Voor Brussel en Wallonië is dus nog geen herbruikbare openbare dataset/API vastgesteld. De Vlaamse download kan niet ongemerkt als landelijke API worden behandeld.

Aanvullende broninventarisatie 28 september 2026:

- [Aanbieders.be API](https://apihelp.econtract.be/) documenteert GET-resources voor leveranciers, contractproducten en vergelijkingen, met Belgische consumentenproducten en beschikbaarheid per regio. Toegang vereist registratie en public/private keys; vergelijkingen vereisen ook affiliate-ID. De [API-keyhandleiding](https://apihelp.econtract.be/api-key) beschrijft ondertekening met HMAC-SHA1 en eenmalige nonce. De actuele website/voorwaarden zijn van e-Contract BV, maar de geraadpleegde API-documentatie specificeert geen actuele datalicentie, prijs of voorwaarden voor herpublicatie in CREMS. Geen live toegang of actuele response is bevestigd.
- [Tounify](https://api.tounify.io/openapi/v2.json) documenteert contract-/tarief-API endpoints; de aanbieder adverteert Belgische dekking. De gepubliceerde [voorwaarden](https://www.tounify.io/terms-and-conditions/) beperken de service tot ondernemingen, sluiten eindgebruikers uit en verbieden de data voor mogelijke energiekostenberekeningen. Daardoor is deze API niet geschikt voor CREMS' consumentenvergelijker.
- [Selectra's planning-API](https://selectra.be/nl/energie/api-planning) meldt Belgische dekking en een API-proefaccount. De gedocumenteerde flow kwalificeert de klant, herkent diens gekozen contract en geeft prijsperioden terug; dit is geen aangetoonde volledige marktvergelijking van alle contracten. Commerciële voorwaarden voor permanent gebruik moeten nog worden bekeken.
- De [V-test-open data](https://www.vlaamsenutsregulator.be/cijfers/v-test-data-en-energieprijscurves) blijft een maandelijkse download voor Vlaanderen, onder de [open-datalicentie](https://www.vlaamsenutsregulator.be/disclaimer) met bronvermelding; het bestand is geen API en mist btw/nettarieven/heffingen. De [CompaCWaPE](https://www.cwape.be/en/node/8) wordt maandelijks met leveranciersdata bijgewerkt; in de geraadpleegde documentatie is geen publieke API gevonden. BRUGEL's BruSim-protocol beschrijft leveranciersaanlevering en individuele toegang, geen publieke consumer-API.

De beste technische kandidaat voor een product-/vergelijkingsflow is Aanbieders.be. De offline serveradapter en opt-in webflow zijn inmiddels in Task 059 gebouwd volgens het openbare API-contract; er is geen verborgen endpoint gescrapet. Deze code implementeert geen recht op herpublicatie: tot partnerrechten, credentials en actuele live payload zijn bevestigd, is live marktvergelijking niet als werkend of vrijgegeven te presenteren.

### Task 042 — Volledige audit en agentinstructies — 24 september 2026

**Status:** AUDIT FOLLOW-UP DOCUMENTED — oorspronkelijke codebevindingen hersteld; productrelease CHANGES REQUIRED tot browser- en externe gates slagen.

Expliciete gebruikersopdracht: volledige audit met Astra en instructies van alle agents actualiseren. Owner: Agent A (root), enige documentatieschrijver. Onafhankelijke read-only audit door de aangevraagde Astra-agent. Geen productie- of testwijzigingen en geen browserbediening.

Write set: `AGENTS.md`, `AGENT_PLAYBOOK.md`, `AGENT_A_ARCHITECT_REVIEWER.md`, `AGENT_B_IMPLEMENTER.md`, `AGENT_C_UX_BROWSER_QA.md`, `PRODUCT_AUDIT.md`, `docs/full-audit-2026-09-24.md`, `TASKS.md`, `REVIEW.md`, `README.md`, uitsluitend verouderde risiconotities in `ARCHITECTURE.md`.

Acceptance: huidige werkboom inclusief reeds aanwezige wijzigingen beoordelen; bevindingen met locatie, impact en reproduceerbaar bewijs; build, tests, typecheck en harness controleren; historische claims van actueel bewijs scheiden; alle vijf agentinstructies onderling consistent; open browsergates niet als PASS presenteren. Requirements en goedgekeurde ADR's blijven ongewijzigd. Herstel van gevonden productfouten vereist een afzonderlijke afgebakende taak.

## Eerdere implementaties en open releasegates

Onderstaande taakteksten behouden hun historische handoffs. Formuleringen zoals “actief” en “IN PROGRESS” binnen die historische teksten activeren geen tweede taak. Task 042 documenteert de afgeronde controle; er is nu geen implementatietaak actief. Task 035–041 en H001 behouden hun ontbrekende review- en browserbewijs.

### Task 041 — Rechtstreekse Belgische spotprijzen — 24 september 2026

READY FOR BROWSER REVIEW; expliciete gebruikersopdracht: haal de spotprijzen buiten Home Assistant op. Root is enige productieschrijver. Write set: `apps/bridge/src/direct-spot-price.ts`, `apps/bridge/src/price-history-route.ts`, `apps/bridge/src/price-history-service.ts` uitsluitend responstype, `apps/bridge/test/direct-spot-price.test.ts`, `apps/web/src/App.tsx`, `apps/web/src/price-history.ts`, `apps/web/test/price-history.test.ts`, `apps/web/test/overview-chart.test.ts`, `REQUIREMENTS.md`, `ARCHITECTURE.md`, `TASKS.md`, `REVIEW.md`. Bron: Energy-Charts v2, biedzone BE, day-ahead, EUR/MWh, CC BY 4.0 voor BE volgens werkelijk API-antwoord. Eén gecachete driedaagse API-opvraag per tien minuten, zodat de drie grafieken en prijskaarten dezelfde echte kwartieren gebruiken. Geen Home Assistant-afhankelijkheid voor prijzen; vermogen blijft via Home Assistant. Validatie van bronmetadata, tijdvensters, eenheden, DST, nul/negatief, gaten en ongepubliceerde morgenprijzen. Geen secrets/dependencies. Bridge 83/83 tests, web 115/115 tests en beide builds/typechecks geslaagd; extra webtest zonder HA PASS. Live API-replay en tijdelijke lokale API-route: gisteren/vandaag elk 96 kwartieren, morgen `notPublished`. Browser-PASS en afzonderlijke reviewstatus blijven open.

**Lokale weergavecorrectie na melding van ontbrekende grafiek:** bij inspectie antwoordde `127.0.0.1:5173` met HTTP 200 maar de prijsproxy met 502 omdat de bridge niet op 8787 luisterde. De `tsx watch`-ontwikkelstart startte wel een proces maar opende de poort niet. Root is enige schrijver voor de uitbreiding van de write set met `apps/bridge/package.json`; `dev` start nu direct met `tsx src/server.ts`. Een frisse `pnpm dev` toont beide startmeldingen en de webproxy levert vandaag `measured` met 96 kwartieren. De lokale processen blijven draaien voor controle. Browser-PASS blijft open.

**Screenshotcorrectie 24 september:** de door de gebruiker gedeelde browserafbeelding toont blijvend “laden…” voor morgen en geen prijs voor volgend uur, terwijl de lokale API vandaag 96 kwartieren levert. Root is enige schrijver voor de write-setuitbreiding `apps/web/src/price-history-controller.ts`, `apps/web/src/power-history-controller.ts`, `apps/web/test/price-history.test.ts` en `apps/web/test/power-history-controller.test.ts`. React StrictMode herhaalt effect-opstart: `dispose()` annuleerde het eerste verzoek maar behield de selectiesleutel, waardoor dezelfde dag niet opnieuw werd geladen. Beide controllers wissen de sleutel bij dispose; tests bewijzen abort gevolgd door een nieuwe succesvolle aanvraag. Web 118/118 tests en typecheck slagen; de live webbundel bevat de nieuwe reset en de prijsproxy levert 96 kwartieren. Geen browser-PASS na refresh; morgen blijft terecht `notPublished` tot publicatie.

### Task 040 — Prijshistorie volgt statusduur — 22 september 2026

**Aanvulling 24 september — drie volledige daggrafieken en één spotbron:** gebruiker verduidelijkt dat gisteren, vandaag en morgen elk alle beschikbare uren moeten tonen en telkens dezelfde spotdata moeten gebruiken. Root is enige schrijver voor deze correctie in `apps/bridge/src/price-history-service.ts`, `apps/bridge/test/price-history-service.test.ts`, `apps/web/src/price-chart.ts`, `apps/web/src/App.tsx`, `apps/web/test/price-history.test.ts` en de bijbehorende documentatie; eerdere onvoltooide wijzigingen blijven behouden. Bij ingestelde dagprijssensor: gisteren begrensde history daarvan, vandaag gepubliceerde `raw_today` of history van dezelfde sensor, morgen uitsluitend gepubliceerde `raw_tomorrow`. De prijskaarten gebruiken dezelfde vandaagreeks. Gepubliceerde toekomstige uren van vandaag worden volledig getekend; history stopt bij nu en ontbrekende bronuren blijven leeg. Gerichte regressies, typechecks en build vereist. Browsergate blijft open.

**Update 23 september:** implementatie opgeleverd; Task 040 blijft actief als `READY FOR BROWSER REVIEW`. Buiten de beperkte sandbox slagen 76/76 bridgetests, 114/114 webtests, webbuild en typecheck. De lokale app en bridge zijn gestart; de echte prijs-API levert gisteren 22 punten met 22 eindtijden (drie intervallen van minstens twee uur), vandaag 11 punten met 11 eindtijden (één lang interval). Morgen is momenteel `notPublished`. De eerdere ENOMEM/esbuild-fouten waren omgevingsbeperkingen. Agent C probeerde browser-QA na expliciete gebruikersopdracht, maar de browserprovider bood geen iab/Chrome/Edge aan. Browser-PASS blijft open door toolbeschikbaarheid, niet door een vastgestelde app-FAIL.

READY FOR BROWSER REVIEW als historisch werk; actieve prijsroute is vervangen door Task 041. Root heeft echte prijs-only history gecontroleerd: 22 statuswijzigingen, geen ongeldige states; twee- en drie-uursintervallen zonder wijziging werden ten onrechte afgekapt. HA history API documenteert statuswijzigingen (https://developers.home-assistant.io/docs/api/rest/). De bestaande implementatie en tests blijven beschikbaar, maar deze HA-prijsroute wordt niet meer aangeroepen. Browsergate van de eerdere zichtbare wijzigingen blijft open.

### Task 039 — Prijspunten als leesbare traplijn — 22 september 2026

Actuele status READY FOR BROWSER REVIEW: 14/14 prijs- en overzichttests, webbuild en webtypecheck groen. Agent C productiecodereview zonder bevindingen; testfixture gecorrigeerd met vaste klok en drie punten, assertions behouden. Root bevestigt echte API als traplijnen in alle drie dagkeuzes en nieuwe code via HTTP 200. Geen browser-PASS.

Write-setaanvulling voor regressiecompatibiliteit: `apps/web/test/overview-chart.test.ts` mag de synthetische prijsfixture aanvullen tot drie punten om twee onderbouwende intervallen te bevatten; bestaande gecombineerde-grafiekassertions behouden.

IN PROGRESS, enige actieve implementatie. Gebruiker verduidelijkt: grafiek toont slechts puntjes. Root inspecteerde echte API zonder persoonsgegevens: gisteren/vandaag bevatten sensorupdates rond het uur met secondenafwijkingen, eerste interval circa negen minuten; morgen 96 exacte kwartierpunten. Bestaande exacte globale cadencecheck weigert hierdoor alle historische intervallen. Agent B enige schrijver: `apps/web/src/price-chart.ts`, `apps/web/test/price-history.test.ts`, alleen indien nodig `apps/web/src/App.tsx`. Root docs: TASKS.md, REVIEW.md. Acceptance: aangrenzende bekende/afgeleide intervallen verbinden met verticale prijsstap; jitter en gedeeltelijk eerste interval blokkeren niet hele reeks; onbekende lange gaten blijven leeg; laatste interval blijft begrensd, één onbekend punt niet fictief verlengen; negatieve/nulprijzen, 23/25u en morgenkwartieren correct. Inferentie zichtbaar blijven onderscheiden van bronbevestigde duur. Gecombineerde grafiek behouden; geen opslag/bridgewijzigingen. Gerichte synthetische regressies, webtypecheck en build; browsergate open zonder expliciete browserbediening.

### Task 038 — Morgenprijsbron behouden bij meterupdates — 22 september 2026

Implementatie afgerond; READY FOR BROWSER REVIEW. Agent B: regressie eerst rood na drie meterupdates, daarna groen; 74/74 bridgetests, build en typecheck geslaagd. Agent C read-only review: geen resterende bevindingen. Root heeft de dataservice herstart en via de webproxy HTTP 200, 96 morgenprijzen en actieve gemeten meterupdates bevestigd. Geen browser-PASS; visuele releasegate blijft open.

Status IN PROGRESS. Expliciete opdracht: herstel verloren morgenprijzen. Enige actieve implementatie; Task 037 behoudt open browsergate. Agent B is enige productieschrijver, root reviewt en documenteert. Write set: `apps/bridge/src/meter-source.ts`, `apps/bridge/test/price-history-service.test.ts`. Acceptance: herhaalde live reads behouden expliciet ingestelde morgenbron; raw_tomorrow blijft daarna via bestaande prijsservice opvraagbaar; nul/negatieve prijzen en bestaande foutafhandeling blijven correct. Geen bronwijziging, nieuwe dependencies of frontendwijzigingen. Gerichte regressie eerst rood dan groen, bridge tests/build/typecheck; na herstart echte API controleren zonder secrets te tonen. Docs root: TASKS.md, REVIEW.md.

### Task 037 — Leesbaar overzicht en prijsgrafieken — 21 september 2026

**Gebruikerscorrectie 22 september:** behoud de oorspronkelijke gecombineerde grafiek. De eerdere acceptance over aparte grafieken vervalt op expliciete opdracht: vermogen links en prijs rechts in één grafiek, gedeelde tijdas, behoud interval-/labelverbeteringen. Agent B is enige schrijver voor deze correctie binnen `App.tsx`, `styles.css` indien nodig en `test/overview-chart.test.ts`. Status READY FOR BROWSER REVIEW; tien gerichte tests en webtypecheck groen, gecombineerde grafiek aanwezig in geleverde bundel. Root heeft code gereviewd; browsergate blijft open. Geen overige herindeling.

**Status:** READY FOR BROWSER REVIEW. Implementatie en gerichte grafiektests/typecheck geslaagd; browsergate blijft open. Expliciete gebruikersopdracht met screenshot van verbeterpunten. Deze taak is de enige actieve implementatie; eerdere taken behouden hun open reviewgates.

Owner: Agent B, enige productieschrijver. Agent A (root) documenteert en reviewt; Agent C doet read-only QA zonder browserbediening.

Write set: `apps/web/src/App.tsx`, `apps/web/src/price-chart.ts`, `apps/web/src/power-chart.ts`, `apps/web/src/chart-time.ts`, `apps/web/src/BatteryDailyReport.tsx`, `apps/web/src/styles.css`, `apps/web/test/price-history.test.ts`, `apps/web/test/power-history.test.ts`, `apps/web/test/overview-chart.test.ts`. Documentatie uitsluitend Agent A: `TASKS.md`, `docs/task-037-overview-check.md`, `REVIEW.md`.

Acceptance: gepubliceerde prijsintervallen worden volledig getoond zonder ontbrekende perioden op te vullen; Brusselse tussentijdlabels en opvraagbare waarden; laagste/hoogste gepubliceerde prijs; vermogen en prijs apart met dezelfde tijdas; correcte tekst over automatische tienminutenverversing; batterijgrafieken passen mobiel zonder verplichte horizontale grafiekscroll en behouden afleesbare details. Loading/leeg/fout, nul/negatieve prijzen en DST blijven correct. Geen dependencies, opslag-, bron-API-, financiële of simulatorwijzigingen. Tests gebruiken uitsluitend synthetische data; geen browserbediening. Agent C legt checklist en bewijsbeperkingen vast; browser-PASS blijft vereist voor APPROVED.

Validatie: relevante webtests en webtypecheck tijdens bouwen; bij eindgate eenmaal root `pnpm build`, `pnpm test`, `pnpm typecheck`.

### Task 036 — Begrijpelijke navigatievoorwaarden

**Status:** READY FOR BROWSER REVIEW — implementatie en automatische validatie in deze verfijningsronde; bewijs in `.harness/checks.json` na geslaagde run. Browsergate en review blijven open.

Expliciete gebruikersopdracht 12 september: verfijn de website. Deze ronde beperkt zich tot navigatievoorwaarden, binnen de bestaande rapportflow. Owner: root (implementer), enige productieschrijver. Write set: `apps/web/src/App.tsx`, `apps/web/src/styles.css`, `apps/web/test/battery-flow-structure.test.ts`, `TASKS.md`, `docs/task-036-navigation-check.md`. Acceptance: ontbrekende voorwaarden zijn zichtbaar zonder hover; geblokkeerde knoppen zijn toetsenbordbereikbaar maar openen geen pagina; actieve pagina is programmatisch gemarkeerd; bewaarde batterijrapporten blijven bereikbaar zonder profiel; navigatie kan op smalle schermen ombreken. Geen opslag-, financiële of simulatorwijziging. H001 en Task 035 wachten op hun eigen review en worden niet verder uitgebreid. Geen browserbediening zonder expliciete opdracht.

### H001 — Lokaal ontwikkelharness — 12 september 2026

Status: READY FOR REVIEW. Eerste implementatie aanwezig; validatiebewijs wordt lokaal door het harness vastgelegd. Expliciete gebruikersopdracht; uitsluitend ontwikkelgereedschap.
Owner: root — enige schrijver. Write set: `tools/harness.mjs`, `tools/harness.test.mjs`, `docs/harness.md`, `package.json`, `.gitignore`, `TASKS.md`.
Acceptance: bestaande taken zonder duplicaten uitlezen; automatische controles fail-closed vastleggen; gewijzigd bronmateriaal maakt bewijs ongeldig; ontbrekend review-/browserbewijs verhindert releasegoedkeuring; synthetische tests bewijzen deze gates. Geen dependencies, browserbediening of productiewijzigingen. Task 035 en uitbreidingen behouden hun open browsergate en worden tijdens H001 niet gewijzigd. Reviewstatus blijft open tot afzonderlijke review.

#### Actieve verfijning — periodefilter in capaciteitsvergelijking — 12 september 2026

Status: READY FOR BROWSER REVIEW. Geïmplementeerd; root build/test/typecheck groen (65 core, 92 web, 67 bridge). Browsergate blijft open.

Gebruiker vraagt specifiek in de grafiek 'Minder netafname per batterij' een periode te kiezen. Agent B is enige schrijver binnen `apps/web/src/App.tsx`, `apps/web/src/styles.css`, `apps/web/test/battery-flow-structure.test.ts` en indien nodig `apps/web/src/battery-daily-report.ts`/bijbehorende test. Voeg Van/Tot toe met inclusieve Brusselse kalenderdagen en herstelactie 'Volledige periode'. Som per capaciteit de bestaande dagelijkse ontlading; geen nieuwe simulatie en geen reset bij filterbegin. Toon invalid/lege periode expliciet, geen fictieve nul bij ontbrekende data. Zonder dagdata blijft volledige vergelijking zichtbaar met uitleg dat herinlezen nodig is. Filter is alleen voor deze grafiek; overige rapportdelen behouden expliciete volledige-meetperiodebetekenis. Geen opslag- of financiële wijziging. Test daadwerkelijke filterhandlers, sommen, volledige-periode-reset, omgekeerde/lege range en geen-dagdatafallback. Bestaande browsergate blijft open.

### Actieve gebruikersuitbreiding van Task 035 — interactief dagrapport — 11 september 2026

Status: READY FOR BROWSER REVIEW — geïmplementeerd en root build/test/typecheck geslaagd op 12 september 2026; browser-PASS open. De herhaalde expliciete gebruikersopdracht vervangt de eerdere beperking tot samenvattingskaarten. Owner: Agent B, enige productieschrijver; Agent A documenteert en reviewt.

Doel: op de batterijpagina een Power BI-achtige werkruimte met datumkiezer, vorige/volgende dag, batterijselectie, dag-KPI's en gekoppelde grafieken voor bronafname/-injectie, laden/ontladen, netafname met/zonder batterij en laadniveau. Toon werkelijke dagtotalen voor de hele meetperiode en detail binnen de geselecteerde dag wanneer het tijdelijke bronbestand beschikbaar is. Bewaar alleen veilige dagaggregaten expliciet; nooit ruwe kwartierregels. Bestaande rapporten blijven leesbaar en krijgen een concrete herinleesactie als dagdata ontbreekt. Geen verzonnen historie of financiële uitbreiding.

Write set: `packages/core/src/battery-simulation.ts`, `packages/core/test/battery-simulation.test.ts`, `apps/web/src/battery-report-controller.ts`, `apps/web/src/battery-daily-report.ts`, `apps/web/src/BatteryDailyReport.tsx`, `apps/web/src/local-battery-analysis.ts`, `apps/web/src/App.tsx`, `apps/web/src/styles.css`, `apps/web/test/battery-daily-report.test.ts`, `apps/web/test/battery-report-controller.test.ts`, `apps/web/test/local-battery-analysis.test.ts`, `apps/web/test/battery-flow-structure.test.ts`. Nieuwe helper/componentnamen binnen deze set zijn toegestaan; geen dependencies/manifests/bridgewijzigingen.

Acceptance: dagtotalen sluiten aan op simulatortotalen en energiebalans inclusief apart conversieverlies en ladingverlies door gaten; lading loopt over middernacht door; dagen/tijden zijn Brussels inclusief DST; lege dagen/gaten worden geen meetnul of doorlopende lijn; filterwijzigingen veranderen alle KPI's/grafieken; detail behoudt beginlading uit voorgaande historie; opslagroundtrip accepteert begrensde dagaggregaten en weigert extra velden/kwartierdata/ongeldige balans; oude snapshots blijven veilig leesbaar. Grenzen: bestaande 20 MiB/250.000 bronregels, maximaal 4.000 dagaggregaten, detailretentie maximaal één geselecteerde dag per capaciteit (maximaal 100 kwartieren per dag), geen automatische writes. Test nieuwe aggregatie, filters, timezone/gaps en opslag met synthetische data. Relevante pakkettests en typecheck tijdens bouwen, root build/test/typecheck eenmaal bij eindcontrole. Agent C doet read-only QA; browser alleen bij nieuwe expliciete gebruikersopdracht, anders blijft browser-PASS open.

Visuele richting: bestaande donkere CREMS-kleuren, compacte filterbalk bovenaan, cyan voor bronmeting, oranje voor laden, groen voor ontladen, paars voor laadniveau, duidelijke assen/eenheden en een controleerbare tabel bij de geselecteerde dag. Details en methode onder de werkruimte.

### Task 035 — Duurzaam batterijrapport en refreshgarantie

**Status:** READY FOR BROWSER REVIEW — herstelronde geslaagd op 10 september 2026; browsergate blijft vereist

#### Objective

Bewijs één volledige gebruikersreis: een gecontroleerde CSV levert een technisch batterijresultaat; na geldige expliciete financiële invoer kan de gebruiker het volledige rapport bewust lokaal bewaren; na refresh verschijnt exact hetzelfde rapport opnieuw. Oudere veilige lokale resultaten verdwijnen niet stilzwijgend.

#### UX flow

Start: schoon browserprofiel én afzonderlijk een bestaand v1/v2-resultaat.

Actie: CSV controleren → batterijscenario uitvoeren → financiële context bevestigen → rapport expliciet bewaren → pagina vernieuwen → rapport openen → rapport verwijderen.

Eindresultaat: technische en eventueel financiële uitkomst, herkomst, datakwaliteit en aannames blijven identiek na refresh; onbruikbare legacy-data krijgt een zichtbare herstelstate en wordt niet automatisch verwijderd.

#### Scope

- één strikt allowlisted v3-rapportmodel voor technische uitkomst, kwaliteitsmetadata en optioneel bevestigde volledige financiële snapshot conform ADR-011;
- veilige v1/v2-resultaten worden zichtbaar als technisch legacy-resultaat en alleen via `Bewaar als nieuw technisch rapport` naar v3 geschreven;
- onbekende/corrupte lokale data toont een veilige herstelstate en wordt nooit automatisch verwijderd;
- abort/sequence/dispose voor prijsfetch, CSV-reader, navigatie en nieuwe selectie;
- expliciete opslagknop voor technisch-only of technisch+financieel; selectie en simulatie schrijven exact niets;
- alle financiële velden trekken bevestiging in bij wijziging;
- één duidelijke semantiek voor terminale lading en financiële waardering;
- runtime gebruikersreistest plus browsergate.

#### Non-goals

Geen nieuwe visualisaties buiten de hieronder expliciet gevraagde kWh-verduidelijking, leveranciersdatabase, contractadvies, dynamisch contractmodel, cloudopslag, Raspberry Pi-installatie of brede refactor buiten deze flow.

#### Gebruikersuitbreiding — 10 september 2026

De gebruiker heeft de verduidelijking van de bestaande batterijvergelijking in kWh bevestigd. Toon per capaciteit minder netafname, opgevangen injectie, verlies/niet-benutte energie en extra vermeden netafname tegenover de vorige kleinere batterij (nulreferentie voor 3 kWh). Vermeld de werkelijke meetperiode, geen jaaropbrengst, en maak duidelijk dat verliezen ook door de conservatieve reset bij datagaten ontstaan. Ontbrekende legacy-details mogen geen schijnzekerheid geven. Agent B is enige schrijver binnen `apps/web/src/App.tsx`, `apps/web/src/styles.css` en `apps/web/test/battery-flow-structure.test.ts`. Geen wijziging van simulator, opslagcontract of financiële berekening. Gerichte gedragstests en review zijn vereist; de bestaande browsergate blijft gelden.

De gebruiker vraagt aanvullend een dagelijkse controleweergave met grafiek. Per dag moeten bron-import, bron-injectie, batterij-laden, batterij-ontladen en eindlading naast elkaar controleerbaar zijn, met een duidelijke markering voor geschatte dagen en datagaten. Dit vereist dagelijkse aggregaten tijdens de CSV-run; de ruwe kwartierregels blijven buiten lokale opslag. Uitbreiding van het v3-rapportcontract en de controller is hiervoor noodzakelijk en moet als aparte, expliciet geteste write set worden uitgevoerd voordat dit als werkend wordt gepresenteerd.

#### Ownership

Owner: Agent B — enige schrijver van productiecode en tests.

Write set: `apps/web/src/local-battery-analysis.ts`, `apps/web/src/battery-report-controller.ts`, `apps/web/src/belpex-history.ts`, `apps/web/src/App.tsx`, `apps/web/test/local-battery-analysis.test.ts`, `apps/web/test/battery-report-controller.test.ts`, `apps/web/test/belpex-history.test.ts`, `apps/web/test/battery-flow-structure.test.ts` en uitsluitend indien noodzakelijk `apps/web/src/styles.css`. Agent A en Agent C zijn read-only voor productiecode. Gedeelde bestanden worden nooit parallel gewijzigd.

#### Afgebakende herstelhandoff — 9 september 2026

Deze hervatting behandelt uitsluitend de bij eindcontrole gereproduceerde fouten in Task 035:

- zonder volledige prijzen moeten echte controllerresultaten expliciet bewaarbaar zijn; ontbrekende optionele velden zijn afwezig;
- nieuwe CSV-resultaten gebruiken uitsluitend hun eigen periode, kwaliteit en financiële bevestiging; een eerder rapport blijft bewaard tot expliciete vervanging;
- na bewaren/heropenen mag het oude tijdelijke bestand geen nieuwe run starten; React-effectherstart mag de controller niet permanent uitschakelen;
- een technisch bewaard rapport mag na geldige financiële bevestiging expliciet als volledig rapport worden bijgewerkt;
- mislukte verwijdering behoudt het zichtbare rapport en meldt de fout;
- laden valideert het opgeslagen snapshot zonder de actuele financiële rekenmotor opnieuw uit te voeren; expliciet bewaren houdt de strikte consistentiecontrole;
- legacy-data met ontbrekende metadata blijft zichtbaar onzeker; ongeldige metadata wordt veilig geweigerd en migratiefouten krijgen zichtbare feedback;
- fout/cancel/dispose sluiten de batterijreader exact eenmaal; tests moeten uitvoerbaar gedrag bewijzen en mogen niet slagen op opmerkingen in de broncode.

Agent B is de enige schrijver binnen bovenstaande write set. Agent A en C voeren onafhankelijke review uit. Geen contractuitbreiding of volgende taak in deze herstelronde.

Eindvalidatie 10 september: de bestaande bridge-test voor `today/raw_today` configureert uitsluitend `tomorrowPrice` en faalt vóór de prijsuitlezing. Alleen `apps/bridge/test/price-history-service.test.ts` wordt aanvullend aan de write set toegevoegd voor correctie naar de bedoelde `currentPrice`-testconfiguratie, met behoud van de prijs-/aantalassertions. Geen bridgeproductiecode of prijssemantiek wijzigen.

#### Acceptance

- schoon profiel doorloopt de volledige flow zonder verborgen opslag;
- refresh herstelt exact hetzelfde technische en financiële snapshot zonder CSV-read, prijsfetch of herberekening;
- veilige v1/v2-data wordt zichtbaar als legacy aangeboden en alleen expliciet naar v3 geschreven, nooit stilzwijgend gewijzigd of gewist;
- corrupte of onveilige opslag blijft veilig geweigerd met zichtbare hersteltekst;
- een verse technische run doet nul opslagwrites; expliciet bewaren schrijft exact één gevalideerde v3-payload en een opslagfout behoudt het tijdelijke resultaat;
- oude async runs kunnen geen nieuwere state of opslag overschrijven;
- prijsfetch ontvangt een AbortSignal; reader wordt bij navigatie, nieuwe selectie, cancel en unmount exact eenmaal geannuleerd/opgeruimd;
- contract-, offerte- en datumwijzigingen trekken bevestiging altijd in;
- financieel resultaat waardeert terminale lading niet als vermeden afname, maar rekent de daarvoor geladen energie wel als gemiste injectievergoeding; dit blijft identiek vóór en na refresh;
- opslag bevat geen CSV, kwartierregels, EAN, meter-ID, token of bestandsnaam;
- gerichte tests, root build/test/typecheck en Agent C-browsergate op 1280 px en 375 px slagen.

#### Release gate

Agent A mag alleen `APPROVED` geven na code-review, groene automatische controles én een Agent C PASS-rapport voor first-run, refresh, legacy, foutstate, mobiel en expliciet verwijderen.

### Task 034 — Releaseveilige batterijvergelijking

**Status:** MODULE APPROVED — PRODUCT RELEASE SUPERSEDED BY TASK 035

Maak de technische vergelijking van 0/3/5/7/10/13 kWh ook zichtbaar bij onvolledige kwartierdata, met een conservatieve reset naar een lege batterij bij ieder vooruitgaand datagat en een duidelijke waarschuwing dat dit slechts een schatting is. Financiële eligibility vereist chronologische, volledig gemeten data zonder gaps, dubbels of overlap en minstens twaalf maanden historiek. Rapporteer eindlading en verliezen expliciet. Financiële NPV, cashflow en terugverdientijd verschijnen uitsluitend nadat de gebruiker contract- en offerteherkomst, contracttarieven, levensduur, degradatie, discontovoet en de volledige investering inclusief btw per kandidaat expliciet bevestigt. Low/base/high zijn transparante 80/100/120%-scenario's van dezelfde energiecomponent; capaciteitstarief en volledige factuur blijven uitgesloten. Bewaar technische resultaten alleen in een strikt v2-contract met het werkelijk geladen energievolume en de volledige veilige kwaliteitsmetadata.

**Acceptance:** pure tests bewijzen alle harde gates, simulatorcontinuïteit, terminale rest/verliezen, expliciete bevestiging, vijf kandidaten plus nulreferentie, low/base/high discounted cashflows/NPV/payback, geen positieve aanbeveling bij base-NPV ≤0, stabiele v2 roundtrip en weigering van v1/onvolledige kwaliteit/ontbrekend geladen volume. Vaste/variabele contracttarieven moeten de volledige meetperiode dekken; dynamische contracten blijven geblokkeerd tot een tijdsgebonden contractformule bestaat. Geen CSV-kwartieren, contractinputs of secrets worden opgeslagen; de oude standaardtarief- en richtprijsroute is afwezig uit productiecode.

### Task 033 — Streaming batterij-simulatiekern

**Status:** READY FOR REVIEW

Voeg een pure, lokale simulator toe die chronologische kwartierstromen verwerkt zonder intervalgeschiedenis te bewaren. Per kwartier mag de batterij uitsluitend uit geregistreerde netinjectie laden en later geregistreerde netafname verminderen. Capaciteit, maximaal vermogen en rondrendement zijn expliciete invoer. De simulator weigert niet-chronologische, niet-kwartier- of ongeldige flows. Een optionele energiecomponent gebruikt alleen expliciet ingevoerde afname- en injectietarieven; hij is geen volledige factuur of ROI.

**Acceptance:** geen flowarrayretentie in de streaming integratie; geldige kwartieren bewijzen vermogen-, capaciteit- en rendementsgrenzen; verkeerde tijdlijn of invoer produceert geen resultaat; energiebesparing is uitsluitend vermeden afname minus gemiste injectievergoeding; tests en typecheck slagen.

### Task 032 — Expliciet lokaal Energiepaspoort

**Status:** READY FOR REVIEW

Na een succesvolle Task031-controle mag de gebruiker expliciet een lokaal Energiepaspoort bewaren. Het profiel bevat uitsluitend versie, bewaartijd, veilige periode, gemeten/geschatte afname en injectie en veilige kwaliteitstellingen. Geen CSV-inhoud, EAN, meter-ID, bestandsnaam, rij, interval of technische foutdetail mag in browseropslag komen. Zonder expliciete knop blijft de bestaande preview vluchtig. De gebruiker kan het profiel zichtbaar verwijderen.

**Acceptance:** onvolledige/corrupte opslag wordt genegeerd; alleen eindige niet-negatieve waarden en geldige timestamps worden geladen; succesvolle opslag en verwijdering zijn getest; overzicht toont enkel de veilige profielstatus; het rapport toont uitsluitend herleidbare periode-, totaal-, dagelijks gemiddelde- en meetkwaliteitstatistieken en weigert een ongeldige periode; typecheck en webtests slagen.

### Task 031 — Geheugenbegrensde streaming Fluvius-preview

**Status:** READY

Vervang uitsluitend het import-previewpad `parseCsv → rows → intervals` door een pure incrementele analyzer met `push(textChunk)`/`finish()` die gedecodeerde CSV exact één keer van links naar rechts verwerkt. De selectie leest bij voorkeur `File.stream()` met één stateful UTF-8 `TextDecoder` (BOM veilig); er ontstaat geen tweede volledige tekstkopie. Gebruik een expliciete CSV-state-machine voor `;`, CRLF/LF, escaped `""`, delimiters/newlines binnen quotes en een afsluitend record zonder newline. Valideer eerst exact de 12 bewezen headers. Bewaar daarna maximaal de 12 velden van het huidige record, vaste aggregaten en per van de vier registerstromen alleen vorige geldige start/eind, lokale DST-fase en integriteitstoestand; maak nooit een volledige rows-, records- of intervals-array.

Behoud exact de Task028-semantie: `dd-MM-yyyy HH:mm:ss` (compatibel `HH:mm`), Europe/Brussels, kwartierduur, 23/25-uursdagen, dubbel winteruur per registerstroom, registers, komma-decimale niet-negatieve kWh, drie kwaliteiten, veilige redenaantallen, geldig/overgeslagen, gemeten/geschat/geen-verbruik, gescheiden gemeten/geschatte afname/injectietotalen, gaps/duplicates/overlap en eerste/laatste veilige interval. Los het dubbele winteruur streaming op via chronologische fase per registerstroom: een lokale terugval na het eerste 02:xx-blok kiest de tweede absolute offset; een onmiddellijk identiek interval blijft een duplicate. Markeer niet-monotone bronvolgorde expliciet en presenteer integriteitsdiagnostiek niet als betrouwbaar wanneer ordening niet bewezen is.

Integreer deze analyzer rechtstreeks in de bestaande lokale selectie vóór previewmapping. Verhoog de lokale bestandsgrens uitsluitend tot 20 MiB zodat het bewezen bestand van circa 14,1 MB past; `20 MiB + 1 byte` wordt vóór `text()` afgewezen. Oude selectie, reject en dispose blijven stale-safe. De publieke previewvorm en teksten blijven privacyveilig en bevatten geen bestandsnaam, EAN, meter-ID, omschrijving, ruwe rij of broninhoud.

Verwerk begrensde chunks en yield tussen chunks zodat navigatie en Annuleren responsief blijven. Publiceer veilige fasen `openen → rijen controleren → preview`, echte gelezen bytes/totaalbytes en percentage via `aria-live`; publiceer nooit 100% vóór `finish()` en mappingcontrole klaar zijn. Nieuwe selectie, annulering, paginawissel en unmount verhogen de job-id, sluiten reader/decoder, wissen buffers/resultaat en blokkeren iedere late progress/success/error. Na cancel/fout blijft een nieuwe lokale import mogelijk en verschijnt nooit een gedeeltelijke preview.

**Boundedness:** maximaal 12 actuele velden, vier streamstates, vaste tellers, 250.000 rijen en hoogstens de eerste 20 veilige rijnummers per foutreden plus `truncatedCount`; stel tevens een vaste 64 KiB limiet per veld/record in met veilige foutcode. Geen logging, fetch, storage, workerdependency of kopie via `split`, `matchAll`, `ParsedCsv.rows` of `FluviusInterval[]`.

**Non-goals:** geen persistente import, worker/WebAssembly, berekening per individueel interval, sorteren/herstellen van willekeurig ongeordende input, bridgewijziging of dependency.

**Acceptance:**

- byte-/chunkgrens-tests bewijzen quotes, escaped quotes, CRLF/LF, newline/delimiter in quotes, EOF-record, lege/extra/ontbrekende velden en schemafouten zonder ruwe foutdetails;
- dezelfde synthetische Task028-fixtures leveren exact dezelfde veilige previewaggregaten als de bestaande mapper voor normale, 23-uurs- en 25-uursdagen, beide 02:xx-blokken, duplicates, gaps, overlap, invalid rows en alle kwaliteiten/registers;
- tests bewijzen winterterugval per stroom, identieke duplicate versus tweede winteruur, niet-monotone inputstatus en dat geen gat/overlap-betrouwbaarheidsclaim volgt bij ongeordende bron;
- een gegenereerde 100.216-rijen/14,1-MiB synthetische export slaagt in een begrensd Node-subproces met `--max-old-space-size=96`; een structurele test verbiedt `split`/`matchAll` en resultaatarrays die met rijtal meegroeien;
- exact 20 MiB mag de streamreader bereiken; 20 MiB + 1 byte wordt vóór `stream()`/`text()` afgewezen; selectiewissel, stale resolve/reject, lege selectie en dispose blijven bewezen;
- chunkboundarytests splitsen quotes, CRLF, UTF-8-tekens en records op iedere relevante positie; encoding-, veld-, record-, rij- en bestandslimieten stoppen veilig zonder partial preview;
- progress is monotone en bytegebaseerd, mapping volgt na laatste byte, 100% verschijnt pas bij geldige eindstate; cancel en trage A → snelle B bewijzen dat late events niets wijzigen en alle buffers worden vrijgegeven;
- previewoutput is gelijk ge-allowlist en nul netwerk/storage/logging; stressfixture en fouten bevatten uitsluitend synthetische identifiers;
- rootvalidatie exact `pnpm build`, daarna `pnpm test`, daarna `pnpm typecheck`.

#### Aanvullende bewezen opslagbevinding — Task 061

Een technische snapshot met een null/primitief entry veroorzaakt een TypeError in de centrale validator; ook ongeldige geneste financiële resultaten moeten vóór property-toegang worden begrensd. Root is de enige schrijver van deze reparatie. Acceptance: null/primitieve technische entries en malformed financiële geneste resultaten geven `false` zonder throw; ongeldige PUT krijgt `invalid_result`/400; corrupte opgeslagen JSON met zulke inhoud geeft `StorageCorruptError` en veilige recovery-responses zonder overschrijven van bestaande bytes. Aanvullend concreet bewezen: oversized streamende opslag-PUT sluit de socket in plaats van 413; de route moet begrensd lezen en HTTP 413 `body_too_large` teruggeven zonder opslagwijziging. Backend accepteert ongeldige daglabels zoals `2025-99-99` die de webvalidator afwijst. Dagvalidatie moet canonieke Brusselse kalenderdagen, intervalgrenzen/aantallen, geschatte/gatmetadata en fysieke energiebalansen overeenkomstig het bestaande webcontract controleren; oude geldige snapshots blijven geldig. Geen frontend- of schemawijziging. Aanvullend gereproduceerd: twee afzonderlijk geldige snapshots onder de requestlimiet kunnen samen `results.json` boven 4 MiB maken en volgende reads als corrupt blokkeren. Acceptance: vóór iedere write wordt de geserialiseerde gecombineerde store op 4 MiB begrensd; overschrijding geeft `StorageValidationError`/HTTP `invalid_result` 400 en behoudt bestaande bytes/readbaarheid. Test een daadwerkelijk geldige near-boundary snapshot gevolgd door een tweede geldige snapshot via echte API. Geen self-corruption of gedeeltelijke write. Tests gebruiken uitsluitend synthetische gegevens. Nieuwe finale build/tests/typecheck zijn vereist; de eerdere groene fingerprint geldt niet voor deze bronwijziging.

Aanvullend bewezen met synthetische HA-runtime: eerste lezing 2,5 seconden en volgende lezingen 100 ms veroorzaken twee gelijktijdige reads en voltooiingsvolgorde `[2,3,1,4]`; publieke gemeten waarden lopen 200→300→100→400 terug. Root repareert de bestaande eensecondetimer met een singleflight-guard en `finally`-vrijgave. Acceptance: maximaal één actieve bronlezing, nooit overschrijven door oudere overlappende lezing, gebruikelijke snelle eensecondecadans behouden en een mislukte read blokkeert volgende reads niet. Echte tijdelijke productie-serverregressie met uitsluitend synthetische HA-bron. Zichtbare runtimegate blijft vereist; geen nieuwe deploymentclaim.

### Volgende sequentiële stap — opslagprivacytekst

Commit `a930624` met de backend-/documentatiereparaties is op main gepusht; niet op de Pi uitgerold. De gebruiker heeft voortzetten expliciet opgedragen. Root blijft de enige productiecode-/testschrijver van dezelfde actieve Task 061.

Concreet probleem: `App.tsx` zegt op het overzicht en rapport "op dit toestel" terwijl expliciet bewaren een browserkopie bewaart en synchronisatie van veilige snapshots naar de Pi probeert. Acceptance: vóór Bewaar energiebalans, Bewaar technisch/volledig batterijrapport en legacy-omzetting staat zichtbaar dat alleen veilige samenvattingen in deze browser worden bewaard en met de Raspberry Pi worden gesynchroniseerd, waar gebruikers met toegang tot deze Home Assistant/CREMS-installatie ze kunnen bekijken. CSV, EAN, meter-ID, bestandsnaam en kwartierregels blijven tijdelijk/niet opgeslagen. Overzicht en rapportbadge mogen geen exclusieve device-only opslag beloven. Formulering mag geen synchronisatiesucces claimen voordat dat bevestigd is; bestaande foutstatus en fallback blijven exact behouden.

Geen nieuwe opslag, syncgedrag, toestemmingscheckbox, layout, afhankelijkheid of contract-/berekeningswijziging. Tekst/renderregressies controleren de genoemde savepaden en afwezigheid van oude device-only belofte. Agent C mag tekst/SSR read-only verifiëren; dat levert geen browser-PASS. Actuele browsergate blijft NOT RUN zonder nieuwe expliciete browserbedieningsopdracht. Privacycopy is door root geïmplementeerd; onafhankelijke Agent A-code/componentreview vindt geen concrete blocker en gerichte tests 19/19 PASS. Niet op de Pi uitgerold. Nieuwe finale build/tests/typecheck/fingerprint zijn nodig voor de gewijzigde frontend; volledige release blijft CHANGES REQUIRED.

## Previously approved task 028

### Task 028 — Echte Fluvius-mapping en privacyveilige kwartierpreview

**Status:** APPROVED

Gebruik de lokaal aangeleverde Fluvius-export uitsluitend als bewijs voor dit exacte schema: `Van (datum);Van (tijdstip);Tot (datum);Tot (tijdstip);EAN-code;Meter;Metertype;Register;Volume;Eenheid;Validatiestatus;Omschrijving`. Bewezen waarden zijn vier registers (`Afname Dag`, `Afname Nacht`, `Injectie Dag`, `Injectie Nacht`), `kWh`, komma-decimalen en statussen `Uitgelezen`, `Geschat`, `Geen verbruik`. Maak eerst een kleine volledig synthetische/saniteerde fixture met dezelfde headers en representatieve formaten; kopieer geen echte EAN, meter-ID, omschrijving, bestandsnaam of meetwaarden naar de repository.

Voeg daarna een pure mapper toe die de bestaande CSV-parseroutput omzet naar kwartierintervallen met canonieke timestamps, `direction: import|export`, `register: day|night`, `energyKwh` en `quality: measured|estimated|noConsumption`. Valideer exacte vereiste headers, lokale `dd-MM-yyyy` datum/tijd in `Europe/Brussels`, start < end, exact 15 minuten, eindige niet-negatieve komma-decimale waarde, exact `kWh`, register en status. Gebruik half-open intervallen, behoud 23/25-uursdagen en onderscheid het dubbele winteruur deterministisch op absolute timestamp; verzin geen ontbrekende intervallen en map ontbrekend nooit naar nul. Schema-/unitambiguïteit blokkeert de import; slechte datarijen worden veilig overgeslagen met vaste redenaantallen en veilige 1-based rijnummers.

Breid de lokale browserpreview uit met periode, geldige/overgeslagen aantallen, redenen, gemeten/geschat/geen-verbruik aantallen, gaten/duplicaten/overlap en afzonderlijke afname-/injectietotalen. Toon maximaal eerste en laatste veilige intervalvelden (datum/tijd, richting, volume, kwaliteit), nooit identificatievelden of ruwe rijen. Vermeld vóór en na selectie: `Lokaal verwerkt · niet geüpload` en `Nog niet opgeslagen of geïmporteerd`.

**Privacygrens:** uitsluitend browser-File-API; nul fetch/bridge/network/storage/analytics/logging. EAN, meter-ID, omschrijving, bestandsnaam en volledige ruwe inhoud komen niet in previewmodel, fouten, console, testsnapshots of fixture. Selectie-/unmountcleanup wist inhoud en een volgende selectie kan geen vorige preview laten terugkeren.

**Non-goals:** geen persistente import, database, bridge-upload, kostenberekening, contractadvies, automatische correctie, resampling of dependency.

**Acceptance:** tests bewijzen exact bewezen headers/delimiter/decimal/status/registermapping; ontbrekende/extra/dubbele headers; invalid datum/tijd/waarde/unit/register/status; start/end en 15 minuten; 23/25-uursdagen en dubbel winteruur; sortering, duplicate/gap/overlap; quality/totals zonder estimated als measured te labelen; veilige redenaantallen/rijnummers; diep bevroren input. UI/controller-tests bewijzen 10 MiB-grens vóór `text()`, stale resolve/reject, nul netwerk/opslag/logging, allowlisted previewvelden, cleanup en dat geen echte identifiers/rijen uitlekken. Exacte validatie: `pnpm build`, daarna `pnpm test`, daarna `pnpm typecheck`.

#### Aanvullende bewezen opslagbevinding — Task 061

Een technische snapshot met een null/primitief entry veroorzaakt een TypeError in de centrale validator; ook ongeldige geneste financiële resultaten moeten vóór property-toegang worden begrensd. Root is de enige schrijver van deze reparatie. Acceptance: null/primitieve technische entries en malformed financiële geneste resultaten geven `false` zonder throw; ongeldige PUT krijgt `invalid_result`/400; corrupte opgeslagen JSON met zulke inhoud geeft `StorageCorruptError` en veilige recovery-responses zonder overschrijven van bestaande bytes. Aanvullend concreet bewezen: oversized streamende opslag-PUT sluit de socket in plaats van 413; de route moet begrensd lezen en HTTP 413 `body_too_large` teruggeven zonder opslagwijziging. Backend accepteert ongeldige daglabels zoals `2025-99-99` die de webvalidator afwijst. Dagvalidatie moet canonieke Brusselse kalenderdagen, intervalgrenzen/aantallen, geschatte/gatmetadata en fysieke energiebalansen overeenkomstig het bestaande webcontract controleren; oude geldige snapshots blijven geldig. Geen frontend- of schemawijziging. Aanvullend gereproduceerd: twee afzonderlijk geldige snapshots onder de requestlimiet kunnen samen `results.json` boven 4 MiB maken en volgende reads als corrupt blokkeren. Acceptance: vóór iedere write wordt de geserialiseerde gecombineerde store op 4 MiB begrensd; overschrijding geeft `StorageValidationError`/HTTP `invalid_result` 400 en behoudt bestaande bytes/readbaarheid. Test een daadwerkelijk geldige near-boundary snapshot gevolgd door een tweede geldige snapshot via echte API. Geen self-corruption of gedeeltelijke write. Tests gebruiken uitsluitend synthetische gegevens. Nieuwe finale build/tests/typecheck zijn vereist; de eerdere groene fingerprint geldt niet voor deze bronwijziging.

Aanvullend bewezen met synthetische HA-runtime: eerste lezing 2,5 seconden en volgende lezingen 100 ms veroorzaken twee gelijktijdige reads en voltooiingsvolgorde `[2,3,1,4]`; publieke gemeten waarden lopen 200→300→100→400 terug. Root repareert de bestaande eensecondetimer met een singleflight-guard en `finally`-vrijgave. Acceptance: maximaal één actieve bronlezing, nooit overschrijven door oudere overlappende lezing, gebruikelijke snelle eensecondecadans behouden en een mislukte read blokkeert volgende reads niet. Echte tijdelijke productie-serverregressie met uitsluitend synthetische HA-bron. Zichtbare runtimegate blijft vereist; geen nieuwe deploymentclaim.

### Volgende sequentiële stap — opslagprivacytekst

Commit `a930624` met de backend-/documentatiereparaties is op main gepusht; niet op de Pi uitgerold. De gebruiker heeft voortzetten expliciet opgedragen. Root blijft de enige productiecode-/testschrijver van dezelfde actieve Task 061.

Concreet probleem: `App.tsx` zegt op het overzicht en rapport "op dit toestel" terwijl expliciet bewaren een browserkopie bewaart en synchronisatie van veilige snapshots naar de Pi probeert. Acceptance: vóór Bewaar energiebalans, Bewaar technisch/volledig batterijrapport en legacy-omzetting staat zichtbaar dat alleen veilige samenvattingen in deze browser worden bewaard en met de Raspberry Pi worden gesynchroniseerd, waar gebruikers met toegang tot deze Home Assistant/CREMS-installatie ze kunnen bekijken. CSV, EAN, meter-ID, bestandsnaam en kwartierregels blijven tijdelijk/niet opgeslagen. Overzicht en rapportbadge mogen geen exclusieve device-only opslag beloven. Formulering mag geen synchronisatiesucces claimen voordat dat bevestigd is; bestaande foutstatus en fallback blijven exact behouden.

Geen nieuwe opslag, syncgedrag, toestemmingscheckbox, layout, afhankelijkheid of contract-/berekeningswijziging. Tekst/renderregressies controleren de genoemde savepaden en afwezigheid van oude device-only belofte. Agent C mag tekst/SSR read-only verifiëren; dat levert geen browser-PASS. Actuele browsergate blijft NOT RUN zonder nieuwe expliciete browserbedieningsopdracht. Privacycopy is door root geïmplementeerd; onafhankelijke Agent A-code/componentreview vindt geen concrete blocker en gerichte tests 19/19 PASS. Niet op de Pi uitgerold. Nieuwe finale build/tests/typecheck/fingerprint zijn nodig voor de gewijzigde frontend; volledige release blijft CHANGES REQUIRED.

## Previously approved task 027

### Task 027 — Echte dagprijs in de bestaande grafiek

**Status:** APPROVED

Koppel `GET /api/history/price?day=...` raceveilig aan dezelfde Gisteren/Vandaag/Morgen-selector. Render uitsluitend ontvangen echte `priceCtKwh` als gele hourly step-reeks met een eigen rechteras en zichtbare nullijn; behoud negatieve en nulprijzen. Gisteren laadt eenmaal, Vandaag en Morgen controleren alleen wanneer zichtbaar maximaal elke 10 minuten opnieuw. Een dagwissel wist onmiddellijk de oude prijsreeks, abort de vorige request en negeert stale resolve/reject. Prijsloading/-fout beïnvloedt de vermogensstate niet. Morgen mag echte prijs tonen terwijl vermogen expliciet toekomst/leeg blijft; `notPublished` toont “Nog niet gepubliceerd” en nooit €0 of een lijn.

Kop, legenda en SVG-aria-label noemen prijsdata, Home Assistant en geselecteerde datum. Teken niet vóór het eerste of na het laatste prijspunt en interpoleer niet lineair. Op 320 px blijven selector, beide assen en legenda leesbaar; bij Morgen verbergt de plot iedere vermogenslijn/-as die toekomstverbruik kan suggereren. Label de reeks “Energieprijs”, niet “jouw tarief” of totale kost.

**Non-goals:** geen contract/netkosten/heffingen, advies, voorspelling, fallbackdata, powerendpointwijziging, opslag of dependency.

**Acceptance:** pure controller-/schaaltests bewijzen veilige responsevalidatie, exact endpoint/day, polling/visibility, abort/stale, onafhankelijke power- en prijsstates, notPublished/error/empty, nul/negatief, step-pad en eindpuntstop. Structurele UI-tests bewijzen morgen price-only zonder power-SVG-data, dynamische labels/aria, rechteras `ct/kWh`, 320px-layout en afwezigheid van demo/random/contractclaims.

**Validatie:** vanaf root exact `pnpm build`, daarna `pnpm test`, daarna `pnpm typecheck`.

#### Aanvullende bewezen opslagbevinding — Task 061

Een technische snapshot met een null/primitief entry veroorzaakt een TypeError in de centrale validator; ook ongeldige geneste financiële resultaten moeten vóór property-toegang worden begrensd. Root is de enige schrijver van deze reparatie. Acceptance: null/primitieve technische entries en malformed financiële geneste resultaten geven `false` zonder throw; ongeldige PUT krijgt `invalid_result`/400; corrupte opgeslagen JSON met zulke inhoud geeft `StorageCorruptError` en veilige recovery-responses zonder overschrijven van bestaande bytes. Aanvullend concreet bewezen: oversized streamende opslag-PUT sluit de socket in plaats van 413; de route moet begrensd lezen en HTTP 413 `body_too_large` teruggeven zonder opslagwijziging. Backend accepteert ongeldige daglabels zoals `2025-99-99` die de webvalidator afwijst. Dagvalidatie moet canonieke Brusselse kalenderdagen, intervalgrenzen/aantallen, geschatte/gatmetadata en fysieke energiebalansen overeenkomstig het bestaande webcontract controleren; oude geldige snapshots blijven geldig. Geen frontend- of schemawijziging. Aanvullend gereproduceerd: twee afzonderlijk geldige snapshots onder de requestlimiet kunnen samen `results.json` boven 4 MiB maken en volgende reads als corrupt blokkeren. Acceptance: vóór iedere write wordt de geserialiseerde gecombineerde store op 4 MiB begrensd; overschrijding geeft `StorageValidationError`/HTTP `invalid_result` 400 en behoudt bestaande bytes/readbaarheid. Test een daadwerkelijk geldige near-boundary snapshot gevolgd door een tweede geldige snapshot via echte API. Geen self-corruption of gedeeltelijke write. Tests gebruiken uitsluitend synthetische gegevens. Nieuwe finale build/tests/typecheck zijn vereist; de eerdere groene fingerprint geldt niet voor deze bronwijziging.

Aanvullend bewezen met synthetische HA-runtime: eerste lezing 2,5 seconden en volgende lezingen 100 ms veroorzaken twee gelijktijdige reads en voltooiingsvolgorde `[2,3,1,4]`; publieke gemeten waarden lopen 200→300→100→400 terug. Root repareert de bestaande eensecondetimer met een singleflight-guard en `finally`-vrijgave. Acceptance: maximaal één actieve bronlezing, nooit overschrijven door oudere overlappende lezing, gebruikelijke snelle eensecondecadans behouden en een mislukte read blokkeert volgende reads niet. Echte tijdelijke productie-serverregressie met uitsluitend synthetische HA-bron. Zichtbare runtimegate blijft vereist; geen nieuwe deploymentclaim.

### Volgende sequentiële stap — opslagprivacytekst

Commit `a930624` met de backend-/documentatiereparaties is op main gepusht; niet op de Pi uitgerold. De gebruiker heeft voortzetten expliciet opgedragen. Root blijft de enige productiecode-/testschrijver van dezelfde actieve Task 061.

Concreet probleem: `App.tsx` zegt op het overzicht en rapport "op dit toestel" terwijl expliciet bewaren een browserkopie bewaart en synchronisatie van veilige snapshots naar de Pi probeert. Acceptance: vóór Bewaar energiebalans, Bewaar technisch/volledig batterijrapport en legacy-omzetting staat zichtbaar dat alleen veilige samenvattingen in deze browser worden bewaard en met de Raspberry Pi worden gesynchroniseerd, waar gebruikers met toegang tot deze Home Assistant/CREMS-installatie ze kunnen bekijken. CSV, EAN, meter-ID, bestandsnaam en kwartierregels blijven tijdelijk/niet opgeslagen. Overzicht en rapportbadge mogen geen exclusieve device-only opslag beloven. Formulering mag geen synchronisatiesucces claimen voordat dat bevestigd is; bestaande foutstatus en fallback blijven exact behouden.

Geen nieuwe opslag, syncgedrag, toestemmingscheckbox, layout, afhankelijkheid of contract-/berekeningswijziging. Tekst/renderregressies controleren de genoemde savepaden en afwezigheid van oude device-only belofte. Agent C mag tekst/SSR read-only verifiëren; dat levert geen browser-PASS. Actuele browsergate blijft NOT RUN zonder nieuwe expliciete browserbedieningsopdracht. Privacycopy is door root geïmplementeerd; onafhankelijke Agent A-code/componentreview vindt geen concrete blocker en gerichte tests 19/19 PASS. Niet op de Pi uitgerold. Nieuwe finale build/tests/typecheck/fingerprint zijn nodig voor de gewijzigde frontend; volledige release blijft CHANGES REQUIRED.

## Previously approved task 026

### Task 026 — Veilig endpoint voor echte dagprijzen

**Status:** APPROVED

Bouw één read-only `GET /api/history/price`-route met exact één `day=yesterday|today|tomorrow`. De bridge berekent het bijbehorende Europe/Brussels-kalenderdagvenster met een geïnjecteerde klok. Gisteren en vandaag laden de history van exact één geconfigureerde huidige-prijssensor en normaliseren die via Task 025 met de door Home Assistant bewezen unit. Morgen leest uitsluitend de echte `raw_tomorrow`-items van exact één expliciet geconfigureerde morgenprijssensor, gebruikt iedere absolute `start`-timestamp en normaliseert dezelfde veilige puntvorm; ontbrekend/leeg `raw_tomorrow` retourneert een vaste `notPublished`-kwaliteit met lege punten, nooit nullen of extrapolatie.

De publieke response bevat uitsluitend `day`, canonieke `start`/`end`, `quality: measured|incomplete|notPublished` en `{timestamp,priceCtKwh}`-punten. Valideer GET, unieke day-query, bronconfiguratie, unit, timestamps, venster/DST en upstreamvorm vóór output. Fouten hebben vaste Nederlandse code/message en lekken geen token, URL, entity-ID, unit, attributen, ruwe body of timestamps. Gisteren/vandaag mogen geen toekomstige history-call doen; morgen doet geen power- of price-history-call. Null/negatieve prijzen blijven geldig en beide bronpaden sorteren/dedupliceren op absolute timestamp.

**Non-goals:** geen React/UI/SVG, polling, cache, interpolatie, uurvulling, contractprijsclaim, netkosten/heffingen, opslag of nieuwe dependency.

**Acceptance:** tests bewijzen 23/25-uursdagen, vandaag tot server-now, morgenprice-only, echte `raw_tomorrow`, twee terugdraaiuren met verschillende offsets, lege/ontbrekende morgenpublicatie, nul/negatief, unitafwijzing, invalid/duplicate/outside filtering, 405, queryfouten, 401/500/netwerkfout, nul loadercalls bij reject, één klok-snapshot per request, exacte veilige responsevelden en geen secretlek. Stubs worden altijd opgeruimd.

**Validatie:** vanaf root exact `pnpm build`, daarna `pnpm test`, daarna `pnpm typecheck`.

#### Aanvullende bewezen opslagbevinding — Task 061

Een technische snapshot met een null/primitief entry veroorzaakt een TypeError in de centrale validator; ook ongeldige geneste financiële resultaten moeten vóór property-toegang worden begrensd. Root is de enige schrijver van deze reparatie. Acceptance: null/primitieve technische entries en malformed financiële geneste resultaten geven `false` zonder throw; ongeldige PUT krijgt `invalid_result`/400; corrupte opgeslagen JSON met zulke inhoud geeft `StorageCorruptError` en veilige recovery-responses zonder overschrijven van bestaande bytes. Aanvullend concreet bewezen: oversized streamende opslag-PUT sluit de socket in plaats van 413; de route moet begrensd lezen en HTTP 413 `body_too_large` teruggeven zonder opslagwijziging. Backend accepteert ongeldige daglabels zoals `2025-99-99` die de webvalidator afwijst. Dagvalidatie moet canonieke Brusselse kalenderdagen, intervalgrenzen/aantallen, geschatte/gatmetadata en fysieke energiebalansen overeenkomstig het bestaande webcontract controleren; oude geldige snapshots blijven geldig. Geen frontend- of schemawijziging. Aanvullend gereproduceerd: twee afzonderlijk geldige snapshots onder de requestlimiet kunnen samen `results.json` boven 4 MiB maken en volgende reads als corrupt blokkeren. Acceptance: vóór iedere write wordt de geserialiseerde gecombineerde store op 4 MiB begrensd; overschrijding geeft `StorageValidationError`/HTTP `invalid_result` 400 en behoudt bestaande bytes/readbaarheid. Test een daadwerkelijk geldige near-boundary snapshot gevolgd door een tweede geldige snapshot via echte API. Geen self-corruption of gedeeltelijke write. Tests gebruiken uitsluitend synthetische gegevens. Nieuwe finale build/tests/typecheck zijn vereist; de eerdere groene fingerprint geldt niet voor deze bronwijziging.

Aanvullend bewezen met synthetische HA-runtime: eerste lezing 2,5 seconden en volgende lezingen 100 ms veroorzaken twee gelijktijdige reads en voltooiingsvolgorde `[2,3,1,4]`; publieke gemeten waarden lopen 200→300→100→400 terug. Root repareert de bestaande eensecondetimer met een singleflight-guard en `finally`-vrijgave. Acceptance: maximaal één actieve bronlezing, nooit overschrijven door oudere overlappende lezing, gebruikelijke snelle eensecondecadans behouden en een mislukte read blokkeert volgende reads niet. Echte tijdelijke productie-serverregressie met uitsluitend synthetische HA-bron. Zichtbare runtimegate blijft vereist; geen nieuwe deploymentclaim.

### Volgende sequentiële stap — opslagprivacytekst

Commit `a930624` met de backend-/documentatiereparaties is op main gepusht; niet op de Pi uitgerold. De gebruiker heeft voortzetten expliciet opgedragen. Root blijft de enige productiecode-/testschrijver van dezelfde actieve Task 061.

Concreet probleem: `App.tsx` zegt op het overzicht en rapport "op dit toestel" terwijl expliciet bewaren een browserkopie bewaart en synchronisatie van veilige snapshots naar de Pi probeert. Acceptance: vóór Bewaar energiebalans, Bewaar technisch/volledig batterijrapport en legacy-omzetting staat zichtbaar dat alleen veilige samenvattingen in deze browser worden bewaard en met de Raspberry Pi worden gesynchroniseerd, waar gebruikers met toegang tot deze Home Assistant/CREMS-installatie ze kunnen bekijken. CSV, EAN, meter-ID, bestandsnaam en kwartierregels blijven tijdelijk/niet opgeslagen. Overzicht en rapportbadge mogen geen exclusieve device-only opslag beloven. Formulering mag geen synchronisatiesucces claimen voordat dat bevestigd is; bestaande foutstatus en fallback blijven exact behouden.

Geen nieuwe opslag, syncgedrag, toestemmingscheckbox, layout, afhankelijkheid of contract-/berekeningswijziging. Tekst/renderregressies controleren de genoemde savepaden en afwezigheid van oude device-only belofte. Agent C mag tekst/SSR read-only verifiëren; dat levert geen browser-PASS. Actuele browsergate blijft NOT RUN zonder nieuwe expliciete browserbedieningsopdracht. Privacycopy is door root geïmplementeerd; onafhankelijke Agent A-code/componentreview vindt geen concrete blocker en gerichte tests 19/19 PASS. Niet op de Pi uitgerold. Nieuwe finale build/tests/typecheck/fingerprint zijn nodig voor de gewijzigde frontend; volledige release blijft CHANGES REQUIRED.

## Previously approved task 025

### Task 025 — Pure normalisatie van Home Assistant-prijshistory

**Status:** APPROVED

Voeg in de bridge een pure normalisatiefunctie toe die ruwe historyrecords plus een afzonderlijk bewezen broneenheid omzet naar uitsluitend chronologische `{ timestamp, priceCtKwh }`-punten. Accepteer na trim/case-normalisatie alleen `EUR/kWh` en `€/kWh` en converteer eindige states exact met `* 100`; ontbrekende of onbekende unit krijgt een vaste veilige foutcode en wordt nooit geraden. Gebruik `last_changed` primair en `last_updated` alleen als fallback, behoud geldige nul- en negatieve prijzen, en verwerp unknown/unavailable/lege/niet-eindige states en punten buiten het inclusieve aangeleverde venster. Bij gelijke absolute timestamps wint deterministisch het laatste geldige bronrecord. Retourneer naast punten uitsluitend vaste tellingen voor `invalid`, `outsideWindow` en `duplicate`; leeg/all-invalid is veilig leeg. Valideer eerst het venster (`start < end`, geldige ISO-instants), daarna de unit, met vaste foutcodes. Input blijft ongemuteerd en ruwe records, unit, entity-ID en attributen lekken niet naar output of fouten.

**Non-goals:** geen route/server/UI, geen live Home Assistant-call, geen Nordpool-attributeparser, geen interpolatie/uurvulling, geen afronding, opslag, prijsadvies of nieuwe dependency.

**Acceptance:** tests bewijzen beide toegestane units met whitespace/case, onbekende/lege unit, EUR/kWh→ct/kWh, nul/negatief, timestamps met offsets en terugdraaiuur, timestampfallback, windowgrenzen, invalid/outside/duplicate exclusieve telling, last-valid deduplicatie op absolute timestamp, chronologie, empty/all-invalid, foutprioriteit en frozen input. Publieke output heeft exact punten plus drie tellingen en geen bronvelden.

**Validatie:** vanaf root exact `pnpm build`, daarna `pnpm test`, daarna `pnpm typecheck`.

### Previously approved current task

### Task 024 — Toegankelijke Gisteren/Vandaag/Morgen-selector

**Status:** APPROVED

Integreer `selectBrusselsDayWindow` boven de echte grafiek met drie gelijke native buttons (`aria-pressed`), Vandaag als default en compacte datumlabels. Gisteren haalt de volledige kalenderdag op; Vandaag haalt middernacht tot de geïnjecteerde actuele tijd op en ververst alleen zichtbaar; Morgen en exact-middernacht-empty doen nul fetches en tonen expliciete lege states zonder raster of lijnen. Selectorwissel activeert direct loading voor de nieuwe datum, abort/stale-bescherming voorkomt oude resultaten, en een veilige retry blijft binnen hetzelfde dagvenster. Bewijs keyboard/focus, aria-live, 44px touch targets, 320px layout, injectie visueel onder nul en afwezigheid van fictieve toekomstdata.

**Non-goals:** geen prijsserie, toekomstverbruik, kalenderpicker, chevrons, nieuwe dependency of bridgewijziging.

**Validatie:** `pnpm build`, `pnpm test`, `pnpm typecheck` vanaf de root; gerichte tests gebruiken geïnjecteerde klok/fetch/scheduler zonder echte timers of netwerk.

### Aanvullende bewezen opslagbevinding — Task 061

Een technische snapshot met een null/primitief entry veroorzaakt een TypeError in de centrale validator; ook ongeldige geneste financiële resultaten moeten vóór property-toegang worden begrensd. Root is de enige schrijver van deze reparatie. Acceptance: null/primitieve technische entries en malformed financiële geneste resultaten geven `false` zonder throw; ongeldige PUT krijgt `invalid_result`/400; corrupte opgeslagen JSON met zulke inhoud geeft `StorageCorruptError` en veilige recovery-responses zonder overschrijven van bestaande bytes. Aanvullend concreet bewezen: oversized streamende opslag-PUT sluit de socket in plaats van 413; de route moet begrensd lezen en HTTP 413 `body_too_large` teruggeven zonder opslagwijziging. Backend accepteert ongeldige daglabels zoals `2025-99-99` die de webvalidator afwijst. Dagvalidatie moet canonieke Brusselse kalenderdagen, intervalgrenzen/aantallen, geschatte/gatmetadata en fysieke energiebalansen overeenkomstig het bestaande webcontract controleren; oude geldige snapshots blijven geldig. Geen frontend- of schemawijziging. Aanvullend gereproduceerd: twee afzonderlijk geldige snapshots onder de requestlimiet kunnen samen `results.json` boven 4 MiB maken en volgende reads als corrupt blokkeren. Acceptance: vóór iedere write wordt de geserialiseerde gecombineerde store op 4 MiB begrensd; overschrijding geeft `StorageValidationError`/HTTP `invalid_result` 400 en behoudt bestaande bytes/readbaarheid. Test een daadwerkelijk geldige near-boundary snapshot gevolgd door een tweede geldige snapshot via echte API. Geen self-corruption of gedeeltelijke write. Tests gebruiken uitsluitend synthetische gegevens. Nieuwe finale build/tests/typecheck zijn vereist; de eerdere groene fingerprint geldt niet voor deze bronwijziging.

Aanvullend bewezen met synthetische HA-runtime: eerste lezing 2,5 seconden en volgende lezingen 100 ms veroorzaken twee gelijktijdige reads en voltooiingsvolgorde `[2,3,1,4]`; publieke gemeten waarden lopen 200→300→100→400 terug. Root repareert de bestaande eensecondetimer met een singleflight-guard en `finally`-vrijgave. Acceptance: maximaal één actieve bronlezing, nooit overschrijven door oudere overlappende lezing, gebruikelijke snelle eensecondecadans behouden en een mislukte read blokkeert volgende reads niet. Echte tijdelijke productie-serverregressie met uitsluitend synthetische HA-bron. Zichtbare runtimegate blijft vereist; geen nieuwe deploymentclaim.

### Volgende sequentiële stap — opslagprivacytekst

Commit `a930624` met de backend-/documentatiereparaties is op main gepusht; niet op de Pi uitgerold. De gebruiker heeft voortzetten expliciet opgedragen. Root blijft de enige productiecode-/testschrijver van dezelfde actieve Task 061.

Concreet probleem: `App.tsx` zegt op het overzicht en rapport "op dit toestel" terwijl expliciet bewaren een browserkopie bewaart en synchronisatie van veilige snapshots naar de Pi probeert. Acceptance: vóór Bewaar energiebalans, Bewaar technisch/volledig batterijrapport en legacy-omzetting staat zichtbaar dat alleen veilige samenvattingen in deze browser worden bewaard en met de Raspberry Pi worden gesynchroniseerd, waar gebruikers met toegang tot deze Home Assistant/CREMS-installatie ze kunnen bekijken. CSV, EAN, meter-ID, bestandsnaam en kwartierregels blijven tijdelijk/niet opgeslagen. Overzicht en rapportbadge mogen geen exclusieve device-only opslag beloven. Formulering mag geen synchronisatiesucces claimen voordat dat bevestigd is; bestaande foutstatus en fallback blijven exact behouden.

Geen nieuwe opslag, syncgedrag, toestemmingscheckbox, layout, afhankelijkheid of contract-/berekeningswijziging. Tekst/renderregressies controleren de genoemde savepaden en afwezigheid van oude device-only belofte. Agent C mag tekst/SSR read-only verifiëren; dat levert geen browser-PASS. Actuele browsergate blijft NOT RUN zonder nieuwe expliciete browserbedieningsopdracht. Privacycopy is door root geïmplementeerd; onafhankelijke Agent A-code/componentreview vindt geen concrete blocker en gerichte tests 19/19 PASS. Niet op de Pi uitgerold. Nieuwe finale build/tests/typecheck/fingerprint zijn nodig voor de gewijzigde frontend; volledige release blijft CHANGES REQUIRED.

## Previously approved task specification

### Task 021 — Responsieve grafiek met echte vermogenshistory

**Status:** APPROVED

**Historische scope:** het verwijderen van demo-/prijsartefacten gold vóór Task 027. De latere echte gele prijsreeks uit Task 027 supersedeert uitsluitend de oude eis dat iedere prijsreeks afwezig moest zijn; de no-demo/no-fake-eis blijft gelden.

### Objective

Vervang de twee hardcoded demo-/prijs-polylines door een responsieve SVG die uitsluitend echte import- en exportvermogenshistory van Task 020 toont, met veilige loading-, empty-, unavailable- en errorstates.

### Scope

- voeg een kleine historyclient/controller of hook toe die na een verbonden echte Home Assistant-reading eenmaal het afgelopen exacte 24-uursvenster opvraagt;
- gebruik één geïnjecteerde `now`/fetch-naad voor deterministische tests, expliciete GET en URLSearchParams;
- valideer de publieke response structureel vóór state-update en map onbekende bodies/fouten naar vaste niet-technische UI-states;
- bescherm tegen stale resolve/reject, bronwissel, disconnect en unmount met sequence/abort-cleanup;
- voeg een pure SVG-schaalfunctie toe voor beide reeksen over het responsevenster, inclusief nul-, éénpunt-, all-zero- en negatieve eindige waarden;
- vervang in `App.tsx` de demo door echte import/exportlijnen en toegankelijke stateweergave.

### Non-Goals

- geen statische fallbackpolyline, random/demo-/geschatte grafiekdata of prijsserie;
- geen polling per seconde, retry, cache, opslag, resampling, interpolatie of kwartieraggregatie;
- geen rendering van foutbody, stack, URL, token, entity-ID, unit of ruwe Home Assistant-data;
- geen contractbesparing, eurobedrag of adviesclaim afleiden uit alleen vermogenshistory;
- geen bridge-, core- of Home Assistant-dashboardwijziging;
- geen dependency of nieuw testframework.

### Likely Files

- `apps/web/src/power-history*.ts` en/of één kleine hook/controller;
- `apps/web/src/App.tsx`;
- `apps/web/src/styles.css`;
- `apps/web/test/*history*.test.ts` en `apps/web/package.json` uitsluitend indien bestaande testuitvoering dit vereist.

### Acceptance Criteria

- [ ] Bij `connected && source === "home-assistant"` ontstaat exact één expliciete GET naar `/api/history/power` met end=`now()` en start exact 24 uur eerder, beide canonieke ISO via URLSearchParams; herhaalde live readings starten geen nieuwe request.
- [ ] Simulator, offline en andere bron starten geen historyfetch en tonen vaste `unavailable`/offline tekst zonder grafiekpunten.
- [ ] Iedere start publiceert eerst loading en wist oude data; HTTP-fout, fetch-rejectie en ongeldige JSON/responsevorm worden vaste veilige errorstate zonder originele details.
- [ ] Een nieuwere request/bronwissel/disconnect/unmount maakt oudere resolve én reject ongeldig en abort de actieve fetch; stale resultaten wijzigen geen state.
- [ ] Alleen structureel geldige start/end/quality en puntarrays met geldige ISO-timestamps en eindige `powerW` komen in UI-state; onbekende extra/ruwe velden worden niet bewaard.
- [ ] Pure schaaltests bewijzen chronologische x-posities binnen viewBox, gedeelde y-schaal voor import/export, all-zero, één punt, negatieve waarden en lege richting zonder `NaN`/`Infinity` in SVG-attributen.
- [ ] Succes rendert uitsluitend lijnen/labels voor echte import en export, vermeldt “Home Assistant” en responseperiode/kwaliteit, en gebruikt een responsieve SVG met betekenisvolle `role="img"`/aria-label.
- [ ] Loading, volledig empty, gedeeltelijk incomplete en error hebben elk zichtbare, toegankelijke Nederlandse tekst; een lege richting creëert geen verzonnen lijn.
- [x] `chartA`, `chartB`, “Demo-profiel” en “Demografiek” zijn uit actieve bron verdwenen. De vroegere no-price-eis is `SUPERSEDED BY TASK 027`, die uitsluitend een echte gele prijsreeks toestaat.
- [ ] De grafiek bevat geen prijs-, euro-, besparings- of advieswaarde; het bestaande adviespaneel blijft expliciet onberekend en claimt niets op basis van history alleen.
- [ ] Tests gebruiken fake fetch/deferred promises en geïnjecteerde tijd zonder extern netwerk, echte klok, timers, `.env`, persoonsgegevens of nieuwe dependency.
- [ ] Bridge/core en bestaande webfunctionaliteit blijven groen; geen wijziging buiten toegestane webbestanden.
- [ ] Exacte validatie vanaf repositoryroot: `pnpm build`, daarna `pnpm test`, daarna `pnpm typecheck`.

### Agent B handoff

Voer uitsluitend Task 021 uit. Houd fetch/state en SVG-scaling in pure of geïnjecteerde helpers zodat Node-tests zonder DOM-framework volstaan. Gebruik geen `Date.now()` binnen de testbare controller: injecteer `now`. Verwijder de demo pas wanneer alle expliciete states renderen. Stop na rapportage per criterium voor onafhankelijke review door Agent A.

## Backlog

### Task 043 — CREMS-website op Raspberry Pi laten draaien

**Status:** TODO — uitvoeren na herstel van de open P1-bevindingen en vereiste releasegates.

Doel: de gebouwde webapp en bridge duurzaam op de Raspberry Pi starten en vanaf het bedoelde thuisnetwerk bereikbaar maken. Eerst het bestaande HAOS-/Pi-platform en de netwerkgrens bevestigen; daarna installatie, herstart, logging, updates en lokale gegevensopslag ontwerpen en testen. Geheimen blijven buiten de webapp en repository. Acceptatie: pagina en API zijn na reboot bereikbaar op een vast adres, de meetbron en prijzen werken, en Agent C bewijst de volledige gebruikersreis op desktop en mobiel. Geen claim van vrijgave vóór securityreview en browser-PASS.

### Task 044 — Belgische energiecontracten via een toegestane API ophalen

**Status:** TODO — na Task 043; bron- en toegangsbeslissing vereist.

Doel: een actuele, herleidbare bron vinden voor Belgische leveranciersproducten en contracttarieven per gewest. Onderzoek eerst officiële V-test, BruSim, CompaCWaPE en eventuele leveranciers-/partner-API's op documentatie, toegang, gebruiksrechten, actualiteit en velddekking. Implementeer pas na bevestigde toestemming en stabiele contractgegevens een server-side adapter. Vergelijk vaste, variabele en dynamische producten uitsluitend met passende tariefformules, periode, vaste kosten en injectievergoeding; markeer ontbrekende gegevens zichtbaar en toon bron plus peildatum. Geen scraping van ongedocumenteerde interne endpoints als productiebron en geen marktbrede besparingsclaim op basis van alleen spotprijzen.

**Onderzoeksuitkomst 27 september 2026:** officiële V-test-download voor Vlaanderen gevonden (maandelijks Excel; hergebruik onder open-data-licentie met bronvermelding; prijzen exclusief btw en zonder nettarieven/heffingen). Geen gedocumenteerde openbare API of equivalent herbruikbaar contractbestand vastgesteld voor België als geheel. Scopebesluit en brondekking blijven voorafgaande acceptatievoorwaarden; zie Task 053. Dit levert geen productcode of landelijke contractdekking op.

**Aanvulling 28 september 2026:** gedocumenteerde aanbieders-API's bestaan, maar live gebruik is nog niet toegestaan/bevestigd voor CREMS. Aanbieders.be vereist partnerregistratie plus public/private credentials en affiliate-ID; actuele rechten, prijs en API-respons moeten vóór connectorimplementatie bevestigd worden. Tounify is ongeschikt door expliciete uitsluiting van consumenten en van kostenberekeningen in de voorwaarden. Selectra's API is een contractkeuze-/prijsplanningflow, geen bewezen brede contractcatalogus. Zie Task 053. Geen credentials, account of betaalplan aangemaakt.

### Task 009 — Echte Fluvius-fixture, kolommapping en kwartierintervalpreview

**Status:** SUPERSEDED BY TASK 028 — echte bronstructuur is nu lokaal bewezen

Ontbrekend bewijs: één echte, door de gebruiker gesaniteerde Fluvius-exportfixture met behouden headers en representatieve kwartierregels. Zonder die fixture wordt geen kolomschema of formaatgedrag verzonnen.

## Completed

- Task 001 — projectstructuur en projectgeheugen opgeschoond.
- Task 002 — gedragsbewijs voor vlakke intervalkost — `APPROVED`.
- Task 003 — betrouwbare Home Assistant-vermogensnormalisatie — `APPROVED`.
- Task 004 — read-only Home Assistant-transport en HTTP-fouten — `APPROVED`.
- Task 005 — testbare Home Assistant- versus simulatiebronselectie — `APPROVED`.
- Task 006 — pure CSV-structuurlaag voor Fluvius-import — `APPROVED`.
- Task 007 — lokale structurele CSV-importpreview — `APPROVED`.
- Task 008 — begrensde en race-geteste lokale CSV-selectie — `APPROVED`.
- Task 010 — geen stilzwijgende nulprijzen in vlakke kosten — `APPROVED`.
- Task 011 — geldige volumes voor vlakke kosten — `APPROVED`.
- Task 012 — eindige gebruikte tarieven voor vlakke kosten — `APPROVED`.
- Task 013 — transparante aggregatie van vlakke energiekosten — `APPROVED`.
- Task 014 — read-only Home Assistant-historytransport — `APPROVED`.
- Task 015 — transparante vergelijking van twee vlakke contracten — `APPROVED`.
- Task 016 — veilige en testbare bridge-healthresponse — `APPROVED`.
- Task 017 — veilige bridge-listenconfiguratie — `APPROVED`.
- Task 018 — expliciet productie-startpunt voor de bridge — `APPROVED`.
- Task 019 — pure normalisatie van Home Assistant power-history — `APPROVED`.
- Task 020 — begrensd bridge-endpoint voor echte import-/exporthistory — `APPROVED`.
- Task 021 — responsieve grafiek met echte vermogenshistory — `APPROVED`.
- Task 022 — Brusselse kalenderdagvensters — `APPROVED`.
- Task 023 — 25-uurs historygrens en strikte future-guard — `APPROVED`.
- Task 024 — toegankelijke Gisteren/Vandaag/Morgen-selector — `APPROVED`.
- Task 025 — pure normalisatie van Home Assistant-prijshistory — `APPROVED`.
- Task 026 — veilig endpoint voor echte dagprijzen — `APPROVED`.
- Task 027 — echte dagprijs in de bestaande grafiek — `APPROVED`.
- Task 028 — echte Fluvius-mapping en privacyveilige kwartierpreview — `APPROVED`.

Actuele netwerkbevinding Task 061 (1 oktober): de huidige pc heeft Wi-Fi-adres `192.168.0.243/24`, gateway `192.168.0.1`; de Pi heeft `192.168.88.253/24`, gateway `192.168.88.1`. Ze zitten in verschillende IPv4-subnets. De directe timeout past bij ontbrekende routering tussen deze netwerken; de routerconfiguratie is niet gecontroleerd of gewijzigd. De pc moet toegang krijgen tot het Pi-subnet (bijvoorbeeld hetzelfde niet-geïsoleerde thuisnetwerk) of een bestaande route gebruiken. De tijdens deze run werkende toegang gebruikt [Home Assistant via Tailscale](http://homeassistant.tail582404.ts.net:8123/hassio/ingress/350f0e24_crems_energy). Er is geen bewijs dat een willekeurig apparaat op het Pi-subnet niet kan verbinden.
### Volgende sequentiële Task 061-stap — veilige lokale cleanup

Agent C reproduceerde: bij een centrale GET-fout kan expliciet opruimen van een lokaal legacy-/corrupt batterijresultaat ook een ander bestaand Pi-rapport verwijderen. Root is de enige productiecode-/testschrijver; exacte write set blijft `apps/web/src/App.tsx`, `apps/web/test/battery-flow-structure.test.ts`. Geen tweede actieve taak of parallelle schrijver.

Acceptance vóór implementatie: een verwijderactie met iedere expliciete lokale cleanupkey (legacy of corrupt, ook corrupte v3 onder `BATTERY_REPORT_KEY`) verwijdert uitsluitend die expliciete browserkey, doet nul centrale DELETE/PUT en behoudt ieder huidig/ander rapport en bestaande data. Dit moet ook gelden na mislukte centrale hydratie/GET. De huidige batterijrapport- en Energiepaspoortverwijderactie behoudt bestaande centrale cleanup, maar het label benoemt browser én Pi zodat reikwijdte zichtbaar is. Geen stilzwijgende destructieve fallback of nieuwe storageworkflow. Regressies gebruiken synthetische browser- en centrale states, controleren calls en bytes vóór/na; een mislukte lokale verwijdering behoudt veilige foutmelding en resultaat. Actuele browsergate blijft NOT RUN; code/tests zijn geen actuele visuele goedkeuring. Nieuwe finale checks/fingerprint zijn nodig voor deze reparatie.

Aanvullende profiel-/hydratebevindingen worden eerst read-only gereproduceerd voordat ze aan deze write set/acceptance worden toegevoegd.
Aanvullend gereproduceerd door Agent B: `removeItem`-throw bij profielverwijdering verbergt UI terwijl browserbytes blijven en toch één centrale DELETE wordt gestuurd. Ook kan een laat voltooide initiële GET na expliciet verwijderen het profiel terugzetten. Exacte aanvullende write set root: `apps/web/src/local-energy-profile.ts`, `apps/web/test/local-energy-profile.test.ts`; bestaande App.tsx/componenttestset blijft gelden. Acceptance: lokale verwijderhelper meldt succes/falen expliciet; bij falen geen UI-removal en geen centrale DELETE, het nog aanwezige huidige profiel blijft zichtbaar en veilige foutmelding verschijnt. Lokale verwijdering van twee keys is geen transactie: als legacy verwijderen slaagt en daarna v2 verwijderen faalt, kan legacy reeds verwijderd zijn; geen garantie dat alle lokale bytes onveranderd zijn. Initieel centrale hydratie bewaakt per resultaatsoort een mutatierevisie; een GET die begon vóór een expliciete save/delete mag die nieuwere gebruikersactie niet overschrijven. Zowel profiel als batterij hebben onafhankelijke revisies. Regressies bewijzen local-throw, late GET na delete en late GET na save zonder echte persoonsgegevens. Geen extra opslag, dependency of wijziging van succesvolle syncsemantiek.
Verwijdergrens verduidelijkt vóór implementatie: iedere expliciete keyparameter is uitsluitend lokale cleanup, inclusief corrupte v3 met huidige opslagkey. Alleen verwijderen van een geldig huidig rapport via `onForget(undefined)` mag centrale DELETE doen. Geldig profiel-/rapportlabel: "Verwijder uit browser en van Pi". Mutatierevisies verhogen uitsluitend na succesvolle expliciete lokale save/delete; een failure behoudt huidige state en wordt niet als geslaagde mutatie behandeld. Geen dependency-/schemawijziging.
Verwijder-/hydratiereparaties geïmplementeerd door root. Agent A las de definitieve vier source/testdiffs en herhaalde onafhankelijk de gerichte component-/profieltests: 30/30 PASS; typecheck PASS volgens root. Expliciete cleanupkeys (ook corrupte v3) doen geen Pi-delete; geldig huidig rapport via geen key behoudt centrale verwijdering. Per-kind revisies wijzigen uitsluitend na succesvolle lokale mutatie en verhinderen late initiële GET-overschrijving. Geen concrete codeblocker gevonden; nieuwe finale volledige checks/fingerprint en actuele browsergate blijven vereist. Nieuwe code niet uitgerold. Normatieve documenten nu bevroren voor de finale checkrun.
### Volgende sequentiële Task 061-stap — centrale mutatievolgorde

Agent B reproduceerde met de echte client/route/store: save gevolgd door remove, PUT 200 ms vertraagd, maximaal twee gelijktijdige mutaties, aankomst DELETE→PUT en centrale data blijft uiteindelijk aanwezig. Agent C reproduceerde daarnaast een oude PUT-failure die na geslaagde DELETE de melding overschrijft met lokaal-bewaardtekst terwijl data ontbreekt. Root blijft enige schrijver; exacte write set deze stap: `apps/web/src/App.tsx`, `apps/web/src/central-results-client.ts`, `apps/web/test/central-results-client.test.ts`, `apps/web/test/battery-flow-structure.test.ts`.

Acceptance: mutaties binnen dezelfde client lopen per resultaatsoort in aanroepvolgorde; profiel en batterij mogen onafhankelijk blijven werken. Save→delete mag geen herintroductie geven; delete→save bewaart de nieuwe snapshot. Een gefaalde mutatie blokkeert volgende mutaties niet. Iedere save valideert en bevriest een veilige JSON-snapshot bij aanroep, zodat latere inputmutatie een wachtende save niet verandert. Geen GET-queue: bestaande revisie bewaakt hydratie. Vier save/delete-catchmeldingen zijn gebonden aan de revisie van hun eigen gebruikersactie, zodat verouderde failures geen nieuwere status overschrijven. Regressies gebruiken deferred transport en echte synthetische route/storage voor volgorde, failures en snapshotisolatie. Geen schema, endpoint, dependency of provider-/toestemmingswijziging; geen claim van conflictresolutie tussen meerdere apparaten/clients.

Nieuwe finale tests/build/typecheck/fingerprint en onafhankelijke review vereist; browsergate blijft NOT RUN en volledige release CHANGES REQUIRED. Alleen root schrijft productiecode, geen tweede actieve taak.
Actuele afronding mutatievolgordestap — 2 oktober 2026: root implementeerde per-kind mutatiequeue met failurecontinuation en bij aanroep gevalideerde JSON-snapshot; alle vier save/delete-catches zijn revisiegebonden. Agent A las de vier source/testdiffs en herhaalde onafhankelijk de gerichte suites: 37/37 PASS, geen concrete blocker. Profiel/batterijqueue blijft onafhankelijk, GET ongewijzigd, geen multi-clientconflictclaim. Nieuwe definitieve fullchecks/fingerprint volgen. Normatieve docs nu bevroren; volledige release CHANGES REQUIRED/browser NOT RUN, nieuwe code niet op Pi uitgerold.