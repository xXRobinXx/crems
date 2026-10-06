# Lokaal CREMS-harness

## Actualisering — 1 oktober 2026 / Task 061

Historische productprioriteiten: Task 060 maakte Contract bereikbaar zonder Energiepaspoort; de disabled-contractbeschrijving hieronder is vervangen. De actuele actieve taak is Task 061. Het harnessmechanisme blijft geldig; releasegate vereist actuele volledige review/browserattestaties.


Dit ontwikkelgereedschap gebruikt TASKS.md als takenbron. Geen extra register, dependencies of browserbediening. Het verandert geen productgedrag. H001 is de gereedschapstaak; de productrelease van Task 035 blijft apart open.

## Gebruik

- `pnpm harness status`: actuele genummerde taken en historische statussen, zonder dubbels. Uitbreidingen staan bij de specificatie in TASKS.md.
- `pnpm test:harness`: synthetische tests voor parser, fingerprint, structuurgrenzen en releasepoort.
- `pnpm check:structure`: controleert de echte workspace-/HA-metadatagrenzen, package-exports en lokale routerlinks; leest geen persoonlijke runtimeopslag.
- `pnpm harness check`: voert harness-tests, structuurcontrole, root build, tests en typecheck sequentieel uit; stopt bij de eerste fout.
- `pnpm harness gate`: controleert automatisch bewijs plus aparte Agent A- en Agent C-verklaringen. Exitcode 1 betekent niet goedgekeurd.

Machinebewijs in `.harness/checks.json` bevat uitsluitend tijden, bronhash en exitcodes. De genegeerde `.harness/`-map kan daarnaast synthetische QA-fixtures en lokale controlelogs bevatten; dat zijn geen releaseattestaties. Een nieuwe run trekt eerder succes direct in. Code/configuratie en normatieve documentatie bepalen de SHA-256 fingerprint; bronwijzigingen tijdens of na de run maken het bewijs ongeldig. Deze hash omvat nu ook PowerShell-tools, Dockerfile, GitHub-workflows, HA-rootmetadata, rolbestanden, repo-skillinstructies en hun vaste map-/harness-/release-/opslag-/HA-ontwerpverwijzingen. De exacte vaste bestanden staan in `fingerprintRootFiles` in tools/harness.mjs. Gegenereerde bestanden en lokale data tellen niet mee; bewijsrapporten onder docs blijven via afzonderlijke reportSha256 gebonden. Dit werkt ook zonder Git.

## Review en browsergate

De releasepoort keurt nooit zelfstandig inhoudelijk goed. Agent A levert na echte review `.harness/review.json`; Agent C levert na geautoriseerde browser-QA `.harness/browser.json`. Beide bevatten `fingerprint` uit checks.json, `role` (`Agent A` of `Agent C`), `status` (`APPROVED` of `PASS`), `report` (pad naar een werkelijk rapport onder docs/) en `reportSha256` (SHA-256 van dat rapport). Bestaande rapporten zonder passend bewijs worden niet automatisch overgenomen. Het browserrapport beschrijft alle scenario's uit het playbook, inclusief 375/1280 px, verwachtingen, resultaten en privacycontrole. Alleen een echte reviewer mag de verklaring schrijven; het harness genereert geen PASS.

Dit is procesbewaking, geen beveiligingsgrens tegen iemand die lokale bestanden vervalst. De tool controleert aanwezigheid, integriteit en versiebinding; de reviewer blijft verantwoordelijk voor acceptance criteria en de volledigheid van scenario's. De write set en één-schrijverregel worden in deze eerste versie organisatorisch bewaakt, niet technisch vergrendeld. Er is nog geen live kanbanpagina.

## Voorgestelde websiteprioriteiten

Gebaseerd op code en de audit, zonder nieuwe browserinspectie. Dit zijn voorstellen, geen gewijzigde requirements:

1. Eerst de open Task 035-gebruikersreis bewijzen: CSV, bewaren, refresh, legacy, fouten, verwijderen, dagrapport en periodefilter.
2. Geblokkeerde navigatie begrijpelijk maken: Rapport/Batterij/Contract gebruiken nu disabled knoppen met title-uitleg; toon de ontbrekende stap ook zichtbaar en bereikbaar op mobiel/toetsenbord.
3. Tijdelijk resultaat, bewaard rapport en nieuw bestand consequent onderscheiden, met een duidelijke bewaarstatus en vervolgstap.
4. Batterijpagina rustiger opbouwen: hoofdresultaat en geselecteerde periode eerst; aannames, financiële invoer en controletabellen geleidelijk toegankelijk maken. Behoud alle kwaliteitswaarschuwingen.
5. Na de herstelrelease: expliciet bewaren/herstellen van contractvergelijkingen als afzonderlijke taak, met veilige opslag en eigen gebruikersreisbewijs.

De historische blockers uit PRODUCT_AUDIT.md zijn niet automatisch actuele fouten: recente reviews melden al herstel. Geen nieuwe productfeature wordt door deze lijst gestart.
