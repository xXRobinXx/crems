# CREMS Product Audit — 7 september 2026

## Contract-API actualisering — 28 september 2026

Aanbieders.be/e-Contract documenteert een Belgisch product- en vergelijkings-API met registratie-/affiliatevereisten. Task 059 implementeert een server-side connector en expliciete opt-in UI: credentials blijven in HA-backendconfiguratie, persoonsgegevens worden niet automatisch uit het lokale profiel genomen, requests zijn begrensd en responses worden naar veilige productvelden genormaliseerd. Her-audit herstelde de sibling-pricing parsing, relatieve Ingress URL, postcodegrens, responsevalidatie vóór render, status/tarieftypepresentatie, aparte dag-/nachtinjectie en echte streaming-413-afhandeling. Actuele bridge 101/101, web 131/131, workspace build/typecheck en harness 5/5 zijn PASS. Agent C browsermatrix PASS op nieuwste productiebuild voor 320/375/768/1280 px, opt-in/reset, Ingress-route, kaart/fouten/focus en geen overflow/page-errors met synthetische fixtures. Beide manifests staan op 0.1.12 en de lokale tag verwijst naar de gevalideerde commit; een push naar de geconfigureerde GitHub-origin is door auto-review geblokkeerd wegens niet-expliciet toegestane broncode-export. De image is niet gepubliceerd of geïnstalleerd op de Pi. Live gebruik is nog niet bewezen: partnerrechten voor CREMS, voorwaarden/kosten, API-credentials en actuele response ontbreken; zonder configuratie retourneert de API veilig "niet geconfigureerd". Er zijn geen account, voorwaarden of kosten geaccepteerd en geen providerverzoek gedaan. Tounify blijft ongeschikt voor CREMS consumentenvergelijkingen; Selectra biedt in de geraadpleegde documentatie prijsplanning van een gekozen contract, geen aangetoonde algemene marktvergelijking. De Vlaamse V-test blijft een maandelijkse, niet-landelijke Excel-download.

## Release-/bronstatus — 27 september 2026

CREMS Energy `v0.1.11` is op de gekoppelde Home Assistant-Pi gepubliceerd en geïnstalleerd. Een nieuwe live controle op 27 september trof eerst een stale `Bridge offline`-badge aan (meter-update 11:11:03); een verse Ingress-sessie herstelde `Home Assistant live` en twee opvolgende snapshots bevestigden doorlopende tijden 11:16:20 en 11:16:40 met injectie 406 W. De oorzaak van de stale state is niet vastgesteld. Agent C kon de Pi niet bereiken in geïsoleerde browsercontexten (`ERR_NETWORK_ACCESS_DENIED`), waardoor exacte mobiele/desktop-viewports, Pi-cacheheaders/overdracht en console/Network-controle niet zijn uitgevoerd. Lokale viewport- en bridgecachetests zijn geen Pi-bewijs. Zie `TASKS.md` en `REVIEW.md`.

Contractbrononderzoek: de Vlaamse Nutsregulator biedt maandelijks V-test-productdata als downloadbestand met open-datahergebruik onder bronvermelding; prijzen zijn exclusief btw en nettarieven/heffingen ontbreken. Dit is geen API en geen landelijke bron. Voor Brussel en Wallonië is in de geraadpleegde officiële documentatie geen publiek contract-API/schema of vergelijkbaar herbruikbaar bestand vastgesteld. Automatische contractintegratie blijft daarom niet geïmplementeerd; geen verborgen endpoints gebruikt. Zie Task 053/044.

De volledige Astra-audit is niet afgerond: de eerdere agent-run stopte wegens een usage-limiet. De bestaande read-only bevindingen zijn handmatig getoetst, maar dat vervangt de gevraagde onafhankelijke Astra-review niet. Task 042 blijft dus gedeeltelijk.

## Actuele releasebaseline — 25 september 2026

De volledige update van de audit staat bovenaan [docs/full-audit-2026-09-24.md](docs/full-audit-2026-09-24.md). De P1-codebevindingen over centrale corrupte opslag, data-allowlists, foutieve kwaliteit, browserkopieën, wildcard CORS en HA Ingress-routing zijn hersteld met regressies. De geverifieerde codechecks zijn groen. De release is desondanks **niet uitgerold of volledig goedgekeurd**: Agent C-browser-PASS, ARM64-publicatie/installatie en Pi-herstart/rollback ontbreken; contracten-API-toegang blijft onbekend. `TASKS.md` bevat de externe gates.

## Nieuwe volledige audit — 24 september 2026

De audit van de huidige werkboom staat in [docs/full-audit-2026-09-24.md](docs/full-audit-2026-09-24.md). De onafhankelijke Astra-controle werd door een usage-limiet onderbroken; de concrete bevindingen zijn daarna tegen de code geverifieerd. De automatische controles zijn groen: build, 65 core-tests, 118 webtests, bridgetests, typechecks en harness. De release blijft geblokkeerd door open P1-bevindingen rond corrupte centrale opslag, ontbrekende origin/hostauthenticatie, bronkwaliteitsclaims en financiële snapshotvalidatie. Er is geen Agent C-browser-PASS; historische moduleclaims zijn geen releasegoedkeuring.

## Actualisering — 10 september 2026

De audit hieronder is de historische herstelbaseline van 7 september. De persoonlijke contractpagina en Energiepaspoort v2 zijn inmiddels aanwezig in de lokale webapp; de oude vermelding dat de contractpagina onbereikbaar is beschrijft niet meer de huidige code. Er is nog geen volledige productreleasegoedkeuring.

Task 035 blijft actief. De eindcontrole vond aanvullende fouten in expliciete rapportopslag zonder prijzen, de scheiding tussen nieuwe CSV-data en een bestaand rapport, en het opnieuw openen van resultaten. De gerichte herstelhandoff staat in `TASKS.md`; het bewijs en de uiteindelijke beslissing komen in `REVIEW.md`. De open browserchecklist staat in `docs/task-035-release-check.md`. Contractuitbreiding en Raspberry Pi-deployment volgen pas na de herstelrelease.

## Oordeel

CREMS is een bruikbare technische basis, maar nog geen betrouwbare lokale MVP. De live Home Assistant-keten, daggrafiek, prijsweergave, streaming Fluvius-parser, Energiepaspoort-aggregaten en batterijmotor bestaan. De volledige gebruikersreis is echter niet als één product bewezen.

## Bedoeld product

Een zelfstandige, lokale energie-app voor Belgische huishoudens die optioneel read-only Home Assistant gebruikt, Fluvius-historiek lokaal verwerkt en vervolgens verbruik, contracten en batterijscenario's begrijpelijk samenbrengt.

## Bewezen beschikbaar

- live afname/injectie met zichtbare bronstatus;
- echte vermogens- en prijsdata voor Gisteren/Vandaag/Morgen wanneer Home Assistant die levert;
- lokale, geheugenbegrensde controle van een bewezen Fluvius-CSV;
- expliciete opslag van veilige Energiepaspoort-totalen;
- technische batterijsimulatie voor 3/5/7/10/13 kWh;
- pure berekeningen voor vlakke contracten en voorwaardelijke batterij-NPV.

## Niet als product bewezen

- één duurzame flow van CSV naar technisch én financieel batterijrapport en hetzelfde resultaat na refresh;
- migratie van oudere lokale batterijresultaten;
- persistente, herleidbare contract- en offertecontext;
- een bereikbare contractvergelijking op het persoonlijke profiel;
- browserbewijs voor navigatie, mobiel, foutstaten en lokale opslag;
- Raspberry Pi-installatie en externe toegang als ondersteunde deployment.

## Actuele blockers

1. Oudere of onvolledige batterijschema's worden geweigerd zonder zichtbare migratie- of herstelstate.
2. Financiële invoer en financiële uitkomsten bestaan alleen tijdelijk en verdwijnen bij refresh.
3. De contractpagina is onbereikbaar en niet gekoppeld aan de bestaande contractrekenmotor.
4. Batterijwerk mist abort/sequence-bescherming; een oude run kan nieuwere state of opslag overschrijven.
5. Batterijsimulatie start stilzwijgend opslag van het Energiepaspoort, ondanks de expliciete-toestemmingsbelofte.
6. Energiepaspoort en batterijrapport bewaren verschillende kwaliteitsmetadata.
7. De financiële copy en berekening verschillen over terminale batterijlading.
8. Tests bewijzen modules, maar niet de volledige gebruikersreis.
9. `README.md`, `TASKS.md` en historische reviews hebben de productrijpheid overschat.

## Beslissing

Geen nieuwe productfunctie vóór de herstelrelease. Eerst wordt exact één verticale flow bewezen:

`CSV controleren → technisch batterijresultaat → financiële context bevestigen → volledig rapport bewaren → refresh → hetzelfde rapport herstellen → expliciet verwijderen`.

Contractvergelijking volgt pas nadat deze flow is goedgekeurd. Historische taakgoedkeuring blijft geldig als modulebewijs, maar geldt niet automatisch als releasegoedkeuring.
