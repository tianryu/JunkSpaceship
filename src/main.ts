import "./style.css";
import "./ui/refinement.css";
import "./ui/guide.css";
import "./ui/ships.css";
import {
  CHAPTERS,
  UPGRADES,
  UPGRADE_NAMES,
  UPGRADE_INFO,
  PLUGINS,
  PLUGIN_NAMES,
  PLUGIN_INFO,
  fmt,
  time,
  type Upgrade,
  type Plugin,
} from "./game/content";
import {
  newSave,
  buy,
  cost,
  stats,
  upgradeCap,
  coreUpgrade,
  candidates,
  research,
  equip,
  salvage,
  adsUnlocked,
  prepareReward,
  settleReward,
  claimOffline,
  offline,
  install,
  launch,
  finishOrder,
  type Save,
  type Placement,
  type ScreenSnapshot,
} from "./game/model";
import { Engine, estimateRate } from "./game/engine";
import { guideHint, guideStep } from "./game/guide";
import { SaveStore } from "./platform/storage";
import { UnavailableAds, type AdProvider, type AdResult } from "./platform/ads";
import { Renderer } from "./ui/renderer";
import { AudioFeedback } from "./ui/audio";
import { icon, pluginIcon } from "./ui/icons";
import { SHIPS, shipArt, shipIndex } from "./ui/ships";

type Panel = "upgrade" | "research" | "warehouse" | "supply";
const $ = <T extends HTMLElement = HTMLElement>(q: string) =>
  document.querySelector<T>(q)!;
const sprite = (i: number, cls = "") =>
  `<span class="sprite ${cls}" style="background-position:${((i % 4) * 100) / 3}% ${Math.floor(i / 4) * 50}%" aria-hidden="true"></span>`;
const art = (name: string) =>
  name === "power" || name === "magnet"
    ? sprite(5)
    : name === "drones" || name === "swarm"
      ? sprite(6)
      : icon(pluginIcon[name] ?? name);
const adBadge = '<span class="ad-label">广告</span>';
const app = $("#app");
const params = new URLSearchParams(location.search);
const testMode = import.meta.env.DEV && params.get("test") === "1";
const fixture = import.meta.env.DEV ? params.get("fixture") : null;
const captureMode = import.meta.env.DEV && params.get("capture") === "1";
let memoryRaw: string | null = null;
const store = new SaveStore(
  fixture
    ? {
        getItem: () => memoryRaw,
        setItem: (_, v) => {
          memoryRaw = v;
        },
        removeItem: () => {
          memoryRaw = null;
        },
      }
    : {
        getItem: (key: string) => localStorage.getItem(key),
        setItem: (key: string, value: string) =>
          localStorage.setItem(key, value),
        removeItem: (key: string) => localStorage.removeItem(key),
      },
);
let panel: Panel = "upgrade",
  selected: Plugin = "arc",
  maxBuy = false,
  modalOpen = false,
  adBusy = false,
  launching = false,
  hiddenAt = 0;
let currentOffer: { placement: Placement; target?: string } | null = null;
let simulatedResolve: ((r: AdResult) => void) | null = null;
let pendingReceipt: {
  id: string;
  outcome: AdResult;
  placement: Placement;
  screen?: ScreenSnapshot;
} | null = null;
const audio = new AudioFeedback();
let provider: AdProvider = new UnavailableAds();
if (fixture && fixture !== "onboarding") {
  const s = newSave();
  s.wallet = 2480;
  s.upgrades = {
    power: 3,
    range: 1,
    drones: 1,
    value: 2,
    dronePower: 2,
    pulse: 0,
  };
  s.contribution = 1550;
  s.tutorial = { dragged: true, bought: true, researchSeen: true };
  s.guide.done = true;
  s.lifetime.playSeconds = 120;
  s.research = 2;
  s.plugins = {
    arc: 2,
    magnet: 1,
    swarm: 1,
    cutter: 0,
    resonance: 0,
    sorter: 1,
  };
  s.equipped = ["swarm", "magnet"];
  s.crates = [
    { id: "crate-1", chapter: 0 },
    { id: "crate-2", chapter: 0 },
    { id: "crate-3", chapter: 0 },
  ];
  s.nextId = 4;
  s.misses = 1;
  if (fixture === "clear_screen") {
    s.chapter = 3;
    s.parts = 3;
    s.wallet = 8420000;
    s.upgrades = {
      power: 18,
      range: 4,
      drones: 4,
      value: 16,
      dronePower: 17,
      pulse: 3,
    };
    s.contribution = CHAPTERS[3].target * 0.78;
  }
  if (fixture === "research") {
    s.plugins.swarm = 2;
    s.plugins.resonance = 1;
    s.equipped = ["swarm", "resonance"];
    panel = "research";
  }
  if (fixture === "salvage") panel = "warehouse";
  if (fixture === "ending") {
    s.chapter = 4;
    s.parts = 4;
    s.contribution = CHAPTERS[4].target;
    s.upgrades = {
      power: 25,
      range: 5,
      drones: 6,
      value: 25,
      dronePower: 25,
      pulse: 5,
    };
    s.wallet = 1e8;
  }
  if (fixture === "offline") s.offline = { id: "offline-test", amount: 5400 };
  if (fixture === "settlement")
    s.bonus = { id: "settlement-test", amount: 1000 };
  if (/^ship_[0-5]$/.test(fixture)) {
    const stage = Number(fixture.slice(-1));
    s.chapter = Math.min(4, stage);
    s.parts = stage;
    s.contribution = CHAPTERS[s.chapter].target * 0.6;
  }
  if (fixture === "ship_ready") s.contribution = CHAPTERS[0].target;
  store.state = s;
}
const engine = new Engine(store.state, fixture ? 4321 : Date.now());
store.state.referenceRate = estimateRate(store.state);
if (!fixture) offline(store.state);
app.innerHTML = `<main id="game" aria-label="废品飞船">
 <header class="topbar">${icon("core", "brand-mark")}<h1 class="brand">废品飞船</h1><button class="settings" data-action="settings" aria-label="设置">${icon("value")}</button></header>
 <div class="wallet">${icon("coin", "coin")}<strong class="balance" id="balance"></strong><span class="rate" id="rate"></span><button class="wallet-add" data-action="cash" aria-label="资金补给">${icon("plus")}</button></div>
 <section class="ship" aria-label="飞船进度"><div class="chapter"><strong id="chapter-num"></strong><span id="chapter-name"></span></div><div class="progress-info"><span id="part-name"></span><b id="progress"></b></div><div class="progress-track"><div class="progress-fill" id="progress-fill"></div></div><button id="rocket" data-action="hangar" aria-label="飞船外观"></button><button class="ship-action" data-action="install" hidden></button></section>
  <section class="arena" aria-label="拖动磁铁拆解废品"><canvas id="arena" aria-label="回收作业区" tabindex="0"></canvas><span class="pulse-meter" id="pulse-meter"></span><button class="clear-action" data-action="clear_screen">${icon("bolt")}<span id="clear-label">清屏</span>${adBadge}</button></section>
 <section class="upgrades"><header class="upgrade-heading">${icon("upgrade")}<h2>升级</h2><button class="info-button" data-action="upgrade-info" aria-label="升级说明">${icon("info")}</button><button class="buy-mode" data-action="buy-mode" aria-label="切换购买数量">×1 ${icon("arrow")}</button></header><div class="upgrade-grid"></div></section>
 <nav class="nav" aria-label="主菜单">${(["upgrade", "research", "warehouse", "supply"] as Panel[]).map((p, i) => `<button data-nav="${p}" aria-label="${["升级", "研发", "仓库", "补给"][i]}">${icon(p)}<span>${["升级", "研发", "仓库", "补给"][i]}</span><i class="badge" id="badge-${p}" hidden></i></button>`).join("")}</nav>
 <div id="drawer-root"></div><aside id="guide-root" aria-label="新手引导" hidden><div class="guide-ring"></div><div class="guide-card"><span class="guide-step"></span><div class="guide-copy" aria-live="polite"><strong id="guide-title"></strong><p id="guide-detail"></p></div><button class="guide-skip" data-action="guide-skip" aria-label="跳过引导">${icon("close")}</button><button class="guide-next" data-action="guide-next" hidden></button></div></aside><div id="modal-root"></div><div id="launch-root"></div><div class="toast" role="status" aria-live="polite"></div>${testMode ? '<div class="test-banner">开发测试模式，模拟广告不产生收益</div>' : ""}
 </main>`;
const renderer = new Renderer($("#arena"), engine);
const game = $("#game");
function resize() {
  const scale = Math.min(app.clientWidth / 360, app.clientHeight / 640);
  game.style.transform = `translate(-50%,-50%) scale(${scale})`;
  renderer.resize();
}
addEventListener("resize", resize);
resize();
let toastTimer = 0;
function toast(text: string) {
  $(".toast").textContent = text;
  $(".toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(
    () => $(".toast").classList.remove("show"),
    2300,
  );
}
function state() {
  return store.state;
}
function syncMusic() {
  audio.syncMusic(state().settings.music, document.hidden || adBusy);
}
for (const event of ["pointerdown", "keydown"] as const) {
  app.addEventListener(
    event,
    () => {
      audio.unlock(state().settings.music, document.hidden || adBusy);
    },
    { capture: true },
  );
}
function commit<T>(fn: (s: Save) => T, recalculate = true): T | undefined {
  const r = store.transaction(fn);
  if (!r.ok) {
    toast(store.warning);
    return undefined;
  }
  engine.state = store.state;
  if (recalculate) store.state.referenceRate = estimateRate(store.state);
  store.state.lastActiveAt = Date.now();
  store.save();
  renderAll();
  return r.value;
}
function heading(title: string, count: string, help: string) {
  return `<header class="drawer-head"><h2>${title}</h2><span class="drawer-count">${count}</span><button class="info-button" data-action="${help}" aria-label="${title}说明">${icon("info")}</button><button class="close" data-nav="upgrade" aria-label="关闭${title}">${icon("close")}</button></header>`;
}
function renderHeader() {
  const s = state(),
    c = CHAPTERS[s.chapter];
  $("#balance").textContent = fmt(s.wallet);
  $("#rate").textContent = `+${fmt(s.referenceRate)}/s`;
  $("#chapter-num").textContent = s.launched
    ? "∞"
    : String(s.chapter + 1).padStart(2, "0");
  $("#chapter-name").textContent = s.launched ? "星际订单" : c.name;
  const ratio = s.launched
    ? Math.min(1, s.order.progress / s.order.target)
    : s.parts === 5
      ? 1
      : Math.min(1, s.contribution / c.target);
  $("#part-name").textContent = s.launched
    ? ["重型", "能源", "综合"][s.order.kind]
    : c.part;
  $("#progress").textContent = `${Math.floor(ratio * 100)}%`;
  $("#progress-fill").style.width = `${ratio * 100}%`;
  const idx = shipIndex(s);
  const rocket = $("#rocket");
  rocket.setAttribute("aria-label", `飞船外观：${SHIPS[idx].name}`);
  rocket.style.setProperty(
    "--build-cut",
    `${s.parts === 5 ? 0 : (1 - ratio) * 65}%`,
  );
  if (rocket.dataset.idx !== String(idx)) {
    rocket.innerHTML =
      shipArt(idx, "ship-blueprint") +
      shipArt(idx, "ship-built") +
      `<span class="ship-skin-name">${SHIPS[idx].name}</span>`;
    rocket.dataset.idx = String(idx);
  }
  const action = $<HTMLButtonElement>(".ship-action");
  action.hidden = !(ratio >= 1);
  action.textContent = s.launched
    ? "交付订单"
    : s.parts === 5
      ? "发射飞船"
      : "安装" + c.part;
  game.classList.toggle("reduced", s.settings.reduced);
  $("#pulse-meter").textContent = s.upgrades.drones
    ? `脉冲 ${Math.ceil(s.pulse)}s`
    : "";
  renderGuide();
  for (const [p, n] of [
    ["research", s.research],
    ["warehouse", s.crates.length],
    ["supply", s.bonus ? 1 : 0],
  ] as const) {
    const b = $(`#badge-${p}`);
    b.hidden = n === 0;
    b.textContent = n > 99 ? "99+" : String(n);
  }
  for (const k of UPGRADES) {
    const button = $<HTMLButtonElement>(`[data-buy="${k}"]`);
    if (!button) continue;
    const priceTag = button.querySelector<HTMLElement>(".cost")!;
    const priceLabel = button.querySelector<HTMLElement>(".cost-value")!;
    const price = cost(s, k),
      capped = !Number.isFinite(price);
    priceTag.classList.toggle("unaffordable", s.wallet < price && !capped);
    priceTag.classList.toggle("capped", capped);
    button.disabled =
      capped ||
      ((k === "pulse" || k === "dronePower") && s.upgrades.drones === 0);
    const priceText = capped ? "已满" : fmt(price);
    if (priceLabel.textContent !== priceText)
      priceLabel.textContent = priceText;
    priceTag.querySelector<SVGElement>(".icon")!.style.display = capped
      ? "none"
      : "";
    const label = $(`[data-level="${k}"]`);
    const levelText =
      k === "drones" ? `${s.upgrades[k]}/6` : String(s.upgrades[k]);
    if (label.textContent !== levelText) label.textContent = levelText;
  }
}
function renderGuide() {
  const s = state(),
    root = $("#guide-root");
  root.hidden =
    s.guide.done ||
    modalOpen ||
    adBusy ||
    launching ||
    (s.guide.step < 3 && panel !== "upgrade");
  if (root.hidden) return;
  const step = guideStep(s);
  if (s.guide.step !== step) {
    s.guide.step = step;
    store.save();
  }
  const hint = guideHint(s);
  const text = (selector: string, value: string) => {
    const el = $(selector);
    if (el.textContent !== value) el.textContent = value;
  };
  text(".guide-step", `${step + 1}/7`);
  text("#guide-title", hint.title);
  text("#guide-detail", hint.detail);
  root.dataset.step = String(step);
  const next = $<HTMLButtonElement>(".guide-next");
  next.hidden = step !== 4 && step !== 6;
  text(".guide-next", step === 6 ? "出发" : "记住了");
  const target = document.querySelector<HTMLElement>(hint.target);
  const ring = $(".guide-ring");
  ring.hidden = !target;
  if (target) {
    const rect = target.getBoundingClientRect(),
      box = game.getBoundingClientRect();
    const scale = box.width / 360;
    ring.style.left = `${(rect.left - box.left) / scale - 2}px`;
    ring.style.top = `${(rect.top - box.top) / scale - 2}px`;
    ring.style.width = `${rect.width / scale + 4}px`;
    ring.style.height = `${rect.height / scale + 4}px`;
  }
}
function renderUpgrades() {
  // Keep each clickable element mounted across HUD refreshes and purchases.
  if ($(".upgrade-grid").childElementCount) return;
  $(".upgrade-grid").innerHTML = UPGRADES.map(
    (k) =>
      `<button class="upgrade-card" data-buy="${k}" aria-label="升级${UPGRADE_NAMES[k]}"><span class="upgrade-art">${art(k === "dronePower" ? "drones" : k === "pulse" ? "bolt" : k)}</span><span class="upgrade-text">${UPGRADE_NAMES[k]}<small data-level="${k}"></small></span><span class="cost">${icon("coin")}<span class="cost-value"></span></span></button>`,
  ).join("");
}
function renderResearch() {
  const s = state(),
    pool = candidates(s),
    p = pool.length ? (100 / pool.length).toFixed(2) : "0.00";
  const equipped = s.equipped.includes(selected),
    owned = s.plugins[selected] > 0;
  const canEquip = owned && (equipped || s.equipped.length < 3);
  const equipLabel = equipped
    ? `已装配${PLUGIN_NAMES[selected]}`
    : owned
      ? canEquip
        ? `装配${PLUGIN_NAMES[selected]}`
        : "插槽已满"
      : `尚未获得${PLUGIN_NAMES[selected]}`;
  const equipHint = equipped
    ? "点击卸下"
    : !owned
      ? "先研发解锁此插件"
      : canEquip
        ? `剩余插槽 ${3 - s.equipped.length}/3`
        : "先点上方插件卸下";
  const equipButton = `<button class="research-preview ${equipped ? "is-equipped" : ""}" data-equip="${selected}" aria-label="${equipped ? "卸下" : "装配"}${PLUGIN_NAMES[selected]}" ${canEquip ? "" : "disabled"}>${icon(equipped ? "check" : "plus")}<span class="equip-label">${equipLabel}<small>${equipHint}</small></span>${icon(equipped ? "check" : "arrow", "equip-direction")}</button>`;
  return `<section class="drawer research-drawer">${heading("研发", icon("research") + " ×" + s.research, "research-info")}<div class="equip-slots">${Array.from(
    { length: 3 },
    (_, i) => {
      const k = s.equipped[i];
      return `<button class="equip-slot" ${k ? `data-equip="${k}" aria-label="卸下${PLUGIN_NAMES[k]}"` : 'data-action="equip-help" aria-label="空插槽"'}>${k ? art(k) + `<span class="level">Lv.${s.plugins[k]}</span>` : icon("plus")}</button>`;
    },
  ).join(
    "",
  )}</div><div class="research-grid">${PLUGINS.map((k) => `<button class="plugin-card ${selected === k ? "selected" : ""}" data-select="${k}" aria-label="选择${PLUGIN_NAMES[k]}"><span class="plugin-art">${art(k)}</span><span><strong>${PLUGIN_NAMES[k]}</strong><p>${s.plugins[k]} → ${Math.min(5, s.plugins[k] + 1)}</p><small>${s.plugins[k] === 5 ? "MAX" : p + "%"}</small></span>${selected === k ? '<i class="selected-check">' + icon("check") + "</i>" : ""}</button>`).join("")}</div>${equipButton}<div class="research-actions"><button class="big-button" data-action="research" ${s.research < 1 ? "disabled" : ""}>${pool.length ? "随机" : "兑换资金"}<small>${pool.length ? p + "%" : "+" + fmt(CHAPTERS[s.chapter].bonus)}</small></button><button class="big-button gold" data-action="research-ad" ${s.research < 1 || s.plugins[selected] === 5 ? "disabled" : ""}>必得${PLUGIN_NAMES[selected]}<small>100.00%</small>${adBadge}</button></div><p class="footnote">完整观看后获得</p></section>`;
}
function renderWarehouse() {
  const s = state(),
    crate = s.crates[0],
    comp = CHAPTERS[crate?.chapter ?? s.chapter].compensation,
    guaranteed = s.misses === 3;
  return `<section class="drawer">${heading("拆解", sprite(3) + " ×" + s.crates.length, "salvage-info")}<div class="drawer-body">${crate ? `<div class="crate-stage">${sprite(3)}<div class="pity"><div class="pity-dots">${[0, 1, 2].map((i) => `<i class="${i < s.misses ? "on" : ""}"></i>`).join("")}</div>${guaranteed ? "本次普通必得" : "保底 " + s.misses + "/3"}</div></div><div class="salvage-choices"><div class="salvage-card"><h3>普通</h3><div class="salvage-reward">${sprite(4)}<div><strong>${guaranteed ? "100.00%" : "35.00%"}</strong><small>核心 ×1</small></div></div><div class="compensation">${guaranteed ? "保底已生效" : icon("coin") + "65.00% <b>+" + fmt(comp) + "</b>"}</div><button class="big-button cyan" data-action="salvage">拆解</button></div><div class="salvage-card gold-border"><h3>${guaranteed ? "保底就绪" : "精密"}</h3><div class="salvage-reward">${sprite(4)}<div><strong>100.00%</strong><small>核心 ×1</small></div></div><div class="compensation"></div>${guaranteed ? '<button class="big-button secondary" data-action="salvage">普通必得</button>' : `<button class="big-button gold" data-action="salvage-ad">必得核心${adBadge}</button>`}</div></div><p class="salvage-note">完整观看后领取，未完成不消耗</p>` : `<div class="empty-state">${icon("warehouse")}每回收 20 台机器获得机匣<br><small>当前进度 ${s.lifetime.machines % 20}/20</small></div>`}<div class="core-section"><div class="section-row"><span>永久强化</span><strong>${icon("core")} ${s.cores}</strong></div>${(["hand", "drone"] as const).map((k) => `<div class="core-upgrade">${icon(k === "hand" ? "power" : "drones")}<span>${k === "hand" ? "磁铁" : "无人机"} ${s.coreLevels[k]}/10<small>每级伤害 +8%</small></span><button data-core="${k}" ${s.coreLevels[k] >= 10 ? "disabled" : ""}>${s.coreLevels[k] >= 10 ? "已满" : icon("core") + " " + (1 + Math.floor(s.coreLevels[k] / 2))}</button></div>`).join("")}</div></div></section>`;
}
function renderSupply() {
  const s = state();
  return `<section class="drawer">${heading("补给", icon("supply"), "ads-info")}<div class="drawer-body"><div class="supply-list"><div class="supply-card">${icon("coin")}<div><h3>资金补给</h3><p>90 秒参考产能</p><strong>+${fmt(Math.max(90, Math.round(s.referenceRate * 90)))}</strong></div><button class="big-button gold" data-action="cash">领取资金${adBadge}</button></div><div class="supply-card">${icon("bolt")}<div><h3>清屏</h3><p>回收当前全部废品</p><strong>${engine.junk.length} 件</strong></div><button class="big-button gold" data-action="clear_screen">一键清屏${adBadge}</button></div>${s.bonus ? `<div class="supply-card">${icon("trophy")}<div><h3>航程奖励</h3><p>本次追加</p><strong>+${fmt(s.bonus.amount)}</strong></div><button class="big-button gold" data-action="bonus">领取奖励${adBadge}</button></div>` : ""}<div class="supply-card">${icon("research")}<div><h3>定向研发</h3><p>选中插件，100% 提升</p></div><button class="big-button" data-nav="research">前往</button></div><div class="supply-card">${icon("warehouse")}<div><h3>精密拆解</h3><p>35% → 100% 获得核心</p></div><button class="big-button" data-nav="warehouse">前往</button></div></div><p class="supply-tip">广告由你主动选择<br>完整观看才发奖，正常玩法始终可用</p></div></section>`;
}
function renderPanel() {
  game.classList.toggle("research-open", panel === "research");
  const root = $("#drawer-root");
  const scroll = root.querySelector(".drawer-body")?.scrollTop ?? 0;
  root.innerHTML =
    panel === "research"
      ? renderResearch()
      : panel === "warehouse"
        ? renderWarehouse()
        : panel === "supply"
          ? renderSupply()
          : "";
  const body = root.querySelector(".drawer-body");
  if (body) body.scrollTop = scroll;
  document
    .querySelectorAll("[data-nav]")
    .forEach((n) =>
      n.classList.toggle("active", n.getAttribute("data-nav") === panel),
    );
  renderGuide();
}
function renderAll() {
  renderUpgrades();
  renderHeader();
  renderPanel();
}
function showModal(title: string, body: string, close = true) {
  modalOpen = true;
  $("#guide-root").hidden = true;
  engine.magnet.active = false;
  $("#modal-root").innerHTML =
    `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="${title}"><h2>${title}${close ? `<button class="close" data-action="close-modal" aria-label="关闭">${icon("close")}</button>` : ""}</h2>${body}</section></div>`;
}
function closeModal() {
  if (adBusy) return;
  modalOpen = false;
  currentOffer = null;
  $("#modal-root").innerHTML = "";
  renderGuide();
}
function help(title: string, lines: string[]) {
  showModal(
    title,
    lines.map((x) => `<p>${x}</p>`).join("") +
      '<button class="big-button cyan" data-action="close-modal">知道了</button>',
  );
}
function showOffline() {
  const o = state().offline;
  if (!o) return;
  showModal(
    "离线回收",
    icon("coin", "reward-icon") +
      `<div class="big-number">+${fmt(o.amount)}</div><p style="text-align:center">最多 2 小时，自动产能的 25%</p><button class="big-button gold" data-action="offline-ad">双倍领取 +${fmt(o.amount * 2)}${adBadge}</button><button class="big-button secondary" data-action="offline-claim">普通领取 +${fmt(o.amount)}</button>`,
    false,
  );
}
function offer(placement: Placement, target?: string) {
  const s = state();
  if (adBusy) return;
  if (!adsUnlocked(s)) {
    toast(
      s.lifetime.playSeconds < 60
        ? "完成教学并作业满 60 秒后开放广告"
        : "先完成拖动和首次升级",
    );
    return;
  }
  if (placement === "clear_screen" && engine.junk.length === 0) {
    toast("当前没有废品，稍后再清屏");
    return;
  }
  currentOffer = { placement, target };
  const amount = Math.max(90, Math.round(s.referenceRate * 90));
  const title = {
    cash_supply: "资金补给",
    clear_screen: "清屏",
    precision_salvage: "精密拆解",
    targeted_research: "定向研发",
    offline_double: "离线翻倍",
    settlement_bonus: "航程奖励",
  }[placement];
  const reward =
    placement === "cash_supply"
      ? `+${fmt(amount)}`
      : placement === "clear_screen"
        ? `${engine.junk.length} 件`
        : placement === "precision_salvage"
          ? "核心 ×1"
          : placement === "targeted_research"
            ? PLUGIN_NAMES[target as Plugin] + " +1"
            : placement === "offline_double"
              ? `+${fmt((s.offline?.amount ?? 0) * 2)}`
              : `+${fmt(s.bonus?.amount ?? 0)}`;
  const desc =
    placement === "clear_screen"
      ? `完整观看后清空当前屏幕，获得约 ${fmt(engine.captureScreen().items.reduce((sum, j) => sum + j.value, 0))} 资金。计入回收、研发和机匣进度。`
      : placement === "precision_salvage"
        ? "100% 获得核心，消耗 1 个机匣。"
        : placement === "targeted_research"
          ? "100% 获得所选插件，消耗 1 次研发机会。"
          : "完整观看后获得以上资金。";
  showModal(
    title,
    icon(
      placement === "clear_screen"
        ? "bolt"
        : placement === "targeted_research"
          ? "research"
          : placement === "precision_salvage"
            ? "core"
            : "coin",
      "reward-icon",
    ) +
      `<div class="big-number">${reward}</div><p>${desc}</p><p>未完整观看不消耗资源。</p><button class="big-button gold" data-action="watch-ad">看广告领取${adBadge}</button><button class="big-button secondary" data-action="${placement === "offline_double" ? "offline-return" : "close-modal"}">稍后</button>`,
  );
}
async function watchAd() {
  if (!currentOffer || adBusy) return;
  const request = { ...currentOffer };
  const r = commit(
    (s) =>
      prepareReward(
        s,
        request.placement,
        request.target,
        Date.now(),
        request.placement === "clear_screen"
          ? engine.captureScreen()
          : undefined,
      ),
    false,
  );
  if (!r) {
    toast("当前奖励条件已变化");
    return;
  }
  adBusy = true;
  audio.pause();
  let outcome: AdResult = "unavailable";
  if (testMode) {
    showModal(
      "测试广告",
      `<p>仅验证流程，不产生广告收益。</p><div class="ad-test-options">${[
        ["completed", "完整观看"],
        ["cancelled", "提前关闭"],
        ["unavailable", "暂无广告"],
        ["error", "播放错误"],
      ]
        .map(
          ([v, t]) =>
            `<button class="big-button" data-test-result="${v}">${t}</button>`,
        )
        .join("")}</div>`,
      false,
    );
    outcome = await new Promise<AdResult>((resolve) => {
      simulatedResolve = resolve;
    });
  } else {
    showModal("广告加载中", "<p>正在连接广告服务</p>", false);
    try {
      outcome = await provider.show();
    } catch {
      outcome = "error";
    }
  }
  pendingReceipt = {
    id: r.id,
    outcome,
    placement: request.placement,
    screen: r.screen,
  };
  finishReceipt();
}
function finishReceipt() {
  if (!pendingReceipt) return;
  const { id, outcome, placement, screen } = pendingReceipt;
  const applied = commit(
    (s) => settleReward(s, id, outcome === "completed"),
    true,
  );
  adBusy = false;
  syncMusic();
  if (applied === undefined) {
    showModal(
      "存档未保存",
      '<p>存储空间暂不可用。奖励记录仍保留在当前页面，请释放浏览器存储空间后重试。</p><button class="big-button cyan" data-action="retry-reward">重试保存</button>',
      false,
    );
    return;
  }
  pendingReceipt = null;
  closeModal();
  if (applied) {
    if (screen) {
      engine.removeCleared(screen);
      renderer.add(engine.events);
    }
    toast(screen ? `已清屏，回收 ${screen.items.length} 件` : "奖励已到账");
    audio.play("reward", state().settings.sound);
  } else
    toast(
      outcome === "cancelled"
        ? "未完成观看，资源已保留"
        : outcome === "unavailable"
          ? "暂无可用广告，继续回收吧"
          : "广告未能播放，资源已保留",
    );
  if (placement === "offline_double" && state().offline) showOffline();
}
function launchScene() {
  launching = true;
  engine.magnet.active = false;
  $("#launch-root").innerHTML =
    `<section class="launch-scene"><h2>起航</h2><p>从废品堆，到星辰之间</p>${shipArt(5)}<div class="flight-record" hidden><div><small>作业时间</small><strong>${time(state().lifetime.playSeconds)}</strong></div><div><small>回收数量</small><strong>${fmt(state().lifetime.scrap)}</strong></div><div><small>广告奖励</small><strong>${state().lifetime.ads}</strong></div><div class="flight-plugins">${state()
      .equipped.map(
        (p) => `<span>${art(p)}<small>Lv.${state().plugins[p]}</small></span>`,
      )
      .join(
        "",
      )}</div></div><button class="big-button cyan" data-action="finish-launch" disabled>航程记录中</button></section>`;
  setTimeout(
    () => {
      const b = $<HTMLButtonElement>('[data-action="finish-launch"]');
      if (b) {
        b.disabled = false;
        b.textContent = "开启星际订单";
        $(".flight-record").hidden = false;
        $<HTMLElement>(".launch-scene>.ship-art").style.opacity = "0";
      }
    },
    state().settings.reduced ? 1500 : 12000,
  );
}
function navigate(p: Panel) {
  if (adBusy || launching) return;
  closeModal();
  panel = p;
  engine.magnet.active = false;
  const step = state().guide.step;
  if (
    !state().guide.done &&
    ((step === 3 && p === "research") || (step === 5 && p === "warehouse"))
  ) {
    commit((s) => {
      s.guide.step++;
    }, false);
    return;
  }
  renderPanel();
}
app.addEventListener("click", (event) => {
  const b = (event.target as Element).closest<HTMLButtonElement>("button");
  if (!b || b.disabled) return;
  const test = b.dataset.testResult;
  if (test && testMode && simulatedResolve) {
    const done = simulatedResolve;
    simulatedResolve = null;
    done(test as AdResult);
    return;
  }
  if (adBusy) return;
  if (pendingReceipt) {
    if (b.dataset.action === "retry-reward") finishReceipt();
    return;
  }
  if (b.dataset.nav) {
    navigate(b.dataset.nav as Panel);
    return;
  }
  if (b.dataset.buy) {
    const k = b.dataset.buy as Upgrade;
    if (state().wallet < cost(state(), k)) {
      toast(`还差 ${fmt(cost(state(), k) - state().wallet)}，可从资金补给获得`);
      offer("cash_supply");
      return;
    }
    const n = commit((s) => buy(s, k, maxBuy));
    if (n) {
      audio.play("buy", state().settings.sound);
      toast(`${UPGRADE_NAMES[k]} +${n}`);
    }
    return;
  }
  if (b.dataset.select) {
    selected = b.dataset.select as Plugin;
    renderPanel();
    return;
  }
  if (b.dataset.equip) {
    const k = b.dataset.equip as Plugin;
    const n = commit((s) => equip(s, k));
    if (!n)
      toast(
        state().plugins[k] === 0
          ? "研发后即可装配"
          : "三个插槽已满，先卸下一项",
      );
    return;
  }
  if (b.dataset.core) {
    const ok = commit((s) =>
      coreUpgrade(s, b.dataset.core as "hand" | "drone"),
    );
    toast(ok ? "永久伤害已提升" : "核心不足");
    return;
  }
  switch (b.dataset.action) {
    case "hangar": {
      const current = shipIndex(state());
      showModal(
        "飞船图鉴",
        `<div class="hangar-grid">${SHIPS.map((s, i) => `<div class="hangar-ship ${i === current ? "current" : i > current ? "locked" : ""}">${shipArt(i)}<strong>${s.name}</strong><small>${i === current ? "当前外观" : i > current ? (i === 5 ? "完成五章解锁" : `第 ${i + 1} 章解锁`) : "已解锁"}</small></div>`).join("")}</div>`,
      );
      break;
    }
    case "guide-skip":
      commit((s) => {
        s.guide.done = true;
      }, false);
      toast("可在设置中重看引导");
      break;
    case "guide-next":
      if (state().guide.step === 4)
        commit((s) => {
          s.guide.step = 5;
        }, false);
      else if (state().guide.step === 6) {
        commit((s) => {
          s.guide.done = true;
        }, false);
        navigate("upgrade");
      }
      break;
    case "guide-replay":
      commit((s) => {
        s.guide = { step: 0, done: false };
      }, false);
      navigate("upgrade");
      break;
    case "close-modal":
      closeModal();
      break;
    case "cash":
      offer("cash_supply");
      break;
    case "clear_screen":
      offer("clear_screen");
      break;
    case "bonus":
      offer("settlement_bonus");
      break;
    case "watch-ad":
      void watchAd();
      break;
    case "buy-mode":
      maxBuy = !maxBuy;
      b.innerHTML = (maxBuy ? "MAX" : "×1") + " " + icon("arrow");
      break;
    case "research": {
      const result = commit((s) => research(s, Math.random));
      if (result) {
        toast(result === "cash" ? "已兑换资金" : PLUGIN_NAMES[result] + " +1");
        audio.play("reward", state().settings.sound);
      }
      break;
    }
    case "research-ad":
      offer("targeted_research", selected);
      break;
    case "salvage": {
      const r = commit((s) => salvage(s, Math.random));
      toast(r === "core" ? "能源核心 +1" : "拆解资金已到账");
      audio.play("reward", state().settings.sound);
      break;
    }
    case "salvage-ad":
      offer("precision_salvage", state().crates[0]?.id);
      break;
    case "offline-ad":
      offer("offline_double");
      break;
    case "offline-return":
      showOffline();
      break;
    case "offline-claim":
      commit((s) => claimOffline(s), false);
      closeModal();
      toast("离线资金已到账");
      break;
    case "install": {
      if (state().launched) {
        if (commit((s) => finishOrder(s))) {
          toast("订单完成，回收价值已提升");
          navigate("supply");
        }
      } else if (state().parts === 5) {
        if (commit((s) => launch(s))) launchScene();
      } else {
        const part = CHAPTERS[state().chapter].part;
        if (commit((s) => install(s))) {
          engine.reset();
          showModal(
            "部件完成",
            shipArt(shipIndex(state()), "reward-ship") +
              `<div class="big-number">${part}</div><p>飞船部件 ${state().parts}/5<br>解锁${SHIPS[shipIndex(state())].name}</p><button class="big-button cyan" data-action="close-modal">${state().parts === 5 ? "准备发射" : "继续回收"}</button><button class="big-button gold" data-action="bonus">追加 +${fmt(state().bonus?.amount ?? 0)}${adBadge}</button>`,
          );
        }
      }
      break;
    }
    case "finish-launch":
      launching = false;
      $("#launch-root").innerHTML = "";
      toast("星际订单已开启");
      renderAll();
      break;
    case "upgrade-info":
      help(
        "设备升级",
        UPGRADES.map((k) => `${UPGRADE_NAMES[k]}：${UPGRADE_INFO[k]}`).concat(
          "向上滑动升级区可查看机能和脉冲。MAX 会购买当前可负担等级。",
        ),
      );
      break;
    case "research-info":
      help("研发与装配", [
        "每回收 80 件废品获得 1 次研发机会。",
        "随机研发均匀选取未满级插件。重复插件升级，最高 5 级。",
        "最多装配 3 个插件。点击上方插槽卸下，选中插件后点击目标栏装配。",
        ...PLUGINS.map((k) => PLUGIN_NAMES[k] + "：" + PLUGIN_INFO[k]),
      ]);
      break;
    case "equip-help":
      toast("选择已获得的插件，点击下方目标栏装配");
      break;
    case "salvage-info":
      help("机匣拆解", [
        "每回收 20 台机器获得 1 个机匣。",
        "普通拆解 35% 获得核心，65% 获得资金。连续失败 3 次后，下次普通必得。",
        "精密拆解完整观看广告后必得核心，不改变普通保底。未完成不消耗机匣。",
        "核心可用于下方永久强化。向上滑动即可查看。",
      ]);
      break;
    case "ads-info":
      help("自愿补给", [
        "资金和清屏可重复领取，每次均由你主动点击。",
        "只有完整观看广告才发奖。无广告、加载失败或中途退出均不消耗资源。",
        "无需观看广告也可完成全部飞船和长期订单。",
      ]);
      break;
    case "settings":
      settings();
      break;
    case "sound":
      commit((s) => {
        s.settings.sound = !s.settings.sound;
      }, false);
      settings();
      break;
    case "music":
      commit((s) => {
        s.settings.music = !s.settings.music;
      }, false);
      syncMusic();
      settings();
      break;
    case "credits":
      showModal(
        "素材鸣谢",
        '<p>字体基于 ChillType 寒蝉全圆体，采用 SIL OFL 1.1。游戏字符子集另命名为 Scrap Round。</p><p>音乐 Outer Space Loop<br>wipics，CC0 1.0</p><p>均允许免费用于本游戏。</p><p><a href="https://github.com/Warren2060/ChillRound" target="_blank" rel="noopener noreferrer">字体来源</a> / <a href="https://opengameart.org/content/outer-space-loop" target="_blank" rel="noopener noreferrer">音乐来源</a></p><button class="big-button cyan" data-action="settings">返回设置</button>',
      );
      break;
    case "reduced":
      commit((s) => {
        s.settings.reduced = !s.settings.reduced;
      }, false);
      settings();
      break;
    case "help":
      help("回收指南", [
        "拖动磁铁拆解废品，购买无人机获得自动产能。",
        "废品回收推进飞船建设，进度达到 100% 后点击安装。五个部件完成后可以发射。",
        "研发插件与核心强化可以永久提升能力。广告资金本身不会直接推进建设。",
        "作业区支持触摸、鼠标，也可用方向键移动，按住空格拆解。",
      ]);
      break;
    case "reset":
      showModal(
        "重新开始",
        '<p>将清空此设备的航程、设备和插件。此操作无法撤销。</p><button class="big-button gold" data-action="reset-confirm">确认重新开始</button><button class="big-button secondary" data-action="close-modal">保留航程</button>',
      );
      break;
    case "reset-confirm":
      if (store.reset()) {
        engine.state = state();
        engine.reset();
        closeModal();
        panel = "upgrade";
        state().referenceRate = estimateRate(state());
        syncMusic();
        renderAll();
        toast("新的航程开始了");
      } else toast(store.warning);
      break;
  }
});
function settings() {
  const s = state();
  showModal(
    "设置",
    `<div class="setting-row"><span>音乐</span><button class="toggle" data-action="music" aria-label="背景音乐" aria-pressed="${s.settings.music}">${s.settings.music ? "开启" : "关闭"}</button></div><div class="setting-row"><span>音效</span><button class="toggle" data-action="sound">${s.settings.sound ? "开启" : "关闭"}</button></div><div class="setting-row"><span>减少特效</span><button class="toggle" data-action="reduced">${s.settings.reduced ? "开启" : "关闭"}</button></div><div class="settings-links"><button class="big-button secondary" data-action="guide-replay">新手引导</button><button class="big-button secondary" data-action="help">回收指南</button></div><button class="credits-link" data-action="credits">素材鸣谢</button><p>已回收 ${fmt(s.lifetime.scrap)} 件<br>有效作业 ${time(s.lifetime.playSeconds)}</p><button class="big-button secondary" data-action="reset">重新开始</button><p style="text-align:center;font-size:9px">废品飞船 v0.1.0<br>存档保存在当前设备</p>`,
  );
}
const canvas = $<HTMLCanvasElement>("#arena");
const point = (event: PointerEvent) => {
  const r = canvas.getBoundingClientRect();
  engine.magnet.x = Math.max(
    12,
    Math.min(338, ((event.clientX - r.left) / r.width) * 350),
  );
  engine.magnet.y = Math.max(
    12,
    Math.min(228, ((event.clientY - r.top) / r.height) * 240),
  );
};
canvas.addEventListener("pointerdown", (e) => {
  if (panel !== "upgrade" || modalOpen || adBusy || launching) return;
  point(e);
  engine.magnet.active = true;
  canvas.setPointerCapture(e.pointerId);
  audio.play("pickup", state().settings.sound);
  e.preventDefault();
});
canvas.addEventListener("pointermove", (e) => {
  if (!engine.magnet.active) return;
  const r = canvas.getBoundingClientRect();
  if (
    e.clientX < r.left ||
    e.clientX > r.right ||
    e.clientY < r.top ||
    e.clientY > r.bottom
  ) {
    engine.magnet.active = false;
    return;
  }
  point(e);
});
for (const event of [
  "pointerup",
  "pointercancel",
  "lostpointercapture",
  "blur",
])
  canvas.addEventListener(event, () => {
    engine.magnet.active = false;
  });
canvas.addEventListener("keydown", (e) => {
  if (panel !== "upgrade" || modalOpen) return;
  if (
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
  ) {
    e.preventDefault();
    if (e.key === " ") engine.magnet.active = true;
    else {
      engine.magnet.x = Math.max(
        12,
        Math.min(
          338,
          engine.magnet.x +
            (e.key === "ArrowRight" ? 12 : e.key === "ArrowLeft" ? -12 : 0),
        ),
      );
      engine.magnet.y = Math.max(
        12,
        Math.min(
          228,
          engine.magnet.y +
            (e.key === "ArrowDown" ? 12 : e.key === "ArrowUp" ? -12 : 0),
        ),
      );
    }
  }
});
canvas.addEventListener("keyup", (e) => {
  if (e.key === " ") engine.magnet.active = false;
});
addEventListener("blur", () => {
  engine.magnet.active = false;
});
function saveNow() {
  state().lastActiveAt = Date.now();
  store.save();
}
addEventListener("pagehide", () => {
  saveNow();
  audio.pause();
});
addEventListener("pageshow", syncMusic);
document.addEventListener("visibilitychange", () => {
  engine.magnet.active = false;
  if (document.hidden) {
    hiddenAt = Date.now();
    saveNow();
    audio.pause();
  } else {
    if (hiddenAt && !adBusy) {
      commit((s) => offline(s), false);
      if (state().offline) showOffline();
    } else state().lastActiveAt = Date.now();
    hiddenAt = 0;
    previous = performance.now();
    accumulator = 0;
    syncMusic();
  }
});
let previous = performance.now(),
  accumulator = 0,
  uiClock = 0,
  saveClock = 0;
const frameTimes: number[] = [];
let capturesElapsed = 0;
function frame(now: number) {
  const rawDelta = Math.max(0, (now - previous) / 1000),
    delta = Math.min(0.25, rawDelta);
  previous = now;
  capturesElapsed += delta;
  const captureFrozen = captureMode && capturesElapsed >= 1;
  const paused =
    document.hidden ||
    panel !== "upgrade" ||
    modalOpen ||
    adBusy ||
    launching ||
    captureFrozen;
  if (!paused) {
    accumulator += delta;
    while (accumulator >= 0.05) {
      engine.tick(0.05);
      renderer.add(engine.events);
      if (engine.events.some((x) => x.kind === "pickup"))
        audio.play("pickup", state().settings.sound);
      if (
        engine.events.some((x) => x.kind === "research" || x.kind === "crate")
      ) {
        toast(
          engine.events.some((x) => x.kind === "crate")
            ? "机匣 +1"
            : "研发机会 +1",
        );
        saveNow();
      }
      accumulator -= 0.05;
    }
  } else accumulator = 0;
  renderer.draw(document.hidden || captureFrozen ? 0 : delta);
  uiClock += delta;
  saveClock += delta;
  if (uiClock >= 0.2) {
    renderHeader();
    uiClock = 0;
  }
  if (saveClock >= 5 && !document.hidden) {
    saveNow();
    saveClock = 0;
  }
  if (import.meta.env.DEV && !document.hidden) {
    frameTimes.push(rawDelta * 1000);
    if (frameTimes.length > 600) frameTimes.shift();
    if (testMode) {
      const sorted = [...frameTimes].sort((a, b) => a - b);
      game.dataset.diagnostics = JSON.stringify({
        frames: frameTimes.length,
        p95: sorted[Math.floor(sorted.length * 0.95)]?.toFixed(2),
        entities: engine.junk.length,
        drones: engine.droneTargets.length,
        effects: renderer.effectCount,
        playSeconds: Math.round(state().lifetime.playSeconds),
        wallet: state().wallet,
        chapter: state().chapter,
        pending: !!state().pending,
        settled: state().lifetime.ads,
        heap: (
          performance as Performance & { memory?: { usedJSHeapSize: number } }
        ).memory?.usedJSHeapSize,
      });
    }
  }
  requestAnimationFrame(frame);
}
renderAll();
store.save();
if (state().offline) showOffline();
if (store.warning) toast(store.warning);
requestAnimationFrame(frame);
