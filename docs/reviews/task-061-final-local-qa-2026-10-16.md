# Task 061 — definitieve lokale kandidaat en browser-QA, 16 oktober 2026

Lokale browserbeoordeling: PASS voor de hieronder beschreven herstelkandidaat. Dit is geen Pi-installatie-, hostherstart-, restore- of langdurige hardwaregoedkeuring. Root is de enige productieschrijver en voerde de expliciet geautoriseerde browser-QA uit. Een afzonderlijke, door de gebruiker geautoriseerde read-only reviewer voert de code-eindcontrole uit; diens besluit wordt apart vastgelegd.

## Kandidaat en oorzaak

Finale assets: `app-233a83289c4346f8.js` en `app-63f7e5165a14c645.css`. Productiescope: begrensd historieherstel en kalenderdagcorrectheid in PowerHistoryPanel, use-power-history en use-price-history; bestaande controllerreparaties blijven behouden. Geen nieuwe dependencies, prijsberekening, provider-, backend- of opslagwijziging.

De eindreview vond een extra geval naast de eerder geteste late respons: een reeds geslaagde reeks bleef tot de volgende refresh in state terwijl de UI al het nieuwe kalenderdaglabel toonde. De nieuwe regressie faalde eerst op de oude powerpanelweergave. De view weigert nu vermogen én prijzen met een andere dagstart. Beide echte hooks vernieuwen bij een kalenderdagwissel; gewone renders starten geen extra aanvraag. De prijscontroller/cache en providertransportlogica zijn niet gewijzigd. Cleanup van de prijshook is aan de effect-lifecycle gebonden.

Bronhashes SHA-256:

- App.tsx: `3ebb7e70b73c71ca7c3a4703f07fc0f313c9ad77e0a82a009ffd986177ee4fd9`.
- use-power-history.ts: `b8770576fc1c9940ae7854c569bb69bfe21c000e3d0482cb09a14975dccc2952`.
- use-price-history.ts: `7f4629491c713bbf8522516826a93ba9529568794fedb914f0b3a096628d5fbd`.

## Opstelling en privacy

Codex in-app browser. Desktop 1280 × 720, mobiel 375 × 812; daadwerkelijke DOM-afmetingen gecontroleerd nadat de asynchrone viewportwijziging was toegepast. Geen horizontale overloop op de gecontroleerde schermen. Alle bestanden, profielen, contract-/offerteteksten en energiewaarden in lokale QA zijn synthetisch.

Echte huidige bridgecode is geïsoleerd gekopieerd naar `.harness/task061-storage-20261015/bridge`, zonder `.env` of persoonlijke runtimegegevens. Alleen het openbare BELPEX-archief is meegekopieerd. De bridge bindt op 127.0.0.1:18125, gebruikt een afzonderlijke lege runtime en weigert extern fetchverkeer. Lokale peercontrole staat alleen in deze loopback-test uit; dit simuleert geen echte Supervisor-authenticatie. De productiepeercontrole is daarnaast automatisch getest; echte Ingress-read-onlybewijs staat in het operationele rapport.

Opslag-URL: `http://127.0.0.1:18125/api/hassio_ingress/qa-storage/qa-app.html`. Tweede onafhankelijke browserorigin: `http://localhost:18125/api/hassio_ingress/qa-storage/`. Dit bewijst centrale uitwisseling tussen origins, niet tussen twee fysieke apparaten. De fixture-invoerhelper vult uitsluitend het normale CSV-input-event; productiecode en serializers verwerken de data.

Historie-/klok-URL: `http://127.0.0.1:18124/qa-midnight.html`, controlpaneel `/qa`. De klokfixture start bewust op 15 oktober 23:59:10 Brussels en loopt tienmaal versneld met overeenkomstige synthetische meterklok. Timers blijven echt. Transportvelden en bronvermeldingen worden nagebootst; dit zijn geen echte HA-metingen of Energy-Charts-prijzen.

## Browsermatrix

| Scenario / start en acties | Verwacht en werkelijk | Uitkomst |
|---|---|---|
| Schoon profiel, navigatie Data/Rapport/Batterij/Contract | Rapport en Batterij hebben uitleg over ontbrekend profiel; Data en Contract bereikbaar; geen verzonnen bewaard resultaat | PASS |
| Geldig synthetisch jaar; CSV controleren, expliciet bewaren, Rapport | 7008 kWh afname/injectie, nul schattingen; uitsluitend na bewaren profiel actief; rapport toont juiste jaarperiode en totalen | PASS |
| Refresh, tweede lege origin, lokale bridgeprocesherstart | Beide resultaattypen centraal beschikbaar; profiel en rapport blijven na procesherstart behouden | PASS lokaal |
| Nieuwe incomplete CSV naast bewaard jaarprofiel | Tijdelijk batterijscenario gebruikt juni-data; bestaand Energiepaspoort blijft het jaar met 7008 kWh totdat expliciet vervangen wordt | PASS |
| Incomplete batterijdata | 2/96 kwartieren, één schatting en één gat; technische simulatie gelabeld en financieel advies geblokkeerd | PASS |
| Financieel geldig testjaar | Voor bevestiging alleen technisch; synthetische contract/offerte expliciet ingevuld en bevestigd; daarna pas financieel snapshot. Alle uitkomsten negatief, geen positieve aanbeveling verzonnen | PASS |
| Financiële invoer wijzigen | Checkbox wordt ingetrokken en financieel snapshot verdwijnt; opnieuw bevestigen nodig | PASS |
| Volledig rapport bewaren, refresh en tweede origin op finale build | Bevestigde QA-contract/offerte en scenario blijven; dagaggregaten beschikbaar, kwartiergrafieken vereisen het bronbestand | PASS |
| Centrale corruptie | Alleen geïsoleerde testfile corrupt gemaakt; schrijver-origin behoudt expliciet lokaal bewaard rapport met zichtbare centrale fout. Lege tweede origin verzint geen fallback. Corruptbytes blijven exact ongewijzigd; alleen bekende synthetische backup teruggezet | PASS |
| Geldig rapport en profiel expliciet verwijderen | Werkelijke DELETEs via UI, serverbestand eindigt op `{}`; tweede origin na refresh zonder resultaten | PASS |
| Legacy v1/v2 | Oud resultaat blijft herkenbaar, niet automatisch gewijzigd; v1 bewust naar technisch rapport omgezet en na refresh bewaard; financiële blokkade blijft. v2 bewust lokaal verwijderd | PASS |
| Onleesbare lokale data en ontbrekende lokale opslag | Zichtbare niet-destructieve herstelstate; bewuste cleanup van uitsluitend corrupte lokale fixture. Ontbrekende opslag geeft een duidelijke melding zonder crash | PASS |
| Lokale verwijder- en bewaarfouten | Foutinjectie in browserstorage: oude legacy blijft bij verwijderfout; savefout activeert geen nieuw profiel of serverbewaring | PASS |
| Ongeldige CSV, voortgang, annuleren, nieuwe upload | Veilige fout, zichtbare voortgang, annulering laat geen geannuleerd resultaat achter; nieuwe upload werkt. Gedetailleerde eerste matrix in rapport 15 oktober | PASS |
| Lokale contractcatalogus | CSV-totalen pas na afzonderlijke keuze ingevuld; postcode3000, 97 Vlaanderenkaarten, volgorde op berekenbaar afname+vergoeding, variabele scenario's en kostenbeperkingen zichtbaar. Geen externe compare uitgevoerd | PASS |
| Vandaag reeds geslaagd vóór middernacht, finale build | Eerst grafiek15oktober; na kalenderwissel geen oude vermogensgrafiek of oude prijsdag onder16oktober. Nieuwe prijsvensters direct aangevraagd; nieuwe vermogensreeks bij bestaande30srefresh. Finale DOM en controlrequests opgeslagen | PASS |
| Gisteren reeds geslaagd vóór middernacht, finale build | Eerst gisteren14oktober; na rollover gisteren15oktober, vermogen en prijs worden opnieuw geladen ondanks gestopte succes-retrytimer | PASS |
| Finale mobiele fout en retry met Enter | Bevestigde375px, prijs blijft apart beschikbaar bij powerfout; Enter herstelt vermogensgrafiek, retry verdwijnt; geen horizontale overloop | PASS |
| Deadline, maximaal drie retries, reset na uitputting, stale callbacks, overlap | Eerder echte browserrequests/tijden vastgelegd; controllerbron ongewijzigd sinds die transportcontrole. Finale eigen gerichte suite53/53 opnieuw groen, inclusief echte hooks/cleanup en oude-dag-UI-regressies | PASS binnen combinatie van browser- en afzonderlijk genoemd automatisch bewijs |

Relatieve assets zijn in het geneste document daadwerkelijk `assets/app-…`; de echte bridge verwerkt profiel-/rapport-API en SSE onder dezelfde prefix. Dit is lokale route-integratie, geen browserlogin op HA.

## Controleerbaar bewijs

DOM-/controlpaneellogs onder `.harness/`: `task061-final-calendar-browser.txt`, `task061-final-yesterday-calendar-browser.txt`, `task061-final-mobile-retry.txt`, `task061-central-second-origin.txt`, `task061-central-after-restart.txt`, `task061-corrupt-central-browser.txt`, `task061-legacy-v1-browser.txt`, `task061-delete-fault-browser.txt`, `task061-corrupt-local-browser.txt`, `task061-contract-catalog-browser.txt`, `task061-financial-persistence-browser.txt`.

Synthetische opslaginspectie vóór vernietigende test: 2950 bytes, alleen energy-profile/battery-report en toegestane aggregaten; geen EAN, meter-ID, bestandsnaam, CSV, points, intervals of timestamp-sleutels. Hash `55e6b8f9f671893920f810a60a9310b59e1a76559e254cba9eaac955d0859598`. De latere financiële jaarfixture bevat meer toegestane dagaggregaten; de eerdere kleine bestandsgrootte wordt daarvoor niet geclaimd. Geen algemene inspectie van persoonlijke opslag of volledige netwerkpayloadaudit uitgevoerd.

Maximaal drie bestaande screenshotpaden blijven in gebruik onder `C:/Users/Robin/.codex/visualizations/2026/10/15/01a13e94-c023-7940-b4e2-c016a9a7ed88/`: `task061-mobile-error.jpg` is vernieuwd op finale build; de desktop- en mobiele rapportbeelden zijn vernieuwd op finale build (respectievelijk1280px en375×812, geen horizontale overloop). Geen credentials, identifiers of persoonlijke CSV-inhoud.

De eerste native bestandskiezer-aanroep op15oktober duurde1353s; daarvoor geen performance-PASS. De finale matrix gebruikt de bestaande synthetische inputhelper. Eerdere deels groene browser-/reviewrapporten zijn aanvullend, geen nieuwe releaseattestatie. Finale volledige automatische checks en onafhankelijke beoordeling worden na normatieve bronfreeze hieronder gekoppeld.


## Finale automatische gate — 16 oktober 2026

`pnpm harness check`: PASS, exit0, stable=true. 383 tests: core71, web185, bridge111, harness16; structuur, build en typecheck PASS. Start14:44:58.305UTC, einde14:45:40.865UTC. Fingerprint `045b166454ef570d81ce594c4a30ad95997ab6d7831e45921e3feda13317acc5`. Controleerbare bestanden: `.harness/checks.json`, `.harness/task-061-final-check-2026-10-16.log`. Onafhankelijke beslissing: [eindreview](task-061-final-review-2026-10-16.md). Geen volledige releaseattestatie.
