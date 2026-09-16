# CREMS Requirements

## Goal

Een zelfstandige, gebruiksvriendelijke energie-app voor Belgische huishoudens die naast Home Assistant draait, echte digitale-meterdata uitleest en verbruik, prijzen, contracten en besparingsmogelijkheden begrijpelijk samenbrengt.

## Users / Actors

- bewoner/eindgebruiker zonder technische voorkennis;
- lokale CREMS-bridge;
- Home Assistant als optionele read-only databron;
- Fluvius, prijs- en contractgegevens als latere databronnen.

## Functional Requirements

- FR-001: toon live afname en injectie met bron en datakwaliteit;
- FR-002: lees Home Assistant uitsluitend via GET-verzoeken met een lokaal opgeslagen token; CREMS schrijft niet naar Home Assistant;
- FR-003: ondersteun Fluvius-kwartierdata met validatie en preview;
- FR-003a: herken het bewezen Fluvius-schema met puntkommascheiding, lokale `dd-MM-yyyy` datum/tijdvelden, vier afname-/injectieregisters, komma-decimale kWh en expliciete validatiestatus; gevoelige identificatievelden worden niet getoond of opgeslagen.
- FR-004: laat een gebruiker zijn contract invoeren en controleren;
- FR-005: vergelijk contracten transparant op het persoonlijke profiel;
- FR-006: toon alleen berekende adviezen wanneer voldoende echte data bestaat;
- FR-007: werk als zelfstandige fullscreen webapp zonder Home Assistant-frontenddependency.
- FR-008: toon de verbruiksgrafiek uitsluitend uit echte, getimede Home Assistant-history wanneer die bron beschikbaar is; een statische demo- of prijsserie mag niet als actuele of historische meting worden getoond.
- FR-009: toon energieprijzen per geselecteerde Brusselse kalenderdag uitsluitend uit echte Home Assistant-data, omgerekend van EUR/kWh naar ct/kWh; ontbrekende historie of niet-gepubliceerde morgenprijzen blijven zichtbaar leeg.
- FR-010: simuleer lokaal 0/3/5/7/10/13 kWh batterijcapaciteit op gecontroleerde kwartierdata en toon meetkwaliteit, aannames, eindlading en datagaten zichtbaar.
- FR-011: toon financiële batterijresultaten alleen na expliciet bevestigde contract- en offertegegevens; presenteer ze als energiecomponentscenario, niet als volledige factuur, offerte of gegarandeerde ROI.
- FR-012: een bewaard rapport blijft na refresh bereikbaar; schemawijzigingen hebben een geteste migratie of een zichtbare, niet-destructieve herstelstate.
- FR-013 (expliciete gebruikersopdracht 11 september 2026): de batterijpagina biedt een interactief dagrapport met datum- en batterijfilter, dagelijkse bronvolumes, gesimuleerde laad-/ontlaadenergie en laadniveau. Met het tijdelijke bronbestand kan de gebruiker binnen een geselecteerde dag de tijdlijn controleren. Dagaggregaten mogen expliciet lokaal worden bewaard; kwartierregels blijven tijdelijk. Ontbrekende dagdata krijgt een herinleesactie, geen verzonnen grafiek.

## Non-Functional Requirements

- Security: secrets nooit in frontend, logs of repository; bridge bindt standaard aan localhost. Een Home Assistant Long-Lived Access Token is niet technisch beperkt tot read-only en moet daarom als hooggevoelig geheim worden behandeld.
- Reliability: uitval van Home Assistant mag de app niet laten crashen; datakwaliteit wordt zichtbaar.
- Maintainability: TypeScript-monorepo met gedeeld domeinmodel en kleine adapters.
- Performance: live waarden binnen enkele seconden; zware historie niet iedere seconde ophalen.
- History: historyrequests hebben een expliciet begrensd tijdvenster; ongeldige, dubbele en buiten-vensterpunten worden deterministisch verwerkt voordat ze de frontend bereiken.
- Privacy: energie- en contractdata blijven lokaal tenzij de gebruiker later expliciet cloudgebruik kiest.
- Persistence: upgrades mogen veilige lokale resultaten niet stilzwijgend laten verdwijnen; verwijderen gebeurt uitsluitend via een expliciete gebruikersactie.

## Constraints

- Home Assistant bezet momenteel de fysieke P1-poort op de Raspberry Pi.
- CREMS leest daarom voorlopig via de Home Assistant API en schrijft niets terug.
- Onderzoek en oude prototypes mogen actieve builds niet beïnvloeden.

## Data semantics

- `measured`: rechtstreeks uit de geconfigureerde databron gelezen en succesvol genormaliseerd;
- `estimated`: berekend of tijdelijk lokaal ingevuld, nooit presenteren als echte meting;
- `incomplete`: de bron is bekend, maar de actuele lezing is onvolledig of mislukt;
- ontbrekende prijs- of contractgegevens mogen niet stilzwijgend als een echte nulprijs worden gepresenteerd;
- bedragen en adviezen moeten hun invoer, tariefeenheid en berekeningsperiode traceerbaar maken.
- de grafiek onderscheidt loading, leeg, fout en gemeten data zichtbaar; ontbrekende prijshistorie of adviesdata wordt niet met fictieve waarden aangevuld.
- prijspunten bevatten een canonieke UTC-timestamp en `priceCtKwh`; negatieve en nulprijzen zijn geldig, maar niet-eindige/onbekende waarden niet.

## Non-Goals — huidige fase

- automatische leverancierswissel;
- betalingen of contractafsluiting;
- cloudaccounts en externe opslag;
- directe gedeelde toegang tot dezelfde seriële P1-poort.

## Actuele productstatus

| Status | Functionaliteit |
|---|---|
| Module bewezen | read-only Home Assistant live data, daghistory, echte prijsreeks, streaming Fluvius-controle, veilige profielaggregaten en pure batterij-/contractberekeningen |
| Beschikbaar in lokale webapp | expliciet Energiepaspoort v2, duurzaam batterijrapport v3 en persoonlijke vergelijking van twee zelf ingevoerde vaste/variabele energiecomponenten |
| Niet vrijgegeven | automatische marktbrede contractkeuze, bewaarde contractvergelijking, volledige financiële offerte en Raspberry Pi-deployment |

Een modulegoedkeuring is geen eindgebruikersrelease. Zichtbare functionaliteit is pas vrijgegeven na een volledige browsergate van de gebruikersreis.
