# CREMS Product Audit — 7 september 2026

## Contract-API actualisering — 28 september 2026

Aanbieders.be/e-Contract documenteert een Belgisch product- en vergelijkings-API met registratie-/affiliatevereisten. Task 059 implementeert een server-side connector en expliciete opt-in UI: credentials blijven in HA-backendconfiguratie, persoonsgegevens worden niet automatisch uit het lokale profiel genomen, requests zijn begrensd en responses worden naar veilige productvelden genormaliseerd. Her-audit herstelde sibling-pricing parsing, relatieve Ingress URL, postcodegrens, responsevalidatie vóór render, status/tarieftypepresentatie, aparte dag-/nachtinjectie en streaming-413-afhandeling. Bridge 101/101, web 131/131, workspace build/typecheck en harness 5/5 zijn PASS; Agent C slaagde voor de synthetische browsermatrix op 320/375/768/1280 px. ARM64-release `v0.1.12` is via workflow [36473247556](https://github.com/xXRobinXx/crems/actions/runs/36473247556) gepubliceerd; index `sha256:d517cc7bfea835d4d610135cd527b337b0e21b3910c4f167344a41b60a10f688`, ARM64 `sha256:b7b3a30e071852fb92030ab1a906ccf2d6021d55d851936ce0139a3ad90ec858`. Home Assistant bevestigt dat `v0.1.12` geïnstalleerd en actueel is; de HA-ingress en contractpagina openen. De app-updatebackup van `v0.1.11` is aangemaakt. Er is geen vergelijking verstuurd. Pi-specifieke 375×812- en 1280×900-metingen, console, netwerk/cacheheaders en cachewarmte zijn niet uitgevoerd omdat de beschikbare browserbediening die controles niet aanbiedt; Task 058 blijft hiervoor open. Live API-gebruik blijft geblokkeerd door ontbrekende partnerrechten, voorwaarden/kosten, credentials en echte providerresponse. Zonder configuratie maakt de app veilig geen providerverzoeken. Er is geen account aangemaakt, geen voorwaarde geaccepteerd en geen providerverzoek gedaan. Tounify blijft ongeschikt voor CREMS consumentenvergelijkingen; Selectra biedt in de geraadpleegde documentatie prijsplanning van een gekozen contract, geen aangetoonde algemene marktvergelijking. De Vlaamse V-test blijft een maandelijkse, niet-landelijke Excel-download.

## CSV-jaarverbruik in contractvergelijking — 29 september 2026

Task 060 voegt lokaal gecontroleerde Fluvius-CSV-totalen per dag-/nachtregister toe aan het contractformulier, alleen na een expliciete keuze. Invullen is geblokkeerd tenzij alle vier registers elk minstens 364 dagen dezelfde betrouwbare, aaneengesloten periode afdekken zonder schattingen, gaps, overlap, dubbels of afgekeurde rijen. De gebruiker bevestigt daarna nog afzonderlijk het versturen naar Aanbieders.be. Definitieve harness: 65 core-tests, 101 bridge-tests, 134 webtests, alle builds en typechecks PASS; Agent A/Astra review en Agent C-browserflow PASS. De geïsoleerde browserflow gebruikte synthetisch jaarbestand en geen profiel; geen echte meter-CSV, providerrequest of Pi-run is geclaimd. De toevoeging is goedgekeurd voor de ongeconfigureerde v0.1.13-release. `tools/release-crems.ps1` herhaalt de gate, ARM64-imagepublicatie en optionele Home Assistant-backup/update; gebruik staat in `docs/release-home-assistant.md`.

## Release-/bronstatus — 27 september 2026

CREMS Energy `v0.1.12` is op de gekoppelde Home Assistant-Pi geïnstalleerd en actueel. De HA-appupdate maakte een `v0.1.11`-herstelbackup. De Ingress en contractpagina openen. De eerdere live bridgewaarnemingen van 27 september staan hieronder als historische observatie; dit is geen nieuwe meetcontrole voor release 0.1.12. De exacte Pi-viewports, cacheheaders/overdracht en browserconsole zijn niet uitgevoerd wegens ontbrekende browserbediening. Lokale viewport- en bridgecachetests zijn geen Pi-bewijs. Zie `TASKS.md` en `REVIEW.md`.

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
