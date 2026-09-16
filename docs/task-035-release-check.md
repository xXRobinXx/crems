# Task 035 — eindcontrole

## Status op 10 september 2026

De gerichte herstelronde heeft build, 213 tests en typecheck doorstaan. De aanvullende kWh-verduidelijking wordt afzonderlijk gecontroleerd. Dit document is een checklist en bewijsregister, geen browser-PASS of releasegoedkeuring.

Agent B is de enige schrijver van productiecode en tests. Agent A beoordeelt de herstelpunten en registreert de eindvalidatie. De onderstaande volledige browsergate is niet uitgevoerd; de huidige kWh-opdracht bevat geen nieuwe expliciete opdracht om de browser te bedienen.

## Browserchecklist

Lokale URL: `http://127.0.0.1:5173/`. Controleer desktop op 1280 px en mobiel op 375 px. Gebruik uitsluitend synthetische CSV-data en een afzonderlijk testprofiel; wis geen bestaande gebruikersgegevens.

| Scenario | Stappen en verwacht resultaat | Browserbewijs |
|---|---|---|
| Schoon profiel | Open Data, kies geldige CSV, controleer de preview en start batterijvergelijking. Techniek verschijnt; selectie en simulatie bewaren niets. | NOT RUN |
| Ontbrekende prijzen | Laat prijsgegevens ontbreken. Technisch resultaat blijft beschikbaar en expliciet bewaren lukt. | NOT RUN |
| Volledig financieel rapport | Gebruik een volledig gemeten chronologisch jaar. Vul contractdekking, offerte, tarieven, levensduur, degradatie, disconto en alle investeringen in. Bevestig en bewaar. | NOT RUN |
| Refresh | Vernieuw de pagina en open Batterij. Periode, kwaliteit, techniek, herkomst, aannames en financiële uitkomsten blijven gelijk zonder CSV of nieuwe batterijberekening. | NOT RUN |
| Heropenen | Bewaar een rapport, navigeer naar Overzicht en terug naar Batterij. Geen nieuwe run of gewijzigde uitkomsten. | NOT RUN |
| Nieuwe CSV | Begin met een bewaard financieel rapport en kies bewust een andere CSV. Nieuw resultaat heeft uitsluitend zijn eigen periode en kwaliteit; oude financiële bevestiging wordt niet overgenomen. Bewaren vervangt alleen na expliciete actie. | NOT RUN |
| Technisch aanvullen | Bewaar eerst een technisch rapport. Bevestig daarna geldige financiële invoer en bewaar het volledige rapport; refresh behoudt deze aanvulling. | NOT RUN |
| Bevestiging intrekken | Wijzig ieder contract-, offerte-, datum-, tarief-, investerings- en aannameveld afzonderlijk. Financieel resultaat vereist telkens nieuwe bevestiging. | NOT RUN |
| Onvolledige data | Gebruik gaten of geschatte data. Technische schatting en beperkingen zijn zichtbaar; financiële aanbeveling blijft geblokkeerd. | NOT RUN |
| Annuleren en nieuwe selectie | Annuleer tijdens lezen, navigeer weg en selecteer een nieuw bestand. Oude resultaten verschijnen niet alsnog; een nieuwe geldige run werkt. | NOT RUN |
| Legacy v1/v2 | Open veilige oudere opslag. Toon oudere techniek en onzekerheid. Laden verandert niets; uitsluitend expliciet migreren schrijft v3. | NOT RUN |
| Corrupte/opslagfout | Onleesbare opslag toont hersteltekst en blijft bewaard. Een mislukte bewaar- of verwijderactie meldt de fout en behoudt het resultaat. | NOT RUN |
| Verwijderen | Verwijder het betreffende rapport expliciet en vernieuw de pagina. Dat rapport keert niet terug; eventuele aparte oudere opslag blijft herkenbaar. | NOT RUN |
| Toegankelijkheid en privacy | Bedien upload, navigatie, formulieren en acties met toetsenbord; controleer focus en leesbaarheid op beide breedtes. Geen CSV-inhoud, bestandsnaam, EAN of meter-ID in rapport, opslag, fouten of screenshots. | NOT RUN |

Een later Agent C-rapport moet per scenario URL, viewport, concrete stappen en werkelijk resultaat vastleggen, met maximaal drie privacyveilige screenshots. Automatische tests vervangen deze gate niet.
