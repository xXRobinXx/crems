# CREMS Home Assistant-release

Gebruik op Windows vanuit een schone `main`-checkout:

```powershell
.\tools\release-crems.ps1 -Version 0.1.13 -InstallPi -HomeAssistantUrl http://homeassistant.tail582404.ts.net:8123
```

Git gebruikt de bestaande credential manager voor GitHub. Het script vraagt interactief om een Home Assistant long-lived token wanneer `CREMS_HA_TOKEN` niet al in de processomgeving staat. De token wordt niet opgeslagen of afgedrukt. Gebruik `-WhatIf` om tests, reviewgate en releasevoorcontrole uit te voeren zonder een tag, push of Pi-update.

Het script controleert dat branch `main` schoon is en de versie in beide add-onmanifesten gelijk is aan `-Version`. Daarna voert het `pnpm harness check` en `pnpm harness gate` uit. De tweede controle vereist actuele groene tests/build/typecheck, een `APPROVED` Agent A-review en een `PASS` Agent C-browserrapport. Zonder bewijs stopt het script vóór publicatie.

Bij een geslaagde gate maakt het script een nieuwe, onveranderlijke `v<versie>`-tag en pusht die. Het wacht op de bijbehorende Home Assistant ARM64-imageworkflow voordat het `main` pusht. Met `-InstallPi` ververst het daarna de HA-appcatalogus, controleert de gepubliceerde versie, werkt uitsluitend CREMS Energie bij met de Supervisor-optie `backup: true` en controleert versie en status. De Home Assistant-host wordt niet herstart. Zonder `-InstallPi` wordt alleen de bron- en imagepublicatie gedaan.

De uitrol gebruikt Home Assistant Supervisor `store/reload`, `store/addons/<slug>` en `store/addons/<slug>/update`; de update ondersteunt een appbackup. Bewaar bij een probleem het door Home Assistant gemaakte app-herstelpunt en herstel alleen CREMS Energie. Er wordt geen contractprovider benaderd door deze releaseprocedure.

Officiële API-referentie: [Home Assistant Supervisor-endpoints](https://developers.home-assistant.io/docs/api/supervisor/endpoints/).
