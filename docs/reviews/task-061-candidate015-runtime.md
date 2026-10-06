# Task 061 — actuele geïsoleerde productiebridge 0.1.15

4 oktober 2026. Voorbereiding door root; geen deployment of volledige browsergoedkeuring.

Gebouwde bridge-JavaScript gekopieerd naar `.harness/candidate015/bridge`, webindex/assets naar bijbehorende `web`, publieke Belpex-dataset naar `data`. Geen `.env`, credentials of persoonlijke runtime gekopieerd. Centrale runtime is afzonderlijk synthetisch. Luistert uitsluitend op 127.0.0.1:18115, simulator zonder HA-/providerconfiguratie. Exact-peerhandhaving staat in deze geïsoleerde browseromgeving uit; dit is geen Ingress-authenticatiebewijs. Productiebron onveranderd.

JS-bestand `app-208dc33aa2a0a1b3.js` in huidige build en testkopie heeft identieke SHA256 `208dc33aa2a0a1b38fedf251e25e75ef66aaba0f6a8047bb4c71e900e2cc8d30`.

Root-HTTP-controles op `/api/hassio_ingress/qa-release015/`: index HTTP200 en no-store; geneste JS HTTP200 en public,max-age=31536000,immutable; geneste `api/results/energy-profile` HTTP200 en no-store. Geen Access-Control-Allow-Origin-header bij deze drie responses. Deze verzoeken bewijzen routing/headers, geen browsergedrag of ongeauthenticeerde peerweigering.

Zichtbare `qa-fixtures.html` bedient uitsluitend synthetische lokale testkeys en de afzonderlijke testbridge; niet op Pi uitvoeren. `qa-app.html?fault=save/remove/unavailable` voegt synthetische Storage-fouten toe vóór de ongewijzigde productieassets. Gewone CSV-tests gebruiken echte bestandsselectie; deze helper injecteert geen Files. Actuele Agent C-matrix volgt afzonderlijk.

Aanvullend: dezelfde huidige productiebridge met `CREMS_REQUIRE_INGRESS_PEER=true` op uitsluitend 127.0.0.1:18116 weigerde de lokale geneste rootaanvraag met HTTP403, `ingress_only` en no-store. Deze tijdelijke instance daarna gestopt. Dit bewijst de weigering van localhost; exacte toegestane peer blijft door bestaande tests gecontroleerd, geen echte Pi-authenticatieclaim.

Root-native browserpoging in eigen ingebouwde browser: single-file chooser bevestigd en jaarbestand geselecteerd. De setFiles-toolcall duurde circa 3582 seconden ondanks aangevraagde timeouts; volgende DOM-observatie bevestigde Data, volledige periode 2025, gemeten 7.008/7.008 kWh, geschat 0/0 en expliciete vervolgknoppen. Toolduur niet als verwerkingstijd of performancebewijs behandeld. Agent C kon deze root-browserbinding niet overnemen; dit is aanvullend rootbewijs, geen onafhankelijke Agent C-PASS.

Vanwege de browsertoolblokkade is qa-app.html vervolgens uitgebreid met de bestaande zichtbare synthetische CSV/slow/invalid/incomplete-knoppen uit de geïsoleerde 0.1.14-testhulp. Die leveren een File aan de bestaande productie-inputhandler; productieassets onveranderd. Bewijs moet helperinjectie en echte native bestandskeuze onderscheiden.

Afzonderlijke instance 127.0.0.1:18117 gebruikt huidige gekopieerde bridge-JS en webassets plus Node-http-observatiewrapper `.harness/candidate015-network-runtime.mjs`, met eigen lege synthetische runtime. Logt uitsluitend method/path/timestamp naar `.harness/logs/candidate015-network-runtime.jsonl`. Geen bodies, querystrings, credentials of echte provider. Negatieve-netwerkcases moeten op deze instance worden uitgevoerd zonder fixturecleanup/save/consent; log op zichzelf geeft nog geen PASS.

De oude statische netwerkserver 8791 is na de twee onderbroken bestandspogingen gestopt. Beide bevestigden alleen de pagina/chooser; setFiles bleef hangen ondanks timeouts, geen afgeronde CSV-case of netwerk-PASS afgeleid. De huidige productiebridge/helper-route vermijdt deze browsertoolactie; dit is geen wijziging van browserrechten of omzeiling van de eerder geblokkeerde extensie-instellingen.

Automatische goedkeuringscontrole weigerde de financiële bevestigingscheckbox op de synthetische kandidaat omdat de concrete economische aannames niet expliciet door de gebruiker waren goedgekeurd. Geen retry of financieel bewaren uitgevoerd. Root vroeg afzonderlijk toestemming voor het exacte formulier (Vast 2025-01-01–2026-01-02, afname37,3ct/injectie6ct, garantie10/levensduur15jaar, degradatie2,5%/disconto4%, investeringen3500/4500/5500/6500/8000euro inclbtw voor3/5/7/10/13kWh; offertebron Marktrichtwaarde België2026, datum2026-01-01). Financiële tests blijven BLOCKED zolang antwoord ontbreekt; technische en hersteltests lopen onafhankelijk door. Geen betaling, echte offerte of Pi-write.
