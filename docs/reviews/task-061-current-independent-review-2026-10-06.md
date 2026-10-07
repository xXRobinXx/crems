# Task 061 — onafhankelijke kandidaatreview, 6 oktober 2026

## Actualisering — 7 oktober 2026

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
