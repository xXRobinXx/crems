# Task 061 — compacte vergrote grafiek — 5 november 2026

## Scope en eigenaarschap

Nieuwe gebruikersopdracht: bij vergroten uitsluitend de grafiek, bovenaan injectie/verbruik/prijs. Root enige schrijver. Write set apps/web/src/App.tsx, apps/web/src/styles.css, apps/web/test/overview-chart.test.ts, apps/web/test/battery-flow-structure.test.ts, TASKS.md en dit rapport. Bestaande andere wijzigingen behouden. FR-001/FR-007 en ADR-001/002/005/007 blijven leidend. Geen nieuwe dependency, opslagmutatie, backendschrijffunctie, manifestwijziging of Pi-update.

## Implementatie

Fullscreen bevat drie actuele waarden in vaste volgorde: Injectie nu, Verbruik nu, Prijs nu (ct/kWh, gepubliceerde spotprijs). Waarden gebruiken bestaande livebron en prijs voor vandaag, onafhankelijk van geselecteerde grafiekdag. Demo/geschat/offline/onvolledig en ontbrekende prijzen krijgen zichtbare kwalificatie; onvolledig nulkanaal wordt geen gemeten nul.

Dagkeuze, grafiektitel, uitlegregels, laagste/hoogste prijs en detailtabellen zijn uitsluitend in fullscreen verborgen. Grafiek, assen en tijdlabels blijven zichtbaar. Kleine44px-terugknop behoudt expliciete toegankelijke naam, toetsenfocus, Enter en synchronisatie na systeemexit. Buiten fullscreen komen alle bestaande bediening en gekozen dag terug. Fout-/onvolledigheidswaarschuwingen en echte retry blijven bereikbaar; ontbrekende gegevens worden niet verzwegen.

Permanente browser-Wake-Lock en verouderd laad-wakkeradvies verwijderd, passend bij de inmiddels apart ingerichte tienminutenregeling. De bewezen hardwareproef van de geïnstalleerde versie staat in [wekrapport](task-061-consumption-wake-2026-11-05.md); dit is geen uitrolbewijs voor deze nieuwe bron.

## Verificatie

- Gerichte component-/grafiekregressies48/48 PASS; nieuwe tests actuele waarden op vandaag/morgen, bronkwaliteit, ontbrekende waarden en geen permanente wake-lock.
- Volledige producttests371/371 PASS: core71, bridge111, web189. Eerste run binnen beperkte uitvoeromgeving faalde op EPERM/EACCES bij tijdelijke bestanden en lokale testverbindingen; volledige herhaling buiten die omgeving exit0. Bewijs .harness/task061-compact-graph-all-tests.log.
- Finale webproductiebuild PASS, volledige workspace-typecheck PASS, structuurcheck PASS, git diff --check PASS. Bewijs .harness/task061-compact-graph-{build,typecheck}.log.
- Finale assets app-377719473ccfaf5f.js en app-26eb34047a5417c4.css.
- Begrensde Agent C-rol, lokale headless Chrome met nieuw profiel per scenario:10/10 PASS. URL http://localhost:18129/qa/frame met geneste synthetische Ingress-prefix /api/hassio_ingress/synthetic-release019/. Fixtureprefix is een testnaam, geen releasegoedkeuring.
-375×812,1280×900,1340×800 en800×1340: actuele3waarden boven SVG, geen dagknoppen/titel/details/extremen zichtbaar, geen botsing met terugknop, geen scroll of afgesneden SVG-/tijdasgrens. Na verkleinen dagkeuze/details zichtbaar en samenvatting verborgen.
- Morgen: prijs-onlygrafiek en waarschuwing nog niet gemeten; actuele meterwaarden blijven onafhankelijk van morgen; dagkeuze behouden na exit.
- Focus/Enter en externe fullscreenexit PASS; geweigerde fullscreenpolicy blijft begrijpelijk en bruikbaar. Loading/leeg/fout: samenvatting blijft zichtbaar; error-retry herstelt vermogensgrafiek. Dit zijn gerichte statesmokes, geen nieuwe volledige opslag-/refreshmatrix.
- Privacyveilige screenshots uitsluitend synthetisch: .harness/compact-graph-mobile.png en .harness/compact-graph-landscape.png. Laatste visueel bekeken landschapsbeeld toont de drie waarden met kleuren die bij de grafieklijnen horen en kleine terugknop.
- Initiële QA-hulpmiddelfouten gecorrigeerd: grenscontrole mat eerst een wrapper inclusief opzettelijke rechterpadding; daarna de echte waardengroep gemeten. Gegenereerd pijlsymbool beïnvloedde toegankelijke knopnaam; productieknop kreeg expliciete aria-label/title, daarna alle10scenario's opnieuw PASS. Geen eerste FAIL als PASS hernoemd.

## Open gates en overdracht

Nieuwe echte tablet-Chromecontrole NOT RUN: automatische goedkeuringsreview blokkeerde starten Chrome/DevTools wegens ontbreken nieuwe expliciete browserautorisatie. Geen alternatieve bediening geprobeerd; toestemming afzonderlijk gevraagd. Tablet bleef op echte HA-CREMS-grafiek; nieuwe bron nog niet geïnstalleerd. Nieuwe tabletcontrole vereist expliciet akkoord; maximaal derde screenshot compact-graph-tablet.png.

Gerichte onafhankelijke review PENDING; geen APPROVED-attestatie vervaardigd. Volledige actuele releaseharness/Ingress-kandidaat-/installatiegates blijven vereist vóór Pi-update, naast de al open stabiliteits-/restore-/providergates. Volgende stap: expliciet toegestane tabletcontrole en eindreview op deze bronfreeze; geen verdere productieaanpassingen zonder gevonden fout of nieuwe gebruikersopdracht.

## Nieuwe expliciet toegestane tabletcontrole — PASS

Gebruiker gaf daarna expliciet toestemming Chrome op de tablet te bedienen en echte app terug te zetten. Eerdere NOT RUN hierboven is de historische stand vóór dit akkoord.

Lenovo TB305FU, Android15, fysiek landschap1340×800. Werkelijk gemeten CSS-viewport1191×516 in grafiek-fullscreen. Lokale productiebuild via USB-reverse18129, URL http://localhost:18129/qa/frame, alleen synthetische fixturegegevens. Dezelfde finale assets als de headlessmatrix.

Acties: open testiframe, vergroten, controleer drie labels/waarden plus grafiek en assen; verkleinen; kies Morgen; vergroten; actuele verbruikswaarde blijft420W terwijl de geselecteerde grafiek morgenprijzen toont; externe fullscreenexit; Morgenselectie behouden. Alle assertions PASS. Dagkeuze/titel/details/extremen/uitleg verborgen; terugknop bereikbaar, SVG-/tijdasranden binnen scherm, scrollHeight<=clientHeight, geen permanente wake-hint. Screenshot .harness/compact-graph-tablet.png visueel bekeken, uitsluitend testgegevens. Exact bewijs .harness/task061-compact-graph-tablet-results.json.

Testtabblad gesloten; tijdelijke reverse18129 en DevTools-forward19224 verwijderd; lokale synthetische testserver gestopt. Eigen HA-wekregel opnieuw on bevestigd. Echte HA-CREMS-app via reguliere appnavigatie teruggezet; nieuwe frontend niet uitgerold.

Begrensde Agent C-rol tablet-PASS voor deze compacte layout, normale/externe exit en dagbehoud. Geen nieuwe claim over algemene opslag-/Ingress-auth-/Pi-installatie-/24uurstabiliteitsgates. Review blijft PENDING tot gerichte eindreview; geen fictieve onafhankelijke attestatie.

Terugkeer nader bevestigd: echte native Companion-app toont Home Assistant live, bijgewerkt19:52:10; daarna bestaande echte grafiek opnieuw vergroot. Dit is terugkeerbewijs voor de geïnstalleerde versie, niet voor de nieuwe lokale grafiekbron.
