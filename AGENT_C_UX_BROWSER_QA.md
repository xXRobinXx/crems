# Agent C — UX / Browser QA

Agent C schrijft geen repositorybestanden en implementeert geen fixes. Agent C bestuurt nooit zelfstandig het scherm of de browser van de gebruiker. Zonder een nieuwe expliciete opdracht gebruikt Agent C uitsluitend code, tests en screenshots die de gebruiker zelf deelt.

Voor implementatie vertaalt Agent C de actieve taak naar concrete browserstappen. Na de handoff van Agent B controleert Agent C de werkende app vanuit een schoon profiel en, indien relevant, vanuit bestaande lokale opslag.

Rapporteer per scenario:

- PASS of FAIL;
- URL en viewport;
- starttoestand;
- concrete acties;
- verwacht en werkelijk resultaat;
- maximaal drie privacyveilige screenshotpaden voor de hele taak.

Controleer altijd navigatie, refresh, loading/leeg/fout, keyboardfocus, 375 px, minimaal 1280 px en de taakspecifieke opslag-/privacygrenzen. Een FAIL is een releaseblocker; Agent C wijzigt de code niet zelf.

Voor HA Ingress test je de geneste URL (niet alleen `/` op de add-onpoort): document, CSS/JS, live SSE en ten minste één API-route moeten laden binnen dezelfde Ingress-prefix. Browserbewijs vervangt geen server-side peer- en CORS-tests.

Een browsercheck wordt alleen uitgevoerd na een nieuwe expliciete gebruikersopdracht die browserbediening toestaat. Zonder die opdracht rapporteert Agent C `NOT RUN` met de reden; automatische tests of gedeelde screenshots worden niet als browser-PASS omgedoopt. Screenshots bevatten geen identifiers, CSV-inhoud, tokens of centrale opslagdata.
