# Task 060 — Agent C-browserrapport

Datum: 29 september 2026  
Status: **PASS** voor de CSV-contractflow in een geïsoleerde lokale browser.

Geteste versie: opnieuw gebouwde lokale `apps/web/dist`, geopend op een verse `localhost:5174/?qaCsv=1`-origin zonder bestaand lokaal profiel. De QA-knop maakt een synthetisch bestand in geheugen en is alleen op localhost beschikbaar.

Agent C opende Contract zonder Energiepaspoort en vulde postcode `1000`, huishouden `4`, tarief `Variabel` en domiciliëring `Nee` in. Daarna werd naar CSV genavigeerd, het volledige synthetische kalenderjaar 2025 verwerkt en werd “Gebruik jaarwaarden…” gekozen. De contractpagina bleef bereikbaar. Na “Vul dag/nachtwaarden in” toonden afname dag, afname nacht, injectie dag en injectie nacht elk `3.504 kWh`; postcode, afgeleid gewest Brussel, huishouden, tarief en betaalkeuze bleven behouden.

De externe privacytoestemming bleef uit en “Haal aanbiedingen op” bleef uitgeschakeld. Agent C heeft geen profiel opgeslagen, de vergelijkingsactie niet gestart en geen providerrequest veroorzaakt. De lokale statische testomgeving toonde “Bridge offline”, zoals verwacht zonder bridge.

Beperkingen: dit was synthetische testdata, geen echte meter-CSV of Raspberry Pi-runtime. De beschikbare browserbediening leverde geen console- of netwerkinspectie. Agent C stopte de lokale statische server na de controle; er zijn geen bestanden of gebruikersprofielen gewijzigd.
