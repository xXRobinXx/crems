# Task 061 — verbruiksafhankelijk tabletwekken — 5 november 2026

Gebruikersopdracht: kiosk-scherm aan bij grote verbruiksverandering, daarna tien minuten aan. Gebruiker bevestigt stijging of daling van minstens 500 W en wil geen Fully Plus betalen. Geen betaalde installatie of licentie toegestaan.

Root is enige schrijver. Voorbereidende write set: TASKS.md en dit rapport; bestaande productiecodefreeze behouden. Nog geen productie- of HA-configuratiewijziging.

## Actuele apparaatcontrole

ADB op gekoppelde Lenovo TB305FU: packagefilters fully, homeassistant en tasker leveren geen pakket op. Android stay_on_while_plugged_in=15 (continu wakker tijdens laden); screen_off_timeout=600000 ms. Uitsluitend uitlezen, geen instelling gewijzigd. Dit bewijst geen werkende gebeurtenisgestuurde kiosk.

## Voorgestelde gratis route

Home Assistant Companion Android ondersteunt command_screen_on en command_screen_off_timeout. Officiële bron: https://companion.home-assistant.io/docs/notifications/notification-commands/ . Geen browser-Wake-Lock als schermwekker gebruiken; die werkt alleen voor zichtbare documenten. Bron: https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API . Fully Plus-route vervalt wegens kostenvoorkeur.

Voor implementatie nog vaststellen: echte HA-vermogenssensor met watt/kilowatt-eenheid, Companion-doelapparaat en toestemmingen, betrouwbare lokale aflevering tijdens slaap, interactie met huidige permanente wake-lock en laadinstelling. Geen fictieve entity IDs invullen. Geen persoonlijke data/logins exporteren.

Beoogd gedrag: alleen verse geldige gemeten verbruikswaarden; eerste meting/terugkeer na onbekende of onbeschikbare waarde initialiseert vergelijking en wekt niet. Absolute verandering >=500 W wekt; nieuwe kwalificerende verandering herstart tien minuten. Negatieve/gesimuleerde/ongeldige data niet als echt verbruik gebruiken. Na tien minuten moet continu-wakker niet alsnog actief blijven. Detectiereferentie en eventfrequentie vóór implementatie expliciteren.

Open: toestemming voor gratis Companion-installatie en bediening gevraagd; aanmelden kan gebruiker vereisen. Daarna apparaat-/HA-configuratie voorbereiden, relevante tests en echte scherm-uit/wek/hertrigger/tienminutenproef. Huidige status NOT IMPLEMENTED / browser NOT RUN; geen releasegoedkeuring.

## Uitvoering na expliciete toestemming — 5 november

Gebruiker autoriseert gratis Companion-installatie, tabletbediening en inrichting/test. Root behoudt codefreeze; apparaat-/HA-scope uitsluitend Companion-registratie en bijbehorende kiosk-wekregel. Geen CREMS-release of Pi-update. Huidige write set: TASKS.md, dit rapport en genegeerde .harness-voorbereiding; nog geen HA-automatisering gepubliceerd.

- Officiële stabiele Home Assistant Android 2026.11.1 full APK via github.com/home-assistant/android/releases. SHA256 9c11abaf9e1b832894c49d806f66769ed76f99bac26cd1da029e2a9df227e41f komt overeen met GitHub-assetdigest.
- apksigner-verificatie exit0. Certificaat SHA256 11194ba809b42ddf0e1a7dec6842a59c7ff1119c5482e95febffd5c6014daa5a komt overeen met officiële Companion Android Flavors-documentatie. Metadatawaarschuwingen van apksigner niet als verificatiefout voorgesteld.
- ADB-installatie Success. App geopend; automatisch gevonden lokale server 192.168.88.253:8123 geselecteerd. Werkelijk zichtbaar: Nederlandstalige Home Assistant-aanmeldpagina. Gebruiker gevraagd zelf aan te melden; geen wachtwoord gevraagd of ingevuld.
- Echte geconfigureerde afnamesensor sensor.electricity_meter_energieverbruik heeft eenheid kW. Geen tablet-notifyservice aanwezig vóór aanmelding. Geen bestaande meldservice van ander apparaat gebruikt.
- Kandidaat vergelijkt opeenvolgende geldige afnamemetingen (geen cumulatieve verandering). Grens absolute verandering500W inclusief daling; W/kW afzonderlijk genormaliseerd. Eerste, ongeldige, negatieve, niet-finite, toekomstige en oude doelmeting worden uitgesloten.
- Veertien synthetische templateproeven op de echte HA /api/template-engine:14/14 PASS. Exacte499/500W-grens, stijging/daling, nul, eenheidswissel, unknown/unavailable/herstel, eerste meting, negatief, verkeerde eenheid, oude/toekomstige data, infinity en gelijkblijvend vermogen. Bewijs lokaal .harness/task061-kiosk-template-results.json. Geen echte sensordata gewijzigd.
- Voorbereide acties: command_screen_off_timeout600000ms gevolgd door command_screen_on met keep_screen_off om continue app-wakkerstand uit te laten. Iedere kwalificerende gebeurtenis verstuurt opnieuw; werkelijke Android-hertrigger en timeout nog te bewijzen. Broninspectie van exact2026.11.1 MessagingManager bevestigt wake-up-lock met ON_AFTER_RELEASE en afhandeling systeemtimeout; broninspectie is geen apparaat-PASS.

**Volgende stap:** gebruiker meldt zich op de tablet aan. Daarna Companionregistratie/notificaties afronden, lokaal afleveren bij slapend scherm instellen, bestaande continu-wakker tijdens laden uitschakelen binnen deze kiosk-opdracht, CREMS-weergave kiezen, regel valideren/publiceren en echte wek-/hertrigger-/tienminutenproef uitvoeren. Systeeminstellingen nu nog ongewijzigd. Automatisering NOT INSTALLED; actuele browser-/wek-/tienminuten-PASS en review APPROVED ontbreken. Eerdere CREMS-release-/operationele gates blijven open.

## Inrichting na gebruikersaanmelding — 5 november

Gebruiker bevestigt aangemeld te zijn. Officiële Companion-app geregistreerd als TB305FU, eigen notify.mobile_app_tb305fu beschikbaar. Geen meldingen verstuurd naar andere apparaten/personen.

Wijzigingen uitsluitend voor deze tablet en de nieuwe HA-regel:

- Noodzakelijke Android-notificatiestoestemming verleend; systeeminstellingen aanpassen toegestaan voor schermtimeout; batterijoptimalisatie-uitzondering voor Companion.
- Voortdurend wakker tijdens laden gewijzigd van15 naar0; screen_off_timeout blijft600000ms. Hierdoor kan de tablet tijdens laden na de gewenste tien minuten slapen.
- Companion-serverinstelling Aanhoudende verbinding daadwerkelijk via UI van Nooit naar Altijd gezet. Daarop Android SystemForegroundService actief gezien. Eerdere remote persistent-opdracht alleen HTTP geaccepteerd, niet ten onrechte als werkende instelling beschouwd.
- Automatisering crems_tablet_consumption_wake nieuw opgeslagen en teruggelezen; entity automation.crems_tablet_500_w_verandering_10_minuten_scherm staat on. Doel is uitsluitend de eigen tabletspecifieke meldservice. Bestaande automatiseringen niet vervangen.
- Trigger: echte afnamesensor sensor.electricity_meter_energieverbruik. Vergelijking met vorige geldige meting; absolute verandering >=500W. Acties: Android-timeout600000ms, daarna command_screen_on met keep_screen_off. Alleen deze nieuwe regel heeft mode restart. Geen lange HA-delay die bij herstart verloren gaat; timeout wordt door Android afgehandeld.
- Werkelijke automatische trigger op2026-11-05T18:22:23.202625Z teruggelezen. Dit is geen volledig tracebewijs van de precieze delta.
- Geïsoleerde eerste hardwareproef: scherm via slaaptoets Dozing, vervolgens alleen HA command_screen_on verzonden, daarna Awake. Native HomeAssistant::NotificationScreenOnWakeLock acq/rel gezien. Continu-wakker mStayOn=false.
- Extra overlaytoestemming ('weergeven vóór andere apps') door automatische goedkeuringsreview geweigerd als gevoelig, niet verleend en niet omzeild. Remote command_webview-route niet gebruikt. Reguliere, officieel ondersteunde gebruikersnavigatie via homeassistant://navigate/app/350f0e24_crems_energy opent de bestaande aangemelde app zonder overlaytoestemming. Echte CREMS Home Assistant live en veranderend bijgewerkt tijdstip gezien; grafiek-only fullscreen in1340×800 fysiek geactiveerd.
- Bestaande kiosk-hint in CREMS adviseert nog continu wakker blijven tijdens laden. Dat advies hoort bij de oude permanente kioskstand en past niet bij deze gebeurtenisgestuurde configuratie; instelling bewust UIT laten. Geen productiecode gewijzigd om dit te verbergen; gerichte UX-follow-up open.
- Tijdens inrichting een Android 'Systeem-UI reageert niet'-venster gezien; Wachten hielp niet, uitsluitend Systeem-UI sluiten koos Android-herstel. Geen tabletreset of hostherstart.

Lopende duurproef: alleen nieuwe automation tijdelijk off, met automatisch herstel in finally; directe eigen tabletmeldingen testen wakker worden, opnieuw wekken na60s en vervolgens600s Android-timeout zonder schermbediening. Geen echte sensordata gemanipuleerd. Bewijs .harness/task061-kiosk-duration-results.json; RUNNING is nog geen PASS. De uiteindelijke uitslag wordt hieronder toegevoegd.

Aanvullend actueel tracebewijs vóór de duurproef: op2026-11-05T18:24:57.209110Z daalt echte afname5.942→4.273kW (1669W). HA-conditie true, script_execution finished, action/0 en action/1 uitgevoerd. Vier kleinere voorgaande veranderingen (-5,-21,+10,-18W) tonen conditie false en geen acties. Uitsluitend traces van de nieuwe automatisering uitgelezen; bronbewijs .harness/task061-kiosk-trace-results.json. Dit onderscheidt werkelijk grensgedrag van alleen handmatige notify-smoketests.

## Einduitkomst duurproef — PASS binnen apparaatscope

2026-11-05T18:36:10.453Z afgerond. Eerste HA-wekactie zet Dozing→Awake. Tweede wekactie60s later; scherm nog Awake bij590061ms na hertrigger (dus voorbij600s na eerste wekken), daarna Dozing bij600449ms na hertrigger. Android mLastSleepReason=timeout, mStayOn=false, screen_off_timeout600000ms. Nieuwe automatisering automatisch hersteld naar on. Totale proef661582ms. Bronbewijs .harness/task061-kiosk-duration-results.json. Dit is echte verstreken tijd, geen verkorte/synthetische timerproef.

Daarna opnieuw via eigen HA-meldservice gewekt; echte grafiek-fullscreen met terugknop, Vandaag en bijwerkindicatie19:35 blijft behouden. Begrensde Agent C-rol apparaat-/kiosk-PASS voor wekken, hertrigger, tienminutentimeout en behouden fullscreen. Geen volledige375/1280/focus-/fout-/opslagmatrix of nieuwe CREMS-releasegoedkeuring. Geen onafhankelijke review APPROVED nageclaimd. Apparaatconfiguratie en aparte HA-beheersautomatisering zijn buiten CREMS-productiecode ingericht; FR-002/ADR-002 blijven voor CREMS zelf read-only, geen bridge/client-HA-writefunctie toegevoegd.

Nieuwe gebruikersverfijning tijdens proef: grafiek vergroten moet alleen grafiek plus bovenaan injectie/verbruik/prijs tonen. Dat wordt een afzonderlijke begrensde bronwijziging onder dezelfde Task061; bovenstaande apparaatproef geldt voor de op dit moment geïnstalleerde bron, niet voor nog te wijzigen frontend.
