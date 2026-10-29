export type Upgrade =
  | "power"
  | "range"
  | "drones"
  | "dronePower"
  | "value"
  | "pulse";
export type Plugin =
  | "arc"
  | "magnet"
  | "swarm"
  | "cutter"
  | "resonance"
  | "sorter";
export const UPGRADES: Upgrade[] = [
  "power",
  "range",
  "drones",
  "value",
  "dronePower",
  "pulse",
];
export const PLUGINS: Plugin[] = [
  "arc",
  "magnet",
  "swarm",
  "cutter",
  "resonance",
  "sorter",
];
export const UPGRADE_NAMES: Record<Upgrade, string> = {
  power: "磁力",
  range: "范围",
  drones: "无人机",
  dronePower: "机能",
  value: "收益",
  pulse: "脉冲",
};
export const PLUGIN_NAMES: Record<Plugin, string> = {
  arc: "电弧",
  magnet: "强磁",
  swarm: "机群",
  cutter: "切割",
  resonance: "共振",
  sorter: "分拣",
};
export const PLUGIN_INFO: Record<Plugin, string> = {
  arc: "脉冲每级增加 1 个目标",
  magnet: "磁场每级扩大 4%",
  swarm: "无人机攻速每级增加 6%",
  cutter: "对机器伤害每级增加 12%",
  resonance: "电池爆炸范围每级扩大 6%",
  sorter: "回收价值每级增加 4%",
};
export const UPGRADE_INFO: Record<Upgrade, string> = {
  power: "每级拆解伤害提高 25%",
  range: "扩大磁场，2级和4级增加同时拆解目标",
  drones: "自动拆解废品，最多6台",
  dronePower: "每级无人机伤害提高 22%",
  value: "每级回收价值提高 15%",
  pulse: "每级缩短自动脉冲周期2秒",
};
export const CHAPTERS = [
  {
    name: "废品堆",
    full: "巷口废品堆",
    part: "骨架",
    hp: 1,
    value: 1,
    target: 2500,
    cap: 5,
    drones: 1,
    weights: [0.7, 0.2, 0.1],
    bonus: 1000,
    compensation: 800,
  },
  {
    name: "家电区",
    full: "家电回收区",
    part: "船舱",
    hp: 3,
    value: 6,
    target: 75000,
    cap: 10,
    drones: 2,
    weights: [0.65, 0.25, 0.1],
    bonus: 10000,
    compensation: 4800,
  },
  {
    name: "旧工厂",
    full: "废弃工厂",
    part: "引擎",
    hp: 9,
    value: 36,
    target: 3000000,
    cap: 15,
    drones: 3,
    weights: [0.55, 0.3, 0.15],
    bonus: 120000,
    compensation: 28800,
  },
  {
    name: "残骸场",
    full: "航空残骸场",
    part: "导航",
    hp: 27,
    value: 216,
    target: 100000000,
    cap: 20,
    drones: 4,
    weights: [0.45, 0.4, 0.15],
    bonus: 1500000,
    compensation: 172800,
  },
  {
    name: "坠落区",
    full: "神秘坠落区",
    part: "核心",
    hp: 81,
    value: 1296,
    target: 3300000000,
    cap: 25,
    drones: 6,
    weights: [0.4, 0.4, 0.2],
    bonus: 20000000,
    compensation: 1036800,
  },
] as const;
export const DRONE_COSTS = [120, 480, 2400, 18000, 160000, 1600000];
export const MAX_MONEY = 1e14;
export const fmt = (n: number) => {
  if (!Number.isFinite(n)) return "0";
  for (const [v, s] of [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ] as const)
    if (n >= v)
      return `${(n / v).toFixed(n / v < 10 ? 2 : 1).replace(/\.?0+$/, "")}${s}`;
  return Math.floor(n).toLocaleString("en-US");
};
export const time = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(s % 60)
    .toString()
    .padStart(2, "0")}`;
