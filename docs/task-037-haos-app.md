# Task 037 — CREMS als Home Assistant-app

Status: CREMS Energy `v0.1.12` blijft actief op de gekoppelde Home Assistant OS / Raspberry Pi 4 totdat de afzonderlijke Supervisor-update is afgerond. Task 060 heeft `v0.1.13` gepubliceerd via workflow [36600366405](https://github.com/xXRobinXx/crems/actions/runs/36600366405), OCI-index `sha256:bd8000e778e61b94ac5a312b2f546e67e4943aa5a8adb9779858283e0ddc5add`, ARM64 `sha256:39c2ce281cbb8198ce6be876e8f44a1bf27ad82a94b02a89e8adb7d45925fccd`. De installatieprocedure wacht op veilige lokale invoer van een Home Assistant long-lived token; vóór update maakt Supervisor een appback-up. Pi-specifieke 375×812- en 1280×900-viewports, browserconsole en cache/netwerkbewijs zijn niet uitgevoerd omdat de beschikbare browserbediening die metingen niet ondersteunt; zie Task 058 en 059.

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

De eerdere `0.1.11`-status hieronder is historisch. De actuele laatste bevestigde Pi-versie is `0.1.12` zoals bovenaan vastgelegd. Bij een regressie van `0.1.13` moet het door Home Assistant tijdens de update gemaakte `0.1.12`-herstelpunt worden geselecteerd en alleen CREMS Energie worden teruggezet.

Na update/herlaadbeurt zijn actuele HA-vermogenswaarden, Belgische spotprijzen en 96 dagwaarden zichtbaar gebleven. Het eerder bewaarde lokale profiel bleef in dezelfde browser beschikbaar na de add-onrestart. Logboekcontrole toonde bridge-startregels en `day-price=missing/configured`, zonder token-/secretwaarden in de bekeken regels. Agent C probeerde geïsoleerde Pi-browserchecks op 375×812 en 1280×900; beide werden vóór HTTP-response geblokkeerd door `ERR_NETWORK_ACCESS_DENIED`. Open voor Task 058 blijven die exacte viewports, Pi-console/Network-fouten en runtime-cacheheaders/resource-transfermeting. Geen Pi-LCP- of cold/warm-snelheidsclaim zonder die meting. Geen HA-hostrestart uitgevoerd.
