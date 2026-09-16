# CREMS-architectuur

De eerste verticale slice bestaat uit drie workspaces:

- `apps/web`: zelfstandige React/PWA-interface.
- `apps/bridge`: lokaal proces dat één meterbron leest en data via HTTP/SSE aanbiedt.
- `packages/core`: gedeelde types en pure berekeningsfuncties.

De bridge kiest bij geldige lokale Home Assistant-configuratie `HomeAssistantSource`; zonder configuratie valt hij zichtbaar terug op `SimulatedP1Source`. Beide implementeren dezelfde `MeterSource`-interface. Daardoor hoeft de webapp niet te weten welke bron actief is.

Home Assistant is momenteel de eerste read-only databron via de REST API, maar geen frontenddependency van de app. Een latere DSMR-, TCP- of MQTT-adapter kan dezelfde broninterface gebruiken.
