# CREMS Product Audit — 7 september 2026

## Actualisering — 10 september 2026

De audit hieronder is de historische herstelbaseline van 7 september. De persoonlijke contractpagina en Energiepaspoort v2 zijn inmiddels aanwezig in de lokale webapp; de oude vermelding dat de contractpagina onbereikbaar is beschrijft niet meer de huidige code. Er is nog geen volledige productreleasegoedkeuring.

Task 035 blijft actief. De eindcontrole vond aanvullende fouten in expliciete rapportopslag zonder prijzen, de scheiding tussen nieuwe CSV-data en een bestaand rapport, en het opnieuw openen van resultaten. De gerichte herstelhandoff staat in `TASKS.md`; het bewijs en de uiteindelijke beslissing komen in `REVIEW.md`. De open browserchecklist staat in `docs/task-035-release-check.md`. Contractuitbreiding en Raspberry Pi-deployment volgen pas na de herstelrelease.

## Oordeel

CREMS is een bruikbare technische basis, maar nog geen betrouwbare lokale MVP. De live Home Assistant-keten, daggrafiek, prijsweergave, streaming Fluvius-parser, Energiepaspoort-aggregaten en batterijmotor bestaan. De volledige gebruikersreis is echter niet als één product bewezen.

## Bedoeld product

Een zelfstandige, lokale energie-app voor Belgische huishoudens die optioneel read-only Home Assistant gebruikt, Fluvius-historiek lokaal verwerkt en vervolgens verbruik, contracten en batterijscenario's begrijpelijk samenbrengt.

## Bewezen beschikbaar

- live afname/injectie met zichtbare bronstatus;
- echte vermogens- en prijsdata voor Gisteren/Vandaag/Morgen wanneer Home Assistant die levert;
- lokale, geheugenbegrensde controle van een bewezen Fluvius-CSV;
- expliciete opslag van veilige Energiepaspoort-totalen;
- technische batterijsimulatie voor 3/5/7/10/13 kWh;
- pure berekeningen voor vlakke contracten en voorwaardelijke batterij-NPV.

## Niet als product bewezen

- één duurzame flow van CSV naar technisch én financieel batterijrapport en hetzelfde resultaat na refresh;
- migratie van oudere lokale batterijresultaten;
- persistente, herleidbare contract- en offertecontext;
- een bereikbare contractvergelijking op het persoonlijke profiel;
- browserbewijs voor navigatie, mobiel, foutstaten en lokale opslag;
- Raspberry Pi-installatie en externe toegang als ondersteunde deployment.

## Actuele blockers

1. Oudere of onvolledige batterijschema's worden geweigerd zonder zichtbare migratie- of herstelstate.
2. Financiële invoer en financiële uitkomsten bestaan alleen tijdelijk en verdwijnen bij refresh.
3. De contractpagina is onbereikbaar en niet gekoppeld aan de bestaande contractrekenmotor.
4. Batterijwerk mist abort/sequence-bescherming; een oude run kan nieuwere state of opslag overschrijven.
5. Batterijsimulatie start stilzwijgend opslag van het Energiepaspoort, ondanks de expliciete-toestemmingsbelofte.
6. Energiepaspoort en batterijrapport bewaren verschillende kwaliteitsmetadata.
7. De financiële copy en berekening verschillen over terminale batterijlading.
8. Tests bewijzen modules, maar niet de volledige gebruikersreis.
9. `README.md`, `TASKS.md` en historische reviews hebben de productrijpheid overschat.

## Beslissing

Geen nieuwe productfunctie vóór de herstelrelease. Eerst wordt exact één verticale flow bewezen:

`CSV controleren → technisch batterijresultaat → financiële context bevestigen → volledig rapport bewaren → refresh → hetzelfde rapport herstellen → expliciet verwijderen`.

Contractvergelijking volgt pas nadat deze flow is goedgekeurd. Historische taakgoedkeuring blijft geldig als modulebewijs, maar geldt niet automatisch als releasegoedkeuring.
