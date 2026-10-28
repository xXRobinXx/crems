# Shared Agent Rules

Deze regels gelden voor alle agents in CREMS.

## Source of truth

1. `REQUIREMENTS.md`
2. goedgekeurde beslissingen in `ARCHITECTURE.md`
3. huidige taak in `TASKS.md`
4. bestaande code en tests
5. `AGENT_PLAYBOOK.md`
6. `PRODUCT_AUDIT.md` voor de actuele releasebaseline

Bij conflict: rapporteer het conflict en verander geen requirements stilzwijgend.

## General rules

- Bewaak scope en bestaande functionaliteit.
- Werk aan één actieve taak tegelijk in kleine, controleerbare stappen.
- Eén actieve taak heeft exact één schrijver van productiecode en een vastgelegde write set.
- Agents nemen het scherm of de browser van de gebruiker nooit over. Browserinteractie gebeurt alleen na een nieuwe, expliciete opdracht van de gebruiker; anders gebruikt QA uitsluitend code/tests en door de gebruiker gedeelde screenshots.
- Inspecteer code en configuratie voordat je wijzigt.
- Voeg dependencies alleen toe met aantoonbare noodzaak.
- Commit nooit secrets, tokens, `.env`-bestanden of credentials.
- Behandel simulatie-, geschatte en gemeten data zichtbaar verschillend.
- Voor een Home Assistant-app met `ingress: true` zijn relatieve frontend-URL's en een server-side peercheck op exact `172.30.32.2` releasevereisten; alleen een manifest zonder gepubliceerde poort is geen Ingress-authenticatie. Geen wildcard CORS voor centrale opslag.
- Tests en gedragsverificatie zijn onderdeel van iedere wijziging.
- Claim niets als werkend zonder bewijs.
- Een auditbevinding noemt bestand/onderdeel, impact en controleerbaar bewijs; ontbrekende dekking of onderbroken agentwerk wordt expliciet gemeld.
- Historische taakstatussen en groene automatische tests gelden niet als releasegoedkeuring; zichtbaar gedrag vereist een actuele Agent C-browser-PASS.
- Productiecode staat alleen in `apps/` en `packages/`; `archive/` en `research/` zijn geen build-input.

## Definition of Done

Een taak is pas klaar wanneer acceptance criteria en relevante tests slagen, bekende regressies zijn uitgesloten, documentatie klopt en de reviewstatus `APPROVED` is. Voor zichtbaar gedrag is bovendien een vastgelegd Agent C-browserrapport met PASS verplicht.

## Projectrouting

Voor CREMS-onderhoud gebruikt de repo-skill [crems-workflow](.agents/skills/crems-workflow/SKILL.md) de [repositorykaart](docs/guides/repository-map.md). Lees alleen de passende route en relevante rolbeschrijving; skills en rolbestanden vervangen de source of truth hierboven niet. `pnpm check:structure` controleert actieve map-/metadatagrenzen. Onderzoek naar externe routers staat in [skill-routing-research](docs/research/skill-routing-research.md); een routerselectie verleent geen browser-, deployment- of externe gegevensoverdrachtsautorisatie.

## Zuinig werken — standaard

- Hergebruik reeds gelezen, ongewijzigde instructies in deze chat. Lees bij een nieuwe chat eerst de nieuwste scope/ownership bovenaan `TASKS.md`; zoek daarna gericht op onderwerp/headings. Laad geen volledige taakhistorie voor oriëntatie.
- Lees de toepasselijke requirements, ADR's, rol en code/testketen; breid uit bij afhankelijkheden of onzekerheid. De bronhiërarchie en alle kwaliteitsgates blijven gelden.
- Zoek met `rg` in relevante mappen; lees begrensde fragmenten. Sluit gegenereerde bestanden, lockfiles, archive/research en oude bewijsrapporten uit van algemene oriëntatie; lees ze wanneer de taak ze nodig heeft.
- Gebruik de repositorykaart, exports/functiedefinities en imports als ingang vóór volledige grote bronbestanden. Voeg gespecialiseerde procedures alleen toe wanneer de taak ze vereist.
- Bundel onafhankelijke inspecties; beperk uitvoer tot relevant bewijs. Bij afgekapt resultaat: verfijn de zoekopdracht. Herlees geen grote bestanden om één functie te vinden.
- Draai gerichte tests tijdens werk; volledige verplichte checks bij de eindgate. Herhaal geslaagde checks alleen na relevante wijzigingen of nieuwe twijfel. Geen subagents voor routinewerk zonder expliciete autorisatie.
- Antwoord kort: resultaat, verificatie, resterende gate. Houd overdracht bij in de bestaande taak: eigenaar/write set, volgende stap, laatste teststatus met bewijslink en open gates. Een samenvatting vervangt nooit bronbewijs.

Modeladvies: standaard GPT-6.1 Sol medium; Sol high voor lastige bugs; Astra high voor gerichte eindreview; Luna voor eenvoudige documentatie. Dit wisselt geen model automatisch en autoriseert geen subagents. Uitwerking: [contextbudget](docs/guides/context-budget.md), alleen laden voor modelkeuze of token-/workflow-efficiëntie.
