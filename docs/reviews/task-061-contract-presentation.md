# Task 061 — herstel contractpresentatie

6 oktober 2026. Root enige productiewriter. Beperkte implementatie-/zelfreview en echte browserhercontrole; **geen onafhankelijke APPROVED-review of volledige release-PASS**.

## Wijziging en bewijs

`apps/web/src/contract-csv.ts`: uitsluitend de expliciete overdracht van de vier jaarvolumes naar het formulier rondt af op zes decimalen (0,000001 kWh). Gecontroleerde CSV-totalen en handmatig ingevoerde volumes blijven ongewijzigd. Dit verwijdert optelruis zoals3503.9999999979086. Pure regressie controleert afgeronde waarden, behouden sub-kWhprecisie, bronimmutabiliteit en behoud overige invoer.

`apps/web/src/local-contract-catalog.ts`: fetch-/bodyleesfouten krijgen veilige Nederlandse verbinding-/herhaaltekst. Ook HTTP-fouten gebruiken dezelfde uitleg. Afgebroken requests behouden de originele abortfout; bestaande schema/omvangvalidatie blijft intact. Regressies controleren transportfailure, bodyfailure, geen technische foutdetails en abortidentiteit.

158/158 webtests PASS; gerichte7/7 PASS; webbuild en webtypecheck PASS; diffcheck PASS. Volledige eindharness volgt afzonderlijk. Zelfreview constateert geen dependency-, bronberekening-, opslag-, URL- of providerwijziging; afronding vindt pas na bestaande jaarkwaliteitsgates plaats. Dit is geen onafhankelijke reviewstatus.

Finale `pnpm harness check` op bevroren bron voltooid: harness-tests, structuurcheck, volledige workspacebuild/tests/typecheck allemaal exit0. `pnpm harness gate` blijft NOT APPROVED: actuele Agent A-review en volledige Agent C-PASS ontbreken. De codeherstellingen zijn lokaal en nog niet gecommit/gepusht; eerdere push74c524f bevat ze niet.

## Echte browserhercontrole

Gebruiker autoriseerde browsercontrole en vervolgwerk. Isolated localhost18121, geneste `/api/hassio_ingress/qa-20261006/`, eigen synthetische opslag zonder HA-/partnercredentials. Viewports1280×900 en375×812; viewport hersteld en tab gesloten. Gebouwde assets: JSapp-9dccbe0c19ac997d.js, CSSapp-63f7e5165a14c645.css.

| Scenario | Verwacht/werkelijk | Resultaat |
|---|---|---|
| Native jaar-CSV + expliciete overname, desktop | Formulier toont3504/7008/350.4/700.8, bronperiode en totalen blijven zichtbaar; postcode9000 behouden | PASS |
| Lokale bridge gestopt, mobiel | Aanbiedingenklik toont “De lokale tariefkaarten konden niet worden geladen. Controleer je verbinding en probeer opnieuw.”; geen Failed to fetch | PASS |
| Bridge herstart + retry, mobiel | Disabledloading/Tariefkaartenladen zichtbaar, daarna echte kaart; EnergyVisionvast1501,48EUR afname+fee, injectie/netto uitgesloten | PASS |

Screenshots buiten Git: `.harness/browser-20261006/repaired-values.jpg` en `repaired-error.jpg`. Eerder breder begrensd rapport: `.harness/browser-20261006/report.md`; het is bewijs van de eerdere assets, geen actuele volledige releaseattestatie. QA-wrapper registreert alleen method/path en vertraagt GETcatalogus1,5s; productiecode/brondata zijn daarbij niet aangepast.

## Resterende gates

Onafhankelijke review en volledige batterij-/opslagfailure-/legacy-/cancelreleasecases open. Huidige wijziging is beperkt browser-PASS voor bovenstaande drie scenario's, geen volledige Agent C-PASS. Geen tag/imagepublicatie of Home Assistant-update. Echte Pi-/LAN-/herstart-/rollback-/providerrechten blijven open. Geen attestaties geschreven.

## Aanvullende controle — 7 oktober 2026

Actuele volledige harness: alle vijf stappen exit0, stable=true; fingerprint e9d154a05e5cdc7fff0b540ecd92224b6454d19201a6bb2fdc7548b39c7970c9. 158 webtests en111 bridgetests PASS. Onafhankelijke begrensde review staat in task-061-current-independent-review-2026-10-06.md; deze verleent nog geen volledige releasegoedkeuring.

Browser op dezelfde synthetische geneste localhostomgeving en huidige9dcc-assets. Concrete starttoestanden en acties:

| Scenario | Start, actie, verwacht en werkelijk | Status |
|---|---|---|
| CSV annuleren/herselectie | Schoon contractformulier, postcode9000; QA-helper vertraagt echt File-streamlezen. Bij0% Annuleer CSV-controle klikken; geannuleerdmelding, postcode behouden. Daarna onvolledig bestand kiezen; jaarkwaliteitswaarschuwing, geen late oude succesvolle overname | PASS1280×900 |
| Technisch bewaren | Synthetisch volledig2025-jaar via Data, energiebalans bewaren, batterij simuleren. Voortgang17/99%, vijf capaciteiten correct0verschuiving bij gelijktijdige grotere afname dan injectie; expliciet technisch bewaren toont Batterijrapport bewaard | PASS1280×900 |
| Financieel blokkeren/bevestigen | Bovenstaande technisch resultaat; dynamisch contract kiezen en bevestigen geeft expliciete blokkade. Refresh behoudt technisch resultaat; vast contract, synthetische contract/offerte en bevestigde aannames leveren0besparing, vijf negatieve NPVs gelijk aan investering, geen positieve aanbeveling | PASS1280×900 |
| Financieel bewaren/refresh | Expliciet volledig rapport bewaren, refresh en Batterij openen. Volledig financieel snapshot intact: contractperiode2025-01-01 tot2026-12-03, tarieven37,3/6ct, investeringen3500/4500/5500/6500/8000EUR. Datum-fill van browsertool wijzigde niet betrouwbaar React-state; korte-contractperiodegate hiermee NIET bewezen | PASS voor save/refresh; periodegate NOT RUN |
| Verwijderfailure | Bestaand financieel resultaat, QA lokale removefailure plus centrale read503; verwijderen toont veilige failure en behoudt zichtbaar rapport. Profiledelete aanvankelijk niet gevonden; die failurecase NIET bewezen | PASS voor batterij; profiel NOT RUN |
| Legacyv1 | Fixturepagina meldt klaar vóór app openen; oudere technische kaart toont100kWh en kwaliteitswaarschuwing. Bewaar als nieuw technisch rapport, refresh en heropenen behoudt veilige technische waarden; geen financiële berekening. Nieuwe v3verwijderen laat expliciet oude kopie zien; ouder resultaat apart verwijderen geeft lokaal verwijderd, Pi niet gewijzigd | PASS1280×900 |
| Legacyv2 bewaarfailure | Expliciete v2fixture plus gesimuleerde localsetfailure. Migratieklikken toont Omzetten lukte niet, oude100kWh blijven zichtbaar | PASS1280×900 |
| Corrupt herstel | Expliciete corruptfixture; Batterij toont niet leesbaar en gegevens niet gewijzigd. Bewust lokaal verwijderen geeft lokaal verwijderd, Pi niet gewijzigd en CSV-start | PASS1280×900 |
| Lokale knop/filters/toetsenbord | Leeg contract, postcode9000 en3504/7008afname; Enter op Haal aanbiedingen op geeft disabledloading, daarna97kaarten. DATS24filter geeft0met lege uitleg; onbekendebtwkaarten hebben geen jaarprijs. Leverancier terug op alle toont Toon nog20contracten; klikken paginering vandaag nog NIET uitgevoerd | PASS genoemde acties1280×900; paginering NOT RUN |

Viewportbeperking: vandaag geeft de override375×812 geen daadwerkelijke resize: DOM meldt1280×900; nieuwe tab meldt1280×720. Daarom wordt bovenstaande NIET als mobiele PASS gepresenteerd. Historische beperkte375controle blijft apart bewijs, geen vervanging voor volledige actuele matrix. Geen extra screenshot aan de taak toegevoegd: het nieuwe bestand matrix-mobile.jpg blijkt desktop en is geen mobiel bewijs; oorspronkelijke twee screenshots blijven de enige aangewezen screenshots.

Volledige release blijft onvolledig: actuele volledige375matrix, dag-/capaciteits-/periodefilters, volledige profielsave/deletefailures, centrale write/corruptgevallen, privacy-/netwerkloganalyse en volledige Ingress/SSE/peercontrole moeten nog gebonden worden aan actueel bewijs. Geen AgentC-PASS of releaseattestaties vervaardigd. Home Assistant-doel via IAB én Chrome gaf ERR_BLOCKED_BY_CLIENT; geen beveiligingsinstellingen gewijzigd of blokkade omzeild. Geen HA-update/tag/image uitgevoerd. Dit is een concrete toegangsbokkade plus open releasebewijs, geen geslaagde uitrol.

## Finale lokale browsermatrix — 7 oktober 2026

Dit onderdeel actualiseert de eerdere onvolledige lokale matrix hierboven. Productiebron en huidige9dcc/63f7-assets ongewijzigd; actuele checksfingerprint e9d154a05e5cdc7fff0b540ecd92224b6454d19201a6bb2fdc7548b39c7970c9. Root voert de geautoriseerde QA-rol uit, daarna legt de productiewriter dit daadwerkelijke verslag vast. URL steeds http://localhost:18121/api/hassio_ingress/qa-20261006/ met gewone app of qa-app.html en expliciet genoemde QA-foutparameters. Chrome daadwerkelijk375×812 en1280×900 via DOM gemeten; de eerdere IAB-overridebeperking is hiermee opgelost.

| Scenario | Start, concrete actie, verwacht en werkelijk | Status |
|---|---|---|
| Mobiele navigatie/keyboard | Schoon Chromeprofiel op375×812, Overzicht→Contract→Data→Batterij→refresh. Rapport/Batterijvoorwaarden zichtbaar, Enter op aanbiedingen en daggrafiek werkt, actieveknop in DOM; documentbreedte360 bij viewport375, ook financieel snapshot zonder overflow | PASS |
| Aanbiedingen/paginering | Postcode9000, dag3504/nacht7008; Enter→disabledloading→97VLkaarten. Toon nog20 verhoogt artikels20naar40; EnergyVisionfilter toont vast1501,48EUR afname+fee, maandindex zonder jaarprijs. DATS24leeg en onbekende btw eerder hierboven getoetst op huidigeasset | PASS |
| Native CSV en explicit totals | Echte Chrome-filechooser year.csv, zichtbaar0%→gecontroleerd, waarden veranderen pas na Vul dag/nachtwaarden in;3504/7008/350.4/700.8 en postcode9000. Geen externe aanvraag | PASS375×812 |
| Cancel/herselect/navigatie | QA-slowfile→zichtbare annuleeractie→geannuleerd; dezelfde year.csv opnieuw native kiezen; direct Overzicht en Contract terug. Geen oude preview/resultaat na disposal. Ongeldig en incomplete geven veilige fout/kwaliteitsgate zoals eerder beschreven | PASS375×812 |
| Profielsave | Schoon Data volledigejaarhelper, Bewaar energiebalans→expliciete successtatus, huidige totalen. Alleen veilige resultaten opgeslagen; daarna batterijroute. Savefailure met bestaand kort profiel + volledigejaarvervanging behoudt kort profiel; unavailableopslag toont veilig niet bewaard | PASS375×812/1280×900 |
| Dag/capaciteit/detail | Volledig jaar, Volgende dag naar2025-01-02 en13kWh:28,8afname/2,88injectie,96/96,0laden/ontladen; herlezen resulteert in vier kwartiergrafieken. Eerste/laatste partiële dagen expliciet92/96en4/96, geen verzonnen nulpunt | PASS375×812 |
| Technisch/financieel save/refresh | Technisch bewaren succesvol. Financieel expliciet bevestigen met standaardsynthetische richtwaarden geeft0besparing, negatieve NPVs en geen aanbeveling. Volledig bewaren→refresh→financieel snapshot2025-01-01tot2026-01-03 intact op375. Op desktoplater nieuw volledig financieel snapshot tot2026-01-02 expliciet bewaard | PASS |
| Nieuw bestand erft niets | Na volledig financieel snapshot nieuw native gapped.csv (01-06-2025weggelaten) selecteren. Jaartotalen10483,2/1048,32; automatischecontractovername geblokkeerd, batterij toont4gaten en uitsluitend technisch scenario, geen geërfde financiële bevestiging. Zonder bewaren refresh→oude financiële kopie tot2026-01-02 terug. Eerder invalidselectie geeft veilige fout en bewaart bestaand profiel | PASS1280×900 |
| Periodefilter | Volledig jaar Van met native ArrowUp van2025-01-01naar01-02:365/365dagen,1partiële dag; uitsluitend capaciteitgrafiekselectie, volledige technischeperiode blijft. Volledigeperiodeknop herstelt366/366. Datefill van browsertool wijzigt niet betrouwbaar Reactstate; uitsluitend geobserveerde native toetsenacties tellen | PASS1280×900 |
| Lege dag | Gappedbron, Enter op Selecteer2025-05-31 en Volgende dag→2025-06-01: expliciet Geen brondata, KPI/grafieken leeg. Bewaard oorspronkelijk financieel resultaat wordt niet overschreven; refresh herstelt dit | PASS1280×900 |
| Opgeslagen dagdetail | Refresh financieel snapshot zonder bronbestand: dagtotalen aanwezig, expliciete Kies CSV voor dagdetail en geen opgeslagen kwartiergrafiek. Herinleesactie via Data/nieuwegappedbron apart uitgevoerd, oude opslag intact | PASS1280×900 |
| Lokale removefailure | Bestaand profiel+financieel, fault=remove&central=read: beide verwijderen geven veilige failure, profiel zichtbaar/rapport behouden, geen Pi-delete vóór lokale success | PASS375×812 |
| Centrale writefailure | central=write: batterijdelete geeft lokaal verwijderd maar Pi-failure; refresh centrale kopie terug. Kort profiel en technisch kort rapport expliciet bewaren geven lokaal bewaard maar synchronisatie mislukt | PASS375×812 |
| Lokale batterijsavefailure | Bestaand financieel rapport, fault=save&central=read, nieuw kort bestand→technisch bewaren: Opslaan lukte niet; tijdelijk resultaat zichtbaar. Refresh→origineel financieel2026-01-02 intact | PASS1280×900 |
| Centrale corrupt/onbereikbaar/leeg | central=corrupt retourneert invalidJSON200 via QA-wrapper, central=read503: veilige centrale niet leesbaar en lokale kopieën intact. Echte legecentrale fixture houdt legacy zichtbaar zoals vorige sectie | PASS |
| Lokale unavailable/legacy/corrupt | unavailable+readfailure crasht niet; saveprofiel veilig geweigerd, batterij toont opslag niet beschikbaar, niets gewijzigd. Legacyv1bewuste migratie en delete, v2savefailure, corrupte lokale cleanup met Pi-nietgewijzigd zijn hierboven uitgevoerd | PASS |
| Delete+refresh | Gewone app hydrateert geldige centrale financiële kopie. Batterijdelete→verwijderd; Dataprofieldelete verwijdert actiefprofiel. Refresh toont Nog niet bewaard, Rapport/Batterijdisabled, CSV-start. Geen synthetische resultaten komen terug | PASS375×812 |
| Privacy/netwerk | QA-log184events bij analyse: alleenGET/PUT/DELETE;0partnerPOST en0mutaties buiten api/results. PUT/DELETE uitsluitend expliciete save/delete of benoemde fixtureprepare, eigen tijdelijke QA-store. Eigen results.json gecheckt op keys: geen EAN/meterId/fileName/token/rawCsv/intervals, geen CSV-header of bronbestandsnamen; profiel+financieelrapport aanwezig. Geen appconsoleerrors; browserextensionwarnings apart, geen producterror | PASS |
| Geneste Ingress | Browser laadt document+gehashteCSS/JS+catalogus en actuele stream/spotprijs onder dezelfde prefix; log bevat3nestedassetrequests en22nestedSSE. Aanvullende directe HTTPmetadata: document200no-store, CSS/JS200immutable, catalogus/result200no-store, SSE200text/event-stream metdata; geen Access-Control-Allow-Origin op deze responses. Onafhankelijke productiestarttests10/10 bewijzen exactepeer403/no-wildcard en asset/cachegrenzen | PASS lokaal |

Lokale releasekandidaat-PASS voor bovenstaande volledige gebruikersreis; echte HA/Pi/LAN/herstart/rollback blijft post-releaseverificatie, geen lokale simulatie wordt echte HA-data genoemd. Het korte-contractdatum-fill-experiment hierboven blijft onbewezen en is geen PASS; periode-/financiële bronkwaliteitgates zijn daadwerkelijk via betrouwbare native acties/andere bronbestanden getoetst. Bij start van batterijrun verscheen kort de generieke kon-niet-afronden tekst vóór running/success; geen blijvende failure, transparant als bestaande presentatieverbetering gemeld.

Maximaal3aangewezen screenshots totaal: repaired-values.jpg, repaired-error.jpg en current-mobile.jpg onder .harness/browser-20261006/. Laatste toont echte375financiële snapshot met alleen synthetische richtwaarden. matrix-mobile.jpg blijft ongebruikt desktopbewijs.

Home Assistant is buiten de beperkte omgeving rechtstreeksHTTP200bereikbaar. Browsertoegang blijft clientblocked; geen bypass. HA-token ontbreekt in processomgeving; veilige interactieve invoer door gebruiker is nodig voor daadwerkelijke Supervisor-update. Geen token in rapport/opslag/logs. Finale onafhankelijke review en echte attestaties volgen op deze actuele matrix; eerdere NOTAPPROVED blijft historisch totdat dit beoordeeld is.

### Finale bewijsbinding

Na Git-normalisatie is de volledige harness opnieuw uitgevoerd op bevroren bytes: 2026-10-07T19:11:47.960Z tot19:12:22.488Z, alle5exit0stabletrue; fingerprint8f636e5a636d94dcef52219ffa98a8759b62e9a349d6ce6853ebe9b143268137. Distindex bevestigt exact dezelfde9dccJS/63f7CSS als bovenstaande echte browsermatrix. De lokale AgentC-kandidaatstatus is PASS op deze huidige bytes; externe HA/Pi/LAN/restart/rollbackclaims blijven afwezig. Onafhankelijke reviewer heeft finale matrix inhoudelijk voldoende beoordeeld, attestatie volgt op deze actuele checks.
