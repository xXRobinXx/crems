# Task 037 — overzicht en grafieken

Gebruikersopdracht: 21 september 2026, verbeterpunten bevestigd met screenshot. Agent B is enige productieschrijver; Agent A documenteert en reviewt. Geen browserbediening geautoriseerd of uitgevoerd.

## Agent C-checklist vóór implementatie

- Gebruikerscorrectie 22 september: desktop 1280 px en mobiel 375 px behouden één gecombineerde prijs- en vermogensgrafiek met watt links, ct/kWh rechts en hetzelfde Brusselse dagvenster, begin/eind en tussentijdlabels. Dit vervangt het eerdere voorstel voor afzonderlijke grafieken.
- Laatste prijsinterval volledig waar de duur onderbouwd is; onbekende perioden niet invullen. Controleer één punt, nul, negatieve en positieve prijzen, gaten, onvolledige publicatie en 23-/25-uursdagen. Min/max komen uit echte prijzen, niet uit de nul-as.
- Exacte waarden via keyboard en touch beschikbaar; alleen SVG-titels zijn onvoldoende. Dubbele winteruren moeten onderscheidbaar zijn.
- Morgen toont geen gemeten vermogen. Loading, leeg, fout en mislukte verversing zijn zichtbaar. Publicatietekst klopt met tienminutenpolling in een zichtbaar tabblad.
- Batterijgrafieken hebben geen verplichte horizontale scroll; exacte waarden, datum- en capaciteitskeuze blijven bereikbaar. Controleer lange reeksen, lege dagen, schattingen en gaten.
- Geen wijzigingen in bron-API, opslag, financiële berekeningen of simulator; bestaande selectie-/annuleringsgedrag blijft behouden.

## Bewijs en releasegate

Correctie 22 september: gecombineerde grafiek hersteld. Tien gerichte tests en webtypecheck geslaagd; root heeft code en geleverde bundel gecontroleerd (HTTP 200, gecombineerde assen aanwezig). Geen visueel bewijs toegevoegd.

Automatische validatie en codereview volgen na implementatie. Het gedeelde screenshot beschrijft het voorstel en is geen bewijs van de aangepaste interface. Browser-PASS blijft open totdat Agent C het zichtbare gedrag kan verifiëren. Geen volledige APPROVED-status op basis van uitsluitend code/tests.
