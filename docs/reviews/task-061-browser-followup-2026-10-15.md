# Task 061 — vervolg lokale historie-QA, 15 oktober 2026

Root hervat de expliciet geautoriseerde lokale browser-QA. Geen productiecode of productietest gewijzigd, geen subagent, geen externe publicatie/Pi-mutatie. QA-fixtures uitsluitend onder genegeerde `.harness/` en `apps/web/dist/`. De vorige [gedeeltelijke QA](task-061-browser-qa-2026-10-15.md) blijft bewijs voor desktop/mobiel, toetsenbord, deadline, CSV en lokaal rapportbehoud.

De eerdere lokale ERR_NO_BUFFER_SPACE is na herstart van de tijdelijke server niet teruggekomen tijdens deze vervolgcontrole. Dit bewijst herstel van de lokale testtoegang, geen algemene diagnose of productiefix.

## Testopstelling

Codex in-app browser. H = http://127.0.0.1:18123/; extra E = http://127.0.0.1:18124/. Controlpanelen op `/qa` bieden uitsluitend synthetische scenarioselectie en requestlog. Productiekandidaat ongewijzigd t.o.v. checksfingerprint `342a7f87c3a104b9dd8677388314acf64338ab3cb0027272282c586aafbcc383`. Alle Home Assistant/measured-velden zijn synthetisch nagebootst; geen echte metingen of providerdata.

Vervolgscenario's op desktop 1280 × 720; mobiele foutstate aanvullend op 375 × 812, met DOM-bevestiging van breedte/hoogte en afwezigheid van horizontale overloop. Viewporttoepassing is asynchroon; alleen screenshot na bevestigde DOM-afmetingen telt als mobiel bewijs.

## Aanvullend browserbewijs

| Scenario / start / actie | Verwacht en werkelijk | Status |
|---|---|---|
| Leeg; E; mode empty, nieuwe apppagina | Expliciete melding dat Home Assistant geen meetpunten heeft; geen verzonnen grafiek of retry bij succesvolle lege respons | PASS |
| Dagwissel tijdens verzoek; E; mode delay, gisteren en direct vandaag | Beide oude aanvragen afgebroken; alleen juiste vandaag-grafiek na de vertraagde respons | PASS voor clientgedrag |
| Clientoverlap; E `/qa-history-trace.html`; dezelfde snelle dagwissels | Zichtbare synthetische fetchtrace toont abort vóór volgende start: 11:41:00.845Z abort, .846Z start; 11:41:01.173Z abort en daarna start; maximum clientactief 1, eindactief 0 | PASS |
| Vandaag-refreshfout; E; mode refresh-error, vandaag kiezen | Succes om 11:38:00.800Z, fout bij refresh 11:38:30.805Z; juiste vandaag-grafiek blijft met expliciete waarschuwing dat laatste verversing niet lukte | PASS |
| Late succesrespons over Brusselsmiddernacht; E `/qa-midnight.html`; mode midnight | Klok en synthetische meter starten 15 oktober 23:59:58 en lopen tienmaal versneld; eerste response vijf echte seconden vertraagd. Eerste venster start 14 okt 22:00Z, late response sluit 11:40:13.876Z; direct tweede request 11:40:13.883Z start 15 okt 22:00Z. UI toont vandaag 16 oktober en uitsluitend nieuwe daggrafiek | PASS binnen expliciete kloksimulatie |
| Pagina sluiten tijdens hangend verzoek; E; mode hang, app openen en tab sluiten | Verzoek 11:40:24.857Z gesloten 11:40:24.999Z; controlpaneel later nog één request en nul actief, geen refresh na verlaten pagina | PASS voor pagina-exit; afzonderlijke React-unmount uitsluitend automatisch getest |
| Maximaal drie automatische retries; H; blijvende fout | Eerste cyclus: 11:36:54.412Z initieel, retries 11:37:24.434Z / 11:37:54.432Z / 11:38:24.428Z; om circa 11:39:02Z nog vier aanvragen. Tweede cyclus bevestigt 11:39:41.732Z + 11:40:11.742Z / 11:40:41.743Z / 11:41:11.742Z | PASS voor drie retries en stoppen in eerste cyclus |
| Handmatige budgetreset na uitputting; H; tweede cyclus | Om 11:42:13Z nog slechts vier aanvragen, dus meer dan 60 s na derde retry geen extra aanvraag. Klik retry start request vijf om 11:42:13.747Z; nieuwe automatische retry zes om 11:42:43.769Z (30,022 s), hetzelfde gisterenvenster; maximum actief 1 | PASS |

Een eerdere servermeting bij dagwissel telde gedurende circa 5 ms twee nog niet gesloten transportsockets. Daarom is die servercounter niet als bewijs voor clientoverlap gebruikt. De aanvullende zichtbare clienttrace hierboven onderscheidt het synchrone AbortSignal van latere transport-close en bevestigt maximaal één niet-afgebroken clientaanvraag. Geen productieaanpassing op basis van die transportcounter.

De eerste klokfixture gebruikte aanvankelijk echte metertimestamps bij een gesimuleerde klok; de freshnesscheck wees die terecht af. Dat is fixture-incompatibiliteit, geen productfout. De definitieve fixture laat meter- en browserklok gelijk lopen en produceert ook voor korte vensters geldige punten. Alleen de definitieve succesvolle klokrun hierboven telt.

Ruwe synthetische browserlogs: `.harness/task061-delay-browser.txt`, `task061-client-abort-browser.txt`, `task061-refresh-browser.txt`, `task061-midnight-browser.txt`, `task061-cleanup-browser.txt`, `task061-budget-browser.txt` en `task061-budget-second-browser.txt`. Dit zijn DOM-observaties van de zichtbare QA-controls, geen onzichtbaar gelezen applicatiestatus.

Budgetresetbewijs: `.harness/task061-reset-final-browser.txt`. De eerdere eerste resetcontrole werd vóór de eerste retry door dagselectie beëindigd en is daarvoor geen bewijs; alleen de volledige tweede resetcontrole hierboven telt. Mobiele fout-screenshot op het bestaande pad `task061-mobile-error.jpg` vernieuwd met synthetische vandaag-fout op bevestigde 375 px. De twee eerdere rapport-screenshots blijven behouden: totaal drie screenshotpaden voor de taak.

Alle aanvullende lokale historiescenario's hierboven zijn PASS binnen de beschreven synthetische grenzen. Afzonderlijke React-disposecallbacks en alle mogelijke stale callbackvarianten blijven aan de gerichte automatische tests ontleend; pagina-exit is geen kunstmatige React-unmounttest.

## Resterende releasegrens

Dit aanvullende historybewijs is geen volledige Agent C-attestatie voor de gehele productreis. Echte centrale opslag-/legacy-/verwijderflows, geauthenticeerde Ingress-assets/API/SSE, actuele onafhankelijke volledige review/APPROVED en operationele Pi/LAN/herstart/restore/stabiliteitsgates blijven open. Geen browser.json PASS aangemaakt. Historische screenshots blijven maximaal drie; alleen de mobiele historyfout-screenshot wordt indien nodig vernieuwd in hetzelfde pad.

Eindcontrole: volledige pnpm harness check PASS na taakactualisering (380 tests, build, typecheck, structuur); git diff --check PASS. Log: .harness/task-061-check-2026-10-15-followup.log. Tijdelijke QA-servers gestopt, QA-tabs gesloten en viewportoverride hersteld. Releasegate blijft NOT APPROVED door ontbrekende actuele volledige Agent A-APPROVED en Agent C-PASS.
