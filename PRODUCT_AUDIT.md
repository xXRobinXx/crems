## Kandidaat0.1.20 — 5november2026

Gerichte compacte-grafiekrelease APPROVED na actuele volledige checks en browser-PASS; Pi nog0.1.19. [Review en scopegrenzen](docs/reviews/task-061-release020-review-2026-11-05.md). Verse protected CREMS-backup8b9d14f3; post-update asset/live/resultaatbehoud en tablet nog te controleren.24uur-/geïsoleerde restore-/providergates blijven open; geen algemene operationele vrijgave.

## Actualisering 19 oktober 2026

[Actuele afrondingscontrole](docs/reviews/task-061-closeout-2026-10-19.md): 383 tests en structuur/build/typecheck PASS; Pi 0.1.18 started via Tailscale, direct LAN onbereikbaar. Nieuwe 24-uursmeting loopt; geen stabiliteits-PASS of algemene releasegoedkeuring. Hostherstart/gegevensbehoud was op 16 oktober bewezen. Restorehost, LAN-route, providerrechten/configuratie en release/browsergates blijven open. Geen productiecode gewijzigd.

## Operationeel vervolg — 16 oktober 2026, na17:09Brussels

[Echte HAOS-hostherstart](docs/reviews/task-061-host-reboot-2026-10-16.md) technisch PASS: vers protected CREMS-herstelpunt, nieuwe boot,0.1.18 started, Ingress200, profielv2 en rapportv3 inhoudelijk exact behouden; live measured/actueel hersteld. Geen kandidaatuitrol of restore; geen nieuwe HA-browsercontrole. [Root-auditvervolg](docs/reviews/task-061-product-audit-followup-2026-10-16.md) heeft de requirementsketens en eerdere P1-bevindingen gecontroleerd, met expliciete dekking/grenzen; geen onafhankelijke volledige auditclaim.

Langdurige24uursmeting wordt afzonderlijk vastgelegd in .harness/task061-stability-24h-status.json; alleen COMPLETE metpass=true sluit die meetperiode. FysiekeLAN blijft geblokkeerd en er is geen geïsoleerde HAOS-restorehost. Complete externe providerconfiguratie ontbreekt. De hieronder genoemde hostherstart-NOTRUNstatussen zijn eerdere momentopnamen.
## Actuele kandidaatcontrole — 16 oktober 2026

Task061 herstelt historie/retries en Brussels dagwissel voor vermogen en prijs. Finale lokale kandidaat: app-233a83289c4346f8.js. [Lokale browsermatrix](docs/reviews/task-061-final-local-qa-2026-10-16.md) PASS binnen synthetische desktop-/mobielscope, inclusief centrale opslag en financieel rapport. Finale volledige check en onafhankelijke beslissing staan in [eindreview](docs/reviews/task-061-final-review-2026-10-16.md).

Pi draait nog0.1.18; deze kandidaat is niet uitgerold. [Actuele read-only operationele controle](docs/reviews/task-061-final-operations-2026-10-16.md): Ingress en120sSSE PASS, actuele Supervisorbackup16oktober03:00:39UTC. Fysiek LAN, hostherstartbehoud, echte Supervisorrestore/rollback en langdurige hardwarestabiliteit blijven open, evenals live providerrechten en volledige productaudit. Geen volledige releasegoedkeuring. Onderstaande baselines zijn gedateerd historisch bewijs.
## Actuele verbindingsrelease — 14 oktober 2026

**Pi 0.1.18 draait**, met backup en actuele gebruikersbrowser-PASS: nieuwe assets geladen, Home Assistant live zichtbaar na refresh en Batterij→Contract; profiel en batterijrapport behouden. [Deploymentbewijs](docs/reviews/task-061-deployment018-2026-10-14.md). Verbindingsherstel afgerond met368tests, onafhankelijkeAPPROVED en synthetische fallback/uitval/herstel-browserPASS. Initieel verbinden en herstel zijn onderscheiden; oude waarden verliezen Live-label. De oorspronkelijke intermitterende SSEoorzaak blijft onzeker; geen garantie tegen netwerkuitval. Open operationele controles blijven fysiekeLAN, echteSupervisorrestore/rollback, hostherstartbehoud en langdurigehardwarestabiliteit. Hieronder staan gedateerde eerdere stappen. Root enige productiewriter; dit vervolg verandert alleen bewijs en documentatie, write set aangevuld met PRODUCT_AUDIT.md.

# CREMS Product Audit

## Actuele baseline en resterende lijst — 13 oktober 2026

**Pi 0.1.17 draait**, source/tag/publicatie en backup geverifieerd; [actueel deploymentbewijs](docs/reviews/task-061-deployment017-2026-10-13.md). Goedkoop-naar-duur afgerond met 362 tests, onafhankelijke APPROVED, lokale en geïnstalleerde browser-PASS. Profiel/batterijrapport na appupdate behouden. Live 120 s: 107 gemeten events, nul ongeldige/verouderde events. Synthetische opslagbackup/restore PASS. Oude versie-/kandidaatteksten hieronder zijn gedateerde stappen, geen actuele baseline.

Task 061 blijft de enige actieve taak. Root enige productiewriter; huidige sorteerwijziging voltooid, geen verdere productiecode in deze vervolgstap. Documentatie-write set aangevuld met PRODUCT_AUDIT.md en actueel deploymentrapport. Nog open, met concrete grenzen:

- Initieel verbinden/reconnect onderscheiden van de melding Bridge offline; actuele browser start offline en wordt live. Geen vastgestelde serveruitval tijdens de twee-minutenmeting.
- Fysiek LAN bewijzen: pc 192.168.0.x en Pi 192.168.88.x, directe Pi-HTTP timeout. Tailscale-PASS sluit deze gate niet.
- Echte Supervisor-backuprestore/rollback en hostherstart/resultaatbehoud nog niet uitgevoerd. Updatebackup en synthetisch bestandherstel zijn bevestigd, geen productie-restoreclaim.
- Langdurige Pi/hardwarestabiliteit blijft open; de actuele 120 s-meting heeft beperkte duur.

## Actuele baseline — documentatiecleanup 2 oktober 2026

Laatste vastgelegde Pi-versie is **0.1.14**, installed/started met updatebackup en HTTP-runtimecontrole; zie [deploymentbewijs](docs/task-061-deployment014.md). De lokale **0.1.15-kandidaat** herstelt de contract-CSV-bestandskiezer; zie [begrensde review](docs/task-061-csv015-review.md). Deze documentatiecleanup voerde geen nieuwe externe controle uit. Volledige actuele Pi-browser-, fysieke LAN-, herstart-/resultaatbehoud- en rollbackgates blijven open; historische 0.1.13-/NOT RUN-/approvalteksten hieronder zijn gedateerde evidence. De volledige actuele openlijst staat bovenaan TASKS.md. Geen nieuwe releaseapproval of attestatie.

## Actuele releasebaseline — 1 oktober 2026

Task 061 controleert de bestaande release, documentatie en LAN-toegang. Een actuele geauthenticeerde Supervisor-infoaanvraag bevestigt CREMS Energie **0.1.13**, nieuwste versie **0.1.13**, toestand **started**. Deze run voerde geen update uit en maakte of controleerde geen nieuwe appbackup. De publicatiegegevens van 29 september hieronder blijven de herkomst van de bestaande image.

Het deploymentontwerp gebruikt uitsluitend geauthenticeerde Home Assistant Ingress: LAN-toegang via Home Assistant op poort 8123, interne add-onpoort 8099 en server-side peer `172.30.32.2`. Read-only Pi-netwerkinfo bevestigt `192.168.88.253/24`, gateway `192.168.88.1`. De directe LAN-HTTP-controle vanaf de huidige host gaf timeout; HA en geauthenticeerde Ingress via Tailscale gaven HTTP 200. De LAN-route is [CREMS Energie](http://192.168.88.253:8123/hassio/ingress/350f0e24_crems_energy); rechtstreekse bereikbaarheid is hier niet bewezen. Actuele core 65/65, web 134/134, bridge 101/101 vóór de nieuwe peerregressie, build/typecheck, productie-start 9/9 en helper/harness 11/11 zijn PASS. Finale root-harness na docs volgt. De tool-/test-/docwijzigingen zijn APPROVED; Task 061 blijft CHANGES REQUIRED. Agent C-browsergate is NOT RUN. Volledige Pi-browser-, opslag-/herstart-, cache- en rollbackgates blijven open. Er is geen volledige releasegoedkeuring en geen nieuwe productfunctie of providerrequest.

De secties hieronder zijn gedateerd historisch bewijs. Open codepunten uit september zijn niet automatisch actuele blockers; huidige status en controleerbare beperkingen staan in Task 061 en `docs/task-061-review.md`.

## Contract-API actualisering — 28 september 2026

Aanbieders.be/e-Contract documenteert een Belgisch product- en vergelijkings-API met registratie-/affiliatevereisten. Task 059 implementeert een server-side connector en expliciete opt-in UI: credentials blijven in HA-backendconfiguratie, persoonsgegevens worden niet automatisch uit het lokale profiel genomen, requests zijn begrensd en responses worden naar veilige productvelden genormaliseerd. Her-audit herstelde sibling-pricing parsing, relatieve Ingress URL, postcodegrens, responsevalidatie vóór render, status/tarieftypepresentatie, aparte dag-/nachtinjectie en streaming-413-afhandeling. Bridge 101/101, web 131/131, workspace build/typecheck en harness 5/5 zijn PASS; Agent C slaagde voor de synthetische browsermatrix op 320/375/768/1280 px. ARM64-release `v0.1.12` is via workflow [36473247556](https://github.com/xXRobinXx/crems/actions/runs/36473247556) gepubliceerd; index `sha256:d517cc7bfea835d4d610135cd527b337b0e21b3910c4f167344a41b60a10f688`, ARM64 `sha256:b7b3a30e071852fb92030ab1a906ccf2d6021d55d851936ce0139a3ad90ec858`. Home Assistant bevestigt dat `v0.1.12` geïnstalleerd en actueel is; de HA-ingress en contractpagina openen. De app-updatebackup van `v0.1.11` is aangemaakt. Er is geen vergelijking verstuurd. Pi-specifieke 375×812- en 1280×900-metingen, console, netwerk/cacheheaders en cachewarmte zijn niet uitgevoerd omdat de beschikbare browserbediening die controles niet aanbiedt; Task 058 blijft hiervoor open. Live API-gebruik blijft geblokkeerd door ontbrekende partnerrechten, voorwaarden/kosten, credentials en echte providerresponse. Zonder configuratie maakt de app veilig geen providerverzoeken. Er is geen account aangemaakt, geen voorwaarde geaccepteerd en geen providerverzoek gedaan. Tounify blijft ongeschikt voor CREMS consumentenvergelijkingen; Selectra biedt in de geraadpleegde documentatie prijsplanning van een gekozen contract, geen aangetoonde algemene marktvergelijking. De Vlaamse V-test blijft een maandelijkse, niet-landelijke Excel-download.

## CSV-jaarverbruik in contractvergelijking — 29 september 2026

Task 060 voegt lokaal gecontroleerde Fluvius-CSV-totalen per dag-/nachtregister toe aan het contractformulier, alleen na een expliciete keuze. Invullen is geblokkeerd tenzij alle vier registers elk minstens 364 dagen dezelfde betrouwbare, aaneengesloten periode afdekken zonder schattingen, gaps, overlap, dubbels of afgekeurde rijen. De gebruiker bevestigt daarna nog afzonderlijk het versturen naar Aanbieders.be. Definitieve harness: 65 core-tests, 101 bridge-tests, 134 webtests, alle builds en typechecks PASS; Agent A/Astra review en Agent C-browserflow PASS. De geïsoleerde browserflow gebruikte synthetisch jaarbestand en geen profiel; geen echte meter-CSV, providerrequest of Pi-run is geclaimd. De toevoeging is goedgekeurd voor de ongeconfigureerde v0.1.13-release. `tools/release-crems.ps1` herhaalt de gate, ARM64-imagepublicatie en optionele Home Assistant-backup/update; gebruik staat in `docs/release-home-assistant.md`.

## Release-/bronstatus — 29 september 2026

CREMS Energy `v0.1.12` is de laatst geverifieerde geïnstalleerde versie op de gekoppelde Home Assistant-Pi. De ongeconfigureerde `v0.1.13` ARM64-image is gepubliceerd via workflow [36600366405](https://github.com/xXRobinXx/crems/actions/runs/36600366405), OCI-index `sha256:bd8000e778e61b94ac5a312b2f546e67e4943aa5a8adb9779858283e0ddc5add`, ARM64 `sha256:39c2ce281cbb8198ce6be876e8f44a1bf27ad82a94b02a89e8adb7d45925fccd`. Pi-installatie wacht op veilige lokale HA-tokeninvoer; de Supervisor-update maakt vooraf een appback-up. De Ingress en contractpagina waren eerder bereikbaar op 0.1.12. De eerdere live bridgewaarnemingen van 27 september zijn historisch; exacte Pi-viewports, cacheheaders/overdracht en browserconsole zijn niet uitgevoerd wegens ontbrekende browserbediening. Lokale viewport- en bridgecachetests zijn geen Pi-bewijs. Zie `TASKS.md` en `REVIEW.md`.

Contractbrononderzoek: de Vlaamse Nutsregulator biedt maandelijks V-test-productdata als downloadbestand met open-datahergebruik onder bronvermelding; prijzen zijn exclusief btw en nettarieven/heffingen ontbreken. Dit is geen API en geen landelijke bron. Voor Brussel en Wallonië is in de geraadpleegde officiële documentatie geen publiek contract-API/schema of vergelijkbaar herbruikbaar bestand vastgesteld. Een brede live contractbron was toen niet bewezen; Task 059 voegde later de optionele Aanbieders.be-connector toe. Live gebruik blijft afhankelijk van partnerrechten en configuratie; geen verborgen endpoints gebruikt. Zie Task 053/044/059.

De volledige Astra-audit is niet afgerond: de eerdere agent-run stopte wegens een usage-limiet. De bestaande read-only bevindingen zijn handmatig getoetst, maar dat vervangt de gevraagde onafhankelijke Astra-review niet. Task 042 blijft dus gedeeltelijk.

## Historische releasebaseline — 25 september 2026

De volledige update van de audit staat bovenaan [docs/full-audit-2026-09-24.md](docs/full-audit-2026-09-24.md). De P1-codebevindingen over centrale corrupte opslag, data-allowlists, foutieve kwaliteit, browserkopieën, wildcard CORS en HA Ingress-routing zijn hersteld met regressies. De geverifieerde codechecks zijn groen. De release is desondanks **niet uitgerold of volledig goedgekeurd**: Agent C-browser-PASS, ARM64-publicatie/installatie en Pi-herstart/rollback ontbreken; contracten-API-toegang blijft onbekend. `TASKS.md` bevat de externe gates.

## Historische volledige audit — 24 september 2026

De audit van de huidige werkboom staat in [docs/full-audit-2026-09-24.md](docs/full-audit-2026-09-24.md). De onafhankelijke Astra-controle werd door een usage-limiet onderbroken; de concrete bevindingen zijn daarna tegen de code geverifieerd. De automatische controles zijn groen: build, 65 core-tests, 118 webtests, bridgetests, typechecks en harness. De release blijft geblokkeerd door open P1-bevindingen rond corrupte centrale opslag, ontbrekende origin/hostauthenticatie, bronkwaliteitsclaims en financiële snapshotvalidatie. Er is geen Agent C-browser-PASS; historische moduleclaims zijn geen releasegoedkeuring.

## Actualisering — 10 september 2026

De audit hieronder is de historische herstelbaseline van 7 september. De persoonlijke contractpagina en Energiepaspoort v2 zijn inmiddels aanwezig in de lokale webapp; de oude vermelding dat de contractpagina onbereikbaar is beschrijft niet meer de huidige code. Er is nog geen volledige productreleasegoedkeuring.

Task 035 blijft actief. De eindcontrole vond aanvullende fouten in expliciete rapportopslag zonder prijzen, de scheiding tussen nieuwe CSV-data en een bestaand rapport, en het opnieuw openen van resultaten. De gerichte herstelhandoff staat in `TASKS.md`; het bewijs en de uiteindelijke beslissing komen in `REVIEW.md`. De open browserchecklist staat in `docs/task-035-release-check.md`. Contractuitbreiding en Raspberry Pi-deployment volgen pas na de herstelrelease.

## Historisch oordeel — 7 september 2026

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

Actuele netwerkbevinding Task 061 (1 oktober): de huidige pc heeft Wi-Fi-adres `192.168.0.243/24`, gateway `192.168.0.1`; de Pi heeft `192.168.88.253/24`, gateway `192.168.88.1`. Ze zitten in verschillende IPv4-subnets. De directe timeout past bij ontbrekende routering tussen deze netwerken; de routerconfiguratie is niet gecontroleerd of gewijzigd. De pc moet toegang krijgen tot het Pi-subnet (bijvoorbeeld hetzelfde niet-geïsoleerde thuisnetwerk) of een bestaande route gebruiken. De tijdens deze run werkende toegang gebruikt [Home Assistant via Tailscale](http://homeassistant.tail582404.ts.net:8123/hassio/ingress/350f0e24_crems_energy). Er is geen bewijs dat een willekeurig apparaat op het Pi-subnet niet kan verbinden.
