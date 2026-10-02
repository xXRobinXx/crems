# Task 061 — Agent C kandidaatbrowserrapport 0.1.14

Datum: 2 oktober 2026. Uitvoerder: Agent C. Besluit: **PASS voor de lokale publicatiekandidaat**; geen Pi- of LAN-releasegoedkeuring.

## Geteste kandidaat

Verse geïsoleerde productiebridge op `http://localhost:18114`, ook correct genest onder `/api/hassio_ingress/qa-release014/?qaCsv=1`. Assets: `app-8541f0882cb9cdac.js`, `app-cbc1e7a75e6549bb.css`. Root leverde de actuele bronfingerprint `d10a58e5e1b7f58c2a80f8f12d7b9cf621d1d2e7fc71706683b30a5e9a3b04f6`; Agent C berekende die niet afzonderlijk. Agent A controleerde de gebouwde indexassetverwijzingen. Schone origin zonder bewaard profiel/rapport en afzonderlijke synthetische legacy/corrupt/opslagfouttoestanden. Geen gebruikersprofiel of echte CSV gebruikt.

De geautoriseerde browser gebruikte echte 1280×900- en 375×812-viewports. Documentbreedte respectievelijk 1265/360, geen horizontale overflow. Synthetische File circa 12 MB/140.160 rijen, vier registers van 0,1 kWh over UTC-jaar 2025. De zichtbare genegeerde QA-helper leverde de echte File via DataTransfer aan de bestaande productie-inputhandler; productie-JS was ongewijzigd.

## Werkelijk gecontroleerde matrix

| Scenario | Actie en werkelijk resultaat | Status |
|---|---|---|
| Schone start/navigatie | Verse origin zonder profiel; Data/Contract bereikbaar, voorwaarden zichtbaar. | PASS |
| Responsief desktop/mobiel | 1280×900 en 375×812, document past zonder horizontale overflow. | PASS |
| Toetsenbord/focus | Focus zichtbaar; datum met native keyboard bediend. | PASS |
| CSV-preview | Echte synthetische File verwerkt: afname/injectie elk 7.008 kWh, nul schattingen. | PASS |
| Contractovername | Vier velden elk 3.504 kWh; postcode1000/gezin4 behouden; toestemming uit, geen aanbiedersrequest. | PASS |
| Profiel bewaren/refresh | Expliciet bewaard profiel bleef met dezelfde gegevens na refresh aanwezig. | PASS |
| Technisch batterijrapport | Technisch resultaat met 366 Brusselse dagen beschikbaar, geen verzonnen financiële aanbeveling. | PASS |
| Financieel bevestigen/bewaren | Synthetisch contract/offerte bevestigd: nulsparing, negatieve NPV, geen positief advies; volledige bewaring. | PASS |
| Financiële refresh | Gecontroleerd volledig bewaard rapport na afgeronde save en refresh gelijk gebleven. | PASS |
| Datum/capaciteit/periode | Keyboarddatum, 5-kWh-selectie en periodefilter wijzigen detail zonder financiële snapshot te wijzigen. | PASS |
| Ongeldige CSV | Validatiefout veilig zichtbaar; bestaand profiel behouden. | PASS |
| Schattingen/gaten | Onvolledige data zichtbaar; financiële resultaatgate geblokkeerd. | PASS |
| Loading/annuleren/nieuwe selectie | Vertraagde echte File-stream geannuleerd; nieuwe onvolledige 45-minutenperiode1juni verscheen zonder oud jaarresultaat. | PASS |
| Legacy v1/v2 | Onzekerheid zichtbaar, financiële gate dicht; expliciete migratie en refresh werkten. | PASS |
| Corrupte opslag | Herstelstate en lokale cleanup; rapport op Pi niet gewijzigd. | PASS |
| Bewaar-/verwijder-/onbeschikbaarfouten | Savefailure behoudt legacy; removefailure behoudt volledig financieel rapport; onbeschikbare/lege centrale opslag blijft veilig. | PASS |
| Expliciet verwijderen/refresh | Huidig profiel en rapport expliciet verwijderd; reload gaf lege toestand. | PASS |
| Geneste Ingress/errors/privacy | Geneste route laadt gestylde app; zichtbaar gelabelde simulatie ververst. Console-errors `[]`; geen echte identifiers/providerrequest. | PASS |

## Beperkingen en open externe gates

OS-bestandskiezerautomatisering was geblokkeerd door file-URL/extensiepermission; geen browserbeveiliging gewijzigd. De zichtbare genegeerde QA-pagina leverde echte Files via de bestaande App-handler. Een aanvankelijk DOM-only ingevulde datum werkte niet; native keyboardbediening werkte wel. De gewone flows en slow-streamcancel hierboven zijn daarna daadwerkelijk uitgevoerd.

Bij een eerdere directe goto na eerste full-save werd slechts technisch resultaat waargenomen; toen waren lokale bytes en de save-status niet gecontroleerd. Dit bewijst geen dataverlies. Een daarna gecontroleerd afgeronde full-save met refresh behield het volledige financiële resultaat. Geen onmiddellijke centrale-synchronisatiegarantie geclaimd.

Drie screenshots zijn alleen getoond; er zijn geen vastgelegde screenshotpaden om te rapporteren. Viewport na controle hersteld. De actuele Pi-browserattempt werd vóór laden geblokkeerd met `ERR_BLOCKED_BY_CLIENT`; geen login-/securitywijziging of echte datawrite. Pi0.1.14-runtime en fysieke CREMS/LAN-bereikbaarheid zijn niet met dit kandidaatrapport bewezen. Root heeft de bestaande Pi0.1.13 apart read-only via HTTP gecontroleerd; dat is baseline, geen nieuwe release-PASS.
Aanvullende exacte Agent C-details: technische dagdata toont grensdagen92/96 en4/96 expliciet onvolledig; gelijke simultane afname/injectie levert correct nulverschuiving na netting. Verwijderen van de huidige v3 na legacyconversie maakte de afzonderlijk behouden v1 weer zichtbaar; daarna is die lokale v1 expliciet opgeruimd, conform de bestaande per-keysemantiek. Native datumkeyboard wijzigde2025-01-02 en5kWh; periode2025-01-02→2026-01-01 liet de financiële snapshot gelijk. Geneste live-simulatie veranderde351→125. Consolecheck leverde errors[]; alleen Chrome/MetaMask-extensiewaarschuwingen, geen app-consolefouten. Geen browser-netwerk/cachetimingcapture: root-HTTP-controles zijn uitsluitend aanvullend bewijs. De ingebouwde qaCsv-contractpreviewknop vervangt geen echte File-batterijcontrole; de daadwerkelijke productiehandler kreeg in deze matrix een File uit de zichtbare genegeerde fixturehelper.