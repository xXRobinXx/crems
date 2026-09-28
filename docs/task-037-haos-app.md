# Task 037 — CREMS als Home Assistant-app

Status: CREMS Energy 0.1.11 is momenteel gepubliceerd en actief geïnstalleerd op de gekoppelde Home Assistant OS / Raspberry Pi 4 via Home Assistant Ingress. Task 059 bereidt de ongeconfigureerde release 0.1.12 voor. Na publicatie moet dit worden aangevuld met de exacte image-digest, installatie/restorepoint, 375/1280 viewportcontrole, browserconsole en cachebewijs; zie Task 058 en 059.

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
- De webinterface is uitsluitend via geauthenticeerde Home Assistant Ingress bereikbaar; er wordt geen add-onpoort op het LAN gepubliceerd.
- Stoppen, opnieuw starten en foutstatus tonen een duidelijke status zonder opgeslagen rapporten te wissen.
- Installatie- en rollbackstappen zijn gedocumenteerd.
- Build, typecheck en relevante tests slagen; Raspberry Pi-installatie wordt apart als gebruikerscheck vastgelegd.

## Volgende implementatiestap

De appmetadata, Dockerfile en startscript staan onder `apps/home-assistant-addon`. De gecombineerde runtime serveert web en API intern op poort 8099 en gebruikt in Home Assistant OS de interne Supervisor-API en Supervisor-token. De app wordt alleen via Home Assistant Ingress aangeboden; de webapp en opslag-API zijn niet als directe LAN-poort gepubliceerd.

De eerder geïnstalleerde addonmanifesten en image zijn `0.1.11`. GitHub Actions run `36306593824` publiceerde tag `v0.1.11`; OCI-index `sha256:7da16f75a6f4d335ff62b0c719e06cedf1aabaf17871079fc02835a6c3790398`, ARM64-image `sha256:cd8402cd0de5aae6e1812ec54d312a67c0a390abb5093b598ac8f44de1f79b70`. Op de Pi meldt Home Assistant 0.1.11 actief en Ingress werkt. De lokale manifests zijn inmiddels verhoogd naar `0.1.12`; publicatie/installatie van die versie en een nieuw herstelpunt van `0.1.11` zijn nog pending. De eerdere herstelprocedure voor 0.1.10 is alleen historisch; bij 0.1.12-regressie moet de nieuwe `CREMS Energie 0.1.11` appback-up worden geselecteerd en alleen CREMS Energie worden teruggezet.

Na update/herlaadbeurt zijn actuele HA-vermogenswaarden, Belgische spotprijzen en 96 dagwaarden zichtbaar gebleven. Het eerder bewaarde lokale profiel bleef in dezelfde browser beschikbaar na de add-onrestart. Logboekcontrole toonde bridge-startregels en `day-price=missing/configured`, zonder token-/secretwaarden in de bekeken regels. Agent C probeerde geïsoleerde Pi-browserchecks op 375×812 en 1280×900; beide werden vóór HTTP-response geblokkeerd door `ERR_NETWORK_ACCESS_DENIED`. Open voor Task 058 blijven die exacte viewports, Pi-console/Network-fouten en runtime-cacheheaders/resource-transfermeting. Geen Pi-LCP- of cold/warm-snelheidsclaim zonder die meting. Geen HA-hostrestart uitgevoerd.
