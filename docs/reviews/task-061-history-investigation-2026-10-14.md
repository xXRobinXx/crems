# Task 061 — read-only onderzoek verbruiksgeschiedenis

Datum: 14 oktober 2026. Onafhankelijke subagent, uitsluitend codeonderzoek en synthetische tests. Root blijft enige schrijver van productiecode. Geen browser, persoonlijke runtimeopslag, credentials, Home Assistant-aanroepen of deployment gebruikt.

## Bevindingen

1. **P2 — gisteren herstelt niet zelfstandig na tijdelijke fout.** `apps/web/src/power-history-controller.ts:54–65`: een identieke selectie wordt overgeslagen; alleen vandaag krijgt een timer. Synthetische eerste mislukking gevolgd door `update(true, "yesterday")` geeft exact `calls=1`, `timers=0`, `status=error`. `App.tsx:291` toont dan de veilige fouttekst. Er is geen herhaalactie bij die tekst. Een dagwissel, liveverbindingwissel of paginareload kan een nieuwe aanvraag veroorzaken, maar dezelfde selectie herstelt niet zelfstandig. Kleinste herstel: begrensde herhaling voor mislukte gisterenrequests, stoppen na succes en bij dispose/selectiewissel. Succesvolle gisterenhistory hoeft niet elke 30 seconden opnieuw opgehaald te worden.

2. **P2 — oude dagdata blijft success na middernacht en een mislukte refresh.** `apps/web/src/power-history-controller.ts:33–48`: `selected` wordt opnieuw berekend, maar `lastData` blijft ongeacht het dagvenster behouden. Synthetische klok begint op `2026-10-14T21:59:30Z`, de eerste todayrequest slaagt, daarna wordt de klok `2026-10-14T22:01:00Z` en faalt de refresh. Resultaat: nieuw geselecteerd begin `2026-10-14T22:00:00.000Z`, gepubliceerd databegin `2026-10-13T22:00:00.000Z`, status `success`, `refreshError=true`. `App.tsx:279–280` berekent datumtitel/displayvenster opnieuw; details blijven de oude meetpunten bevatten. Kleinste herstel: oude data alleen voor hetzelfde Brusselse dagbegin gebruiken; bij nieuwe dag data onmiddellijk ongeldig maken, inclusief late succesvolle requests uit de vorige dag. Geen grafiekdata toevoegen of extrapoleren.

3. **Begrenzingsgat — browserrequest heeft geen deadline.** `apps/web/src/power-history.ts:59–64` gebruikt uitsluitend het meegegeven abortsignaal; de controller beëindigt dat alleen op volgende fetch, selectiewissel of dispose. Een hangende gisterenrequest blijft dus loading tot een gebruikers-/verbindingswijziging. De bridge heeft per upstreamcall wel acht seconden timeout (`meter-source.ts:125`), maar die begrenst geen hangende browser→bridgeverbinding of responsbody. Advies: een expliciete clientdeadline met cleanup en geen overlappende requests; herstel pas na beëindiging van de vorige aanvraag. Codebewijs; geen echte hangende Pi-verbinding gesimuleerd.

## Gerichte verificatie

- `node --test test/power-history-controller.test.ts test/power-history.test.ts` vanuit `apps/web`: **11/11 PASS**.
- `node --import tsx --test test/history.test.ts test/power-history.test.ts test/power-history-route.test.ts` vanuit `apps/bridge`: **25/25 PASS**. Eerste sandboxrun kon de TypeScript-runner niet starten wegens `uv_os_get_passwd ENOMEM`; de toegestane herhaling buiten sandbox slaagde. De eerste fout was geen testassertion of appfout.
- Eenmalige Node-proef via stdin importeerde de werkelijke controller en dagwindowselector, injecteerde klok/loader/timer en assertte de twee hierboven vermelde resultaten. Geen test- of productiebron gewijzigd.
- Bestaande tests bewijzen veilige upstreamfoutmapping, GET-only, begrensde vensters inclusief 25-uurs-DST-dag, no-store, geen wildcard CORS, normalisatie en stale-responsebescherming na selectiewissel. De gevonden recovery-/middernachtgevallen ontbreken in de huidige tests.

## Minimale aanvullende regressies

- Gisteren: eerste request faalt, herhaling slaagt zonder andere dagselectie; vervolgens geen periodieke zware herlaadcyclus.
- Hangende request/deadline, geen overlap, cleanup na succes/fout/dispose, late resolve/reject genegeerd.
- Vandaag: succesvolle data behouden bij fout binnen dezelfde kalenderdag, met refreshwaarschuwing; na middernacht geen data van vorige dag gebruiken, ook niet wanneer een oude request pas later slaagt.
- Gisteren/morgen wisselen, disabled, React-effectherstart en exact middernacht blijven correct.
- Responscontract en aangevraagd tijdvenster blijven overeenkomen; geen data buiten venster presenteren.

## Bewijsgrenzen

De werkelijke oorzaak van de gemelde intermitterende Pi-historyfout is **niet vastgesteld**. De UI gebruikt dezelfde veilige melding bij transportfouten, niet-200-responses, JSON-fouten en validatiefouten. De bridge kan tijdelijke bronuitval en timeouts teruggeven. Zonder actuele read-only transportdiagnose mag geen van deze oorzaken als vastgesteld worden gepresenteerd. Deze bevindingen bewijzen concrete hersteltekorten in de client, geen verklaring van de oorspronkelijke live fout.

Geen volledige releasegoedkeuring: browser **NOT RUN**, review van een eventuele reparatie nog vereist. Historische browser-PASS van 0.1.18 bewijst nieuw gedrag niet. Fysiek LAN, echte Supervisorrestore/rollback, hostherstart en langdurige hardwarestabiliteit vallen buiten dit historyonderzoek.
