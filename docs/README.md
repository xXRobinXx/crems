# CREMS documentatie

Begin bij [actuele taken](../TASKS.md), [requirements](../REQUIREMENTS.md), [architectuurbeslissingen](../ARCHITECTURE.md) en [vervolgplan](../PLAN.md). Deze index ordent documenten; zij is geen nieuwe releasegoedkeuring.

## Guides en procedures

- [Repositorykaart](guides/repository-map.md): actieve code, mapgrenzen en routering.
- [Contextbudget](guides/context-budget.md): gerichte contextselectie en afgewogen efficiëntieopties.
- [Harness](harness.md): checks, fingerprint en afzonderlijke attestaties.
- [Home Assistant-release](release-home-assistant.md): kandidaatgate, publicatie, backup en update.
- [HA-ontwerp](task-037-haos-app.md) en [centrale opslag](central-storage-plan.md): bestaande ontwerpgrenzen.

## Onderzoek

- [Skill-routing en Jev](research/skill-routing-research.md): primair brononderzoek, lokale route en ongeteste externe opties.

## Reviews en bewijs

- [Structuur-/routerreview](reviews/task-061-structure-review.md): beperkt code/toolbewijs, geen Pi/browserapproval.
- [Task061 herstelreview](task-061-review.md) en [0.1.15 CSV-review](task-061-csv015-review.md).
- [0.1.14 deployment](task-061-deployment014.md): historische installatie/runtimebaseline.
- [0.1.18 deployment](reviews/task-061-deployment018-2026-10-14.md): vastgelegd installatiebewijs van 14 oktober; controleer TASKS.md voor de nieuwste status en open gates.
- [0.1.14 kandidaatbrowser](task-061-browser014-candidate.md) en [publicatiereview](task-061-release014-review.md): gedateerd kandidaatbewijs.
- [Task060 browser](task-060-browser-report.md) en [review](task-060-review.md): historische0.1.13-evidence.

Historische release-/browserrapporten blijven op hun bestaande paden vanwege evidencebindings. Groene modules of oude rapporten vervangen geen actuele volledige gebruikersgate.

## Geschiedenis

- [Taakhistoriek vóór opschoning op 14 oktober](history/tasks-2026-10-14.md): byte-identiek archief; oude status/ownership is geen actuele opdracht. Relatieve verwijzingen hebben de oorspronkelijke repositoryroot als basis.
- [Oorspronkelijke architectuurnotities](history/architecture-original.md): bewaarde verticale slice; actuele beslissingen staan in ARCHITECTURE.md aan de repositoryroot.
- [Vorig implementationplan](history/implementation-plan-2026-10-01.md): byte-identieke momentopname van het vervangen rootplan, inclusief gedateerde aanvullingen. Relatieve verwijzingen in die bewaarde tekst horen bij haar oorspronkelijke rootlocatie.
- [Audit24september](full-audit-2026-09-24.md) en overige task-*.md: gedateerde bevindingen; actuele openlijst staat in TASKS.

## Plaatsingsregels

| Soort | Map |
|---|---|
| Praktische handleidingen en repositorynavigatie | `guides/` |
| Brononderzoek en evaluaties | `research/` |
| Reviews, browser- en deploymentbewijs | `reviews/` |
| Vervangen plannen en oorspronkelijke ontwerpnotities | `history/` |

Bestaande procedures/ontwerpen in deze map en historische bewijsrapporten houden hun vaste paden vanwege verwijzingen en harnessbindings. Nieuwe documenten volgen bovenstaande indeling. Runtimegegevens, secrets en gegenereerde QA-logs zijn geen documentatiebronnen.
