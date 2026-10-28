# Task061 — gerichte LAN-controle — 16 oktober 2026

Resultaat: BLOCKED, geen LAN-PASS. Read-only uitgevoerd buiten sandbox zodat de sandbox geen verklaring voor de timeout is. Geen netwerkconfiguratie gewijzigd.

- Pc: Wi-Fi192.168.0.243/24, gateway192.168.0.1; Ethernet niet verbonden.
- Actuele Supervisor-netwerkinfo om14:56:25.953UTC (16:56Brussels): Pi-interface end0,192.168.88.253/24, gateway192.168.88.1.
- Windows-routetabel: geen specifieke route naar192.168.88.0/24; bestemming gebruikt standaardgateway192.168.0.1.
- Gerichte tracert naar192.168.88.253: hop1=192.168.0.1; hop2=141.134.224.1; daarna timeout. Het verkeer bereikt dus een publieke upstreamhop in plaats van een bewezen route naar het Pi-subnet. Exacte topologie achter de routers niet vastgesteld.
- Direct HTTP naar192.168.88.253:8123: NO_HTTP_RESPONSE na6012ms; TCP/ping eveneens niet geslaagd.
- Controle via bestaande Tailscale-HA-verbinding: /api/200 en /api/config200, HA2026.8.3. Pi is via die route bereikbaar.

Benodigde vervolgstap: pc aansluiten op het netwerk192.168.88.x van de Pi, of de juiste route tussen beide netwerken op de betreffende routers vaststellen/configureren. Geen willekeurige statische route toegevoegd: de bereikbare next-hop naar het Pi-subnet is niet bekend. Daarna directe HA-poort8123 en geauthenticeerde Ingress opnieuw controleren. Geen directe bridgepoort openen.
