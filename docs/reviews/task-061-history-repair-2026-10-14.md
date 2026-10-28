# Historieherstel — 14 oktober 2026

Root neemt met expliciete gebruikersbevestiging het eerder aan Astra toegewezen eigenaarschap over. Teamcontrole vond geen actieve subagent; de werkboom bevatte geen historyreparatie. Eén schrijver en begrensde write set staan bovenaan TASKS.md. Onderzoeksrapport blijft historische read-only evidence.

## Gedrag en bewijs

- Gisteren: eerste aanvraag plus maximaal drie retries op 30 s, uitsluitend na fout; timer stopt bij succes of uitgeput budget.
- Vandaag: 30 s refresh blijft behouden; een lopende aanvraag wordt niet door een nieuwe refresh overlapt. Deadline van 10 s abort de aanvraag, publiceert veilige fout/recoverystatus en negeert late antwoorden. Abort geldt ook voor het lezen van de responsbody via het bestaande loadersignaal.
- Kalenderdag: cached data is alleen bruikbaar bij hetzelfde Brusselse dagbegin; overgang wist oude data. Een oud succes dat na middernacht aankomt wordt niet gepubliceerd. Een fout binnen dezelfde dag mag de eerdere data met refreshwaarschuwing behouden.
- Selectie/dispose ruimt refresh- en deadlinetimers op en abort de aanvraag. React-effectherstart en future/empty blijven gedekt. Responsvenster moet overeenkomen met het aangevraagde venster.

Controller gewijzigd; hook hoeft niet te veranderen omdat bestaande dependencies compatibel blijven. Deadlinefuncties zijn injecteerbaar voor synthetische regressies en gebruiken standaard de platformtimers. Geen dependency, backend, opslag, provider of manifest gewijzigd.

Verificatie: gerichte controller/power-history-tests 16/16 PASS; volledige websuite 178/178 PASS; webtypecheck PASS; webproductie-assets build PASS. Regressies omvatten retrybudget, stop na succes, deadline, late succes/reject, cleanup, no-overlap, refreshfout binnen dezelfde dag en Brussels rollover. De timers zijn synthetisch; geen echte Pi-netwerkuitval vastgesteld of verklaard.

## Open gates

### Vervolgcontrole na “ga door”

Gebruiker autoriseert een onafhankelijke read-only reviewer en lokale browserbediening expliciet. Root blijft sole writer. Aanvullende regressie reproduceerde een reeds ingeplande today-refreshcallback na dispose/selectiewissel; sequencecontrole vóór iedere fetch voorkomt nieuwe aanvragen en publicaties uit oude callbacks.

Onafhankelijke reviewer `history_review` vond één P2: een succesvolle gisterenaanvraag over middernacht bleef na verwerping loading zonder heraanvraag. Hersteld door na requestcleanup het actuele dagvenster opnieuw op te vragen; nieuw kalenderdagvenster reset retrybudget. Nieuwe gerichte regressie bewijst correcte vensterkeuze en succes zonder resterende timers.

Herreview: **CODE REVIEW PASS**, geen verdere actionable findings binnen controller/hook/loader/retry/deadline/overlap/cleanupscope; onafhankelijk gerichte controller/parser/dagvenstertests **30/30 PASS**. Root actuele gerichte tests **18/18 PASS**; finale websuite **180/180 PASS**, typecheck en assetbuild PASS. Geen volledige APPROVED: browser ontbreekt.

Browser **BLOCKED / NOT RUN**, ondanks gebruikersautorisatie: `cua.getState()` faalt bij initialisatie met “failed to write kernel assets: The system cannot find the path specified (os error 3)”; sessiereset en één herhaling geven dezelfde fout. Geen pagina bekeken/bediend, geen screenshot of browserbewijs geproduceerd. Volgende stap: browsertool herstellen en lokale desktop/mobiel historymatrix uitvoeren; daarna releasegate voor dezelfde kandidaat.

Onafhankelijke review NOT RUN; actuele browser NOT RUN (geen nieuwe browseropdracht voor deze reparatie). Geen volledige APPROVED, release, deploy of nieuwe Pi-versie geclaimd. Bestaande 0.1.18-browserbewijs valideert dit nieuwe gedrag niet. Fysieke LAN-route, hostherstart/resultaatbehoud, echte restore/rollback en langdurige stabiliteit blijven afzonderlijk open. Geen toegestane restore uitvoeren zonder actueel herstelpunt.

Volgende stap: onafhankelijke review van deze diff en acceptance criteria; concrete herstelpunten verwerken, daarna actuele expliciet geautoriseerde browserregressie op de bevroren kandidaat. Volledige releasechecks pas bij releasevoorbereiding; relevante wijzigingen maken oude fingerprints ongeldig.
