import fs from 'node:fs';
const {results}=JSON.parse(fs.readFileSync('docs/validation/simulation.json','utf8'));
const names={active:'正常主动，无广告',ideal:'理想持续操作，无广告',idle:'首台无人机后自动',mixed:'每3分钟交替补给与清屏',cash:'高频资金补给',clear:'高频清屏'};
const range=(a)=>`${Math.min(...a).toFixed(2)}–${Math.max(...a).toFixed(2)}`;
const lines=['# 数值模拟验证','','本报告由与实际游戏共用的状态、战斗、奖励和成本代码生成，不是人工完整通关记录。随机种子为17、42、97，固定步长0.25秒。','','| 路线 | 有效作业分钟 | 加入广告后分钟 | 广告次数 | 结果 |','| --- | ---: | ---: | ---: | --- |'];
for(const route of Object.keys(names)){const rows=results.filter(x=>x.route===route);lines.push(`| ${names[route]} | ${range(rows.map(x=>x.minutes))} | ${range(rows.map(x=>x.wallMinutes))} | ${range(rows.map(x=>x.ads))} | ${rows.every(x=>x.completed)?'全部完成五章与发射':'未通过'} |`)}
lines.push('','正常主动策略每10秒使用磁铁4秒，其余时间依靠自动化；理想路线始终即时瞄准最弱目标，是操作上界。所有路线每2秒按固定优先级尝试购买设备，并使用已获研发与机匣资源。界面停留时间未模拟，因此不能把结果视作每位玩家的精确通关时间。','','广告墙钟时间按每次30秒估算，实际广告长短与供给由平台决定。高频看广告能减少作业时间，但观看本身耗时，总会话可能更长。清屏仅回收本屏真实对象，不伪造多倍贡献。','','正常无广告路线应落入45–75分钟目标区间；自动路线允许更慢，理想持续操作允许更快。全部路线必须能结束主线且保持有限非负资金。');
const normal=results.filter(x=>x.route==='active');const passed=normal.every(x=>x.minutes>=45&&x.minutes<=75)&&results.every(x=>x.completed&&Number.isFinite(x.wallet)&&x.wallet>=0);
lines.push('',`自动验收结果：${passed?'通过':'未通过'}。`,'','原始数据：simulation.json。可复现命令：npm run simulate。');fs.writeFileSync('docs/validation/ECONOMY_REPORT.md',lines.join('\n')+'\n');if(!passed)process.exitCode=1;
