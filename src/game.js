/* 게임 규칙 — 잠수함의 움직임, 어뢰·기뢰·대함미사일, 바닷속과 물 위의 적, 보스와 그 팔다리.
   한 걸음은 1/60초다. 속도는 '한 걸음에 몇 칸'으로 적는다. */
(function () {
  'use strict';
  const DS = window.DS, W = DS.W, VH = DS.VH, SEA = DS.SEA, PI = Math.PI;
  /* 잠수함: 가속·물의 저항(속도에 곱하는 값)·몸 크기·수면 아래 최소 깊이, 어뢰와 폭탄 */
  const K = DS.K = { AX: 0.06, AY: 0.055, DX: 0.972, DY: 0.95, HW: 15, HH: 7.5, TOP: 10, TURN: 14, TMAX: 2, TCD: 22, BMAX: 10, BCD: 30, INV: 70, EXT: 30000 };
  const EN = DS.EN = {
    mini: { spr: 'mini', hw: 12, hh: 5.5, hp: 8, sc: 100, hit: 14, name: '작은 잠수정' },
    angler: { spr: 'angler', hw: 10, hh: 8.5, hp: 10, sc: 150, hit: 16, name: '초롱아귀' },
    shrimp: { spr: 'shrimp', hw: 5.5, hh: 3.5, hp: 2, sc: 30, hit: 6, name: '새우' },
    hair: { spr: 'hair', hw: 3.5, hh: 14, hp: 6, sc: 80, hit: 12, name: '갈치' },
    emine: { spr: 'emine', hw: 6, hh: 6, hp: 4, sc: 50, name: '계류 기뢰' },
    vent: { spr: 'chim', hp: 0, gr: 1, name: '열수 굴뚝' },
    frig: { spr: 'frig', hw: 31, hh: 12, oy: 5, hp: 24, sc: 400, ship: 1, spd: 0.3, name: '호위함' },
    dest: { spr: 'dest', hw: 41, hh: 12, oy: 5, hp: 36, sc: 600, ship: 1, spd: 0.26, name: '구축함' },
    aegis: { spr: 'aegis', hw: 49, hh: 12, oy: 5, hp: 60, sc: 1000, ship: 1, spd: 0.2, name: '이지스함' },
    plane: { spr: 'plane', hw: 18, hh: 5, hp: 8, sc: 300, air: 1, name: '전투기' },
    tad: { spr: 'tad', hw: 4.5, hh: 3, hp: 2, sc: 20, hit: 8, name: '올챙이' }
  };
  /* 보스. kind: crab 바닥을 걷는다 · float 떠 있다 · swim 옆모습으로 헤엄친다 · frog 바닥에 앉아 뛴다.
     limbs: [종류, 몸 가운데에서 본 뿌리 자리 x, y]. side가 있으면 바라보는 쪽에 따라 x를 뒤집는다. acts: 차례로 되풀이하는 행동 */
  const BOSS = DS.BOSS = {
    crab: { name: '꽃게', spr: 'b_crab', kind: 'crab', hp: 90, hw: 30, hh: 16, by: 5, oy: 26, sc: 2000, ls: 1.1,
      limbs: [['claw', -30, 2.5], ['claw', 30, 2.5]], acts: [['rest', 30], ['L', 1], ['walk'], ['L', 2], ['bub', 4], ['walk']] },
    octo: { name: '문어', spr: 'b_octo', kind: 'float', hp: 170, hw: 27, hh: 27, by: -5, sc: 4000, ls: 1.1,
      limbs: [['arm', -15, 12], ['arm', 15, 12], ['arm', 0, 17]], acts: [['rest', 30], ['L', 1], ['ink', 3], ['L', 2], ['move'], ['S'], ['fan', 5], ['move']] },
    frog: { name: '개구리', spr: 'b_frog', kind: 'frog', hp: 100, hw: 30, hh: 19, oy: 24.5, sc: 2400, ls: 1, side: 1,
      limbs: [['tongue', 30, 2.5]], acts: [['rest', 30], ['L', 1], ['hop'], ['L', 1], ['tad', 3], ['hop'], ['bub', 4]] },
    squid: { name: '오징어', spr: 'b_squid', kind: 'swim', hp: 190, hw: 40, hh: 11, sc: 4500, ls: 1, side: 1,
      limbs: [['arm', 40, -4], ['arm', 40, 4]], acts: [['rest', 30], ['L', 1], ['ink', 4], ['dash'], ['L', 2], ['fan', 5], ['dash'], ['S']] },
    hermit: { name: '소라게', spr: 'b_hermit', kind: 'crab', hp: 120, hw: 22, hh: 24, by: -2, oy: 34, sc: 2800, ls: 1,
      limbs: [['claw', -19, 18], ['claw', 19, 18]], acts: [['rest', 30], ['L', 1], ['ring', 8], ['walk'], ['L', 2], ['sh', 4], ['walk']] },
    king: { name: '킹크랩', spr: 'b_king', kind: 'crab', hp: 230, hw: 36, hh: 19, by: 6, oy: 29, sc: 5000, ls: 1.35,
      limbs: [['claw', -36, 2], ['claw', 36, 2]], acts: [['rest', 30], ['L', 2], ['walk'], ['S'], ['bub', 6], ['L', 2], ['wall'], ['walk']] },
    cuttle: { name: '갑오징어', spr: 'b_cuttle', kind: 'swim', hp: 140, hw: 30, hh: 13, sc: 3200, ls: 0.9, side: 1,
      limbs: [['arm', 30, -3], ['arm', 30, 3]], acts: [['rest', 30], ['cloud'], ['L', 2], ['fan', 5], ['dash'], ['L', 1], ['ink', 4], ['move']] },
    gocto: { name: '대왕문어', spr: 'b_gocto', kind: 'float', hp: 280, hw: 31, hh: 30, by: -4, sc: 6000, ls: 1.3,
      limbs: [['arm', -18, 14], ['arm', 18, 14], ['arm', -6, 20], ['arm', 6, 20]], acts: [['rest', 30], ['L', 2], ['fan', 7], ['S'], ['move'], ['L', 3], ['ring', 10], ['cloud'], ['move']] },
    newt: { name: '도롱뇽', spr: 'b_newt', kind: 'swim', hp: 160, hw: 40, hh: 10, sc: 3600, ls: 1, side: 1,
      limbs: [['tongue', 40, 1]], acts: [['rest', 30], ['L', 1], ['bub', 5], ['dash'], ['L', 1], ['tad', 4], ['move'], ['fan', 5]] },
    gsquid: { name: '대왕오징어', spr: 'b_gsquid', kind: 'swim', hp: 320, hw: 56, hh: 15, sc: 7000, ls: 1.3, side: 1,
      limbs: [['arm', 56, -6], ['arm', 56, 6], ['arm', 52, 0]], acts: [['rest', 30], ['L', 2], ['dash'], ['fan', 7], ['S'], ['L', 3], ['wall'], ['dash'], ['sh', 5]] },
    spider: { name: '거미게', spr: 'b_spider', kind: 'crab', hp: 180, hw: 16, hh: 14, oy: 30, sc: 4000, ls: 1.1,
      limbs: [['leg', -14, -6], ['leg', 14, -6], ['leg', -10, -9], ['leg', 10, -9]], acts: [['rest', 30], ['L', 2], ['walk'], ['L', 3], ['ring', 8], ['walk'], ['L', 2], ['sh', 5]] },
    toad: { name: '두꺼비 왕', spr: 'b_toad', kind: 'frog', hp: 360, hw: 40, hh: 28, oy: 35, sc: 8000, ls: 1.5, side: 1,
      limbs: [['tongue', 44, 3]], acts: [['rest', 30], ['L', 1], ['tad', 4], ['hop'], ['L', 1], ['bub', 7], ['wall'], ['hop'], ['L', 1], ['ring', 10]] },
    naut: { name: '앵무조개', spr: 'b_naut', kind: 'swim', hp: 220, hw: 27, hh: 27, bx: -6, by: -4, sc: 5000, ls: 0.9, side: 1,
      limbs: [['arm', 32, 8], ['arm', 34, 14], ['arm', 30, 20]], acts: [['rest', 30], ['L', 2], ['ring', 10], ['dash'], ['L', 3], ['fan', 7], ['move'], ['cloud']] },
    kraken: { name: '크라켄', spr: 'b_kraken', kind: 'float', hp: 460, hw: 44, hh: 44, by: -4, sc: 12000, ls: 1.6,
      limbs: [['arm', -26, 20], ['arm', 26, 20], ['arm', -10, 28], ['arm', 10, 28]], acts: [['rest', 30], ['L', 2], ['edge', 2], ['fan', 9], ['S'], ['move'], ['L', 3], ['ring', 12], ['edge', 3], ['cloud'], ['L', 4], ['wall'], ['move']] }
  };
  /* 팔다리: 닿는 거리·굵기(뿌리, 끝)·예고·뻗기·머물기·거두기 걸음 수·데미지·끝의 크기 */
  const LIMB = DS.LIMB = {
    arm: { reach: 170, w0: 5.2, w1: 1.5, tele: 38, out: 9, hold: 16, back: 18, dmg: 22, tip: 3, name: '다리' },
    tongue: { reach: 200, w0: 2.2, w1: 1.8, tele: 26, out: 6, hold: 10, back: 12, dmg: 18, tip: 4.5, name: '혀' },
    claw: { reach: 115, w0: 3.6, w1: 3, tele: 40, out: 8, hold: 14, back: 16, dmg: 28, tip: 9, name: '집게발' },
    leg: { reach: 150, w0: 2.6, w1: 1.2, tele: 34, out: 7, hold: 12, back: 14, dmg: 20, tip: 2.5, name: '다리' },
    edge: { reach: 215, w0: 7, w1: 2, tele: 46, out: 11, hold: 22, back: 22, dmg: 26, tip: 3.5, name: '다리' }
  };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const ease = t => t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) * (1 - t);

  /* 팔다리의 가운데 선: 뿌리 (ax, ay)에서 끝까지 점 11개 [x, y, 반지름]. 규칙과 그리기가 같은 선을 쓴다 */
  DS.limbPts = function (l, ax, ay, t) {
    const D = LIMB[l.ty], n = 11, out = [], s = l.s || 1, sd = l.sd || 1;
    const dx = l.tx - ax, dy = l.ty2 - ay, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, px = -uy, py = ux, e = l.ext, Ln = len * e;
    if (l.ty === 'claw' || l.ty === 'leg') {      // 팔꿈치가 꺾인 두 마디
      const bend = (D.reach * 0.26 * (1 - e * 0.8) + 5) * sd * s, ex = ax + ux * Ln * 0.5 + px * bend, ey = ay + uy * Ln * 0.5 + py * bend, tx = ax + ux * Ln, ty = ay + uy * Ln;
      for (let i = 0; i < n; i++) { const u = i / (n - 1), w = (D.w0 + (D.w1 - D.w0) * u) * s; if (u < 0.5) out.push([ax + (ex - ax) * u * 2, ay + (ey - ay) * u * 2, w]); else out.push([ex + (tx - ex) * (u - 0.5) * 2, ey + (ty - ey) * (u - 0.5) * 2, w]); }
    } else {                                       // 휘어지는 다리·혀
      const bend = len * 0.24 * (1 - e * 0.85) * sd, wig = (1 - e) * 3.2 * s + (l.st === 3 || l.st === 5 ? 0.9 : 0), cx = ax + ux * Ln * 0.5 + px * bend, cy = ay + uy * Ln * 0.5 + py * bend, tx = ax + ux * Ln, ty = ay + uy * Ln, ph = l.ph || 0;
      for (let i = 0; i < n; i++) { const u = i / (n - 1), v = 1 - u, g = Math.sin(u * 7 + t * 0.22 + ph) * wig * u; out.push([v * v * ax + 2 * v * u * cx + u * u * tx + px * g, v * v * ay + 2 * v * u * cy + u * u * ty + py * g, (D.w0 + (D.w1 - D.w0) * Math.pow(u, 0.8)) * s]); }
    }
    return out;
  };

  function Game(o) {
    this.sfx = o.sfx || function () { }; this.god = !!o.god; this.hi = o.hi || 0;
    this.life0 = o.lives; this.lives = o.lives; this.score = 0; this.conts = 0; this.next = K.EXT;
    this.bomb0 = o.bombs == null ? 4 : o.bombs; this.bombs = this.bomb0; this.bsel = 'mine'; this.rng = DS.RNG(20261124); this.nid = 0;
    this.startStage(o.stage || 0);
  }
  const G = Game.prototype;
  G.mk = function (k, x, y) { const d = EN[k], id = this.nid++; return { k: k, d: d, id: id, x: x, y: y, y0: y, home: x, hp: d.hp, t: (id * 37) % 200, cd: 70 + (id * 53) % 90, cd2: 200, dir: -1, pd: id % 2 ? 1 : -1, r: 0, st: 0, vx: 0, vy: 0, flash: 0, ph: id * 1.7 }; };

  G.startStage = function (i) {
    const L = this.L = DS.buildStage(i), T = this; this.stage = i; this.S = DS.STAGES[i];
    this.t = 0; this.mode = 'brief'; this.modeT = 0; this.shake = 0; this.msg = null; this.why = ''; this.kills = 0; this.bonus = 0;
    this.shots = []; this.bullets = []; this.en = []; this.items = []; this.fx = []; this.pops = []; this.trigs = []; this.bubs = []; this.clouds = [];
    this.boss = null; this.lock = null; this.gates = L.gates.map(g => ({ x: g.x, b: g.b, mid: !!g.mid, st: 0 }));
    this.bombs = Math.max(this.bombs, this.bomb0);
    L.ob.forEach(o => {
      if (o.k === 'gate') return;
      if (o.k === 'star' || o.k === 'box') { T.items.push({ k: o.k, w: o.w, x: o.x, y: o.y, t: (T.nid++) * 17 }); return; }
      if (o.k === 'trig') { T.trigs.push({ x: o.x, w: o.w, cd: 0 }); return; }
      if (o.k === 'shrimp') { for (let k = 0; k < o.n; k++) T.en.push(T.mk('shrimp', o.x + k * 13, o.y + (k % 2 ? 7 : -7))); return; }
      const e = T.mk(o.k, o.x, o.y == null ? 100 : o.y); e.r = o.r || 40;
      if (e.d.ship) { e.y = e.y0 = SEA; }
      else if (o.k === 'vent') { e.y = e.y0 = L.gAt(o.x); }
      T.en.push(e);
    });
    this.cp = { x: 60, y: 100 };
    this.pl = { x: 60, y: 100, vx: 0, vy: 0, face: 1, turn: 0, dmg: 0, inv: 0, dead: 0, boomed: false, cool: 0, bcool: 0, rot: 0 };
    this.look = 50; this.cam = 0;
  };

  /* ───────── 바다 밑·지붕을 잠수함 너비만큼 훑어본다 ───────── */
  G.floor = function (x) { const L = this.L; let m = 1e9; for (let i = -13; i <= 13; i += 2) { const v = L.gAt(x + i); if (v < m) m = v; } return m; };
  G.roof = function (x) { const L = this.L; let m = SEA; for (let i = -13; i <= 13; i += 2) { const v = L.cAt(x + i); if (v > m) m = v; } return m > SEA ? Math.max(SEA + K.TOP, m + K.HH) : SEA + K.TOP; };
  G.inRock = function (x, y) { const L = this.L; if (x < 0 || x > L.len) return true; const c = L.cAt(x); return y > L.gAt(x) || (c > SEA && y < c); };
  G.iced = function (x) { return this.L.cAt(x) > SEA; };      // 수면이 얼음·바위로 덮인 곳

  /* ───────── 보조: 효과·점수·데미지 ───────── */
  G.addFx = function (k, x, y, o) { const n = k === 'hit' ? 2 : k === 'splash' ? 3 : k === 'sink' ? 1 : DS.BOOM[k.slice(5)]; this.fx.push(Object.assign({ k: k, x: x, y: y, t: 0, n: n, rate: k === 'hit' ? 3 : k === 'boom_l' ? 5 : k === 'sink' ? 110 : 4 }, o || {})); };
  G.bub = function (x, y, r, life) { const B = this.bubs; if (B.length > 110) B.shift(); B.push({ x: x, y: y, r: r || 1, t: 0, life: life || 60, ph: (x * 7 + y * 3) % 6.28 }); };
  G.pop = function (txt, x, y) { this.pops.push({ txt: txt, x: x, y: y, t: 0 }); };
  G.say = function (txt, dur) { this.msg = { txt: txt, t: dur || 150 }; };
  G.add = function (n) {
    this.score += n; if (this.score > this.hi) this.hi = this.score;
    while (this.score >= this.next) { this.next += K.EXT; if (this.lives < 9) { this.lives++; this.say('잠수함 +1', 120); this.sfx('extend'); } }
  };
  G.damage = function (n) {
    const p = this.pl; if (p.dead || p.inv > 0 || this.god || this.mode !== 'play') return false;
    p.dmg += n; p.inv = K.INV; this.shake = Math.max(this.shake, 6); this.sfx('boom_s'); this.addFx('hit', p.x, p.y);
    if (p.dmg >= 100) this.sink();
    return true;
  };
  G.hurt = function (n) {      // 물기둥·바위처럼 닿아 있는 동안 조금씩 쌓이는 데미지
    const p = this.pl; if (p.dead || this.god || this.mode !== 'play') return;
    p.dmg += n; if (this.t % 14 === 0) this.sfx('tick');
    if (p.dmg >= 100) this.sink();
  };
  G.bump = function (v) { this.sfx('bump'); if (v > 1.25) { this.hurt(2 + v * 2); this.shake = Math.max(this.shake, 3); } };
  G.sink = function () { const p = this.pl; p.dmg = 100; p.dead = 1; p.boomed = false; p.vy = 0.2; this.sfx('die'); this.shake = 10; };
  /* 터지는 자리. o.foe: 반지름 안의 적·보스가 받는 데미지 · o.me: 잠수함이 받는 데미지 · o.clear: 적의 탄을 지운다 */
  G.blast = function (x, y, r, o) {
    const big = r > 30; this.addFx(big ? 'boom_l' : r > 18 ? 'boom_m' : 'boom_s', x, y); this.sfx(big ? 'bomb' : r > 18 ? 'boom' : 'boom_s'); if (r > 18) this.shake = Math.max(this.shake, big ? 8 : 5);
    for (let k = 0; k < (big ? 8 : 4); k++) this.bub(x + (this.rng() - 0.5) * r, y + (this.rng() - 0.5) * r * 0.6, 1 + this.rng() * 1.6, 50 + this.rng() * 40);
    if (o.foe) {
      for (let i = 0; i < this.en.length; i++) { const e = this.en[i], d = e.d; if (e.dead || !d.hp) continue; if (d.air && !o.air) continue; if (Math.abs(e.x - x) < r + d.hw * 0.7 && Math.abs(e.y + (d.oy || 0) - y) < r + d.hh * 0.7) this.hit(e, o.foe); }
      const b = this.boss;
      if (b && !b.dead && b.st === 'fight') {
        if (Math.abs(b.x + (b.d.bx || 0) * b.dir - x) < r + b.d.hw * 0.8 && Math.abs(b.y + (b.d.by || 0) - y) < r + b.d.hh * 0.8) this.hitBoss(o.foe);
        for (let i = 0; i < b.limbs.length; i++) { const l = b.limbs[i]; if (l.st !== 2 && l.st !== 3 && l.st !== 5) continue; const a = this.anchor(b, l), P = DS.limbPts(l, a[0], a[1], this.t); for (let j = 3; j < P.length; j++) if (Math.hypot(P[j][0] - x, P[j][1] - y) < r) { l.st = 4; l.t = 0; this.hitBoss(Math.ceil(o.foe / 2)); break; } }
      }
    }
    if (o.clear) for (let i = this.bullets.length - 1; i >= 0; i--) { const q = this.bullets[i]; if (Math.hypot(q.x - x, q.y - y) < r + 4) { this.addFx('hit', q.x, q.y); this.bullets.splice(i, 1); } }
    if (o.me) { const p = this.pl; if (Math.abs(p.x - x) < r * 0.85 + K.HW * 0.6 && Math.abs(p.y - y) < r * 0.85 + K.HH * 0.6) this.damage(o.me); }
  };
  G.hit = function (e, dmg, quiet) {
    if (e.dead) return;
    e.hp -= dmg; e.flash = 6;
    if (e.hp > 0) { this.sfx('tick'); return; }
    e.dead = true; this.kills++;
    const d = e.d, y = e.y + (d.oy || 0);
    if (d.sc && !e.sum) { this.add(d.sc); if (d.sc >= 80) this.pop('+' + d.sc, e.x, y - 12); } else if (d.sc) this.add(10);
    if (e.k === 'emine') { this.blast(e.x, e.y, 22, { foe: 12, me: 22 }); return; }
    if (d.ship) {
      this.addFx('boom_l', e.x, SEA - 4); this.addFx('boom_m', e.x - d.hw * 0.5, SEA + 2); this.addFx('sink', e.x, SEA, { spr: d.spr, dir: e.pd }); this.sfx('bigboom'); this.shake = Math.max(this.shake, 9);
      this.items.push({ k: 'box', w: 'B', x: e.x, y: SEA + 16, t: 0, fy: SEA + 56 });
      return;
    }
    if (quiet) { this.addFx('hit', e.x, y); return; }
    const big = e.k === 'mini' || e.k === 'angler' || e.k === 'plane';
    this.addFx(big ? 'boom_m' : 'boom_s', e.x, y); this.sfx(big ? 'boom' : 'boom_s');
    if (!d.air) for (let k = 0; k < 3; k++) this.bub(e.x + (this.rng() - 0.5) * 10, y, 1 + this.rng(), 50);
  };
  G.hitBoss = function (dmg) {
    const b = this.boss; if (!b || b.dead || b.st !== 'fight') return;
    b.hp -= dmg; b.flash = 6; this.sfx('tick');
    if (b.hp <= 0) { b.hp = 0; b.dead = 1; b.act = null; b.q = []; b.limbs = b.limbs.filter(l => !l.tmp); b.limbs.forEach(l => { l.st = 0; }); this.bullets = []; this.en.forEach(e => { if (e.sum) this.hit(e, 99, true); }); this.sfx('bossdie'); this.shake = 12; }
  };

  /* ───────── 잠수함 조종 ─────────
     물의 저항이 커서 천천히 붙고 천천히 멎는다. 발사를 누르고 있는 동안에는 바라보는 쪽이 바뀌지 않는다 */
  G.turnTo = function (sg) { const p = this.pl; if (p.face === sg) return; p.face = sg; p.turn = K.TURN; };
  G.tubes = function () { let n = 0; for (let i = 0; i < this.shots.length; i++) if (this.shots[i].k === 'torp') n++; return K.TMAX - n; };
  G.ctrl = function (inp) {
    const p = this.pl, L = this.L;
    if (inp.l) { p.vx -= K.AX; if (!inp.a) this.turnTo(-1); }
    if (inp.r) { p.vx += K.AX; if (!inp.a) this.turnTo(1); }
    if (inp.u) p.vy -= K.AY; if (inp.d) p.vy += K.AY;
    p.vx *= K.DX; p.vy *= K.DY; if (p.turn > 0) p.turn--;
    // 가로: 벼랑과 보스 방의 끝
    const lo = this.lock ? this.lock.x0 + 16 : 16, hi = this.lock ? this.lock.x1 - 16 : L.len - 16;
    let nx = p.x + p.vx;
    if (nx < lo) { nx = Math.min(lo, p.x + 1.5); if (p.vx < 0) p.vx = 0; } else if (nx > hi) { nx = Math.max(hi, p.x - 1.5); if (p.vx > 0) p.vx = 0; }
    const sg = p.vx > 0 ? 1 : -1;
    if (this.inRock(nx + sg * (K.HW * 0.9), p.y - 2) || this.inRock(nx + sg * (K.HW * 0.9), p.y + K.HH - 3)) { this.bump(Math.abs(p.vx)); nx = p.x; p.vx = -p.vx * 0.3; }
    p.x = nx;
    // 세로: 바다 밑과 수면·지붕
    p.y += p.vy;
    const fl = this.floor(p.x) - K.HH, rf = this.roof(p.x);
    if (fl < rf) { p.y = (fl + rf) / 2; p.vy = 0; }
    else {
      if (p.y > fl) { if (p.vy > 0.5) this.bump(p.vy); p.y = fl; p.vy = p.vy > 0.4 ? -p.vy * 0.3 : 0; }
      if (p.y < rf) { const hard = rf > SEA + K.TOP + 0.5; if (hard && p.vy < -0.5) this.bump(-p.vy); p.y = rf; p.vy = hard && p.vy < -0.4 ? -p.vy * 0.3 : Math.max(0, p.vy); }
    }
    p.rot += (clamp(p.vy * 0.14, -0.2, 0.2) - p.rot) * 0.15;
    if (this.t % 7 === 0 && Math.abs(p.vx) + Math.abs(p.vy) > 0.4) this.bub(p.x - p.face * 22, p.y + (this.rng() - 0.5) * 4, 0.7 + this.rng() * 0.8, 40);
    // 어뢰: 관은 둘. 앞의 것이 터지거나 화면을 벗어나야 다음 것을 쏜다
    if (p.cool > 0) p.cool--; if (p.bcool > 0) p.bcool--;
    if (inp.a && p.cool <= 0 && this.tubes() > 0) { this.shots.push({ k: 'torp', x: p.x + p.face * 13, y: p.y + 4.5, vx: p.vx * 0.5 + p.face * 0.4, vy: 0.45, d: p.face, t: 0 }); p.cool = K.TCD; this.sfx('torp'); }
    if (inp.selEdge) { this.bsel = this.bsel === 'mine' ? 'ssm' : 'mine'; this.sfx('tick'); this.say(this.bsel === 'mine' ? '기뢰' : '대함미사일', 50); }
    if (inp.bEdge && p.bcool <= 0) {
      if (this.bombs <= 0) { this.sfx('tick'); this.say('폭탄이 없다', 50); }
      else {
        this.bombs--; p.bcool = K.BCD;
        if (this.bsel === 'mine') { this.shots.push({ k: 'mine', x: p.x, y: p.y + 9, vx: p.vx * 0.4, vy: 0.75, t: 0 }); this.sfx('mine'); }
        else { this.shots.push({ k: 'ssm', x: p.x + p.face * 2, y: p.y - 11, vx: 0, vy: -1.2, d: p.face, t: 0, st: 0, a: -PI / 2 }); this.sfx('ssm'); }
      }
    }
  };

  /* ───────── 한 걸음 ───────── */
  G.update = function (inp) {
    this.modeT++;
    if (this.mode === 'brief') { this.t++; if (this.modeT > 20 && (inp.ok || inp.aEdge || inp.tap)) { this.mode = 'play'; this.modeT = 0; this.pl.cool = 16; this.sfx('ok'); } return; }
    if (this.mode === 'clear') { this.t++; this.stepFx(); if (this.modeT > 130 && (inp.ok || inp.aEdge || inp.tap)) this.mode = 'next'; return; }
    if (this.mode !== 'play') { this.t++; this.stepFx(); return; }
    const p = this.pl, L = this.L; this.t++;
    if (this.shake > 0) this.shake -= 0.5; if (this.msg && --this.msg.t <= 0) this.msg = null;
    if (p.inv > 0) p.inv--;
    if (!p.dead) this.ctrl(inp);
    else {      // 가라앉는다
      p.dead++; p.vy = p.vy * 0.97 + 0.02; p.vx *= 0.96; p.x = clamp(p.x + p.vx, 16, L.len - 16); p.y += p.vy; p.rot += 0.018;
      if (this.t % 4 === 0 && !p.boomed) this.bub(p.x + (this.rng() - 0.5) * 20, p.y - 4, 1 + this.rng() * 1.4, 70);
      const fl = L.gAt(p.x) - 5;
      if (!p.boomed && (p.y >= fl || p.dead > 100)) { p.boomed = true; p.y = Math.min(p.y, fl); this.addFx('boom_l', p.x, p.y); this.sfx('bigboom'); this.shake = 14; }
      if (p.boomed) { p.vy = 0; p.vx = 0; }
      if (p.dead > 165) {
        this.lives--;
        if (this.lives <= 0) { this.mode = 'over'; this.modeT = 0; this.why = '잠수함을 모두 잃었다'; return; }
        Object.assign(p, { x: this.cp.x, y: this.cp.y, vx: 0, vy: 0, face: 1, turn: 0, dmg: 0, inv: 150, dead: 0, boomed: false, rot: 0, cool: 0, bcool: 0 });
        this.bullets = []; this.say('새 잠수함이 나선다');
      }
    }
    // 보스 방에 들어서면 화면이 멈춘다
    if (!this.lock && !p.dead) for (let i = 0; i < this.gates.length; i++) { const gt = this.gates[i]; if (gt.st === 0 && p.x > gt.x - 150) { this.enter(i); break; } }
    this.stepShots(); this.stepEnemies(); this.stepBoss(); this.stepBullets(); this.stepItems(); this.stepFx();
    // 화면: 바라보는 쪽과 가는 쪽을 조금 더 보여 준다
    if (this.lock) this.cam += (this.lock.x0 - this.cam) * 0.07;
    else { this.look += ((p.face * 52 + p.vx * 20) - this.look) * 0.04; this.cam += (clamp(p.x - W / 2 + this.look, 0, L.len - W) - this.cam) * 0.12; }
  };

  /* ───────── 어뢰·기뢰·대함미사일 ───────── */
  G.stepShots = function () {
    const S = this.shots, E = this.en, cam = this.cam, L = this.L, b = this.boss, T = this;
    const foeAt = (x, y, rx, ry, air) => { for (let i = 0; i < E.length; i++) { const e = E[i], d = e.d; if (e.dead || !d.hp || (!!d.air !== !!air && !(air === 2))) continue; if (Math.abs(e.x - x) < d.hw + rx && Math.abs(e.y + (d.oy || 0) - y) < d.hh + ry) return e; } return null; };
    const bossAt = (x, y, r) => b && !b.dead && b.st === 'fight' && Math.abs(b.x + (b.d.bx || 0) * b.dir - x) < b.d.hw + r && Math.abs(b.y + (b.d.by || 0) - y) < b.d.hh + r;
    const limbAt = (x, y, r) => { if (!b || b.dead) return null; for (let i = 0; i < b.limbs.length; i++) { const l = b.limbs[i]; if (l.st !== 2 && l.st !== 3 && l.st !== 5) continue; const a = T.anchor(b, l), P = DS.limbPts(l, a[0], a[1], T.t); for (let j = 2; j < P.length; j++) if (Math.hypot(P[j][0] - x, P[j][1] - y) < P[j][2] + r) return l; } return null; };
    for (let i = S.length - 1; i >= 0; i--) {
      const s = S[i]; s.t++;
      if (s.k === 'torp') {
        if (s.t <= 12) { s.vy *= 0.9; s.vx *= 0.97; } else { s.vx += s.d * 0.11; if (Math.abs(s.vx) > 4.4) s.vx = s.d * 4.4; s.vy *= 0.8; if (s.t % 3 === 0) this.bub(s.x - s.d * 9, s.y + (this.rng() - 0.5) * 2, 0.6 + this.rng() * 0.7, 26); }
        s.x += s.vx; s.y += s.vy;
        if (s.x < cam - 40 || s.x > cam + W + 40) { S.splice(i, 1); continue; }
        let boom = this.inRock(s.x + s.d * 7, s.y);
        const e = foeAt(s.x + s.d * 4, s.y, 5, 2.5, 0);
        if (e) { this.hit(e, 10); boom = true; }
        else if (bossAt(s.x + s.d * 4, s.y, 3)) { this.hitBoss(10); boom = true; }
        else { const l = limbAt(s.x + s.d * 4, s.y, 3.5); if (l) { l.st = 4; l.t = 0; this.hitBoss(5); boom = true; } }
        if (!boom) for (let j = this.bullets.length - 1; j >= 0; j--) { const q = this.bullets[j]; if (q.k !== 'eb' && Math.abs(q.x - s.x) < 9 && Math.abs(q.y - s.y) < 7) { this.bullets.splice(j, 1); boom = true; break; } }
        if (boom) {      // 터지면 둘레 16칸의 작은 적도 함께 다친다
          this.addFx('boom_s', s.x + s.d * 5, s.y); this.sfx('boom_s');
          for (let j = 0; j < E.length; j++) { const o = E[j]; if (o !== e && !o.dead && o.d.hp && !o.d.air && Math.hypot(o.x - s.x, o.y + (o.d.oy || 0) - s.y) < 16 + o.d.hw * 0.5) this.hit(o, 4); }
          S.splice(i, 1);
        }
      } else if (s.k === 'mine') {      // 천천히 가라앉다가 적이 닿거나 조금 지나면 터진다
        s.vy += (0.3 - s.vy) * 0.05; s.vx *= 0.96; s.x += s.vx; s.y += s.vy;
        const fl = L.gAt(s.x) - 4; if (s.y > fl) { s.y = fl; s.vy = 0; }
        if (s.t >= 100 || (s.t > 16 && (foeAt(s.x, s.y, 9, 9, 0) || bossAt(s.x, s.y, 8) || limbAt(s.x, s.y, 8)))) { this.blast(s.x, s.y, 44, { foe: 26, clear: true }); S.splice(i, 1); }
      } else {                           // 대함미사일: 위로 솟아 수면을 뚫고 가까운 군함·전투기를 쫓는다
        if (s.st === 0) {
          s.vy = Math.max(-3.4, s.vy - 0.16); s.y += s.vy; if (s.t % 2 === 0) this.bub(s.x, s.y + 9, 0.8 + this.rng(), 30);
          const e = foeAt(s.x, s.y - 4, 3, 5, 0);
          if (e || bossAt(s.x, s.y - 4, 3) || (this.iced(s.x) && s.y < L.cAt(s.x) + 5)) { this.blast(s.x, s.y, 24, { foe: 30, air: true, clear: true }); S.splice(i, 1); continue; }
          if (s.y < SEA - 3) {
            s.st = 1; s.t = 0; this.addFx('splash', s.x, SEA - 6); this.sfx('splash'); s.vx = 0; s.vy = -3.2; s.tg = -1; let bd = 300;
            for (let j = 0; j < E.length; j++) { const o = E[j]; if (o.dead || !(o.d.ship || o.d.air)) continue; const dd = Math.abs(o.x - s.x); if (dd < bd) { bd = dd; s.tg = o.id; } }
          }
        } else {
          let tg = null; if (s.tg >= 0) for (let j = 0; j < E.length; j++) if (E[j].id === s.tg && !E[j].dead) { tg = E[j]; break; }
          if (tg) {
            const want = Math.atan2((tg.d.ship ? SEA - 5 : tg.y) - s.y, tg.x - s.x); let da = want - s.a; while (da > PI) da -= 2 * PI; while (da < -PI) da += 2 * PI;
            if (s.t > 8) s.a += clamp(da, -0.13, 0.13); s.vx = Math.cos(s.a) * 3.5; s.vy = Math.sin(s.a) * 3.5;
          } else { s.vx = clamp(s.vx + s.d * 0.1, -2.4, 2.4); s.vy += 0.1; s.a = Math.atan2(s.vy, s.vx); }
          s.x += s.vx; s.y += s.vy;
          const e = foeAt(s.x, s.y, 3, 4, 2), down = s.y >= SEA - 1 && s.vy > 0;
          if ((e && (e.d.ship || e.d.air)) || down || s.t > 240 || s.y < -60) { this.blast(s.x, Math.min(s.y, SEA - 2), 26, { foe: 30, air: true }); if (down) { this.addFx('splash', s.x, SEA - 6); this.sfx('splash'); } S.splice(i, 1); }
        }
      }
    }
  };

  /* ───────── 적 ───────── */
  G.eb = function (k, x, y, vx, vy, o) { this.bullets.push(Object.assign({ k: k, x: x, y: y, vx: vx, vy: vy, t: 0 }, o || {})); };
  G.aim = function (x, y, sp, da) { const p = this.pl, a = Math.atan2(p.y - y, p.x - x) + (da || 0); this.eb('eb', x, y, Math.cos(a) * sp, Math.sin(a) * sp); };
  G.spawnPlane = function () { const p = this.pl, side = (this.nid & 1) ? 1 : -1, e = this.mk('plane', p.x + side * 330, 11); e.vx = -side * 2.1; e.n = 2; e.cd = 0; this.en.push(e); this.say('전투기가 온다', 90); this.sfx('warn'); };
  G.stepEnemies = function () {
    const p = this.pl, L = this.L, E = this.en, cam = this.cam, live = !p.dead;
    for (let i = 0; i < this.trigs.length; i++) { const q = this.trigs[i]; if (q.cd > 0) q.cd--; else if (live && Math.abs(p.x - q.x) < 24) { q.cd = 1200; this.spawnPlane(); } }
    for (let i = E.length - 1; i >= 0; i--) {
      const e = E[i], d = e.d, k = e.k;
      if (e.dead) { E.splice(i, 1); continue; }
      if (e.flash > 0) e.flash--;
      if (k !== 'plane' && (e.x < cam - 130 || e.x > cam + W + 130)) { if (e.sum) E.splice(i, 1); continue; }      // 화면에서 먼 것은 쉰다
      e.t++;
      const dx = p.x - e.x, dy = p.y - e.y, adx = Math.abs(dx), fl = L.gAt(e.x);
      if (k === 'mini') {
        if (adx < 220) e.dir = dx > 0 ? 1 : -1;
        e.x += e.pd * 0.35; if (Math.abs(e.x - e.home) > e.r) e.pd = e.x > e.home ? -1 : 1;
        if (live && adx < 220) e.y += clamp(clamp(p.y, e.y0 - 40, e.y0 + 40) - e.y, -0.25, 0.25);
        e.y = clamp(e.y, this.roof(e.x) + 2, fl - 8);
        if (--e.cd <= 0 && live && adx < 210 && adx > 30 && Math.abs(dy) < 24) { this.eb('etorp', e.x + e.dir * 13, e.y + 2, e.dir * 1.1, 0, { d: e.dir }); e.cd = 150 + ((this.rng() * 70) | 0); this.sfx('eshot'); }
      } else if (k === 'angler') {
        if (e.st === 0) { e.y += (e.y0 + Math.sin(e.t * 0.04 + e.ph) * 6 - e.y) * 0.05; if (adx < 240) e.dir = dx > 0 ? 1 : -1; if (--e.cd <= 0 && live && Math.hypot(dx, dy) < 125) { e.st = 1; e.t2 = 0; } }
        else if (e.st === 1) { if (++e.t2 >= 26) { const l = Math.hypot(dx, dy) || 1; e.vx = dx / l * 2.2; e.vy = dy / l * 2.2; e.dir = dx > 0 ? 1 : -1; e.st = 2; e.t2 = 0; this.sfx('whip'); } }
        else { e.x += e.vx; e.y += e.vy; e.vx *= 0.985; e.vy *= 0.985; if (++e.t2 >= 46) { e.st = 0; e.cd = 90; e.y0 = clamp(e.y, SEA + 30, fl - 20); } }
        e.y = clamp(e.y, this.roof(e.x) + 4, fl - 10);
      } else if (k === 'shrimp') {
        if (live && adx < 260) { e.x += (dx > 0 ? 1 : -1) * 0.55; e.dir = dx > 0 ? 1 : -1; e.y0 += clamp(p.y - e.y0, -0.14, 0.14); }
        e.y = clamp(e.y0 + Math.sin(e.t * 0.07 + e.ph) * 9, SEA + 8, fl - 5);
      } else if (k === 'hair') {
        e.y = clamp(e.y0 + Math.sin(e.t * 0.03 + e.ph) * 36, this.roof(e.x) + 8, fl - 15);
        if (--e.cd <= 0 && live && adx < 160 && adx > 24) { this.aim(e.x, e.y - 10, 1.3); e.cd = 170 + ((this.rng() * 60) | 0); this.sfx('eshot'); }
      } else if (k === 'emine') {
        e.y = e.y0 + Math.sin(e.t * 0.035 + e.ph) * 2.5;
        if (live && adx < d.hw + K.HW * 0.8 && Math.abs(dy) < d.hh + K.HH * 0.8) this.hit(e, 99);
      } else if (k === 'vent') {      // 쉼 150 · 거품 45 · 물기둥 60
        const c = e.t % 255; e.ph2 = c < 150 ? 0 : c < 195 ? 1 : 2;
        if (e.ph2 === 1 && e.t % 5 === 0) this.bub(e.x + (this.rng() - 0.5) * 5, e.y - 12, 0.8 + this.rng(), 40);
        if (e.ph2 === 2) { if (c === 195 && adx < 260) this.sfx('charge'); if (live && adx < 10 && p.y > e.y - 108 && p.y < e.y) { this.hurt(0.8); p.vy -= 0.14; } }
      } else if (d.ship) {
        const nx = e.x + e.pd * d.spd; if (Math.abs(nx - e.home) > e.r || this.iced(nx + e.pd * d.hw)) e.pd = -e.pd; else e.x = nx;
        if (--e.cd <= 0 && live && adx < 170) {
          const n = k === 'dest' ? 3 : k === 'aegis' ? 2 : 1, fb = this.floor(p.x) - 8;
          for (let j = 0; j < n; j++) { const u = j - (n - 1) / 2; this.eb('dc', e.x + u * 20, SEA - 4, u * 0.5 + clamp(dx * 0.012, -0.9, 0.9), -1.1, { air: 1, fy: clamp(p.y + (this.rng() - 0.5) * 14, SEA + 26, fb) }); }
          e.cd = k === 'frig' ? 150 : 175; this.sfx('eshot');
        }
        if (k === 'aegis' && --e.cd2 <= 0 && live && adx < 230) { const sg = dx > 0 ? 1 : -1; this.eb('hom', e.x + sg * 20, SEA + 14, sg * 0.9, 0.7, { a: Math.atan2(0.7, sg * 0.9) }); e.cd2 = 330; this.sfx('eshot'); }
      } else if (k === 'plane') {
        e.x += e.vx; e.dir = e.vx > 0 ? 1 : -1; if (e.cd > 0) e.cd--;
        if (e.n > 0 && e.cd <= 0 && live && Math.abs(dx) < 46) { this.eb('dc', e.x, e.y + 4, e.vx * 0.35, 0.2, { air: 1, fy: clamp(p.y + (this.rng() - 0.5) * 10, SEA + 26, this.floor(p.x) - 8) }); e.n--; e.cd = 14; this.sfx('eshot'); }
        if (Math.abs(dx) > 520 && e.t > 120) { E.splice(i, 1); continue; }
      } else if (k === 'tad') {
        const l = Math.hypot(dx, dy) || 1; e.vx += (dx / l * 1.0 - e.vx) * 0.05; e.vy += (dy / l * 1.0 - e.vy) * 0.05; e.x += e.vx; e.y += e.vy + Math.sin(e.t * 0.3) * 0.3; e.dir = e.vx > 0 ? 1 : -1;
        if (e.t > 520) { this.hit(e, 99, true); continue; }
      }
      if (d.hit && live && adx < d.hw + K.HW * 0.75 && Math.abs(p.y - e.y) < d.hh + K.HH * 0.7) {
        if (this.damage(d.hit)) p.vx += (dx > 0 ? 1 : -1) * 1.1;
        if (k === 'shrimp' || k === 'tad') this.hit(e, 99, true);
      }
    }
  };

  /* ───────── 보스 ───────── */
  G.anchor = function (b, l) { return l.edge ? [l.ax, l.ay] : [b.x + l.ax * (b.d.side ? b.dir : 1), b.y + l.ay]; };
  G.enter = function (i) {
    const gt = this.gates[i], d = BOSS[gt.b], x0 = gt.x - 200, x1 = gt.x + 200, fl = this.L.gAt(x1 - 100);
    gt.st = 1; this.lock = { x0: x0, x1: x1, gi: i }; this.cp = { x: x0 + 40, y: 100 };
    const hy = d.kind === 'crab' || d.kind === 'frog' ? fl - d.oy : Math.min(104, fl - d.hh - 26);
    const b = this.boss = { key: gt.b, d: d, gi: i, x: x1 + 70 + d.hw, y: hy, hx: x1 - 70 - d.hw * 0.6, hy: hy, hp: d.hp, hp0: d.hp, t: 0, st: 'in', dir: -1, ai: 0, at: 0, act: null, wait: 40, flash: 0, dead: 0, dvx: 0, vy: 0, air: false, shk: 0, q: [], limbs: [] };
    d.limbs.forEach((q, j) => b.limbs.push({ ty: q[0], ax: q[1], ay: q[2], st: 0, t: 0, ext: q[0] === 'tongue' ? 0.02 : 0.2, tx: 0, ty2: 0, sw: 0, s: Math.min(1.45, d.ls), sd: q[1] < 0 || (j % 2 && q[1] === d.limbs[0][1]) ? -1 : 1, ph: j * 2.1, hitDone: false }));
    this.en.forEach(e => { if (!e.d.ship && !e.d.air && e.x > x0 - 20 && e.x < x1 + 60) e.dead = true; });
    this.say((gt.mid ? '중간 보스 ' : '보스 ') + d.name, 170); this.sfx('warn');
  };
  G.strike = function (b, l, sw) { l.st = 1; l.t = 0; l.sw = sw || 0; l.hitDone = false; this.aimLimb(b, l); };
  G.aimLimb = function (b, l) {
    const p = this.pl, a = this.anchor(b, l), R = LIMB[l.ty].reach * l.s;
    let dx = p.x + p.vx * 10 - a[0], dy = p.y + p.vy * 10 - a[1];
    if (l.sw) { const c = Math.cos(-l.sw * 0.58), s = Math.sin(-l.sw * 0.58), nx = dx * c - dy * s; dy = dx * s + dy * c; dx = nx; }
    const len = Math.hypot(dx, dy) || 1, k = Math.min(1, R / len) * (l.sw ? Math.max(1, Math.min(R, len + 20) / len) : 1);
    l.tx = a[0] + dx * k; l.ty2 = a[1] + dy * k;
  };
  G.act = function (b, a, en) {
    const p = this.pl, d = b.d, lk = this.lock, x0 = lk.x0, x1 = lk.x1, r = this.rng, t = b.at, sg = p.x < b.x ? -1 : 1;
    const mx = b.x + (d.side ? b.dir : sg) * d.hw * 0.7, my = b.y + (d.kind === 'float' ? d.hh * 0.35 : d.kind === 'crab' ? -d.hh * 0.3 : 0);
    switch (a[0]) {
      case 'rest': return t >= a[1];
      case 'L': case 'S': {
        if (t === 1) {
          const n = a[0] === 'S' ? 1 : Math.min(b.limbs.length, a[1] + (en ? 1 : 0)), idx = b.limbs.map((l, i) => i).filter(i => b.limbs[i].st === 0 && !b.limbs[i].tmp);
          idx.sort((i, j) => { const A = this.anchor(b, b.limbs[i]), B = this.anchor(b, b.limbs[j]); return Math.hypot(A[0] - p.x, A[1] - p.y) - Math.hypot(B[0] - p.x, B[1] - p.y); });
          b.q = idx.slice(0, n).map((li, j) => [li, 2 + j * (en ? 12 : 18), a[0] === 'S' ? (r() < 0.5 ? -1 : 1) : 0]);
        }
        let last = 0; for (let i = 0; i < b.q.length; i++) { const q = b.q[i]; if (q[1] === t) this.strike(b, b.limbs[q[0]], q[2]); if (q[1] > last) last = q[1]; }
        return t > last + 3 && b.limbs.every(l => l.st === 0);
      }
      case 'edge': {      // 화면 가장자리에서 솟는 다리
        if (t === 1) {
          const n = a[1] + (en ? 1 : 0); b.q = [];
          for (let j = 0; j < n; j++) { const bot = j % 3 !== 1, ax = bot ? clamp(p.x + (r() - 0.5) * 170, x0 + 24, x1 - 24) : x0 - 12, ay = bot ? VH + 14 : clamp(p.y + (r() - 0.5) * 80, SEA + 30, 176); b.limbs.push({ ty: 'edge', ax: ax, ay: ay, edge: 1, tmp: 1, st: 0, t: 0, ext: 0.03, tx: ax, ty2: ay - 10, sw: 0, s: 1, sd: j % 2 ? -1 : 1, ph: j * 1.3, hitDone: false }); b.q.push([b.limbs.length - 1, 4 + j * (en ? 16 : 24), 0]); }
        }
        let last = 0; for (let i = 0; i < b.q.length; i++) { const q = b.q[i]; if (q[1] === t) this.strike(b, b.limbs[q[0]], 0); if (q[1] > last) last = q[1]; }
        if (t > last + 3 && b.limbs.every(l => l.st === 0)) { b.limbs = b.limbs.filter(l => !l.tmp); b.q = []; return true; }
        return false;
      }
      case 'ink': if (t % 14 === 6 && t < a[1] * 14) { this.aim(mx, my, 1.7); this.sfx('eshot'); } return t >= a[1] * 14 + 10;
      case 'fan': if (t === 18) { for (let j = 0; j < a[1]; j++) this.aim(mx, my, 1.45, (j - (a[1] - 1) / 2) * (1.1 / Math.max(1, a[1] - 1))); this.sfx('eshot'); } return t >= 46;
      case 'ring': if (t === 22) { const ph = r() * 6.28; for (let j = 0; j < a[1]; j++) { const an = ph + j / a[1] * 6.2832; this.eb('eb', b.x, b.y, Math.cos(an) * 1.25, Math.sin(an) * 1.25); } this.sfx('eshot'); } return t >= 50;
      case 'wall': if (t === 24) { const fl = this.L.gAt(b.x) - 6, gap = SEA + 40 + r() * Math.max(10, fl - SEA - 80); for (let y = SEA + 16; y < fl; y += 13) if (Math.abs(y - gap) > 24) this.eb('eb', mx, y, sg * 1.25, 0); this.sfx('eshot'); } return t >= 76;
      case 'bub': if (t % 12 === 4 && t < a[1] * 12) this.eb('bubb', b.x + (r() - 0.5) * d.hw * 2, b.y - d.hh * 0.4, clamp((p.x - b.x) * 0.007, -1, 1) + (r() - 0.5) * 0.3, -0.55, { ph: r() * 6 }); return t >= a[1] * 12 + 10;
      case 'sh': if (t === 10) { for (let j = 0; j < a[1]; j++) { const e = this.mk('shrimp', b.x + sg * (d.hw + 8 + j * 12), clamp(b.y + (j % 2 ? 14 : -14), SEA + 20, 170)); e.sum = 1; this.en.push(e); } this.sfx('eshot'); } return t >= 40;
      case 'tad': if (t % 9 === 3 && t < a[1] * 9) { const e = this.mk('tad', mx, my); e.sum = 1; e.vx = sg * 1.2; this.en.push(e); this.sfx('eshot'); } return t >= a[1] * 9 + 12;
      case 'cloud': if (t === 10) { this.clouds.push({ x: clamp(p.x + p.vx * 24, x0 + 40, x1 - 40), y: p.y, t: 0 }); this.sfx('charge'); } return t >= 40;
      case 'move': {
        if (t === 1) { b.hx = p.x < (x0 + x1) / 2 ? x1 - 60 - d.hw * 0.6 - r() * 60 : x0 + 60 + d.hw * 0.6 + r() * 60; const fl = this.L.gAt(b.hx); b.hy = clamp(60 + r() * 80, SEA + 14 + d.hh, fl - d.hh - 14); }
        b.x += clamp((b.hx - b.x) * 0.05, -1.3, 1.3);
        return Math.abs(b.x - b.hx) < 6 || t > 170;
      }
      case 'dash': {      // 몸을 움츠렸다가 가로로 내달린다
        if (t < 38) { b.shk = 1; b.hy += clamp(p.y - b.hy, -1.2, 1.2); b.x -= sg * 0.25; b.sg = sg; return false; }
        if (t === 38) { b.dvx = b.sg * 4.8; b.shk = 0; this.sfx('whip'); }
        b.x += b.dvx; if (t % 3 === 0) this.bub(b.x - b.sg * d.hw, b.y + (r() - 0.5) * d.hh, 1 + r() * 1.5, 40);
        if ((b.dvx < 0 && b.x <= x0 + 50 + d.hw) || (b.dvx > 0 && b.x >= x1 - 50 - d.hw) || t > 150) { b.dvx = 0; b.hx = b.x; return true; }
        return false;
      }
      case 'walk': {
        if (t === 1) b.hx = clamp(p.x + (r() < 0.5 ? -1 : 1) * (60 + d.hw), x0 + 30 + d.hw, x1 - 30 - d.hw);
        b.x += clamp(b.hx - b.x, -0.9, 0.9);
        return Math.abs(b.x - b.hx) < 2 || t > 160;
      }
      case 'hop': {
        if (t === 1) { let tx = x0 + 50 + d.hw + r() * (300 - 2 * d.hw); if (Math.abs(tx - b.x) < 90) tx = b.x > (x0 + x1) / 2 ? b.x - 120 : b.x + 120; b.hx = clamp(tx, x0 + 40 + d.hw, x1 - 40 - d.hw); b.shk = 1; }
        if (t === 16) { b.shk = 0; b.air = true; b.vy = -3.5; b.dvx = (b.hx - b.x) / 70; b.dir = b.dvx > 0 ? 1 : -1; }
        if (b.air) { b.x += b.dvx; b.vy += 0.1; b.y += b.vy; const gy = this.L.gAt(b.x) - d.oy; if (b.vy > 0 && b.y >= gy) { b.y = gy; b.air = false; b.dvx = 0; this.shake = Math.max(this.shake, 6); this.sfx('bump'); for (let j = 0; j < 6; j++) this.bub(b.x + (r() - 0.5) * d.hw * 2, gy + d.oy - 2, 1 + r() * 1.5, 50); return true; } }
        return false;
      }
    }
    return true;
  };
  G.stepBoss = function () {
    const b = this.boss; if (!b) return;
    const d = b.d, p = this.pl, lk = this.lock, r = this.rng, T = this;
    b.t++; if (b.flash > 0) b.flash--;
    if (b.dead) {
      b.dead++;
      if (b.dead % 7 === 0 && b.dead < 90) { this.addFx(b.dead % 14 ? 'boom_m' : 'boom_s', b.x + (r() - 0.5) * d.hw * 2, b.y + (r() - 0.5) * d.hh * 2); this.sfx('boom'); }
      if (b.dead === 90) { this.addFx('boom_l', b.x - d.hw * 0.3, b.y); this.addFx('boom_l', b.x + d.hw * 0.3, b.y - 4); this.sfx('bigboom'); this.shake = 14; this.add(d.sc); this.pop('+' + d.sc, b.x, b.y - d.hh - 6); }
      if (b.dead > 118) {
        const gt = this.gates[b.gi]; gt.st = 2; this.boss = null; this.lock = null; this.clouds = [];
        if (gt.mid) { this.cp = { x: gt.x, y: 100 }; this.say('길이 열렸다', 150); this.items.push({ k: 'box', w: 'R', x: b.x - 16, y: clamp(b.y, SEA + 40, 150), t: 0 }, { k: 'box', w: 'B', x: b.x + 16, y: clamp(b.y, SEA + 40, 150), t: 9 }); }
        else { this.bonus = this.lives * 300 + this.bombs * 100; this.add(this.bonus); this.mode = 'clear'; this.modeT = 0; this.sfx('clear'); }
      }
      return;
    }
    const ground = d.kind === 'crab' || d.kind === 'frog';
    if (b.st === 'in') {      // 방 오른쪽에서 들어온다
      b.x += clamp(b.hx - b.x, -1.5, 1.5); if (ground) b.y = this.L.gAt(clamp(b.x, lk.x0, lk.x1)) - d.oy;
      if (Math.abs(b.x - b.hx) < 1) b.st = 'fight';
    } else {
      const en = b.hp < b.hp0 * 0.45;
      if (!b.dvx && !b.air) b.dir = p.x < b.x ? -1 : 1;
      if (b.wait > 0) b.wait--; else if (!b.act) { b.act = d.acts[b.ai % d.acts.length]; b.ai++; if (b.ai >= d.acts.length && b.ai % d.acts.length === 0) b.ai++; b.at = 0; }      // 처음의 쉼은 한 번만
      if (b.act) { b.at++; if (this.act(b, b.act, en)) { b.act = null; b.wait = en ? 24 : 48; b.shk = 0; } }
      if (ground) { if (!b.air) b.y = this.L.gAt(b.x) - d.oy; }
      else { b.y += (b.hy + Math.sin(b.t * 0.03) * 7 - b.y) * 0.05; if (!b.act || (b.act[0] !== 'move' && b.act[0] !== 'dash')) b.x += clamp((b.hx - b.x) * 0.02, -0.6, 0.6); }
      // 몸에 닿으면
      if (!p.dead && Math.abs(p.x - (b.x + (d.bx || 0) * b.dir)) < d.hw * 0.85 + K.HW * 0.7 && Math.abs(p.y - (b.y + (d.by || 0))) < d.hh * 0.85 + K.HH * 0.7) { if (this.damage(b.dvx || b.air ? 22 : 16)) p.vx += (p.x < b.x ? -1 : 1) * 1.6; }
    }
    // 팔다리
    const en = b.hp < b.hp0 * 0.45;
    for (let i = 0; i < b.limbs.length; i++) {
      const l = b.limbs[i], D = LIMB[l.ty], a = this.anchor(b, l), tele = Math.round(D.tele * (en ? 0.74 : 1));
      if (l.st === 0) {      // 쉬는 동안: 몸 가까이에서 흐느적거린다
        const ix = l.edge ? 0 : l.ty === 'claw' ? (l.ax < 0 ? -0.75 : 0.75) : l.ty === 'leg' ? (l.ax < 0 ? -0.8 : 0.8) : d.side ? b.dir : (l.ax < 0 ? -0.35 : l.ax > 0 ? 0.35 : 0);
        const iy = l.edge ? -1 : l.ty === 'claw' ? -0.66 : l.ty === 'leg' ? 0.6 : d.side ? (l.ay < 0 ? -0.25 : 0.3) : 0.94, R = D.reach * l.s;
        l.tx = a[0] + ix * R; l.ty2 = a[1] + iy * R; const rest = l.ty === 'tongue' ? 0.02 : l.edge ? 0.03 : l.ty === 'leg' ? 0.3 : 0.2; l.ext += (rest - l.ext) * 0.2;
      } else if (l.st === 1) { l.t++; if (l.t < tele * 0.62) this.aimLimb(b, l); l.ext += ((l.edge ? 0.1 : l.ty === 'tongue' ? 0.05 : 0.13) - l.ext) * 0.2; if (l.t >= tele) { l.st = 2; l.t = 0; l.e0 = l.ext; this.sfx('whip'); } }
      else if (l.st === 2) { l.t++; l.ext = l.e0 + (1 - l.e0) * ease(l.t / D.out); if (l.t >= D.out) { l.ext = 1; l.st = l.sw ? 5 : 3; l.t = 0; if (l.ty === 'claw') this.sfx('snap'); } }
      else if (l.st === 3) { if (++l.t >= D.hold) { l.st = 4; l.t = 0; } }
      else if (l.st === 5) {      // 휘두르기: 뿌리를 축으로 돈다
        const dx = l.tx - a[0], dy = l.ty2 - a[1], c = Math.cos(l.sw * 0.034), s = Math.sin(l.sw * 0.034); l.tx = a[0] + dx * c - dy * s; l.ty2 = a[1] + dx * s + dy * c;
        if (++l.t >= 36) { l.st = 4; l.t = 0; }
      }
      else if (l.st === 4) { l.t++; l.ext = Math.max(0.03, 1 - ease(l.t / D.back) * 0.85); if (l.t >= D.back) { l.st = 0; } }
      if ((l.st === 2 || l.st === 3 || l.st === 5) && !l.hitDone && !p.dead) {
        const P = DS.limbPts(l, a[0], a[1], this.t);
        for (let j = 3; j < P.length; j++) {
          const rr = P[j][2] + (j === P.length - 1 ? D.tip * l.s : 0);
          if (Math.abs(p.x - P[j][0]) < K.HW * 0.72 + rr && Math.abs(p.y - P[j][1]) < K.HH * 0.72 + rr) {
            l.hitDone = true;
            if (this.damage(D.dmg)) { if (l.ty === 'tongue') { const m = Math.hypot(a[0] - p.x, a[1] - p.y) || 1; p.vx += (a[0] - p.x) / m * 2.6; p.vy += (a[1] - p.y) / m * 1.6; } else { const m = Math.hypot(p.x - a[0], p.y - a[1]) || 1; p.vx += (p.x - a[0]) / m * 1.4; p.vy += (p.y - a[1]) / m * 1.0; } }
            break;
          }
        }
      }
    }
  };

  /* ───────── 적의 탄: 먹물탄 eb · 어뢰 etorp · 유도 어뢰 hom · 폭뢰 dc · 거품 bubb ───────── */
  const BDMG = { eb: 8, etorp: 14, hom: 16, bubb: 8 }, BR = { eb: 2.4, etorp: 3, hom: 3, dc: 3, bubb: 3.6 };
  G.stepBullets = function () {
    const B = this.bullets, p = this.pl, L = this.L, cam = this.cam;
    for (let i = B.length - 1; i >= 0; i--) {
      const q = B[i], k = q.k; q.t++;
      if (k === 'etorp') { q.vx = clamp(q.vx + q.d * 0.02, -2.3, 2.3); if (q.t % 4 === 0) this.bub(q.x - q.d * 7, q.y, 0.6 + this.rng() * 0.5, 24); }
      else if (k === 'hom') { const want = Math.atan2(p.y - q.y, p.x - q.x); let da = want - q.a; while (da > PI) da -= 2 * PI; while (da < -PI) da += 2 * PI; if (!p.dead && q.t < 260) q.a += clamp(da, -0.032, 0.032); q.vx = Math.cos(q.a) * 1.45; q.vy = Math.sin(q.a) * 1.45; if (q.t % 4 === 0) this.bub(q.x - q.vx * 5, q.y - q.vy * 5, 0.6 + this.rng() * 0.5, 24); }
      else if (k === 'dc') {
        if (q.air) { q.vy += 0.06; if (q.y >= SEA && q.vy > 0) { if (this.iced(q.x)) { this.addFx('boom_s', q.x, SEA - 6); this.sfx('boom_s'); B.splice(i, 1); continue; } q.air = 0; q.vy = 0.75; q.vx *= 0.3; this.addFx('splash', q.x, SEA - 6); this.sfx('splash'); } }
        else { q.vx *= 0.97; if (q.t % 6 === 0) this.bub(q.x, q.y - 5, 0.7, 30); }
      } else if (k === 'bubb') { q.vx *= 0.99; q.x += Math.sin(q.t * 0.08 + (q.ph || 0)) * 0.4; }
      q.x += q.vx; q.y += q.vy;
      let gone = q.x < cam - 70 || q.x > cam + W + 70 || q.y > VH + 12 || (k === 'hom' && q.t > 330);
      if (!gone && k === 'dc') { if (!q.air && (q.y >= q.fy || q.y > L.gAt(q.x) - 3)) { this.blast(q.x, q.y, 24, { me: 18 }); gone = true; } }
      else if (!gone) { if ((k !== 'bubb' && this.inRock(q.x, q.y)) || q.y < SEA + 2) { if (k !== 'eb' && k !== 'bubb') this.addFx('boom_s', q.x, q.y); gone = true; } }
      if (!gone && !p.dead && Math.abs(q.x - p.x) < K.HW * 0.78 + BR[k] && Math.abs(q.y - p.y) < K.HH * 0.78 + BR[k]) {
        if (k === 'dc') { if (!q.air) { this.blast(q.x, q.y, 24, { me: 18 }); gone = true; } }
        else if (this.damage(BDMG[k])) { if (k !== 'eb' && k !== 'bubb') this.addFx('boom_s', q.x, q.y); gone = true; }
      }
      if (gone) B.splice(i, 1);
    }
  };

  /* ───────── 아이템: 상자 B(폭탄 +2) · R(수리) · 별(500점) ───────── */
  G.stepItems = function () {
    const p = this.pl, I = this.items;
    for (let i = I.length - 1; i >= 0; i--) {
      const it = I[i]; it.t++;
      if (it.fy && it.y < it.fy) it.y += 0.35;
      if (!p.dead && Math.abs(it.x - p.x) < 21 && Math.abs(it.y - p.y) < 15) {
        if (it.k === 'star') { this.add(500); this.pop('+500', it.x, it.y - 12); this.sfx('medal'); }
        else if (it.w === 'B') { this.bombs = Math.min(K.BMAX, this.bombs + 2); this.pop('폭탄 +2', it.x, it.y - 12); this.sfx('item'); }
        else { p.dmg = Math.max(0, p.dmg - 50); this.pop('수리 −50', it.x, it.y - 12); this.sfx('extend'); }
        I.splice(i, 1);
      }
    }
  };
  G.stepFx = function () {
    for (let i = this.fx.length - 1; i >= 0; i--) { const f = this.fx[i]; if (++f.t >= f.n * f.rate) this.fx.splice(i, 1); }
    for (let i = this.pops.length - 1; i >= 0; i--) { const q = this.pops[i]; q.y -= 0.3; if (++q.t > 50) this.pops.splice(i, 1); }
    for (let i = this.bubs.length - 1; i >= 0; i--) { const q = this.bubs[i]; q.y -= 0.3 + q.r * 0.12; q.x += Math.sin(q.t * 0.15 + q.ph) * 0.25; if (++q.t > q.life || q.y < SEA + 1.5) this.bubs.splice(i, 1); }
    for (let i = this.clouds.length - 1; i >= 0; i--) { if (++this.clouds[i].t > 330) this.clouds.splice(i, 1); }
  };

  /* 이어 하기: 이 스테이지를 처음부터, 잠수함 수와 폭탄은 처음대로, 점수는 0부터 */
  G.cont = function () { this.conts++; this.score = 0; this.next = K.EXT; this.lives = this.life0; this.bombs = this.bomb0; this.bsel = 'mine'; this.startStage(this.stage); };

  G.text = function () {
    const p = this.pl, b = this.boss, r = v => Math.round(v * 100) / 100;
    return { mode: this.mode, stage: this.stage + 1, name: this.S.name, len: this.L.len, cam: r(this.cam), sea: SEA,
      sub: { x: r(p.x), y: r(p.y), vx: r(p.vx), vy: r(p.vy), face: p.face, damage: r(p.dmg), inv: p.inv, dead: p.dead > 0 },
      lives: this.lives, score: this.score, tubes: this.tubes(), bombs: this.bombs, bomb: this.bsel, locked: !!this.lock,
      gates: this.gates.map(g => ({ x: g.x, boss: BOSS[g.b].name, mid: g.mid, state: g.st })),
      boss: b ? { name: b.d.name, x: r(b.x), y: r(b.y), hp: b.hp, hp0: b.hp0, state: b.dead ? 'dying' : b.st, act: b.act ? b.act[0] : null, limbs: b.limbs.map(l => ({ kind: l.ty, state: l.st, ext: r(l.ext) })) } : null,
      enemies: this.en.filter(e => !e.dead && e.d.hp && e.x > this.cam - 20 && e.x < this.cam + W + 20).map(e => ({ kind: e.k, x: r(e.x), y: r(e.y), hp: e.hp })),
      shots: this.shots.map(s => ({ kind: s.k, x: r(s.x), y: r(s.y) })), bullets: this.bullets.length, items: this.items.length, why: this.why };
  };

  /* ── 저장·불러오기 ──  함수와 표(스테이지 땅, 적·보스의 정의)만 빼고 그대로 적는다. 뺀 것은 스테이지 번호와 이름으로 다시 잇는다 */
  const SKIP = { sfx: 1, god: 1, rng: 1, L: 1, S: 1, en: 1, boss: 1, bubs: 1 };
  const strip = e => { const q = {}; for (const k in e) if (k !== 'd') q[k] = e[k]; return q; };
  G.save = function () {
    const o = {};
    for (const k in this) if (Object.prototype.hasOwnProperty.call(this, k) && !SKIP[k] && typeof this[k] !== 'function') o[k] = this[k];
    o.rng = this.rng.get(); o.en = this.en.filter(e => !e.dead).map(strip); o.boss = this.boss ? strip(this.boss) : null;
    return JSON.parse(JSON.stringify(o));
  };
  const isN = v => typeof v === 'number' && isFinite(v), isI = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  const SHOTK = { torp: 1, mine: 1, ssm: 1 }, EBK = { eb: 1, etorp: 1, hom: 1, dc: 1, bubb: 1 }, FXK = { hit: 1, splash: 1, sink: 1, boom_s: 1, boom_m: 1, boom_l: 1 };
  Game.load = function (d, o) {
    o = o || {};
    const bad = m => { throw new Error(m); };
    if (!d || typeof d !== 'object') bad('판 정보가 없다.');
    if (!isI(d.stage, 0, DS.STAGES.length - 1)) bad('스테이지 정보가 맞지 않는다.');
    if (!isI(d.life0, 1, 9) || !isI(d.lives, 1, 99) || !isN(d.score) || d.score < 0 || !isI(d.conts, 0, 1e6) || !isN(d.next) || !isI(d.nid, 0, 1e9)) bad('잠수함·점수 정보가 맞지 않는다.');
    if (!isI(d.bomb0, 0, K.BMAX) || !isI(d.bombs, 0, K.BMAX) || (d.bsel !== 'mine' && d.bsel !== 'ssm')) bad('폭탄 정보가 맞지 않는다.');
    if (d.mode !== 'play') bad('이어 할 수 없는 장면에서 저장한 판이다.');
    const p = d.pl;
    if (!p || !isN(p.x) || !isN(p.y) || !isN(p.vx) || !isN(p.vy) || (p.face !== 1 && p.face !== -1) || !isN(p.dmg) || p.dmg < 0 || p.dmg > 100 || !isN(p.dead) || !isN(p.rot) || !isN(p.inv) || !isN(p.cool) || !isN(p.bcool) || !isN(p.turn)) bad('잠수함 상태가 맞지 않는다.');
    ['en', 'shots', 'bullets', 'items', 'fx', 'pops', 'trigs', 'clouds', 'gates'].forEach(k => { if (!Array.isArray(d[k]) || d[k].length > 2000) bad('판 정보가 맞지 않는다(' + k + ').'); });
    if (!isN(d.rng) || !isN(d.t) || !isN(d.modeT) || !isN(d.cam) || !isN(d.look) || !isN(d.shake) || !d.cp || !isN(d.cp.x) || !isN(d.cp.y)) bad('진행 정보가 맞지 않는다.');
    d = JSON.parse(JSON.stringify(d));
    const g = new Game({ lives: d.life0, bombs: d.bomb0, stage: d.stage, sfx: o.sfx, god: o.god, hi: Math.max(o.hi || 0, isN(d.hi) ? d.hi : 0) });
    const L = g.L, xin = v => isN(v) && v > -600 && v < L.len + 600, yin = v => isN(v) && v > -400 && v < 800;
    if (!xin(d.pl.x) || !yin(d.pl.y) || !xin(d.cp.x) || !yin(d.cp.y)) bad('잠수함 자리가 맞지 않는다.');
    if (d.gates.length !== g.gates.length || d.trigs.length !== g.trigs.length) bad('스테이지 정보가 맞지 않는다.');
    d.gates.forEach((q, i) => { const b = g.gates[i]; if (!q || q.x !== b.x || q.b !== b.b || !isI(q.st, 0, 2)) bad('보스 방 정보가 맞지 않는다.'); q.mid = b.mid; });
    d.trigs.forEach((q, i) => { const b = g.trigs[i]; if (!q || !isN(q.cd)) bad('스테이지 정보가 맞지 않는다.'); q.x = b.x; q.w = b.w; });
    const E = d.en.map(q => { const e = Object.assign({}, q), def = e && EN[e.k]; if (!def || !xin(e.x) || !yin(e.y) || !isN(e.hp) || !isN(e.t) || !isN(e.id) || !isN(e.y0) || !isN(e.home) || !isN(e.cd)) bad('적 정보가 맞지 않는다.'); e.d = def; return e; });
    let B = null;
    if (d.boss) {
      const b = d.boss, def = BOSS[b.key];
      if (!def || !isI(b.gi, 0, g.gates.length - 1) || g.gates[b.gi].b !== b.key || !xin(b.x) || !yin(b.y) || !isN(b.hx) || !isN(b.hy) || !isN(b.hp) || b.hp < 0 || b.hp > def.hp || !isN(b.t) || !isN(b.at) || !isI(b.ai, 0, 1e7) || !isN(b.wait) || !isN(b.dead) || (b.st !== 'in' && b.st !== 'fight') || (b.dir !== 1 && b.dir !== -1) || !Array.isArray(b.limbs) || b.limbs.length > 12 || !Array.isArray(b.q)) bad('보스 정보가 맞지 않는다.');
      if (b.act && !(Array.isArray(b.act) && def.acts.some(a => a[0] === b.act[0] && a[1] === b.act[1]))) bad('보스 정보가 맞지 않는다.');
      b.limbs.forEach(l => { if (!l || !LIMB[l.ty] || !isN(l.ax) || !isN(l.ay) || !isI(l.st, 0, 5) || !isN(l.t) || !isN(l.ext) || !isN(l.tx) || !isN(l.ty2) || !isN(l.s) || !isN(l.sd)) bad('보스 정보가 맞지 않는다.'); });
      b.q.forEach(q => { if (!Array.isArray(q) || !isI(q[0], 0, b.limbs.length - 1) || !isN(q[1])) bad('보스 정보가 맞지 않는다.'); });
      if (!d.lock || d.lock.gi !== b.gi) bad('보스 방 정보가 맞지 않는다.');
      b.d = def; b.hp0 = def.hp; B = b;
    }
    if (d.lock) { const gt = g.gates[d.lock.gi]; if (!gt || !B) bad('보스 방 정보가 맞지 않는다.'); d.lock = { x0: gt.x - 200, x1: gt.x + 200, gi: d.lock.gi }; }
    d.shots.forEach(s => { if (!s || !SHOTK[s.k] || !xin(s.x) || !yin(s.y) || !isN(s.vx) || !isN(s.vy) || !isN(s.t)) bad('탄 정보가 맞지 않는다.'); });
    d.bullets.forEach(b => { if (!b || !EBK[b.k] || !xin(b.x) || !yin(b.y) || !isN(b.vx) || !isN(b.vy) || !isN(b.t)) bad('적탄 정보가 맞지 않는다.'); });
    d.items.forEach(it => { if (!it || (it.k !== 'star' && !(it.k === 'box' && (it.w === 'B' || it.w === 'R'))) || !xin(it.x) || !yin(it.y) || !isN(it.t)) bad('아이템 정보가 맞지 않는다.'); });
    d.fx.forEach(f => { if (!f || !FXK[f.k] || !isN(f.x) || !isN(f.y) || !isN(f.t) || !isN(f.n) || !isN(f.rate) || (f.k === 'sink' && !(EN[f.spr] && EN[f.spr].ship))) bad('효과 정보가 맞지 않는다.'); });
    d.pops.forEach(q => { if (!q || typeof q.txt !== 'string' || !isN(q.x) || !isN(q.y) || !isN(q.t)) bad('효과 정보가 맞지 않는다.'); });
    d.clouds.forEach(q => { if (!q || !isN(q.x) || !isN(q.y) || !isN(q.t)) bad('효과 정보가 맞지 않는다.'); });
    if (d.msg && (typeof d.msg.txt !== 'string' || !isN(d.msg.t))) d.msg = null;
    const rs = d.rng;
    ['sfx', 'god', 'rng', 'L', 'S', 'en', 'boss', 'bubs', 'hi'].forEach(k => { delete d[k]; });
    Object.assign(g, d);
    g.en = E; g.boss = B; g.bubs = []; g.why = ''; g.rng = DS.RNG(1); g.rng.set(rs);
    return g;
  };

  /* ───────── 자동 조종 (출전 준비 화면의 시범과 시험용) ─────────
     가까운 적과 깊이를 맞춰 어뢰를 쏘고, 군함은 수면 가까이에서 어뢰와 대함미사일로 맞선다. 보스 방에서는 왼쪽에서 깊이를 맞춘다 */
  DS.autoPilot = function (g) {
    const p = g.pl, o = { l: false, r: false, u: false, d: false, a: false, aEdge: false, bEdge: false, selEdge: false, ok: true, tap: null };
    if (g.mode !== 'play' || p.dead) return o;
    const A = g._ap || (g._ap = { id: -1, t: 0, skip: {} });
    let tx = p.x + 120, ty = 100, fire = false, face = 1;
    const b = g.boss, lk = g.lock;
    if (b && lk) {
      const bx = b.x + (b.d.bx || 0) * b.dir, by = b.y + (b.d.by || 0);
      tx = bx > (lk.x0 + lk.x1) / 2 ? Math.max(lk.x0 + 50, bx - b.d.hw - 120) : Math.min(lk.x1 - 50, bx + b.d.hw + 120); face = bx > p.x ? 1 : -1; ty = by - 4.5; fire = b.st === 'fight' && Math.abs(p.y + 4.5 - by) < b.d.hh; A.t++;
      if (g.bombs > 0 && p.bcool <= 0 && A.t % 240 === 120 && Math.abs(bx - p.x) < 90) { if (g.bsel !== 'mine') o.selEdge = true; else o.bEdge = true; }
    } else {
      let best = null, bd = 1e9;
      for (let i = 0; i < g.en.length; i++) { const e = g.en[i]; if (e.dead || !e.d.hp || A.skip[e.id] || e.k === 'emine' || e.sum) continue; const dx = e.x - p.x; if (dx < -70 || dx > 230 || e.x > g.cam + W + 20) continue; const dd = Math.abs(dx) + (e.d.ship || e.d.air ? 40 : 0); if (dd < bd) { bd = dd; best = e; } }
      if (best) {
        if (A.id !== best.id) { A.id = best.id; A.t = 0; } if (++A.t > 620) A.skip[best.id] = 1;
        const e = best, air = e.d.air, ship = e.d.ship;
        face = e.x > p.x ? 1 : -1;
        if (air || ship) { ty = SEA + K.TOP; tx = e.x - face * 90; if (g.bombs > 0 && p.bcool <= 0 && Math.abs(e.x - p.x) < 200 && !g.iced(p.x) && A.t % 50 === 10) { if (g.bsel !== 'ssm') o.selEdge = true; else o.bEdge = true; } fire = ship && p.y < SEA + K.TOP + 3; }
        else { ty = e.y - 4.5; tx = e.x - face * 80; fire = Math.abs(p.y + 4.5 - e.y) < e.d.hh + 2; }
      } else A.id = -1;
    }
    // 가는 쪽의 바닥과 지붕 사이로
    const sg = tx > p.x ? 1 : -1; let fl = 1e9, rf = 0;
    for (let x = p.x - 16; x <= p.x + 16 + (sg > 0 ? 44 : 0); x += 6) { const xx = sg > 0 ? x : x - 44; const f = g.floor(xx); if (f < fl) fl = f; const c = g.roof(xx); if (c > rf) rf = c; }
    const lo = rf + 3, hi = fl - K.HH - 5; ty = hi < lo ? (lo + hi) / 2 : clamp(ty, lo, hi);
    const stopY = p.vy * Math.abs(p.vy) / (2 * 0.05);
    if (p.y + stopY > ty + 1.5) o.u = true; else if (p.y + stopY < ty - 1.5) o.d = true;
    const blocked = p.y > hi + 4 || p.y < lo - 4, dx = tx - p.x, stop = p.vx * Math.abs(p.vx) / (2 * 0.06);
    if (!blocked) { if (dx - stop > 6) o.r = true; else if (dx - stop < -6) o.l = true; }
    if (p.face !== face) { o.l = face < 0; o.r = face > 0; return o; }      // 먼저 돌아본다
    o.a = fire || (face > 0 ? o.l : o.r);      // 뒤로 물러날 때에는 발사를 눌러 바라보는 쪽을 지킨다
    return o;
  };

  DS.Game = Game;
})();
