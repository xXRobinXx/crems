# Task061 — echte HAOS-hostherstart — 16 oktober 2026

**PASS voor API-/gegevensbehoudcontrole op de bestaande Pi0.1.18.** Geen kandidaat geïnstalleerd, geen restore of rollback uitgevoerd. Deze run bediende geen HA-browser; aanwezigheid en ongewijzigde inhoud zijn via de normale geauthenticeerde CREMS-resultaatAPI bewezen.

## Uitgevoerd

1. Voorcontrole: Supervisor healthy/supported, host ondersteunt reboot, CREMS0.1.18 started en boot auto. Energieprofielv2 en batterijrapportv3 aanwezig. Vergelijkingsdigests uitsluitend in genegeerde lokale bewijsbestanden, geen persoonsgegevens/meetwaarden gelogd.
2. Nieuwe Supervisor partial-backup uitsluitend CREMS: `de404aaf`,16oktober2026 15:05:15.125952UTC (17:05:15Brussels), protected=true, compressed, grootte0.12 volgens Supervisor. Nieuwe willekeurige backupsleutel lokaal met WindowsDPAPI/CurrentUser versleuteld; decryptie met dit Windowsaccount getest. Geen backupsleutel of HA-token afgedrukt.
3. Eén POST `/host/reboot` om15:05:35.113UTC (17:05:35Brussels). Verbinding viel tijdens uitvoering weg; geen tweede rebootpoging. Alleen terugkeer met gewijzigd actueel boot-ID telt als rebootbewijs.
4. Nieuw host-boot-ID bevestigd. Om15:08:46.694UTC: CREMS0.1.18 started, geauthenticeerde Ingress200; energieprofielv2 en batterijrapportv3 aanwezig en JSON-inhoud exact gelijk aan vóór de herstart.192seconden sinds opdracht, inclusief onze periodieke controles; geen exacte downtimeclaim.
5. Eerste lezing was nog niet measured/actueel tijdens opstart. Hercontrole15:09:27.431UTC (17:09:27Brussels): measured/home-assistant, timestamp minder dan10soud, liveValid=true. Eindresultaat pass=true. De eerste false-uitkomst is in de monitorlog bewaard; geen onmiddellijke-liveclaim.
6. Alleen configuratie-aanwezigheid gecontroleerd: complete externe providerconfiguratie ontbreekt (providerConfigured=false); geen providerrequest of contractvergelijking verstuurd.

## Bewijs en herstelpunt bewaren

`.harness/task061-ops-preflight.json`, `task061-fresh-backup.json`, `task061-reboot-request.json`, `task061-host-reboot-monitor.log`, `task061-host-reboot-result.json`, `task061-audit-safety-checks.json`. Deze bestanden en backups worden niet tijdens QA-cleanup verwijderd.

Backupsleutelbestand: `.harness/task061-backup-key.dpapi`. Bewaar dit bestand én toegang tot hetzelfde Windowsgebruikersprofiel: CurrentUser-DPAPI maakt het geen algemeen overdraagbare herstelcode. Het staat bewust buiten Git; verwijderen van `.harness` zou dit nieuwe herstelpunt zonder de bijbehorende lokale sleutel onbruikbaar kunnen maken. Bestaande oudere Supervisorbackups blijven onaangeroerd. Er is geen backupinhoud geëxporteerd, geïnspecteerd of naar een andere host gestuurd. Protected/aanwezig en lokale sleuteldecryptie bewijzen nog geen geslaagde Supervisorrestore.

Officiële endpoints vooraf gecontroleerd in [Home Assistant Supervisor API-bron](https://github.com/home-assistant/developers.home-assistant/blob/master/docs/api/supervisor/endpoints.md): partial-backup met addonselectie/password; hostreboot zonder force. Credentials alleen uit bestaande lokale configuratie intern gebruikt.

## Resterende grens

Hostherstart en gegevensbehoud zijn technisch bewezen. Geen actuele HA-browserwaarneming uitgevoerd in dit vervolg; eerdere lokale browsermatrix en Pi-browserbewijs van14oktober blijven afzonderlijk gedateerd. Echte Supervisorrestore/rollback vereist nog een geïsoleerde HAOS-testhost. Langdurige24uursstabiliteit is een aparte meting en wordt niet uit dit rebootresultaat afgeleid.
