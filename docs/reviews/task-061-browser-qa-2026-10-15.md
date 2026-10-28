# Task 061 — lokale browser-QA, 15 oktober 2026

Resultaat: PARTIAL / BLOCKED. Geen volledige Agent C-PASS of releasegoedkeuring. Root voerde de QA-rol uit zonder productiecode te wijzigen en legt nu de handoff vast. Geen onafhankelijke review of subagent gestart. Gebruiker gaf in deze chat expliciet toestemming voor lokale desktop-/mobielbrowser-QA.

## Omgeving

Codex in-app browser; desktop 1280 × 900, mobiel 375 × 812. Geteste kandidaat uit de geslaagde harnessrun met fingerprint `0ba2c7fbb0440923a3b8527c5d70666e067635c8caca6aa8601da11f9c911270`. Alleen de taakdocumentatie verandert na QA; automatische bewijsbinding wordt opnieuw uitgevoerd.

H = http://127.0.0.1:18123/ met controlepaneel /qa; C = http://127.0.0.1:18122/qa-app.html met bestaande synthetische CSV-invoerhelper. Eerste historiecontrole op http://127.0.0.1:18122/. `.harness/task061-qa-server.mjs` is een genegeerde QA-fixture, geen build-input. De fixture bootst Home Assistant/measured-transportvelden na: alle energie is synthetisch, geen echte HA-meting. Geen persoonlijke runtimeopslag, provider of productie-Pi benaderd. Geen productiewijziging of uitrol.

## Uitgevoerde scenario's

| Scenario / URL / viewport | Start en acties | Verwacht en werkelijk / resultaat |
|---|---|---|
| Handmatig herstel; 18122/; desktop | Eerste vandaag-aanvraag 503; klik retry | PASS: juiste vandaag-grafiek verschijnt; retry verdwijnt |
| Automatisch gisterenherstel; H; desktop | Mode first-error resetten; gisteren selecteren | PASS: fout en daarna succes; aanvragen 08:12:12.446Z en 08:12:42.475Z (30,029 s), beide venster 13 okt 22:00Z–14 okt 22:00Z; om 08:34:57Z nog slechts twee aanvragen; maximum actief 1; juiste gisteren-grafiek zichtbaar |
| Deadline; H; mobiel | Mode hang; vandaag selecteren | PASS: loading zonder vorige daggrafiek; start 08:35:01.797Z, gesloten 08:35:11.808Z (10,011 s); daarna fout en retry |
| Toetsenbordherstel; H; mobiel | Tab van vandaag via morgen naar retry; mode success; Enter | PASS: focus op retry, zichtbare outline auto 1px; Enter toont loading, daarna vandaag-grafiek zonder retry |
| Layout/navigatie; 18122/ en H; desktop/mobiel | Overzicht, Data en Contract openen; viewport wisselen | PASS voor bekeken states: geen horizontale overloop op 375/1280; zonder profiel Rapport/Batterij disabled met uitleg; Data en Contract bereikbaar |
| Morgen; 18122/; desktop | Morgen selecteren | PASS voor ontbrekende prijsbron: Gepubliceerde spotprijs met prijsfout; geen toekomstige vermogensgrafiek |
| Onvolledige CSV; H; desktop | Native bestandskiezer, synthetische incomplete CSV | PASS: 1 kWh gemeten en 1 kWh geschat apart; betrouwbare jaarinvulling geblokkeerd. Toolaanroep duurde 1353 s: geen performance-PASS voor de bestandskiezer |
| Ongeldige CSV; C; desktop | Data; helper Upload synthetisch ongeldig CSV | PASS: veilige fout Lokale controle niet gelukt; geen ruwe inhoud of identifiers |
| Volledig testjaar; C; desktop | Helper Upload synthetisch testjaar | PASS: voortgang 34%/99%, daarna 7008 kWh afname en injectie, 0 geschat; jaarwaardenactie beschikbaar |
| Annuleren; C; desktop | Langzame jaarupload; Annuleren; nieuwe incomplete upload | PASS: verwerking stopt zonder resultaat; volgende incomplete upload slaagt |
| Onvolledige batterijdata; C; desktop | Incomplete CSV; Bekijk batterijpotentieel | PASS: technische simulatie gelabeld, 2/96 kwartieren, 1 geschat en 1 gat; financieel advies expliciet geblokkeerd |
| Lokaal rapportbehoud; C; desktop/mobiel | Bewaar technisch batterijrapport; refresh; Batterij openen | PASS lokaal: rapport blijft, synchronisatiefout eerlijk gemeld; centrale lege bron overschrijft lokale kopie niet; dagtotalen beschikbaar, bronbestand vereist voor kwartiergrafieken |

## Onderbroken en niet bewezen

- Blijvende fout: eerste twee aanvragen op 08:35:31.306Z en 08:36:01.329Z gezien. Daarna controlpagina herhaaldelijk `ERR_NO_BUFFER_SPACE`, ook na hernavigatie en nieuwe tab. Geen PASS voor precies drie retries, stop na uitputting of budgetreset. Geen productiebug uit deze infrastructuurfout afgeleid.
- Lege succesvolle historyrespons, dagwissel tijdens vertraagde aanvraag, dispose/cleanup, refreshfout met behouden vandaag-reeks en Brusselsmiddernacht: browser NOT RUN; automatische tests zijn afzonderlijk bewijs.
- Volledige profiel-/rapportreis met echte centrale opslag, legacy en verwijderflows: NOT RUN. Resultaatfixture retourneert alleen een lege bron; geen bewijs van echte serveropslag.
- Echte Ingress-browsercontrole, LAN, hostherstart, backup/restore/rollback, langdurige hardwarestabiliteit en prijs/providerhappy-path: NOT RUN.
- Privacy: bekeken schermen en screenshots bevatten alleen synthetische waarden, geen identifiers/tokens. Geen volledige browser-netwerk- of opslagpayloadinspectie; geen algemene privacy-PASS.

## Drie privacyveilige screenshots

Onder `C:/Users/Robin/.codex/visualizations/2026/10/15/01a13e94-c023-7940-b4e2-c016a9a7ed88/`:

- `task061-mobile-error.jpg`: mobiele historyfout en retry.
- `task061-desktop-saved-report.jpg`: bewaard technisch rapport op desktop.
- `task061-mobile-saved-report.jpg`: bewaard technisch rapport op mobiel.

Vervolg: QA-netwerkblokkade oplossen en ontbrekende scenario's afronden; daarna volledige onafhankelijke review en geldige browserattestatie voor dezelfde kandidaat. Viewportoverride teruggezet en werkende testtabs gesloten. Tijdelijke servers worden gestopt; synthetisch lokaal rapport blijft voor reproductie in de testorigin. Root blijft enige productieowner met de bestaande write set.

Eindcontrole na taakactualisering: volledige pnpm harness check PASS (380 tests, build, typecheck, structuur). Log: .harness/task-061-check-2026-10-15-browser.log. Releasegate blijft NOT APPROVED wegens ontbrekende actuele Agent A-APPROVED en Agent C-PASS.
