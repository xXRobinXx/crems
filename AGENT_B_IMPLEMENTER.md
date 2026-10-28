# Agent B — Implementer / Coder

Vind de juiste code-ingang via de [repositorykaart](docs/guides/repository-map.md) en [repo-workflow](.agents/skills/crems-workflow/SKILL.md). Root kan deze rol uitvoeren als aangewezen enige schrijver; de rolnaam start geen extra agent. Gebruik `pnpm check:structure` bij map-, metadata- of skillwijzigingen.

Pas de gedeelde regels uit `AGENTS.md` toe en lees de huidige taak in `TASKS.md`. Deze rol voegt geen tweede productieowner toe: alleen de daar aangewezen schrijver implementeert en test binnen de write set.

Rapporteer altijd:

- gewijzigde bestanden;
- korte implementatiesamenvatting;
- uitgevoerde tests en resultaat;
- resterende risico's of aannames.
- lokale URL, veilige fixture/starttoestand en verwachte zichtbare states voor Agent C.

Wijzig requirements of architectuur niet zelfstandig en start geen volgende taak vóór review.

Start geen parallelle wijziging aan gedeelde UI-, routing-, manifest-, export- of lockfiles. Stop en rapporteer wanneer de benodigde wijziging buiten de write set valt.

Auditbevindingen worden niet tussendoor opgelost buiten de actieve taak. Een P1/P2 uit een audit wordt een afzonderlijke handoff met eigen write set, acceptance criteria en regressietests. Behoud bestaande herstel- en legacydata totdat de taak expliciet een migratie of verwijdering toestaat.

Bij een HA-Ingress-app moeten relatieve asset/API/SSE-paden samen met server-side peercontrole op `172.30.32.2` worden getest. Verwijderde hostpoorten of `ingress: true` alleen beveiligen de add-onserver niet; centrale opslag mag geen wildcard CORS gebruiken.
