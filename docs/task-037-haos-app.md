# Task 037 — CREMS als Home Assistant-app

Status: ARM64 IMAGE VALIDATED LOCALLY — publicatie en installatie op Home Assistant OS nog open.

## Doel

CREMS moet als zelfstandige Home Assistant-app op Home Assistant OS kunnen draaien, zodat de Windows-pc niet aan hoeft te staan. De app bevat de gebouwde webinterface en de bridge en start automatisch mee met Home Assistant.

## Bekende doelomgeving

- Home Assistant OS
- Raspberry Pi 4, 64-bit (`rpi4-64`)
- 20 GB vrije opslag vastgesteld in Home Assistant
- Home Assistant bereikbaar via een lokaal of Tailscale-adres

## Afbakening

- Geen wijziging aan Home Assistant zelf.
- Geen cloudopslag of publieke internetpublicatie.
- Geen wijziging aan financiële of batterijsemantiek.
- De bridge blijft read-only richting Home Assistant.
- De webapp en bridge worden als één beheerde Home Assistant-app gestart.

## Voorbereide acceptance criteria

- App-image bouwt reproduceerbaar voor `rpi4-64`.
- Website en bridge starten automatisch en herstellen na Home Assistant-herstart.
- Bridge gebruikt de bestaande Home Assistant API-configuratie zonder token in de frontend.
- De webinterface is lokaal bereikbaar via een Home Assistant-app-poort.
- Stoppen, opnieuw starten en foutstatus tonen een duidelijke status zonder opgeslagen rapporten te wissen.
- Installatie- en rollbackstappen zijn gedocumenteerd.
- Build, typecheck en relevante tests slagen; Raspberry Pi-installatie wordt apart als gebruikerscheck vastgelegd.

## Volgende implementatiestap

De appmetadata, Dockerfile en startscript staan onder `apps/home-assistant-addon`. De gecombineerde runtime serveert web en API op poort 8099 en gebruikt in Home Assistant OS de interne Supervisor-API en Supervisor-token. Lokale validatie: bridge 68/68 tests, webproductiebundel geslaagd en HTTP 200 voor `/` en `/api/current` op de gecombineerde server.

Het ARM64-image `crems-energy:0.1.0` is lokaal gebouwd en onder ARM64-emulatie gestart. `/`, `/api/current` en `/api/health` antwoorden met HTTP 200. De eerste containercontrole vond dat het BELPEX-prijsarchief ontbrak; de Dockerfile kopieert dit nu mee en de hercontrole slaagde. De GitHub Actions-workflow publiceert versies naar GHCR. Voor installatie resteert het aanmaken van de publieke GitHub-repository, pushen van de bron en toevoegen van die repository in Home Assistant. De bestaande browsergate van Task 036 blijft afzonderlijk open.
