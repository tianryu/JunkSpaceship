import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newSave,
  normalize,
  buy,
  cost,
  stats,
  coreUpgrade,
  candidates,
  research,
  equip,
  salvage,
  prepareReward,
  settleReward,
  offline,
  claimOffline,
  install,
  launch,
  finishOrder,
  type Placement,
} from "../src/game/model";
import { CHAPTERS, UPGRADES, PLUGINS } from "../src/game/content";
import { Engine, estimateRate, seeded } from "../src/game/engine";
import { SaveStore, SAVE_KEY } from "../src/platform/storage";
import { RewardedAds, type RewardedHost } from "../src/platform/ads";

function ready() {
  const s = newSave(1000);
  s.wallet = 10000;
  s.lifetime.playSeconds = 65;
  s.tutorial.bought = s.tutorial.dragged = true;
  s.referenceRate = 20;
  s.research = 3;
  s.crates = [{ id: "a", chapter: 0 }];
  s.offline = { id: "offline", amount: 500 };
  s.bonus = { id: "chapter", amount: 1000 };
  return s;
}
test("upgrades obey affordability, chapter caps, prerequisites and maximum purchase", () => {
  const s = newSave();
  assert.equal(buy(s, "power"), 0);
  s.wallet = 10;
  assert.equal(buy(s, "power"), 1);
  assert.equal(s.wallet, 0);
  assert.equal(buy(s, "dronePower"), 0);
  s.wallet = 1e12;
  for (const k of UPGRADES) buy(s, k, true);
  assert.equal(s.upgrades.power, 5);
  assert.equal(s.upgrades.drones, 1);
  assert.equal(s.upgrades.range, 5);
  assert.equal(cost(s, "power"), Infinity);
  assert.ok(s.wallet >= 0);
  const before = s.wallet;
  assert.equal(buy(s, "power"), 0);
  assert.equal(s.wallet, before);
});
test("normal salvage probability boundaries, compensation source and pity", () => {
  const s = newSave();
  s.chapter = 4;
  s.crates = Array.from({ length: 7 }, (_, i) => ({
    id: String(i),
    chapter: 0,
  }));
  assert.equal(
    salvage(s, () => 0.349999),
    "core",
  );
  assert.equal(s.cores, 1);
  for (let i = 0; i < 3; i++)
    assert.equal(
      salvage(s, () => 0.35),
      "cash",
    );
  assert.equal(s.wallet, 2400);
  assert.equal(s.misses, 3);
  assert.equal(
    salvage(s, () => 0.99),
    "core",
  );
  assert.equal(s.misses, 0);
  s.misses = 2;
  assert.equal(
    salvage(s, () => 1, true),
    "core",
  );
  assert.equal(s.misses, 2);
});
test("research uniform candidate endpoints, max exclusion, duplicates and all-max exchange", () => {
  const s = newSave();
  s.research = 40;
  assert.equal(
    research(s, () => 0),
    "arc",
  );
  assert.equal(
    research(s, () => 0.9999),
    "sorter",
  );
  s.plugins.arc = 5;
  assert.equal(candidates(s).length, 5);
  assert.equal(
    research(s, () => 0),
    "magnet",
  );
  assert.equal(
    research(s, () => 0, "sorter"),
    "sorter",
  );
  assert.equal(s.plugins.sorter, 2);
  for (const p of PLUGINS) s.plugins[p] = 5;
  assert.equal(
    research(s, () => 0),
    "cash",
  );
  assert.equal(s.wallet, CHAPTERS[0].bonus);
});
test("three unique equipped plugins apply their effect once", () => {
  const s = newSave();
  for (const p of PLUGINS) s.plugins[p] = 1;
  assert.equal(equip(s, "magnet"), true);
  const radius = stats(s).radius;
  assert.equal(radius, 34 * 1.04);
  equip(s, "magnet");
  assert.equal(stats(s).radius, 34);
  equip(s, "arc");
  equip(s, "magnet");
  equip(s, "swarm");
  assert.equal(equip(s, "cutter"), false);
  assert.equal(s.equipped.length, 3);
  s.cores = 100;
  for (let i = 0; i < 15; i++) coreUpgrade(s, "hand");
  assert.equal(s.coreLevels.hand, 10);
  assert.equal(s.cores, 70);
});
const placements: Placement[] = [
  "cash_supply",
  "clear_screen",
  "precision_salvage",
  "targeted_research",
  "offline_double",
  "settlement_bonus",
];
for (const placement of placements) {
  test(`${placement}: complete exactly once; duplicate request and close cannot consume twice`, () => {
    const s = ready(),
      target =
        placement === "precision_salvage"
          ? "a"
          : placement === "targeted_research"
            ? "arc"
            : undefined;
    const p = prepareReward(s, placement, target, Date.now(), {
      chapter: s.chapter,
      items: [{ id: 1, kind: "machine", value: 18 }],
    })!;
    assert.ok(p);
    assert.equal(
      prepareReward(s, placement, target, Date.now(), {
        chapter: s.chapter,
        items: [{ id: 1, kind: "machine", value: 18 }],
      }),
      null,
    );
    assert.equal(settleReward(s, "wrong", true), false);
    assert.equal(settleReward(s, p.id, true), true);
    const after = JSON.stringify(s);
    assert.equal(settleReward(s, p.id, true), false);
    assert.equal(JSON.stringify(s), after);
    assert.equal(s.lifetime.ads, 1);
    assert.equal(s.contribution, placement === "clear_screen" ? 18 : 0);
  });
  test(`${placement}: cancellation and reload preserve consumable resources`, () => {
    const s = ready(),
      target =
        placement === "precision_salvage"
          ? "a"
          : placement === "targeted_research"
            ? "arc"
            : undefined;
    const p = prepareReward(s, placement, target, Date.now(), {
      chapter: s.chapter,
      items: [{ id: 1, kind: "machine", value: 18 }],
    })!;
    assert.equal(settleReward(s, p.id, false), false);
    assert.equal(s.wallet, 10000);
    assert.equal(s.crates.length, 1);
    assert.equal(s.research, 3);
    assert.ok(s.offline);
    prepareReward(s, placement, target, Date.now(), {
      chapter: s.chapter,
      items: [{ id: 1, kind: "machine", value: 18 }],
    });
    const restored = normalize(JSON.parse(JSON.stringify(s)));
    assert.equal(restored.pending, null);
    assert.equal(restored.wallet, 10000);
    assert.equal(restored.research, 3);
    assert.equal(restored.lifetime.ads, 0);
  });
}
test("cash reward is frozen at the promised reference rate", () => {
  const s = ready();
  const r = prepareReward(s, "cash_supply")!;
  s.referenceRate = 99999;
  settleReward(s, r.id, true);
  assert.equal(s.wallet, 11800);
  s.misses = 3;
  assert.equal(prepareReward(s, "precision_salvage", "a"), null);
});
test("clear screen snapshots all objects and settles real money, research, crate and order progress once", () => {
  const s = ready();
  s.lifetime.scrap = 79;
  s.lifetime.machines = 19;
  s.launched = true;
  s.parts = 5;
  s.order.kind = 0;
  const e = new Engine(s, 42),
    snapshot = e.captureScreen(),
    before = s.wallet,
    count = e.junk.length,
    machines = snapshot.items.filter((j) => j.kind === "machine").length;
  const r = prepareReward(s, "clear_screen", undefined, Date.now(), snapshot)!;
  assert.ok(r);
  const expected = snapshot.items.reduce((sum, j) => sum + j.value, 0);
  snapshot.items[0].value = 999999;
  e.tick(0.25);
  assert.equal(e.junk.length, count);
  assert.equal(s.wallet, before);
  assert.equal(buy(s, "power"), 0);
  assert.equal(
    salvage(s, () => 0),
    null,
  );
  assert.equal(
    research(s, () => 0),
    null,
  );
  assert.equal(install(s), false);
  assert.equal(settleReward(s, r.id, true), true);
  assert.equal(s.wallet, before + expected);
  assert.equal(s.contribution, expected);
  assert.equal(s.lifetime.scrap, 79 + count);
  assert.equal(s.lifetime.machines, 19 + machines);
  assert.equal(s.research, 4);
  assert.equal(s.order.progress, machines);
  assert.ok(s.crates.length >= 2);
  e.removeCleared(r.screen!);
  assert.equal(e.junk.length, 0);
  assert.equal(e.droneTargets.length, 0);
  assert.equal(settleReward(s, r.id, true), false);
  e.tick(0.25);
  e.tick(0.25);
  assert.ok(e.junk.length > 0);
  const newIds = e.junk.map((j) => j.id);
  e.removeCleared(r.screen!);
  assert.deepEqual(
    e.junk.map((j) => j.id),
    newIds,
  );
});
test("clear screen cancellation, empty arena and malformed snapshots do not pay", () => {
  const s = ready(),
    e = new Engine(s, 31),
    snap = e.captureScreen(),
    before = s.wallet;
  const r = prepareReward(s, "clear_screen", undefined, Date.now(), snap)!;
  assert.equal(settleReward(s, r.id, false), false);
  assert.equal(s.wallet, before);
  assert.equal(e.junk.length, snap.items.length);
  assert.equal(prepareReward(s, "clear_screen"), null);
  assert.equal(
    prepareReward(s, "clear_screen", undefined, Date.now(), {
      chapter: 0,
      items: [],
    }),
    null,
  );
  assert.equal(
    prepareReward(s, "clear_screen", undefined, Date.now(), {
      chapter: 0,
      items: [snap.items[0], snap.items[0]],
    }),
    null,
  );
});
test("first ad gated on 60 effective seconds and both teaching steps", () => {
  const s = newSave();
  s.lifetime.playSeconds = 100;
  assert.equal(prepareReward(s, "cash_supply"), null);
  s.tutorial.dragged = s.tutorial.bought = true;
  s.lifetime.playSeconds = 59.99;
  assert.equal(prepareReward(s, "cash_supply"), null);
  s.lifetime.playSeconds = 60;
  assert.ok(prepareReward(s, "cash_supply"));
});
test("offline capped, clock rollback ignored, each receipt can be claimed once", () => {
  const s = newSave(1000);
  s.upgrades.drones = 1;
  s.referenceRate = 20;
  assert.equal(offline(s, 1000 + 9e6), true);
  assert.equal(s.offline?.amount, 36000);
  assert.equal(claimOffline(s), true);
  assert.equal(claimOffline(s), false);
  assert.equal(s.wallet, 36000);
  assert.equal(offline(s, 500), false);
  assert.equal(s.contribution, 0);
});
test("no drone means no displayed automatic rate or offline income; minimum ad supply remains available", () => {
  const s = ready();
  s.offline = null;
  s.lastActiveAt = 1000;
  s.referenceRate = estimateRate(s);
  assert.equal(s.referenceRate, 0);
  assert.equal(offline(s, 1000000), false);
  assert.equal(prepareReward(s, "cash_supply")?.amount, 90);
});
test("refresh during an unconfirmed ad cannot also create offline income", () => {
  const s = ready();
  s.offline = null;
  s.lastActiveAt = 1000;
  prepareReward(s, "cash_supply", undefined, 1000);
  const restored = normalize(JSON.parse(JSON.stringify(s)), 1000000);
  assert.equal(restored.pending, null);
  assert.equal(offline(restored, 1000000), false);
  assert.equal(restored.wallet, 10000);
});
test("five chapters install once, then launch and complete repeat orders", () => {
  const s = newSave();
  for (let i = 0; i < 5; i++) {
    s.contribution = CHAPTERS[i].target;
    assert.equal(install(s), true);
    assert.equal(install(s), false);
    assert.equal(s.parts, i + 1);
  }
  assert.equal(launch(s), true);
  assert.equal(launch(s), false);
  const goal = s.order.target;
  s.wallet += 1e10;
  assert.equal(s.order.target, goal);
  s.order.progress = goal;
  assert.equal(finishOrder(s), true);
  assert.equal(finishOrder(s), false);
  assert.equal(s.order.index, 1);
  assert.equal(s.launched, true);
});
test("one junk death pays once, battery chain bounded, entity and drone caps", () => {
  const s = ready();
  const e = new Engine(s, 123),
    j = e.junk[0],
    before = s.wallet;
  e.damage(j, 1e9);
  const after = s.wallet;
  assert.ok(after > before);
  e.damage(j, 1e9);
  assert.equal(s.wallet, after);
  s.upgrades.drones = 6;
  s.upgrades.power = 25;
  for (let i = 0; i < 2000; i++) {
    e.tick(0.05);
    assert.ok(e.junk.length <= 48);
    assert.ok(e.droneTargets.length <= 6);
  }
  assert.ok(Number.isFinite(s.wallet));
  assert.ok(s.wallet >= 0);
});
test("auto income and chapter progress continue without ads", () => {
  const s = newSave();
  s.upgrades.drones = 1;
  const e = new Engine(s, 1);
  for (let i = 0; i < 2400; i++) e.tick(0.25);
  assert.ok(s.wallet > 0);
  assert.ok(s.contribution > 0);
  assert.ok(s.lifetime.scrap > 80);
  assert.ok(s.research > 0);
  assert.equal(s.lifetime.ads, 0);
});
test("atomic snapshot preserves previous state on failed persistence", () => {
  let raw: string | null = null,
    fail = false;
  const storage = {
    getItem: () => raw,
    setItem: (_k: string, v: string) => {
      if (fail) throw Error("quota");
      raw = v;
    },
    removeItem: () => {
      raw = null;
    },
  };
  const store = new SaveStore(storage);
  store.state = ready();
  store.save();
  fail = true;
  const r = store.transaction((s) => {
    s.wallet += 500;
    s.research--;
  });
  assert.equal(r.ok, false);
  assert.equal(store.state.wallet, 10000);
  assert.equal(store.state.research, 3);
  fail = false;
  const reload = new SaveStore(storage);
  assert.equal(reload.state.wallet, 10000);
  assert.equal(reload.state.research, 3);
});
test("invalid JSON and impossible values recover without a crash", () => {
  const store = new SaveStore({
    getItem: () => "{broken",
    setItem: () => {},
    removeItem: () => {},
  });
  assert.equal(store.state.wallet, 0);
  const s = normalize({
    version: 1,
    wallet: Infinity,
    chapter: 999,
    plugins: { arc: 55 },
    upgrades: { drones: 77 },
    equipped: ["arc", "arc", "invalid"],
    crates: [],
  });
  assert.equal(s.wallet, 0);
  assert.equal(s.chapter, 4);
  assert.equal(s.plugins.arc, 5);
  assert.equal(s.upgrades.drones, 6);
  assert.deepEqual(s.equipped, ["arc"]);
  assert.equal(SAVE_KEY, "scrapship-save-v1");
});
test("reset writes a fresh save and clears the previous resources", () => {
  let raw: string | null = null;
  const storage = {
    getItem: () => raw,
    setItem: (_k: string, v: string) => {
      raw = v;
    },
    removeItem: () => {
      raw = null;
    },
  };
  const store = new SaveStore(storage);
  store.state = ready();
  store.save();
  assert.equal(store.reset(), true);
  const reloaded = new SaveStore(storage);
  assert.equal(reloaded.state.wallet, 0);
  assert.equal(reloaded.state.research, 0);
  assert.equal(reloaded.state.crates.length, 0);
  assert.equal(reloaded.state.chapter, 0);
});
test("reward persistence failure can retry the same receipt without double payment", () => {
  let raw: string | null = null,
    fail = false;
  const storage = {
    getItem: () => raw,
    setItem: (_k: string, v: string) => {
      if (fail) throw Error("quota");
      raw = v;
    },
    removeItem: () => {
      raw = null;
    },
  };
  const store = new SaveStore(storage);
  store.state = ready();
  const prepared = store.transaction((s) => prepareReward(s, "cash_supply"));
  assert.equal(prepared.ok, true);
  const id = prepared.value!.id;
  fail = true;
  assert.equal(store.transaction((s) => settleReward(s, id, true)).ok, false);
  assert.equal(store.state.wallet, 10000);
  assert.equal(store.state.pending?.id, id);
  fail = false;
  assert.equal(store.transaction((s) => settleReward(s, id, true)).value, true);
  assert.equal(store.state.wallet, 11800);
  assert.equal(
    store.transaction((s) => settleReward(s, id, true)).value,
    false,
  );
  assert.equal(store.state.wallet, 11800);
});
class Host implements RewardedHost {
  close: (e?: { isEnded?: boolean }) => void = () => {};
  error: (e: unknown) => void = () => {};
  shows = 0;
  loads = 0;
  failShow = false;
  failLoad = false;
  onClose(fn: typeof this.close) {
    this.close = fn;
  }
  onError(fn: typeof this.error) {
    this.error = fn;
  }
  async show() {
    this.shows++;
    if (this.failShow) throw Error("show");
  }
  async load() {
    this.loads++;
    if (this.failLoad) throw Error("load");
  }
}
test("SDK show resolution gives no reward; only strict complete close does", async () => {
  const h = new Host(),
    ads = new RewardedAds(h);
  let resolved = false;
  const result = ads.show().then((r) => {
    resolved = true;
    return r;
  });
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(resolved, false);
  h.close({ isEnded: true });
  assert.equal(await result, "completed");
  h.close({ isEnded: true });
  assert.equal(h.shows, 1);
  for (const v of [undefined, {}, { isEnded: false }]) {
    const p = ads.show();
    h.close(v);
    assert.equal(await p, "cancelled");
  }
});
test("SDK double click is rejected and failed show retries only once", async () => {
  const h = new Host(),
    ads = new RewardedAds(h);
  h.failShow = true;
  h.failLoad = true;
  const p = ads.show();
  assert.equal(await ads.show(), "unavailable");
  assert.equal(await p, "error");
  assert.equal(h.shows, 1);
  assert.equal(h.loads, 1);
  assert.equal(ads.available(), false);
});
test("SDK error followed by late complete close never awards", async () => {
  const h = new Host(),
    ads = new RewardedAds(h),
    p = ads.show();
  h.error({ code: 1 });
  h.close({ isEnded: true });
  assert.equal(await p, "error");
});
test("seeded random stream reproducible and 35% samples within 0.5 point", () => {
  const rng = seeded(42);
  let yes = 0;
  for (let i = 0; i < 100000; i++) if (rng() < 0.35) yes++;
  assert.ok(Math.abs(yes / 100000 - 0.35) < 0.005);
});
