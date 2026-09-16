# Dagrapport — controlebewijs

Gebruikersopdracht: interactief rapport op de batterijpagina met datumfilter, batterijfilter, grafieken en controle van de energiestromen binnen één dag.

## Acceptatiechecklist Agent C

- Alle KPI's, grafieken en tabel volgen dezelfde datum en capaciteit. Bronafname en broninjectie veranderen niet bij een andere batterij.
- Beginlading + geladen energie − ontladen energie − conversieverlies − verlies door gaten = eindlading. Dagtotalen sluiten aan op de volledige simulatie.
- Lading blijft behouden over middernacht; detailreplay verwerkt eerdere dagen om de juiste beginlading te krijgen.
- Brusselse dagen volgen zomer-/wintertijd (92/100 kwartieren). Herhaald lokaal uur blijft in absolute tijdvolgorde.
- Ontbrekende dagen/kwartieren zijn onbekend, geen nulmeting. Grafieklijnen verbinden geen gaten. Schattingen en resets blijven zichtbaar.
- Bewaarde dagaggregaten overleven refresh; intradaydetail is tijdelijk en vraagt na refresh het bronbestand. Filteren schrijft niets.
- Oude rapporten zonder dagdata blijven bereikbaar met een concrete herinleesactie.
- Maximaal 4.000 dagaggregaten en 100 detailkwartieren per capaciteit. Opslag weigert extra velden, kwartierregels en ongeldige waarden/balansen. Verouderde async resultaten kunnen de laatste selectie niet overschrijven.

## Onafhankelijke rekenreferentie

Bij 3 kWh capaciteit, 1,5 kW vermogen en 90% rondrendement: een kwartier met 1 kWh injectie kan 0,375 kWh laden. De batterij bevat daarna ongeveer 0,355756 kWh. Een aansluitend kwartier met 1 kWh afname kan 0,3375 kWh uit de batterij ontvangen. De totale verliezen zijn 0,0375 kWh; de eindlading is nul. Als middernacht tussen die twee kwartieren valt, moet de tweede dag beginnen met dezelfde 0,355756 kWh.

## Status

Implementatie gereed op 12 september 2026. Agent A heeft de volledige build, tests en typecheck succesvol uitgevoerd. Web: 90/90; bridge: 67/67; core-suite geslaagd. De gerichte nieuwe controles bewijzen middernachtcarry-over, 92/100 kwartieren op DST-dagen, begrensde dagopslag, verliesbalans, veilige oude rapporten, datum-/capaciteitsfilters, lege dagen, expliciete detailreplay en vrijgave van eerder dagdetail. Een volledig synthetisch jaar doorloopt berekenen, dagopslag, financiële aanvulling en refreshroundtrip.

Agent C vond tijdens code-review twee opslaggaten (conversie/gatverlies onderling verwisselbaar, ontbrekend gatbewijs) en een mogelijke ongeldige geselecteerde datum na propwissel. Deze zijn gecorrigeerd met gerichte assertions. De website is opnieuw gestart en wordt via HTTP gecontroleerd. Geen browser-PASS: de actuele opdracht bevat geen expliciete browserbediening. Bestaande gebruikersopslag is niet aangeraakt voor QA.
