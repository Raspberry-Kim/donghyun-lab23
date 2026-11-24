// 페이지 화면: 데스크톱 탭 다섯, 휴대폰 세로, 휴대폰 가로 전체 화면
const { chromium, devices } = require('/home/user/node_modules/playwright');
const path = require('path');
const url = 'file://' + path.join(__dirname, '..', 'dist', 'index.html');
const out = n => path.join(__dirname, 'tmp', n);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const open = async (ctxOpt, q) => { const c = await b.newContext(ctxOpt); const pg = await c.newPage(); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGE ' + e.message)); await pg.goto(url + (q || '')); await pg.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 90000 }); await pg.waitForTimeout(1200); return pg; };
  const over = pg => pg.evaluate(() => { const bad = []; const vw = document.documentElement.clientWidth; document.querySelectorAll('body *').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && r.right > vw + 1 && getComputedStyle(e).position !== 'fixed' && !e.closest('.series-strip,.table-wrap,pre,.code-wrap,#petals,.examples')) bad.push(e.tagName + '.' + e.className + ' ' + Math.round(r.right)); }); return { sw: document.documentElement.scrollWidth, vw, bad: bad.slice(0, 8) }; });
  if (!process.argv[2] || process.argv[2] === 'd') {
    const pg = await open({ viewport: { width: 1280, height: 900 } });
    await pg.screenshot({ path: out('d-ready.png'), fullPage: true });
    const tabs = await pg.$$eval('nav.tabs button[data-tab]', a => a.map(x => x.id || x.dataset.tab));
    console.log('tabs', tabs.join(','));
    for (const t of await pg.$$('nav.tabs button[data-tab]')) { await t.click(); await pg.waitForTimeout(500); const id = await t.evaluate(x => x.dataset.tab || x.id); await pg.screenshot({ path: out('d-tab-' + id + '.png'), fullPage: true }); console.log(id, JSON.stringify(await over(pg))); }
    await pg.close();
  }
  if (!process.argv[2] || process.argv[2] === 'm') {
    const pg = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await pg.screenshot({ path: out('m-ready.png'), fullPage: true }); console.log('m ready', JSON.stringify(await over(pg)));
    await pg.tap('#run'); await pg.waitForTimeout(900); await pg.touchscreen.tap(195, 400).catch(() => { });
    const box = await (await pg.$('#game')).boundingBox(); await pg.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2); await pg.waitForTimeout(700);
    await pg.evaluate(() => document.querySelector('#board-wrap').scrollIntoView({ block: 'start' })); await pg.waitForTimeout(300);
    await pg.screenshot({ path: out('m-play.png') }); console.log('m play', JSON.stringify(await over(pg)), JSON.stringify(await pg.evaluate(() => { const t = document.querySelector('#touchpad'); const r = t.getBoundingClientRect(); return { disp: getComputedStyle(t).display, w: r.width, h: r.height, mode: JSON.parse(window.render_game_to_text()).game.mode }; })));
    for (const t of await pg.$$('nav.tabs button[data-tab]')) { await t.tap(); await pg.waitForTimeout(400); const id = await t.evaluate(x => x.dataset.tab || x.id); await pg.screenshot({ path: out('m-tab-' + id + '.png'), fullPage: true }); console.log('m', id, JSON.stringify(await over(pg))); }
    await pg.close();
  }
  for (const [vw, vh] of [[844, 390], [667, 375]]) if (!process.argv[2] || process.argv[2] === 'l') {
    const pg = await open({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await pg.tap('#run'); await pg.waitForTimeout(600);
    await pg.tap('#full'); await pg.waitForTimeout(800);
    const box = await (await pg.$('#game')).boundingBox(); await pg.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2); await pg.waitForTimeout(900);
    await pg.evaluate(() => { const g = window.__donghyunzam.A.g; g.score = 12220; g.bombs = 10; g.pl.dmg = 60; window.__donghyunzam.fit(); document.querySelector('#full-hint').hidden = true; }); await pg.waitForTimeout(300); await pg.screenshot({ path: out('l-full-' + vw + '.png') }); await pg.evaluate(() => { const g = window.__donghyunzam.A.g; g.god = true; g.pl.x = g.gates[0].x - 60; g.cam = g.pl.x - 150; for (let i = 0; i < 300 && !(g.boss && g.boss.st === 'fight'); i++) window.advanceTime(100); window.advanceTime(1500); }); await pg.screenshot({ path: out('l-boss-' + vw + '.png') });
    console.log('l ' + vw, JSON.stringify(await pg.evaluate(() => { const f = document.querySelector('#stage-full'), c = document.querySelector('#game').getBoundingClientRect(), d = document.querySelector('#dpad').getBoundingClientRect(), p = document.querySelector('.pad-btns').getBoundingClientRect(); return { inset: [window.DS.R ? DS.R.inset : null], cls: f.className, canvas: [c.left, c.top, c.width, c.height].map(Math.round), dpad: [d.left, d.top, d.width, d.height].map(Math.round), btns: [p.left, p.top, p.width, p.height].map(Math.round), mode: JSON.parse(window.render_game_to_text()).game.mode }; })));
    await pg.close();
  }
  console.log('errors', errs.length, errs.slice(0, 5).join('\n'));
  await b.close();
})();
