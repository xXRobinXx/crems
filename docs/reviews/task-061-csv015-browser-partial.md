# Task 061 — kandidaat 0.1.15, beperkte browsercontrole

Datum: 3 oktober 2026. Agent C `/root/csv015_browser_qa`, verslag vastgelegd door root. Status: **PARTIAL; volledige release CHANGES REQUIRED**. Gebruiker autoriseerde voortzetting met “ga door”.

## Geteste kandidaat

Eigen geïsoleerde QA-tab op `http://127.0.0.1:8790/`; productieassets `app-208dc33aa2a0a1b3.js` en `app-cbc1e7a75e6549bb.css`. Root controleerde identieke bytes met de gebouwde kandidaat; Agent C bevestigde assetnamen in de DOM. Bronfingerprint: `d2a0f33f8432b94167663ddce6717329d2ba740f770baf696f5de381d8933a9c`.

QA-backend geeft bewust synthetische HTTP 503-responses. Dit is geen Pi-, Home Assistant-, centrale opslag- of Ingressbewijs.

## Werkelijk uitgevoerd

- Contract CSV-knop opent direct een echte filechooser-event, single-file.
- Annuleren met Escape behoudt Contract en postcode 1000, Brussel, gezin 4, Variabel en betaalvoorkeur Nee.
- Toestemming blijft uit; aanbiedingenknop blijft disabled.
- Desktop 1280×900: leesbaar tweekolomsformulier. Mobiel 375×812: één kolom, gecontroleerde boven- en onderzijde passen binnen breedte. Drie screenshots door Agent C bekeken.
- Tab vanaf CSV-knop focust Postcode met zichtbare focusring.
- Geen vastgelegde CREMS-consolewarnings/errors; wel waarschuwingen van een andere Chrome-extensie. Dit is geen bewijs dat iedere foutafhandeling getest is.
- Viewportoverride hersteld; geen gebruikersvenster overgenomen of browserrechten aangepast.

## Niet uitgevoerd

Geldige CSV verwerken, terugkeer en waarden overnemen, dezelfde CSV opnieuw selecteren, ongeldige/onvolledige CSV, en netwerkbewijs voor geen automatische opslag/providerrequest: **NOT RUN**. Upload werd door browserbediening geblokkeerd omdat de ChatGPT Chrome-extensie geen toegang tot file-URL’s heeft. Native Sky initialiseerde, maar vond geen afzonderlijk identificeerbaar CREMS- of picker-venster; daarom geen native invoer uitgevoerd.

Geautomatiseerde finale controle: 343 tests PASS, structuur/build/typecheck PASS, stable=true, voltooid 2026-10-03T18:36:47.993Z. Dit vervangt ontbrekend browserbewijs niet. Onafhankelijke beperkte codereview staat in [cleanupreview](task-061-cleanup-two-pass-review.md).

## Vervolg

Hervat ontbrekende CSV-cases met synthetische fixtures zodra lokale bestandsselectie beschikbaar is. Browserextensierechten wijzigen vereist afzonderlijke gebruikersautorisatie; geen beveiligingsinstelling omzeilen. Daarna actuele onafhankelijke review en volledige toepasselijke releasegate controleren, vóór publicatie en Pi-update. Geen releaseattestatie, publicatie of deployment uit dit beperkte verslag afgeleid. Laatst vastgelegde Pi-baseline blijft 0.1.14.

## Hervatting — 4 oktober 2026

Agent C kon nu bestanden selecteren, zonder browserrechten of instellingen te wijzigen. Eigen tab 258551992 op dezelfde QA-server; beide assetnamen opnieuw in DOM bevestigd. Eerdere NOT RUN-statussen hierboven blijven historisch.

**CSV-cases PASS:**

- Echte Contract-bestandskiezer selecteert synthetische jaar-CSV en opent Dataanalyse. Periode 1/1/2025 01:00–1/1/2026 01:00; gemeten afname en injectie elk 7.008 kWh, geschat elk 0 kWh.
- Expliciete jaarwaardenovername opent Contract met nog lege registervelden; pas “Vul dag/nachtwaarden in” vult vier registers met circa 3504 kWh elk.
- Dezelfde file opnieuw kiezen start verwerking opnieuw en geeft dezelfde uitkomsten. Postcode 1000, Brussel, gezin 4, Variabel, Nee en gekozen registerwaarden blijven behouden.
- Ongeldige fixture geeft “Lokale controle niet gelukt” en geen jaarwaardenovername.
- Onvolledige fixture 1/6/2026 00:00–00:45 toont gemeten afname/injectie 1/0 kWh en geschat 1/0 kWh. Waarschuwing vereist minstens 364 dagen complete betrouwbare data zonder schattingen of ontbrekende kwartieren; jaarwaardenovernameknop ontbreekt.
- Toestemming blijft uit en aanbiedingenknop disabled. Rapport/Batterij blijft disabled zonder bewaard Energiepaspoort. Geen vastgelegde CREMS-consolewarnings/errors; andere extensiewarnings blijven onderscheiden.

Contract behoudt na ongeldige/onvolledige selectie het eerder expliciet gekozen geldige jaarbestand en diens waarden; onvolledige waarden worden niet gekopieerd. Dit waargenomen gedrag vraagt inhoudelijke reviewerbeoordeling, geen stilzwijgende nieuwe requirement.

**Nog NOT RUN:** netwerkbewijs voor afwezigheid automatische opslag/providerrequest. Disabled controls bewijzen dat niet. Viewport/keyboard niet herhaald op 4 oktober; hun bewijs dateert van 3 oktober op dezelfde assetnamen. Geen actuele volledige release-PASS, Pi/HA/Ingressbewijs of attestatie gemaakt.

## Reviewerbeoordeling bewaard expliciet contractjaar — 4 oktober 2026

Agent A inspecteerde Task060-acceptance (TASKS.md:77), App.tsx:41,98–110,133,184–190,194 en contract-csv.ts:5–11 read-only. Task060 vereist gecontroleerde betrouwbare jaargegevens en expliciete overname; zij eist niet dat een latere mislukte/onvolledige Data-selectie eerder geaccepteerde contractinvoer wist.

App bewaart contractCsvData afzonderlijk van de tijdelijke CSV-preview (App.tsx:41). Alleen useCsvForContract vervangt deze veilige totalen na succesvolle contractCsvTotals-validatie en expliciete gebruikersactie (App.tsx:133); handleFileSelection wijzigt de tijdelijke Dataanalyse maar wist deze eerder gekozen contracttotalen niet (98–110). Contract toont de periode van die gekozen csvTotals en vult registervelden uitsluitend via de expliciete Vul dag/nachtwaarden in-actie (194). Deze actie loopt door updateMarketInput, dat toestemming intrekt en oude marktresultaten wist (190). Contractcomponent start toestemming uit (187). Geen nieuwe onvolledige waarden worden hierdoor automatisch overgenomen.

Het waargenomen behouden van eerder expliciet gekozen geldige jaargegevens na nieuwe ongeldige/onvolledige Data-invoer is daarmee consistent met de bestaande expliciete-acceptancesemantiek; geen concrete requirement- of codeblocker gevonden voor dit beperkte punt. Dit oordeel voegt geen automatische verval-/wisrequirement toe en bevestigt geen opslag/provider-netwerkgedrag. Alleen source-inspectie uitgevoerd; browsercases hierboven zijn Agent C-bewijs.

Resterend: negatief netwerkbewijs voor geen automatische opslag/providerrequest ontbreekt. Disabled/toestemming-uit-controls en deze codeinspectie vervangen dat bewijs niet. Volledige release blijft PARTIAL/CHANGES REQUIRED; geen attestatie of nieuwe Pi/LAN/Ingressclaim.

## Aanvullende netwerkpoging — 4 oktober 2026

Root startte een afzonderlijke synthetische statische server op 127.0.0.1:8791 met dezelfde assetmap en method/path/timestamp-registratie, zonder querystrings of bodies. Log: `.harness/logs/browser015-network-2026-10-04.jsonl`. Alleen negen initiële GET-verzoeken geregistreerd, waaronder beide centrale resultaatreads, prijsreads en stream. Geen mutatie of compare-request vastgelegd.

Deze afwezigheid is **geen PASS**: Agent C bevestigde alleen de geladen Contractpagina, lege velden, toestemming uit en disabled aanbiedingenknop. Een gecombineerde browsertoolcall voor veldinvoer en bestandselectie bleef circa 297 seconden hangen; root onderbrak het agentwerk na uitblijven van voortgang. Eventuele gedeeltelijke uitvoering is onbekend, geen voltooide CSV-analyse op 8791 bevestigd. Netwerk-herhaalgevallen blijven **INTERRUPTED/NOT RUN**. De eerder bewezen functionele CSV-cases op 8790 blijven geldig; dit onderbroken werk sluit de netwerk- of releasegate niet.
