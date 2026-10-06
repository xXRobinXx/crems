# Task 061 — lokale aanbiedingenknop

6 oktober 2026, rootverificatie. De gewone “Haal aanbiedingen op”-knop staat in LocalContractCatalog en herlaadt uitsluitend `api/contracts/local` via GET. De bestaande berekening gebruikt het huidige jaarverbruik lokaal. Klik reset leverancier-/prijssoortfilters en paginalimiet en toont loading. Postcode en eindige niet-negatieve volumes (maximaal 100000 per veld, positieve afname) zijn vereist. Historische kaarten, ontbrekende btw/prijzen en intervalcontracten behouden hun bestaande berekeningsgrenzen.

De optionele partnerknop in App.tsx heet nu “Vraag externe partnervergelijking aan”; haar expliciete toestemming en configuratievereisten blijven behouden. Geen ontbrekende credentials aangevuld of externe resultaten nagebootst.

Bewijs: componenttest gebruikt de echte lokale component en fetchstub met strikte relatieve GET/bodylooscontrole. Klik veroorzaakt een tweede lokale GET, loading en vervolgens het berekende synthetische bedrag 549,95 EUR; nul afname blokkeert de knop. Alle 156 webtests PASS; volledige productiebuild PASS voor core/web/bridge. Browser NOT RUN en onafhankelijke review NOT RUN; geen volledige DoD, release of Pi-uitrol. Eerdere volledige regressiesuite is gedateerd bewijs van vóór deze knopwijziging.
