# Task 061 — kandidaat 0.1.19 browsercontrole

Root voert de expliciet geautoriseerde Agent C-rol uit, 28 oktober 2026. **PASS voor de beperkte historie/fullscreen/kiosk-kandidaat.** Geen algemene productaudit of herstel-/24uursattestatie. Geen productiecode geschreven tijdens deze browserronde.

## Omgeving en bewijs

Afzonderlijke headless Chrome met schone profielen, Playwright uit bestaande runtime, geen gebruikersbrowser overgenomen. Productiebouw via geneste `/api/hassio_ingress/synthetic-release019/` binnen iframe op `http://localhost:18129/qa/frame`. Alle fixtures synthetisch, geïsoleerde opslag in browser/testservergeheugen. Browserlog `.harness/task061-release019-browser.log`; exacte resultaten/elementgrenzen `.harness/task061-release019-browser.json`. Zeven scenario's PASS, nul uncaught page-errors.

| Scenario | Viewport/start | Acties | Verwacht en waargenomen |
|---|---|---|---|
| Schoon mobiel | 375×812, nieuw profiel | Wacht verbinding/graph; vergroot grafiek; kies Morgen; verklein | Geen horizontale overflow; uitsluitend grafiekpaneel fullscreen; assen/tijdas binnen viewport; morgenmelding; dagkeuze blijft na verkleinen |
| Schoon desktop | 1280×900, nieuw profiel | Zelfde stappen | Zelfde PASS, relatieve assets/API/SSE laden via geneste prefix |
| Tabletmaat | 1340×800, nieuw profiel | Zelfde stappen | Zelfde PASS; tijdas en volledige SVG in beeld |
| Toetsenbord/externe exit | 1280×900 | Focus vergrotingsknop; Enter; native document.exitFullscreen | Zichtbare focusoutline, Enter activeert, externe exit synchroniseert aria-pressed/knop |
| Geblokkeerd fullscreen | 1280×900, iframepolicy fullscreen none | Vergrotingsknop | Begrijpelijke statusmelding; normale app blijft bruikbaar |
| Loading/leeg/fout/herstel | 1280×900, synthetische bronmodi | Gisteren laden; Vandaag leeg; Gisteren fout; bronherstel en retry | Loading zichtbaar, lege meting benoemd, echte retry, na succes verdwijnt retry en grafiek verschijnt |
| Expliciet bewaren/refresh | 1280×900, schoon profiel | Synthetisch volledig CSV-jaar, bewaar energiebalans, Rapport, refresh en Rapport | Lokale analyse en expliciet bewaren slagen, rapport na refresh beschikbaar, opgeslagen safe samenvatting begrensd en zonder CSV-bron |

Headless Escape werd niet als native browserexit bewezen; die eerste ongeschikte test is vervangen door de externe Fullscreen API-exit en afzonderlijk keyboard-Enter/focusbewijs. Echte Android Terug is eerder fysiek gecontroleerd in de tablet/kioskrapporten. De eerste synthetische opslagserver antwoordde verkeerd op PUT; de fixture is gecorrigeerd naar ondersteunde204 en de complete matrix opnieuw uitgevoerd. Geen productfix of afgezwakte data-/layoutassertie om die driverproblemen te verbergen.

## Werkelijke tablet en privacy

Eerdere actuele fysieke controles op dezelfde productiebron staan in [tabletpassing](task-061-tablet-fit-2026-10-28.md) en [kiosk](task-061-kiosk-2026-10-28.md): Lenovo/Android15, landschap1340×800 en portret800×1340, alleen paneel fullscreen, terugkeren, dagkeuze, schermwakkerstatus en volledige assen/tijdlabels. Broncode sinds die controles verandert alleen in versiemetadata en bijbehorende versieassertie.

Maximaal drie kandidaat-screenshotverwijzingen: `.harness/release019-mobile.png`, `.harness/release019-desktop.png`, en fysieke `.harness/tablet-fit-combined.png`. Geen echte HA-identifiers, tokens, CSV-rijen of persoonlijke centrale opslag in browserfixtures/screenshots. CSV/financiële rekenlogica en opslagvalidatie ongewijzigd; eerdere uitgebreide regressiematrix blijft afzonderlijk historisch bewijs, geen nieuwe volledige productaudit.

## Grenzen

De echte Pi draait tijdens kandidaatcontrole nog0.1.18. Nieuwe geïnstalleerde Ingress-/livegrafiek en profielbehoud worden na installatie apart gecontroleerd. De gebruiker gaf expliciet een uitzondering voor alleen de onafgeronde24uursstabiliteitsmeting en geïsoleerde restoreproef, met behoud van actuele tests/browserreview/verse backup. Die operationele gates blijven open.
