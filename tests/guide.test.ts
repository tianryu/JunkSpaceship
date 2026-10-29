import { test } from "node:test";
import assert from "node:assert/strict";
import { newSave, normalize, buy, adsUnlocked, equip } from "../src/game/model";
import { guideStep, guideHint } from "../src/game/guide";

test("guide requires recycling, then affordable power and first drone without free rewards", () => {
  const s = newSave();
  s.tutorial.dragged = true;
  assert.equal(guideStep(s), 0);
  s.lifetime.scrap = 3;
  assert.equal(guideStep(s), 1);
  assert.equal(guideHint(s).target, ".arena");
  s.wallet = 10;
  assert.equal(guideHint(s).target, '[data-buy="power"]');
  assert.equal(buy(s, "power"), 1);
  assert.equal(guideStep(s), 2);
  assert.equal(guideHint(s).target, ".arena");
  s.wallet = 120;
  assert.equal(guideHint(s).target, '[data-buy="drones"]');
  assert.equal(buy(s, "drones"), 1);
  assert.equal(s.wallet, 0);
  assert.equal(guideStep(s), 3);
});

test("guide dismissal and replay never unlock ads or mutate gameplay milestones", () => {
  const s = newSave();
  s.guide = { step: 6, done: true };
  const restored = normalize(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored.guide, s.guide);
  assert.equal(adsUnlocked(restored), false);
  assert.deepEqual(restored.tutorial, newSave().tutorial);
  assert.equal(restored.wallet, 0);
  restored.guide = { step: 0, done: false };
  assert.equal(guideStep(restored), 0);
});

test("old saves keep mute choice and advanced progress when adding music and guide", () => {
  const old = {
    ...newSave(),
    guide: undefined,
    settings: { sound: false, reduced: true },
  };
  old.upgrades.power = 2;
  old.upgrades.drones = 1;
  old.tutorial.bought = true;
  const s = normalize(old);
  assert.equal(s.settings.music, false);
  assert.equal(s.settings.sound, false);
  assert.equal(guideStep(s), 3);
  s.settings.music = true;
  s.guide = { step: 4, done: false };
  assert.equal(normalize(s).settings.music, true);
  assert.equal(guideStep(normalize(s)), 4);
  assert.deepEqual(
    normalize({ ...s, guide: { step: 999, done: "yes" } }).guide,
    { step: 6, done: false },
  );
});

test("equipment CTA supports three slots and unequip before switching at capacity", () => {
  const s = newSave();
  for (const key of ["arc", "magnet", "swarm", "sorter"] as const)
    s.plugins[key] = 1;
  assert.equal(equip(s, "arc"), true);
  assert.equal(equip(s, "magnet"), true);
  assert.equal(equip(s, "swarm"), true);
  assert.equal(equip(s, "sorter"), false);
  assert.equal(equip(s, "arc"), true);
  assert.equal(equip(s, "sorter"), true);
  assert.deepEqual(s.equipped, ["magnet", "swarm", "sorter"]);
});
