# Skill-routing en Jev — 2 oktober 2026

## Keuze voor CREMS

Eén repo-local skill, `crems-workflow`, routeert naar de repositorykaart en bestaande procedures. Codex kiest skills op naam/beschrijving en laadt hun body pas bij gebruik; repo-skills staan onder `.agents/skills`. Daarom is geen aparte routerservice nodig voor deze kleine set. Zie [officiële Codex skill-documentatie](https://learn.chatgpt.com/docs/build-skills).

De router kiest relevante bestanden en verificatie, geen extra bevoegdheden. Bronhiërarchie, één productieschrijver, expliciete browseropdracht en actuele review-/browsergates blijven in `AGENTS.md`/playbook. Rollen A/B/C zijn taakrollen; ze wijzigen niet automatisch het model en starten niet vanzelf subagents. Externe artifactskills worden alleen gebruikt voor een werkelijk document-, spreadsheet-, presentatie- of beeldverzoek.

## Onderzochte GitHub-projecten

De gebruiker bedoelt het model uit [Jev (AI model)](https://en.wikipedia.org/wiki/Jev_(AI_model)). Primaire [TypeSafe-documentatie](https://docs.typesafe.ai/introduction) beschrijft Jev als model voor getypeerde beslissingen: Choice kiest een optie, Score beoordeelt een rubric en Noul geeft een ja/nee-waarschijnlijkheid. Dat past bij selectie van skills/tools; Jev schrijft geen appcode of reviewrapport. Volgens de [modeldocumentatie](https://docs.typesafe.ai/models) is de actuele vaste versie `jev-1.13.0`, tekst-only; een eventuele proef moet juist Nederlands en de CREMS-routes testen. Het model kan dus een beslislaag ondersteunen, maar sneller/goedkoper bouwen in deze repo is niet bewezen.

| Project | Mechanisme volgens README | Beoordeling voor CREMS |
|---|---|---|
| [droid-Q/jev-skill-router](https://github.com/droid-Q/jev-skill-router) | Codex hooks selecteren skills via TypeSafe; vereist API-key; huidige prompt en kandidaatbeschrijvingen worden extern verstuurd | Relevante optie bij veel skills. Geen aangetoonde CREMS-meerwaarde; Windows hookcompatibiliteit en echte routingkwaliteit zijn hier niet getest. |
| [BillionsBobby/JevRouter](https://github.com/BillionsBobby/JevRouter) | Brede model/tool/subagent-router met providerconfiguratie en beslisregistratie | Meer infrastructuur dan nodig voor één CREMS-workflow; benchmarks van de auteur bewijzen geen betere CREMS-uitvoering. |
| [suenot/codex-jev-router](https://github.com/suenot/codex-jev-router) | Actuele README kiest standaard deterministische lokale evidence-selectie via MCP; installer wijzigt globale Codexconfig; legacy Jev blijft apart | Idee van begrensde evidence-selectie bruikbaar: gericht zoeken/lezen. Geen globale MCP-installatie nodig voor de bestaande rg/workflow. |

Dit is brononderzoek naar publieke README's, geen uitvoering of code/security-certificering van die repositories. Geen externe scripts uitgevoerd, geen providerrequest/API-key gebruikt en geen globale Codexconfig gewijzigd. Geen besparings- of kwaliteitsclaim voor CREMS.

## Wanneer Jev opnieuw beoordelen

Bij aantoonbare misrouting over een grotere skillset: pin een concrete revisie, inspecteer installer/hooks/datastromen en vergelijk op synthetische CREMS-verzoeken met normale skillselectie. Meet correcte route, latency, kosten en privacygrenzen. Hosted routing met echte prompts vraagt een concrete keuze voor de externe gegevensoverdracht; onderzoek alleen autoriseert dit niet. Bewaar de lokale fallback en respecteer expliciet gekozen skills.
