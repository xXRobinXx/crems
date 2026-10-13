# Task 061 — onafhankelijke kandidaatreview, 6 oktober 2026

## Lifecycle-hercontrole — 13 oktober 2026

**Begrensde CODE APPROVED voor de onderzochte CSV-navigatie-/datum-/indicatieherstellingen; volledige release CHANGES REQUIRED tot actueel volledig bewijs.** Agent A inspecteerde de huidige feitelijke App-effectwijziging: Data→Contract behoudt alleen een voltooide `csvPreview`; verlaten tijdens reading/finalizing disposet de controller en voorkomt late oude publicatie. Root-unmountcleanup blijft intact. De preview en bronherkomst blijven uitsluitend sessiestate; geen nieuwe opslag of providerrequest geïntroduceerd. Nieuwe selectie wist beschikbare oude bron maar niet bewust gekozen formulierinvoer. Eerdere datumgrenzen en indicatieherkomstfixes blijven aanwezig. Geen concrete resterende codeblocker gevonden in deze begrensde scope.

Onafhankelijk opnieuw uitgevoerd: dagvenster, profielvergelijking, batterijvergelijking, contract-CSV en lokale batterijopslag **39/39 PASS**; gerichte componentcases voor echte rootnavigatie-effecten/late oude read, indicatieherkomst na remount en streamcleanup/effectherstart **3/3 PASS**. Componentrun buiten beperkte sandbox met goedgekeurde escalatie; productiecode/tests niet door Agent A gewijzigd. Dit zijn actuele gedragsregressies, geen browser-PASS.

Gelezen checks.json van 11 oktober bevat alle vijf exitcodes 0 maar `stable:false`; het is dus geen geldig actueel stabiel fullharnessbewijs. Finale actuele volledige checks en browserrapport voor gewijzigde kandidaat vereist. Geen nieuwe releaseattestatie of browserbediening door Agent A. Eerdere approval-/CHANGES REQUIRED-secties hieronder blijven gedateerde geschiedenis; dit codeoordeel heft externe Pi-/LAN-/herstart-/rollbackgates niet op.

## Actuele herbeoordeling — 9 oktober 2026 — CHANGES REQUIRED

### Review indicatief CSV-scenario en sessiehergebruik — 9 oktober 2026

Onafhankelijke read-only review van de nieuwe `contractCsvIndication` en Contract-koppeling. De strikte jaartotalengate is ongewijzigd; een aparte expliciete scenarioactie annualiseert geregistreerde volumes met `365.2425 / meetdagen`, zonder ontbrekende kwartieren of seizoen te repareren. Minimaal 90 dagen, vier registerdekkingstreams en betrouwbare chronologie blijven vereist; geschatte punten/gaten/dubbels/overlap/overgeslagen rijen worden zichtbaar gemeld. Agent A herhaalde de zes contract-CSV-tests: **6/6 PASS**. Een beschikbare Data-preview kan in dezelfde sessie op Contract worden gebruikt zonder opnieuw lezen; geen automatische formulierovername of externe aanvraag.

Agent A vond twee P2-herkomstproblemen en een extra stale-selectiehoek. Root herstelde ze en Agent A inspecteerde de actuele code/regressies: indicatieherkomst staat nu naast de formulierinvoer in rootstate en blijft bij navigatie behouden; handmatige wijzigingen krijgen expliciet historische-herkomstuitleg, strikte overname wist de indicatiemarkering. `selectedTotals` wordt uitsluitend uit `selectedPreview` afgeleid. Daardoor verschijnt geen oude overnamebron bij een nieuwe error/incomplete/reading/cancel-preview; eerder bewust gekozen formulierwaarden blijven intact. Componentregressies behandelen remount en oude props bij nieuwe error en undefined preview. Geen concrete resterende fout gevonden in deze onderzochte herkomst-/selectiereparaties.

Root meldt volledige harness PASS op de vorige tussencandidate en een lopende definitieve herhaling na het weghalen van de laatste fallback. Agent A heeft die finale run nog niet als afgerond geverifieerd en claimt geen eigen componenttestrun voor de laatste versie. Voor deze nieuwe zichtbare scenarioactie en navigatieherkomst bestaat nog geen actuele browser-PASS. **Geen releaseAPPROVED of nieuwe attestatie**: finale checks/fingerprint en geautoriseerde actuele browserherhaling blijven vereist, evenals de hierboven open datum-/batterijcases. Geen productie-/normdocument- of browserwijziging door Agent A.

### Onafhankelijke review datumherstel — 9 oktober 2026

Code-oordeel: de onderzochte begindatumfout is gericht hersteld. `brusselsContractDay` valideert echte YYYY-MM-DD-kalenderdatums en levert Brusselse middernacht plus exclusieve volgende middernacht, inclusief 23-/25-uursdagen. De financiële formulieradapter normaliseert die grenzen vóór berekening en opslag naar ISO-instants en presenteert bewaarde ISO-grenzen als Belgische kalenderdatums; bestaande opslagvalidators blijven instants valideren. De profieladapter gebruikt voor de puntgebaseerde profiel-eindtijd nu `end.end - 1 ms`, zodat de eerste meting van de volgende kalenderdag niet wordt toegelaten. Dit verschilt terecht van de intervalgebaseerde batterijperiode met exclusief einde.

Agent A inspecteerde de feitelijke source-/testdiff en herhaalde onafhankelijk 23 gerichte dagvenster-/profiel-/batterijtests vóór de laatste eindrandcorrectie: PASS. Daarbij ontdekte Agent A dat exact volgende middernacht nog werd geaccepteerd; synthetische reproductie bevestigde dit. Root herstelde daarna die grens en voegde de exacte 00:00-regressie naast 00:15 toe. Agent A herinspecteerde deze wijziging en herhaalde de drie profieltests: **3/3 PASS**. Geen resterende concrete codefout gevonden in dit onderzochte datumherstel. Root rapporteert aanvullend ISO-financieel-bewaren/herladenregressie en webtypecheck PASS; Agent A claimt die runs niet als eigen uitvoering.

**Release blijft CHANGES REQUIRED.** Actuele volledige component-/workspacebuild/tests/harness zijn nog niet geslaagd na dit bronherstel: esbuild werd door de beperkte omgeving geblokkeerd; escalatie-fullharness werd wegens automatische approval-reviewgebruikslimiet niet uitgevoerd. Dat is een controlebeperking en geen test-PASS. Nieuwe browserherhaling van beide datumflows, bewaren/refresh en daadwerkelijke batterij-annulering ontbreekt. Oude browserassets/fingerprint/attestaties bewijzen deze gewijzigde bron niet. Geen nieuwe APPROVED- of PASS-attestatie geschreven; geen browser of productiecode door Agent A gewijzigd.

**P2 — geldige lokale contractdatum wordt onterecht afgewezen.** Bestand `apps/web/src/profile-contract-comparison.ts:4` zet datuminvoer hardcoded om naar UTC-middernacht en UTC-dageinde. De UI toont Belgische kalenderdatums en profieltimestamps zijn absolute instants. Daardoor begint een contract op dezelfde zichtbare Belgische begindatum één of twee uur later dan het profiel, zodat de dekkinggate de vergelijking blokkeert. Het UTC-dageinde kan aan de eindgrens bovendien tijd buiten de geselecteerde Belgische kalenderdag toelaten.

Onafhankelijk bevestigd met uitsluitend synthetische gegevens en de echte `compareLocalProfileContracts`-functie: profiel van `2025-03-24T23:00:00Z` tot `2025-03-25T22:45:00Z` (Belgische datum 25 maart), geldige vaste contracten met beide datums `2025-03-25` en synthetische tarieven leveren `undefined`. Alleen `validFrom` naar `2025-03-24` wijzigen levert wel winnaar `candidate`. Geen productiecode/tests gewijzigd om dit te reproduceren. Bestaande unitfixture begint op UTC-middernacht en mist deze lokale kalendergrens; eerdere groene tests en kandidaatreview sloten de fout niet uit.

Root rapporteert daarnaast daadwerkelijke live-Pi-browserafwijzing van geldige datuminvoer; Agent A heeft de browser niet zelfstandig bediend en gebruikt geen persoonlijke volumes of identifiers in dit rapport. De synthetische reproductie is onafhankelijk bewijs van de codefout. De aanvullende leveranciers-/filter-/save-/viewport-/DST-browsercases heffen deze specifieke FAIL niet op.

Herstelgrens: laat de webadapter invoerdatums consequent als begin/einde van de kalenderdag in `Europe/Brussels` interpreteren, met echte datumvalidatie en winter-/zomertijdgrenzen. Houd de core-dekkinggate strikt. Vereist: regressies voor exacte Belgische begin-/einddatums, winter en zomer/DST, ongeldige kalenderdatums en daadwerkelijk onvoldoende dekking, plus actuele browserherhaling van deze gebruikersreis en nieuwe finale checks/fingerprint na herstel.

Actuele bronfingerprint onafhankelijk bevestigd: `8f636e5a636d94dcef52219ffa98a8759b62e9a349d6ce6853ebe9b143268137`. **Actuele reviewstatus CHANGES REQUIRED** voor deze kandidaat; eerdere APPROVED hieronder blijft historische beoordeling van 7 oktober en geldt niet meer als huidige releasegoedkeuring. Agent A trekt de eigen actuele reviewattestatie in met deze status. Geen Pi-update, productie-/test-/TASKS- of browserwijziging door Agent A uitgevoerd.

### Aanvulling: dezelfde P2 blokkeert financiële batterijcontext

Onafhankelijke code-inspectie bevestigt dezelfde fout in `apps/web/src/App.tsx:224`/`:229` en `apps/web/src/battery-comparison.ts:63`/`:82`: de UI maakt Belgische YYYY-MM-DD-contractdatums, geeft deze ongeconverteerd door, en `Date.parse` behandelt ze als UTC-middernacht. Synthetische pure reproductie met betrouwbare jaarperiode `2024-12-31T23:00:00Z`–`2025-12-31T23:00:00Z`, nul kwaliteitsfouten, vijf geldige kandidaten en bevestigde vaste aannames: start `2025-01-01` geeft `technical`; alleen start `2024-12-31` geeft `financial`. De start-/eindkalendersemantiek moet dus voor beide contractflows consequent worden hersteld; opslag-/legacyvalidatie en snapshotperiodedekking verdienen regressiecontrole wanneer hun contractdatums dezelfde semantiek gebruiken. Geen nieuwe browser-PASS geclaimd voor deze batterijbevinding.

Bewijsgrens batterij-annulering: root meldt dat de live run al klaar was en een synthetische browserpoging tijdens processing time-outs kreeg. Geen actuele UI-annuleer-PASS; 17 bestaande controller-/CSVselecttests zijn aanvullend automatisch bewijs en vervangen die browseractie niet. Hercontrole van daadwerkelijk zichtbare batterij-annulering blijft open.

## Finale kandidaatgoedkeuring — 7 oktober 2026

**APPROVED voor de actuele lokale 0.1.15-publicatiekandidaat van Task 061.** Onafhankelijke Agent A heeft de volledige delta tegenover vastgelegde Pi0.1.14, relevante requirements/ADR's/write sets, code/test/tool/manifests, eigen gerichte validatie en het daadwerkelijke volledige actuele browserrapport inhoudelijk beoordeeld zoals hieronder vastgelegd. Geen concrete resterende blocker binnen deze kandidaat. Root-QA's actuele volledige matrix in `task-061-contract-presentation.md` vormt het zichtbare bewijs; Agent A claimt geen eigen browseruitvoering.

De bewijsbindingblocker hieronder is opgelost: nieuwe fullharness 7 oktober 2026 21:11:47–21:12:22 Brussels tijd geeft alle vijf checks exit0 en stable=true. Agent A las checks.json en berekende onafhankelijk dezelfde actuele fingerprint `8f636e5a636d94dcef52219ffa98a8759b62e9a349d6ce6853ebe9b143268137`. Gebouwde JS/CSS blijven `9dccbe0c19ac997d`/`63f7e5165a14c645`, gelijk aan daadwerkelijk geteste browserassets. Geen productiecode gewijzigd tijdens deze finale review. Eerdere CHANGES REQUIRED en beperkte CODE APPROVED-secties hieronder zijn historische stappen, vervangen voor deze lokale kandidaat door dit oordeel.

Agent A schrijft een echte actuele reviewattestatie met deze fingerprint en de SHA256 van dit volledige rapport. Dit oordeel staat kandidaatpublicatie na geslaagde complete harnessgate toe; het is geen bewijs van uitgevoerde imagepublicatie of installatie. Pi-update vereist nog nieuwe onveranderlijke ARM64-image, schone releasecheckout, geldige veilige HA-authenticatie, CREMS-backup/update en actuele doelversie/started/Ingresscontrole. Echte Pi-browser, fysieke LANroute, herstart/resultaatbehoud, rollback en hardwareprestaties blijven open externe verificaties. Geen partnerrechten, liveproviderresponse of afgeronde volledige Astra-securityaudit geclaimd.

## Actualisering — 7 oktober 2026

### Beoordeling finale browsermatrix

Agent A heeft de sectie “Finale lokale browsermatrix — 7 oktober 2026” in `task-061-contract-presentation.md` inhoudelijk getoetst aan playbook en de bovenstaande volledige kandidaatmatrix. Het verslag dekt actuele schone en opgeslagen toestand, werkelijk DOM-gecontroleerde 375/1280-viewports, keyboard/loading/leeg/fout, native CSV-overname/cancel/herselect/disposal, nieuwe gappedbron na financieel snapshot zonder geërfde bevestiging of overwrite, technisch/financieel save-refresh, dag/capaciteit/periode/lege dag/herinlezen, beide succesvolle deletes met refresh, centrale/lokale save/remove/corrupt/legacy/unavailablestates, privacy/netwerk en geneste assets/API/SSE. Dit is daadwerkelijk door root in geautoriseerde QA-rol uitgevoerd en gerapporteerd; Agent A heeft de browser niet zelfstandig overgenomen. Geen inhoudelijke resterende kandidaatcode-/browserblocker gevonden op deze gerapporteerde dekking. Het niet betrouwbaar uitgevoerde korte-contractdatumexperiment blijft expliciet NOT RUN; geen eis is daarmee stilzwijgend als PASS geclaimd. Automatische periodegate-regressies en werkelijk uitgevoerde bronkwaliteitcases vullen dit aan.

Bij finale controle blijkt echter een **actuele bewijsbindingblocker**: HEAD is nu `7abc23b`, bron-/testwijzigingen gecommit, en onafhankelijk berekende huidige fingerprint is `8f636e5a636d94dcef52219ffa98a8759b62e9a349d6ce6853ebe9b143268137`, terwijl checks.json nog `e9d154a05e5cdc7fff0b540ecd92224b6454d19201a6bb2fdc7548b39c7970c9` bevat. Sourcehashes van beide presentatiebestanden blijven exact gelijk; gebouwde index bevestigt dezelfde `app-9dccbe0c19ac997d.js`/`app-63f7e5165a14c645.css` als browserrapport. Oorzaak van het fingerprintverschil niet geclaimd; huidige volledige checks moeten opnieuw stabiel worden vastgelegd vóór attestatie. Geen reviewattestatie op de verouderde hash geschreven.

### Uitgebreide kandidaatinventaris tegenover Pi 0.1.14

Voorbereiding volledige publicatiekandidaatreview: feitelijke delta versus `b8c2b14` (vastgelegde Pi0.1.14-baseline) opnieuw geïnventariseerd, inclusief alle gewijzigde productie-/tool-/manifestbestanden. De productieverschillen bestaan uit lokale catalogus/corevalidator/berekening/importsnapshot, catalogusroutekoppeling, contractcomponent en inline CSV-controller, de Data-bestandsselectionhandler (`if (!file) return`, leegmaken native input voor herselectie, zichtbaar importscherm), CSV-formulierafronding en Nederlandse catalogusfouttekst, catalogusstyles en core-subpathexport. Geen opslag-/batterijberekenings-/providerprotocolwijziging ten opzichte van die baseline. `supplier-catalog-data.ts` bevat de gebundelde publieke feiten; geen onafhankelijke controle van elk afzonderlijk PDF geclaimd.

Verder onderzocht: harness-taakdeduplicatie/fingerprintuitbreiding, structuurchecker en synthetische regressies, geankerde gitignore, packagechecks, verwijderde niet-bestaande vite-configinclude, router-/documentorganisatie en gespiegelde 0.1.15-manifesten/versieassertion. Dependency-/lockfile, Dockerfile, launcher, workflow en releasehelper zijn tegenover deze baseline niet gewijzigd. Doelgedrag, scopes en documentatie blijven consistent; geen concrete aanvullende codeblocker gevonden.

Onafhankelijke aanvullende validatie 7 oktober: `node --test tools/harness.test.mjs tools/check-structure.test.mjs` **13/13 PASS**; `node tools/check-structure.mjs` **PASS**; gebouwde bridge `node --import tsx --test test/production-start.test.ts` **10/10 PASS**. De laatste suite bewijst echte geneste HTTP-assets/cacheheaders, weigering van andere socketpeers vóór assets/opslag zonder wildcard-CORS, veilige startup en singleflight-meterherstel, plus manifest/ARM64-synchronisatie. Geen persoonlijke runtimegegevens of HA-configuratie gebruikt.

Root heeft inmiddels een werkelijk 375×812 Chrome-viewport met DOM375/scrollWidth360 vastgesteld; dat corrigeert de eerdere mislukte overridepoging, maar bewijst uitsluitend de werkelijk uitgevoerde huidige scenario's. Gemeld aanvullend: contract-native CSV/totalen, Enter/loading/pager/filter, profielbewaring, batterij/dag/capaciteit/kwartiergrafiek, technisch/financieel save-refresh en verwijderfailure bij centrale 503. Agent A wacht op een traceerbaar volledig actueel browserrapport voordat publicatiekandidaat-APPROVED kan worden vastgesteld.

Concreet nog in dat rapport aantonen of als NOT RUN markeren: nieuwe invalid/incomplete/geldige selectie ná bewaard technisch/financieel resultaat (geen geërfde financiële bevestiging of automatische overwrite), succesvolle profiel- én rapportdelete gevolgd door refresh, relevante centrale lege/corrupte/onbereikbare fallback en savefailure, privacy/netwerk GET-only vóór expliciete save/delete en nul partnerPOST, actuele console/bronkwaliteitsstates en geneste document/asset/API/SSE-keten. De volledige matrix onderaan blijft de toetsingsbasis; het schrijven van een rapport mag ontbrekende acties niet omzetten in PASS. Geen attestatie tijdens deze voorbereidingsreview.

**Begrensde CODE APPROVED blijft geldig; volledige release blijft CHANGES REQUIRED.** Onafhankelijke herinspectie van git-status, feitelijke source-/testdiff en beide bovenstaande source-SHA256's bevestigt dezelfde onderzochte code en regressies. Geen aanvullende productiecodewijziging in de huidige werkboom sinds deze review. `git diff --check` opnieuw PASS; CSV-/webcatalogusregressies onafhankelijk opnieuw uitgevoerd: **7/7 PASS**. De eerste fingerprintopvraag gebruikte abusievelijk de webwerkmap en vond tools/harness.mjs daardoor niet; vervolgens gecorrigeerd naar repositoryroot, zonder bestanden te wijzigen.

Het gelezen actuele machinebewijs `.harness/checks.json` meldt 7 oktober 2026 20:38:51–20:39:24 Brussels tijd: harness-tests, structuurcheck, volledige build, tests en typecheck alle exitcode 0; `stable: true`; fingerprint `e9d154a05e5cdc7fff0b540ecd92224b6454d19201a6bb2fdc7548b39c7970c9`. Agent A verifieert dit opgeslagen machinebewijs en de actuele fingerprint; de volledige harnessrun is door root uitgevoerd, niet door Agent A herhaald. De 51 onafhankelijke gerichte tests van 6 oktober blijven aanvullend bewijs voor dezelfde bron.

Root rapporteert aanvullend werkelijk uitgevoerde browsercases: trage CSV annuleren, financieel bewaren/refresh, verwijderfailure, v1-legacymigratie/verwijderen, v2-bewaarfailure en corrupte herstelstate. Agent A heeft deze browseracties niet zelf uitgevoerd; het scenariorapport met URL/starttoestand/acties/verwacht-werkelijk moet die claims traceerbaar vastleggen. Root meldt bovendien dat een gevraagde 375px override vandaag werkelijk 1280px oplevert. Dat is **geen actuele mobiele PASS**: de werkelijke viewport is leidend. De overige open matrixrijen en echte Pi-/LAN-/herstart-/rollbackgrenzen hieronder blijven gelden totdat hun actuele bewijs bestaat.

Geen release-/browserattestatie, tag/image, push of Home Assistant-update door Agent A uitgevoerd. De bredere release mag niet op basis van deze begrensde codeapproval worden vrijgegeven.

Agent A, onafhankelijk van de productiewriter. **CODE APPROVED voor de begrensde contractcatalogus-/knop-/CSV-presentatiescope; volledige release blijft CHANGES REQUIRED totdat actuele volledige Agent C-PASS en finale fingerprintchecks bestaan.** Geen productiecode, tests, browser, persoonlijke runtimeopslag, secrets of attestaties gewijzigd/gebruikt. Dit rapport vervangt de onderbroken volledige Astra-audit niet.

## Onderzochte kandidaat en grenzen

Vertrekpunt commit `74c524f`; werkboom bevat vervolgens afronding in `apps/web/src/contract-csv.ts`, veilige fouttekst in `apps/web/src/local-contract-catalog.ts`, hun regressies en bijbehorende taak-/bewijsdocumentatie. Source SHA256 tijdens review: contract-csv `4273fc58da83b16c5f27f8316332a6f9e86603a9137e95e772fc674670fd12be`; local-contract-catalog `1bc28a19cfb53cafeb8457a0747d37325b8f489ca7c8666b775e32c4257c3783`.

Gelezen: workflow/repositorykaart, Agent A/C en playbook, requirements/architectuur, actuele Task061-scope/openlijst, PLAN, relevante REVIEW-/PRODUCT_AUDIT-baseline, harness- en releaseprocedure; contractcatalogus/corevalidator/berekening, bridgehandler en serverroutevolgorde, importadapter, webloader/component, contractscherm-/CSV-controllerkoppeling en betrokken tests. Niet uitgevoerd: volledige regel-voor-regel audit van alle bestaande modules, actuele volledige root-harness, onafhankelijke verificatie van ieder bron-PDF of ieder van de 207 communitykaarten, live partner-/Pi-/LAN-/rollbackcontrole. Historische rapporten zijn geen actuele runtimewaarheid.

## Bevindingen en acceptancebewijs

Geen concrete codeblocker gevonden in deze scope.

- CSV-overname rondt alleen de vier expliciet overgenomen formuliervolumes af op zes decimalen; bronkwaliteitsgates, oorspronkelijke totalen, postcode en overige formulierdata blijven intact. Tests bewijzen optelruisverwijdering, sub-kWhprecisie en immutabiliteit.
- Transport-, HTTP- en bodyleesfouten geven veilige Nederlandse verbinding-/herhaaltekst. Abort van de caller behoudt de oorspronkelijke fout. Schema-/omvangvalidatie blijft behouden.
- Aanbiedingenknop gebruikt publieke relatieve GET zonder verbruiksbody of partnerPOST. Invoergates, loading, retry en unmountabort bestaan. Partneraanvraag blijft apart en expliciet bevestigd.
- Bronmaand, communitystatus, digest en prijsbasis blijven zichtbaar; historische, onbekende btw-, dynamische-/tijdvak-/indexkaarten leveren geen verzonnen jaarbedrag. Variabele prijs is expliciet scenario; injectie/netkosten/heffingen zijn uitgesloten van het afname-plus-feebedrag.
- Catalogusroute staat achter de algemene exacte Ingress-peercheck, kent geen persoonlijke opslag/upstreamfetch en weigert query/andere methoden. Dit is code-inspectie; actuele productiepeer-/CORS- en geneste browserbewijzen blijven aparte gates.

## Onafhankelijk opnieuw uitgevoerde validatie

| Commando | Bewijs |
|---|---|
| `node --test test/contract-csv.test.ts test/local-contract-catalog.test.ts test/battery-flow-structure.test.ts` in apps/web | 40/40 PASS |
| `node --test test/local-contract-catalog.test.ts` in packages/core | 6/6 PASS |
| `node --import tsx --test test/local-contract-catalog.test.ts` in apps/bridge | 1/1 PASS |
| `node --test tools/import-supplier-catalog.test.mjs` | 4/4 PASS |
| `git diff --check` | PASS |

Eerste beperkte sandboxrun kon esbuild-App.tsx niet lezen en bridge-tsx faalde vóór assertions met `uv_os_get_passwd ENOMEM`. Exact dezelfde ongewijzigde suites buiten die omgeving slaagden. Geen productfailure verborgen of test verwijderd. Deze gerichte herhaling vervangt finale fullharness niet.

## Vereiste actuele browsermatrix

Iedere rij: URL en exacte viewport, starttoestand, concrete acties, verwacht/werkelijk en PASS/FAIL. Minimaal 375×812 en 1280×900; schoon synthetisch profiel plus relevante bestaande synthetische opslag. Maximaal drie privacyveilige screenshots. Contractcases moeten huidige gebouwde assets gebruiken; oud rapport en slechts drie presentatieherhalingen zijn onvoldoende.

| Onderdeel | Verplicht scenario en criterium |
|---|---|
| Navigatie/keyboard | Overzicht, Data, Contract, Rapport/Batterijvoorwaarden; Tab/Enter met zichtbare focus, geen overflow op mobiel; refresh herstelt geldige state |
| Lokale aanbiedingen | Ongeldige postcode/volumes blokkeren; geldige invoer → disabled loading → actuele kaarten/componentbedragen; filters regio/leverancier/tarief en meer kaarten; ontbrekende leverancier, historische/future kaart, dynamisch en onbekende btw tonen geen jaarprijs |
| Catalogusuitval | Transport-/HTTP-/ongeldige response geeft veilige fout; retry herstelt; weg-/terugnavigatie toont geen laat oud resultaat |
| CSV | Echte native selectie; volledig jaar blijft op Contract en vult pas expliciet vier afgeronde waarden; postcode behouden; incomplete/geschatte/foute input blokkeert overname; trage lezing daadwerkelijk annuleren, zelfde bestand herselecteren; weg-/terugnavigatie ruimt stream op |
| Energiepaspoort | Expliciet bewaren, centrale synchronisatiestatus, refresh/heropenen en expliciet verwijderen; nieuw contract-CSV/fout wijzigt bestaand resultaat niet |
| Batterij | Geldig en onvolledig bronbestand; technische simulatie en financieel geblokkeerd waar vereist; bevestigde geldige financiële aannames, expliciet technisch/financieel bewaren, refresh/heropenen en verwijderen; nieuw bestand erft geen oude kwaliteits-/financiële bevestiging |
| Dagrapport/periode | Dag/capaciteitsfilter, tijdgrafiek/KPI, lege dag, herinleesactie en periodefilter; bestaand financieel snapshot blijft behouden |
| Opslagfouten/legacy | Lege/onbereikbare/corrupte centrale opslag behoudt lokale resultaten; bewaar-/verwijderfailure toont veilige status en behoudt resultaat; bestaande legacy/corrupte browserstate toont herstel zonder stilzwijgende Pi-delete; legacymigratie expliciet |
| Privacy/netwerk | Voor expliciete bewaaractie uitsluitend toegestane GET; nul partnerPOST; CSV/identifier/bestandsnaam/secret ontbreken in opslag, screenshots en fouttekst; expliciete save/delete raakt alleen synthetische QA-store |
| Geneste Ingress | Document, CSS/JS, live SSE en catalogus/andere API laden onder dezelfde geneste prefix; refresh, cache/no-store en console/netwerkfouten vastleggen. Lokale synthetische bron expliciet onderscheiden van echte Pi-bron |

Na bovenstaande actuele kandidaat-PASS en finale checks kan echte Agent A-review de releaseattestatie beoordelen. Daarna vereist de releaseprocedure schone main, consistente nieuwe versie, onveranderlijke tag/ARM64-image, CREMS-updatebackup en doelversie/started. Actuele Pi-gebruikersreis, directe fysieke LAN-route, resultaatbehoud na herstart en rollbackuitvoerbaarheid blijven afzonderlijk te bewijzen; een lokale PASS sluit ze niet. Live partnerrechten/credentials zijn geen vereiste voor de credentialvrije lokale knop en blijven apart open.
