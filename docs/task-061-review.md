# Task 061 — Operationele audit en releasecontrole

Datum: 1 oktober 2026
Reviewer: Agent A, onafhankelijk van de root-toolschrijver; geen Astra-modelclaim.
Review tool-/test-/documentatiewijzigingen: **APPROVED** op basis van codecontrole en aangeleverd actueel testbewijs.
Task 061 / volledige gebruikersrelease: **CHANGES REQUIRED** wegens open directe LAN- en Agent C-browsergate.

## Scope en review

De audit vergeleek REQUIREMENTS, ARCHITECTURE, TASKS, bestaande code/tests, AGENT_PLAYBOOK en PRODUCT_AUDIT. README en de architectuurrisico's bevatten verouderde claims over open P1-codeproblemen, ontbrekende tests en ontbrekend Git. Deze zijn gecorrigeerd; gedateerde historische bewijzen blijven herkenbaar. Requirementsfunctionaliteit en financiële/privacysemantiek zijn niet aangepast.

De review van `tools/release-crems.ps1` en `tools/ha-supervisor.mjs` bevestigt dat de helper uitsluitend info/catalogusreload/update voor CREMS Energie toestaat, updatebackup afgedwongen blijft, de HA-token via stdin gaat en upstreamfouttekst niet wordt weergegeven. Info-output bevat uitsluitend versie, nieuwste versie en status; opties en sessie-URL worden weggelaten. Na update pollt de releaseprocedure read-only tot versie/started of een begrensde deadline, zonder de mutatie te herhalen. De nieuwe tests dekken matching response-ID, authenticatiefout, disconnect, timeout, toegestane actie en backup. Actuele helper- en harnessregressies: 11/11 PASS. Na timeout/disconnect moet eerst read-only statuscontrole plaatsvinden; een update wordt niet automatisch opnieuw verstuurd.

Ingress-review: beide manifests hebben `ingress: true` zonder gepubliceerde LAN-poort. De Docker-runtime zet `CREMS_REQUIRE_INGRESS_PEER=true`; `apps/bridge/src/server.ts` controleert vóór alle handlers de exacte peer via `ingress.ts`. History- en contractclients gebruiken relatieve API-routes. De releasehandleiding beschrijft de actuele WebSocket-opdrachten en LAN-route via Home Assistant op 8123. Geen browser of scherm overgenomen.

## Actueel bewijs

Root rapporteert een geauthenticeerde read-only Supervisor-infoaanvraag: versie 0.1.13, nieuwste versie 0.1.13, toestand started. De bestaande genegeerde lokale tokenconfiguratie is gebruikt zonder geheimen in het rapport. Geen update uitgevoerd; geen nieuwe backup gemaakt of gecontroleerd. Dit bewijst versie/status, geen actuele zichtbare gebruikersreis.

Read-only `/network/info` bevestigt interface end0 met `192.168.88.253/24` en gateway `192.168.88.1`. Direct GET naar LAN-poort 8123 gaf vanaf de huidige host timeout. HA via Tailscale gaf 200; een tijdelijke geauthenticeerde Ingress-sessie gaf HTML 200/no-store (436 bytes, CREMS), CSS `app-cbc1e7a75e6549bb.css` en JS `app-aafc72f3432df03f.js` 200/immutable, `api/health` 200/no-store (90 bytes) en `api/current` 200/no-store (209 bytes). Geen tijdelijke sessie-URL of meterdata opgeslagen. Dit bewijst runtime-HTTP over Tailscale, geen direct LAN- of zichtbaar browserbewijs. De LAN-link is [CREMS Energie](http://192.168.88.253:8123/hassio/ingress/350f0e24_crems_energy). Actueel testbewijs: core 65/65, web 134/134 en bridge 101/101 vóór de nieuwe peerregressie; volledige build/typecheck PASS. De productie-startsuite inclusief nieuwe peerregressie slaagt 9/9. Finale full harness PASS: harness 5/5, core 65/65, bridge 102/102 en web 134/134; build/typecheck exitcode 0. Helpertests afzonderlijk 6/6 PASS. Fingerprint stabiel (`stable=true`): `05c451acd3857920e60b0e3f7f442c78bb58cc575e73fb5490468b2f3861ee0a`. Agent C-browsergate: **NOT RUN**. De huidige opdracht bevat geen nieuwe expliciete browserbedieningsopdracht zoals vereist in AGENTS.md en AGENT_PLAYBOOK.md.

## Open gates

- Directe LAN-bereikbaarheid vanaf een apparaat op het Pi-thuisnetwerk bewijzen; de hosttimeout en Tailscale-success mogen dit niet vervangen.
- Gecontroleerde wijzigingen committen/pushen; finale full harness is PASS.
- Actuele Agent C-Pi-browser-PASS voor desktop/mobiel, refresh/opslag, live gegevens, foutstaten en runtimecache.
- Herstart-/reboot- en rollbackbewijs uit de bestaande releasegates.

Geen providerrequest, nieuwe functie, runtimeprofielwijziging, geheim of Ingress-sessie-URL in deze documentatie. Historische modulegoedkeuringen sluiten deze open gates niet.
Actuele netwerkbevinding Task 061 (1 oktober): de huidige pc heeft Wi-Fi-adres `192.168.0.243/24`, gateway `192.168.0.1`; de Pi heeft `192.168.88.253/24`, gateway `192.168.88.1`. Ze zitten in verschillende IPv4-subnets. De directe timeout past bij ontbrekende routering tussen deze netwerken; de routerconfiguratie is niet gecontroleerd of gewijzigd. De pc moet toegang krijgen tot het Pi-subnet (bijvoorbeeld hetzelfde niet-geïsoleerde thuisnetwerk) of een bestaande route gebruiken. De tijdens deze run werkende toegang gebruikt [Home Assistant via Tailscale](http://homeassistant.tail582404.ts.net:8123/hassio/ingress/350f0e24_crems_energy). Er is geen bewijs dat een willekeurig apparaat op het Pi-subnet niet kan verbinden.
## Finale onafhankelijke code-review

De finale helper filtert inforesponses tot versie/latest/status; de regressie bewijst dat secret- en sessievelden verdwijnen. Post-updatecontrole doet alleen read-only polling en herhaalt de update niet. De nieuwe echte productie-HTTP-test start de gebouwde bridge zonder lokale geheimen in een tijdelijke omgeving en bewijst 403/no-store/geen wildcard CORS voor root en geneste assets, meter-API, SSE en opslag-PUT/DELETE vanaf localhost. Een gespoofde `X-Forwarded-For: 172.30.32.2` kan de socketpeercontrole niet omzeilen. De test ruimt proces en tijdelijke data op. De finale diff bevat geen productiegedragswijziging of dependency.

Agent A inspecteerde de actuele tool- en testdiff en voerde `git diff --check` succesvol uit. Suite-uitvoering en de live netwerk/HTTP-aanvragen zijn door root/Agent B gerapporteerd; Agent A heeft die aanvragen niet onafhankelijk opnieuw uitgevoerd. Geen concrete codeblocker gevonden voor deze beperkte wijzigingen. Direct LAN-verkeer vanaf de huidige host blijft onbereikbaar en actuele visuele QA is niet uitgevoerd; daarom blijft de gebruikersrelease CHANGES REQUIRED ondanks goedgekeurde wijzigingen.
Aanvullende documentatie-write set: `docs/task-037-haos-app.md`, uitsluitend de gedateerde actuele status vóór de herkenbaar historische installatie-wachtstatus. PowerShell-parser PASS volgens root. Het vooraf bestaande lege `apps/web/test-price-run.txt` is door root behouden in de genegeerde `.harness/test-price-run-original.txt`; er is geen test- of runtime-inhoud verwijderd. Geen attestaties gewijzigd. Finale full harness is door root uitgevoerd en PASS; Git-afhandeling volgt bij root.
Actuele `pnpm harness gate`: **NOT APPROVED**. Voor deze fingerprint ontbreekt een volledige Agent A APPROVED-attestatie en een Agent C PASS-attestatie. De beperkte tool-/test-/docreview hierboven vervangt deze volledige releaseattestaties niet. Er is geen attestatie vervaardigd of aangepast om de gate te passeren; de volledige release blijft CHANGES REQUIRED.