# Task 061 — fullscreen passend op tablet — 28 oktober 2026

Expliciete gebruikersopdracht: fullscreen moet op het tabletscherm passen. Root enige schrijver; productieverschil van dit vervolg uitsluitend styles.css binnen bestaande fullscreen-write set. Geen dependencies, Pi-update of wijzigingen aan data/API/rekenlogica.

## Wijziging

Fullscreenpaneel gebruikt de beschikbare dynamische schermhoogte als flexkolom. Dagbediening, legenda en waarschuwingen behouden hun ruimte; de SVG gebruikt de resterende hoogte. Prijsgrafiek met geneste sectie doet hetzelfde. Compactere marges, bronnotities en prijsextremen voorkomen dat de tijdas onder het scherm verdwijnt. Schermuitsparingen worden met safe-area-insets meegenomen. Asverhoudingen blijven behouden; in portret geeft dat meer vrije ruimte rond de grafiek. Detailtabellen blijven bereikbaar en mogen bij expliciet uitklappen scrollen. Geen clipping door overflow:hidden.

## Verificatie

- Productiebuild PASS: `.harness/task061-tablet-fit-build.log`; JS `app-456548e00fa6df6e.js`, CSS `app-ea7fcf1b4ce4284a.css`.
- Producttests369/369 PASS, core71/bridge111/web187: `.harness/task061-tablet-fit-tests.log`.
- Typecheck PASS: `.harness/task061-tablet-fit-typecheck.log`. Eindproces `tests=0 typecheck=0`.
- Code-inspectie: bestaande dagknoppen en fout-/kwaliteitsteksten behouden; prijsdetails en vermogensdetails niet verwijderd.

## Begrensde Agent C-tabletcontrole door root

Echte Lenovo Tab One, Android15, Chrome; lokale productiebuild op `http://localhost:5173/qa-frame`, fullscreen vanuit synthetisch iframe. Geen persoonlijke runtimegegevens gekopieerd. Aanvankelijk uitsluitend synthetische prijzen en onbereikbare HA; daarna synthetische actuele reading en vermogenshistory om gecombineerde grafiek te renderen. De HA-/measuredlabels in deze fixture zijn testinput, geen hardwaremeting. Echt geïnstalleerde Pi-app blijft afzonderlijk0.1.18.

| Scenario | Fysiek scherm | Actie en waargenomen resultaat | Status |
|---|---|---|---|
| Prijs-only | Landschap1340×800 | Grafiek vergroten; dagkeuze, kioskstatus, rechteras, gehele prijsreeks, tijdlabels00/06/12/18/00 en gesloten details passen zichtbaar op één scherm | PASS |
| Vermogen plus prijs | Landschap1340×800 | Synthetische HA-current/history aanbieden; beide assen, verbruik/injectie/prijs, waarschuwing metingen tot huidig tijdstip, tijdlabels en detailsamenvattingen geheel zichtbaar zonder scrollen | PASS |
| Rotatie | Portret800×1340 | Tijdelijk rotatie0; gecombineerde grafiek, bediening, legenda, assen, tijdlabels en detailsamenvattingen blijven in beeld. Meer vrije ruimte door behouden grafiekverhouding | PASS |
| Herstel | Automatische rotatie | `cmd window user-rotation free` hersteld en uitgelezen als free; fullscreen verlaten en echte Pi-app weer geopend | PASS |

Maximaal drie privacyveilige screenshotpaden: `.harness/tablet-fit-landscape.png`, `.harness/tablet-fit-combined.png`, `.harness/tablet-fit-portrait.png`. Exacte CSS-viewport niet gemeten. Volledige375/1280/focus-/foutmatrix en echte HA-Ingress met nieuwe build blijven open; geen algemene release-PASS of onafhankelijke review nageclaimd.

Review PENDING. Volgende stap gerichte eindreview en ontbrekende browserdekking, daarna afzonderlijk geautoriseerde installatie volgens de bestaande gates. Tablet blijft tijdens opladen wakker zoals eerder ingesteld; geen appvergrendeling.
