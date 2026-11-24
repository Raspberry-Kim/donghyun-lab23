// 보스 열넷의 팔다리 장면 모으기: node qa/boss.cjs [시작 스테이지] [끝 스테이지]
// 자동 조종으로 가다가 보스를 만나면 처음 얼마 동안 맷집을 채워 두고, 다리·혀·집게발이 가장 길게 뻗은 화면을 qa/tmp/boss-<스테이지>-<이름>.png 로 남긴다.
const { chromium } = require('/home/user/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const s0 = +process.argv[2] || 1, s1 = +process.argv[3] || 7, HOLD = +process.argv[4] || 14;
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGE ' + e.message));
  await pg.goto('file://' + path.join(__dirname, '..', 'dist', 'index.html') + '?auto=1&stage=' + s0);
  await pg.waitForFunction(() => window.DS && DS.app.scr === 'game', null, { timeout: 90000 });
  const grab = () => pg.evaluate(() => document.querySelector('#game').toDataURL('image/png'));
  const best = {}, seen = {}; let sec = 0;
  for (let i = 0; i < 20000; i++) {
    const st = await pg.evaluate(H => {
      window.advanceTime(100); const t = JSON.parse(window.render_game_to_text()); const g = window.__donghyunzam.A.g, B = g && g.boss; const o = { stage: t.game ? t.game.stage : 0, mode: t.game ? t.game.mode : t.screen, bk: '', ext: 0, n: 0 };
      if (B && !B.dead) { o.bk = B.key; B._h = (B._h || 0) + 1; if (B.st === 'fight' && B._h < H * 10) B.hp = Math.max(B.hp, B.hp0 * 0.5); B.limbs.forEach(l => { if (l.st === 2 || l.st === 3) { o.n++; o.ext = Math.max(o.ext, l.ext); } }); }
      return o;
    }, HOLD);
    sec += 0.1; if (!st.stage || st.mode === 'ending' || st.stage > s1) break;
    if (st.bk) {
      const k = st.stage + '-' + st.bk, v = st.ext + st.n * 0.2; if (!seen[k]) { seen[k] = 1; console.log(sec.toFixed(1) + 's', k); }
      if (st.n && v > (best[k] || 0) + 0.05) { best[k] = v; fs.writeFileSync(path.join(__dirname, 'tmp', 'boss-' + k + '.png'), Buffer.from((await grab()).split(',')[1], 'base64')); }
    }
  }
  console.log('끝', sec.toFixed(1) + 's', Object.keys(best).length + '/' + Object.keys(seen).length, 'errors', errs.length, errs.slice(0, 4).join('\n'));
  await b.close();
})();
