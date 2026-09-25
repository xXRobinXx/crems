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
