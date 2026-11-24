const { chromium } = require('/home/user/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; pg.on('pageerror', e => errs.push('PAGE ' + e.message));
  await pg.goto('file://' + path.join(__dirname, '..', 'dist', 'index.html'));
  await pg.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 });
  const r = await pg.evaluate(() => { const P = window.__donghyunzam.parseSortie; return ['3', '3\n7\n2\n10', '0', '10', '3\n8', '3\n1\n3', '3\n1\n1\n0', '3\n1\n1\n11', '', 'abc', '3 2', '3\n2\n1\n10\n5', '2.5'].map(o => [JSON.stringify(o), JSON.stringify(P(o))]); });
  r.forEach(x => console.log(x[0], '→', x[1].slice(0, 230)));
  // 예제 아홉 개를 차례로 골라 미리 보기 카드가 바뀌는지
  const n = await pg.$$eval('#example option', a => a.length); console.log('examples', n);
  for (let i = 0; i < n; i++) { await pg.selectOption('#example', { index: i }); await pg.waitForTimeout(450); const t = JSON.parse(await pg.evaluate(() => window.render_game_to_text())); console.log(i + 1, JSON.stringify(t.cfg), t.paper, (await pg.$eval('#example', e => e.selectedOptions[0].textContent))); }
  // 틀린 코드로 출전
  await pg.fill('#code', '나는 동현이냐?\n  뿡뿡 도~뿡뿡뿡\n동현이구나'); await pg.waitForTimeout(400); await pg.click('#run'); await pg.waitForTimeout(500);
  console.log('bad run →', JSON.parse(await pg.evaluate(() => window.render_game_to_text())).screen, '|', (await pg.$eval('#result', e => e.textContent)).slice(0, 160));
  await pg.screenshot({ path: path.join(__dirname, 'tmp', 'p-err.png') });
  console.log('errors', errs.length, errs.join('\n'));
  await b.close();
})();
