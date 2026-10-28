# Task 061 — tabletcontrole — 28 oktober 2026

Gebruiker gaf expliciet opdracht de tabletcontrole te starten. Root voerde de apparaat-/browsercontrole uit; geen productiecode of netwerkinstellingen gewijzigd. Write set: dit rapport en TASKS.md.

## Bewijs

- Bestaande Android SDK ADB herkent de aangesloten Lenovo TB305FU (Tab One), Android 15. Fysiek scherm 800 × 1340; waargenomen browser in landschap 1340 × 800 inclusief systeem-/browserbalken, geen gemeten CSS-viewport.
- `ip -4 addr show wlan0` geeft tablet 192.168.0.196/24; `ip route` bevat de aangesloten route 192.168.0.0/24.
- `ping -c 2 -W 2 192.168.88.253`: 2 verzonden, 0 ontvangen. Dit bewijst geen oorzaak in routerconfiguratie.
- Chrome geopend op `http://192.168.88.253:8123/hassio/ingress/350f0e24_crems_energy`: tijdens observatie lege ladende pagina; geen geslaagde CREMS-load.
- Bestaand tabblad `http://homeassistant.local:8123/day-ahead-price/vandaag` toont expliciet Offline met gedeeltelijke oude weergave. Getoonde waarden gelden niet als actuele livegegevens.

## Status en vervolg

### Vervolg na wifiwissel

Gebruiker meldde de wifiwissel en liet de controle hervatten. Tablet nu 192.168.88.247/24; Pi-ping 2/2 ontvangen. De eerdere netwerkblokkade is opgeheven. De oude `/hassio/ingress/350f0e24_crems_energy`- en `/hassio/addon/…/info`-routes geven 404 in deze HA-versie. Via de bestaande aangemelde HA-appkaart is de actuele route `http://192.168.88.253:8123/app/350f0e24_crems_energy` geopend; beheer staat onder `/config/app/…/info`.

Begrensde browsercontrole in Agent C-rol: PASS voor daadwerkelijk laden, overgang van verbinden/demo naar Home Assistant live, veranderende gemeten waarden met oplopend tijdstip, actuele spotprijzen, vandaag-grafiek en juiste labels voor gisteren (27 oktober), vandaag (28 oktober) en morgen (29 oktober). Morgen vermeldt expliciet dat vermogen pas morgen wordt gemeten. Bestaand profiel en batterijresultaat werden na initiële centrale uitlezing beschikbaar; geen opslagmutatie uitgevoerd. Fysiek landschap 1340 × 800; exacte CSS-viewport niet gemeten.

Refresh is gestart en de verbindings-/herlaadstate is waargenomen; de daaropvolgende controle werd onderbroken door de nieuwe gebruikersopdracht voor grafiek-fullscreen. Geen complete refresh-/opslag-PASS nageclaimd. De volledige 375/1280/focus/fout-/opslagmatrix blijft open. Geen kandidaat-Pi-browsergoedkeuring of releasegoedkeuring. Nieuw fullscreenvervolg staat bovenaan TASKS.md.

Onderstaande blokkadestatus beschrijft de eerste poging vóór de wifiwissel:

Tablet-LAN-bereikbaarheid BLOCKED; CREMS-browsermatrix NOT RUN. Geen CREMS-productfout of browser-PASS vastgesteld. Navigatie, refresh, historie, live SSE, opslag, focus en aanvullende viewports blijven onbewezen op de tablet. Laptop-LAN-PASS uit het afzonderlijke rapport geldt niet voor deze tabletverbinding.

Volgende stap: gebruiker verbindt de tablet met het wifi-netwerk dat toegang heeft tot Pi 192.168.88.253; daarna dezelfde directe Ingress-route opnieuw controleren en de tabletmatrix voortzetten. Geen update, restore, routerwijziging of releasegoedkeuring.
