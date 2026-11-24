// 손 조작 확인: 키를 누르고 정해진 걸음만큼 돌린다. 물리 수치·어뢰·기뢰·대함미사일·메뉴·게임 오버·클리어를 차례로 본다.
const { chromium } = require('/home/user/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGE ' + e.message + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  await pg.goto('file://' + path.join(__dirname, '..', 'dist', 'index.html') + '?stage=1');
  await pg.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 });
  const adv = n => pg.evaluate(n => window.advanceTime(n * 1000 / 60), n);
  const T = async () => JSON.parse(await pg.evaluate(() => window.render_game_to_text()));
  const G = async () => (await T()).game;
  const shot = async n => { const d = await pg.evaluate(() => document.querySelector('#game').toDataURL('image/png')); fs.writeFileSync(path.join(__dirname, 'tmp', 'm-' + n + '.png'), Buffer.from(d.split(',')[1], 'base64')); };
  const hold = async (k, n) => { await pg.keyboard.down(k); await adv(n); await pg.keyboard.up(k); await adv(1); };
  let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
  const kinds = g => g.shots.map(s => s.kind).join(',');
  await adv(1); await pg.screenshot({ path: path.join(__dirname, 'tmp', 'm-setup.png') });
  await pg.click('#run'); await adv(30);
  let g = await G(); ok(g.mode === 'brief', '출전 직후 brief: ' + g.mode); await shot('brief');
  await hold('KeyX', 2); await adv(5); g = await G(); ok(g.mode === 'play', 'X로 시작: ' + g.mode);
  ok(g.sub.face === 1 && g.tubes === 2 && g.bombs === 4 && g.bomb === 'mine' && g.lives === 3, '처음: 오른쪽을 보고, 관 2 · 폭탄 4(기뢰) · 잠수함 3');
  await pg.evaluate(() => { window.__donghyunzam.A.g.god = true; });
  // 물의 저항: 끝 속도
  await pg.keyboard.down('ArrowRight'); await adv(240); g = await G(); await pg.keyboard.up('ArrowRight'); ok(Math.abs(g.sub.vx - 2.08) < 0.02, '오른쪽으로 계속 → 끝 속도 2.08: ' + g.sub.vx);
  await adv(90); g = await G(); ok(Math.abs(g.sub.vx) < 0.2, '떼면 물에 밀려 멈춘다: vx ' + g.sub.vx);
  await hold('ArrowUp', 200); g = await G(); ok(g.sub.y <= g.sea + 11 && g.sub.y >= g.sea + 9, '위로 끝까지 → 수면 바로 아래(y ' + g.sub.y + ', 수면 ' + g.sea + ')'); await shot('top');
  await hold('ArrowDown', 60); g = await G(); const y1 = g.sub.y; ok(y1 > g.sea + 20, '아래로: y ' + y1);
  await hold('ArrowLeft', 30); g = await G(); ok(g.sub.face === -1, '왼쪽 → 뱃머리 돌림: ' + g.sub.face);
  await hold('ArrowRight', 30); g = await G(); ok(g.sub.face === 1, '오른쪽 → 다시 돌림: ' + g.sub.face);
  // 어뢰: 관 둘
  await adv(40); await pg.keyboard.down('KeyX'); await adv(2); g = await G(); ok(g.tubes === 1 && kinds(g) === 'torp', '어뢰 한 발: 남은 관 ' + g.tubes);
  await adv(30); g = await G(); ok(g.tubes === 0, '누르고 있으면 둘째 발: 남은 관 ' + g.tubes); await shot('torp');
  await adv(30); g = await G(); ok(g.shots.filter(s => s.kind === 'torp').length <= 2, '화면의 어뢰는 둘까지: ' + kinds(g)); await pg.keyboard.up('KeyX'); await adv(200);
  // 기뢰
  await hold('KeyZ', 2); g = await G(); ok(g.bombs === 3 && kinds(g).includes('mine'), 'Z 기뢰: 남은 폭탄 ' + g.bombs); await adv(30); await shot('mine');
  await adv(130); g = await G(); ok(!kinds(g).includes('mine'), '기뢰는 100걸음 뒤 터진다');
  // 대함미사일
  await hold('KeyC', 2); g = await G(); ok(g.bomb === 'ssm', 'C로 폭탄 바꾸기: ' + g.bomb);
  await hold('KeyZ', 2); g = await G(); ok(g.bombs === 2 && kinds(g).includes('ssm'), 'Z 대함미사일: 남은 폭탄 ' + g.bombs); await adv(12); await shot('ssm'); await adv(200);
  await hold('KeyC', 2); g = await G(); ok(g.bomb === 'mine', 'C 한 번 더 → 기뢰');
  // Enter 메뉴
  await pg.keyboard.press('Enter'); await adv(3); let t = await T(); ok(t.paused && t.menu, 'Enter 메뉴: ' + JSON.stringify(t.menu)); await pg.screenshot({ path: path.join(__dirname, 'tmp', 'm-menu.png') });
  const xx = t.game.sub.x; await adv(30); t = await T(); ok(t.game.sub.x === xx, '메뉴 동안 멈춤');
  await pg.keyboard.press('Enter'); await adv(3); t = await T(); ok(!t.paused, '계속 간다');
  // 데미지와 잠수함 잃기, 게임 오버
  await pg.evaluate(() => { const A = window.__donghyunzam.A; A.g.god = false; A.g.pl.inv = 0; A.g.damage(30); });
  g = await G(); ok(g.sub.damage === 30 && g.sub.inv > 0, '맞으면 데미지 30, 잠깐 무적: ' + g.sub.damage + ' / ' + g.sub.inv);
  await pg.evaluate(() => { const A = window.__donghyunzam.A; A.g.lives = 1; A.g.pl.inv = 0; A.g.damage(99); });
  for (let i = 0; i < 60; i++) { await adv(15); g = await G(); if (g.mode === 'over') break; }
  ok(g.mode === 'over', '잠수함 0 → 게임 오버: ' + g.mode + ' / ' + g.why); await adv(60); await shot('over');
  await hold('KeyX', 2); await adv(5); g = await G(); ok((g.mode === 'brief' || g.mode === 'play') && g.lives === 3 && g.score === 0 && g.bombs === 4, '이어 하기 → ' + g.mode + ' 잠수함 ' + g.lives + ' 점수 ' + g.score + ' 폭탄 ' + g.bombs);
  // 보스 방: 문이 잠기고, 쓰러뜨리면 풀린다
  await adv(30); await hold('KeyX', 2); await adv(10);
  await pg.evaluate(() => { const g = window.__donghyunzam.A.g; g.god = true; g.pl.x = g.gates[0].x - 40; g.pl.y = 90; g.cam = g.pl.x - 150; });
  for (let i = 0; i < 80; i++) { await hold('ArrowRight', 10); g = await G(); if (g.boss && g.boss.state === 'fight') break; }
  ok(g.locked && g.boss && g.boss.name === '꽃게', '중간 보스 방에 들어가면 잠긴다: ' + (g.boss && g.boss.name)); await shot('mid');
  await pg.evaluate(() => { const g = window.__donghyunzam.A.g; g.hitBoss(9999); });
  for (let i = 0; i < 200; i++) { g = await G(); if (!g.boss) break; await adv(10); }
  ok(!g.boss && !g.locked && g.score >= 2000, '중간 보스를 쓰러뜨리면 풀린다: 점수 ' + g.score);
  // 클리어 카드와 종이 넘김
  await pg.evaluate(() => { const g = window.__donghyunzam.A.g; g.pl.x = g.gates[1].x - 40; g.pl.y = 90; g.cam = g.pl.x - 150; });
  for (let i = 0; i < 80; i++) { await hold('ArrowRight', 10); g = await G(); if (g.boss && g.boss.state === 'fight') break; }
  ok(g.boss && g.boss.name === '문어', '보스 방: ' + (g.boss && g.boss.name));
  await pg.evaluate(() => { const g = window.__donghyunzam.A.g; g.hitBoss(9999); });
  for (let i = 0; i < 400; i++) { g = await G(); if (g.mode === 'clear') break; await adv(10); }
  ok(g.mode === 'clear', '클리어: ' + g.mode); await adv(170); await shot('clear');
  await hold('KeyX', 2); await adv(8); await shot('turn'); await adv(120); g = await G(); ok(g.stage === 2, '다음 스테이지: ' + g.stage + ' ' + g.mode); await shot('brief2');
  console.log(fail ? fail + ' FAILED' : 'all ok', '· errors', errs.length, errs.slice(0, 6).join('\n'));
  await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();
