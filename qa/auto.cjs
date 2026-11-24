// 자동 조종으로 스테이지를 끝까지: node qa/auto.cjs <시작 스테이지> <끝 스테이지> [화면을 남길 간격(초)] [주소 덧붙임]
// 보스가 다리·혀·집게발을 뻗은 순간은 따로 남긴다(qa/tmp/limb-*.png).
const { chromium } = require('/home/user/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const s0 = +process.argv[2] || 1, s1 = +process.argv[3] || s0, shotEvery = +process.argv[4] || 0;
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGE ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await pg.goto('file://' + path.join(__dirname, '..', 'dist', 'index.html') + '?auto=1&stage=' + s0 + (process.argv[5] || ''));
  await pg.waitForFunction(() => window.DS && DS.app.scr === 'game', null, { timeout: 90000 });
  await pg.evaluate(() => window.advanceTime(16));
  const shot = async n => { const d = await pg.evaluate(() => document.querySelector('#game').toDataURL('image/png')); fs.writeFileSync(path.join(__dirname, 'tmp', n), Buffer.from(d.split(',')[1], 'base64')); };
  let last = '', sec = 0, stuck = 0; const limbShot = {};
  for (let i = 0; i < 6000; i++) {
    const st = await pg.evaluate(() => { window.advanceTime(250); const t = JSON.parse(window.render_game_to_text()); const g = window.__donghyunzam.A.g; t.limb = g && g.boss && !g.boss.dead ? g.boss.limbs.filter(l => l.st === 2 || l.st === 3 || l.st === 5).length : 0; t.bk = g && g.boss ? g.boss.key : ''; return t; });
    sec += 0.25; const g = st.game; if (!g) { console.log('끝: 화면', st.screen); break; }
    const key = g.stage + ':' + g.mode + ':' + g.locked + ':' + g.lives + ':' + (g.boss ? g.boss.name : '');
    if (key !== last) { console.log(sec + 's', 'st' + g.stage, g.mode, 'x', g.sub.x, 'y', g.sub.y, 'boss', g.boss ? g.boss.name + ' ' + g.boss.hp : '-', 'dmg', g.sub.damage, 'lives', g.lives, 'bombs', g.bombs, 'score', g.score); last = key; stuck = 0; }
    else if (++stuck > 720) { console.log('멈춤?', sec + 's', JSON.stringify(g.sub), JSON.stringify(g.boss)); await shot('stuck-' + g.stage + '.png'); break; }
    if (st.limb && (limbShot[st.bk] || 0) < 3) { limbShot[st.bk] = (limbShot[st.bk] || 0) + 1; await shot(`limb-${g.stage}-${st.bk}-${limbShot[st.bk]}.png`); }
    if (shotEvery && sec % shotEvery === 0) await shot(`auto-${g.stage}-${String(sec).padStart(4, '0')}.png`);
    if (g.mode === 'ending' || g.stage > s1) { console.log('완주', sec + 's', 'score', g.score, 'sum', JSON.stringify(st.sum), 'petals', st.petals); break; }
  }
  console.log('errors', errs.length, errs.slice(0, 6).join('\n'));
  await b.close();
})();
