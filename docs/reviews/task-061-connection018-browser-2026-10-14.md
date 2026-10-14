# Agent C — verbinding 0.1.18 — 14 oktober 2026

Root QA binnen de eerder expliciet geautoriseerde browser/verbindingsopenlijst; actuele gebruiker stuurt met ga door. Root enige productiecodewriter, onafhankelijke review afzonderlijk. Werkelijke browserbediening via CUA, geen overgenomen oude attestatie.

Kandidaat JS app-3f7dcffce4c1093d.js, CSS app-63f7e5165a14c645.css. Synthetische server localhost18122, geneste /api/hassio_ingress/qa018/{mode}/. Geen HA/providercredentials, geen echte meterwaarden, zichtbare synthetische banner. Schoon profiel op nieuwe origin, nul opgeslagen profielen. Geen opslagmutaties of CSV/upload/provider uitgevoerd; read-only publieke catalogus hergebruikt.

| Scenario | Werkelijke acties en resultaat | Status |
|---|---|---|
| Eerste laden | Fallbackpagina opent met Verbinden met Home Assistant en herkenbare demo. Initieel geen server-offlineclaim. | PASS |
| Streaming geheel onbeschikbaar | SSE503, current-endpoint200. Eerste browserpoging FAIL: native fetch werd als methode gebonden. Hook gecorrigeerd naar expliciete closure, opnieuw gebouwd en reload. Nu Home Assistant live en actuele synthetische meting via REST. | PASS na herstel |
| Beide verbindingen tijdelijk stuk | Outagepagina start live; stream stopt na3s en REST faalt tot18s. Reload en na4,5s: herstelbadge true, Laatste afname true, live false. Screenshot werkelijk genomen. Later zonder reload Home Assistant live true. | PASS |
| Stilstaande open stream | Silentpagina geeft slechts één SSE-event. Vervolgens blijft live met gewijzigde metingtijd (10:50:50→10:51:07) via RESTfallback, geen reload voor herstel. | PASS |
| Mobiel/navigatie/sortering |375×812, document scroll360/viewport375. Contract postcode9000 dag2500/nacht1500: EnergyVision617,80eerste. Overzicht viaEnter herstelt overzicht; live blijft. Screenshot toont focus en live. Refresh toont overzicht; synthetische savedstate leeg. | PASS |
| Gezonde stream/desktop |1280×900, scroll1265/viewport1280. Healthy live; Data-heading Controleer je kwartierdata; Overzicht live. Geen horizontale overflow. | PASS |
| Privacy/leeg/fout | Eigen lege opslagfixtures; ontbrekende history/prijs503 tonen expliciete waarschuwingen. Geen persoonlijke opslag aangeraakt, geen externe formulieraanvraag. QAserver read-only API, relatieve assets/API onder Ingressprefix. | PASS |

Ongeldige/verouderde/future events, timeout/nooverlap, cleanup/late events en geordende acceptatie zijn werkelijk bewezen met6deterministische controllertests; geen afzonderlijke browserclaim voor die unitcases. Volledige checks core71/web173/bridge111/harness13=368PASS, build/typecheck/structuurPASS, stabletrue. Fingerprint27f6f082840acf0a64be0487ad04421b618249112fd3efbf8d180a8455e8d9e1.

Beelden maximaal3: .harness/browser018/reconnecting.png en mobile.png beide visueel gecontroleerd; derde gereserveerd voor geïnstalleerdeHA. Tijdelijke viewport gereset en agenttab18 gesloten. Huidige browserstatus PASS voor deze bevroren kandidaat. Pi-uitrol/doelcontrole volgt pas na actuele onafhankelijkeAPPROVED; fysiekeLAN/echtebackuprestore/duurhardwaregates blijven apart open.
