// 화면 없이 엔진만: 자동 조종으로 일곱 스테이지를 끝내는지, 가는 길에 저장 → 불러오기가 그대로 돌아오는지 본다.
// node qa/sim.cjs        무적으로 완주
// node qa/sim.cjs 0      무적 없이 잠수함 9대로 완주
// node qa/sim.cjs 0 0    무적 없이, 폭탄 0으로 시작(어뢰가 주 무기인지 본다)
const fs = require('fs'), vm = require('vm'), path = require('path'); const src = path.join(__dirname, '..', 'src');
const win = {}; win.window = win; win.document = { createElement() { return { getContext() { return {}; } }; } };
const ctx = vm.createContext(win); ctx.console = console;
for (const f of ['sketch', 'art', 'level', 'game']) vm.runInContext(fs.readFileSync(path.join(src, f + '.js'), 'utf8'), ctx, { filename: f });
const DS = win.DS, god = process.argv[2] !== '0', bombs = process.argv[3] == null ? 4 : +process.argv[3]; let bad = 0, trips = 0;
for (let st = 0; st < 7; st++) {
  const g = new DS.Game({ lives: 9, stage: st, god, bombs }); let n = 0; const log = [];
  while (n < 60 * 60 * 12) {
    g.update(DS.autoPilot(g)); n++;
    if (g.boss && !g._b) { g._b = g.boss.key; log.push(g.boss.d.name + '@' + ((n / 60) | 0)); } if (!g.boss) g._b = null;
    if (n % 240 === 0 && g.mode === 'play') { const d = g.save(), b = g._b; const g2 = DS.Game.load(JSON.parse(JSON.stringify(d)), {}); trips++; if (JSON.stringify(g2.save()) !== JSON.stringify(d)) { bad++; console.log('  저장 왕복 다름', st + 1, n); } g._b = b; }
    if (g.mode === 'clear' || g.mode === 'over') break;
  }
  if (g.mode !== 'clear') bad++;
  console.log(st + 1, g.S.name, g.mode, 't=' + ((n / 60) | 0) + 's', 'lives=' + g.lives, 'score=' + g.score, 'kills=' + g.kills, 'bombs=' + g.bombs, log.join(' '));
}
console.log(bad ? '실패 ' + bad : '통과', '저장 왕복', trips);
process.exit(bad ? 1 : 0);
