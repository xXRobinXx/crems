# Task 061 — actuele operationele controles, 16 oktober 2026

De eerste controle hieronder was uitsluitend read-only op de bestaande Pi-installatie, vóór de later uitgevoerde hostherstart. Geen update, publicatie of restore. De latere echte hostherstart staat onderaan met eigen rapport en resultaat; eerdere NOT RUN-statussen zijn daarmee gedateerd. Credentials uitsluitend uit de bekende lokale bridgeconfiguratie intern gebruikt; geen secret, Ingress-sessie of persoonlijke meterwaarden in bewijsbestanden. Dat de processvariabele CREMS_HA_TOKEN ontbrak betekende niet dat de bestaande lokale HA-configuratie onbruikbaar was; de eerdere toegangblokkade is daarmee gedeeltelijk opgeheven.

## Bewezen

- Home Assistant API met bestaande autorisatie200; geconfigureerde tijdzone Europe/Brussels, HA2026.8.3.
- Supervisor: CREMS0.1.18, latest0.1.18, started. Dit is de geïnstalleerde baseline, niet de nieuwe lokale kalenderfix. Pi-JS `app-3f7dcffce4c1093d.js` verschilt van kandidaat `app-233a83289c4346f8.js`; CSS gelijk.
- Echte geauthenticeerde Ingress: document200/no-store; CSS en JS200/immutable; health/current/prijsAPI200/no-store; SSE200/text-event-stream met geldig eerste event. Zonder sessie401. Geen directe bridgepoort gepubliceerd of omzeild.
- Prijsbron leverde tijdens de eerste probe96 vandaag- en96 morgenpunten; dit is tijdgebonden werkelijk probe-bewijs, geen garantie dat morgenprijzen altijd gepubliceerd zijn.
- Actuele catalogus207kaarten/18leveranciers, no-store, geen Access-Control-Allow-Origin.
- Laatste read-only bevestigde CREMS-herstelpunt: gedeeltelijke backup van16oktober2026 om03:00:39.028110UTC (05:00:39Brussels). Bestaan van backup bewijst geen restore, ontsleutelbaarheid of rollback.
- Verse korte streammeting:120.011monotone seconden,121events, allemaal measured/home-assistant,0ongeldig,0ouderdan10s, maximum berichtouderdom0.1s, maximale eventafstand1.023s. Korte steekproefPASS; geen langdurige hardware-PASS.

Logs: `.harness/task061-live-ingress-probe.log`, `task061-live-backup-check.log`, `task061-ha-readonly-status.json`, `task061-stability-2min.log`.

## Feitelijk geblokkeerd / niet uitgevoerd

1. Fysiek LAN: client192.168.0.243/24, Pi192.168.88.253/24 (gateway192.168.88.1). Actuele directe HTTP naar192.168.88.253:8123 gaf geen antwoord; Tailscale werkt. Alleen subnetverschil en timeout bewezen, routeroorzaak niet volledig onderzocht. Geen netwerk-/routerconfiguratie gewijzigd. Log `.harness/task061-lan-readonly.log`.
2. Hostherstart met resultaatbehoud: niet uitgevoerd. De lokale echte bridgeprocesherstartPASS is geen HA-hostherstart. Vereist vooraf nieuw passend herstelpunt en onderhoudsmoment; alleen appupdate/backupexistentie volstaat niet.
3. Supervisorrestore/rollback: niet uitgevoerd; er is geen aangewezen testhost/kloon in de huidige taak. Geen ongecontroleerde productie-restore gedaan om een vinkje te behalen.
4. Langdurige stabiliteit: de vijftienminutenprobe werd onderbroken door een grote hosttijdsprong/suspend:76337s wandtijd en323geldige events. De run rapporteerde pass=false en wordt INVALID/INTERRUPTED genoemd, niet bewezen Pi-uitval en niet vijftienminutenPASS. Log `.harness/task061-stability-15min.log`. De voorgestelde continue24uurswaarneming is niet voltooid; de nieuwe120ssteekproef vervangt haar niet.
5. Live contractprovider: geen nieuwe partnerrechten/configuratie of echte providerresponse bewezen; geen compare, registratie of voorwaardenacceptatie uitgevoerd. De credentialvrije lokale catalogus werkt afzonderlijk.
6. Geen huidige Pi-browser-PASS voor de nog niet geïnstalleerde lokale kandidaat. De huidige Ingress-HTTP/SSE-status is baselinebewijs, geen deploymentgoedkeuring voor de kalenderfix.

Deze concrete externe/operationele grenzen verhinderen volledige afronding van Task061 en een algemene release-APPROVED, ook wanneer de lokale code/UI-gate slaagt. Een passende veilige vervolgopstelling is nodig; geen productcode- of testwijziging kan deze echte hardwarebewijzen vervangen.

## Aanvullende gerichte LAN-diagnose

[LAN-controle16oktober](task-061-lan-check-2026-10-16.md): buiten sandbox nog steeds HTTP-timeout. Actuele Pi-netwerkinfo bevestigt192.168.88.253/24. Pc heeft geen specifieke route; tracert gaat via192.168.0.1 naar publieke upstream141.134.224.1. LAN-gate BLOCKED door ontbrekende bewezen netwerkroute; Tailscale-HA200. Geen routerwijziging uitgevoerd.

## Echte hostherstart — later op16oktober

[Echte reboot met vers versleuteld herstelpunt](task-061-host-reboot-2026-10-16.md) uitgevoerd: nieuw boot-ID,0.1.18 started, Ingress200, profielv2/rapportv3 exact behouden; na opstart live measured en actueel. Technische hostherstart-/behoudgate PASS; geen nieuwe HA-browsercontrole. Nieuwe protected CREMS-backupde404aaf van15:05:15UTC. Eerdere sectie2 hierboven beschrijft de status vóór deze proef. Geen Supervisorrestore uitgevoerd.
