# Task 061 — Deployment 0.1.14

Datum: 2 oktober 2026. **Publicatie en CREMS-appupdate geslaagd; volledige Pi-browser-/LAN-releasegate blijft open.** Dit actuele deploymentbewijs vervangt de gedateerde 0.1.13-baseline voor de geïnstalleerde versie. Kandidaatreview en normatieve fingerprintdocumenten blijven ongewijzigd.

## Publicatie en installatie

Root rapporteert releaseprocedure exitcode0 op commit `bed2a18`, gepusht naar main; onveranderlijke tag `v0.1.14`. ARM64-publicatie via [GitHub Actions 36978926431](https://github.com/xXRobinXx/crems/actions/runs/36978926431). OCI-indexdigest `sha256:7399623f3d7db5a07d001521f01b3b1a7111f3033fb0f59d8049a4d4e5ba4cd2`; releaseprocedure controleerde aanwezigheid van linux/arm64. Dit is de indexdigest, geen afzonderlijk ARM64-childdigest.

Home Assistant-update van uitsluitend CREMS gebruikte `backup: true` en eindigde met Supervisor-versie **0.1.14**, toestand **started**. Een actuele gedeeltelijke appbackup bevat CREMS en timestamp `2026-10-02T07:33:48.711216+00:00`, binnen het geverifieerde15-minutenvenster. Geen persoonlijke backupnamen/IDs of geheimen afgedrukt. Home Assistant-host is niet herstart; rollback is niet uitgevoerd. Er zijn geen echte profielen verwijderd of contractproviderrequests verstuurd voor QA.

## Actuele postdeployment HTTP-controle

Root controleerde geauthenticeerde tijdelijke Ingress zonder sessie-URL in documentatie op te slaan:

| Onderdeel | Werkelijk resultaat |
|---|---|
| HTML | HTTP200, no-store |
| JS/CSS | HTTP200, correcte contenttypes, immutable; `app-8541f0882cb9cdac.js` en `app-cbc1e7a75e6549bb.css` komen overeen met de goedgekeurde kandidaat |
| api/health, api/current | JSON HTTP200; bron Home Assistant, kwaliteit measured |
| api/history/price?day=today | JSON HTTP200, measured,96 punten |
| api/history/price?day=tomorrow | JSON HTTP200, notPublished,0 punten; geen fictieve nulprijs |
| SSE | HTTP200, text/event-stream, no-store, eerste event ontvangen |
| Zonder authenticatie | HTTP401 |

Prijsbewijs gebruikt uitsluitend de gevalideerde JSON-route `api/history/price`. Een eerdere probe naar `api/price-history` kwam op HTMLfallback uit en is geen prijsbewijs. HTTP-controles bewijzen actueel transport/runtime, geen volledige visuele Pi-browserreis of prestaties.

## Open externe gates

De werkelijke Pi-browserattempt werd vóór laden geblokkeerd met `ERR_BLOCKED_BY_CLIENT`; actuele Pi-browser-PASS ontbreekt. De lokale kandidaat heeft wel volledige Agent C-PASS met334 automatische tests, maar dat vervangt geen Pi-/hardwarebewijs.

Pi-interface end0 blijft `192.168.88.253/24`, gateway `192.168.88.1`. De pc zit op BASE-EED9434 in `192.168.0.0/24`; CREMS-wifi was niet zichtbaar en er was geen opgeslagen CREMS-profiel. Directe LAN-probes liepen in timeout, Tailscale werkte. Het ontbreken van zichtbare wifi/routering is niet door een netwerkreset of onbewezen routewijziging verhuld. Gebruik [CREMS via Tailscale](http://homeassistant.tail582404.ts.net:8123/hassio/ingress/350f0e24_crems_energy). Vanaf een apparaat met toegang tot het Pi-subnet is de bedoelde [LAN-link](http://192.168.88.253:8123/hassio/ingress/350f0e24_crems_energy); daadwerkelijke fysieke LAN-toegang blijft te bewijzen.

Volledige actuele Pi-browsermatrix, herstart/reboot met aantoonbaar resultaatbehoud en rollbackproef blijven open. Geen algemene "perfect"-/volledige release-PASS geclaimd. Alleen eigen QA-serverprocessen met gecontroleerde PID zijn gestopt en Agent C's eigen testtabs gesloten; geen gebruikersomgeving gewijzigd.

Dit rapport legt door root aangeleverde uitrol-/HTTP-/backupwaarnemingen vast; Agent A voerde die externe aanvragen niet opnieuw uit. Root commit/pusht dit afzonderlijke rapport zonder de goedgekeurde kandidaatbronfingerprint te veranderen.