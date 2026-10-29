import { type Save } from "../game/model";

export const SHIPS = [
  { name: "回收艇", description: "锈黄框架，拼装舱体" },
  { name: "货运艇", description: "青白装甲，双侧货舱" },
  { name: "采矿舰", description: "橙色重甲，双钻探臂" },
  { name: "探索舰", description: "蓝白机翼，远航雷达" },
  { name: "星环舰", description: "紫银舰体，环形核心" },
  { name: "曙光号", description: "金白旗舰，四组引擎" },
] as const;

export const shipIndex = (s: Save) => (s.parts === 5 ? 5 : s.chapter);
export const shipArt = (index: number, cls = "") =>
  `<span class="ship-art ${cls}" style="background-position:${(index % 3) * 50}% ${Math.floor(index / 3) * 100}%" aria-hidden="true"></span>`;
