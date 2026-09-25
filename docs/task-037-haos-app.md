# Task 037 — CREMS als Home Assistant-app

Status: ARM64 IMAGE HISTORISCH LOKAAL GEVALIDEERD — publicatie en installatie op Home Assistant OS nog open. Directe poortpublicatie is vervangen door Home Assistant Ingress.

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

Historische validatie bouwde image `crems-energy:0.1.0` onder ARM64-emulatie; dit bewijst geen huidige release. De GitHub-repository bestaat en beide addonmanifesten zijn nu op 0.1.9 gezet. De workflow valideert bij tag `v0.1.9` de manifestversies en publiceert pas na een expliciete tagpush naar GHCR. Resterend: geautoriseerde publicatie van de huidige bron, image pull/installatie op HAOS, configuratie, herstart/rollback en browser-PASS op de Pi. Geen actuele hardwaretest is uitgevoerd.
