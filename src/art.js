/* 그림 등록부 — 잠수함·적·보스·탄·아이템을 연필로 그려 미리 만들어 둔다 */
(function () {
  'use strict';
  const DS = window.DS, Pen = DS.Pen, RNG = DS.RNG, PI = Math.PI;
  const ART = DS.ART = { defs: {}, cache: {} };
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  DS.hash = hash;
  function def(name, w, h, fn, o) { ART.defs[name] = { w: w, h: h, fn: fn, o: o || {} }; }
  ART.def = def;
  ART.get = function (name) {
    let s = ART.cache[name];
    if (s) return s;
    const d = ART.defs[name];
    if (!d) throw new Error('그림 없음: ' + name);
    const n = d.o.boil == null ? 2 : d.o.boil, frames = [];
    for (let i = 0; i < n; i++) {
      const pen = new Pen(d.w, d.h, hash(name) + i * 7919, { k: d.o.k, noFill: d.o.noFill, ink: d.o.ink, bold: d.o.bold });
      pen.lay = RNG(hash(name) ^ 0x51ed);
      d.fn(pen, i);
      frames.push(pen.done(d.o.grain));
    }
    s = ART.cache[name] = { name: name, w: d.w, h: d.h, frames: frames, o: d.o };
    return s;
  };
  ART.clear = function () { Object.keys(ART.cache).forEach(n => { ART.cache[n].frames.forEach(f => { f.width = f.height = 0; }); delete ART.cache[n]; }); };      // 종이 색이 바뀌면 모두 다시 그린다

  const SH = (side, f, a, gap, ang) => ({ side: side || 'b', f: f == null ? 0.55 : f, a: a == null ? 0.45 : a, gap: gap || 1.2, ang: ang == null ? -0.95 : ang });
  DS.SH = SH;
  const L1 = { w: 0.42, a: 0.9, passes: 1 };

  /* ───────── 내 잠수함: 통통한 선체에 둥근 창 셋, 함교와 잠망경. 뱃머리가 오른쪽이다. 프로펠러는 따로 그려 돌린다 ───────── */
  def('sub', 52, 42, p => {
    p.poly([[-14.5, -3.4], [-20.6, -1.5], [-20.6, 1.5], [-14.5, 3.4]], { tone: 0.16, w: 0.5 });
    p.poly([[-16.4, -2.6], [-21.4, -8.2], [-18.6, -8.4], [-13.2, -4.4]], { tone: 0.3, w: 0.45 });
    p.poly([[-16.4, 2.6], [-21.4, 8.2], [-18.6, 8.4], [-13.2, 4.4]], { tone: 0.3, w: 0.45 });
    p.line([[0.4, -13], [0.4, -18.4], [3.8, -18.4]], { w: 0.62, a: 1, passes: 1 });
    p.poly([[-5.6, -7.6], [-4.4, -13.4], [4, -13.4], [5.6, -7.6]], { tone: 0.16, hatch: SH('r', 0.55, 0.5, 1.1), w: 0.55 });
    p.rect(1.4, -10.6, 3.6, 2.2, { tone: 0.45, w: 0.36 });
    p.poly([[-17.4, 0], [-15, -5.4], [-8, -8.3], [3, -8.8], [12, -7], [17.6, -2.6], [18.6, 0.6], [16.4, 4.6], [10, 7.8], [0, 9], [-9, 8.2], [-15.2, 5]], { s: true, tone: 0.05, hatch: SH('b', 0.56, 0.5, 1.05), w: 0.66 });
    p.line([[12.6, -6.6], [14.2, -1], [13.4, 5.6]], { s: true, w: 0.36, a: 0.7, passes: 1 });
    p.line([[-11, -7], [-12, 0], [-11.4, 6.6]], { s: true, w: 0.36, a: 0.6, passes: 1 });
    [[8.2, -0.8, 3.3], [0.6, -0.4, 2.6], [-6.4, -0.2, 2.6]].forEach(q => {
      p.ell(q[0], q[1], q[2], q[2], { tone: 0.22, w: 0.52 }); p.ell(q[0], q[1], q[2] - 1, q[2] - 1, { paper: false, w: 0.22, a: 0.5, passes: 1 });
      p.eraseEll(q[0] - q[2] * 0.3, q[1] - q[2] * 0.34, q[2] * 0.34, q[2] * 0.22);
    });
    p.ell(16.3, 2.7, 1.1, 1.1, { tone: 0.6, w: 0.3 });
    for (let x = -8; x <= 9; x += 4.2) p.dot(x, 6.3 - Math.abs(x) * 0.06, 0.34, 0.6);
  });
  def('prop', 8, 18, (p, i) => {
    const L = [7, 4.2, 1.6][i];
    p.seg(0, -L, 0, L, { w: 0.7, a: 0.95, passes: 1, jit: 0.1, noOver: true });
    p.ell(0, 0, 1.6, 7.4, { paper: false, w: 0.22, a: 0.3, passes: 1, jit: 0.08 });
  }, { noFill: true, boil: 3, grain: 0.3 });

  /* ───────── 바닷속의 적 ───────── */
  def('mini', 34, 24, p => {
    p.poly([[-10, -1.6], [-14.6, -5.4], [-13, -5.6], [-8.6, -2.8]], { tone: 0.5, w: 0.4 }); p.poly([[-10, 1.6], [-14.6, 5.4], [-13, 5.6], [-8.6, 2.8]], { tone: 0.5, w: 0.4 });
    p.line([[1, -7.6], [1, -10.4], [3.2, -10.4]], { w: 0.5, a: 1, passes: 1 });
    p.poly([[-2.4, -4], [-1.6, -7.6], [3, -7.6], [4, -4]], { tone: 0.5, w: 0.45 });
    p.poly([[-12, 0], [-9, -3.6], [-2, -4.8], [6, -4.4], [11.4, -2], [13, 0.4], [10.6, 3.4], [3, 5], [-5, 4.6], [-10, 2.8]], { s: true, tone: 0.36, hatch: SH('b', 0.5, 0.7, 0.95), w: 0.6 });
    p.ell(7, -0.4, 2.3, 2.3, { tone: 0.02, w: 0.45 }); p.dot(7.6, -0.3, 0.8, 0.95);
    p.seg(5.6, -3.6, 9.4, -2.4, { w: 0.5, a: 0.9, passes: 1 });
    p.seg(-14.6, -3.2, -14.6, 3.2, { w: 0.5, a: 0.8, passes: 1 });
  });
  def('angler', 38, 34, (p, i) => {
    p.poly([[-8, -1], [-14.6, -6], [-13, 0.6], [-14.6, 7], [-8, 3]], { s: true, tone: 0.3, hatch: { ang: 0.2, gap: 1.1, a: 0.5 }, w: 0.5 });
    p.poly([[-9, 1], [-7, -6.4], [0, -9.6], [7, -8], [11.6, -3], [9, -1.4], [12, 3.6], [8, 8.4], [0, 10], [-6, 7]], { s: true, tone: 0.3, hatch: SH('b', 0.5, 0.75, 0.95), w: 0.62 });
    p.poly([[12, -2.8], [5.2, -0.6], [12.4, 3.6]], { tone: 0.02, w: 0.45 });
    for (let k = 0; k < 3; k++) { p.seg(6.8 + k * 1.9, -1.1 - k * 0.5, 7.5 + k * 1.9, 0.4 - k * 0.2, L1); p.seg(7 + k * 1.9, 1.6 + k * 0.5, 7.7 + k * 1.9, 0.2 + k * 0.3, L1); }
    p.ell(5.4, -4.8, 1.6, 1.6, { tone: 0.02, w: 0.4 }); p.dot(5.9, -4.7, 0.6, 1); p.seg(3.4, -7, 7.2, -5.8, { w: 0.5, a: 0.9, passes: 1 });
    p.line([[1, -9.4], [3, -14], [9, -14.6], [13, -11.4]], { s: true, w: 0.45, a: 0.95, passes: 1 });
    p.ell(13.4, -9.6, 1.9, 1.9, { tone: 0.02, w: 0.5 });
    for (let k = 0; k < 6; k++) { const a = k * 1.047 + i * 0.5, r0 = 3, r1 = 4.4 + (k % 2); p.seg(13.4 + Math.cos(a) * r0, -9.6 + Math.sin(a) * r0, 13.4 + Math.cos(a) * r1, -9.6 + Math.sin(a) * r1, { w: 0.3, a: 0.7, passes: 1, noOver: true }); }
    p.poly([[-2, 4], [-5, 9.6], [1, 7.4]], { tone: 0.4, w: 0.36 });
  }, { boil: 2 });
  def('shrimp', 18, 14, (p, i) => {
    const c = i ? 1 : 0;
    p.poly([[5, -1.6], [2, -3.2], [-2, -2.8], [-4.6, -0.6 + c], [-5.6, 2.2 + c], [-4, 3 + c], [-2.6, 0.8], [1, 0.6], [5, 0.6]], { s: true, tone: 0.14, w: 0.5 });
    for (let k = -1; k <= 1; k++) p.seg(k * 1.8, -2.8, k * 1.8 - 0.3, 0.6, { w: 0.25, a: 0.6, passes: 1, noOver: true });
    p.line([[5, -1.4], [7.6, -3.6 - c]], { w: 0.3, a: 0.8, passes: 1 }); p.line([[5, -1], [7.8, -1.2 + c]], { w: 0.3, a: 0.8, passes: 1 });
    p.dot(4.1, -0.9, 0.5, 1);
    for (let k = 0; k < 3; k++) p.seg(-1 + k * 1.6, 0.7, -1.4 + k * 1.6, 2.2 + c * 0.4, { w: 0.25, a: 0.7, passes: 1, noOver: true });
  }, { boil: 2, grain: 0.2 });
  def('hair', 14, 36, (p, i) => {      // 갈치: 머리를 위로 하고 선 채로 떠 있다
    const s = i ? 1 : -1;
    p.poly([[-1.2, -14], [1.6, -14.6], [2.6, -11], [2.2 + s * 0.8, -2], [1.4 - s * 0.8, 8], [0.2, 15.4], [-0.6 - s * 0.8, 8], [-1.8 + s * 0.8, -2], [-2.2, -10]], { s: true, tone: 0.03, hatch: { ang: 1.5, gap: 0.9, a: 0.35 }, w: 0.55 });
    p.line([[2.8, -11], [3.6 + s * 0.8, -2], [2.6 - s * 0.8, 8]], { s: true, w: 0.25, a: 0.6, passes: 1 });
    p.dot(0.4, -12, 0.6, 1); p.seg(-1.2, -14, 0.5, -15.8, L1);
  }, { boil: 2 });
  def('emine', 18, 18, p => {
    for (let k = 0; k < 8; k++) { const a = k * 0.7854 + 0.2; p.seg(Math.cos(a) * 4, Math.sin(a) * 4, Math.cos(a) * 7.2, Math.sin(a) * 7.2, { w: 0.6, a: 1, passes: 1, noOver: true }); }
    p.ell(0, 0, 4.6, 4.6, { tone: 0.42, hatch: SH('b', 0.5, 0.6, 0.9), w: 0.6 });
  });
  def('tad', 14, 9, (p, i) => {
    p.line([[-1, 0], [-3.6, i ? 1.4 : -1.4], [-6, 0]], { s: true, w: 0.45, a: 0.9, passes: 1 });
    p.ell(1.6, 0, 2.6, 2.2, { tone: 0.62, w: 0.45 }); p.dot(2.8, -0.6, 0.45, 0.2);
  }, { boil: 2, grain: 0.2 });
  def('plume', 22, 100, (p, i) => {
    const r = p.rng;
    for (let k = 0; k < 4; k++) { const x = -5 + k * 3.3 + r() * 1.5, pts = []; for (let y = 48; y >= -40 + r() * 10; y -= 6) pts.push([x + Math.sin(y * 0.3 + k + i) * 1.6 + (48 - y) * 0.015 * (k - 1.5), y]); p.line(pts, { s: true, w: 0.42, a: 0.7, passes: 1 }); }
    for (let k = 0; k < 5; k++) p.scribble(-6 + r() * 12, -42 + r() * 10, 3 + r() * 2.4, { turns: 1.6, w: 0.36, a: 0.75 });
  }, { noFill: true, boil: 3, grain: 0.35 });
  def('chim', 16, 22, p => {
    p.poly([[-5.6, 11], [-3, -8], [-1, -10.4], [1.6, -9.6], [3, -7], [6, 11]], { s: false, tone: 0.2, hatch: SH('r', 0.5, 0.6, 1), w: 0.6 });
    p.seg(-3.6, -3, 3.2, -2.4, { w: 0.3, a: 0.6, passes: 1 }); p.seg(-4.4, 4, 4.4, 4.6, { w: 0.3, a: 0.6, passes: 1 });
  });

  /* ───────── 물 위의 적: 호위함·구축함·이지스함과 전투기. 그림의 가운데보다 12칸 아래가 수면이다 ───────── */
  function hull(q, L, tone) {
    q.poly([[-L, -5], [L + 5, -6.4], [L - 2, 1], [L - 7, 9.6], [-L + 5, 9.6], [-L - 1, 1]], { tone: tone, hatch: SH('b', 0.42, 0.6, 1.05), w: 0.64 });
    q.seg(-L - 0.4, 0.8, L - 2, 0.8, { w: 0.3, a: 0.5, passes: 1 });
  }
  const gun = (q, x, d) => { q.poly([[x - 2.6, -5.8], [x - 2, -8.8], [x + 2.4, -8.8], [x + 3, -5.9]], { tone: 0.32, w: 0.45 }); q.seg(x + 2 * d, -7.8, x + 8 * d, -9.2, { w: 0.5, a: 1, passes: 1 }); };
  def('frig', 78, 54, p => p.at(0, 12, 0, q => {
    q.seg(-2, -12, -2, -23, L1); q.seg(-5.4, -19.6, 1.4, -19.6, L1);
    q.poly([[-12, -5.4], [-12, -12], [6, -12], [9, -5.6]], { tone: 0.1, hatch: SH('r', 0.6, 0.45, 1.2), w: 0.55 });
    q.rect(1.6, -9.4, 5, 2.2, { tone: 0.45, w: 0.35 });
    q.poly([[-9, -12], [-8, -16.4], [-3.6, -16.4], [-3, -12]], { tone: 0.3, w: 0.45 });
    gun(q, 18, 1);
    hull(q, 30, 0.14);
  }));
  def('dest', 96, 58, p => p.at(0, 12, 0, q => {
    q.seg(2, -14, 2, -27, L1); q.seg(-2, -23, 6, -23, L1); q.seg(-1, -20, 5, -20, L1);
    q.poly([[-20, -5.4], [-20, -11], [-8, -11], [-8, -14.4], [10, -14.4], [13, -5.6]], { tone: 0.1, hatch: SH('r', 0.6, 0.45, 1.2), w: 0.58 });
    q.rect(5, -11.6, 6, 2.4, { tone: 0.45, w: 0.35 });
    q.poly([[-6, -14.4], [-5, -19.6], [-0.6, -19.6], [0, -14.4]], { tone: 0.32, w: 0.45 }); q.poly([[-17, -11], [-16, -15.4], [-12, -15.4], [-11.4, -11]], { tone: 0.32, w: 0.45 });
    gun(q, 23, 1); gun(q, -28, -1);
    hull(q, 40, 0.18);
  }));
  def('aegis', 112, 62, p => p.at(0, 12, 0, q => {
    q.line([[-2, -18], [1, -30], [3, -18]], { w: 0.5, a: 1, passes: 1 }); q.seg(-3, -25, 5, -25, L1);
    q.poly([[-26, -5.4], [-24, -12], [-12, -12], [-10, -18.4], [12, -18.4], [18, -12], [22, -5.6]], { tone: 0.08, hatch: SH('r', 0.62, 0.45, 1.2), w: 0.6 });
    q.poly([[-5, -16.6], [-1.4, -16.6], [0.4, -13.6], [-1.4, -10.6], [-5, -10.6], [-6.8, -13.6]], { tone: 0.4, w: 0.4 });      // 팔각 레이더
    q.poly([[5.4, -16.6], [9, -16.6], [10.8, -13.6], [9, -10.6], [5.4, -10.6], [3.6, -13.6]], { tone: 0.4, w: 0.4 });
    for (let k = 0; k < 4; k++) q.rect(-20 + k * 2.6, -8.4, 1.8, 1.8, { tone: 0.5, w: 0.25, passes: 1 });
    q.poly([[-36, -5.2], [-35, -9.4], [-30, -9.4], [-29, -5.3]], { tone: 0.3, w: 0.45 });
    gun(q, 32, 1);
    hull(q, 48, 0.2);
  }));
  def('plane', 42, 18, p => {
    p.poly([[-17, -1], [-19.6, -7], [-16, -7], [-11.4, -1.8]], { tone: 0.3, w: 0.45 });
    p.poly([[-19, -1.6], [-10, -2.6], [6, -2.6], [14, -1.2], [19.6, 1], [13, 2.6], [-17, 2.6], [-19.6, 0.8]], { s: true, tone: 0.12, hatch: SH('b', 0.5, 0.55, 1.05), w: 0.58 });
    p.poly([[4, -2.6], [7, -4.4], [11.4, -3.4], [13.4, -1.4]], { s: true, tone: 0.5, w: 0.36 });
    p.poly([[-7, 1], [3, 1], [-6, 6.6], [-10.4, 6.6]], { tone: 0.26, w: 0.45 });
  });

  /* ───────── 어뢰·기뢰·대함미사일과 적의 탄, 아이템 ───────── */
  def('torp', 22, 9, p => {
    p.poly([[-7.4, -1.5], [-9.6, -3.4], [-5.6, -1.5]], { tone: 0.5, w: 0.3 }); p.poly([[-7.4, 1.5], [-9.6, 3.4], [-5.6, 1.5]], { tone: 0.5, w: 0.3 });
    p.poly([[-7.4, -1.6], [5, -1.6], [7.4, -1], [8.4, 0], [7.4, 1], [5, 1.6], [-7.4, 1.6]], { tone: 0.28, w: 0.5 });
    p.seg(3.6, -1.5, 3.6, 1.5, { w: 0.3, a: 0.7, passes: 1, noOver: true });
  }, { boil: 1 });
  def('mine', 16, 16, p => {
    for (let k = 0; k < 6; k++) { const a = k * 1.0472 + 0.52; p.seg(Math.cos(a) * 3.4, Math.sin(a) * 3.4, Math.cos(a) * 6, Math.sin(a) * 6, { w: 0.55, a: 1, passes: 1, noOver: true }); }
    p.ell(0, 0, 3.9, 3.9, { tone: 0.24, hatch: SH('b', 0.5, 0.65, 0.85), w: 0.6 });
  }, { boil: 2 });
  def('ssm', 9, 20, p => {
    p.mir(q => q.poly([[1.5, 3.4], [3.6, 8.4], [1.5, 7]], { tone: 0.5, w: 0.3 }));
    p.poly([[-1.6, 7], [-1.6, -4.6], [0, -8.8], [1.6, -4.6], [1.6, 7]], { tone: 0.26, w: 0.48 });
    p.seg(-1.6, -3.2, 1.6, -3.2, { w: 0.3, a: 0.7, passes: 1, noOver: true });
  }, { boil: 1 });
  def('eb', 8, 8, p => { p.ell(0, 0, 2.5, 2.5, { tone: 0.78, w: 0.5 }); p.ell(0, 0, 3.5, 3.5, { paper: false, w: 0.24, a: 0.5, passes: 1 }); });
  def('etorp', 16, 7, p => {
    p.poly([[-5.4, -1.2], [-7.2, -2.8], [-4, -1.2]], { tone: 0.6, w: 0.3 }); p.poly([[-5.4, 1.2], [-7.2, 2.8], [-4, 1.2]], { tone: 0.6, w: 0.3 });
    p.poly([[-5.4, -1.3], [3.6, -1.3], [6, 0], [3.6, 1.3], [-5.4, 1.3]], { tone: 0.62, w: 0.45 });
  }, { boil: 1 });
  def('dc', 9, 11, p => { p.rect(0, 0, 4.8, 7.2, { tone: 0.42, w: 0.5 }); p.seg(-2.4, -1.6, 2.4, -1.6, { w: 0.3, a: 0.8, passes: 1, noOver: true }); p.seg(-2.4, 1.6, 2.4, 1.6, { w: 0.3, a: 0.8, passes: 1, noOver: true }); }, { boil: 1 });
  def('bubb', 11, 11, (p, i) => { p.ell(0, 0, 3.7, 3.7, { tone: 0.03, w: 0.6 }); p.ell(0.6, 0.7, 1.9, 1.9, { tone: 0.6, w: 0.3 }); p.line([[-2.4, -0.6], [-1.6, -2.1], [-0.2, -2.6]], { s: true, w: 0.3, a: 0.7, passes: 1 }); }, { boil: 2 });
  def('itbox', 16, 16, p => { p.rect(0, 0, 12.6, 12.6, { tone: 0.02, w: 0.8, a: 1 }); p.rect(0, 0, 10, 10, { paper: false, w: 0.25, a: 0.5, passes: 1 }); }, { grain: 0.25 });
  def('star', 18, 18, p => {
    const pts = []; for (let i = 0; i < 10; i++) { const a = -1.5708 + i * 0.6283, r = i % 2 ? 3.1 : 7.2; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    p.poly(pts, { tone: 0.1, hatch: SH('r', 0.5, 0.6, 0.9), w: 0.7, a: 1 });
  }, { grain: 0.3 });
  def('inkc', 70, 56, (p, i) => {
    const r = p.rng;
    for (let k = 0; k < 9; k++) p.scribble((r() - 0.5) * 34, (r() - 0.5) * 22, 9 + r() * 9, { turns: 2.6, w: 0.9, a: 0.5 + 0.3 * r(), jit: 0.5 });
  }, { noFill: true, boil: 2, grain: 0.45 });

  /* ───────── 중간 보스와 스테이지 보스의 몸. 길게 뻗는 다리·혀·집게발은 여기 그리지 않고, 뻗을 때마다 그 자리에서 빠른 선으로 긋는다 ───────── */
  const HB = (tone, f) => SH('b', f == null ? 0.56 : f, 0.5, 1.1);
  /* 게: 앞에서 본 모습. spikes가 있으면 등딱지 둘레에 가시가 돋는다 */
  function crab(p, rx, ry, legs, tone, spikes, mad) {
    p.mir(q => { for (let k = 0; k < legs; k++) { const y0 = 1 + k * (ry * 0.3); q.line([[rx - 3, y0], [rx + 6 + k * 2.6, y0 - 3 + k * 2.4], [rx + 9 + k * 3.2, ry + 5]], { w: 0.66, a: 1, passes: 1 }); } });
    p.mir(q => { q.seg(rx * 0.26, -ry + 1.4, rx * 0.34, -ry - 6, { w: 0.62, a: 1, passes: 1 }); });
    const pts = [], n = 9;
    for (let i = 0; i < n; i++) { const a = PI + i / (n - 1) * PI; pts.push([Math.cos(a) * rx, Math.sin(a) * ry * 0.95 + (i % 2 && i !== 4 ? -ry * 0.07 : 0)]); }
    pts.push([rx * 0.78, ry * 0.66], [rx * 0.3, ry * 0.98], [-rx * 0.3, ry * 0.98], [-rx * 0.78, ry * 0.66]);
    p.poly(pts, { s: true, tone: tone, hatch: HB(), w: 0.74 });
    if (spikes) for (let i = 0; i < 9; i++) { const a = PI + (i + 0.5) / 9 * PI, x = Math.cos(a) * rx, y = Math.sin(a) * ry * 0.95; p.poly([[x - 2.2, y + 1], [x * 1.12, y * 1.22 - 1], [x + 2.2, y + 1]], { tone: tone + 0.16, w: 0.5 }); }
    p.mir(q => {
      q.ell(rx * 0.36, -ry - 7.6, 2.8, 3, { tone: 0.01, w: 0.5 }); q.dot(rx * 0.36 - 0.6, -ry - 7.2, 1.1, 1);
      if (mad) q.seg(rx * 0.2, -ry - 9, rx * 0.5, -ry - 11.6, { w: 0.7, a: 1, passes: 1 });
      q.ell(rx - 1.6, -1, 3.6, 3.2, { tone: tone + 0.12, w: 0.55 });
    });
    p.line([[-rx * 0.2, ry * 0.36], [0, ry * 0.5], [rx * 0.2, ry * 0.36]], { s: true, w: 0.5, a: 0.95, passes: 1 });
    for (let i = -2; i <= 2; i++) p.seg(i * rx * 0.2, -ry * 0.3, i * rx * 0.2 + 0.6, ry * 0.1, { w: 0.26, a: 0.45, passes: 1 });
  }
  def('b_crab', 106, 70, p => p.at(0, 5, 0, q => crab(q, 30, 15, 3, 0.1, false, false)));
  def('b_hermit', 86, 78, p => {
    p.poly([[-18, 12], [-24, -2], [-18, -18], [-4, -29], [10, -26], [20, -14], [22, 0], [16, 12]], { s: true, tone: 0.1, hatch: [HB(0, 0.5), { ang: 0.5, gap: 2.4, a: 0.25 }], w: 0.74 });
    p.line([[-18, -4], [-8, -10], [6, -8], [14, 0], [10, 8]], { s: true, w: 0.5, a: 0.9, passes: 1 }); p.line([[-12, -16], [-2, -19], [8, -16], [12, -10]], { s: true, w: 0.45, a: 0.8, passes: 1 }); p.line([[-4, -26], [0, -23], [5, -23]], { s: true, w: 0.4, a: 0.8, passes: 1 });
    p.at(0, 20, 0, q => crab(q, 19, 9, 3, 0.14, false, false));
  });
  def('b_king', 124, 78, p => p.at(0, 6, 0, q => crab(q, 36, 18, 4, 0.16, true, true)));
  def('b_spider', 132, 74, p => {
    p.mir(q => { for (let k = 0; k < 4; k++) q.line([[8, -1 + k], [22 + k * 9, -24 + k * 2], [30 + k * 10, 30]], { w: 0.62, a: 1, passes: 1 }); });
    p.ell(0, 0, 13, 11, { tone: 0.2, hatch: HB(), w: 0.74 });
    for (let k = 0; k < 7; k++) { const a = PI + (k + 0.5) / 7 * PI; p.seg(Math.cos(a) * 12, Math.sin(a) * 10, Math.cos(a) * 15.4, Math.sin(a) * 13.4, { w: 0.5, a: 1, passes: 1, noOver: true }); }
    p.mir(q => { q.seg(3.6, -9, 5, -14, { w: 0.6, a: 1, passes: 1 }); q.ell(5.4, -15.6, 2.2, 2.4, { tone: 0.01, w: 0.45 }); q.dot(5, -15.2, 0.9, 1); });
    p.line([[-3, 4.6], [0, 6], [3, 4.6]], { s: true, w: 0.5, a: 0.95, passes: 1 });
  });
  /* 문어: 앞에서 본 둥근 머리와 말린 짧은 다리 */
  function octo(p, R, tone, spots, mad) {
    const r = p.lay;
    p.mir(q => { for (let k = 0; k < 3; k++) { const x0 = 3 + k * R * 0.32, y0 = R * 0.46, l = R * (0.74 - k * 0.1); q.poly([[x0 - 2.6, y0], [x0 - 1.2 + k, y0 + l * 0.6], [x0 + 3 + k * 2, y0 + l], [x0 + 7 + k * 2.4, y0 + l * 0.8], [x0 + 5 + k * 2, y0 + l * 0.58], [x0 + 3.6 + k, y0 + l * 0.44], [x0 + 3.4, y0]], { s: true, tone: tone + 0.07, w: 0.58 }); } });
    p.poly([[-R, R * 0.3], [-R * 1.03, -R * 0.35], [-R * 0.72, -R * 0.95], [0, -R * 1.2], [R * 0.72, -R * 0.95], [R * 1.03, -R * 0.35], [R, R * 0.3], [R * 0.6, R * 0.62], [0, R * 0.7], [-R * 0.6, R * 0.62]], { s: true, tone: tone, hatch: HB(0, 0.6), w: 0.76 });
    if (spots) for (let i = 0; i < spots; i++) { const a = PI + 0.3 + r() * (PI - 0.6), q = R * (0.5 + 0.4 * r()); p.ell(Math.cos(a) * q * 0.9, -R * 0.2 + Math.sin(a) * q * 0.8, 1.4 + r() * 2, 1.2 + r() * 1.6, { paper: false, w: 0.3, a: 0.6, passes: 1 }); }
    p.mir(q => {
      q.ell(R * 0.4, R * 0.04, R * 0.2, R * 0.24, { tone: 0.01, w: 0.52 }); q.ell(R * 0.35, R * 0.09, R * 0.09, R * 0.12, { tone: 0.9, w: 0.3 });
      if (mad) q.seg(R * 0.12, -R * 0.1, R * 0.62, -R * 0.36, { w: 0.85, a: 1, passes: 1 });
    });
    p.ell(0, R * 0.4, R * 0.1, R * 0.08, { tone: 0.5, w: 0.4 });
  }
  def('b_octo', 92, 86, p => p.at(0, -2, 0, q => octo(q, 27, 0.08, 0, false)));
  def('b_gocto', 104, 96, p => p.at(0, -2, 0, q => octo(q, 31, 0.14, 9, true)));
  def('b_kraken', 150, 136, p => p.at(0, -2, 0, q => {
    q.mir(z => { z.poly([[12, -46], [20, -66], [26, -42]], { tone: 0.3, w: 0.6 }); z.poly([[30, -36], [43, -50], [40, -28]], { tone: 0.3, w: 0.6 }); });
    q.poly([[-5, -52], [0, -70], [5, -52]], { tone: 0.3, w: 0.6 });
    octo(q, 44, 0.18, 16, true);
    q.line([[-20, -30], [-10, -20], [-16, -12]], { w: 0.5, a: 0.9, passes: 1 }); q.seg(-17, -24, -11, -27, L1); q.seg(-15, -18, -9, -21, L1);
  }));
  /* 오징어: 옆모습. 다리가 오른쪽을 향한다 */
  function squid(p, L, tone, cuttle) {
    if (!cuttle) p.poly([[-L, 0], [-L * 0.74, -L * 0.3], [-L * 0.44, -L * 0.13], [-L * 0.44, L * 0.13], [-L * 0.74, L * 0.3]], { s: true, tone: tone + 0.1, hatch: { ang: 1.2, gap: 1.2, a: 0.4 }, w: 0.58 });
    for (let k = -2; k <= 2; k++) p.poly([[L * 0.5, k * L * 0.05 - 1.3], [L * 0.76, k * L * 0.1 - 1], [L * (cuttle ? 0.86 : 0.98), k * L * (cuttle ? 0.16 : 0.13) + (cuttle ? 3 : 0)], [L * 0.76, k * L * 0.1 + 1.6], [L * 0.5, k * L * 0.05 + 1.3]], { s: true, tone: tone + 0.05, w: 0.5 });
    const h = cuttle ? 0.34 : 0.24;
    p.poly([[-L * (cuttle ? 0.74 : 0.86), 0], [-L * 0.4, -L * h * 0.86], [L * 0.2, -L * h], [L * 0.5, -L * h * 0.7], [L * 0.58, 0], [L * 0.5, L * h * 0.7], [L * 0.2, L * h], [-L * 0.4, L * h * 0.86]], { s: true, tone: tone, hatch: HB(), w: 0.74 });
    if (cuttle) for (let s = -1; s <= 1; s += 2) { const pts = []; for (let x = -L * 0.66; x <= L * 0.44; x += L * 0.09) pts.push([x, s * (L * h * (0.9 + 0.1 * Math.cos(x / L * 3)) + (pts.length % 2 ? 3.4 : 0.6))]); p.line(pts, { s: true, w: 0.45, a: 0.9, passes: 1 }); }
    if (cuttle) for (let k = 0; k < 5; k++) p.line([[-L * 0.5 + k * L * 0.16, -L * 0.14], [-L * 0.44 + k * L * 0.16, 0], [-L * 0.5 + k * L * 0.16, L * 0.14]], { s: true, w: 0.3, a: 0.45, passes: 1 });
    p.ell(L * 0.36, -L * 0.03, L * 0.1, L * 0.115, { tone: 0.01, w: 0.52 }); p.ell(L * 0.385, -L * 0.02, L * 0.045, L * 0.058, { tone: 0.9, w: 0.3 });
    p.line([[L * 0.25, -L * h * 0.86], [L * 0.29, 0], [L * 0.25, L * h * 0.86]], { s: true, w: 0.36, a: 0.6, passes: 1 });
  }
  def('b_squid', 104, 44, p => squid(p, 46, 0.08, false));
  def('b_cuttle', 84, 46, p => squid(p, 36, 0.12, true));
  def('b_gsquid', 142, 58, p => { squid(p, 64, 0.16, false); p.seg(14, -9, 30, -5, { w: 0.85, a: 1, passes: 1 }); });
  /* 개구리·두꺼비: 옆모습. 입이 오른쪽이다 */
  function frog(p, s, tone, warts, crown) {
    const P = (x, y) => [x * s, y * s], r = p.lay;
    p.poly([P(-16, 6), P(-22, -2), P(-12, -6), P(-4, 4), P(-8, 14), P(-20, 15), P(-23, 12.4), P(-14, 10)], { s: true, tone: tone + 0.08, w: 0.62 });
    p.poly([P(-18, 4), P(-14, -8), P(-2, -13), P(10, -10), P(20, -4), P(22.4, 2), P(18, 8), P(6, 13), P(-8, 13), P(-16, 10)], { s: true, tone: tone, hatch: HB(), w: 0.76 });
    p.line([P(-10, 10), P(2, 7), P(14, 8)], { s: true, w: 0.36, a: 0.6, passes: 1 });
    p.ell(9 * s, -11 * s, 4.6 * s, 4.6 * s, { tone: tone, w: 0.62 }); p.ell(9.6 * s, -11.4 * s, 3 * s, 3.1 * s, { tone: 0.01, w: 0.46 }); p.ell(10.4 * s, -11.2 * s, 1.4 * s, 1.6 * s, { tone: 0.9, w: 0.3 });
    p.line([P(22.4, 1.4), P(14, 3.6), P(4, 2.4)], { s: true, w: 0.66, a: 1, passes: 1 });
    p.dot(19.4 * s, -3 * s, 0.6, 0.9);
    p.poly([P(6, 9), P(8, 15), P(4, 16.4), P(10, 17), P(13, 16), P(11, 10)], { s: true, tone: tone + 0.05, w: 0.56 });
    for (let i = 0; i < warts; i++) { const x = -14 + r() * 26, y = -8 + r() * 12; p.ell(x * s, y * s, 0.9 + r() * 1.3, 0.8 + r() * 1.1, { paper: false, w: 0.3, a: 0.65, passes: 1 }); }
    if (crown) p.poly([P(-6, -12.6), P(-7, -19), P(-3.6, -15.6), P(-1, -20), P(1.6, -15.6), P(5, -19), P(4, -12.6)], { tone: 0.02, w: 0.6 });
  }
  def('b_frog', 78, 62, p => frog(p, 1.45, 0.08, 0, false));
  def('b_toad', 110, 90, p => frog(p, 2.05, 0.16, 22, true));
  def('b_newt', 104, 50, p => {      // 도롱뇽: 깃털 같은 아가미가 달린 긴 몸
    p.poly([[-46, -1], [-34, -11.6], [-20, -10], [-8, -7.6], [-18, -3]], { s: true, tone: 0.24, hatch: { ang: 1.3, gap: 1.1, a: 0.4 }, w: 0.5 });
    p.poly([[14, 6], [16, 13], [12, 14.6], [18, 15.4], [21, 14], [19, 7]], { s: true, tone: 0.14, w: 0.55 }); p.poly([[-16, 5], [-17, 11], [-21, 12.6], [-15, 13.6], [-12, 12], [-11, 5.6]], { s: true, tone: 0.14, w: 0.55 });
    p.poly([[-46, -1], [-30, -6.4], [-14, -6], [-4, -7.6], [12, -8], [26, -9], [36, -6.4], [40.6, 0], [36, 6.4], [24, 8], [10, 7.4], [-6, 7], [-18, 5], [-32, 3.6]], { s: true, tone: 0.08, hatch: HB(), w: 0.74 });
    for (let k = 0; k < 3; k++) { const x0 = 23 - k * 3.4, x1 = 19 - k * 5.4, y1 = -18.6 + k * 1.6; p.seg(x0, -8.6, x1, y1, { w: 0.6, a: 1, passes: 1 }); for (let j = 1; j < 4; j++) { const u = j / 4, x = x0 + (x1 - x0) * u, y = -8.6 + (y1 + 8.6) * u; p.seg(x, y, x + 2.4, y - 1.6, { w: 0.3, a: 0.8, passes: 1, noOver: true }); p.seg(x, y, x - 2.6, y - 0.6, { w: 0.3, a: 0.8, passes: 1, noOver: true }); } }
    p.ell(31, -3.4, 2.7, 2.8, { tone: 0.01, w: 0.46 }); p.dot(31.6, -3.2, 1.1, 1);
    p.line([[40.6, 1], [34, 3.8], [27, 2.6]], { s: true, w: 0.62, a: 1, passes: 1 });
    for (let k = 0; k < 9; k++) p.dot(-26 + k * 5.6, -1 + (k % 3) * 1.6, 0.5, 0.55);
  });
  def('b_naut', 86, 78, p => {      // 앵무조개: 줄무늬 소용돌이 껍데기
    for (let k = 0; k < 7; k++) p.line([[24, 4 + k * 1.8], [32 + k * 0.6, 6 + k * 2.6], [37 + (k % 2) * 3, 10 + k * 3]], { s: true, w: 0.5, a: 0.95, passes: 1 });
    p.poly([[10, -4], [24, -8], [31, 2], [27, 14], [14, 18], [6, 10]], { s: true, tone: 0.18, hatch: HB(), w: 0.66 });
    p.ell(-6, -4, 27, 27, { tone: 0.04, hatch: SH('b', 0.6, 0.45, 1.2), w: 0.78 });
    for (let k = 0; k < 8; k++) { const a = -2.6 + k * 0.5; p.line([[-2 + Math.cos(a) * 6, 2 + Math.sin(a) * 6], [-6 + Math.cos(a + 0.25) * 17, -4 + Math.sin(a + 0.25) * 17], [-6 + Math.cos(a + 0.42) * 26.4, -4 + Math.sin(a + 0.42) * 26.4]], { s: true, w: 0.9, a: 0.8, passes: 1 }); }
    const sp = []; for (let i = 0; i <= 20; i++) { const a = 0.6 + i * 0.36, q = 1 + i * 0.52; sp.push([-1 + Math.cos(a) * q, 3 + Math.sin(a) * q]); } p.line(sp, { s: true, w: 0.5, a: 0.9, passes: 1 });
    p.ell(21, 3, 3, 3.2, { tone: 0.01, w: 0.46 }); p.ell(21.6, 3.4, 1.3, 1.5, { tone: 0.9, w: 0.3 });
  });

  /* ───────── 폭발·맞은 자리 ───────── */
  function boom(name, R, N, i) {
    const size = Math.ceil(R * 2.5 + 6);
    def(name + i, size, size, p => {
      const r = p.rng, t = i / (N - 1), rad = R * (0.3 + 0.7 * Math.sqrt(t));
      if (t < 0.55) {
        const n = 9 + ((R / 5) | 0), pts = [], ph = r() * 6.28;
        for (let k = 0; k < n * 2; k++) { const a = ph + k / (n * 2) * 6.2832, q = rad * (k % 2 ? 0.5 + 0.12 * r() : 0.92 + 0.3 * r()); pts.push([Math.cos(a) * q, Math.sin(a) * q]); }
        p.poly(pts, { tone: 0.02, w: 0.7 + R * 0.01, a: 1 - t * 0.4 });
        const pt2 = []; for (let k = 0; k < n * 2; k++) { const a = ph + 0.3 + k / (n * 2) * 6.2832, q = rad * 0.5 * (k % 2 ? 0.5 : 1); pt2.push([Math.cos(a) * q, Math.sin(a) * q]); }
        p.poly(pt2, { paper: false, tone: 0.3 * (1 - t), hatch: { ang: 0.6, gap: 1.1, a: 0.55 * (1 - t) }, w: 0.45, a: 0.8 });
      }
      if (t > 0.2) {
        const m = 4 + ((R / 6) | 0);
        for (let k = 0; k < m; k++) { const a = r() * 6.28, q = rad * (0.35 + 0.6 * r()) * (t < 0.55 ? 0.9 : 1); p.scribble(Math.cos(a) * q, Math.sin(a) * q, R * (0.2 + 0.2 * r()) * (1.3 - t * 0.5), { turns: 1.8, w: 0.45, a: 0.85 * (1.25 - t), jit: 0.3 }); }
      }
      const dn = 6 + ((R / 4) | 0);
      for (let k = 0; k < dn; k++) { const a = r() * 6.28, q0 = rad * (0.95 + 0.2 * r()), q1 = q0 + R * (0.1 + 0.2 * r()); p.seg(Math.cos(a) * q0, Math.sin(a) * q0, Math.cos(a) * q1, Math.sin(a) * q1, { w: 0.4, a: 0.9 * (1.1 - t), passes: 1, noOver: true }); }
    }, { boil: 1, grain: 0.4 });
  }
  DS.BOOM = { s: 6, m: 7, l: 8 };
  for (let i = 0; i < 6; i++) boom('boom_s', 8, 6, i);
  for (let i = 0; i < 7; i++) boom('boom_m', 15, 7, i);
  for (let i = 0; i < 8; i++) boom('boom_l', 26, 8, i);
  def('hit', 12, 12, p => {
    for (let i = 0; i < 4; i++) { const a = i * 1.5708 + 0.4; p.seg(Math.cos(a) * 1.4, Math.sin(a) * 1.4, Math.cos(a) * 4.8, Math.sin(a) * 4.8, { w: 0.55, a: 0.9, passes: 1 }); }
  }, { noFill: true, boil: 2 });
  def('splash', 20, 16, (p, i) => {
    for (let k = -2; k <= 2; k++) p.line([[k * 1.6, 6], [k * (3 + i * 1.4), -1 - i * 2], [k * (4.4 + i * 2), 3 - i]], { s: true, w: 0.36, a: 0.8 - i * 0.2, passes: 1 });
  }, { noFill: true, boil: 3 });

  DS.WARM = ['sub', 'prop', 'torp', 'mine', 'ssm', 'eb', 'etorp', 'dc', 'bubb', 'itbox', 'star', 'hit', 'splash', 'mini', 'shrimp', 'hair', 'frig'];
  ['s', 'm', 'l'].forEach(k => { for (let i = 0; i < DS.BOOM[k]; i++) DS.WARM.push('boom_' + k + i); });
})();
