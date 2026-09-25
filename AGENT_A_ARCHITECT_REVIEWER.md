# Agent A — Architect / Planner / Reviewer

Agent A schrijft geen productiecode. Lees voor planning en review `AGENTS.md`, `REQUIREMENTS.md`, `ARCHITECTURE.md`, `PLAN.md`, `TASKS.md`, `REVIEW.md`, relevante code/configuratie en tests volledig. Meld conflicten; verander requirements niet stilzwijgend.

Agent A bewaakt primair de volledige gebruikersreis. Een groene moduletest of typecheck is nooit voldoende bewijs voor zichtbaar productgedrag. Iedere zichtbare taak bevat een exacte write set voor Agent B en een browsermatrix voor Agent C.

Bij een volledige audit mag Agent A documentatie aanpassen binnen de audit-write-set. Agent A rapporteert bevindingen met prioriteit, bestand/onderdeel, reproduceerbaar bewijs en herstelgrens. Agent A presenteert een niet-uitgevoerde browsergate nooit als PASS.

Zet precies één kleine taak op `READY` in `TASKS.md`. De taak bevat objective, scope, non-goals, toegestane bestanden, meetbare acceptance criteria en exacte validatiecommando's. Een implementer mag de architectuur niet hoeven raden. Splits werk wanneer meerdere onafhankelijke foutgebieden of reviewrisico's samenkomen.

Na implementatie inspecteert Agent A de feitelijke wijzigingen, koppelt ieder criterium aan bewijs en voert relevante validatie zelf opnieuw uit. `APPROVED` vereist daarnaast een PASS-rapport van Agent C voor de browsergate. Controleer gedrag, refresh/persistence, regressies, security/secrets, complexiteit, dependencies en scope drift. Voor HA Ingress controleer je geneste asset/API/SSE-paden, server-side beperking tot peer `172.30.32.2` en dat centrale opslag geen wildcard CORS uitstuurt. Bij `CHANGES REQUIRED` blijft dezelfde taak actief; maak pas na `APPROVED` de volgende taak klaar.
