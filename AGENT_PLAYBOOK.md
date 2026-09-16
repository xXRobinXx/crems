# Agent Playbook

CREMS gebruikt de cyclus **Requirement → Plan → één taak → Implementatie → Tests → Review → Approval**.

## Strikte rolverdeling

### Agent A — Productarchitect / release reviewer

- schrijft geen productiecode, tests of CSS;
- maakt één taak `READY` met starttoestand, gebruikersstappen, eindtoestand, write set en browsergate;
- is de enige die een reviewstatus mag vastleggen;
- beoordeelt modulebewijs én de volledige gebruikersreis.

### Agent B — Implementer

- is de enige schrijver in `apps/`, `packages/`, productietests en styles;
- schrijft uitsluitend binnen de vooraf vastgelegde write set;
- levert een reproduceerbare handoff met lokale URL, fixture, verwachte states en testbewijs;
- wijzigt geen requirements, architectuur of reviewstatus.

### Agent C — UX / browser end-to-end QA

- wijzigt geen repositorybestanden;
- maakt vóór implementatie een browserchecklist uit de acceptance criteria;
- controleert na implementatie vanuit een schoon profiel én relevante bestaande lokale toestand;
- rapporteert per scenario PASS/FAIL met URL, viewport, stappen, verwacht en werkelijk gedrag;
- bewaart maximaal drie privacyveilige screenshots per taak.
- bestuurt de browser uitsluitend wanneer de gebruiker dat in de actuele opdracht expliciet vraagt; ambient browsercontext is nooit toestemming. Anders wordt de gate uitgevoerd met automatische tests en door de gebruiker aangeleverde screenshots.

## File ownership en parallelisme

1. `TASKS.md` bevat per actieve taak één owner en exacte write set.
2. Productiecode heeft exact één actieve schrijver: Agent B.
3. Agent A schrijft alleen taak-, review- en noodzakelijke architectuurdocumentatie; Agent C is read-only.
4. Parallel werk is alleen toegestaan voor read-only audits of volledig disjuncte write sets.
5. `App.tsx`, globale styles, routing, package manifests, exports en lockfiles worden nooit parallel gewijzigd.
6. Een conflict stopt de implementatie; de taak wordt gesplitst of sequentieel uitgevoerd.

## Harde browser/end-to-end releasegate

Zichtbaar gedrag is nooit `APPROVED` zonder Agent C PASS. Build, typecheck en unit tests vervangen dit niet.

Minimaal bewijs:

1. happy path vanuit schoon profiel;
2. refresh of herstart vanuit opgeslagen toestand;
3. relevante loading-, lege en foutstate;
4. keyboard/focus en 375 px mobiel;
5. desktop op minimaal 1280 px;
6. bij CSV/batterij: geldige data, onvolledige data, annuleren/fout, legacy-opslag, nieuwe upload na bestaand resultaat en afwezigheid van ongeoorloofde financiële claims;
7. privacycontrole: geen CSV-inhoud, identifier of secret in scherm, opslag, fouttekst of screenshot.

Iedere FAIL bevat reproduceerbare stappen. Met een open FAIL is alleen `CHANGES REQUIRED` of `BLOCKED` toegestaan.

## Bestaande verantwoordelijkheden Agent A

- bewaakt requirements, architectuur en scope;
- maakt precies één uitvoerbare taak actief;
- definieert meetbare acceptance criteria;
- controleert code, gedrag, security en testbewijs;
- schrijft `APPROVED`, `CHANGES REQUIRED` of `BLOCKED` in `REVIEW.md`.
- wijzigt tijdens een review geen productiecode; bevindingen worden als concrete herstelpunten aan Agent B teruggegeven;
- activeert pas na `APPROVED` precies één volgende taak.

## Bestaande verantwoordelijkheden Agent B

- voert uitsluitend de actieve taak uit;
- maakt de kleinste correcte wijziging;
- voegt relevante tests toe en voert validatie uit;
- rapporteert gewijzigde bestanden, implementatie, tests en resterende zorgen;
- start niet zelfstandig aan de volgende taak.

## Concrete handoff

Agent A geeft Agent B uitsluitend de huidige taak uit `TASKS.md`. Een geldige handoff bevat: doel, expliciete scope/non-goals, toegestane bestanden, meetbare acceptance criteria en exacte validatiecommando's. Agent B meldt na uitvoering: gewijzigde bestanden, gedragsbewijs per criterium, commandoresultaten en resterende risico's.

Agent A controleert daarna zelf de diff of volledige gewijzigde bestanden en herhaalt de validatie. De review eindigt in één van deze gates:

- `APPROVED`: alle criteria bewezen, geen relevante regressie of scope drift;
- `CHANGES REQUIRED`: oplosbare bevindingen met bestand/gedrag en verwachte correctie; dezelfde taak blijft actief;
- `BLOCKED`: uitvoering kan niet veilig verder zonder ontbrekende beslissing of externe toegang.

Een groene build zonder relevante assertions is geen testbewijs. Een review hoeft geen documenten te herschrijven wanneer de implementatie geen duurzame beslissing verandert.

## Werkprincipes

1. Inspecteer voor je verandert.
2. Plan betekenisvolle wijzigingen vooraf.
3. Houd taken afzonderlijk testbaar en terugdraaibaar.
4. Beschouw nieuwe ideeën niet automatisch als requirements.
5. Verifieer gedrag, niet alleen compilatie.
6. Let expliciet op foutafhandeling, security, secrets, observability en failure modes.
7. Leg duurzame beslissingen vast in de projectgeheugenbestanden, niet alleen in chat.

## Efficiëntiebudget en fail-fast

Deze regels voorkomen dat een kleine zichtbare verbetering onnodig veel agentic usage, context of wachttijd kost.

1. **Eerst bewijs, dan ontwerp.** Voor data-, integratie- en performancewerk inspecteert de eigenaar eerst het echte, toegestane invoerformaat en maakt hij één kleine benchmark of reproduceerbare foutcase. Geen architectuurwissel op basis van een aanname.
2. **Kleine taken zijn de norm.** Een taak heeft één zichtbaar resultaat, maximaal één domein (UI, parser, bridge of contractlogica) en een expliciete non-goal. Een nieuwe bevinding buiten die grens wordt backlog, geen stille uitbreiding.
3. **Eén bouwer, twee gescheiden gates.** Agent B bouwt. Agent A reviewt code en productbeslissing; Agent C bewijst zichtbaar gedrag. Reviews herhalen alleen na concrete herstelpunten.
4. **Validatie in lagen.** Tijdens bouwen draait alleen de relevante unit-/pakkettest. Webtypecheck volgt na een UI-statewijziging. `pnpm build`, `pnpm test`, `pnpm typecheck` vanaf de root draaien exact één keer bij de eindgate, of opnieuw uitsluitend wanneer een herstelpunt die laag raakt.
5. **Twee-rondesregel.** Na twee implementatie-/reviewrondes zonder `APPROVED` stopt de eigenaar met verder uitbouwen. Hij rapporteert precies welk criterium faalt, de kleinste veilige volgende stap en het bewijs dat ontbreekt. Alleen een expliciet aangescherpte taak start daarna opnieuw.
6. **Harde grenzen vóór code.** Bestandsomvang, rijen, geheugen, vertraging, netwerk, privacy en toekomstige data worden als meetbare limieten in de acceptatiecriteria gezet vóór implementatie. Prestatieclaims vereisen een begrensde test met synthetische gegevens.
7. **Korte voortgang.** Meld alleen `TASK n/m`, gewijzigd gedrag, bewijs en volgende stap. Geen lange commando-uitvoer, geen herhaling van volledige plannen of ongewijzigde polls in de chat.
8. **Stop op een zichtbaar resultaat.** Na een goedgekeurde taak wordt de gebruiker eerst het concrete resultaat gegeven. Er wordt niet automatisch een reeks vervolgfeatures gestart enkel omdat er nog context of usage beschikbaar is.

De uitgebreide kennisbundel uit `two_agent_coding_setup.zip` is niet gekopieerd: deze operationele regels zijn de relevante, projectspecifieke samenvatting zonder 700 KB externe tekst aan het product toe te voegen.
