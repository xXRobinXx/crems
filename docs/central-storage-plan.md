# Centrale resultaten via Tailscale

## Doel

Een gebruiker kan vanaf elke pc op het privé-Tailscale-adres een Fluvius-CSV uploaden. De Raspberry Pi verwerkt de CSV en maakt het Energiepaspoort en het batterij-dagrapport centraal beschikbaar voor alle apparaten binnen de Tailscale-toegang.

## Privacygrenzen

- De originele CSV wordt alleen tijdelijk gelezen tijdens de upload.
- De Raspberry Pi bewaart geen CSV, EAN-code, meter-ID, bestandsnaam of ruwe kwartierregels.
- Centrale opslag bevat uitsluitend gevalideerde veilige totalen, datakwaliteit, batterij-dagaggregaten en expliciet opgeslagen financiële samenvattingen.
- De website blijft uitsluitend bereikbaar via de bestaande Tailscale-route; er komt geen publieke cloudopslag of openbare login bij.

## Gewenste gebruikersflow

1. Open de website vanaf eender welke pc via Tailscale.
2. Kies bij Data een Fluvius-CSV.
3. De browser uploadt de CSV naar de Raspberry Pi via de bestaande bridge.
4. De bridge valideert en verwerkt de CSV en bewaart alleen veilige resultaten.
5. De knop **Bekijk resultaten** opent Rapport.
6. Rapport en Batterij tonen hetzelfde centrale resultaat op elke pc.
7. Een expliciete verwijderactie wist het centrale resultaat.

## Technische aanpak

- Voeg aan de bridge een kleine JSON-opslaglaag toe onder de bestaande schrijfbare app-data-map.
- Voeg beschermde endpoints toe voor ophalen, bewaren en verwijderen van het Energiepaspoort en batterijrapport.
- Hergebruik de bestaande allowlists en validatiefuncties; de server accepteert geen ruwe rapportvelden of onbekende extra velden.
- Laat de webapp bij laden eerst het centrale resultaat ophalen en gebruik lokale opslag alleen als tijdelijke fallback tijdens de overgang.
- Verplaats batterijrapport-opslag van uitsluitend browseropslag naar dezelfde centrale API; de tijdelijke CSV blijft in het geheugen van de browser of server en wordt na verwerking vrijgegeven.

## Fasen en controle

1. Bridge-opslag en API met tests voor validatie, corruptie, gelijktijdige writes en verwijderen.
2. Webapp-koppeling voor Energiepaspoort met foutmelding en offlinegedrag.
3. Webapp-koppeling voor batterij-dagrapport en expliciete opslag.
4. Privacytekst, versie-update en Home Assistant-release.
5. Testen: bridge, web, typecheck, build, upload vanaf één pc en openen vanaf een tweede browser via Tailscale.

## Open risico's

- Tailscale beperkt netwerktoegang, maar vervangt geen gebruikersscheiding. De eerste versie gebruikt daarom één privéresultaat per CREMS-installatie.
- Bij gelijktijdige uploads wint de laatst expliciet opgeslagen geldige analyse; de API moet writes atomair uitvoeren.
- Een browser zonder Tailscale-toegang krijgt een duidelijke verbindingsfout en geen gedeeltelijke data.
