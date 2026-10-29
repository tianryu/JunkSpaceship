import { writeFileSync, mkdirSync } from "node:fs";
import {
  newSave,
  buy,
  cost,
  install,
  launch,
  research,
  salvage,
  coreUpgrade,
  prepareReward,
  settleReward,
  type Save,
} from "../src/game/model";
import { Engine, estimateRate, seeded } from "../src/game/engine";
import { UPGRADES, CHAPTERS } from "../src/game/content";
type Route = "active" | "ideal" | "idle" | "mixed" | "cash" | "clear";
function simulate(route: Route, seed: number) {
  const s = newSave(),
    e = new Engine(s, seed),
    rng = seeded(seed + 200),
    milestones: number[] = [];
  let t = 0,
    decision = 0,
    adClock = 0;
  let adSeconds = 0;
  for (; t < 4 * 3600; t += 0.25) {
    // The active policy pursues weak targets and batteries. Idle acts until its
    // first drone, then never uses the magnet again.
    if (
      route === "ideal" ||
      s.upgrades.drones === 0 ||
      (route !== "idle" && t % 10 < 4)
    ) {
      const j = [...e.junk].sort(
        (a, b) =>
          a.hp / (a.kind === "battery" ? 2 : 1) -
          b.hp / (b.kind === "battery" ? 2 : 1),
      )[0];
      if (j) {
        e.magnet = { x: j.x, y: j.y, active: true };
      }
    } else e.magnet.active = false;
    e.tick(0.25);
    decision += 0.25;
    adClock += 0.25;
    if (decision >= 2) {
      decision = 0;
      // Save for the first drone; later buy affordable equipment in recurring
      // priority order, using the same costs and chapter gates as the real game.
      if (s.upgrades.drones === 0 && s.upgrades.power === 0) buy(s, "power");
      if (s.upgrades.drones === 0) buy(s, "drones");
      else {
        for (const k of [
          "drones",
          "power",
          "dronePower",
          "range",
          "value",
          "pulse",
        ] as const)
          buy(s, k);
      }
      while (s.research > 0) research(s, rng);
      while (s.crates.length) salvage(s, rng);
      while (
        coreUpgrade(
          s,
          s.coreLevels.hand <= s.coreLevels.drone ? "hand" : "drone",
        )
      ) {}
    }
    if (
      route !== "active" &&
      route !== "ideal" &&
      route !== "idle" &&
      adClock >= (route === "mixed" ? 180 : 35) &&
      s.lifetime.playSeconds >= 60
    ) {
      adClock = 0;
      s.referenceRate = estimateRate(s);
      const placement =
        route === "clear" || (route === "mixed" && s.lifetime.ads % 2 === 0)
          ? "clear_screen"
          : "cash_supply";
      const r = prepareReward(
        s,
        placement,
        undefined,
        Date.now(),
        placement === "clear_screen" ? e.captureScreen() : undefined,
      );
      if (r) {
        settleReward(s, r.id, true);
        if (r.screen) e.removeCleared(r.screen);
        adSeconds += 30;
      }
    }
    if (s.contribution >= CHAPTERS[s.chapter].target) {
      if (install(s)) {
        milestones.push(Math.round(t));
        e.reset();
        if (s.parts === 5) {
          launch(s);
          break;
        }
      }
    }
  }
  return {
    route,
    seed,
    completed: s.launched,
    minutes: +(t / 60).toFixed(2),
    wallMinutes: +((t + adSeconds) / 60).toFixed(2),
    chapters: milestones.map((x) => +(x / 60).toFixed(2)),
    ads: s.lifetime.ads,
    scrap: s.lifetime.scrap,
    upgrades: s.upgrades,
    cores: s.coreLevels,
    plugins: s.plugins,
    wallet: Math.round(s.wallet),
  };
}
const routes: Route[] = process.argv[2]
  ? [process.argv[2] as Route]
  : ["active", "ideal", "idle", "mixed", "cash", "clear"];
const results = routes.flatMap((route) =>
  [17, 42, 97].map((seed) => simulate(route, seed)),
);
mkdirSync("docs/validation", { recursive: true });
writeFileSync(
  "docs/validation/simulation.json",
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      notes:
        "Shared engine, deterministic strategy, 0.25s step. Ad wall time assumed 30s. Not a human playtest.",
      results,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(results, null, 2));
