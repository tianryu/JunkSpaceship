import { Engine, type GameEvent } from "../game/engine";
import { stats } from "../game/model";
import { fmt } from "../game/content";
type Effect = GameEvent & { life: number; duration: number };
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private atlas = new Image();
  private effects: Effect[] = [];
  private clock = 0;
  private drones: { x: number; y: number }[] = Array.from(
    { length: 6 },
    (_, i) => ({ x: 285 - i * 35, y: 45 + i * 22 }),
  );
  constructor(
    private canvas: HTMLCanvasElement,
    public engine: Engine,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.atlas.src = new URL("art/sprites.png", document.baseURI).href;
    this.resize();
  }
  resize() {
    const d = Math.min(2, devicePixelRatio || 1);
    this.canvas.width = 350 * d;
    this.canvas.height = 240 * d;
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  add(events: GameEvent[]) {
    const cap = this.engine.state.settings.reduced ? 35 : 90;
    for (const e of events) {
      if (this.effects.length >= cap) this.effects.shift();
      this.effects.push({
        ...e,
        life: 0,
        duration: e.kind === "pickup" ? 0.65 : e.kind === "arc" ? 0.18 : 0.7,
      });
    }
  }
  sprite(
    i: number,
    x: number,
    y: number,
    w: number,
    h = w,
    angle = 0,
    alpha = 1,
  ) {
    if (!this.atlas.complete || !this.atlas.naturalWidth) return;
    const c = this.ctx,
      sw = this.atlas.naturalWidth / 4,
      sh = this.atlas.naturalHeight / 3;
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.globalAlpha = alpha;
    c.drawImage(
      this.atlas,
      (i % 4) * sw,
      Math.floor(i / 4) * sh,
      sw,
      sh,
      -w / 2,
      -h / 2,
      w,
      h,
    );
    c.restore();
  }
  draw(dt: number) {
    this.clock += dt;
    const c = this.ctx,
      e = this.engine,
      s = e.state,
      reduced = s.settings.reduced;
    c.clearRect(0, 0, 350, 240);
    for (const j of e.junk) {
      const wiggle =
        !reduced && j.hit > 0 ? Math.sin(this.clock * 90) * 0.045 : 0;
      if (j.kind === "machine" && j.id % 3 === 0)
        c.filter = "hue-rotate(95deg)";
      this.sprite(
        j.sprite,
        j.x,
        j.y,
        j.size * 1.25,
        j.size * 1.25,
        j.angle + wiggle,
      );
      c.filter = "none";
      if (j.hp < j.maxHp && j.hp > 0) {
        c.fillStyle = "#051522";
        c.fillRect(j.x - 10, j.y + j.size * 0.36, 20, 2);
        c.fillStyle = "#55DDE0";
        c.fillRect(j.x - 10, j.y + j.size * 0.36, (20 * j.hp) / j.maxHp, 2);
      }
    }
    const st = stats(s),
      m = e.magnet;
    c.save();
    c.beginPath();
    c.arc(m.x, m.y, st.radius, 0, Math.PI * 2);
    c.fillStyle = m.active ? "#00e6f020" : "#00e6f011";
    c.fill();
    c.strokeStyle = "#55F2F1";
    c.lineWidth = 1.5;
    if (!reduced) {
      c.shadowColor = "#00dce7";
      c.shadowBlur = m.active ? 9 : 4;
    }
    c.stroke();
    c.restore();
    if (m.active) {
      const targets = e.junk
        .filter((j) => Math.hypot(j.x - m.x, j.y - m.y) < st.radius)
        .slice(0, st.targets);
      for (const j of targets) {
        c.beginPath();
        c.moveTo(m.x, m.y);
        c.quadraticCurveTo((m.x + j.x) / 2 + 10, (m.y + j.y) / 2 - 9, j.x, j.y);
        c.strokeStyle = "#55DDE0";
        c.lineWidth = 1.1;
        c.stroke();
      }
    }
    this.sprite(
      5,
      m.x,
      m.y,
      82,
      82,
      -0.12 + (m.active && !reduced ? Math.sin(this.clock * 8) * 0.035 : 0),
    );
    for (let i = 0; i < s.upgrades.drones; i++) {
      const d = this.drones[i],
        t = e.droneTargets[i] ?? { x: 280 - i * 36, y: 55 };
      const tx = Math.min(315, Math.max(35, t.x + 20)),
        ty = Math.min(205, Math.max(22, t.y - 23));
      const lerp = reduced ? 1 : Math.min(1, dt * 5);
      d.x += (tx - d.x) * lerp;
      d.y += (ty - d.y) * lerp;
      if (e.droneTargets[i]) {
        c.strokeStyle = "#55DDE099";
        c.lineWidth = 0.7;
        c.beginPath();
        c.moveTo(d.x, d.y + 10);
        c.lineTo(t.x, t.y);
        c.stroke();
      }
      this.sprite(
        6,
        d.x,
        d.y + (reduced ? 0 : Math.sin(this.clock * 3 + i) * 1.8),
        76,
        76,
      );
    }
    for (const f of this.effects) {
      f.life += dt;
      const a = 1 - f.life / f.duration;
      if (a <= 0) continue;
      c.save();
      c.globalAlpha = a;
      if (f.kind === "pickup") {
        c.fillStyle = (f.value ?? 0) > 10 ? "#55DDE0" : "#FFC45C";
        c.font = "900 13px Scrap, sans-serif";
        c.textAlign = "center";
        c.strokeStyle = "#051321";
        c.lineWidth = 2.5;
        c.strokeText("+" + fmt(f.value ?? 0), f.x, f.y - f.life * 26);
        c.fillText("+" + fmt(f.value ?? 0), f.x, f.y - f.life * 26);
      } else if (f.kind === "arc") {
        c.strokeStyle = "#8DFEFF";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(f.x, f.y);
        c.lineTo(
          (f.x + (f.toX ?? f.x)) / 2 + 4,
          (f.y + (f.toY ?? f.y)) / 2 - 5,
        );
        c.lineTo(f.toX ?? f.x, f.toY ?? f.y);
        c.stroke();
      } else if (f.kind === "clear") {
        c.strokeStyle = "#66F7F2";
        c.lineWidth = reduced ? 1 : 2;
        const y = (240 * f.life) / f.duration;
        c.beginPath();
        c.moveTo(5, y);
        c.lineTo(345, y);
        c.stroke();
      } else {
        c.strokeStyle = f.kind === "pulse" ? "#55DDE0" : "#FFC45C";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(f.x, f.y, 8 + f.life * 65, 0, Math.PI * 2);
        c.stroke();
      }
      c.restore();
    }
    this.effects = this.effects.filter((f) => f.life < f.duration);
  }
  get effectCount() {
    return this.effects.length;
  }
}
