/* 스테이지 일곱 장 — 바다 밑 높이(가로 한 칸마다 하나)·얼음과 바위 천장·그 사이에 놓이는 것들.
   좌표: x는 왼쪽에서 오른쪽으로 0..len, y는 위에서 아래로 0..VH. 수면은 y = DS.SEA, 바다 밑 gy[x]보다 아래(y가 큰 쪽)는 땅이다. */
(function () {
  'use strict';
  const DS = window.DS, ART = DS.ART, Pen = DS.Pen, RNG = DS.RNG, SH = DS.SH, VH = DS.VH, W = DS.W, def = ART.def;
  const CHUNK = DS.CHUNK = 400, SEA = DS.SEA;
  const ease = t => (1 - Math.cos(Math.PI * t)) / 2;

  /* ───────── 짓는 도구: 왼쪽에서 오른쪽으로 땅을 이어 붙이며 그 위에 물건을 놓는다 ───────── */
  function B(y, seed) { this.x = 0; this.y = y; this.g = []; this.cp = []; this.ob = []; this.deco = []; this.r = RNG(seed || 1); this.segs = []; }
  const P = B.prototype;
  P.f = function (w) { this.segs.push([this.x, this.x + w, this.y, this.y, 0]); this.x += w; return this; };                       // 평지
  P.s = function (w, y, rough) { this.segs.push([this.x, this.x + w, this.y, y, rough == null ? 2.5 : rough]); this.x += w; this.y = y; return this; };      // 비탈
  P.j = function (y) { this.y = y; return this; };                                                                                  // 수직 벽
  P.c = function (y) { this.cp.push([this.x, y]); return this; };                                                                   // 천장 기준점 (null이면 여기서 끊긴다)
  P.o = function (k, back, o) { this.ob.push(Object.assign({ k: k, x: Math.round(this.x - (back || 0)) }, o || {})); return this; };
  P.d = function (k, back, o) { this.deco.push(Object.assign({ k: k, x: Math.round(this.x - (back || 0)) }, o || {})); return this; };
  P.done = function (meta) {
    const len = this.x, gy = new Float32Array(len + 1), cy = new Float32Array(len + 1).fill(-99), r = this.r;
    const nz = new Float32Array(len + 1); let v = 0; for (let i = 0; i <= len; i++) { v = v * 0.86 + (r() - 0.5) * 0.9; nz[i] = v; }
    this.segs.forEach(s => { for (let x = s[0]; x <= s[1] && x <= len; x++) { const t = (x - s[0]) / Math.max(1, s[1] - s[0]); gy[x] = s[2] === s[3] ? s[2] : s[2] + (s[3] - s[2]) * ease(t) + nz[x] * s[4] * Math.sin(Math.PI * t); } });
    for (let i = 0; i < this.cp.length - 1; i++) {
      const a = this.cp[i], b = this.cp[i + 1]; if (a[1] == null || b[1] == null) continue;
      for (let x = a[0]; x <= b[0] && x <= len; x++) { const t = (x - a[0]) / Math.max(1, b[0] - a[0]); cy[x] = a[1] + (b[1] - a[1]) * ease(t) + nz[(x * 7 + 13) % len] * 4 * Math.sin(Math.PI * t) - 1; }
    }
    const L = Object.assign({ len: len, gy: gy, cy: cy, ob: this.ob, deco: this.deco }, meta);
    L.gAt = x => gy[Math.max(0, Math.min(len, Math.round(x)))];
    L.cAt = x => cy[Math.max(0, Math.min(len, Math.round(x)))];
    return L;
  };

  /* ───────── 일곱 장 ─────────
     o('gate')는 보스 방의 한가운데다. 방은 가로 400칸의 평지이고, 들어서면 화면이 그 방에 멈춘다. */
  const STAGES = DS.STAGES = [
    { name: '햇살 여울', sub: '첫째 장', theme: 'shoal', dark: 0.05, mid: 'crab', boss: 'octo',
      note: '얕고 밝은 바다. 작은 잠수정과 새우 떼, 호위함이 처음 나온다.',
      make() {
        const b = new B(182, 11);
        b.f(200);
        b.s(160, 170, 3).o('shrimp', 60, { y: 110, n: 4 });
        b.f(180).o('mini', 60, { y: 120 }).o('star', 120, { y: 150 });
        b.s(140, 186, 3).o('hair', 70, { y: 110 });
        b.f(220).o('frig', 110, { r: 60 }).o('shrimp', 40, { y: 80, n: 5 });
        b.s(120, 160, 4).o('angler', 40, { y: 120 }).o('box', 90, { y: 140, w: 'B' });
        b.f(140).o('mini', 60, { y: 90 }).o('mini', 20, { y: 140 });
        b.s(100, 184, 3);
        b.f(400).o('gate', 200, { b: 'crab', mid: 1 });
        b.s(140, 172, 3).o('shrimp', 60, { y: 100, n: 5 }).o('hair', 20, { y: 120 });
        b.f(200).o('frig', 100, { r: 70 }).o('mini', 40, { y: 130 }).o('emine', 150, { y: 120 });
        b.s(160, 150, 4).o('angler', 80, { y: 100 }).o('box', 30, { y: 120, w: 'R' });
        b.s(140, 186, 4).o('hair', 90, { y: 130 }).o('hair', 40, { y: 100 });
        b.f(200).o('mini', 120, { y: 80 }).o('mini', 60, { y: 150 }).o('trig', 100, { w: 'plane' }).o('star', 30, { y: 60 });
        b.s(100, 180, 2);
        b.f(400).o('gate', 200, { b: 'octo' });
        return b.done({});
      } },
    { name: '산호 숲', sub: '둘째 장', theme: 'coral', dark: 0.07, mid: 'frog', boss: 'squid',
      note: '산호 등성이가 길을 가른다. 선 채로 오르내리는 갈치와 계류 기뢰를 조심한다.',
      make() {
        const b = new B(178, 22);
        b.f(180);
        b.s(120, 150, 4).o('hair', 60, { y: 100 }).s(100, 180, 4).o('shrimp', 40, { y: 120, n: 5 });
        b.f(160).o('mini', 80, { y: 140 }).o('emine', 30, { y: 90 }).o('frig', 80, { r: 50 });
        b.s(90, 128, 5).o('angler', 30, { y: 80 }).s(90, 182, 5).o('hair', 40, { y: 130 });
        b.f(180).o('shrimp', 120, { y: 70, n: 6 }).o('mini', 50, { y: 110 }).o('box', 90, { y: 150, w: 'B' });
        b.s(110, 140, 4).o('hair', 60, { y: 90 }).o('hair', 20, { y: 70 }).s(110, 184, 4).o('star', 50, { y: 150 });
        b.f(120).o('angler', 60, { y: 130 });
        b.f(400).o('gate', 200, { b: 'frog', mid: 1 });
        b.s(120, 156, 4).o('shrimp', 60, { y: 100, n: 6 }).o('box', 20, { y: 120, w: 'R' });
        b.f(160).o('dest', 80, { r: 60 }).o('mini', 100, { y: 120 }).o('mini', 40, { y: 90 });
        b.s(100, 120, 5).o('hair', 50, { y: 70 }).s(100, 180, 5).o('emine', 60, { y: 120 }).o('emine', 20, { y: 150 });
        b.f(200).o('angler', 140, { y: 100 }).o('angler', 60, { y: 150 }).o('trig', 100, { w: 'plane' }).o('shrimp', 20, { y: 60, n: 5 });
        b.s(120, 150, 4).o('hair', 70, { y: 100 }).o('mini', 20, { y: 60 }).s(100, 184, 3).o('box', 50, { y: 140, w: 'B' });
        b.f(400).o('gate', 200, { b: 'squid' });
        return b.done({});
      } },
    { name: '난파선 무덤', sub: '셋째 장', theme: 'wreck', dark: 0.09, mid: 'hermit', boss: 'king',
      note: '가라앉은 배 사이로 계류 기뢰가 줄지어 떠 있다. 구축함이 폭뢰 셋을 한꺼번에 떨군다.',
      make() {
        const b = new B(184, 33);
        b.f(180).d('hulk', 150, { w: 130 });
        b.s(120, 168, 3).o('mini', 60, { y: 120 }).o('emine', 20, { y: 80 });
        b.f(200).o('dest', 100, { r: 60 }).o('emine', 150, { y: 140 }).o('emine', 90, { y: 100 }).o('angler', 30, { y: 150 });
        b.s(80, 140, 4).o('hair', 40, { y: 90 }).f(100).d('hulk', 100, { w: 100 }).o('mini', 50, { y: 110 }).s(80, 186, 4).o('shrimp', 40, { y: 130, n: 6 });
        b.f(200).o('frig', 120, { r: 50 }).o('mini', 140, { y: 150 }).o('mini', 60, { y: 70 }).o('box', 100, { y: 120, w: 'B' }).o('trig', 100, { w: 'plane' });
        b.s(120, 160, 3).o('emine', 90, { y: 70 }).o('emine', 60, { y: 110 }).o('emine', 30, { y: 140 }).o('angler', 10, { y: 100 });
        b.s(100, 184, 3).o('star', 50, { y: 160 });
        b.f(400).o('gate', 200, { b: 'hermit', mid: 1 });
        b.s(100, 170, 3).o('hair', 50, { y: 110 }).o('shrimp', 20, { y: 70, n: 6 });
        b.f(220).d('hulk', 200, { w: 160 }).o('mini', 160, { y: 110 }).o('mini', 90, { y: 140 }).o('emine', 40, { y: 100 }).o('box', 120, { y: 80, w: 'R' });
        b.s(120, 150, 4).o('dest', 60, { r: 70 }).o('angler', 60, { y: 110 }).s(100, 186, 4).o('angler', 40, { y: 150 });
        b.f(220).o('emine', 180, { y: 150 }).o('emine', 140, { y: 110 }).o('emine', 100, { y: 70 }).o('mini', 50, { y: 130 }).o('hair', 20, { y: 90 }).o('trig', 110, { w: 'plane' });
        b.s(120, 176, 3).o('frig', 60, { r: 40 }).o('shrimp', 60, { y: 120, n: 7 }).o('box', 20, { y: 150, w: 'B' });
        b.f(400).o('gate', 200, { b: 'king' });
        return b.done({});
      } },
    { name: '열수 굴뚝', sub: '넷째 장', theme: 'vent', dark: 0.11, mid: 'cuttle', boss: 'gocto',
      note: '바닥의 굴뚝이 뜨거운 물기둥을 뿜는다. 뿜기 전에 거품이 먼저 오른다. 이지스함이 처음 나온다.',
      make() {
        const b = new B(186, 44);
        b.f(170);
        b.s(100, 172, 3).o('vent', 50).o('angler', 20, { y: 120 });
        b.f(200).o('vent', 150).o('vent', 60).o('mini', 100, { y: 100 }).o('dest', 100, { r: 60 });
        b.s(80, 130, 5).o('hair', 40, { y: 80 }).f(80).o('vent', 40).s(80, 188, 5).o('shrimp', 40, { y: 140, n: 6 });
        b.f(220).o('vent', 180).o('vent', 110).o('vent', 40).o('angler', 150, { y: 90 }).o('mini', 70, { y: 130 }).o('box', 110, { y: 60, w: 'B' });
        b.s(120, 160, 4).o('emine', 80, { y: 100 }).o('hair', 30, { y: 120 }).s(100, 186, 3).o('vent', 50).o('trig', 60, { w: 'plane' });
        b.f(110).o('angler', 60, { y: 140 }).o('star', 30, { y: 100 });
        b.f(400).o('gate', 200, { b: 'cuttle', mid: 1 });
        b.s(100, 176, 3).o('vent', 50).o('shrimp', 40, { y: 90, n: 6 });
        b.f(200).o('aegis', 100, { r: 50 }).o('vent', 150).o('vent', 50).o('mini', 120, { y: 140 }).o('box', 100, { y: 110, w: 'R' });
        b.s(90, 136, 5).o('angler', 50, { y: 90 }).f(70).o('vent', 35).s(90, 188, 5).o('hair', 50, { y: 140 }).o('hair', 20, { y: 100 });
        b.f(220).o('vent', 190).o('vent', 130).o('vent', 70).o('mini', 160, { y: 80 }).o('mini', 100, { y: 120 }).o('angler', 30, { y: 150 }).o('trig', 110, { w: 'plane' });
        b.s(120, 170, 3).o('dest', 60, { r: 50 }).o('emine', 80, { y: 120 }).o('emine', 40, { y: 90 }).o('box', 20, { y: 150, w: 'B' });
        b.f(400).o('gate', 200, { b: 'gocto' });
        return b.done({});
      } },
    { name: '얼음 지붕', sub: '다섯째 장', theme: 'ice', dark: 0.08, mid: 'newt', boss: 'gsquid',
      note: '수면이 얼음으로 덮였다. 얼음이 뚫린 곳에만 군함이 떠 있고, 대함미사일도 그 구멍으로만 솟는다.',
      make() {
        const b = new B(184, 55);
        b.f(170).c(null).f(30).c(-30).s(60, 176, 3).c(46).o('hair', 30, { y: 110 });
        b.f(200).o('mini', 140, { y: 100 }).o('emine', 80, { y: 80 }).o('shrimp', 40, { y: 140, n: 6 }).c(60);
        b.s(110, 150, 4).o('angler', 60, { y: 110 }).c(42).s(110, 184, 4).o('hair', 50, { y: 124 }).c(54);
        b.f(50).c(-30).c(null).f(150).o('aegis', 75, { r: 30 }).o('box', 75, { y: 120, w: 'B' }).c(null).f(30).c(-30).f(50).c(50);
        b.s(100, 164, 3).o('mini', 60, { y: 90 }).o('mini', 20, { y: 130 }).c(64).f(120).o('emine', 90, { y: 100 }).o('emine', 50, { y: 130 }).o('angler', 20, { y: 150 }).c(48);
        b.s(100, 186, 3).o('hair', 60, { y: 100 }).o('star', 30, { y: 160 }).c(56).f(40).c(-30).c(null);
        b.f(400).o('gate', 200, { b: 'newt', mid: 1 });
        b.c(null).f(30).c(-30).s(100, 170, 3).c(50).o('shrimp', 50, { y: 110, n: 7 });
        b.f(200).o('mini', 150, { y: 90 }).o('mini', 100, { y: 140 }).o('hair', 40, { y: 110 }).o('box', 120, { y: 150, w: 'R' }).c(66);
        b.s(100, 140, 5).o('angler', 50, { y: 100 }).c(44).s(100, 186, 5).o('emine', 60, { y: 90 }).o('emine', 30, { y: 130 }).c(58);
        b.f(50).c(-30).c(null).f(160).o('dest', 80, { r: 40 }).o('trig', 80, { w: 'plane' }).o('angler', 40, { y: 130 }).c(null).f(30).c(-30).f(50).c(48);
        b.f(160).o('hair', 130, { y: 100 }).o('hair', 90, { y: 130 }).o('mini', 40, { y: 110 }).o('box', 20, { y: 150, w: 'B' }).c(60).f(40).c(-30).c(null);
        b.f(400).o('gate', 200, { b: 'gsquid' });
        return b.done({});
      } },
    { name: '흑연 해구', sub: '여섯째 장', theme: 'trench', dark: 0.14, mid: 'spider', boss: 'toad',
      note: '깊은 골과 높은 벼랑. 벼랑을 넘는 동안 초롱아귀가 달려든다.',
      make() {
        const b = new B(150, 66);
        b.f(170);
        b.s(60, 190, 3).o('angler', 30, { y: 140 }).f(140).o('vent', 100).o('mini', 60, { y: 150 }).o('aegis', 70, { r: 40 });
        b.j(110).f(70).o('hair', 35, { y: 70 }).j(188).f(150).o('vent', 110).o('vent', 50).o('angler', 80, { y: 130 }).o('emine', 20, { y: 100 });
        b.s(80, 120, 5).o('mini', 40, { y: 80 }).f(90).o('shrimp', 45, { y: 80, n: 7 }).o('box', 45, { y: 60, w: 'B' }).s(90, 190, 5).o('angler', 40, { y: 150 });
        b.f(170).o('vent', 130).o('vent', 80).o('vent', 30).o('mini', 110, { y: 110 }).o('hair', 50, { y: 90 }).o('trig', 90, { w: 'plane' });
        b.j(130).f(60).o('emine', 30, { y: 90 }).j(186).f(140).o('angler', 100, { y: 150 }).o('angler', 50, { y: 110 }).o('star', 70, { y: 170 });
        b.s(80, 180, 2);
        b.f(400).o('gate', 200, { b: 'spider', mid: 1 });
        b.s(90, 150, 4).o('shrimp', 40, { y: 100, n: 7 }).f(80).o('dest', 40, { r: 30 }).o('box', 40, { y: 110, w: 'R' }).s(90, 190, 5).o('vent', 30);
        b.f(180).o('mini', 140, { y: 80 }).o('mini', 100, { y: 120 }).o('mini', 60, { y: 160 }).o('emine', 20, { y: 140 });
        b.j(104).f(80).o('hair', 40, { y: 66 }).o('angler', 20, { y: 80 }).j(190).f(160).o('vent', 120).o('vent', 70).o('hair', 90, { y: 140 }).o('aegis', 80, { r: 40 }).o('trig', 80, { w: 'plane' });
        b.s(100, 140, 5).o('angler', 60, { y: 100 }).o('angler', 20, { y: 70 }).s(100, 186, 5).o('emine', 70, { y: 110 }).o('emine', 40, { y: 140 }).o('box', 20, { y: 160, w: 'B' });
        b.f(400).o('gate', 200, { b: 'toad' });
        return b.done({});
      } },
    { name: '먹빛 심연', sub: '일곱째 장', theme: 'abyss', dark: 0.17, mid: 'naut', boss: 'kraken',
      note: '지금까지의 위험이 모두 모였다. 바위 지붕 밑을 지나 가장 깊은 곳에서 크라켄을 만난다.',
      make() {
        const b = new B(180, 77);
        b.f(170);
        b.s(100, 160, 3).o('mini', 60, { y: 100 }).o('mini', 20, { y: 130 }).f(120).o('aegis', 60, { r: 40 }).o('emine', 90, { y: 90 }).o('emine', 40, { y: 120 });
        b.c(null).f(30).c(-30).s(80, 188, 4).c(70).o('angler', 40, { y: 130 }).f(160).o('vent', 120).o('vent', 60).o('hair', 90, { y: 130 }).o('shrimp', 30, { y: 150, n: 7 }).c(84);
        b.s(80, 150, 4).o('angler', 40, { y: 110 }).c(60).s(80, 190, 4).o('emine', 50, { y: 120 }).o('emine', 20, { y: 150 }).c(78).f(40).c(-30).c(null);
        b.f(180).o('dest', 90, { r: 50 }).o('mini', 130, { y: 150 }).o('mini', 60, { y: 90 }).o('box', 90, { y: 120, w: 'B' }).o('trig', 90, { w: 'plane' });
        b.j(120).f(70).o('hair', 35, { y: 80 }).j(188).f(130).o('vent', 90).o('angler', 60, { y: 140 }).o('angler', 20, { y: 100 }).o('star', 40, { y: 170 });
        b.s(80, 182, 2);
        b.f(400).o('gate', 200, { b: 'naut', mid: 1 });
        b.s(100, 164, 3).o('shrimp', 50, { y: 90, n: 8 }).o('box', 20, { y: 130, w: 'R' });
        b.c(null).f(30).c(-30).f(170).o('vent', 130).o('vent', 60).o('mini', 100, { y: 120 }).o('hair', 40, { y: 130 }).c(76).s(90, 130, 5).o('angler', 40, { y: 104 }).c(52).s(90, 190, 5).o('emine', 50, { y: 110 }).c(70).f(40).c(-30).c(null);
        b.f(200).o('aegis', 100, { r: 50 }).o('trig', 150, { w: 'plane' }).o('trig', 60, { w: 'plane' }).o('mini', 140, { y: 150 }).o('mini', 70, { y: 100 }).o('angler', 20, { y: 130 });
        b.j(110).f(70).o('hair', 50, { y: 70 }).o('hair', 20, { y: 60 }).j(188).f(140).o('vent', 100).o('vent', 40).o('emine', 80, { y: 130 }).o('emine', 50, { y: 100 }).o('emine', 20, { y: 70 }).o('box', 60, { y: 160, w: 'B' });
        b.s(90, 184, 2).o('angler', 40, { y: 140 });
        b.f(400).o('gate', 200, { b: 'kraken' });
        return b.done({});
      } }
  ];
  STAGES.forEach(s => { const L = s.make(); s.len = L.len; s.foes = L.ob.reduce((n, o) => n + (o.k === 'shrimp' ? o.n : o.k === 'gate' || o.k === 'box' || o.k === 'star' || o.k === 'trig' || o.k === 'vent' ? 0 : 1), 0); });
  DS.buildStage = function (i) { const s = STAGES[i], L = s.make(); L.idx = i; L.name = s.name; L.sub = s.sub; L.theme = s.theme; L.dark = s.dark; L.gates = L.ob.filter(o => o.k === 'gate'); return L; };

  /* ───────── 바다 밑 그리기: 400칸씩 잘라 연필로 그려 둔다 ───────── */
  const TONE = { shoal: 0.03, coral: 0.05, wreck: 0.07, vent: 0.1, ice: 0.04, trench: 0.12, abyss: 0.14 };
  DS.drawChunk = function (L, ci) {
    const x0 = ci * CHUNK, pen = new Pen(CHUNK, VH, DS.hash('chunk' + L.idx) + ci * 977, { origin: [-x0, 0] }), r = pen.rng, th = L.theme;
    const xa = Math.max(0, x0 - 6), xb = Math.min(L.len, x0 + CHUNK + 6), gy = L.gy, cy = L.cy;
    const flat = x => Math.abs(gy[Math.min(L.len, x + 3)] - gy[Math.max(0, x - 3)]) < 5;
    const L1 = { w: 0.42, a: 0.8, passes: 1 };
    const grass = (x, y) => { const n = 2 + ((r() * 3) | 0); for (let k = 0; k < n; k++) { const h = 6 + r() * 13, sx = x + (k - n / 2) * 1.7, lean = (r() - 0.5) * 6; pen.line([[sx, y + 1], [sx + lean * 0.3, y - h * 0.5], [sx + lean, y - h]], { s: true, w: 0.42, a: 0.75, passes: 1 }); } };
    const coral = (x, y, h, a, d) => { const x2 = x + Math.sin(a) * h, y2 = y - Math.cos(a) * h; pen.seg(x, y, x2, y2, { w: 0.45 + d * 0.16, a: 0.9, passes: 1 }); if (d > 0) { coral(x2, y2, h * 0.72, a - 0.4 - r() * 0.35, d - 1); coral(x2, y2, h * 0.72, a + 0.4 + r() * 0.35, d - 1); } else pen.dot(x2, y2, 0.8, 0.85); };
    const brain = (x, y, s) => { pen.ell(x, y - s * 0.5, s, s * 0.7, { tone: 0.06, w: 0.55 }); pen.scribble(x, y - s * 0.5, s * 0.6, { turns: 2.2, ry: 0.6, w: 0.3, a: 0.6 }); };
    const rock = (x, y, s) => pen.poly([[x - s, y + 2], [x - s * 0.72, y - s * 0.5], [x - s * 0.1, y - s * 0.82], [x + s * 0.62, y - s * 0.5], [x + s, y + 2]], { s: th !== 'vent' && th !== 'trench', tone: 0.1, hatch: SH('r', 0.5, 0.5, 1.1), w: 0.55 });
    const ribs = (x, y, s) => { for (let k = 0; k < 4; k++) pen.line([[x + k * 5, y + 1], [x + k * 5 - 3, y - s * 0.6], [x + k * 5 + 2.4, y - s]], { s: true, w: 0.5, a: 0.75, passes: 1 }); pen.seg(x - 3, y + 0.4, x + 19, y + 0.4, L1); };
    const plank = (x, y) => { const a = (r() - 0.5) * 1.2, l = 7 + r() * 8; pen.seg(x, y, x + Math.cos(a) * l, y - Math.abs(Math.sin(a)) * l, { w: 0.9, a: 0.8, passes: 1 }); };
    // 바다 밑 땅
    const top = []; for (let x = xa; x <= xb; x += 1) top.push([x, Math.min(gy[x], VH + 8)]);
    pen.poly(top.concat([[xb, VH + 10], [xa, VH + 10]]), { tone: TONE[th], line: false, step: 2 });
    for (let x = xa; x < xb; x += 1) {      // 모래·바위의 결
      const y = gy[x]; if (y > VH) continue; if (Math.abs(gy[Math.min(L.len, x + 1)] - y) > 6) continue;
      const k = th === 'trench' || th === 'abyss' ? 0.7 : th === 'vent' ? 0.6 : th === 'shoal' ? 0.24 : 0.4;
      if (r() < k) { const l = (th === 'trench' || th === 'abyss' ? 7 : 4) + r() * (th === 'trench' || th === 'abyss' ? 13 : 7); pen.seg(x, y + 1.2, x - l * 0.5, y + 1.2 + l, { w: 0.32, a: 0.26 + 0.34 * r(), passes: 1, noOver: true }); }
      if (th === 'shoal' && r() < 0.05) { const l = 4 + r() * 8; pen.seg(x, y + 3 + r() * 10, x + l, y + 3.4 + r() * 10, { w: 0.3, a: 0.4, passes: 1 }); }
      if ((th === 'shoal' || th === 'coral' || th === 'ice') && r() < 0.03) pen.dot(x, y + 4 + r() * 12, 0.4, 0.5);
    }
    // 벼랑의 세로 결
    for (let x = xa; x < xb; x += 1) { const a = gy[x], b2 = gy[Math.min(L.len, x + 1)]; if (Math.abs(a - b2) > 6 && Math.min(a, b2) < VH) { const y0 = Math.min(a, b2), y1 = Math.min(VH, Math.max(a, b2)), d = a > b2 ? 1 : -1; for (let k = 1; k < 4; k++) pen.seg(x + d * k * 2.2, y0 + 2 + r() * 4, x + d * k * 2.2, Math.min(VH, y0 + (y1 - y0) * (0.5 + 0.5 * r())), { w: 0.3, a: 0.4, passes: 1 }); } }
    let run = null; for (let i = 0; i < top.length; i++) { const on = top[i][1] <= VH + 2; if (on) (run = run || []).push(top[i]); if ((!on || i === top.length - 1) && run) { if (run.length > 1) pen.line(run, { w: 0.8, a: 1, step: 1.6 }); run = null; } }
    // 바닥에서 자라는 것들 (보스 방은 비워 둔다)
    const inRoom = x => L.gates.some(g => Math.abs(x - g.x) < 196);
    for (let x = Math.max(x0 + 14, 30); x < Math.min(L.len - 20, x0 + CHUNK - 14); x += 1) {
      const y = gy[x]; if (y > VH - 4 || !flat(x)) continue; const q = r(), room = inRoom(x);
      if (th === 'shoal') { if (q < 0.045) grass(x, y); else if (q < 0.052 && !room) rock(x, y, 3 + r() * 4); }
      else if (th === 'coral') { if (q < 0.022 && !room) coral(x, y + 1, 5 + r() * 6, (r() - 0.5) * 0.4, 2 + ((r() * 2) | 0)); else if (q < 0.03 && !room) brain(x, y + 1, 4 + r() * 5); else if (q < 0.05) grass(x, y); }
      else if (th === 'wreck') { if (q < 0.014) plank(x, y); else if (q < 0.019 && !room) ribs(x, y, 9 + r() * 8); else if (q < 0.03) grass(x, y); else if (q < 0.036 && !room) rock(x, y, 3 + r() * 4); }
      else if (th === 'vent') { if (q < 0.016 && !room) rock(x, y, 3 + r() * 6); else if (q < 0.022 && !room) pen.poly([[x - 3, y + 1], [x - 1.4, y - 7 - r() * 6], [x + 1.6, y - 7 - r() * 5], [x + 3, y + 1]], { tone: 0.2, hatch: SH('r', 0.5, 0.6, 1), w: 0.5 }); }
      else if (th === 'ice') { if (q < 0.014 && !room) rock(x, y, 3 + r() * 5); else if (q < 0.026) grass(x, y); }
      else if (th === 'trench') { if (q < 0.014 && !room) rock(x, y, 3 + r() * 7); else if (q < 0.02) grass(x, y); }
      else if (th === 'abyss') { if (q < 0.01 && !room) ribs(x, y, 10 + r() * 10); else if (q < 0.018 && !room) rock(x, y, 3 + r() * 6); else if (q < 0.03) pen.dot(x, y - 3 - r() * 10, 0.6, 0.6); }
    }
    // 얼음·바위 지붕 (수면보다 낮은 곳만)
    let cr = null;
    for (let x = xa; x <= xb + 1; x += 1) {
      const has = x <= xb && cy[x] > SEA + 1;
      if (has) (cr = cr || []).push([x, cy[x]]);
      if (!has && cr) {
        if (cr.length > 2) {
          const ice = th === 'ice', yt = ice ? SEA - 5 : -12;
          pen.poly(cr.concat([[cr[cr.length - 1][0], yt], [cr[0][0], yt]]), { tone: ice ? 0.015 : 0.12, line: false, step: 2, hatch: ice ? { ang: 0.5, gap: 3.4, a: 0.22 } : { ang: -0.9, gap: 2.1, a: 0.3 } });
          if (ice) { pen.line([[cr[0][0], yt], [cr[cr.length - 1][0], yt]], { w: 0.7, a: 0.9, step: 2 }); cr.forEach(q => { if (r() < 0.05 && q[0] > x0 + 6 && q[0] < x0 + CHUNK - 6) { const l = 4 + r() * 9; pen.poly([[q[0] - 2, q[1] - 0.6], [q[0] + 0.4, q[1] + l], [q[0] + 2.4, q[1] - 0.6]], { tone: 0.02, w: 0.45 }); } if (r() < 0.12) { const l = 5 + r() * 10; pen.seg(q[0], q[1] - 2, q[0] + l * 0.6, q[1] - 2 - l * 0.7, { w: 0.3, a: 0.3, passes: 1, noOver: true }); } }); }
          else cr.forEach(q => { if (r() < 0.7) { const l = 6 + r() * 12; pen.seg(q[0], q[1] - 1.2, q[0] + l * 0.5, q[1] - 1.2 - l, { w: 0.32, a: 0.3 + 0.35 * r(), passes: 1, noOver: true }); } });
          pen.line(cr, { w: 0.8, a: 1, step: 1.6 });
        }
        cr = null;
      }
    }
    // 꾸밈: 가라앉은 배
    L.deco.forEach(d => {
      if (d.x + d.w < xa - 4 || d.x > xb + 4) return;
      if (d.k === 'hulk') {
        const yb = gy[Math.min(L.len, Math.round(d.x + d.w / 2))] + 3, w = d.w, h = 26, x1 = d.x + w;
        pen.poly([[d.x - 4, yb - h + 6], [d.x + w * 0.3, yb - h], [x1 - 6, yb - h - 6], [x1 + 8, yb - h - 9], [x1 - 8, yb + 2], [d.x + 10, yb + 2]], { tone: 0.12, hatch: SH('b', 0.35, 0.6, 1.1), w: 0.8, a: 1 });
        for (let x = d.x + 12; x < x1 - 10; x += 13) pen.ell(x, yb - h * 0.5 - (x - d.x) / w * 5, 2, 2, { tone: 0.5, w: 0.4 });
        for (let x = d.x + 8; x < x1 - 12; x += 7) pen.seg(x, yb - 2, x + 1.5, yb - h * 0.34, { w: 0.3, a: 0.4, passes: 1, noOver: true });
        pen.poly([[d.x + w * 0.5, yb - h - 2], [d.x + w * 0.5 + 2, yb - h - 16], [d.x + w * 0.74, yb - h - 19], [d.x + w * 0.76, yb - h - 5]], { tone: 0.08, hatch: SH('r', 0.6, 0.45, 1.2), w: 0.6 });
        pen.seg(d.x + w * 0.3, yb - h, d.x + w * 0.22, yb - h - 30, { w: 0.7, a: 1, passes: 1 }); pen.seg(d.x + w * 0.26, yb - h - 20, d.x + w * 0.14, yb - h - 22, L1);
        pen.poly([[d.x + w * 0.36, yb - h * 0.5], [d.x + w * 0.4, yb - h * 0.2], [d.x + w * 0.46, yb - 2], [d.x + w * 0.4, yb + 1], [d.x + w * 0.33, yb - 5]], { s: true, tone: 0.75, w: 0.4 });      // 뚫린 구멍
      }
    });
    return pen.done(0.36);
  };

  /* 먼 배경: 800칸마다 되풀이되는 흐린 그림. 수면 위에는 구름, 물속에는 빛줄기와 먼 바위 */
  DS.FARW = 800;
  DS.drawFar = function (L) {
    const FW = DS.FARW, pen = new Pen(FW, VH, DS.hash('far' + L.idx), { origin: [0, 0], noFill: true }), r = pen.rng, th = L.theme, o = { w: 0.45, a: 0.3, passes: 1, step: 2.4 };
    const wave = (base, amp, k1, k2, k3) => { const pts = []; for (let x = -4; x <= FW + 4; x += 4) { const t = x / FW * 6.2832; pts.push([x, base + amp * (Math.sin(t * k1 + 1) * 0.6 + Math.sin(t * k2 + 2.3) * 0.3 + Math.sin(t * k3) * 0.1)]); } return pts; };
    // 구름
    const nc = th === 'ice' ? 3 : th === 'trench' || th === 'abyss' ? 8 : 5;
    for (let i = 0; i < nc; i++) { const x = (i + 0.2 + r() * 0.6) * FW / nc, y = 6 + r() * 9, n = 10, pts = []; for (let k = 0; k < n; k++) { const a = k / n * 6.2832; pts.push([x + Math.cos(a) * (20 + r() * 12), y + Math.sin(a) * (3.4 + r() * 2)]); } pen.poly(pts, { paper: false, s: true, tone: th === 'trench' || th === 'abyss' ? 0.1 : 0.03, w: 0.4, a: 0.42, passes: 1 }); }
    if (th === 'shoal' || th === 'coral') { pen.ell(120, 9, 5, 5, { paper: false, w: 0.45, a: 0.4, passes: 1 }); for (let i = 0; i < 8; i++) { const a = i * 0.7854; pen.seg(120 + Math.cos(a) * 7.4, 9 + Math.sin(a) * 7.4, 120 + Math.cos(a) * 10, 9 + Math.sin(a) * 10, { w: 0.36, a: 0.34, passes: 1, noOver: true }); } }
    if (th === 'ice') { const pts = [[-4, SEA - 1]]; let x = 0; while (x < FW) { const w2 = 30 + r() * 50, h = SEA - 6 - r() * 14; pts.push([x + w2 * 0.5, h]); x += w2; pts.push([Math.min(FW + 4, x), SEA - 1]); } pen.line(pts, Object.assign({}, o, { a: 0.26 })); }
    // 물속
    const rays = th === 'shoal' ? 16 : th === 'coral' ? 12 : th === 'wreck' || th === 'ice' ? 7 : th === 'vent' ? 4 : 0;
    for (let i = 0; i < rays; i++) { const x = r() * FW, l = 50 + r() * (th === 'shoal' ? 110 : 70); pen.seg(x, SEA + 3, x - l * 0.34, SEA + 3 + l, { w: 0.5 + r() * 0.7, a: 0.1 + 0.08 * r(), passes: 1, jit: 0.15 }); }
    for (let i = 0; i < 46; i++) { const x = r() * FW, y = SEA + 8 + r() * (VH - SEA - 30), l = 5 + r() * 12; pen.seg(x, y, x + l, y + (r() - 0.5), { w: 0.3, a: 0.1 + 0.1 * r(), passes: 1 }); }
    if (th === 'shoal') { pen.line(wave(160, 9, 2, 5, 9), o); }
    else if (th === 'coral') { const pts = wave(152, 12, 3, 7, 13); pen.line(pts, o); for (let x = 10; x < FW; x += 26 + r() * 30) { const y = 152 + 12 * Math.sin(x / FW * 6.2832 * 3 + 1) * 0.6; pen.line([[x, y], [x - 3, y - 10], [x - 7, y - 16]], Object.assign({}, o, { a: 0.24 })); pen.line([[x - 3, y - 10], [x + 3, y - 18]], Object.assign({}, o, { a: 0.24 })); } }
    else if (th === 'wreck') { pen.line(wave(160, 8, 2, 6, 11), o); for (let i = 0; i < 4; i++) { const x = 60 + i * 200 + r() * 60; pen.seg(x, 160, x + 8, 110 + r() * 20, Object.assign({}, o, { a: 0.26 })); pen.seg(x + 2, 140, x + 18, 136, Object.assign({}, o, { a: 0.22 })); pen.line([[x - 30, 162], [x - 20, 150], [x + 34, 146], [x + 44, 160]], Object.assign({}, o, { a: 0.22 })); } }
    else if (th === 'vent') { pen.line(wave(156, 10, 3, 7, 12), o); for (let i = 0; i < 9; i++) { const x = r() * FW, h = 20 + r() * 34; pen.line([[x - 5, 160], [x - 2, 160 - h], [x + 2, 160 - h], [x + 5, 160]], Object.assign({}, o, { a: 0.24 })); pen.scribble(x, 152 - h, 5, { turns: 1.4, w: 0.3, a: 0.2 }); } }
    else if (th === 'ice') { pen.line(wave(164, 7, 2, 5, 8), o); pen.line(wave(50, 6, 4, 9, 15), Object.assign({}, o, { a: 0.22 })); }
    else if (th === 'trench' || th === 'abyss') { for (let k = 0; k < 2; k++) { const pts = []; let y = 110 + k * 30; for (let x = -4; x <= FW + 4;) { const w2 = 30 + r() * 50; pts.push([x, y]); pts.push([x + w2, y]); x += w2; y = 84 + k * 34 + r() * 50; } pts[pts.length - 1][1] = pts[0][1]; pen.line(pts, Object.assign({}, o, { a: k ? 0.22 : 0.3 })); } if (th === 'abyss') for (let i = 0; i < 26; i++) pen.dot(r() * FW, SEA + 20 + r() * 150, 0.5 + r() * 0.5, 0.3); }
    return pen.done(0.3);
  };
})();
