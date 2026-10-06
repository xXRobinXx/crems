# Task 061 — onafhankelijke lokale contractcatalogusreview

Datum:4oktober2026. Agent A, read-only productiecode. **CHANGES REQUIRED in deze eerste review; browser NOT RUN, geen gebruikersreleaseapproval of attestatie.** Root enige productie/toolwriter.

## Bewezen herstelpunten

1. Nieuwe packages/core subpath is een conditionalexport(types/src,default/dist). Huidige tools/check-structure.mjs accepteert uitsluitend stringtargets; eigen pnpm check:structure faalt met Onverwachte core-exportvorm. Toolguard/regressies moeten begrensd deze nieuwe vorm controleren en scope vooraf uitbreiden. Dit is een concrete fullharnessblocker.
2. Injectietekst in LocalContractCatalog.tsx noemt3.27ct/kWh maandindicatie. Primaire supplierPDF p2(c) zegt dat de weergegeven prijs via Vlaamse Nutsregulator-methodologie een inschatting op jaarbasis is; alleen de formule/index en1ctminimum worden op maandbasis bepaald. Toon gepubliceerde variabele indicatie zonder onjuiste maandmeting-/maandprijsclaim. Geen injectiejaarkrediet berekenen is correct.

## Eigen bron/codechecks

Primaire PDF zelfstandig gelezen: https://www.energyvision.be/sites/default/files/inline-files/EV-1026-GS3JV-nl.pdf pages1–2:13.57ct/kWh vast afname,75EUR/jaar,6%btw,particulierenVlaanderen,36maanden; formule0.6×Belpex-SPP-M−15EUR/MWh en minimum1ct/kWh maandelijks. BronbytesSHA door root aangeleverd; Agent A herberekende de PDFSHA niet. Rootonderzoekdocument bestond bij deze eerste check nog niet, dus bron/licentietoelichtingdocumentreview nog open.

Corevalidator/Brusselse offermaand/volumes/math inspectie en eigen4/4coretestsPASS.3500kWh→474.95EUR afname+75→549.95EUR; injectie aanwezig geeftnull onberekend,geeninjectie0 uitsluitend absence. Expired/future kaart stopt nieuwe estimate; regio zonderdekking stopt estimate. GETroute constant catalog,no fetch/storage/PII;serverroute achter bestaande ingresspeer/prefixboundary;relatievefrontendGET zonderbody/query behoudt nestedIngress. Sourceurlhttps/no credentials en broncontrolemetadata aanwezig. Geen complete markt/prijs-/batterijROIclaim.

Eigen webclienttestrun faalde vóór uitvoering omdat nieuwe dist/local-contract-catalog.js nog niet gebouwd was; MODULE_NOT_FOUND is buildvolgorde-beperking,geen geslaagde testclaim. Na corebuild moeten gerichte web/bridge/componentchecks en conditionalexportruntime bevestigd worden. UI-/failure/regiocases en volledige finale tests/build/typecheck blijven te bewijzen. Bestaande externoptin staat in optionele details en gebruikt bestaande afzonderlijke privacyactie; geen browserbediening in deze buildopdracht.

## Scope en vervolg

Geen productiecode door reviewer geschreven. Root herstelt bovengenoemde beperkte punten; dan onafhankelijke herreview en gerichte tests. Bestaande CSV/profiel/batterij/providerflowregressies blijven relevant. Nieuwe bron maakt vorige kandidaatfingerprint verouderd; geen publicatie/Pi-update uit deze review. Browsergate blijft NOT RUN zonder nieuwe expliciete browseropdracht.
## Herreview na herstel — 4 oktober 2026

**CODE APPROVED voor de begrensde lokale catalogusimplementatie; browser NOT RUN en gebruikersrelease CHANGES REQUIRED.** Beide bewezen blockers hersteld. De subpath-export volgt nu bestaande stringvorm src/local-contract-catalog.ts; structuurcheckPASS. Bridge-import is type-only en in gebouwde dist/local-contract-catalog.js verdwenen: productiebackend laadt deze TypeScript-subpath niet. Frontend wordt gebundeld; nieuwe core4/4 en webclient2/2 zijn door Agent A zelfstandig PASS herhaald. Onafhankelijke bridge-route1/1PASS met normale procesrechten; eerste sandboxpoging stopte in tsx/os.userInfo ENOMEM vóór testuitvoering en is niet als geslaagd geclaimd.

Injectiecopy noemt nu gepubliceerde variabele indicatie en onderscheidt expliciet regulator-jaarmethodologie van daadwerkelijk maandelijkse vergoeding. Geen fictief vaste injectiejaarprijs of nettojaarbedrag. De primaire bronwaarden/eenheden blijven juist en door onafhankelijke PDFtekstcontrole ondersteund. docs/research/local-contract-catalog.md is nu gelezen: bron/controledatum/digest, feitelijke snapshotgrens, geen PDF-/logokopie en zelfstandig implementatie/licentietoelichting staan vast. Agent A heeft de rootdownload-SHA niet zelfstandig herberekend.

Root meldt aanvullende component32PASS, typechecksPASS en finale fullharness; Agent A herhaalde eigen7catalogustests+structuurcontrole, geen volledige rootmatrix. Geen concrete resterende blocker binnen deze code-/snapshot-/regio-/expiry-/privacy-/exportscope gevonden. Actuele browsercases voor lokale bedragen, unsupportedregion, loading/error/expired/current, responsive/focus en behouden CSV/providerflow blijven vereist na nieuwe expliciete opdracht; eerdere0.1.15assets/fingerprints gelden niet voor deze nieuwe frontend. Geen attestatie, publicatie of Pi-uitrol uit deze codeapproval afgeleid.
