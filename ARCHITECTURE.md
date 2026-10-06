# CREMS Architecture

## ADR — Batterijadvies vereist bewezen historie en bevestigde aannames

**Decision:** ADR-010 is de normatieve batterijbeslissing. De vergelijking gebruikt een 0 kWh-referentie en vaste technische kandidaten. Een technisch scenario mag onvolledige data conservatief verwerken; financieel resultaat vereist betrouwbare chronologische data zonder schattingen of gaps over minstens twaalf maanden. Een volledig bevestigd financieel rapport krijgt een versieerbaar lokaal contract en mag na refresh niet stilzwijgend verdwijnen.

**Consequence:** low/base/high tonen gevoeligheid rond de berekende energiecomponent en zijn geen volledige factuur of capaciteitstariefberekening. Nieuwe opslagversies vereisen een expliciete migratie of zichtbare legacy-state; veilig lokaal materiaal wordt niet stilzwijgend onzichtbaar gemaakt.

## Components

| Component | Responsibility |
|---|---|
| `apps/web` | Fullscreen React-interface en lokale interactie |
| `apps/bridge` | Read-only data-adapters, normalisatie en HTTP/SSE API |
| `packages/core` | Gedeelde domeintypes en pure energie-/kostenberekeningen |
| `integrations/home-assistant` | Dashboardreferenties; geen runtime-dependency |

## Data Flow

```text
Digitale meter → Home Assistant → REST API → CREMS bridge → HTTP/SSE → CREMS web
Fluvius CSV ───────────────────────────────→ parser/core ──────────────→ analyse
Tijdelijke, bevestigde contract/offertecontext → cost engine → voorwaardelijk financieel scenario
Home Assistant history → raw transport → pure W/tijd-normalisatie → begrensde bridge-API → React SVG
```

## Decisions

### ADR-012 — Credentialvrije lokale contractcatalogus

**Aanvulling (geautoriseerde uitbreiding 4 oktober):** alle 18 leveranciers van de upstreamregistry worden opgenomen. Een onderhoudsimport uit een vastgelegde openbare be_price_cards-revisie normaliseert particuliere feiten naar gebundelde TypeScript-data, zonder upstreamruntime of persoonlijke gegevens. Community-extractiestatus is zichtbaar; ontbrekende actuele kaarten blijven historisch. Variabele gepubliceerde prijzen leveren uitsluitend expliciet gelabelde constante-prijsscenario's. Dynamische, tijdvak- en index-only contracten worden getoond maar niet tot een jaarprijs gereduceerd. Professionele kaarten en onduidelijke eenheden/btwbasis worden geweigerd. Importeur en productiecatalogus worden onafhankelijk getest.

**Decision (expliciete gebruikersopdracht 4 oktober 2026):** een read-only bridge-GET levert versieerbare publieke tariefkaartsnapshots; pure vergelijking in core draait in de browser zonder verbruiksgegevens te versturen. De eerste gecontroleerde snapshot is EnergyVision 3 jaar vast, Vlaanderen, oktober 2026. Bron-PDF, digest, aanbodmaand, btwbasis en controledatum blijven onderdeel van de snapshot. Aanbodactualiteit is de maand van de kaart en niet de looptijd van een al getekend contract.

**Consequence:** buiten de aanbodmaand wordt geen actuele nieuwe jaarberekening aangeboden. Vaste afname en vaste vergoeding zijn afzonderlijk controleerbaar; variabele injectie wordt niet als vaste jaarvergoeding berekend. De berekening is een energiecomponentscenario, geen volledige factuur of marktbrede ranglijst. De bestaande partneradapter en toestemming blijven optioneel behouden. Publieke snapshot laden verstuurt geen postcode, jaarvolumes of persoonlijke identifiers en doet geen upstreamfetch. Automatische PDF-updates, aanvullende leveranciers en volledige regionale kosten zijn vervolgwerk, geen verborgen aannames in deze eerste versie.

### ADR-001 — Zelfstandige app

**Decision:** de webapp heeft geen Home Assistant-frontenddependency.  
**Reason:** onafhankelijk product, eigen UX en later andere databronnen.  
**Consequence:** een lokale bridge is nodig.

### ADR-002 — Home Assistant als eerste P1-adapter

**Decision:** CREMS gebruikt uitsluitend lezende REST-aanroepen naar Home Assistant.  
**Reason:** Home Assistant bezit de seriële poort al.  
**Consequence:** CREMS heeft een lokaal Long-Lived Access Token nodig; dit token heeft zelf geen read-only scope en moet als hooggevoelig geheim worden behandeld. Uitval wordt als `incomplete` gemeld.

### ADR-003 — Local-first

**Decision:** bridge bindt op `127.0.0.1`; secrets staan uitsluitend in genegeerde `.env`.  
**Consequence:** externe toegang en deployment vereisen later een expliciet securityontwerp.

### ADR-004 — Adaptergrens en testbaarheid

**Decision:** bronselectie, Home Assistant-detectie/normalisatie en HTTP-transport worden afzonderlijk testbaar gehouden; pure domeinberekeningen blijven in `packages/core`.
**Reason:** tests mogen geen live Home Assistant, token, klok of netwerk nodig hebben.
**Consequence:** wanneer adaptertests volgen, mag Agent B eerst een kleine dependency-injection- of exportnaad toevoegen, maar geen nieuw framework of productiegedrag zonder afzonderlijke taak.

### ADR-005 — Teststrategie

**Decision:** begin met Node's ingebouwde test runner en voeg geen testframework toe zolang die de vereiste gedragsbewijzen kan leveren.
**Reason:** de huidige workspaces hebben al `node --test`; extra dependencies leveren voor de eerste pure tests geen aantoonbare waarde.
**Consequence:** tests worden uitgevoerd tegen gebouwde JavaScript-output of via een minimaal, expliciet testscript; `pnpm test` moet falen wanneer een assertion faalt.

### ADR-006 — History als afzonderlijke bewezen keten

**Decision:** ruwe Home Assistant-history wordt eerst in de bridge door een pure normalisatielaag omgezet naar chronologische, getimede wattpunten. Een afzonderlijk begrensd read-only endpoint levert pas daarna veilige import-/exportreeksen aan de webapp.
**Reason:** Home Assistant-records kunnen ongeldige states, ontbrekende timestamps, dubbels en waarden buiten het gevraagde venster bevatten; de React-laag mag die bronsemantiek niet zelf raden.
**Consequence:** de frontend ontvangt geen token, entity-ID of ruwe Home Assistant-objecten. De SVG schaalt uitsluitend echte punten en toont loading/leeg/fout expliciet. Een prijsserie of adviesclaim verschijnt pas wanneer daarvoor afzonderlijk echte history en voldoende invoer bewezen zijn.

### ADR-007 — Echte prijsreeksen per Brusselse kalenderdag

**Decision:** gisteren en vandaag gebruiken history van de geconfigureerde huidige-prijssensor (bewezen dashboardbron: `sensor.energyzero_today_energy_current_hour_price`). Morgen gebruikt pas in een afzonderlijke stap de echte `raw_tomorrow`-attributen van de bewezen `sensor.nordpool`; ontbrekende attributen leveren leeg op, nooit een extrapolatie.
**Reason:** de huidige prijsstate is EUR/kWh en de dashboardconfig bewijst de conversie naar ct/kWh; Home Assistant-timestamps dragen DST correct als absolute instants.
**Consequence:** de bridge bewijst de broneenheid via de actuele HA-state, accepteert alleen EUR/kWh-varianten en normaliseert naar veilige `{ timestamp, priceCtKwh }`-punten. Entity-ID, unit, attributen en token worden niet publiek. Historie en morgen-attributen blijven afzonderlijke bronpaden met dezelfde puntvorm; nul en negatieve prijzen blijven geldig.

**Aanvulling 24 september 2026 op expliciete gebruikersopdracht:** de drie daggrafieken tonen alle beschikbare gepubliceerde uren van dezelfde geconfigureerde dagprijssensor. Gisteren gebruikt history van die sensor, vandaag diens `raw_today` (of history van dezelfde sensor wanneer het attribuut ontbreekt), en morgen uitsluitend diens `raw_tomorrow`. Zonder ingestelde dagprijssensor behouden gisteren en vandaag de bestaande huidige-prijssensor als compatibiliteitsfallback. Gepubliceerde toekomstige uren van vandaag worden niet bij server-now afgeknipt; history zonder toekomstige publicatie blijft tot nu begrensd. De kaarten voor nu en volgend uur leiden hun waarden af uit dezelfde dagreeks. Ontbrekende bronuren blijven leeg.

**Vervangende beslissing 24 september 2026 op expliciete gebruikersopdracht:** spotprijzen worden voortaan rechtstreeks server-side opgehaald via de openbare Energy-Charts v2-API voor biedzone BE. Eén begrensde driedaagse opvraag levert de gepubliceerde day-ahead kwartieren voor gisteren, vandaag en morgen. De bridge valideert zone, tijdzone, eenheid, licentie en intervaldekking, rekent EUR/MWh om naar ct/kWh en cachet de respons tien minuten. De webapp gebruikt deze reeks onafhankelijk van Home Assistant, ook voor de kaarten nu/volgend uur; vermogen blijft Home Assistant-data. Niet-gepubliceerde morgenprijzen en ontbrekende kwartieren worden niet ingevuld. De eerdere Home Assistant-prijsbron hierboven blijft alleen historische context, geen actieve route.

### ADR-008 — Begrensde één-pass Fluvius-preview

**Decision:** grote Fluvius-exports worden voor de preview rechtstreeks als records geanalyseerd met één CSV-state-machine en constante aggregatietoestand per van de vier registerstromen. Er ontstaat geen `ParsedCsv.rows`- of `FluviusInterval[]`-kopie.
**Reason:** het echte bestand van circa 14,1 MB/100.216 rijen veroorzaakt met de huidige dubbele objectrepresentatie een browserpiek rond 234 MB.
**Consequence:** de analyzer bewaart alleen schema, huidige recordvelden, totalen/tellingen, eerste/laatste veilige interval en beperkte vorige-record/DST-toestand per stroom. Onbegrensde foutlijsten, ruwe rijen en identifiers zijn verboden; previewoutput en privacysemantiek blijven gelijk.

### ADR-009 — Expliciet lokaal Energiepaspoort

**Decision:** na een geslaagde CSV-controle kan de gebruiker expliciet alleen veilige aggregaten lokaal bewaren: periode, totalen per meetkwaliteit/richting en veilige aantallen. De browser bewaart nooit CSV-inhoud, EAN, meter-ID, bestandsnaam of kwartierregels.
**Reason:** contractfunctionaliteit heeft een duurzaam profiel nodig, zonder de privacygrens van de streaming-preview te verbreken.
**Consequence:** geen opslag gebeurt bij selectie of controle; de gebruiker kan het profiel zichtbaar verwijderen. Een berekening of contractvergelijking blijft afzonderlijke functionaliteit met eigen invoer- en validatiebewijs.

### ADR-010 — Batterijvergelijking met gescheiden fysieke en financiële gate

**Decision:** de batterijmotor blijft standaard strikt voor aaneengesloten kwartieren. De technische UI mag onvolledige data als zichtbaar scenario verwerken door bij ieder vooruitgaand datagat de batterij conservatief leeg te maken; die reset wordt als dataverlies zichtbaar gemaakt. Financiële scenario's vereisen een volledig betrouwbaar jaar, expliciet bevestigde offerte- en contractgegevens en een tariefperiode die de meetperiode volledig dekt. Dynamische contracten worden niet met één vlak tarief berekend.
**Reason:** een technisch verschoven kWh-volume is geen persoonlijke ROI; ontbrekende kwartieren, generieke prijzen of tarieven uit een andere periode zouden een schijnnauwkeurige aanbeveling opleveren.
**Consequence:** technische resultaten worden als geversioneerde, allowlisted samenvatting bewaard. Zodra de gebruiker expliciet een financieel rapport bewaart, moeten de benodigde herleidbare aannames en berekende uitkomsten lokaal, veilig en migreerbaar worden vastgelegd. Low/base/high zijn energiecomponentscenario's zonder capaciteitstarief of volledige factuur en verschijnen alleen na alle gates.

### ADR-011 — Expliciet bewaard batterijrapport v3

**Decision:** Task 035 introduceert één `v3`-rapport. Een technische snapshot kan expliciet worden bewaard. Na geldige financiële bevestiging mag dezelfde expliciete bewaaractie ook een strikt allowlisted financiële snapshot bevatten: contractnaam/type en geldigheidsdata, offertebron/-datum, garantie, btw-bevestiging, afname-/injectietarief, levensduur, degradatie, discontovoet, investering per kandidaat en de berekende scenario-uitkomsten. Dit is een bewuste uitzondering op de eerdere tijdelijke-invoerregel.

**Privacygrens:** CSV-inhoud, kwartierregels, EAN, meter-ID, token, bestandsnaam en willekeurige extra velden zijn verboden. Laden, migreren en verwijderen veroorzaken nooit automatisch een write of delete.

**Legacy:** veilige v1/v2-data onder een herkende CREMS-sleutel verschijnt als technisch legacy-resultaat. De gebruiker kan dit expliciet als nieuw technisch v3-rapport bewaren of verwijderen. Onbekende/corrupte lokale data toont een veilige herstelstate zonder ruwe inhoud en blijft staan tot expliciete verwijdering.

**Financiële semantiek:** terminale batterijlading krijgt geen vermeden-afnamewaarde, maar de energie die daarvoor uit injectie werd geladen blijft gemiste injectievergoeding. De opgeslagen snapshot en herladen weergave gebruiken exact dezelfde berekende waarden zonder herberekening of prijsfetch.

### Dagrapport — aanvulling op ADR-011, 11 september 2026

Op expliciete gebruikersopdracht wordt het bestaande rapport aangevuld met optionele, strikt gevalideerde dagaggregaten (maximaal 4.000 Brusselse kalenderdagen). Bestaande v3-rapporten zonder dagdata blijven geldig. De berekening observeert dezelfde simulator die de totaalcijfers levert; lading loopt door over middernacht en verlies door datagaten wordt apart van conversieverlies verantwoord. Detail binnen één geselecteerde dag wordt uitsluitend tijdelijk uit het bronbestand opgebouwd, met maximaal 100 kwartieren per capaciteit, zonder identifiers. Een opgeslagen rapport behoudt daggrafieken na refresh; voor kwartierdetail is het tijdelijke bestand opnieuw nodig. Expliciet bewaren is de enige opslagactie. Geen cloudopslag of wijziging van financiële semantiek.

## Known Risks / Technical Debt

- Home Assistant wordt momenteel elke seconde via `/api/states` gepolld; een websocket/subscription-adapter is efficiënter.
- Sensorselectie, eenheden, API-fouten en kostenberekeningen hebben regressietests. Automatische tests bewijzen geen volledige actuele Pi-gebruikersreis.
- De overzichtsgrafiek gebruikt de echte historyketen uit Tasks 019–027; oude no-price-criteria uit Task 021 zijn door de echte gele prijsreeks van Task 027 vervangen.
- De workspace is een Git-repository; releasecontrole gebruikt diffs, onveranderlijke tags en ARM64-images. Runtime-, reboot- en rollbackbewijs blijft afzonderlijk vereist.
- Home Assistant-deployment gebruikt geauthenticeerde Ingress, relatieve frontendroutes en server-side uitsluitend peer `172.30.32.2`. LAN-toegang loopt via Home Assistant op poort 8123; de bridgepoort 8099 wordt niet rechtstreeks gepubliceerd. Zie het goedgekeurde deploymentontwerp in `docs/task-037-haos-app.md`.

Zie ook `docs/architecture.md` voor de oorspronkelijke verticale-slice-notities.
