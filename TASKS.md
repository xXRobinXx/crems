# Tasks

## Current Task

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

### Previously approved task 028

### Task 028 — Echte Fluvius-mapping en privacyveilige kwartierpreview

**Status:** APPROVED

Gebruik de lokaal aangeleverde Fluvius-export uitsluitend als bewijs voor dit exacte schema: `Van (datum);Van (tijdstip);Tot (datum);Tot (tijdstip);EAN-code;Meter;Metertype;Register;Volume;Eenheid;Validatiestatus;Omschrijving`. Bewezen waarden zijn vier registers (`Afname Dag`, `Afname Nacht`, `Injectie Dag`, `Injectie Nacht`), `kWh`, komma-decimalen en statussen `Uitgelezen`, `Geschat`, `Geen verbruik`. Maak eerst een kleine volledig synthetische/saniteerde fixture met dezelfde headers en representatieve formaten; kopieer geen echte EAN, meter-ID, omschrijving, bestandsnaam of meetwaarden naar de repository.

Voeg daarna een pure mapper toe die de bestaande CSV-parseroutput omzet naar kwartierintervallen met canonieke timestamps, `direction: import|export`, `register: day|night`, `energyKwh` en `quality: measured|estimated|noConsumption`. Valideer exacte vereiste headers, lokale `dd-MM-yyyy` datum/tijd in `Europe/Brussels`, start < end, exact 15 minuten, eindige niet-negatieve komma-decimale waarde, exact `kWh`, register en status. Gebruik half-open intervallen, behoud 23/25-uursdagen en onderscheid het dubbele winteruur deterministisch op absolute timestamp; verzin geen ontbrekende intervallen en map ontbrekend nooit naar nul. Schema-/unitambiguïteit blokkeert de import; slechte datarijen worden veilig overgeslagen met vaste redenaantallen en veilige 1-based rijnummers.

Breid de lokale browserpreview uit met periode, geldige/overgeslagen aantallen, redenen, gemeten/geschat/geen-verbruik aantallen, gaten/duplicaten/overlap en afzonderlijke afname-/injectietotalen. Toon maximaal eerste en laatste veilige intervalvelden (datum/tijd, richting, volume, kwaliteit), nooit identificatievelden of ruwe rijen. Vermeld vóór en na selectie: `Lokaal verwerkt · niet geüpload` en `Nog niet opgeslagen of geïmporteerd`.

**Privacygrens:** uitsluitend browser-File-API; nul fetch/bridge/network/storage/analytics/logging. EAN, meter-ID, omschrijving, bestandsnaam en volledige ruwe inhoud komen niet in previewmodel, fouten, console, testsnapshots of fixture. Selectie-/unmountcleanup wist inhoud en een volgende selectie kan geen vorige preview laten terugkeren.

**Non-goals:** geen persistente import, database, bridge-upload, kostenberekening, contractadvies, automatische correctie, resampling of dependency.

**Acceptance:** tests bewijzen exact bewezen headers/delimiter/decimal/status/registermapping; ontbrekende/extra/dubbele headers; invalid datum/tijd/waarde/unit/register/status; start/end en 15 minuten; 23/25-uursdagen en dubbel winteruur; sortering, duplicate/gap/overlap; quality/totals zonder estimated als measured te labelen; veilige redenaantallen/rijnummers; diep bevroren input. UI/controller-tests bewijzen 10 MiB-grens vóór `text()`, stale resolve/reject, nul netwerk/opslag/logging, allowlisted previewvelden, cleanup en dat geen echte identifiers/rijen uitlekken. Exacte validatie: `pnpm build`, daarna `pnpm test`, daarna `pnpm typecheck`.

### Previously approved task 027

### Task 027 — Echte dagprijs in de bestaande grafiek

**Status:** APPROVED

Koppel `GET /api/history/price?day=...` raceveilig aan dezelfde Gisteren/Vandaag/Morgen-selector. Render uitsluitend ontvangen echte `priceCtKwh` als gele hourly step-reeks met een eigen rechteras en zichtbare nullijn; behoud negatieve en nulprijzen. Gisteren laadt eenmaal, Vandaag en Morgen controleren alleen wanneer zichtbaar maximaal elke 10 minuten opnieuw. Een dagwissel wist onmiddellijk de oude prijsreeks, abort de vorige request en negeert stale resolve/reject. Prijsloading/-fout beïnvloedt de vermogensstate niet. Morgen mag echte prijs tonen terwijl vermogen expliciet toekomst/leeg blijft; `notPublished` toont “Nog niet gepubliceerd” en nooit €0 of een lijn.

Kop, legenda en SVG-aria-label noemen prijsdata, Home Assistant en geselecteerde datum. Teken niet vóór het eerste of na het laatste prijspunt en interpoleer niet lineair. Op 320 px blijven selector, beide assen en legenda leesbaar; bij Morgen verbergt de plot iedere vermogenslijn/-as die toekomstverbruik kan suggereren. Label de reeks “Energieprijs”, niet “jouw tarief” of totale kost.

**Non-goals:** geen contract/netkosten/heffingen, advies, voorspelling, fallbackdata, powerendpointwijziging, opslag of dependency.

**Acceptance:** pure controller-/schaaltests bewijzen veilige responsevalidatie, exact endpoint/day, polling/visibility, abort/stale, onafhankelijke power- en prijsstates, notPublished/error/empty, nul/negatief, step-pad en eindpuntstop. Structurele UI-tests bewijzen morgen price-only zonder power-SVG-data, dynamische labels/aria, rechteras `ct/kWh`, 320px-layout en afwezigheid van demo/random/contractclaims.

**Validatie:** vanaf root exact `pnpm build`, daarna `pnpm test`, daarna `pnpm typecheck`.

### Previously approved task 026

### Task 026 — Veilig endpoint voor echte dagprijzen

**Status:** APPROVED

Bouw één read-only `GET /api/history/price`-route met exact één `day=yesterday|today|tomorrow`. De bridge berekent het bijbehorende Europe/Brussels-kalenderdagvenster met een geïnjecteerde klok. Gisteren en vandaag laden de history van exact één geconfigureerde huidige-prijssensor en normaliseren die via Task 025 met de door Home Assistant bewezen unit. Morgen leest uitsluitend de echte `raw_tomorrow`-items van exact één expliciet geconfigureerde morgenprijssensor, gebruikt iedere absolute `start`-timestamp en normaliseert dezelfde veilige puntvorm; ontbrekend/leeg `raw_tomorrow` retourneert een vaste `notPublished`-kwaliteit met lege punten, nooit nullen of extrapolatie.

De publieke response bevat uitsluitend `day`, canonieke `start`/`end`, `quality: measured|incomplete|notPublished` en `{timestamp,priceCtKwh}`-punten. Valideer GET, unieke day-query, bronconfiguratie, unit, timestamps, venster/DST en upstreamvorm vóór output. Fouten hebben vaste Nederlandse code/message en lekken geen token, URL, entity-ID, unit, attributen, ruwe body of timestamps. Gisteren/vandaag mogen geen toekomstige history-call doen; morgen doet geen power- of price-history-call. Null/negatieve prijzen blijven geldig en beide bronpaden sorteren/dedupliceren op absolute timestamp.

**Non-goals:** geen React/UI/SVG, polling, cache, interpolatie, uurvulling, contractprijsclaim, netkosten/heffingen, opslag of nieuwe dependency.

**Acceptance:** tests bewijzen 23/25-uursdagen, vandaag tot server-now, morgenprice-only, echte `raw_tomorrow`, twee terugdraaiuren met verschillende offsets, lege/ontbrekende morgenpublicatie, nul/negatief, unitafwijzing, invalid/duplicate/outside filtering, 405, queryfouten, 401/500/netwerkfout, nul loadercalls bij reject, één klok-snapshot per request, exacte veilige responsevelden en geen secretlek. Stubs worden altijd opgeruimd.

**Validatie:** vanaf root exact `pnpm build`, daarna `pnpm test`, daarna `pnpm typecheck`.

### Previously approved task 025

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
