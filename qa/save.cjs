/* 저장·불러오기: ① 엔진 왕복(저장 → 불러오기 뒤에도 판이 똑같이 흘러가는지) ② 화면 흐름(칸 저장 · 새로 고침 뒤 불러오기 · 파일 왕복 · 틀린 파일 거부) */
const PW = require('/home/user/node_modules/playwright'), chromium = PW[process.env.BROWSER || 'chromium'];
const path = require('path'), fs = require('fs');
const URL0 = process.env.URL || 'file://' + path.join(__dirname, '..', 'dist', 'index.html');
let fails = 0; const ok = (c, m, x) => { if (!c) fails++; console.log((c ? 'ok   ' : 'FAIL ') + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); };
(async () => {
  const b = await chromium.launch(process.env.BROWSER && process.env.BROWSER !== 'chromium' ? {} : { args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const cx = await b.newContext({ viewport: { width: 1280, height: 860 }, acceptDownloads: true });
  const pg = await cx.newPage();
  const errs = []; pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('PAGE ' + e.message));
  const open = async q => { await pg.goto(URL0 + (q || '')); await pg.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 60000 }); };
  const st = () => pg.evaluate(() => JSON.parse(window.render_game_to_text()));
  const adv = ms => pg.evaluate(ms => window.advanceTime(ms), ms);
  await open('');

  /* ① 엔진 왕복: 일곱 스테이지 × 무적 켬·끔, 여러 시점에서 저장하고 원본과 복원본을 600걸음 나란히 돌린다 */
  const r = await pg.evaluate(() => {
    const DS = window.DS, auto = DS.autoPilot, N = DS.STAGES.length;
    const one = q => { if (q.mode === 'next') { if (q.stage < N - 1) q.startStage(q.stage + 1); else return false; } else if (q.mode === 'over') q.cont(); q.update(auto(q)); return true; };
    const out = { checks: 0, fails: [], saw: { torp: 0, mine: 0, ssm: 0, bullets: 0, ship: 0, plane: 0, boss: 0, limb: 0, edge: 0, ink: 0, dying: 0, items: 0, msg: 0, conts: 0, later: 0 }, bytes: 0 };
    const look = g => { const s = out.saw, b = g.boss; s.torp += g.shots.some(q => q.k === 'torp') ? 1 : 0; s.mine += g.shots.some(q => q.k === 'mine') ? 1 : 0; s.ssm += g.shots.some(q => q.k === 'ssm') ? 1 : 0; s.bullets += g.bullets.length ? 1 : 0; s.ship += g.en.some(e => e.d.ship && !e.dead) ? 1 : 0; s.plane += g.en.some(e => e.k === 'plane') ? 1 : 0; s.boss += b ? 1 : 0; s.limb += b && b.limbs.some(l => l.st === 2 || l.st === 3) ? 1 : 0; s.edge += b && b.limbs.some(l => l.edge) ? 1 : 0; s.ink += g.clouds.length ? 1 : 0; s.dying += g.pl.dead ? 1 : 0; s.items += g.items.length ? 1 : 0; s.msg += g.msg ? 1 : 0; s.conts += g.conts ? 1 : 0; s.later += g.stage > S0.get(g) ? 1 : 0; };
    const S0 = new WeakMap();
    const diff = (A, B) => { const d = []; for (const k in A) if (JSON.stringify(A[k]) !== JSON.stringify(B[k])) d.push(k); return d; };
    const pair = (g, n, name, god) => {
      const txt = JSON.stringify(g.save()); out.bytes = Math.max(out.bytes, txt.length); look(g);
      let g2; try { g2 = DS.Game.load(JSON.parse(txt), { god }); } catch (e) { out.fails.push(['불러오지 못했다', name, e.message]); return; }
      out.checks++;
      const again = JSON.stringify(g2.save()); if (again !== txt) { out.fails.push(['저장본이 다르다', name, diff(JSON.parse(txt), JSON.parse(again))]); return; }
      for (let i = 0; i < n; i++) { const a = one(g), c = one(g2); if (!a || !c) break; }
      if (JSON.stringify(g.text()) !== JSON.stringify(g2.text()) || JSON.stringify(g.save()) !== JSON.stringify(g2.save())) out.fails.push(['흐름이 갈렸다', name, diff(g.save(), g2.save())]);
    };
    for (let stage = 0; stage < N; stage++) for (const god of [true, false]) {
      const g = new DS.Game({ stage, lives: god ? 3 : 2, bombs: god ? 10 : 4, god }); S0.set(g, stage);
      for (let seg = 0; seg < 12; seg++) {
        let live = true; for (let i = 0; i < 397 + seg * 61 && live; i++) live = one(g);
        if (!live) break; if (g.mode !== 'play') continue;
        pair(g, 600, [stage + 1, god, seg].join(' '), god);
      }
    }
    /* 보스 열넷: 방에 들어가 팔다리가 뻗은 순간, 그리고 그 뒤 여러 시점에 저장한다. 맷집을 채워 두어 싸움이 길게 이어지게 한다 */
    for (let stage = 0; stage < N; stage++) for (let gi = 0; gi < 2; gi++) {
      const g = new DS.Game({ stage, lives: 3, bombs: 0, god: true }); S0.set(g, stage); let i = 0;
      for (; i < 60; i++) one(g);
      if (gi) g.gates[0].st = 2;
      g.pl.x = g.gates[gi].x - 60; g.pl.y = 90; g.cam = g.pl.x - 150;
      for (i = 0; i < 2000 && !(g.boss && g.boss.st === 'fight'); i++) one(g);
      if (!g.boss) { out.fails.push(['보스를 만나지 못했다', stage + 1, gi]); continue; }
      const key = g.boss.key; let got = 0;
      for (i = 0; i < 3000 && got < 4 && g.boss && !g.boss.dead; i++) { one(g); if (g.boss) g.boss.hp = Math.max(g.boss.hp, g.boss.hp0 * (got % 2 ? 0.3 : 0.8)); if (g.boss && g.mode === 'play' && (g.boss.limbs.some(l => l.st === 2) || g.boss.limbs.some(l => l.edge && l.st === 1)) && i % 7 === 0) { pair(g, 400, key + ' ' + got, true); got++; } }
      if (!got) out.fails.push(['팔다리가 뻗은 순간을 못 잡았다', key]);
    }
    /* 잠수함을 잃는 중, 기뢰·대함미사일이 떠 있는 중에 저장한 판 */
    {
      const none = () => ({ l: false, r: false, u: false, d: false, a: false, aEdge: false, bEdge: false, selEdge: false, ok: false, tap: null });
      const start = () => { const g = new DS.Game({ stage: 2, lives: 3, bombs: 10 }); S0.set(g, 2); for (let i = 0; i < 40; i++) { const o = none(); o.ok = true; g.update(o); } for (let i = 0; i < 60; i++) { const o = none(); o.r = true; g.update(o); } return g; };
      { const g = start(); g.pl.inv = 0; g.damage(100); for (let i = 0; i < 12; i++) g.update(none()); pair(g, 500, '잠수함을 잃는 중', false); }
      for (const w of ['mine', 'ssm']) { const g = start(); if (w === 'ssm') { const o = none(); o.selEdge = true; g.update(o); } const o = none(); o.bEdge = true; g.update(o); for (let i = 0; i < 6; i++) g.update(none()); if (!g.shots.some(q => q.k === w)) out.fails.push([w + '가 나가지 않았다']); pair(g, 300, w + ' 떠 있는 중', false); }
    }
    /* 망가진 저장본은 받지 않는다 */
    const g0 = new DS.Game({ stage: 0, lives: 3, bombs: 4 }); for (let i = 0; i < 500; i++) one(g0);
    const good = g0.save(), mk = o => Object.assign(JSON.parse(JSON.stringify(good)), o);
    const bads = [null, {}, 'x', mk({ stage: 9 }), mk({ stage: 1 }), mk({ mode: 'over' }), mk({ mode: 'brief' }), mk({ en: 'x' }), mk({ pl: null }), mk({ life0: 0 }), mk({ bombs: 11 }), mk({ bomb0: -1 }), mk({ lives: 0 }), mk({ rng: 'a' }), mk({ bsel: 'Q' }), mk({ en: [{ k: 'nope', x: 1, y: 1, hp: 1, t: 0, id: 1 }] }), mk({ shots: [{ k: 'zz' }] }), mk({ gates: [] }), mk({ score: -1 }), mk({ pl: Object.assign({}, good.pl, { x: 1e9 }) }), mk({ boss: { key: 'octo' } }), mk({ lock: { gi: 0 } }), mk({ bullets: [{ k: 'eb', x: 'a' }] })];
    out.rejected = 0; out.took = [];
    bads.forEach((q, i) => { try { DS.Game.load(q, {}); out.took.push(i); } catch (e) { out.rejected++; } });
    out.bads = bads.length;
    try { DS.Game.load(good, {}); out.goodOk = true; } catch (e) { out.goodOk = e.message; }
    return out;
  });
  ok(r.checks >= 150 && r.fails.length === 0, `엔진 왕복 ${r.checks}번, 갈린 곳 ${r.fails.length}`, r.fails.slice(0, 6));
  ok(Object.values(r.saw).every(v => v > 0), '저장 시점에 든 것(어뢰·기뢰·대함미사일·적탄·군함·전투기·보스·뻗은 팔다리·화면 밖에서 오는 다리·먹물·잠수함 잃는 중·아이템·알림·이어 하기·다음 스테이지)', r.saw);
  ok(r.rejected === r.bads && r.goodOk === true, `망가진 저장본 ${r.rejected}/${r.bads} 거부, 온전한 저장본은 받음`, r.took);
  console.log('     저장본 크기 최대', r.bytes, '바이트');

  /* ② 화면 흐름 */
  await pg.evaluate(() => { for (let n = 1; n <= 3; n++) localStorage.removeItem('donghyunzam:slot' + n); });
  await open('');
  ok(await pg.locator('#slot-list .slot-btn').count() === 3 && await pg.locator('#slot-list .slot-btn:disabled').count() === 3, '출전 준비: 빈 칸 3개');
  await pg.click('#run'); await adv(400); await pg.keyboard.press('KeyX'); await adv(300);
  // 조금 난다: 오른쪽 위로
  await pg.keyboard.down('ArrowUp'); await pg.keyboard.down('ArrowRight'); await adv(1500); await pg.keyboard.up('ArrowUp'); await adv(1200); await pg.keyboard.up('ArrowRight'); await pg.keyboard.press('KeyX'); await adv(200);
  let s = await st(); ok(s.screen === 'game' && s.game.mode === 'play', '출전 뒤 항해 중', { x: s.game.sub && s.game.sub.x });
  await pg.keyboard.press('Enter'); await adv(50); s = await st();
  ok(s.paused && s.menu.items.join('|') === '계속 간다|소리 끄기|저장|불러오기|포기하고 출전 준비로', '멈춤 메뉴에 저장·불러오기', s.menu && s.menu.items);
  const snap0 = await pg.evaluate(() => JSON.stringify(window.__donghyunzam.snapshot().state));
  await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('KeyX'); await adv(50); s = await st();
  ok(s.menu.title === '저장' && s.menu.items.length === 5, '저장 메뉴: 칸 3개 · 파일 · 지우기', s.menu.items);
  await pg.screenshot({ path: path.join(__dirname, 'tmp', 'save-menu.png') });
  await pg.keyboard.press('KeyX'); await adv(50); s = await st();
  ok(s.menu.title === '잠시 멈춤' && await pg.evaluate(() => !!window.__donghyunzam.readSlot(1)), '칸 1에 저장하고 메뉴로 돌아옴');
  const slot = await pg.evaluate(() => window.__donghyunzam.readSlot(1));
  ok(slot.format === 'donghyunzam-save' && slot.version === 1 && slot.summary.stage === 1 && JSON.stringify(slot.state) === snap0 && Array.isArray(slot.logs) && slot.logs.length >= 2, '칸에 적힌 것: 형식·요약·판·기록', slot.summary);
  // 파일로 내려받기
  await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('KeyX'); await adv(50);
  const [dl] = await Promise.all([pg.waitForEvent('download'), (async () => { await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('KeyX'); })()]);
  const file = path.join(__dirname, 'tmp', 'zam.dhsave'); await dl.saveAs(file);
  ok(/^donghyunzam-stage1-\d+\.dhsave$/.test(dl.suggestedFilename()) && JSON.parse(fs.readFileSync(file, 'utf8')).format === 'donghyunzam-save', '파일로 내려받기', dl.suggestedFilename());
  // 이어서 날다가 칸에서 불러온다
  await adv(50); await pg.keyboard.press('KeyX'); await adv(50);
  await pg.keyboard.down('ArrowRight'); await adv(1500); await pg.keyboard.up('ArrowRight'); await adv(100);
  const far = (await st()).game;
  await pg.keyboard.press('Enter'); await adv(50);
  for (let i = 0; i < 3; i++) await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('KeyX'); await adv(50); s = await st();
  ok(s.menu.title === '불러오기' && s.menu.items.length === 4, '불러오기 메뉴: 칸 3개 · 파일', s.menu.items);
  await pg.screenshot({ path: path.join(__dirname, 'tmp', 'load-menu.png') });
  await pg.keyboard.press('KeyX'); await adv(50); s = await st(); ok(s.menu.title === '지금 판을 버리고 불러올까?', '불러오기 전에 묻는다');
  await pg.keyboard.press('KeyX'); await adv(400); s = await st();
  const back = await pg.evaluate(() => JSON.stringify(window.__donghyunzam.A.g.save()));
  ok(s.screen === 'game' && s.paused && s.menu.title.startsWith('저장한 판을 불러왔다') && back === snap0 && JSON.stringify(s.game) !== JSON.stringify(far), '칸에서 불러옴: 저장한 그 자리, 멈춘 채로 기다림');
  await pg.screenshot({ path: path.join(__dirname, 'tmp', 'loaded.png') });
  await adv(1000); ok(await pg.evaluate(() => JSON.stringify(window.__donghyunzam.A.g.save())) === snap0, '메뉴가 떠 있는 동안 판은 멈춰 있다');
  await pg.keyboard.press('KeyX'); await adv(500); s = await st(); ok(!s.paused && s.game.mode === 'play' && await pg.evaluate(() => window.__donghyunzam.A.g.t) > JSON.parse(snap0).t, '계속 간다를 고르면 다시 흐른다');
  ok((await pg.locator('#log li').first().textContent()).includes('저장한 판을 불러왔다') && await pg.locator('#log li').count() >= 3, '항해 기록도 돌아온다');
  // 새로 고침 뒤 출전 준비 화면에서 불러온다
  await open(''); await pg.screenshot({ path: path.join(__dirname, 'tmp', 'setup-slots.png'), fullPage: true });
  ok(await pg.locator('#slot-list .slot-btn:not(:disabled)').count() === 1 && (await pg.locator('#slot-list .slot-btn').first().textContent()).includes('스테이지 1'), '새로 고침 뒤에도 칸 1이 남아 있다', await pg.locator('#slot-list .slot-btn').first().textContent());
  await pg.locator('#slot-list .slot-btn').first().click(); await adv(400); s = await st();
  ok(s.live && s.screen === 'game' && s.paused && await pg.evaluate(() => JSON.stringify(window.__donghyunzam.A.g.save())) === snap0 && await pg.locator('#hud').isVisible(), '출전 준비 화면에서 칸을 눌러 불러옴');
  // 파일에서: 다른 설정(잠수함 5, 스케치북 흰색)으로 저장한 판
  await pg.keyboard.press('KeyX'); await adv(100);
  const d2 = JSON.parse(fs.readFileSync(file, 'utf8')); d2.cfg.bg = 2; d2.sum = { kills: 12 }; const f2 = path.join(__dirname, 'tmp', 'zam2.dhsave'); fs.writeFileSync(f2, JSON.stringify(d2));
  await pg.setInputFiles('#load-file', f2); await pg.waitForFunction(() => { const s = JSON.parse(window.render_game_to_text()); window.advanceTime(50); return s.screen === 'game' && s.paused && s.paper !== '미색'; }, null, { timeout: 30000 });
  s = await st(); ok(s.cfg.bg === 2 && s.sum.kills === 12 && await pg.evaluate(() => JSON.stringify(window.__donghyunzam.A.g.save())) === snap0, '파일에서 불러옴: 종이 색·누계까지', { paper: s.paper, sum: s.sum });
  // 틀린 파일은 받지 않고 지금 판은 그대로
  await pg.keyboard.press('KeyX'); await adv(300);
  const bad = path.join(__dirname, 'tmp', 'bad.dhsave');
  for (const [name, body, want] of [['글자 파일', 'hello', '동현잠 저장 파일이 아니다'], ['다른 게임 파일', JSON.stringify({ format: 'donghyunchop-save', version: 1, state: {} }), '동현잠 저장 파일이 아니다'], ['버전이 다른 파일', JSON.stringify(Object.assign({}, d2, { version: 9 })), '지원하지 않는 저장 형식'], ['판이 망가진 파일', JSON.stringify(Object.assign({}, d2, { state: Object.assign({}, d2.state, { stage: 12 }) })), '스테이지 정보가 맞지 않는다']]) {
    const before = await pg.evaluate(() => JSON.stringify(window.__donghyunzam.A.g.save()));
    fs.writeFileSync(bad, body); await pg.setInputFiles('#load-file', bad); await pg.waitForFunction(() => document.querySelector('#status').textContent.startsWith('불러오기 실패'), null, { timeout: 10000 });
    const t = await pg.locator('#status').textContent(); s = await st();
    ok(t.includes(want) && s.paused && s.menu.title === '잠시 멈춤' && await pg.evaluate(() => JSON.stringify(window.__donghyunzam.A.g.save())) === before, name + '은 받지 않고 지금 판은 그대로', t);
    await pg.keyboard.press('KeyX'); await adv(100); await pg.evaluate(() => { document.querySelector('#status').textContent = ''; });
  }
  // 출전 준비 화면에서 틀린 파일
  await pg.evaluate(() => window.__donghyunzam.backToSetup()); await adv(300);
  fs.writeFileSync(bad, 'hello'); await pg.setInputFiles('#load-file-setup', bad); await pg.waitForFunction(() => document.querySelector('#result').textContent.startsWith('불러오기 실패'), null, { timeout: 10000 });
  s = await st(); ok(!s.live && s.screen === 'ready', '출전 준비 화면에서 틀린 파일: 알리고 그대로', await pg.locator('#result').textContent());
  // 칸 지우기: 두 번 눌러야 지운다
  const del = pg.locator('#slot-list .slot-del').first(); await del.click();
  ok(await pg.evaluate(() => !!window.__donghyunzam.readSlot(1)) && (await del.textContent()) === '정말 지운다', '지우기 한 번: 아직 남아 있다');
  await pg.locator('#slot-list .slot-del').first().click();
  ok(await pg.evaluate(() => !window.__donghyunzam.readSlot(1)) && await pg.locator('#slot-list .slot-btn:disabled').count() === 3, '지우기 두 번: 칸이 빈다');
  ok(errs.length === 0, '콘솔 오류 0', errs.slice(0, 4));
  await b.close();
  console.log(fails ? `실패 ${fails}` : '저장·불러오기 검사 통과');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
