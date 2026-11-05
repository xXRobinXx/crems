# Task 061 — beperkte grafiekrelease 0.1.20 — eindreview — 5 november 2026

**APPROVED voor de expliciet gevraagde grafiekupdate op de eigen Pi/tablet, onder de hieronder genoemde uitrolchecks.** Root voert na bronfreeze sequentieel de Agent A-reviewrol uit, zoals bij release0.1.19. Dit is geen onafhankelijke subagentreview of volledige productaudit. Tijdens deze review geen productiecode/tests/styles gewijzigd.

## Scope en criteria

Volledige productiediff tegen de geïnstalleerde0.1.19 beoordeeld: ChartFrame/ChartLiveReadings en wiring in App.tsx, fullscreenstyles, twee aansluitende webtestbestanden; beide manifestversies en uitsluitend exacte versietestliteral0.1.20. Geen extra feature, dependency, lockfile-, backend-, provider-, financiële of opslagmutatie. Voorgaande kiosk-/LAN-bewijsdocumentatie hoort bij dezelfde sessie en blijft behouden.

- Gebruikersvraag afgedekt: vergrote grafiek heeft alleen grafiek met actuele injectie/verbruik/spotprijs erboven en toegankelijke terugknop; normale bediening/detailtabellen komen terug bij exit. Geselecteerde grafiekdag blijft behouden; kopwaarden gebruiken livelezing en huidige spotprijs, niet geselecteerde historische/toekomstige grafiekpunten.
- Demo/geschat/offline/onvolledig en ontbrekende actuele prijs zichtbaar onderscheiden. Geen ontbrekend onvolledig kanaal als gemeten nul. Fout-/incompletewaarschuwingen en daadwerkelijke retry blijven zichtbaar. Prijs is expliciet spotprijs in ct/kWh, geen totale factuurclaim.
- Permanente Wake-Lock en verouderde continue-laadwakkerhint verwijderd in overeenstemming met nieuwe500W/tienminutenopdracht. Regressie bewijst dat fullscreen geen permanente wake-lock aanvraagt. Apparaatwekautomatisering is aparte expliciete HA-beheersinrichting; CREMS-code blijft conform FR-002/ADR-002 alleen lezen.
- Fullscreenwijzigingen blijven begrensd tot grafiekarticle; relatieve assets/API/SSE en server-side peercheck exact172.30.32.2 ongewijzigd. Geen wildcard-CORS voor centrale opslag; productie-HTTP/securityregressies opnieuw groen. Geen token/credentials/.env/ruwe runtimegegevens in publicatie-write-set.
- CSS/DOM-diff en tests inhoudelijk beoordeeld: overflow/passende randen en mobiele kop, drie serieskleuren consistent, focus/aria-label/systeemexit, verborgen controls verdwijnen uit tabvolgorde. Alle grafiekreturntakken geven dezelfde actuele samenvatting door.

## Actueel bewijs

Volledige pnpm harness check PASS, stable=true, fingerprint55c68dbb5c02cdc273774c62dc51d12ee01317a9ce89e0e3019e8f6d996d0b28. Producttests371/371(core71/bridge111/web189), gereedschapstests16/16, structuur, alle builds en alle typechecks PASS. Bewijs .harness/checks.json en .harness/task061-release020-full-check.log. Dit is een nieuwe volledige run na bron-/versiefreeze, niet alleen de eerdere compacte-layouttest.

[Actuele browserreview](task-061-release020-browser-2026-11-05.md):12/12nieuwe lokale scenario's PASS, met echte tabletcontrole van identieke finale UI-assets aanvullend. Assets app-377719473ccfaf5f.js en app-26eb34047a5417c4.css. Geen resterende product-FAIL binnen deze scope.

Echte Pi-voorcontrole:0.1.19 started, Supervisor healthy/supported, Home Assistant measured reading0,336soud. Werkelijke historie1758afname-/313injectiepunten, geen match met synthetische proefreeks. Profiel/batterijrapport aanwezig; uitsluitend inhoudshashes lokaal vastgelegd. Verse protected CREMS-backup8b9d14f3 van5november18:58:44UTC bevestigd; sleutel lokaal WindowsDPAPI-beschermd. Voorcontrole .harness/task061-release020-preflight.json en backupbewijs .harness/task061-release020-backup.json.

## Uitrol en grenzen

Gebruiker vraagt expliciet al het nodige te doen tot de tablet nieuwe weergave toont. Na versiegebonden gate nieuwe onveranderlijke v0.1.20-tag, geslaagde ARM64-workflow en registrydigest; uitsluitend CREMS-update met updatebackup. Daarna verplicht: geïnstalleerd0.1.20/started, exacte UI-assets, Ingress/API/SSE/unauthenticated401, bronactualiteit, identieke beide veilige resultaten en echte tablet-fullscreen/3livewaarden. Geen hostrestart, productie-restore, verwijdering of providerwijziging.

Deze goedkeuring is beperkt tot de gevraagde grafiekrelease. Eerder niet-bewezen24uursstabiliteit, geïsoleerde HAOS-restore en providerrechten blijven open; geen algemene operationele vrijgave en geen afgevinkte onbekende tests. Voorgaande0.1.19-uitzondering wordt niet als nieuw testbewijs opgevoerd. Bestaande operationele auditpunten blijven zichtbaar.

## Afsluitende binding na installatie

Gevraagde echte tabletuitrol0.1.20 nu PASS: [deploymentbewijs](task-061-deployment020-2026-11-05.md). Productiecode/configuratie is byte-inhoudelijk ongewijzigd ten opzichte van immutable v0.1.20; alleen afsluitende taak-/bewijsdocumentatie toegevoegd. Volledige closeout-harness opnieuw371product/16tool, structuur/build/typecheck PASS, stable=true, fingerprintf66bc2a6f1c1e44053508db6c0305e1cc1aa208bbe23f413df3f665d5d07edcf. Dit bindt de actuele taakstatus; de gepubliceerde bronfingerprint en eerdere browsertijdstippen hierboven blijven expliciet historisch versiegebonden. Echte post-update native tabletcontrole en slaap→wekken PASS zonder extra productieaanpassing. Definitieve status blijft de hierboven begrensde goedkeuring;24uur/restore/provider niet afgevinkt.
