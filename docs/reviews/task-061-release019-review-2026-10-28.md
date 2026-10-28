# Task 061 — beperkte release 0.1.19 — review

**APPROVED voor de expliciet geautoriseerde beperkte0.1.19-update.** Root voert na bronfreeze sequentieel de Agent A-reviewrol uit; dit is geen onafhankelijke subagentreview of nieuwe volledige productaudit. Tijdens deze review zijn geen productiecode/tests/CSS gewijzigd.

Gebruiker autoriseert Pi-update en geeft expliciet uitzondering voor uitsluitend de onafgeronde24uursstabiliteitsmeting en geïsoleerde restoreproef, met behoud van actuele tests, browserreview en verse backup. Die twee operationele gates blijven open; dit besluit claimt geen bewijs dat zij slagen.

## Beoordeelde wijzigingen en criteria

- Volledige relevante productiediff sinds0.1.18 beoordeeld: historycontroller/deadline/retry, dagwisselhooks en App-panelguards; uitsluitend het huidige dagvenster wordt gepubliceerd, verlopen callbacks worden genegeerd, retries begrensd en actuele waarden niet door late vorige-dagdata vervangen. Aansluitende regressietests beoordeeld.
- ChartFrame vraagt fullscreen uitsluitend op het grafiekarticle, behoudt dagkeuze/legenda/waarschuwingen, volgt fullscreenchange, biedt toegankelijke knop en begrijpelijke weigering. Wake Lock alleen actief bij vergrote grafiek, met cleanup inclusief laat terugkerende aanvraag. Geen nieuwe dependency, automatische gegevensopslag of HA-mutatie.
- Fullscreenstyles gebruiken beschikbare hoogte en veilige randen, behouden tijdas en beide assen. Actuele fysieke tabletchecks in beide standen en kandidaatmatrix op375/1280/1340 ondersteunen dit; extra detailtabellen mogen bewust scrollen.
- Beide manifestversies0.1.19 en overeenkomstige versietest; originele Ingress/security/ARM64assertions behouden. Run/Dockerfile/workflow en server-side peer172.30.32.2 blijven ongewijzigd; relevante productie-HTTPtests controleren geneste assets, cache, peerweigering en centrale opslag zonder wildcard-CORS.
- Bestaande context-/documentatieonderhoudsdiff behouden en beoordeeld: begrensde taakselector faalt gesloten, oorspronkelijke architectuurnotities byte-identiek verplaatst (Gitblob48409e5b3cf7e6e470b27dc2eda90de7c4937204), historische taakdocumentatie blijft bewaard. Oorspronkelijke pre-archiveringsbytes van TASKS zijn niet onafhankelijk reconstrueerbaar; geen nieuwe claim daarover. Geen runtime-/berekeningswijziging in dat onderhoud.
- Synthetische QA uitsluitend in genegeerde.harness, niet tracked/build-input; apps/bridge/.env eveneens genegeerd. Docker bouwt uitsluitend apps/packages uit de Gitcheckout. Gerichte secretdetectie vond geen tokens in te publiceren bron-/bewijsbestanden. Geen testdata naar echte centrale opslag gestuurd of echte history overschreven.

## Actueel bewijs

Volledige `pnpm harness check` PASS met stable=true op de huidige fingerprint in `.harness/checks.json`; log `.harness/task061-release019-full-check.log`. Producttests369/369 (core71/bridge111/web187), tooling16/16, structuur/build/typecheck PASS. De eerste poging faalde terecht op de oude0.1.18-versieliteral; uitsluitend die assertion is naar0.1.19 bijgewerkt, alle functionele assertions blijven behouden.

[Kandidaatbrowsermatrix](task-061-release019-browser-2026-10-28.md): zeven scenario's PASS, geen uncaught browsererrors, mobiel/desktop/tabletmaat, focus/Enter/externe fullscreenexit/policyweigering, loading/leeg/fout/retry, expliciet CSV-profielbewaren en refresh. Fysieke Android-back en tabletpassing afzonderlijk bewezen. Geen open product-FAIL binnen deze scope.

Voorcontrole echte Pi:0.1.18 started, Supervisor healthy/supported, reading measured/home-assistant1,509s oud. Echte historie1771afname-/271injectiepunten, geen overeenkomst met synthetische proefreeks. Persoonlijke profiel-/batterijresultaten uitsluitend via hash vastgelegd voor vergelijking na installatie. Protected CREMS-backup3cd147ed van28oktober18:45:20UTC, sleutel lokaal met WindowsDPAPI beschermd; geen restore uitgevoerd. Lokale preflight/backupbewijs `.harness/task061-release019-{preflight,backup}.json`.

## Uitrolgrens

Na versiegebonden harnessgate mag0.1.19 via nieuwe onveranderlijke tag en geslaagde ARM64-workflow gepubliceerd en uitsluitend CREMS bijgewerkt worden, met updatebackup. Na installatie verplicht: exacte versie/assets, geauthenticeerde Ingress/API/SSE, ongeauthenticeerd401, echte historie/bron, identieke veilige resultaten en fysieke tablet-fullscreen/livecontrole. Geen hostherstart, dataverwijdering, restore of providerwijziging geautoriseerd in deze uitrol.
