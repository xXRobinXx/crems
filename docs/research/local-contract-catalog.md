# Lokale contractcatalogus — leveranciers en broncontrole

## Alle leveranciers — uitbreiding 4 oktober 2026

De gebruiker vroeg alle leveranciers uit de besproken integratie. De registry bevat 18 echte leveranciers en daarnaast `custom`, dat geen leverancier is. CREMS importeert publieke feiten uit [be_price_cards op vastgelegde revisie](https://github.com/renaudallard/be_price_cards/tree/61e6d8aeea2f3207fccbc9e550484336d61021a5/electricity/cards). De [archiefdocumentatie](https://github.com/renaudallard/be_price_cards/blob/61e6d8aeea2f3207fccbc9e550484336d61021a5/electricity/README.md) beschrijft dagelijkse extracties, PDF-digests en dekking. Dit is een community-extractiebron, geen onafhankelijke controle van iedere PDF. De rechtstreeks gecontroleerde EnergyVision-kaart vervangt haar equivalente importrow.

Catalogus: 207 particuliere contract-/regiokaarten, waarvan 195 oktoberkaarten en 12 oudere kaarten voor producten zonder oktoberrow. Regio's: Vlaanderen 97, Wallonië 75, Brussel 35. Prijssoorten: vast 60, variabel 87, dynamisch 38, tijdvakken 10 en maandindex 12. Dit telt contract/gewestrijen, geen 207 unieke contracten. DATS 24 heeft geen kaart in dit archief; Ecopower alleen septemberkaarten. Beide blijven in de dekkinglijst. De upstream DATS-provider beschrijft de overgang naar EnergyVision; dit is niet zelfstandig door CREMS geverifieerd.

Alle leveranciers: Aspiravi, Bolt, Cociter, DATS 24, EBEM, Ecofix, Ecopower, Eneco, Energie.be, Energy Knights, EnergyVision (inclusief upstream Brusol-producten), ENGIE, Frank Energie, Luminus, Mega, OCTA+, TotalEnergies en Trevion. Professionele `_pro_`-producten worden uitgesloten; onbekende fiscale schema's worden geweigerd. Niet iedere leverancier verkoopt in ieder gewest en een actuele kaart bewijst geen huidige afsluitbaarheid. Leveranciers buiten de upstreamregistry worden niet als gedekt geclaimd.

`tools/import-supplier-catalog.mjs` leest het lokaal uitgepakte archief. Per contract/regio kiest het oktober of de laatste oudere row. EUR/kWh wordt ct/kWh; expliciete exclusief-btwprijzen worden eenmaal met 6% verhoogd. Ontbrekend of alleen aangenomen btwpercentage blijft `null`, zonder jaarberekening. De import heeft 52 rows zonder expliciet percentage; de gecontroleerde EnergyVision-row herstelt één daarvan in de eindcatalogus. Looptijd nul betekent onbekend en wordt zo getoond. Ontbrekende injectie blijft onbekend.

Vaste bedragen gebruiken dag-/nachtprijzen en vaste vergoeding. Variabele bedragen zijn scenario's bij een heel jaar onveranderde gepubliceerde prijzen. Index-only, dynamische en meer-tijdvakproducten krijgen zonder passende gegevens geen jaarprijs. Injectie krijgt in deze stap geen jaarkrediet, ook bij een vast tarief: voorwaarden en meterregelingen zijn niet uitgewerkt. Kortingen, deelnamevoorwaarden, bijzondere meterregelingen, netkosten en heffingen zijn niet inbegrepen en staan zichtbaar vermeld. Enkelvoudig tarief wordt getoond maar niet gebruikt voor het expliciete dag-/nachtscenario.

Runtime gebruikt alleen `apps/bridge/src/supplier-catalog-data.ts`, zonder GitHub-/PDF-fetch of Python-/HA-dependency. Filters werken lokaal; twintig kaarten per pagina begrenzen de weergave. Een nieuwe import vereist nieuwe revisie/maand, broncontrole, tests en review. Geen automatische maandupdate, Pi-uitrol of browser-PASS: browser NOT RUN zonder nieuwe expliciete opdracht.

Geen upstream Python-code, volledige tariefkaarten of logo's worden gebundeld. De adapter is onafhankelijk; feitelijke tarieven, formulecoëfficiënten en bronverwijzingen zijn herleidbaar. BSD-2-Clause van de integratie wordt niet als algemene licentie op leveranciers-PDFs of het aparte archief voorgesteld. Bronattributie staat in de pinned archief- en leverancierslinks.

## Eerste rechtstreeks gecontroleerde kaart

Gebruikersopdracht 4 oktober 2026: vergelijking zonder partneraanvraag of sleutel. Referentie: [Renaud Allards Belgische prijsintegratie](https://github.com/renaudallard/homeassistant_be_electricity_prices), met leverancieradapters, bron-/maandmetadata en afzonderlijke tariefcomponenten. De geraadpleegde EnergyVision-adapter wijst naar de eigen leverancierlisting. Licentie BSD-2-Clause gecontroleerd; CREMS heeft een zelfstandige TypeScript-implementatie en neemt geen Python-code over.

## Gecontroleerde primaire bron

- [EnergyVision tariefkaarten](https://www.energyvision.be/nl-be/tariefkaart).
- [Goedkope stroom 3 jaar vast, oktober 2026](https://www.energyvision.be/sites/default/files/inline-files/EV-1026-GS3JV-nl.pdf), particulieren Vlaanderen.
- Op 4 oktober 2026 gedownload, tekst van pagina 1–2 uitgelezen en pagina 1 visueel gecontroleerd.
- SHA256: `efd74f20dade8597b4ee7eaff1244d72ac9915c59f0e6797cafdd6d65bca94ad`.
- Afname: 13,57 ct/kWh; vaste vergoeding 75 euro/jaar; inclusief 6% btw; afnameprijs gedurende 36 maanden vast.
- Injectie: 3,27 ct/kWh als gepubliceerde indicatie; maandformule 0,6 × Belpex-SPP-M − 15 EUR/MWh, met minimum 1 ct/kWh. Die indicatie wordt niet als vaste jaarprijs doorgerekend.

De kaart geldt voor nieuwe aanbiedingen in oktober; contractlooptijd verlengt haar aanbodactualiteit niet. De snapshot blijft na oktober leesbaar maar blokkeert nieuwe jaarberekening. Jaarvolumes leveren uitsluitend een afnamecomponent plus leveranciersvergoeding; overige factuurcomponenten en injectiesaldering ontbreken bewust en worden zichtbaar benoemd.

## Grenzen en onderhoud

Eén gecontroleerd contract en één regio vormen geen marktbrede vergelijking. De lokale GET doet geen upstreamrequest en verstuurt geen persoonlijke invoer; berekening blijft in de browser. Geen partnerkeys, scraping van accounts, nieuwe dependencies of automatische leverancierswissel. Publieke beschikbaarheid van de kaart wordt niet als algemene herpublicatielicentie voor de volledige PDF geclaimd; alleen factuele tariefgegevens en bronverwijzing worden gebundeld, niet de PDF of leverancierlogo's.

Een nieuwe kaart vereist broncontrole, nieuwe digest, aanbodmaand en tests. Automatische PDF-extractie/updates en aanvullende leveranciers zijn vervolgwerk. Voor een parser volgt CREMS het leverancier-per-moduleprincipe; verkeerde units, btwbasis, periode, regio of prijssoort moeten tot een fout leiden in plaats van een stille prijs. Open-source codegebruik in vervolgwerk vereist behoud van de toepasselijke licentietekst.
