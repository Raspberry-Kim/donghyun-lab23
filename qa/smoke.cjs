// 첫 화면과 출전 직후 화면, 콘솔 오류
const { chromium } = require('/home/user/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGE ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await pg.goto('file://' + path.join(__dirname, '..', 'dist', 'index.html') + (process.argv[2] || ''));
  await pg.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 });
  await pg.waitForTimeout(1500);
  await pg.screenshot({ path: path.join(__dirname, 'tmp', 'ready.png') });
  console.log(await pg.evaluate(() => window.render_game_to_text()));
  await pg.click('#run'); await pg.waitForTimeout(1200);
  await pg.screenshot({ path: path.join(__dirname, 'tmp', 'brief.png') });
  await pg.keyboard.press('KeyX'); await pg.waitForTimeout(800);
  await pg.screenshot({ path: path.join(__dirname, 'tmp', 'play.png') });
  console.log(await pg.evaluate(() => window.render_game_to_text()));
  console.log('errors', errs.length, errs.slice(0, 6).join('\n'));
  await b.close();
})();
