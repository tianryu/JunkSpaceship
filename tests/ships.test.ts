import { test } from "node:test";
import assert from "node:assert/strict";
import { newSave, install, launch, normalize } from "../src/game/model";
import { CHAPTERS } from "../src/game/content";
import { shipIndex, SHIPS } from "../src/ui/ships";

test("each chapter unlocks a distinct hull and the final hull survives launch and reload", () => {
  const s = newSave();
  assert.equal(new Set(SHIPS.map(x => x.name)).size, 6);
  for (let stage = 0; stage < 5; stage++) {
    assert.equal(shipIndex(s), stage);
    s.contribution = CHAPTERS[stage].target;
    assert.ok(install(s));
    assert.equal(shipIndex(normalize(s)), stage + 1);
  }
  assert.ok(launch(s));
  assert.equal(shipIndex(s), 5);
  assert.equal(shipIndex(normalize(s)), 5);
});
