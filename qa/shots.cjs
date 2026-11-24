// 화면 모음에 넣을 그림
const { chromium } = require('/home/user/node_modules/playwright');
const path = require('path'), fs = require('fs');
const url = 'file://' + path.join(__dirname, '..', 'dist', 'index.html'), out = n => path.join(__dirname, 'tmp', n);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const pg = await b.newPage({ viewport: { width: 1280, height: 900 } }); pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(url); await pg.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 });
  await pg.evaluate(() => window.advanceTime(5200));
  const cv = async n => { const d = await pg.evaluate(() => document.querySelector('#game').toDataURL('image/png')); fs.writeFileSync(out(n), Buffer.from(d.split(',')[1], 'base64')); };
  await cv('s-ready.png');
  await pg.evaluate(() => window.scrollTo(0, 0)); await pg.screenshot({ path: out('s-desk-top.png') });
  // 흰 종이로 출전
  await pg.selectOption('#example', { index: 2 }); await pg.waitForTimeout(500); await pg.click('#run'); for (let i = 0; i < 200; i++) { if (await pg.evaluate(() => { window.advanceTime(100); return DS.app.scr === 'game'; })) break; } await pg.evaluate(() => window.advanceTime(700));
  await pg.keyboard.down('KeyX'); await pg.evaluate(() => window.advanceTime(60)); await pg.keyboard.up('KeyX');
  await pg.keyboard.down('ArrowRight'); await pg.evaluate(() => window.advanceTime(2600)); await pg.keyboard.down('KeyX'); await pg.evaluate(() => window.advanceTime(900)); await pg.keyboard.up('KeyX'); await pg.keyboard.up('ArrowRight');
  await cv('s-white.png'); console.log(JSON.parse(await pg.evaluate(() => window.render_game_to_text())).paper);
  await pg.evaluate(() => document.querySelector('#board-wrap').scrollIntoView({ block: 'center' })); await pg.waitForTimeout(200); const bb = await (await pg.$('.play-grid')).boundingBox(); await pg.screenshot({ path: out('s-desk-play.png'), clip: { x: 0, y: Math.max(0, bb.y - 30), width: 1280, height: Math.min(700, bb.height + 60) } });
  await pg.close();
  // 끝 화면
  const p2 = await b.newPage({ viewport: { width: 1280, height: 900 } }); p2.on('pageerror', e => errs.push(e.message));
  await p2.goto(url + '?stage=7&god=1'); await p2.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 });
  await p2.selectOption('#example', { index: 7 }); await p2.waitForTimeout(500); await p2.click('#run'); for (let i = 0; i < 200; i++) { if (await p2.evaluate(() => { window.advanceTime(100); return DS.app.scr === 'game'; })) break; } await p2.evaluate(() => window.advanceTime(700)); await p2.keyboard.down('KeyX'); await p2.evaluate(() => window.advanceTime(60)); await p2.keyboard.up('KeyX');
  await p2.evaluate(() => { const g = window.__donghyunzam.A.g; g.score = 107450; g.gates[0].st = 2; g.pl.x = g.gates[1].x - 30; g.pl.y = 90; g.cam = g.pl.x - 150; for (let i = 0; i < 400 && !(g.boss && g.boss.st === 'fight'); i++) window.advanceTime(100); g.hitBoss(9999); }); await p2.keyboard.down('KeyX'); for (let i = 0; i < 300; i++) { if (await p2.evaluate(() => { window.advanceTime(100); return window.__donghyunzam.A.g.mode === 'clear'; })) break; } await p2.keyboard.up('KeyX'); await p2.evaluate(() => window.advanceTime(4000));
  await p2.keyboard.down('KeyX'); await p2.evaluate(() => window.advanceTime(60)); await p2.keyboard.up('KeyX'); await p2.evaluate(() => window.advanceTime(3000));
  console.log(JSON.parse(await p2.evaluate(() => window.render_game_to_text())).game.mode);
  await p2.evaluate(() => document.querySelector('#board-wrap').scrollIntoView({ block: 'center' })); await p2.waitForTimeout(1500); await p2.screenshot({ path: out('s-desk-ending.png') });
  console.log('errors', errs.length, errs.join('\n')); await b.close();
})();
