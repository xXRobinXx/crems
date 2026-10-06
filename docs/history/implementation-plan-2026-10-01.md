# Implementation Plan

## Actuele baseline — documentatiecleanup 2 oktober 2026

Laatste vastgelegde Pi-versie is **0.1.14**, installed/started met updatebackup en HTTP-runtimecontrole; zie [deploymentbewijs](docs/task-061-deployment014.md). De lokale **0.1.15-kandidaat** herstelt de contract-CSV-bestandskiezer; zie [begrensde review](docs/task-061-csv015-review.md). Deze documentatiecleanup voerde geen nieuwe externe controle uit. Volledige actuele Pi-browser-, fysieke LAN-, herstart-/resultaatbehoud- en rollbackgates blijven open; historische 0.1.13-/NOT RUN-/approvalteksten hieronder zijn gedateerde evidence. De volledige actuele openlijst staat bovenaan TASKS.md. Geen nieuwe releaseapproval of attestatie.

## Actualisering — 1 oktober 2026 / Task 061

Historisch herstelplan: de taaknummers 036–038 hieronder zijn oude planlabels en mogen niet als actuele TASKS-identiteiten worden gebruikt. Task 061 is nu de enige actieve taak. Supervisor bevestigt geïnstalleerde CREMS 0.1.13 op 1 oktober; directe LAN-, volledige actuele browser-, herstart-/rollbackgates blijven open. REQUIREMENTS en TASKS zijn leidend.


## Objective

Maak van de bestaande modules één betrouwbare lokale MVP. Nieuwe functies stoppen totdat de kernreis na refresh aantoonbaar intact blijft.

## Release 1 — herstelbaseline

1. Task 035 — duurzaam batterijrapport, schema-migratie, raceveiligheid en refreshgarantie.
2. Task 036 — Energiepaspoort-toestemming en kwaliteitsmetadata consistent maken.
3. Task 037 — één centraal contractmodel en bereikbare vaste/variabele contractflow.
4. Task 038 — volledige browserreleasegate op desktop en mobiel.

Task 035–037 zijn technisch geïntegreerd. Task 038 blijft de open menselijke browsergate; op uitdrukkelijk verzoek van de gebruiker neemt Codex het scherm niet over. Contractvergelijkingsopslag en marktbrede leveranciersdata blijven bewust buiten deze release.

## Productstatus

- Beschikbaar als module: live dashboard, echte daggrafiek/prijzen, streaming CSV-controle, Energiepaspoort-totalen, technische batterijmotor en pure vlakke contractberekening.
- Beschikbaar in de lokale app: duurzame batterij-/financiële rapportflow, Energiepaspoort v2 en tijdelijke vergelijking van twee zelf ingevoerde vlakke contracten.
- Niet vrijgegeven: bewaarde contractvergelijking, automatische contractkeuze, volledige batterij-offerte of Raspberry Pi-installatie.

Zie `PRODUCT_AUDIT.md` voor het bewijs en de actuele blockers.

## Validation Strategy

- unit tests voor pure berekeningen en parsers;
- fixturetests voor Belgische meter-/CSV-formaten;
- bridge-integratietests met gemockte Home Assistant-responses;
- pure tijd-/eenheidsnormalisatietests en begrensde history-routetests;
- runtime gebruikersreistests naast unit- en integratietests;
- verplichte browsergate vanuit schoon profiel én bestaande lokale toestand;
- refresh, schema-migratie en expliciete verwijdering als vaste regressiescenario's;
- typecheck en productiebuild bij iedere taak;
- functionele controle van bronlabels en failure modes.

## Out of Scope

Nieuwe features, cloudhosting, betalingen, geautomatiseerd overstappen en deployment totdat de herstelrelease betrouwbaar is.
