# Task 061 — contract-CSV op het contractscherm

Controle door root, 6 oktober 2026. Root blijft de enige productiewriter binnen de vastgelegde write set. Bestaande implementatie behouden en gecontroleerd; aanvullende componentregressie toegevoegd voor actieve streamcleanup bij verlaten en React-effectherstart.

## Gecontroleerd gedrag

`apps/web/src/App.tsx`, ContractComparisonPage, gebruikt een eigen tijdelijke CSV-controller. De bestandskiezer opent rechtstreeks vanuit de klik. Lezen, annuleren, parserfout, ongeschikt jaar en succesvolle controle verschijnen op hetzelfde contractscherm. Alleen de expliciete knop neemt de vier gecontroleerde dag-/nachtvolumes over. Postcode blijft behouden. Geen automatische opslag of providerwrite.

`apps/web/test/battery-flow-structure.test.ts` controleert selectie, lege selectie, onvolledige input, parserfout, annulering van een trage stream, volledig synthetisch jaar en expliciete overname. Nieuwe test controleert dat effectherstart selectie mogelijk houdt en verlaten de actieve stream annuleert zonder een succesvol resultaat achteraf.

## Actuele verificatie

- Volledige `pnpm test`: PASS (web 156, bridge 111; core eveneens geslaagd).
- `pnpm build` en `pnpm typecheck`: PASS voor alle drie workspaces.
- Importadapter: 4/4 PASS; `pnpm check:structure`: PASS; `git diff --check`: PASS.
- Eerste webtest/build binnen sandbox faalde door esbuild-leesbeperkingen; buiten sandbox herhaald met toestemming van automatische review en geslaagd. Geen codefout uit die eerste poging geclaimd.

## Open gates

Onafhankelijke review van deze CSV-stap: NOT RUN. Dit rapport is eigen verificatie, geen APPROVED-status. Browser: NOT RUN; geen nieuwe expliciete browseropdracht. Preview18121 is niet vernieuwd of gecontroleerd. Geen Pi-uitrol, releaseattestatie of volledige Definition of Done. De eerdere beperkte catalogusreview vervangt geen review van deze CSV-stap of primaire PDFaudit van alle kaarten.
