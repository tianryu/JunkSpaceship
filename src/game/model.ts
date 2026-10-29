import {
  CHAPTERS,
  DRONE_COSTS,
  MAX_MONEY,
  PLUGINS,
  UPGRADES,
  type Plugin,
  type Upgrade,
} from "./content";
export type Placement =
  | "cash_supply"
  | "clear_screen"
  | "precision_salvage"
  | "targeted_research"
  | "offline_double"
  | "settlement_bonus";
export interface Reward {
  id: string;
  placement: Placement;
  amount: number;
  target?: string;
  createdAt: number;
  screen?: ScreenSnapshot;
}
export type JunkKind = "scrap" | "machine" | "battery";
export interface ScreenSnapshot {
  chapter: number;
  items: { id: number; kind: JunkKind; value: number }[];
}
export interface Save {
  version: 1;
  wallet: number;
  cores: number;
  upgrades: Record<Upgrade, number>;
  coreLevels: { hand: number; drone: number };
  chapter: number;
  contribution: number;
  parts: number;
  launched: boolean;
  plugins: Record<Plugin, number>;
  equipped: Plugin[];
  research: number;
  crates: { id: string; chapter: number }[];
  misses: number;
  pulse: number;
  lifetime: {
    scrap: number;
    machines: number;
    value: number;
    playSeconds: number;
    ads: number;
  };
  tutorial: { dragged: boolean; bought: boolean; researchSeen: boolean };
  guide: { step: number; done: boolean };
  settings: { sound: boolean; music: boolean; reduced: boolean };
  order: { index: number; kind: number; progress: number; target: number };
  bonus: { id: string; amount: number } | null;
  offline: { id: string; amount: number } | null;
  pending: Reward | null;
  settled: string[];
  lastActiveAt: number;
  referenceRate: number;
  nextId: number;
}
export const newSave = (now = Date.now()): Save => ({
  version: 1,
  wallet: 0,
  cores: 0,
  upgrades: {
    power: 0,
    range: 0,
    drones: 0,
    dronePower: 0,
    value: 0,
    pulse: 0,
  },
  coreLevels: { hand: 0, drone: 0 },
  chapter: 0,
  contribution: 0,
  parts: 0,
  launched: false,
  plugins: { arc: 0, magnet: 0, swarm: 0, cutter: 0, resonance: 0, sorter: 0 },
  equipped: [],
  research: 0,
  crates: [],
  misses: 0,
  pulse: 25,
  lifetime: { scrap: 0, machines: 0, value: 0, playSeconds: 0, ads: 0 },
  tutorial: { dragged: false, bought: false, researchSeen: false },
  guide: { step: 0, done: false },
  settings: { sound: true, music: true, reduced: false },
  order: { index: 0, kind: 0, progress: 0, target: 100 },
  bonus: null,
  offline: null,
  pending: null,
  settled: [],
  lastActiveAt: now,
  referenceRate: 0,
  nextId: 1,
});
export const clone = (s: Save): Save => structuredClone(s);
export function finite(n: unknown, min = 0, max = MAX_MONEY): number {
  return typeof n === "number" && Number.isFinite(n)
    ? Math.min(max, Math.max(min, n))
    : min;
}
export function normalize(raw: unknown, now = Date.now()): Save {
  const s = newSave(now);
  if (!raw || typeof raw !== "object" || (raw as Save).version !== 1) return s;
  const r = raw as Partial<Save>;
  s.wallet = finite(r.wallet);
  s.cores = Math.floor(finite(r.cores, 0, 1e6));
  s.chapter = Math.floor(finite(r.chapter, 0, 4));
  s.parts = Math.floor(finite(r.parts, 0, 5));
  s.launched = r.launched === true && s.parts === 5;
  s.contribution = finite(r.contribution);
  for (const k of UPGRADES)
    s.upgrades[k] = Math.floor(
      finite(
        r.upgrades?.[k],
        0,
        k === "drones" ? 6 : k === "range" || k === "pulse" ? 5 : 25,
      ),
    );
  for (const k of PLUGINS)
    s.plugins[k] = Math.floor(finite(r.plugins?.[k], 0, 5));
  s.equipped = [
    ...new Set(
      (Array.isArray(r.equipped) ? r.equipped : []).filter(
        (k) => PLUGINS.includes(k) && s.plugins[k] > 0,
      ),
    ),
  ].slice(0, 3);
  s.coreLevels = {
    hand: Math.floor(finite(r.coreLevels?.hand, 0, 10)),
    drone: Math.floor(finite(r.coreLevels?.drone, 0, 10)),
  };
  s.research = Math.floor(finite(r.research, 0, 1e6));
  s.crates = (Array.isArray(r.crates) ? r.crates : [])
    .filter(
      (c) =>
        c &&
        typeof c === "object" &&
        typeof c.id === "string" &&
        Number.isInteger(c.chapter) &&
        c.chapter >= 0 &&
        c.chapter < 5,
    )
    .slice(0, 5000);
  s.crates = s.crates.filter(
    (c, i, a) => a.findIndex((x) => x.id === c.id) === i,
  );
  s.misses = Math.floor(finite(r.misses, 0, 3));
  s.pulse = finite(r.pulse, 0, 25);
  for (const k of ["scrap", "machines", "value", "playSeconds", "ads"] as const)
    s.lifetime[k] = finite(r.lifetime?.[k]);
  s.tutorial = {
    dragged: r.tutorial?.dragged === true,
    bought: r.tutorial?.bought === true,
    researchSeen: r.tutorial?.researchSeen === true,
  };
  s.settings = {
    sound: r.settings?.sound !== false,
    // Respect the old sound-off choice when migrating an existing save.
    music:
      typeof r.settings?.music === "boolean"
        ? r.settings.music
        : r.settings?.sound !== false,
    reduced: r.settings?.reduced === true,
  };
  s.guide = {
    step: Math.floor(finite(r.guide?.step, 0, 6)),
    done: r.guide?.done === true,
  };
  s.order = {
    index: Math.floor(finite(r.order?.index, 0, 100000)),
    kind: Math.floor(finite(r.order?.kind, 0, 2)),
    progress: finite(r.order?.progress),
    target: finite(r.order?.target, 1),
  };
  s.bonus =
    r.bonus && typeof r.bonus.id === "string"
      ? { id: r.bonus.id, amount: finite(r.bonus.amount) }
      : null;
  s.offline =
    r.offline && typeof r.offline.id === "string"
      ? { id: r.offline.id, amount: finite(r.offline.amount) }
      : null;
  s.settled = (Array.isArray(r.settled) ? r.settled : [])
    .filter((x) => typeof x === "string")
    .slice(-256);
  s.pending = null;
  s.lastActiveAt = finite(r.lastActiveAt, 0, now + 86400000);
  // A process interrupted during an ad has no trustworthy end timestamp.
  // Keep resources, discard the unconfirmed reward, and do not double-count
  // that same interval as offline production.
  if (r.pending) s.lastActiveAt = now;
  s.referenceRate = finite(r.referenceRate);
  s.nextId = Math.floor(finite(r.nextId, 1, 1e12));
  return s;
}
export function plugin(s: Save, p: Plugin) {
  return s.equipped.includes(p) ? s.plugins[p] : 0;
}
export function stats(s: Save) {
  return {
    hand: 4 * 1.25 ** s.upgrades.power * (1 + 0.08 * s.coreLevels.hand),
    drone:
      2 *
      1.22 ** s.upgrades.dronePower *
      (1 + 0.08 * s.coreLevels.drone) *
      (1 + 0.06 * plugin(s, "swarm")),
    radius:
      34 * (1 + 0.12 * s.upgrades.range) * (1 + 0.04 * plugin(s, "magnet")),
    targets: 1 + Math.floor(s.upgrades.range / 2),
    value:
      1.15 ** s.upgrades.value *
      (1 + 0.04 * plugin(s, "sorter")) *
      (1 + 0.02 * Math.min(20, s.order.index)),
    pulse: 25 - s.upgrades.pulse * 2,
  };
}
export function upgradeCap(s: Save, k: Upgrade) {
  const c = CHAPTERS[s.chapter];
  return k === "range" || k === "pulse" ? 5 : k === "drones" ? c.drones : c.cap;
}
export function cost(s: Save, k: Upgrade) {
  const n = s.upgrades[k];
  if (n >= upgradeCap(s, k)) return Infinity;
  if (k === "drones") return DRONE_COSTS[n];
  if (k === "power" && n === 0) return 10;
  const [b, r] = (
    {
      power: [70, 1.8],
      range: [200, 1.3],
      dronePower: [90, 1.85],
      value: [240, 1.82],
      pulse: [2000, 2.5],
    } as const
  )[k];
  return Math.ceil((b * r ** n) / 10) * 10;
}
export function buy(s: Save, k: Upgrade, max = false) {
  if (s.pending) return 0;
  if ((k === "dronePower" || k === "pulse") && s.upgrades.drones === 0)
    return 0;
  let n = 0;
  do {
    const c = cost(s, k);
    if (s.wallet < c || !Number.isFinite(c)) break;
    s.wallet -= c;
    s.upgrades[k]++;
    s.tutorial.bought = true;
    n++;
  } while (max && n < 30);
  return n;
}
export function coreUpgrade(s: Save, k: "hand" | "drone") {
  if (s.pending) return false;
  const n = s.coreLevels[k],
    c = 1 + Math.floor(n / 2);
  if (n >= 10 || s.cores < c) return false;
  s.cores -= c;
  s.coreLevels[k]++;
  return true;
}
export function equip(s: Save, p: Plugin) {
  if (s.pending) return false;
  if (s.plugins[p] === 0) return false;
  const i = s.equipped.indexOf(p);
  if (i >= 0) s.equipped.splice(i, 1);
  else if (s.equipped.length < 3) s.equipped.push(p);
  else return false;
  return true;
}
export function candidates(s: Save) {
  return PLUGINS.filter((p) => s.plugins[p] < 5);
}
export function research(s: Save, rng: () => number, target?: Plugin) {
  if (s.pending || s.research < 1) return null;
  const pool = candidates(s);
  if (target && !pool.includes(target)) return null;
  s.research--;
  if (!pool.length) {
    s.wallet = Math.min(MAX_MONEY, s.wallet + CHAPTERS[s.chapter].bonus);
    return "cash" as const;
  }
  const p =
    target ?? pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
  s.plugins[p]++;
  if (!s.equipped.includes(p) && s.equipped.length < 3) s.equipped.push(p);
  return p;
}
export function salvage(
  s: Save,
  rng: () => number,
  precise = false,
  id = s.crates[0]?.id,
) {
  if (s.pending) return null;
  const i = s.crates.findIndex((c) => c.id === id);
  if (i < 0) return null;
  const crate = s.crates[i];
  s.crates.splice(i, 1);
  if (precise || s.misses === 3 || rng() < 0.35) {
    s.cores++;
    if (!precise) s.misses = 0;
    return "core";
  }
  s.misses++;
  s.wallet = Math.min(
    MAX_MONEY,
    s.wallet + CHAPTERS[crate.chapter].compensation,
  );
  return "cash";
}
export function adsUnlocked(s: Save) {
  return (
    s.lifetime.playSeconds >= 60 && s.tutorial.bought && s.tutorial.dragged
  );
}
export function junkValue(s: Save, kind: JunkKind) {
  return (
    { scrap: 2, machine: 18, battery: 7 }[kind] *
    CHAPTERS[s.chapter].value *
    stats(s).value
  );
}
// Shared economic path for ordinary combat and the one-shot clear reward.
export function recoverJunk(
  s: Save,
  kind: JunkKind,
  value: number,
  sourceChapter = s.chapter,
) {
  s.wallet = Math.min(MAX_MONEY, s.wallet + value);
  s.contribution = Math.min(MAX_MONEY, s.contribution + value);
  s.lifetime.value += value;
  s.lifetime.scrap++;
  const research = s.lifetime.scrap % 80 === 0;
  if (research) s.research++;
  let crate = false;
  if (kind === "machine") {
    s.lifetime.machines++;
    if (s.lifetime.machines % 20 === 0 && s.crates.length < 5000) {
      s.crates.push({ id: `crate-${s.nextId++}`, chapter: sourceChapter });
      crate = true;
    }
  }
  if (s.launched) {
    if (s.order.kind === 2) s.order.progress += value;
    else if (
      (s.order.kind === 0 && kind === "machine") ||
      (s.order.kind === 1 && kind === "battery")
    )
      s.order.progress++;
  }
  return { research, crate };
}
export function prepareReward(
  s: Save,
  placement: Placement,
  target?: string,
  now = Date.now(),
  screen?: ScreenSnapshot,
): Reward | null {
  if (s.pending || !adsUnlocked(s)) return null;
  let amount = 0;
  switch (placement) {
    case "cash_supply":
      amount = Math.max(90, Math.round(90 * s.referenceRate));
      break;
    case "clear_screen":
      if (
        !screen ||
        screen.chapter !== s.chapter ||
        screen.items.length === 0 ||
        screen.items.length > 64
      )
        return null;
      if (new Set(screen.items.map((j) => j.id)).size !== screen.items.length)
        return null;
      if (
        screen.items.some(
          (j) =>
            !Number.isInteger(j.id) ||
            !["scrap", "machine", "battery"].includes(j.kind) ||
            !Number.isFinite(j.value) ||
            j.value <= 0,
        )
      )
        return null;
      amount = screen.items.reduce((sum, j) => sum + j.value, 0);
      break;
    case "precision_salvage":
      if (!target || !s.crates.some((c) => c.id === target) || s.misses === 3)
        return null;
      amount = 1;
      break;
    case "targeted_research":
      if (s.research < 1 || !candidates(s).includes(target as Plugin))
        return null;
      amount = 1;
      break;
    case "offline_double":
      if (!s.offline) return null;
      target = s.offline.id;
      amount = s.offline.amount;
      break;
    case "settlement_bonus":
      if (!s.bonus) return null;
      target = s.bonus.id;
      amount = s.bonus.amount;
      break;
  }
  const r: Reward = {
    id: `reward-${s.nextId++}`,
    placement,
    amount,
    target,
    createdAt: now,
    ...(placement === "clear_screen" && screen
      ? { screen: structuredClone(screen) }
      : {}),
  };
  s.pending = r;
  return r;
}
export function settleReward(s: Save, id: string, completed: boolean) {
  const r = s.pending;
  if (!r || r.id !== id || s.settled.includes(id)) return false;
  s.pending = null;
  if (!completed) return false;
  switch (r.placement) {
    case "cash_supply":
      s.wallet = Math.min(MAX_MONEY, s.wallet + r.amount);
      break;
    case "clear_screen":
      if (!r.screen || r.screen.chapter !== s.chapter) return false;
      for (const j of r.screen.items)
        recoverJunk(s, j.kind, j.value, r.screen.chapter);
      break;
    case "precision_salvage":
      if (!salvage(s, () => 0, true, r.target)) return false;
      break;
    case "targeted_research":
      if (!research(s, () => 0, r.target as Plugin)) return false;
      break;
    case "offline_double":
      if (s.offline?.id !== r.target) return false;
      s.wallet = Math.min(MAX_MONEY, s.wallet + 2 * r.amount);
      s.offline = null;
      break;
    case "settlement_bonus":
      if (s.bonus?.id !== r.target) return false;
      s.wallet = Math.min(MAX_MONEY, s.wallet + r.amount);
      s.bonus = null;
      break;
  }
  s.lifetime.ads++;
  s.settled.push(id);
  s.settled = s.settled.slice(-256);
  return true;
}
export function claimOffline(s: Save) {
  if (!s.offline || s.pending) return false;
  s.wallet = Math.min(MAX_MONEY, s.wallet + s.offline.amount);
  s.offline = null;
  return true;
}
export function offline(s: Save, now = Date.now()) {
  const dt = Math.min(7200, Math.max(0, (now - s.lastActiveAt) / 1000));
  s.lastActiveAt = now;
  if (dt < 60 || s.offline || s.referenceRate <= 0 || s.upgrades.drones === 0)
    return false;
  s.offline = {
    id: `offline-${s.nextId++}`,
    amount: Math.floor(s.referenceRate * dt * 0.25),
  };
  return true;
}
export function install(s: Save) {
  if (
    s.pending ||
    s.launched ||
    s.parts === 5 ||
    s.contribution < CHAPTERS[s.chapter].target
  )
    return false;
  const c = CHAPTERS[s.chapter];
  s.parts++;
  s.bonus = { id: `chapter-${s.chapter}`, amount: c.bonus };
  if (s.parts < 5) {
    s.chapter++;
    s.contribution = 0;
  }
  return true;
}
export function startOrder(s: Save) {
  s.order.kind = s.order.index % 3;
  s.order.progress = 0;
  const c = CHAPTERS[4];
  s.order.target =
    s.order.kind === 0
      ? Math.ceil(160 * Math.min(5, 1.08 ** s.order.index))
      : s.order.kind === 1
        ? Math.ceil(120 * Math.min(5, 1.08 ** s.order.index))
        : Math.round(c.target * 0.3 * Math.min(5, 1.08 ** s.order.index));
}
export function launch(s: Save) {
  if (s.pending || s.parts !== 5 || s.launched) return false;
  s.launched = true;
  startOrder(s);
  return true;
}
export function finishOrder(s: Save) {
  if (s.pending || !s.launched || s.order.progress < s.order.target)
    return false;
  s.bonus = { id: `order-${s.order.index}`, amount: CHAPTERS[4].bonus };
  s.order.index++;
  startOrder(s);
  return true;
}
