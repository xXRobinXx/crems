# Task 037 — CREMS als Home Assistant-app

## Actuele aanvulling — 1 oktober 2026 / Task 061

Geauthenticeerde read-only Supervisor-info bevestigt inmiddels versie **0.1.13**, nieuwste versie **0.1.13**, toestand **started**. Deze run heeft geen update uitgevoerd en geen nieuwe backup gemaakt of gecontroleerd. De onderstaande installatie-wachtstatus beschrijft de historische toestand van 29 september en is hiermee vervangen.

Read-only netwerkinfo bevestigt Pi-adres `192.168.88.253/24`, gateway `192.168.88.1`. De huidige pc gebruikt `192.168.0.243/24`, gateway `192.168.0.1`; ze zitten in verschillende subnets. Directe LAN-HTTP vanaf deze host gaf timeout. Via Tailscale gaven HA en tijdelijke geauthenticeerde CREMS-Ingress HTTP 200; HTML/health/current zijn no-store en de actuele gehashte JS/CSS immutable. Dit bewijst HTTP-runtime over Tailscale, geen directe LAN- of browser-PASS.

Gebruik vanaf het Pi-thuisnetwerk [CREMS Energie](http://192.168.88.253:8123/hassio/ingress/350f0e24_crems_energy), of de geverifieerde [Tailscale-route](http://homeassistant.tail582404.ts.net:8123/hassio/ingress/350f0e24_crems_energy). Directe LAN-bereikbaarheid, actuele Agent C desktop/mobiel-browsercontrole, opslag/herstart/reboot en rollback blijven open gates. Task 061 is CHANGES REQUIRED voor volledige gebruikersrelease. Zie `docs/task-061-review.md`.

## Historische status — 29 september 2026

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

Historische updatecontrole: hieronder staat de toen bevestigde 0.1.12-toestand. De actuele versie is 0.1.13 zoals in de aanvulling van 1 oktober vastgelegd. Bij herstel moet eerst het werkelijk aanwezige passende app-herstelpunt worden gecontroleerd; deze run heeft geen 0.1.12-backup geverifieerd. Herstel alleen CREMS Energie, geen ongecontroleerde hostrestore.

Na update/herlaadbeurt zijn actuele HA-vermogenswaarden, Belgische spotprijzen en 96 dagwaarden zichtbaar gebleven. Het eerder bewaarde lokale profiel bleef in dezelfde browser beschikbaar na de add-onrestart. Logboekcontrole toonde bridge-startregels en `day-price=missing/configured`, zonder token-/secretwaarden in de bekeken regels. Agent C probeerde geïsoleerde Pi-browserchecks op 375×812 en 1280×900; beide werden vóór HTTP-response geblokkeerd door `ERR_NETWORK_ACCESS_DENIED`. Open voor Task 058 blijven die exacte viewports, Pi-console/Network-fouten en runtime-cacheheaders/resource-transfermeting. Geen Pi-LCP- of cold/warm-snelheidsclaim zonder die meting. Geen HA-hostrestart uitgevoerd.
