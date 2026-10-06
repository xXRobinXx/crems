# Task 061 — twee cleanup-rondes

Datum: 2 oktober 2026. Agent A. **CODE APPROVED uitsluitend voor documentorganisatie/planning en passende toolverificatie; gebruikersrelease CHANGES REQUIRED.**

## Ronde 1

Scope vooraf in TASKS vastgelegd met één root-toolwriter en gescheiden Agent A-documentwrite set. Nieuwe repositorykaart naar guides, routeronderzoek naar research en structuurreview naar reviews verplaatst; actieve router/fingerprint/testlinks aangepast. Bestaande release/browserrapporten blijven op hun evidencepaths; geen gebruikersdata, backups, runtimeopslag, QA-logs of gegenereerde evidence verwijderd.

Vorige PLAN is vóór overschrijven via ReadAllBytes/WriteAllBytes volledig behouden in docs/history/implementation-plan-2026-10-01.md. SHA256 van die momentopname:571de11288cf8e4e13400ac11f417b2e44a2cd1889ba30d873b5dad61d72fdf3. De bewaarde tekst houdt haar historische rootrelatieve verwijzingen; docsindex legt dit uit. Nieuw PLAN maakt de Task061-volgorde concreet:0.1.15QA → gated publicatie/backup/Pi → LAN → herstart/rollback → performance. Providerrechten en eventueel App.tsx-splitsvoorstel blijven afzonderlijke backlog; geen tweede actieve taak.

## Ronde 2 — eigen controles

- pnpm test:harness: **12/12 PASS**.
- pnpm check:structure: **PASS**, inclusief HA-mirror/workspace/COPY/export/routergrenzen.
- pnpm harness status: canonieke061 Operationele audit, IN PROGRESS; latere scopes overschrijven dit niet.
- Onafhankelijke lokale Markdownlinkcontrole:12 actuele router/plan/index/moved-reviewfiles,52 lokale links,0 ontbrekende targets. Externe hyperlinks niet opnieuw bevraagd in deze cleanup.
- Drie oude sourcepaden ontbreken; actieve referencescan vindt ze uitsluitend in de expliciete TASKS source→target-moveplanning. Geen dubbele nieuwe documentkopieën.
- Fingerprintdiff inspectie:PLAN/README/docsREADME expliciete inputs; nieuwe map-/researchpaden; PLAN-wijzigingsregressie. Structuurchecker controleert nu ook index/PLAN-links.

Skill crems-workflow staat daadwerkelijk in de actuele developer skillcatalog onder r7. Hiermee is discovery zichtbaar bewezen; geen externe router of globale configuratie geïnstalleerd. Officiële quickvalidate blijft niet uitgevoerd wegens ontbrekende PyYAML; eigen metadata/linkchecks PASS.

## Gates en finalisatie

Geen concrete blocker binnen de organisatorische cleanup. Normatieve inputs na review bevroren; root finale fullharness volgt. Dit rapport is buiten bronfingerprint en maakt geen releaseattestatie. Laatste vastgelegde Pi-baseline blijft0.1.14, kandidaat0.1.15; actuele browser/Pi/LAN/persistence/rollback/providercriteria blijven open. Geen browserbediening of nieuwe deployment/netwerkmutatie uitgevoerd.
## Finale rootchecks

Root rapporteert fullharness voltooid2026-10-02T19:10:22.381Z, stable=true, fingerprint76123503cd2184cfe84c8acd750afaf67bfa1c845157e93518dd24b91abbe15d, alle checkexitcodes0. Harness12/core65/bridge110/web149 plus helper6 = **342 PASS**; structuur/build/typecheckPASS. Finale log:.harness/logs/task-061-cleanup-two-pass.log; helperlog in dezelfde map. Deze volledige run is door root aangeleverd; eigen gerichte verificatie staat hierboven. Normatieve inputs ongewijzigd na freeze. Volledige releasegate mist actuele Agent A/Agent C-attestatie en blijft niet goedgekeurd; geen attestatie in deze cleanup vervaardigd.

## Root-ignoregrensreparatie — 3 oktober 2026

Agent A bevestigde vooraf met git check-ignore dat het ongebonden research/-patroon docs/research/skill-routing-research.md negeerde. Dit was een gemiste cleanupfout: nieuw onderzoek kon uit Gitpublicatie wegvallen. Root ankert nu uitsluitend /archive/ en /research/ aan de repositoryroot en voegt een guard op die bekende patroonvormen toe. Geen echte rootresearch/archive-inhoud gelezen.

Zelfstandige beperkte herreview **CODE APPROVED**: eigen tooltests **13/13 PASS**, echte structuurcheck PASS; git check-ignore geeft voor het docsresearchbestand geen match en gitstatus toont docs/research als nieuw zichtbaar. Synthetische tijdelijke Gitfixture bewijst dat rootarchive/rootresearch uitgesloten blijven, docsresearch zichtbaar is en de vroegere ongebonden vorm juist weer de fout veroorzaakt. Geen concrete resterende blocker binnen deze repair; guard is gericht op de bekende rootpatronen, geen algemene Gitignoreparser.

Normatieve files blijven bevroren; finale rootfullharness vereist vanwege gewijzigde ignore/fingerprint. Geen browser-PASS, releaseattestatie, gitadd/commit, nieuwe Pi-claim of gebruikersdatawijziging vanuit deze review.

### Finale rootchecks ignore-repair

Root rapporteert finale fullharness PASS voltooid2026-10-03T18:36:47.993Z, stable=true, fingerprint d2a0f33f8432b94167663ddce6717329d2ba740f770baf696f5de381d8933a9c; alle5checkexitcodes0. Harness13/core65/bridge110/web149/helper6 = **343 PASS**, inclusief structuur/build/typecheck. Log:.harness/logs/task-061-ignore-repair-final.log en helperlog in dezelfde map. Volledige run is aangeleverd rootbewijs; eigen gerichte13/13 staat hierboven. Browsercontrole loopt nog en is hiermee niet goedgekeurd. Geen normatieve wijziging of attestatie.
