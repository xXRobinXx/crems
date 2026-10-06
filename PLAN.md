# CREMS vervolgplan

Actueel onderhoudsplan: 2 oktober 2026. Task 061 is de enige actieve taak. Laatste vastgelegde Pi-versie is0.1.14; lokale kandidaat0.1.15. Geen nieuwe Supervisor-/browsercontrole met deze cleanup. [Openlijst en write sets](TASKS.md) zijn leidend naast REQUIREMENTS/ARCHITECTURE. Het vorige plan is [volledig bewaard](docs/history/implementation-plan-2026-10-01.md) als historische momentopname; oude taaklabels daar zijn geen actuele uitvoeropdracht.

## Eerst Task 061 afronden

1. **0.1.15 QA:** bevries kandidaatcode, herhaal finale fullchecks/review en bewijs de contract-CSV-regressie met actuele Agent C-browsercontrole na nieuwe expliciete gebruikersopdracht. Controleer cancel, herselectie, behouden formulierdata en geen automatische opslag/providerrequest.
2. **Release en Pi:** alleen na actuele kandidaatgate onveranderlijke versie/tag/ARM64-image publiceren; appbackup vóór benodigde update; uitsluitend CREMS bijwerken; doelversie/started en geauthenticeerde Ingress/assets/API/SSE controleren. Bewijs de actuele Pi-gebruikersreis afzonderlijk.
3. **LAN:** directe toegang via Home Assistant8123 vanaf het bedoelde Pi-subnet aantonen. Tailscale HTTP200 en localhostbewijzen vervangen dit niet; netwerkbeslissingen buiten de app apart oplossen.
4. **Herstart en herstel:** veilige resultaten na add-on-/HA-herstart of reboot aantonen; backup en rollbackuitvoerbaarheid met vastgelegd bewijs controleren. Alleen gerichte, expliciet geautoriseerde mutaties.
5. **Pi-performance:** cold/warm overdracht, cachegedrag en echte hardwaremetingen vastleggen. Geen snelheidsclaim alleen op basis van lokale tests.

Elke stap krijgt concreet bewijs en behoudt de bestaande opslag/privacy/securitygrenzen. Resterende FAIL/NOT RUN houden de gebruikersrelease CHANGES REQUIRED. De onderbroken volledige onafhankelijke audit blijft afzonderlijk open bewijs; beperkte reviews vervangen haar niet.

## Afzonderlijke backlog

- **Contractprovider:** partnerrechten, voorwaarden/kosten, credentials en actuele response bevestigen vóór live gebruik. Geen account/providerrequest of promptoverdracht vanuit een cleanup. Bewaarde vergelijking, landelijke/dynamische marktdekking en volledige financiële offerte vragen eigen requirements en taak.
- **App.tsx opdelen:** pas na afsluiting van de actieve release een aparte voorstel-/taakscope maken. Eerst huidige opslag/navigatiehandlers en regressies inventariseren; kies één scherm/clientgrens, exacte write set, geen gedragswijziging en passende regressies. Nog geen tweede actieve implementatietaak of bestandverplaatsing.

Zie [documentatieindex](docs/README.md) voor procedures en gedateerd bewijs.