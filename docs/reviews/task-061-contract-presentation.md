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
