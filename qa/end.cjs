const { chromium } = require('/home/user/node_modules/playwright');
const path = require('path');
const url = 'file://' + path.join(__dirname, '..', 'dist', 'index.html'), out = n => path.join(__dirname, 'tmp', n);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p2 = await b.newPage({ viewport: { width: 1280, height: 900 } }); p2.on('pageerror', e => console.log('PAGE', e.message));
  await p2.goto(url + '?stage=7&god=1'); await p2.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 });
  const st = async m => { const t = JSON.parse(await p2.evaluate(() => window.render_game_to_text())); console.log(m, t.screen, t.game && [t.game.stage, t.game.mode, t.game.score].join(' '), 'petals', t.petals, JSON.stringify(t.cfg)); };
  await st('ready'); await p2.selectOption('#example', { index: 7 }); await p2.waitForTimeout(500); await p2.click('#run'); await p2.evaluate(() => window.advanceTime(700)); await st('run');
  await p2.keyboard.down('KeyX'); await p2.evaluate(() => window.advanceTime(60)); await p2.keyboard.up('KeyX'); await st('X');
  await p2.evaluate(() => { const g = window.__donghyunzam.A.g; g.score = 107450; g.gates[0].st = 2; g.pl.x = g.gates[1].x - 30; g.pl.y = 90; g.cam = g.pl.x - 150; for (let i = 0; i < 400 && !(g.boss && g.boss.st === 'fight'); i++) window.advanceTime(100); g.hitBoss(9999); }); await p2.keyboard.down('KeyX'); for (let i = 0; i < 300; i++) { if (await p2.evaluate(() => { window.advanceTime(100); return window.__donghyunzam.A.g.mode === 'clear'; })) break; } await p2.keyboard.up('KeyX'); await p2.evaluate(() => window.advanceTime(4000)); await st('clear?');
  await p2.keyboard.down('KeyX'); await p2.evaluate(() => window.advanceTime(60)); await p2.keyboard.up('KeyX'); await st('X2'); await p2.evaluate(() => window.advanceTime(3000)); await st('end');
  await p2.evaluate(() => document.querySelector('#board-wrap').scrollIntoView({ block: 'center' })); await p2.waitForTimeout(1500); const bb = await (await p2.$('#game')).boundingBox(); await p2.screenshot({ path: out('s-ending.png'), clip: bb });
  await b.close();
})();
