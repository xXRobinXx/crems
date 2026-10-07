# Gerichte vervolginspiratie voor CREMS

6 oktober 2026. Read-only onderzoek na gebruikersopdracht; geen nieuwe producttaak, upstreamimport, dependency, codekopie of runtime-integratie. Voorstellen vervangen geen requirements, releasegates of huidige taak. De vastgelegde CREMS-importrevisie blijft ongewijzigd.

## Eerst de open release afronden

De concrete volgorde in PLAN/TASKS blijft: actuele review en volledige browsermatrix, ARM64-publicatie, CREMS-update met backup, echte Pi-Ingress/runtime, LAN en herstelbewijs. Contractknop-/presentatiebewijs is begrensd; het sluit de volledige matrix niet. Geen nieuwe functie starten voordat de huidige taak goedgekeurd is.

## Drie gerichte ideeën

1. **Cataloguswijzigingen zichtbaar maken.** De [upstreamintegratie](https://github.com/renaudallard/homeassistant_be_electricity_prices) documenteert detectie van veranderd leveranciersaanbod. Mijn voorstel: een read-only onderhoudsvergelijking tussen de huidige gepinde import en een nieuw voorgesteld archief, met toegevoegd/verdwenen/gewijzigd en bron/digest. Eerst menselijke bronreview, daarna pas expliciet bundelen; geen automatische runtimeprijzen wijzigen.

2. **Bij uitval laatste bekende kaarten behouden met waarschuwing.** Dezelfde upstreambron beschrijft behoud van de laatste snapshot plus zichtbare ouderdom en herstelmeldingen. Voor CREMS zou dit later een bestaande in-memorycatalogus kunnen behouden tijdens een mislukte refresh, duidelijk met foutstatus en maandvalidatie. Nieuwe schatting op een verouderde kaart blijft verboden; geen extra persoonlijke opslag. Eigen beperkte taak en failure/retrytests nodig.

3. **Nieuw archiefformaat vooraf controleren.** De huidige [be_price_cards-documentatie](https://github.com/renaudallard/be_price_cards) beschrijft maandelijkse releaseassets, genoemd naar SHA256, per electricity/gas/water-namespace. Voor een toekomstige onderhoudsimport eerst het actuele listing-/assetformaat onderzoeken en een nieuwe revisie vastleggen; de oudere gepinde CREMS-tree blijft geldig historisch bewijs. Gas/water zijn geen geautoriseerde uitbreiding.

## Blijvende securitygrens

De [officiële Home Assistant-presentatiedocumentatie](https://developers.home-assistant.io/docs/apps/presentation/) vereist dat een Ingress-server uitsluitend peer172.30.32.2 accepteert. De bestaande CREMS-release-eisen sluiten daarop aan. QA-preview zonder peerhandhaving op localhost is geen bewijs van echte Home Assistant-authenticatie; de uiteindelijke Pi-check blijft nodig.

Dit zijn voorstellen op basis van online projectdocumentatie, geen zelfstandige verificatie van alle upstreamcode/tarieven of algemene financiële aanbeveling. Geen extra marktdekking of volledige factuurprijs geclaimd.
