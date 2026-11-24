const { chromium } = require('/home/user/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 1280, height: 860 } });
  pg.on('pageerror', e => console.log('PAGE', e.message));
  await pg.goto('file://' + path.join(__dirname, '..', 'dist', 'index.html') + (process.argv[2] || '?auto=1&god=0'));
  await pg.waitForFunction(() => window.DS && DS.app.scr === 'game', null, { timeout: 90000 });
  const n = +process.argv[3] || 40, dt = +process.argv[4] || 250;
  for (let i = 0; i < n; i++) {
    const st = await pg.evaluate((dt) => { window.advanceTime(dt); const t = JSON.parse(window.render_game_to_text()); const g = t.game; return g ? [t.screen, g.mode, g.sub.x, g.sub.y, g.sub.vx, g.sub.vy, 'dmg', g.sub.damage, 'dead', g.sub.dead, 'lives', g.lives, g.why, 'en', g.enemies.length, 'eb', g.bullets, 'tubes', g.tubes, 'bombs', g.bombs + g.bomb, 'boss', g.boss ? g.boss.name + ' ' + g.boss.hp : '-'].join(' ') : t.screen; }, dt);
    console.log(i, st);
  }
  await b.close();
})();
