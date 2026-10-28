# CREMS contextbudget

Onderhoudstap 14 oktober 2026: gebruiker vraagt minder tokens per projectprompt. Root schrijft uitsluitend AGENTS.md en dit document; geen productiecode, eigendomsoverdracht, browser, release of globale configuratie. De actieve historie-write set in TASKS.md blijft leidend. Dit document is geen nieuwe requirement of onafhankelijke APPROVED-review.

## Bevindingen

Vervolgautorisatie “pas toe waar relevant”: write set uitgebreid met `.agents/skills/crems-workflow/SKILL.md`, `AGENT_A_ARCHITECT_REVIEWER.md`, `AGENT_PLAYBOOK.md` en `docs/guides/repository-map.md`. Root blijft uitsluitend instructie-/documentatieschrijver; productieownership in TASKS.md blijft behouden.

Toegepast: UI-route begint bij controller/client en relevante wiring; routeronderzoek alleen bij routervragen; reviewer leest actuele toepasselijke bronnen en de volledige relevante wijziging in plaats van standaard alle historische documenten; overdracht bevat eigenaar, volgende stap, laatste teststatus en bewijslinks. Geen nieuw framework, index, provider, globale instelling of automatische compactie toegevoegd.

Verificatie van dit vervolg: structuurcheck en `git diff --check` PASS. Skill-validator geprobeerd maar niet uitvoerbaar met de aanwezige standaard-Python wegens ontbrekende PyYAML; geen dependency geïnstalleerd. Frontmatter en routerlinks vallen ook onder de geslaagde repositorystructuurcheck, maar deze vervangt geen volledige skill-validator of gedragsreview. Onafhankelijke review NOT RUN; eerdere 12/13-harnessuitkomst is historisch bewijs vóór deze instructiewijzigingen, geen actuele releasegoedkeuring.

- TASKS.md was bij inspectie 132.495 bytes. De eerste scope bevat de actuele gedelegeerde historie-write set; veel latere secties beschrijven oudere Task 061-stappen. Volledig lezen voor iedere prompt geeft onnodige historische context en risico op verouderde status.
- AGENT_PLAYBOOK.md bevat al acht efficiëntieregels, waaronder gerichte tests en korte voortgang. Die waren niet rechtstreeks zichtbaar in de standaardregels. AGENTS.md maakt gericht lezen en hergebruik nu expliciet.
- De workflowrouter en repositorykaart bestaan al. Nog een router, skill of statusbestand zou extra instructies en synchronisatiewerk veroorzaken.
- De eerste brede inspectie in deze onderhoudstap werd afgekapt: concreet bewijs dat begrensde uitvoer ook bij deze audit nodig is.

## Standaard werkwijze

### Modelverdeling — gebruikersvoorkeur 14 oktober 2026

- **GPT-6.1 Sol, medium:** standaard voor dagelijkse ontwikkeling, gewone bugs en tests.
- **GPT-6.1 Sol, high:** lastige historie-, opslag- of verbindingsproblemen.
- **GPT-6 Astra, high:** gerichte onafhankelijke eindreview of een hardnekkige fout.
- **GPT-6 Luna:** eenvoudige documentatie en kleine, duidelijk afgebakende wijzigingen.

Bij één model: GPT-6.1 Sol op medium. Dit is een vastgelegde aanbeveling op verzoek van de gebruiker, geen automatische modelwissel, subagentautorisatie of wijziging van globale instellingen. Bestaande taakownership en expliciete modelkeuzes blijven leidend. Pi-/browser-/releasebewijs blijft vereist ongeacht het model; de verdeling is geen gemeten CREMS-kostenbenchmark.

1. Hergebruik geldige chatcontext; controleer werkboom en actuele taakscope voor wijzigingen.
2. Lees bij een nieuwe chat eerst de bovenste circa 30 regels van TASKS.md. Is scope/ownership onduidelijk, zoek de relevante headings en lees de nodige secties. De eerste regels zijn een ingang, geen harde afkapgrens.
3. Zoek toepasselijke requirements/ADR's en kies één repositoryroute en rol. Lees de betrokken code en gedragsregressies; volg afhankelijkheden wanneer nodig.
4. Vraag alleen ontbrekende informatie die uitvoering daadwerkelijk blokkeert. Los gewone omkeerbare implementatiekeuzes binnen de scope zelf op.
5. Gebruik gerichte tests tijdens de wijziging en verplichte eindchecks volgens playbook/harness. Sla bewijs op en verwijs er kort naar; dump geen volledige logs in de chat.
6. Bewaar bij overdracht alleen actuele eigenaar/write set, concrete volgende stap, relevante bewijslinks en open gates in de bestaande taak. Controleer bronbewijs vóór releaseclaims.

## Brainstorm en prioriteit

| Idee | Besluit / reden |
|---|---|
| Alleen nieuwste taak plus relevante secties lezen | Nu standaard; grootste concrete contextbron is de taakhistorie |
| Ongewijzigde instructies binnen dezelfde chat hergebruiken | Nu standaard; opnieuw lezen alleen bij wijziging of onzekerheid |
| Headings en functienamen zoeken vóór inhoud lezen | Nu standaard; gerichte fragmenten verminderen irrelevante uitvoer |
| Testlogs tot resultaat en fouten beperken | Nu standaard; volledige logs blijven beschikbaar als bewijs nodig is |
| Geslaagde checks niet zonder aanleiding herhalen | Nu standaard; verplichte eindgates blijven behouden |
| Korte antwoorden en overdrachten | Nu standaard; uitgebreid alleen op verzoek of waar nodig voor beoordeling |
| Bestaande routekaart gebruiken | Nu standaard; geen tweede router of herhaalde repository-audit |
| Subagents alleen voor concrete noodzakelijke deelvragen | Alleen bij autorisatie; extra agentcontext en overlap vermijden |
| TASKS.md historiek archiveren | Later afzonderlijk beoordelen; taakparser en bewijslinks moeten behouden blijven |
| Automatische actuele taakuittreksel-tool | Later alleen bij herhaald selectieprobleem; vereist parsertests en eigen write set |
| Grote App.tsx opsplitsen | Alleen binnen toekomstige gerichte refactor; contextwinst bewijst geen noodzaak nu |
| Dubbele regels in rolbestanden samenvoegen | Later conflict-/dekkingsaudit; regels niet op basis van woordenaantal verwijderen |
| Kleinere modellen / lagere reasoning voor routinewerk | Gebruikerskeuze na taakgerichte vergelijking; geen instelling stilzwijgend wijzigen |
| Nieuwe chat bij een afgeronde, andere taak | Praktische optie; eerst beknopte overdracht zodat ownership en gates behouden blijven |
| Minder irrelevante plugins/tools | Alleen na aparte keuze; andere projecten kunnen die gebruiken |
| Prompt caching / externe router / nieuwe provider | Geen implementatie; productafhankelijk, extra complexiteit en mogelijk externe gegevensoverdracht |
| Vast hard tokenmaximum voor elke opdracht | Niet gebruiken als vervanging voor correcte uitvoering; complexe fouten vragen soms meer context |
| Requirements/tests/browsergates schrappen | Afgewezen; besparing mag geen kwaliteitsbewijs vervangen |

## Meten zonder schijnprecisie

### Uitvoering van de 18 ideeën

Vervolg “werk uit”: idee9 uitgevoerd. De volledige TASKS.md is vóór wijziging byte-identiek bewaard in docs/history/tasks-2026-10-14.md (SHA256 gelijk vóór herschrijven). Actuele TASKS.md is teruggebracht van135.603 naar2.660bytes, circa98% minder bestandstekst; dit is geen gemeten tokenbesparing. Scope, owner/write set, acceptance, laatst bekende test/reviewstatus, browserblokkade en operationele open gates blijven expliciet. Een canonieke taakkop/status voorkomt UNKNOWN in de bestaande harnessparser; die leest uitsluitend de actuele taak. Historische taaklijst is gericht bereikbaar via de index. Geen bewijsrapport verplaatst.

Idee12 begrensd uitgevoerd: implementerrol verwijst voor gedeelde regels naar AGENTS.md en actuele eigenaar in TASKS.md; zij claimt niet langer zelf een concurrerende productieowner. Security-, Ingress-, legacy- en review/browserverplichtingen blijven behouden. Brede herschrijving van rolbestanden levert geen bewezen verdere winst en is niet uitgevoerd.

Verificatie archivering: 11 harness/contexttests PASS, structuurcheck PASS, actuele status061 correct zichtbaar. Index-/archiefverwijzingen behouden; root-relatieve verwijzingen binnen snapshot worden expliciet als historisch gedocumenteerd. Onafhankelijke review van deze onderhoudsstap NOT RUN; historie-code-review blijft begrensd tot de code, geen releaseapproval.

Gebruiker autoriseert starten met deze lijst. Ideeën 1–8 zijn als werkwijze vastgelegd; dit is geen bewezen automatische naleving of gemeten besparing. Idee13 (modelverdeling) is opgeslagen, zonder instellingen te wijzigen. Idee14 (nieuwe chat bij andere taak) blijft een praktische keuze van de gebruiker.

Idee10 is nu geïmplementeerd: `node tools/task-context.mjs` (ook `pnpm context:task`) toont alleen de eerste actuele taaksectie uit TASKS.md met eigenaar/write set en open gates. Bij ontbrekende taak/write set faalt de tool expliciet. Historische gelijkgenummerde reviews worden niet als actuele goedkeuring gelezen. De tool leest geen runtimegegevens en schrijft niets. Twee synthetische regressies PASS; opgenomen in test:harness. Structuurcheck PASS. Dit is een begrensde selectiehelper, geen vervanging van requirements, ADR's, actuele diff of bewijscontrole.

Volgorde resterend: idee9 eerst onderzoeken op harness-/evidencebindings vóór archiveren; idee12 alleen aantoonbare duplicatie samenvoegen met behoud van verplichtingen. Idee11 (App.tsx-refactor) vraagt eigen productie-write set en actuele browserregressies en wacht tot historie is vrijgegeven. Idee15 (plugins) vereist een concrete gebruikerskeuze wegens gebruik door andere projecten. Idee16 (caching/router/provider) alleen evalueren bij bewezen behoefte; niets extern installeren of versturen. Idee17 en18 blijven afgewezen als kwaliteitsverlies. Geen automatische complete uitvoering van uitgestelde/afgewezen brainstormopties.

De bytes hierboven meten bestandsgrootte, geen tokens of facturatie. Minder gelezen tekst is een concrete vermindering van aangeleverde context; de echte totale besparing is nog niet gemeten en kan per taak verschillen.

Vergelijk bij enkele soortgelijke toekomstige opdrachten beschikbare gebruiksmetingen, aantal gelezen fragmenten, herhaalde checks en herstelrondes. Gebruik alleen werkelijk beschikbare tokenmetingen; geen tokens afleiden uit tijd, bytes of accountpercentages. Houd kwaliteit en eindgates gelijk. Geen automatische monitoring of API-verzoeken toegevoegd.

Officiële uitleg over projectinstructies: [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md). Deze lokale regels beïnvloeden de werkwijze; ze verwijderen geen door de app meegegeven systeem-, tool- of gesprekcontext.

## Verificatie van deze onderhoudstap

### Vergelijking met populaire GitHub-projecten — 14 oktober 2026

Selectie: vier veelgebruikte projecten voor coding agents en ontwikkelworkflows, met afgeronde stars uit hun GitHub-pagina's. Dit is een relevante steekproef, geen bewezen wereldwijde top vier; topiclabels zijn onvolledig en de tellingen veranderen. Stars zijn geen benchmark voor tokens of kwaliteit. README/documentatie en het Spec Kit-implementatietemplate zijn onderzocht; geen volledige code-/securityaudit of installatie.

| Project / waargenomen stars | Controleerbare bron en mechanisme | Beoordeling CREMS |
|---|---|---|
| [OpenCode](https://github.com/anomalyco/opencode), circa 213.400 | [Config](https://opencode.ai/docs/config/#compaction): automatische compactie en optioneel verwijderen van oude tooluitvoer | Bevestigt belang van beperkte uitvoer; deze OpenCode-instellingen zijn niet hier geïnstalleerd of overdraagbaar naar Codex |
| [Claude Code](https://github.com/anthropics/claude-code), circa 150.800 | [Kostenrichtlijnen](https://code.claude.com/docs/en/costs): kleine basisinstructies, gespecialiseerde skills op aanvraag, gerichte context; subagentverbruik telt mee | Bestaande router behouden; geen extra permanente instructiebundel. Overdracht krijgt expliciete laatste teststatus |
| [Spec Kit](https://github.com/github/spec-kit), circa 141.200 | [Implementatietemplate](https://github.com/github/spec-kit/blob/main/templates/commands/implement.md): taken/plan, voorwaarden en checkpoints; meerdere contextdocumenten worden geladen | Scope en gates zijn nuttig en bestaan al. De volledige workflow toevoegen is geen aangetoonde tokenbesparing voor CREMS |
| [Aider](https://github.com/Aider-AI/aider), circa 49.500 | [Repository map](https://aider.chat/docs/repomap.html): relevante symbolen via afhankelijkheidsgraaf selecteren binnen dynamisch contextbudget, standaard circa 1k tokens voor de map | Nieuwe leesregel: eerst kaart, exports/definities/imports, daarna benodigde implementatie. Geen automatische symbolenindex of Aider-budget toegevoegd |

Conclusie van deze vergelijking: de gekozen richting past bij deze primaire bronnen. Twee gerichte aanvullingen zijn in AGENTS.md opgenomen; geavanceerde compactie, symbolenindex en modelrouting blijven toolfuncties die een aparte evaluatie vereisen. Vooral het Spec Kit-template laat zien waarom een populair framework niet automatisch zuiniger is. De eerdere uitspraak dat minder gelezen tekst minder aangeleverde context geeft blijft een lokale verwachting, geen gemeten totale besparing.

Verificatie vervolg: structuurcheck en diffcheck opnieuw uitgevoerd na de twee instructiewijzigingen. Geen nieuwe tool-/productcode, dus de reeds gemelde harnessbeperking blijft gelden; geen onafhankelijke review uitgevoerd.

Structuurcheck rechtstreeks met Node: PASS. Harness-/structuurtests: 12 van 13 PASS; de Git-fixturetest kon geen tijdelijk `.git/config` schrijven wegens sandboxrechten. De pnpm-ingang faalde op `realpath`-rechten; daarom zijn de bestaande scripts rechtstreeks uitgevoerd. `git diff --check`: PASS, uitsluitend CRLF-waarschuwingen. Onafhankelijke review: NOT RUN; geen volledige Definition of Done geclaimd. Browser niet nodig voor deze instructie-/documentwijziging en niet gebruikt. Werkelijke tokenbesparing nog niet gemeten.
