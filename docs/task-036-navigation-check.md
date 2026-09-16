# Task 036 — navigatievoorwaarden

Status: READY FOR BROWSER REVIEW. Geen browser-PASS of formele APPROVED-review.

## Codehercontrole — 13 september 2026

Root heeft de navigatiehandlers, voorwaarden, aria-koppelingen, CSS-ombraakregels en bestaande componenttests opnieuw gelezen. Geen nieuw herstelpunt gevonden binnen de navigatiewijziging. Dit is een hercontrole door de oorspronkelijke implementer, geen onafhankelijke Agent A-goedkeuring.

Herhaald: `node --test apps/web/test/battery-flow-structure.test.ts tools/harness.test.mjs` — 19/19 geslaagd. De 14 componenttests omvatten geblokkeerde navigatie, bereikbaarheid van een bewaard rapport, behoud bij verwijderfouten, legacy-herstel en bestaande dag-/periodefilters; de overige vijf controleren het harness. De bestaande volledige run van 12 september blijft brongebonden geldig (65 core, 93 web, 67 bridge, 5 harness; build en typecheck geslaagd). `pnpm harness gate` meldt uitsluitend ontbrekende Agent A-review en Agent C-browser-PASS.

Nog niet bewezen door deze hercontrole: echte Tab-/Enter-/Spatiebediening, layout/focus op 375 en 1280 px en de volledige browserreis. Daarvoor blijft de onderstaande checklist open. Geen browser bediend, gebruikersopslag gewijzigd of productcode aangepast tijdens deze hercontrole.

Implementatie: voorwaarden voor Rapport, Batterij en Contract staan permanent onder de betreffende knop wanneer de route niet beschikbaar is. aria-describedby koppelt uitleg aan de knop; aria-disabled behoudt toetsenbordfocus en de handler blokkeert navigatie. aria-current markeert de actieve pagina. Navigatie en header breken om; voorwaarden verdwijnen zodra de route beschikbaar is. Bestaande opslag-/legacyroutes blijven behouden.

Automatisch bewijs: nieuwe componenttest activeert alle geblokkeerde handlers vanuit lege opslag, controleert dat de pagina niet verandert en dat beschrijving/focusbaarheid behouden blijven. Bestaande componenttest bewijst bereikbaarheid van een opgeslagen batterijrapport en behoud bij verwijderfouten. Volledige actuele checks via `pnpm harness check`.

Nog uit te voeren door Agent C na expliciete browseropdracht, op http://127.0.0.1:5173/:

- Schoon profiel: uitleg zichtbaar bij de drie geblokkeerde routes; Tab bereikt iedere knop; Enter/Spatie openen geen geblokkeerde route.
- Data openen, geldige synthetische CSV controleren en batterijpotentieel kiezen: batterijroute beschikbaar.
- Energiepaspoort expliciet bewaren: Rapport en Contract beschikbaar; hun voorwaarden verdwijnen.
- Bestaand veilig batterijrapport zonder Energiepaspoort: Batterij blijft bereikbaar, Rapport/Contract blijven geblokkeerd.
- Legacy/corrupte batterijopslag: herstelpagina blijft bereikbaar.
- 375 px en 1280 px: geen horizontale overflow, overlappende tekst of afgesneden focusrand.
- Privacy: geen bronbestand, identifiers of secrets in uitleg of screenshots.

Verwacht: alleen voorwaarden/navigatiepresentatie veranderen; geen extra opslagwrites, simulaties of financiële acties.
