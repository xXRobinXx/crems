# Task 061 — operationele vervolgcontroles onderzocht — 14 oktober 2026

## Reikwijdte en bewijsbasis

Dit is een read-only onderzoek van de actuele taskstatus, CREMS-releaseprocedure, deploymentrapporten en Supervisor-helper. Er is geen browser of netwerk bediend, geen runtimeopslag of backupinhoud gelezen, en geen Home Assistant-, router- of Pi-instelling gewijzigd. Er is geen restore, rollback of herstart uitgevoerd. Dit rapport is een uitvoerplan, geen operationele PASS of releasegoedkeuring.

De huidige baseline is Pi 0.1.18, `started`, met een Supervisor-updatebackup van 14 oktober die CREMS bevat. De huidige gebruikersbrowser heeft na de appupdate het bewaarde profiel en batterijrapport behouden. De HA-host is tijdens die update niet herstart. De eerder uitgevoerde opslagrestore gebruikte synthetische opslag buiten de productiehost; die bewijst geen Supervisor-restore. Bronnen: [deployment018](task-061-deployment018-2026-10-14.md), [deployment017](task-061-deployment017-2026-10-13.md), [releaseprocedure](../release-home-assistant.md).

## Bevindingen en veiligste vervolgstappen

### Fysieke LAN

Vastgelegd: Pi `192.168.88.253/24`, gateway `192.168.88.1`; pc `192.168.0.243/24`, gateway `192.168.0.1`. Dit zijn verschillende IPv4-subnets. Een timeout vanaf de huidige pc bewijst daarom alleen dat de huidige route geen HTTP-antwoord oplevert; hij bewijst niet dat de Pi vanaf hetzelfde thuisnetwerk onbereikbaar is. Routering, VLAN's, gastnetwerkisolatie en firewallregels zijn niet onderzocht.

Laagste-risico verificatie: voer vanaf een apparaat dat al op hetzelfde niet-geïsoleerde LAN/VLAN als de Pi zit een verbindingstest uit naar Home Assistant TCP 8123, open daarna Home Assistant en CREMS via geauthenticeerde Ingress. Noteer alleen client-subnet, HTTP-/pagina-uitkomst en tijd; geen URL met Ingress-sessietoken. Behoud Ingress als ingang; poort 8099 hoort intern te blijven. Als er geen bestaand apparaat op dat subnet beschikbaar is, blijft de gate geblokkeerd door ontbrekende route/apparaat. Pas na die feitelijke controle kan een aparte, expliciet afgebakende netwerktaak beoordelen of een routerroute of wifiwijziging nodig is. Geen ongerichte routerreset.

### Supervisor-backuprestore en rollback

De aangetroffen releasehelper dwingt voor updates `backup: true` af en controleert appstatus; hij bevat in deze procedure geen restore-/rollbackstap. De actuele partial-backup is een herstelpunt, geen bewijs dat hij herstelbaar is. Restore op de enige productie-HA-host kan add-onconfiguratie of appdata terugzetten en actuele wijzigingen verliezen; daarom hoort de eerste echte proef op een aparte test-HAOS-host of een expliciet daarvoor bestemde kloon plaats te vinden.

Veilige volgorde op een testhost: inventariseer via Home Assistant alleen de backupmetadata (datum, partial/full en aanwezigheid van CREMS); bescherm de backup als gevoelig en lees of exporteer de inhoud niet. Leg de testhostversie en lege beginsituatie vast, herstel uitsluitend de CREMS-appbackup op die host, en controleer `started`, geauthenticeerde Ingress, en aanwezigheid van profiel/rapport via de normale UI indien die resultaten in de herstelde store thuishoren. Controleer daarna dat de productieve Pi en zijn huidige resultaten onaangeroerd zijn. Een mislukte proef stopt daar; raak geen productiebackup aan. Zonder aparte host kan alleen gedocumenteerd worden dat de backup bestaat en kan worden geselecteerd, niet dat restore/rollback slaagt. Geen actuele productie-restore uitvoeren in deze scope.

### Hostherstart en behoud van resultaten

De appupdate liet profiel en batterijrapport intact; dat is bewezen upgradebehoud. Een Home Assistant-hostherstart is nog niet uitgevoerd en is een aparte onderbreking. Op een passend onderhoudsmoment hoort de proef te beginnen met een UI-waarneming van beide resultaten en de actieve appversie; maak vooraf een nieuwe appbackup via de bestaande Supervisor-backupflow. Herstart daarna uitsluitend de HA-host via de normale HA-bediening, wacht op HA `started` en CREMS Ingress, en controleer dezelfde resultaten plus actuele liveverbinding. Vergelijk alleen aanwezigheid en status, niet persoonlijke waarden. Bij een afwijking: stop, behoud de backup en herstel niet automatisch.

Deze proef toont resultaatbehoud na hostherstart op die installatie; zij vervangt de aparte rollback/restoreproef niet. De huidige backup-update en browser-PASS zijn geen vervanging voor die herstartwaarneming.

### Langere stabiliteit

De actuele deployment018-controle toont live data na update en routewisseling; deployment017 bevat een eerdere twee-minutenmeting (107 events). Geen van beide is langdurig hardwarebewijs en de oorspronkelijke intermitterende SSE-oorzaak is onbekend.

Voorgestelde niet-mutatieve meetstap: houd de bestaande installatie ongewijzigd en observeer gedurende 24 uur via de normale UI, met een privacyveilige teller van meetduur, geldige/live waarnemingen, offline-/reconnectmomenten en maximale berichtouderdom. Leg geen meterwaarden, entity-ID's, tokens of sessie-URL's vast. Gebruik minimaal een continue lichte statuswaarneming; losse screenshots bij begin/einde kunnen korte uitval missen. Een 24-uurs-PASS betekent alleen dat er in die meetperiode geen vooraf gedefinieerde serviceonderbreking is waargenomen; het is geen garantie voor toekomstige beschikbaarheid of algemene Pi-hardwarelevensduur. Als continue privacyveilige waarneming niet beschikbaar is, rapporteer die meetvorm als NOT RUN in plaats van volledigheid te suggereren.

## Gate-status

| Controle | Status op 14 oktober | Ontbrekend bewijs / volgende veilige stap |
|---|---|---|
| Appupdate en behoud na upgrade | PASS volgens actuele deployment018 | Reeds vastgelegd; geen nieuwe claim nodig |
| Fysieke LAN via HA Ingress | OPEN | Verifieer vanaf bestaand apparaat op Pi's niet-geïsoleerde subnet; anders ontbreekt bereikbare route/client |
| Werkelijke Supervisor-restore/rollback | OPEN | Restore uitsluitend op aparte testhost/kloon; productiebackupinhoud blijft onaangeroerd |
| HA-hostherstart en behoud | OPEN | Afzonderlijke onderhoudsproef met verse appbackup en alleen status-/aanwezigheidsvergelijking |
| Langere hardware-/dienststabiliteit | OPEN | Privacyveilige 24-uurswaarneming met vooraf vastgelegde grens; beperkte periode expliciet houden |

De vier open punten vereisen respectievelijk een client in het juiste netwerk, een geïsoleerde restoreomgeving, een gepland HA-onderhoudsmoment en een langlopende waarnemingsmogelijkheid. Dit rapport voert ze niet uit en verandert hun status niet.
