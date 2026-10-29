import { CHAPTERS } from "./content";
import {
  clone,
  plugin,
  stats,
  junkValue,
  recoverJunk,
  type Save,
  type ScreenSnapshot,
} from "./model";
export type Kind = "scrap" | "machine" | "battery";
export interface Junk {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  kind: Kind;
  sprite: number;
  angle: number;
  size: number;
  hit: number;
}
export interface GameEvent {
  kind: "pickup" | "arc" | "pulse" | "crate" | "research" | "clear";
  x: number;
  y: number;
  value?: number;
  toX?: number;
  toY?: number;
}
export function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export class Engine {
  junk: Junk[] = [];
  events: GameEvent[] = [];
  magnet = { x: 40, y: 200, active: false };
  elapsed = 0;
  private spawnTimer = 0;
  private attackTimer = 0;
  private nextId = 1;
  private rng: () => number;
  droneTargets: { x: number; y: number; id: number }[] = [];
  constructor(
    public state: Save,
    seed = Date.now(),
  ) {
    this.rng = seeded(seed);
    for (let i = 0; i < 24; i++) this.spawn();
  }
  reset() {
    this.junk = [];
    this.droneTargets = [];
    for (let i = 0; i < 24; i++) this.spawn();
  }
  spawn() {
    if (this.junk.length >= 30) return;
    const c = CHAPTERS[this.state.chapter],
      p = this.rng();
    const kind: Kind =
      p < c.weights[0]
        ? "scrap"
        : p < c.weights[0] + c.weights[1]
          ? "machine"
          : "battery";
    const sprite =
      kind === "scrap"
        ? Math.floor(this.rng() * 3)
        : kind === "machine"
          ? 3
          : 4;
    const hp = { scrap: 3, machine: 18, battery: 8 }[kind] * c.hp;
    let x = 36,
      y = 40,
      best = -Infinity;
    for (let i = 0; i < 28; i++) {
      const px = 32 + this.rng() * 286,
        py = 33 + this.rng() * 173;
      if (px > 245 && py > 179) continue;
      const score = Math.min(
        ...this.junk.map((a) => Math.hypot(a.x - px, a.y - py) - a.size * 0.3),
      );
      if (score > best) {
        x = px;
        y = py;
        best = score;
      }
      if (score > 34) break;
    }
    this.junk.push({
      id: this.nextId++,
      x,
      y,
      hp,
      maxHp: hp,
      kind,
      sprite,
      angle: (this.rng() - 0.5) * 1.1,
      size: kind === "machine" ? 56 : kind === "battery" ? 38 : 40,
      hit: 0,
    });
  }
  tick(dt: number) {
    if (this.state.pending) {
      this.events = [];
      return;
    }
    dt = Math.min(0.25, Math.max(0, dt));
    this.elapsed += dt;
    const s = this.state,
      st = stats(s);
    s.lifetime.playSeconds += dt;
    this.events = [];
    for (const j of this.junk) j.hit = Math.max(0, j.hit - dt);
    const spawnInterval = [0.28, 0.24, 0.18, 0.14, 0.1][s.chapter];
    this.spawnTimer += dt;
    while (this.spawnTimer >= spawnInterval) {
      this.spawnTimer -= spawnInterval;
      this.spawn();
    }
    if (this.magnet.active) {
      s.tutorial.dragged = true;
      this.attackTimer += dt;
      if (this.attackTimer >= 0.25) {
        this.attackTimer -= 0.25;
        const nearby = this.junk
          .filter(
            (j) =>
              Math.hypot(j.x - this.magnet.x, j.y - this.magnet.y) < st.radius,
          )
          .sort(
            (a, b) =>
              Math.hypot(a.x - this.magnet.x, a.y - this.magnet.y) -
              Math.hypot(b.x - this.magnet.x, b.y - this.magnet.y),
          )
          .slice(0, st.targets);
        for (const j of nearby) this.damage(j, st.hand / 4);
      }
    } else this.attackTimer = 0;
    this.droneTargets = [];
    for (let i = 0; i < s.upgrades.drones; i++) {
      const center = { x: 45 + (i % 3) * 120, y: 40 + Math.floor(i / 3) * 130 };
      const target = [...this.junk]
        .filter((j) => j.hp > 0)
        .sort((a, b) => {
          const pa = plugin(s, "cutter") && a.kind === "machine" ? -120 : 0,
            pb = plugin(s, "cutter") && b.kind === "machine" ? -120 : 0;
          return (
            Math.hypot(a.x - center.x, a.y - center.y) +
            pa -
            Math.hypot(b.x - center.x, b.y - center.y) -
            pb
          );
        })[0];
      if (target) {
        this.droneTargets.push({ x: target.x, y: target.y, id: target.id });
        this.damage(
          target,
          st.drone *
            dt *
            (target.kind === "machine" ? 1 + 0.12 * plugin(s, "cutter") : 1),
        );
      }
    }
    if (s.upgrades.drones > 0) {
      s.pulse -= dt;
      if (s.pulse <= 0) {
        s.pulse = st.pulse;
        const targets = [...this.junk]
          .sort(
            (a, b) =>
              Math.hypot(a.x - this.magnet.x, a.y - this.magnet.y) -
              Math.hypot(b.x - this.magnet.x, b.y - this.magnet.y),
          )
          .slice(0, 4 + plugin(s, "arc"));
        for (const j of targets) this.damage(j, st.hand * 2);
        this.events.push({ kind: "pulse", x: this.magnet.x, y: this.magnet.y });
      }
    }
  }
  damage(first: Junk, amount: number) {
    const queue = [{ j: first, d: amount, depth: 0 }];
    let count = 0;
    while (queue.length && count++ < 64) {
      const { j, d, depth } = queue.shift()!;
      if (j.hp <= 0 || !this.junk.includes(j)) continue;
      j.hp -= d;
      j.hit = 0.1;
      if (j.hp > 0) continue;
      this.junk.splice(this.junk.indexOf(j), 1);
      const s = this.state,
        st = stats(s),
        value = junkValue(s, j.kind);
      const recovered = recoverJunk(s, j.kind, value);
      this.events.push({ kind: "pickup", x: j.x, y: j.y, value });
      if (recovered.research) {
        this.events.push({ kind: "research", x: j.x, y: j.y });
      }
      if (recovered.crate) {
        this.events.push({ kind: "crate", x: j.x, y: j.y });
      }
      if (j.kind === "battery" && depth < 6) {
        const r = 46 * (1 + 0.06 * plugin(s, "resonance"));
        for (const near of [...this.junk])
          if (Math.hypot(near.x - j.x, near.y - j.y) < r) {
            queue.push({ j: near, d: st.hand, depth: depth + 1 });
            this.events.push({
              kind: "arc",
              x: j.x,
              y: j.y,
              toX: near.x,
              toY: near.y,
            });
          }
      }
    }
  }
  captureScreen(): ScreenSnapshot {
    return {
      chapter: this.state.chapter,
      items: this.junk
        .filter((j) => j.hp > 0)
        .map((j) => ({
          id: j.id,
          kind: j.kind,
          value: junkValue(this.state, j.kind),
        })),
    };
  }
  removeCleared(screen: ScreenSnapshot) {
    const ids = new Set(screen.items.map((j) => j.id));
    this.events = [];
    let recovered = 0;
    for (const j of this.junk)
      if (ids.has(j.id)) {
        j.hp = 0;
        recovered += screen.items.find((item) => item.id === j.id)?.value ?? 0;
      }
    this.junk = this.junk.filter((j) => !ids.has(j.id));
    this.droneTargets = [];
    this.spawnTimer = 0;
    if (recovered > 0)
      this.events.push(
        { kind: "pickup", x: 175, y: 120, value: recovered },
        { kind: "clear", x: 175, y: 120 },
      );
  }
}
export function estimateRate(s: Save) {
  if (s.upgrades.drones === 0) return 0;
  const c = clone(s);
  c.pending = null;
  c.pulse = stats(c).pulse;
  const e = new Engine(c, 78231);
  const before = c.lifetime.value;
  for (let i = 0; i < 240; i++) e.tick(0.25);
  return Math.max(1, (c.lifetime.value - before) / 60);
}
