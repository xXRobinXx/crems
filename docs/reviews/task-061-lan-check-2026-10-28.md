# Task 061 — directe LAN-controle — 28 oktober 2026

Root; productiecode blijft bevroren. Write set: dit rapport en TASKS.md. Bestaande wijzigingen behouden. Read-only netwerkcontrole op gebruikersopdracht; geen browserbediening, update of restore uitgevoerd.

## Resultaat

Directe LAN-transportcontrole PASS vanaf laptop 192.168.88.245/24, gateway 192.168.88.1 naar Pi 192.168.88.253:8123. Eerst mislukte de beperkte netwerkcontrole; de rechtstreekse controle buiten die omgeving gaf HTTP 200. Supervisor bevestigde Pi-interface end0 op 192.168.88.253/24.

De bestaande lokale aanmelding is gebruikt zonder credentials of tijdelijke Ingress-URL vast te leggen. Uitvoering: genegeerde `.harness/task061-lan-ingress-2026-10-28.mjs`, afgeleid van de bestaande probe met uitsluitend de doelhost gewijzigd naar het LAN-adres. Exitcode 0.

- CREMS versie 0.1.18, state started; geauthenticeerd Ingress-document HTTP 200.
- CSS app-63f7e5165a14c645 en JS app-3f7dcffce4c1093d: HTTP 200 met passende contenttypes.
- api/health en api/current: HTTP 200; actuele data quality measured, source home-assistant.
- Prijshistorie vandaag en morgen: beide HTTP 200 met 96 punten; bron Energy-Charts.info / Bundesnetzagentur / SMARD.de zoals door de API gerapporteerd.
- api/stream: HTTP 200, text/event-stream, eerste event ontvangen. Dit is geen langdurige stabiliteitsmeting.
- Zonder Ingress-sessie: HTTP 401.

## Grenzen en volgende stap

Browser/tablet-QA NOT RUN: de gebruikersreactie bevestigde de netwerkwijziging en vormt geen ondubbelzinnige afzonderlijke browseropdracht. Dit rapport bewijst LAN-transport naar de geïnstalleerde 0.1.18, geen browser-PASS of kandidaatuitrol.

De eerdere 24-uursmeting eindigde INTERRUPTED op 20 oktober: elapsedSeconds 80293, clockInterrupted true, pass false. Geen 24-uurs-PASS. Restore op geïsoleerde HAOS-host, providerrechten, actuele kandidaatbrowsercontrole en overige releasegates blijven open. Volgende stap: expliciete browser/tablet-opdracht en daarna de passende apparaatcontrole; geen nieuwe releasegoedkeuring.
