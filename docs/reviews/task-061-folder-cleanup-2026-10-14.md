# Mapcleanup — 14 oktober 2026

Gebruiker autoriseert opschonen van de mapstructuur. Root schrijft uitsluitend documentatie: docs/architecture.md verplaatsen naar docs/history/architecture-original.md; ARCHITECTURE.md uitsluitend padverwijzing; docs/README.md en dit rapport. Historieherstel behoudt zijn bestaande productieowner/write set in TASKS.md. Geen productiecode of persoonlijke/genegeerde runtimegegevens gewijzigd.

Inspectie: apps/web, apps/bridge, packages/core en apps/home-assistant-addon hebben eigen verantwoordelijkheden; crems is noodzakelijke HA-repositorymetadata, geen overbodige kopie. Workspace- en Dockergrenzen vereisen geen reorganisatie. Oude reviewpaden en procedures zijn gekoppeld aan verwijzingen/fingerprintinputs en zijn behouden. Geen cache-/dependencyverwijdering als cosmetische cleanup.

Wijziging: oorspronkelijke architectuurnotities byte-identiek naar history verplaatst (SHA256 vóór/na gelijk); enige gevonden padverwijzing aangepast. Documentatie-index ordent nieuwe bestanden per doel, linkt contextbudget en onderscheidt historische 0.1.14 van het gedateerde 0.1.18-bewijs. TASKS.md blijft bron voor de actuele status.

Verificatie: structuurcheck PASS; harness-tests 8/8 PASS; diffcheck PASS (alleen CRLF-waarschuwingen); alle lokale documentatie-indexlinks bestaan. Zoekcontrole vond uitsluitend de historische inventarisvermelding van het oude architectuurpad en deze verplaatsingsbeschrijving; die zijn geen actieve links en blijven historisch correct. Onafhankelijke review NOT RUN; geen releasegoedkeuring of tokenbesparingsclaim. De aparte structuurfixtures zijn niet opnieuw uitgevoerd; hun eerder gemelde sandboxbeperking blijft open.
