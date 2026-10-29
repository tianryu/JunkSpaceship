import { cost, type Save } from "./model";

// Guide progress never grants resources or changes actual ad-unlock milestones.
export function guideStep(s: Save): number {
  let step = s.guide.step;
  if (step === 0 && (s.lifetime.scrap >= 3 || s.tutorial.bought)) step = 1;
  if (step === 1 && s.upgrades.power > 0) step = 2;
  if (step === 2 && s.upgrades.drones > 0) step = 3;
  return step;
}

export function guideHint(s: Save) {
  const step = guideStep(s);
  if (step === 0)
    return {
      title: "按住废品，拖动磁铁",
      detail: `回收 3 件  ${Math.min(3, s.lifetime.scrap)}/3`,
      target: ".arena",
    };
  if (step === 1)
    return s.wallet >= cost(s, "power")
      ? {
          title: "点亮你的磁力",
          detail: "点击下方磁力卡，拆得更快",
          target: '[data-buy="power"]',
        }
      : {
          title: "继续回收，攒够 10",
          detail: `还差 ${Math.ceil(cost(s, "power") - s.wallet)}，就能升级磁力`,
          target: ".arena",
        };
  if (step === 2)
    return s.wallet >= cost(s, "drones")
      ? {
          title: "买下第一台无人机",
          detail: "点击无人机，松手也能自动回收",
          target: '[data-buy="drones"]',
        }
      : {
          title: "攒够 120，解锁自动回收",
          detail: `继续回收，还差 ${Math.ceil(cost(s, "drones") - s.wallet)}`,
          target: ".arena",
        };
  return [
    {
      title: "打开研发",
      detail: "每回收 80 件，获得 1 次研发",
      target: '.nav [data-nav="research"]',
    },
    {
      title: "插件最多装配 3 个",
      detail: "有空位自动装配，换插件点下方",
      target: ".research-preview",
    },
    {
      title: "打开仓库",
      detail: "每回收 20 台机器，获得 1 个机匣",
      target: '.nav [data-nav="warehouse"]',
    },
    {
      title: "集齐 5 件，让飞船起航",
      detail: "回收推进建设，达到 100% 后安装",
      target: ".ship",
    },
  ][step - 3];
}
