import assert from "node:assert/strict";
import test from "node:test";
import { parseLiveMeterEvent } from "../src/use-live-meter.ts";

const valid = { timestamp:"2026-08-31T10:00:00.000Z",importPowerW:100,exportPowerW:0,importEnergyKwh:10,exportEnergyKwh:2,quality:"measured",source:"home-assistant" };
test("malformed en onveilige events worden genegeerd zonder JSON-crash",()=>{assert.equal(parseLiveMeterEvent("{kapot"),undefined);assert.equal(parseLiveMeterEvent(JSON.stringify({...valid,importPowerW:"100"})),undefined);assert.equal(parseLiveMeterEvent(JSON.stringify({...valid,quality:"fantasie"})),undefined);assert.equal(parseLiveMeterEvent(JSON.stringify({...valid,currentPriceEurKwh:"0.2"})),undefined);assert.equal(parseLiveMeterEvent(JSON.stringify({...valid,nextPriceEurKwh:Number.NaN})),undefined);});
test("geldige Home Assistant-reading wordt veilig aanvaard",()=>{assert.deepEqual(parseLiveMeterEvent(JSON.stringify(valid)),valid);});
