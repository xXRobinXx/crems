# Task 061 — uitsluitend grafiek op volledig scherm

Gebruikersopdracht 28 oktober 2026, expliciet verduidelijkt: alleen de overzichtsgrafiek met bijbehorende bediening vergroten, niet de volledige pagina. Root enige productiewriter. Write set: App.tsx, styles.css, battery-flow-structure.test.ts, overview-chart.test.ts, TASKS.md en dit rapport. Eerdere working-treewijzigingen behouden; geen dependencies, opslagmutaties of Pi-update.

## Implementatie

`ChartFrame` omhult alle states van PowerHistoryPanel. Knop `Grafiek op volledig scherm` vraagt uitsluitend het eigen article-element op via de Fullscreen API. Dagkeuze, legenda, assen, waarschuwingen en detailwaarden blijven binnen hetzelfde paneel. De overige paginaonderdelen vallen buiten fullscreen. `Grafiek verkleinen` verlaat fullscreen; fullscreenchange synchroniseert de knop na systeemexit. Ontbrekende ondersteuning/blokkade en mislukte requests krijgen een zichtbare statusmelding. De knop heeft een touchdoel van minimaal 44px, focusstijl en aria-pressed. Geen automatische fullscreenstart of opgeslagen fullscreenvoorkeur.

De grafiektest had alleen lege hookstubs omdat grafiekonderdelen voorheen geen hooks gebruikten. Deze stubs zijn aangevuld voor het nieuwe kader; bestaande assertions over één SVG, vermogen/prijs en afzonderlijke assen zijn behouden.

## Verificatie

- Productiebuild PASS: `.harness/task061-fullscreen-build.log`. JS `app-63839e8dc0bc6494.js`; CSS `app-97b8c4fed148ed74.css`.
- Volledige producttests PASS: core71, bridge111, web186, totaal368; `.harness/task061-fullscreen-tests.log`.
- Gerichte componenttests41/41; fullscreen request/exit, systeemevent, weigering, unsupported en listenercleanup. Bestaande grafiekregressies4/4 PASS.
- Typecheck, structuurcontrole en toolingtests16/16 PASS: `.harness/task061-fullscreen-{typecheck,structure,harness}.log`. Eindproces rapporteerde `tests=0 typecheck=0 structure=0 harness=0`.
- Diff whitespacecontrole PASS.

## Begrensde Agent C-browsercontrole door root

Echte aangesloten Lenovo Tab One, Android15, Chrome, fysiek landschap1340×800; exacte CSS-viewport niet gemeten. Lokale productiebuild op `http://localhost:5173/qa-frame`, via tijdelijke USB-reverse. Synthetisch omvattend iframe met fullscreen toegestaan; uitsluitend synthetische prijsreeks en bewust onbereikbare HA-/opslag-API's. Geen echte gegevens als testfixture gebruikt.

| Scenario | Start/actie | Verwacht en waargenomen | Uitkomst |
|---|---|---|---|
| Grafiek vergroten | Overzicht in iframe; grafiekknop gebruiken | Alleen paneel, dagknoppen, titel/legenda en grafiek zichtbaar; paginatitel, KPI's, hoofdnavigatie en iframe-omlijsting verdwijnen | PASS |
| Dagselectie fullscreen | Vandaag naar Morgen | Morgen29oktober geselecteerd, uitsluitend prijslegenda en melding dat vermogen pas morgen gemeten wordt; paneel blijft fullscreen | PASS |
| Verkleinen | `Grafiek verkleinen` | Browserbalk, iframe-omlijsting en gewone pagina keren terug; vergrotingsknop beschikbaar | PASS |
| Systeemexit | Opnieuw vergroten, Android Terug | Normale pagina keert terug | PASS |

Privacyveilige lokale screenshotpaden: `.harness/tablet-chart-fullscreen.png` en `.harness/tablet-chart-normal.png`. Geen screenshots met persoonlijke HA-identifiers in dit rapport opgenomen.

## Open gates

Dit is PASS voor bovenstaande lokale tabletscenario's, geen volledige releasebrowsermatrix. Exact375/1280, keyboardfocus in browser, browserweigering, echte HA-Ingress met de nieuwe build en gekoppelde live vermogensgrafiek zijn niet met deze wijziging in de browser bewezen. Afwijzing/systeemevent en bestaande gecombineerde grafiek zijn wel automatisch getest. Reviewstatus PENDING; geen onafhankelijke APPROVED of nieuwe harnessattestatie geclaimd. Pi blijft0.1.18. Volgende stap: gerichte eindreview, ontbrekende browserdekking en afzonderlijk geautoriseerde release/installatie volgens de bestaande gates.
