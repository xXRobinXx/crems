# CREMS Home Assistant-release

Gebruik op Windows vanuit een schone `main`-checkout:

```powershell
.\tools\release-crems.ps1 -Version 0.1.13 -InstallPi -HomeAssistantUrl http://homeassistant.tail582404.ts.net:8123
```

Als de exacte tag al is gepubliceerd maar een latere stap onderbroken werd, kan dezelfde versie alleen worden hervat als de lokale en remote tag intact zijn en productiecode sinds die tag niet is gewijzigd:

```powershell
.\tools\release-crems.ps1 -Version 0.1.13 -InstallPi -ResumePublishedRelease -HomeAssistantUrl http://homeassistant.tail582404.ts.net:8123
```

Git gebruikt de bestaande credential manager voor GitHub. Het script vraagt interactief om een Home Assistant long-lived token wanneer `CREMS_HA_TOKEN` niet al in de processomgeving staat. De token wordt niet opgeslagen of afgedrukt. Gebruik `-WhatIf` om tests, reviewgate en releasevoorcontrole uit te voeren zonder een tag, push of Pi-update.

Het script controleert dat branch `main` schoon is en de versie in beide add-onmanifesten gelijk is aan `-Version`. Daarna voert het `pnpm harness check` en `pnpm harness gate` uit. De tweede controle vereist actuele groene tests/build/typecheck, een `APPROVED` Agent A-review en een `PASS` Agent C-browserrapport. Zonder bewijs stopt het script vóór publicatie.

Bij een geslaagde gate maakt het script een nieuwe, onveranderlijke `v<versie>`-tag en pusht die. Het wacht op de workflowrun voor die exacte tag en commit en controleert dat de publieke registry een image met `linux/arm64` bevat voordat het `main` pusht. Bij onderbreking kan `-ResumePublishedRelease` uitsluitend de al bestaande exacte tag voortzetten; het overschrijft of verplaatst geen tag. Met `-InstallPi` ververst het daarna de HA-appcatalogus, controleert de gepubliceerde versie, werkt uitsluitend CREMS Energie bij met de Supervisor-optie `backup: true` en controleert versie en status. De token wordt pas voor de Pi-stap veilig gevraagd; de Home Assistant-host wordt niet herstart. Zonder `-InstallPi` wordt alleen de bron- en imagepublicatie gedaan.

De releasehelper authenticeert de HA-gebruiker via `/api/websocket`. Catalogusverversing en versiecontrole gebruiken `supervisor/api` voor `store/reload` en `addons/<slug>/info`; de update gebruikt Home Assistants `hassio/update/addon` met `backup: true`. De helper accepteert uitsluitend deze acties voor CREMS Energie, begrenst wachttijd en verbergt upstreamfouttekst. Na een timeout of disconnect controleer je eerst de appstatus voordat je de update opnieuw uitvoert. Bewaar bij een probleem het door Home Assistant gemaakte app-herstelpunt en herstel alleen CREMS Energie. Er wordt geen contractprovider benaderd door deze releaseprocedure.

Officiële API-referentie: [Home Assistant Supervisor-endpoints](https://developers.home-assistant.io/docs/api/supervisor/endpoints/).

## Toegang vanaf het thuisnetwerk

Open `http://<Pi-LAN-adres>:8123`, meld je aan bij Home Assistant en open CREMS Energie via de zijbalk of de knop Open webinterface in de add-on. De app gebruikt geauthenticeerde Ingress; poort 8099 is intern en niet rechtstreeks op het LAN beschikbaar. Gebruik het actuele lokale adres van de Pi. Een Tailscale-adres is geen bewijs van bereikbaarheid via het lokale netwerk.

Actuele controle op 1 oktober 2026: Supervisor meldt versie 0.1.13, nieuwste versie 0.1.13 en toestand started. Daarom is deze run geen update of nieuwe backup uitgevoerd. Read-only netwerkinfo bevestigt LAN-adres `192.168.88.253/24` en gateway `192.168.88.1`. Open [CREMS Energie](http://192.168.88.253:8123/hassio/ingress/350f0e24_crems_energy). Directe HTTP naar dit adres gaf vanaf de huidige host timeout; Tailscale-HA en tijdelijke geauthenticeerde Ingress gaven HTTP 200. Rechtstreekse LAN-bereikbaarheid en de volledige Agent C-browsercontrole blijven open bewijsstappen. Sla geen tijdelijke Ingress-sessie-URL op in Git of documentatie.
Actuele netwerkbevinding Task 061 (1 oktober): de huidige pc heeft Wi-Fi-adres `192.168.0.243/24`, gateway `192.168.0.1`; de Pi heeft `192.168.88.253/24`, gateway `192.168.88.1`. Ze zitten in verschillende IPv4-subnets. De directe timeout past bij ontbrekende routering tussen deze netwerken; de routerconfiguratie is niet gecontroleerd of gewijzigd. De pc moet toegang krijgen tot het Pi-subnet (bijvoorbeeld hetzelfde niet-geïsoleerde thuisnetwerk) of een bestaande route gebruiken. De tijdens deze run werkende toegang gebruikt [Home Assistant via Tailscale](http://homeassistant.tail582404.ts.net:8123/hassio/ingress/350f0e24_crems_energy). Er is geen bewijs dat een willekeurig apparaat op het Pi-subnet niet kan verbinden.