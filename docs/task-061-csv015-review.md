# Task 061 — contract-CSV-fix 0.1.15

Datum: 2 oktober 2026. Root is de enige productiecode-/testschrijver.

De knop op Contract navigeerde alleen naar Data en opende geen bestandskiezer. De knop activeert nu synchronisch een eigen native CSV-input vanuit de gebruikersklik. Na selectie gebruikt de bestaande lokale streaminganalyse hetzelfde bestand op Data. Een lege selectie is een no-op; de inputwaarde wordt na selectie gewist zodat hetzelfde bestand opnieuw gekozen kan worden. Bestaande veilige profielen/rapporten en contractformuliervelden worden niet automatisch verwijderd, bewaard of verstuurd.

Write set: App.tsx, battery-flow-structure.test.ts; beide HA-manifests en bijbehorende bridgeversieassertion op 0.1.15; TASKS.md bevat vooraf de acceptance en write set. Geen dependency-, schema-, endpoint- of providerwijziging.

Fullharness PASS op bronfingerprint `f497bb8a3008442f48f561fceef13b444e05e1243f9aabfabdbcea0a63424c7c`: build, typecheck en 335 tests (65 core, 110 bridge, 149 web, 5 harness, 6 Supervisor-helper). Nieuwe componentregressie activeert de echte contracthandler, verifieert directe click, canceled-selectie/paginabehoud, inputreset en echte synthetische CSV-preview. Agent A las de beperkte productie-/testdiff en herhaalde onafhankelijk 28 componenttests: PASS, beperkte codereview APPROVED. Aanvullende onafhankelijke versiereview en actuele browserregressie worden afzonderlijk vastgelegd vóór publicatie.

De eerste sandbox-webtestrun faalde doordat esbuild projectbestanden niet kon lezen; de geautoriseerde normale run en volledige harness slagen. Geen geslaagde sandboxrun geclaimd.

0.1.14 is de geïnstalleerde baseline tot de nieuwe publicatie- en installatiecontrole. Historische volledige browsermatrix in task-061-browser014-candidate.md is gedateerde baseline; nieuw bewijs moet zijn actuele, beperkte dekking benoemen. Fysieke CREMS-WiFi-, reboot- en rollbackgates blijven onafhankelijk open.
