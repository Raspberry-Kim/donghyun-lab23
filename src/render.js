/* 화면 그리기 */
(function () {
  'use strict';
  const DS = window.DS, W = DS.W, H = DS.H, VH = DS.VH, S = DS.S, ART = DS.ART, PI = Math.PI, K = DS.K, CH = DS.CHUNK, SEA = DS.SEA;
  const FONT = "Gaegu, 'Nanum Pen Script', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
  DS.FONT = FONT;

  function Render(cv) {
    this.cv = cv; cv.width = W * S; cv.height = H * S;
    this.c = cv.getContext('2d', { alpha: false, desynchronized: true });
    this.paper = DS.makePaper(W * S, H * S, 11);
    this.chunks = {}; this.far = null; this.L = null; this.turn = 0; this.jr = DS.RNG(77);
  }
  const R = Render.prototype;

  /* 스테이지가 바뀌면 앞 장의 땅 그림은 버리고, 새 땅은 화면에 가까운 조각부터 한 걸음에 하나씩 그린다 */
  R.prepare = function (L) {
    Object.keys(this.chunks).forEach(k => { this.chunks[k].width = this.chunks[k].height = 0; }); this.chunks = {};
    if (this.far) { this.far.width = this.far.height = 0; }
    this.L = L; this.far = DS.drawFar(L); this.nch = Math.ceil(L.len / CH);
    const need = { plume: 1, chim: 1, inkc: 1, tad: 1, shrimp: 1 }; L.ob.forEach(o => { const d = DS.EN[o.k]; if (d) need[d.spr] = 1; if (o.k === 'trig') need.plane = 1; if (o.k === 'gate') need[DS.BOSS[o.b].spr] = 1; });
    Object.keys(need).forEach(n => ART.get(n));
  };
  R.chunk = function (i) { return this.chunks[i] || (this.chunks[i] = DS.drawChunk(this.L, i)); };
  R.pump = function (cam) {      // 아직 그리지 않은 조각 하나를 그린다. 다 그렸으면 false
    if (!this.L) return false;
    const c0 = Math.floor((cam + W / 2) / CH);
    for (let d = 0; d < this.nch; d++) for (let s = -1; s <= 1; s += 2) { const i = c0 + d * s; if (i >= 0 && i < this.nch && !this.chunks[i]) { this.chunk(i); return true; } }
    return false;
  };
  R.warm = function () { DS.WARM.forEach(n => ART.get(n)); };

  R.spr = function (name, x, y, rot, sx, sy, fi, alpha) {
    const s = ART.get(name), c = this.c, f = s.frames[(fi || 0) % s.frames.length];
    if (alpha != null) c.globalAlpha = alpha;
    if (rot || (sx != null && sx !== 1) || (sy != null && sy !== 1)) {
      c.save(); c.translate(x * S, y * S); if (rot) c.rotate(rot); c.scale(sx == null ? 1 : sx, sy == null ? (sx == null ? 1 : sx) : sy);
      c.drawImage(f, -s.w * S / 2, -s.h * S / 2); c.restore();
    } else c.drawImage(f, Math.round((x - s.w / 2) * S), Math.round((y - s.h / 2) * S));
    if (alpha != null) c.globalAlpha = 1;
    return s;
  };
  R.text = function (txt, x, y, px, align, alpha, weight) {
    const c = this.c; c.font = (weight || 700) + ' ' + Math.round(px * S) + 'px ' + FONT; c.textAlign = align || 'left'; c.textBaseline = 'middle'; c.wordSpacing = (-px * S * 0.14).toFixed(1) + 'px';
    c.lineWidth = Math.min(px * 0.22, 3) * S; c.strokeStyle = DS.FILL; c.lineJoin = 'round'; c.globalAlpha = (alpha == null ? 1 : alpha) * 0.8; c.strokeText(txt, x * S, y * S);
    c.globalAlpha = (alpha == null ? 1 : alpha) * 0.9; c.fillStyle = DS.INK; c.fillText(txt, x * S, y * S); c.globalAlpha = 1;
  };
  /* 출전 준비 화면 제목: 손글씨 그림(src/title.png). 그림을 읽지 못하면 글꼴로 쓴다. */
  R.titleReady = new Promise(function (done) {
    if (!DS.TITLE_PNG || typeof Image === 'undefined') return done();
    const im = new Image(); im.onload = function () { R.titleImg = im; done(); }; im.onerror = function () { done(); }; im.src = DS.TITLE_PNG;
  });
  R.title = function (x, y, w) {      // 가운데 (x, y), 너비 w칸
    const im = this.titleImg;
    if (!im) { this.text('동현잠', x, y, 46, 'center'); return; }
    const h = w * im.height / im.width, c = this.c;
    this.text('TM', x + w / 2 + 3, y - h / 2 + 6, 8, 'left', 0.88);      // 제목 오른쪽 위에 붙는 작은 위첨자
    c.globalAlpha = 0.92;
    c.drawImage(im, Math.round((x - w / 2) * S), Math.round((y - h / 2) * S), Math.round(w * S), Math.round(h * S)); c.globalAlpha = 1;
  };
  /* 연필로 두 번 그은 네모 */
  R.box = function (x, y, w, h, seed, lw, alpha, fill) {
    const c = this.c, j = (n) => ((DS.hash('b' + (seed * 31 + n)) % 1000) / 1000 - 0.5) * 1.6 * S;
    if (fill != null) { c.globalAlpha = fill; c.fillStyle = DS.FILL; c.fillRect(x * S, y * S, w * S, h * S); }
    c.strokeStyle = DS.INK; c.lineCap = 'round'; c.lineWidth = (lw || 0.8) * S;
    for (let k = 0; k < 2; k++) {
      c.globalAlpha = (alpha == null ? 0.8 : alpha) * (k ? 0.5 : 1);
      const a = k * 8, x0 = x * S, y0 = y * S, x1 = (x + w) * S, y1 = (y + h) * S;
      c.beginPath();
      c.moveTo(x0 + j(a), y0 + j(a + 1)); c.lineTo(x1 + j(a + 2), y0 + j(a + 3)); c.lineTo(x1 + j(a + 4), y1 + j(a + 5)); c.lineTo(x0 + j(a + 6), y1 + j(a + 7)); c.closePath(); c.stroke();
    }
    c.globalAlpha = 1;
  };
  R.stroke = function (pts, lw, alpha) {      // 화면 칸으로 적은 꺾은선
    const c = this.c; c.strokeStyle = DS.INK; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = (lw || 0.7) * S; c.globalAlpha = alpha == null ? 0.85 : alpha;
    c.beginPath(); c.moveTo(pts[0][0] * S, pts[0][1] * S); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0] * S, pts[i][1] * S); c.stroke(); c.globalAlpha = 1;
  };
  R.wash = function (alpha) { const c = this.c; c.globalAlpha = alpha; c.drawImage(this.paper, 0, 0); c.globalAlpha = 1; };
  R.bar = function (x, y, w, h, fr) {
    const c = this.c; c.globalAlpha = 0.75; c.fillStyle = DS.FILL; c.fillRect(x * S, y * S, w * S, h * S);
    c.globalAlpha = 0.72; c.fillStyle = DS.INK; c.fillRect(x * S, y * S, w * fr * S, h * S);
    c.globalAlpha = 0.9; c.strokeStyle = DS.INK; c.lineWidth = 0.7 * S; c.strokeRect(x * S - 1, y * S - 1, w * S + 2, h * S + 2); c.globalAlpha = 1;
  };

  /* 잠수함: 뱃머리가 오른쪽인 그림 한 장을 뒤집어 쓴다. 돌아보는 동안에는 폭을 줄였다 늘린다. 프로펠러는 선미에서 따로 돈다 */
  R.sub = function (x, y, face, turn, rot, t, alpha) {
    let f = face, xs = 1;
    if (turn > 0) { const k = turn / K.TURN; if (k > 0.5) { f = -face; xs = (k - 0.5) * 2; } else xs = 1 - k * 2; xs = 0.22 + 0.78 * xs; }
    const c = this.c, s = ART.get('sub'), pr = ART.get('prop');
    c.save(); c.translate(x * S, (y + Math.sin(t * 0.06) * 0.5) * S); c.rotate((rot || 0) * f); if (alpha != null) c.globalAlpha = alpha;
    c.scale(f * xs, 1);
    c.drawImage(pr.frames[(t >> 2) % 3], (-22 - pr.w / 2) * S, (-pr.h / 2) * S);
    c.drawImage(s.frames[((t / 12) | 0) % s.frames.length], -s.w * S / 2, -s.h * S / 2);
    c.restore(); c.globalAlpha = 1;
  };

  R.draw = function (g, bare) {      // bare: 계기판 없이 장면만 (출전 준비 화면의 시범 항해)
    const c = this.c;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
    c.drawImage(this.paper, 0, 0);
    if (!g) return;
    this.scene(g);
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (bare) return;
    c.drawImage(this.paper, 0, VH * S, W * S, (H - VH) * S, 0, VH * S, W * S, (H - VH) * S);
    this.hud(g);
    if (this.turn > 0) this.pageTurn(this.turn);
  };

  /* 수면의 높낮이: 두 물결을 겹쳐 찰랑거린다 */
  const swell = DS.swell = (x, t) => Math.sin(x * 0.09 + t * 0.05) * 1.1 + Math.sin(x * 0.031 - t * 0.03) * 0.9;
  const INKRGB = '34,34,37';

  R.scene = function (g) {
    const c = this.c, L = g.L, t = g.t, p = g.pl, cam = Math.round(g.cam * S) / S, x0 = cam - 70, x1 = cam + W + 70;
    const shx = g.shake > 0 ? Math.round((this.jr() - 0.5) * Math.min(8, g.shake) * 0.9 * S) : 0, shy = g.shake > 0 ? Math.round((this.jr() - 0.5) * Math.min(8, g.shake) * 0.9 * S) : 0;
    // 먼 배경은 천천히 흐른다
    if (this.far) { const o = Math.round(((cam * 0.35) % DS.FARW) * S); c.drawImage(this.far, -o, 0); c.drawImage(this.far, DS.FARW * S - o, 0); }
    c.setTransform(1, 0, 0, 1, -Math.round(cam * S) + shx, shy);
    // 물속은 깊을수록 흑연이 짙다
    const xa = Math.floor(cam / 3) * 3 - 6, xb = cam + W + 6, gr = c.createLinearGradient(0, SEA * S, 0, VH * S);
    gr.addColorStop(0, 'rgba(' + INKRGB + ',' + (L.dark * 0.35 + 0.04).toFixed(3) + ')'); gr.addColorStop(0.12, 'rgba(' + INKRGB + ',' + (L.dark * 0.35 + 0.022).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(' + INKRGB + ',' + (L.dark + 0.035).toFixed(3) + ')');
    c.fillStyle = gr; c.beginPath(); c.moveTo(xa * S, VH * S);
    for (let x = xa; x <= xb; x += 3) c.lineTo(x * S, (SEA + swell(x, t)) * S);
    c.lineTo(xb * S, VH * S); c.closePath(); c.fill();
    for (let i = Math.max(0, Math.floor(cam / CH)); i <= Math.min(this.nch - 1, Math.floor((cam + W) / CH)); i++) c.drawImage(this.chunk(i), i * CH * S, 0);
    // 수면: 연필로 두 번 그은 물결과 그 아래 잔물결. 얼음이나 바위가 덮은 곳은 비운다
    c.strokeStyle = DS.INK; c.lineCap = 'round'; c.lineJoin = 'round';
    for (let k = 0; k < 2; k++) {
      c.lineWidth = (k ? 0.45 : 0.8) * S; c.globalAlpha = k ? 0.4 : 0.88; c.beginPath(); let on = false;
      for (let x = xa; x <= xb; x += 3) { if (L.cAt(x) > SEA) { on = false; continue; } const y = SEA + swell(x + k * 5, t + k * 9) + k * 1.1; if (on) c.lineTo(x * S, y * S); else { c.moveTo(x * S, y * S); on = true; } }
      c.stroke();
    }
    for (let k = 0; k < 2; k++) {      // 잔물결: 수면 가까이는 촘촘하고 진하게, 그 아래는 드물고 옅게
      const gap = k ? 37 : 19; c.lineWidth = (k ? 0.36 : 0.42) * S; c.globalAlpha = k ? 0.2 : 0.36; c.beginPath();
      for (let i = Math.floor(xa / gap) - 1; i <= Math.floor(xb / gap); i++) { const h = DS.hash('rp' + k + i), x = i * gap + h % 15 + Math.sin(t * 0.02 + i * 1.7) * 3, y = SEA + (k ? 12.5 + (h >> 5) % 4 * 3.1 : 3.6 + (h >> 5) % 3 * 2.7) + swell(x, t) * 0.5, l = (k ? 6 : 4) + (h >> 8) % 7; if (L.cAt(x) > SEA || L.cAt(x + l) > SEA) continue; c.moveTo(x * S, y * S); c.quadraticCurveTo((x + l / 2) * S, (y - 1) * S, (x + l) * S, y * S); }
      c.stroke();
    }
    c.globalAlpha = 1;
    const vis = x => x > x0 && x < x1, E = g.en;
    // 바닥에 붙은 것, 아이템
    for (let i = 0; i < E.length; i++) { const e = E[i]; if (!e.d.gr || e.dead || !vis(e.x)) continue; this.enemy(e, g); }
    for (let i = 0; i < g.items.length; i++) { const it = g.items[i]; if (!vis(it.x)) continue; const y = it.y + Math.sin(it.t * 0.07) * 2.5; if (it.k === 'star') this.spr('star', it.x, y, Math.sin(it.t * 0.05) * 0.3, 1, 1, 0); else { this.spr('itbox', it.x, y, 0, 1, 1, 0); this.text(it.w, it.x, y + 0.4, 10.5, 'center'); } }
    // 가라앉는 배
    for (let i = 0; i < g.fx.length; i++) { const f = g.fx[i]; if (f.k !== 'sink') continue; const k = f.t / 110; this.spr(f.spr, f.x, SEA - 12 + k * 46, k * 0.5 * (f.dir || 1), f.dir || 1, 1, 0, Math.max(0, 1 - k * k)); }
    for (let i = 0; i < E.length; i++) { const e = E[i]; if (e.d.gr || e.dead || !vis(e.x)) continue; this.enemy(e, g); }
    // 내 어뢰·기뢰·대함미사일
    for (let i = 0; i < g.shots.length; i++) {
      const s = g.shots[i];
      if (s.k === 'torp') this.spr('torp', s.x, s.y, s.t <= 12 ? 0.14 : 0, s.d, 1, 0);
      else if (s.k === 'mine') { this.spr('mine', s.x, s.y, s.t * 0.025, 1, 1, 0); if (s.t > 16 && (s.t >> 3) & 1) { c.globalAlpha = 0.5; c.lineWidth = 0.4 * S; c.strokeStyle = DS.INK; c.beginPath(); c.arc(s.x * S, s.y * S, (8 + (s.t % 8) * 0.5) * S, 0, 6.2832); c.stroke(); c.globalAlpha = 1; } }
      else this.spr('ssm', s.x, s.y, s.a + PI / 2, 1, 1, 0);
    }
    // 잠수함
    if (!(p.dead && p.boomed) && !(p.inv > 0 && !p.dead && ((t >> 2) & 1))) this.sub(p.x, p.y, p.face, p.turn, p.rot, g.mode === 'play' ? t : t >> 1, null);
    // 보스: 팔다리를 먼저, 몸을 그 위에
    const b = g.boss;
    if (b) {
      const d = b.d, dying = b.dead > 0;
      if (!dying || b.dead < 90) {
        for (let i = 0; i < b.limbs.length; i++) this.limb(g, b, b.limbs[i], i);
        const jx = b.shk || dying ? (this.jr() - 0.5) * 1.8 : 0, jy = dying ? (this.jr() - 0.5) * 1.8 : 0;
        this.spr(d.spr, b.x + jx, b.y + jy, d.kind === 'swim' && b.dvx ? 0 : Math.sin(b.t * 0.04) * (d.kind === 'float' ? 0.035 : 0.012), d.side ? b.dir : 1, b.air ? 1.07 : b.shk ? 0.94 : 1, (b.t / 12) | 0, b.flash > 0 ? 0.72 : dying && (b.dead >> 2) & 1 ? 0.45 : null);
      }
    }
    // 적의 탄
    for (let i = 0; i < g.bullets.length; i++) {
      const q = g.bullets[i], k = q.k;
      if (k === 'eb') this.spr('eb', q.x, q.y, 0, 1, 1, (t >> 3) + i);
      else if (k === 'etorp') this.spr('etorp', q.x, q.y, 0, q.d, 1, 0);
      else if (k === 'hom') this.spr('etorp', q.x, q.y, q.a, 1, 1, 0);
      else if (k === 'dc') this.spr('dc', q.x, q.y, q.air ? q.t * 0.12 : Math.sin(q.t * 0.1) * 0.2, 1, 1, 0);
      else this.spr('bubb', q.x, q.y, 0, 1, 1, (t >> 3) + i);
    }
    for (let i = 0; i < g.fx.length; i++) { const f = g.fx[i]; if (f.k === 'sink') continue; const k = Math.min(f.n - 1, (f.t / f.rate) | 0); if (f.k === 'hit' || f.k === 'splash') this.spr(f.k, f.x, f.y, f.k === 'hit' ? f.t : 0, 1, 1, k); else this.spr(f.k + k, f.x, f.y, 0, 1, 1, 0); }
    // 거품
    const B = g.bubs;
    if (B.length) { c.strokeStyle = DS.INK; c.lineWidth = 0.4 * S; c.globalAlpha = 0.55; c.beginPath(); for (let i = 0; i < B.length; i++) { const q = B[i], r = q.r * Math.min(1, 0.5 + q.t / 20); c.moveTo((q.x + r) * S, q.y * S); c.arc(q.x * S, q.y * S, r * S, 0, 6.2832); } c.stroke(); c.globalAlpha = 1; }
    // 먹물 구름: 앞을 가린다
    for (let i = 0; i < g.clouds.length; i++) { const q = g.clouds[i], a = Math.min(1, q.t / 30, (330 - q.t) / 70) * 0.95, sc = 1.25 + Math.min(0.5, q.t / 120); this.spr('inkc', q.x, q.y, 0, sc, sc, (t >> 4), a); this.spr('inkc', q.x + 6, q.y - 3, 2.6, sc * 0.9, sc * 0.9, (t >> 4) + 1, a * 0.9); }
    for (let i = 0; i < g.pops.length; i++) { const q = g.pops[i]; this.text(q.txt, q.x, q.y, 8.5, 'center', Math.min(1, (50 - q.t) / 15)); }
  };

  R.enemy = function (e, g) {
    const k = e.k, t = g.t, al = e.flash > 0 ? 0.45 : null, fi = ((t / 10) | 0) + e.id, d = e.d;
    if (k === 'mini') this.spr('mini', e.x, e.y, 0, e.dir, 1, fi, al);
    else if (k === 'angler') {
      this.spr('angler', e.x + (e.st === 1 ? Math.sin(t * 2.1) * 0.9 : 0), e.y, e.st === 2 ? clampRot(e.vy * 0.2) * e.dir : 0, e.dir, 1, fi, al);
      if (e.st === 1) this.text('!', e.x, e.y - 20, 12, 'center', 0.95);
    }
    else if (k === 'shrimp') this.spr('shrimp', e.x, e.y, 0, e.dir, 1, ((t / 8) | 0) + e.id, al);
    else if (k === 'hair') this.spr('hair', e.x, e.y, Math.sin(t * 0.05 + e.ph) * 0.07, 1, 1, fi, al);
    else if (k === 'emine') { const fl = g.L.gAt(e.x); this.stroke([[e.x, e.y + 6], [e.x + Math.sin(t * 0.03 + e.ph) * 1.4, (e.y + fl) / 2], [e.x, fl]], 0.4, 0.5); this.spr('emine', e.x, e.y, Math.sin(t * 0.03 + e.ph) * 0.12, 1, 1, fi, al); }
    else if (k === 'vent') { if (e.ph2 === 2) this.spr('plume', e.x, e.y - 68, 0, 1, 1, t >> 2, 0.95); this.spr('chim', e.x, e.y - 10, 0, e.id % 2 ? 1 : -1, 1, 0); }
    else if (d.ship) this.spr(d.spr, e.x, SEA - 12 + swell(e.x, t) * 0.55, Math.sin(t * 0.021 + e.id) * 0.014, e.pd, 1, fi, al);
    else if (k === 'plane') this.spr('plane', e.x, e.y, 0, e.dir, 1, fi, al);
    else if (k === 'tad') this.spr('tad', e.x, e.y, 0, e.dir, 1, (t >> 3) + e.id, al);
  };
  function clampRot(v) { return v < -0.5 ? -0.5 : v > 0.5 ? 0.5 : v; }

  /* 보스의 다리·혀·집게발: 그림을 미리 그려 두지 않고, 걸음마다 가운데 선을 받아 빠른 선으로 다시 긋는다.
     두 걸음마다 손떨림을 새로 뽑아 선이 살아 움직인다. 종이 색으로 속을 메우고 윤곽을 두 번 긋는다 */
  R.limb = function (g, b, l, li) {
    const ty = l.ty; if (l.st === 0 && (l.edge || l.ext < 0.04)) return;
    const c = this.c, D = DS.LIMB[ty], a = g.anchor(b, l), t = g.t, s = l.s || 1;
    const rn = DS.RNG(977 + li * 131 + (t >> 1) * 17), j = m => (rn() - 0.5) * m * S;
    c.strokeStyle = DS.INK; c.lineCap = 'round'; c.lineJoin = 'round';
    if (l.st === 1) {      // 예고: 겨누는 곳까지 옅은 점선과 동그라미
      const k = Math.min(1, l.t / 12);
      c.globalAlpha = 0.34 * k; c.lineWidth = 0.5 * S; c.setLineDash([3 * S, 4 * S]); c.lineDashOffset = -t * S; c.beginPath(); c.moveTo(a[0] * S, a[1] * S); c.lineTo(l.tx * S, l.ty2 * S); c.stroke(); c.setLineDash([]);
      const rr = (D.tip * s + 5 + (t % 12) * 0.35) * S; c.globalAlpha = 0.62 * k; c.lineWidth = 0.6 * S;
      for (let q = 0; q < 2; q++) { c.beginPath(); c.ellipse(l.tx * S + j(1.4), l.ty2 * S + j(1.4), rr * (1 - q * 0.22), rr * (1 - q * 0.22) * 0.94, rn() * 3, 0.3, 6.1); c.stroke(); }
    }
    const P = DS.limbPts(l, a[0], a[1], t), n = P.length, Lf = [], Rt = [];
    for (let i = 0; i < n; i++) { const A = P[Math.max(0, i - 1)], Bq = P[Math.min(n - 1, i + 1)], dx = Bq[0] - A[0], dy = Bq[1] - A[1], m = Math.hypot(dx, dy) || 1, nx = -dy / m, ny = dx / m, w = P[i][2]; Lf.push([(P[i][0] + nx * w) * S, (P[i][1] + ny * w) * S]); Rt.push([(P[i][0] - nx * w) * S, (P[i][1] - ny * w) * S]); }
    const e = P[n - 1], e2 = P[n - 2], um = Math.hypot(e[0] - e2[0], e[1] - e2[1]) || 1, ux = (e[0] - e2[0]) / um, uy = (e[1] - e2[1]) / um, tipx = (e[0] + ux * e[2] * (ty === 'leg' ? 3 : 1.2)) * S, tipy = (e[1] + uy * e[2] * (ty === 'leg' ? 3 : 1.2)) * S;
    const path = (jm) => { c.beginPath(); c.moveTo(Lf[0][0] + j(jm), Lf[0][1] + j(jm)); for (let i = 1; i < n; i++) c.lineTo(Lf[i][0] + j(jm), Lf[i][1] + j(jm)); c.lineTo(tipx + j(jm), tipy + j(jm)); for (let i = n - 1; i >= 0; i--) c.lineTo(Rt[i][0] + j(jm), Rt[i][1] + j(jm)); };
    path(0); c.globalAlpha = 1; c.fillStyle = DS.FILL; c.fill(); c.globalAlpha = ty === 'tongue' ? 0.2 : ty === 'edge' ? 0.14 : 0.08; c.fillStyle = DS.INK; c.fill();
    const fast = l.st === 2 || l.st === 5;
    c.globalAlpha = 0.92; c.lineWidth = (ty === 'tongue' ? 0.5 : 0.72) * S; path(0.5); c.stroke();
    c.globalAlpha = 0.42; c.lineWidth = 0.42 * S; path(fast ? 2.4 : 1.3); c.stroke();
    if (ty === 'arm' || ty === 'edge') {      // 그늘 쪽의 짧은 빗금과 빨판
      c.globalAlpha = 0.5; c.lineWidth = 0.36 * S; c.beginPath();
      for (let i = 1; i < n - 1; i++) { const q = P[i], w = q[2]; c.moveTo(Rt[i][0], Rt[i][1]); c.lineTo(Rt[i][0] + (q[0] * S - Rt[i][0]) * 0.7 + j(1), Rt[i][1] + (q[1] * S - Rt[i][1]) * 0.7 + w * 0.5 * S); }
      c.stroke(); c.globalAlpha = 0.8; c.lineWidth = 0.34 * S; c.beginPath();
      for (let i = 2; i < n; i++) { const q = P[i], w = q[2], x = (q[0] * S + Lf[i][0]) / 2, y = (q[1] * S + Lf[i][1]) / 2, r = Math.max(0.5, w * 0.3) * S; c.moveTo(x + r, y); c.arc(x, y, r, 0, 6.2832); }
      c.stroke();
    } else if (ty === 'tongue') {      // 끈끈한 혀끝
      const r = D.tip * s * S; c.globalAlpha = 1; c.fillStyle = DS.FILL; c.beginPath(); c.ellipse(e[0] * S, e[1] * S, r, r * 0.86, Math.atan2(uy, ux), 0, 6.2832); c.fill(); c.globalAlpha = 0.3; c.fillStyle = DS.INK; c.fill();
      c.globalAlpha = 0.92; c.lineWidth = 0.6 * S; c.beginPath(); c.ellipse(e[0] * S + j(0.6), e[1] * S + j(0.6), r, r * 0.86, Math.atan2(uy, ux), 0, 6.2832); c.stroke();
      c.globalAlpha = 0.5; c.lineWidth = 0.36 * S; c.beginPath(); c.moveTo(P[1][0] * S, P[1][1] * S); for (let i = 2; i < n - 1; i++) c.lineTo(P[i][0] * S + j(0.6), P[i][1] * S + j(0.6)); c.stroke();
    } else if (ty === 'claw') {      // 집게: 뻗는 동안 벌리고, 다 뻗으면 문다
      const T = D.tip * s, op = l.st === 3 ? 0.06 : l.st === 2 ? 0.62 : l.st === 1 ? 0.5 + Math.sin(t * 0.5) * 0.12 : 0.3, ang = Math.atan2(uy, ux);
      const jaw = (sg, k) => { const pts = [[-0.2, 0], [0.1, -0.62 * k], [0.75, -0.8 * k], [1.45, -0.34 * k], [1.62, 0.02], [0.9, -0.16 * k], [0.3, -0.02]]; c.save(); c.translate(e[0] * S, e[1] * S); c.rotate(ang - sg * op); c.scale(1, sg); c.beginPath(); pts.forEach((q, i) => { const x = q[0] * T * S + (i ? j(0.5) : 0), y = q[1] * T * S + (i ? j(0.5) : 0); if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.closePath(); c.globalAlpha = 1; c.fillStyle = DS.FILL; c.fill(); c.globalAlpha = 0.14; c.fillStyle = DS.INK; c.fill(); c.globalAlpha = 0.95; c.lineWidth = 0.72 * S; c.stroke(); c.globalAlpha = 0.5; c.lineWidth = 0.34 * S; c.beginPath(); for (let q = 0; q < 4; q++) { c.moveTo((0.5 + q * 0.2) * T * S, -0.1 * k * T * S); c.lineTo((0.62 + q * 0.2) * T * S, -0.24 * k * T * S); } c.stroke(); c.restore(); };
      jaw(1, 1); jaw(-1, 0.72);
      c.globalAlpha = 0.9; c.lineWidth = 0.5 * S; const md = P[5]; c.beginPath(); c.arc(md[0] * S, md[1] * S, md[2] * 0.9 * S, 0, 6.2832); c.stroke();
    } else {      // 마디가 있는 다리
      c.globalAlpha = 0.9; c.lineWidth = 0.5 * S; const md = P[5]; c.beginPath(); c.arc(md[0] * S, md[1] * S, md[2] * 1.15 * S, 0, 6.2832); c.stroke();
      c.globalAlpha = 0.5; c.lineWidth = 0.34 * S; c.beginPath(); for (let i = 1; i < n - 1; i += 2) { c.moveTo(Rt[i][0], Rt[i][1]); c.lineTo(P[i][0] * S + j(0.8), P[i][1] * S + j(0.8)); } c.stroke();
    }
    if (fast) {      // 속도선
      c.globalAlpha = 0.5; c.lineWidth = 0.4 * S; c.beginPath();
      for (let q = 0; q < 5; q++) { const o = (rn() - 0.5) * (D.tip * s * 2 + 10), bk = 8 + rn() * 22, ln = 8 + rn() * 14, x = e[0] - ux * bk - uy * o, y = e[1] - uy * bk + ux * o; c.moveTo(x * S, y * S); c.lineTo((x - ux * ln) * S, (y - uy * ln) * S); }
      c.stroke();
    }
    c.globalAlpha = 1;
  };

  /* 계기판: 아래 20칸. 왼쪽부터 어뢰 관 둘 · 폭탄(기뢰|대함) · 잠수함 · 데미지 막대 · 점수 */
  R.hud = function (g) {
    const c = this.c, p = g.pl, y = VH + 10.5, L = g.L, T = this;
    this.stroke([[2, VH + 0.4], [130, VH + 0.9], [270, VH + 0.2], [W - 2, VH + 0.7]], 0.9, 0.85); this.stroke([[3, VH + 1.2], [200, VH + 0.6], [W - 3, VH + 1.3]], 0.5, 0.4);
    const I = this.inset || 0, ss = ART.get('sub').frames[0], tp = ART.get('torp').frames[0], tubes = g.tubes();
    const tube = (x, on) => { c.globalAlpha = on ? 0.95 : 0.22; c.drawImage(tp, x * S, (VH + 6.4) * S, 19.8 * S, 8.1 * S); c.globalAlpha = 1; };
    const bomb = (x) => {
      const m = g.bsel === 'mine';
      T.box(x + (m ? 0 : 25), VH + 3.6, 24, 13.4, 5, 0.6, 0.75, 0.5);
      T.text('기뢰', x + 12, y, 9.5, 'center', m ? 1 : 0.42); T.text('대함', x + 37, y, 9.5, 'center', m ? 0.42 : 1);
      T.text('×' + g.bombs, x + 52, y, 11, 'left', g.bombs > 0 ? 1 : 0.5);
    };
    const boat = (x) => { c.globalAlpha = 0.95; c.drawImage(ss, x * S, (VH + 1.6) * S, 22 * S, 17.8 * S); c.globalAlpha = 1; T.text('×' + g.lives, x + 22.5, y, 11, 'left'); };
    if (!I) {
      this.text('어뢰', 6, y - 0.4, 7.5, 'left', 0.72); tube(22, tubes > 0); tube(43, tubes > 1);
      bomb(72); boat(150);
      this.text('데미지', 196, y - 0.4, 7.5, 'left', 0.72); this.bar(219, VH + 7.4, 76, 6, Math.min(1, p.dmg / 100));
      this.text(String(g.score), W - 6, y, 11.5, 'right');
    } else {      // 가로 휴대폰 전체 화면: 양옆 버튼 사이로 모아 쓴다 (점수는 위로)
      const w = W - 2 * I, x0 = I;
      if (w >= 250) {
        const k = w / 288;
        tube(x0 + 1 * k, tubes > 0); tube(x0 + 1 * k + 21, tubes > 1);
        bomb(x0 + 52 * k); boat(x0 + 132 * k);
        this.text('데미지', x0 + 184 * k, y - 0.4, 7.5, 'left', 0.72); this.bar(x0 + 184 * k + 20.5, VH + 7.4, Math.max(20, 288 * k - 184 * k - 22.5), 6, Math.min(1, p.dmg / 100));
      } else {      // 좁은 가로 화면: 고른 폭탄의 이름만 쓰고, 데미지는 막대로만 보인다
        tube(x0 + 1, tubes > 0); tube(x0 + 22, tubes > 1);
        T.box(x0 + 46, VH + 3.6, 24, 13.4, 5, 0.6, 0.75, 0.5); T.text(g.bsel === 'mine' ? '기뢰' : '대함', x0 + 58, y, 9.5, 'center'); T.text('×' + g.bombs, x0 + 72.5, y, 11, 'left', g.bombs > 0 ? 1 : 0.5);
        boat(x0 + 97);
        this.bar(x0 + 142, VH + 7.4, Math.max(24, w - 145), 6, Math.min(1, p.dmg / 100));
      }
    }
    // 위: 스테이지 이름과 점수. 수면 위는 군함이 다니는 자리라 가로 지도는 계기판의 윗금에 겹쳐 그린다(왼쪽 끝 0 ~ 오른쪽 끝 len). 마름모는 중간 보스, 네모는 보스
    if (!(I && g.boss && g.mode === 'play')) this.text(g.S.sub + ' · ' + g.S.name, 6, 8, 8.5, 'left', 0.8);
    const mx = I ? I + 4 : 6, mw = W - 2 * mx, my = VH + 0.6, X = x => mx + x / L.len * mw;
    this.stroke([[X(g.cam), my - 2.2], [X(g.cam), my + 0.4]], 0.5, 0.6); this.stroke([[X(g.cam + W), my - 2.2], [X(g.cam + W), my + 0.4]], 0.5, 0.6);
    c.fillStyle = DS.INK; c.strokeStyle = DS.INK; c.lineWidth = 0.5 * S;
    for (let i = 0; i < g.gates.length; i++) {
      const gt = g.gates[i], gx = X(gt.x) * S, gy = my * S, r = (gt.mid ? 2.3 : 2.1) * S; c.beginPath();
      if (gt.mid) { c.moveTo(gx, gy - r); c.lineTo(gx + r, gy); c.lineTo(gx, gy + r); c.lineTo(gx - r, gy); c.closePath(); } else c.rect(gx - r, gy - r, 2 * r, 2 * r);
      c.globalAlpha = 1; c.fillStyle = DS.FILL; c.fill(); c.fillStyle = DS.INK; c.globalAlpha = 0.9; if (gt.st === 2) c.stroke(); else c.fill();
    }
    const px = X(p.x); c.globalAlpha = 0.95; c.beginPath(); c.moveTo(px * S, (my - 1.2) * S); c.lineTo((px - 2.5) * S, (my - 6) * S); c.lineTo((px + 2.5) * S, (my - 6) * S); c.closePath(); c.fill(); c.globalAlpha = 1;
    if (I) this.text('점수 ' + g.score, W - (this.insetTop || 78), 8, 9, 'right', 0.9); else this.text('최고 ' + g.hi, W - 6, 8, 8.5, 'right', 0.8);
    const b = g.boss;
    if (b && g.mode === 'play') {      // 가로 휴대폰 전체 화면에서는 스테이지 이름 자리에 보스 이름과 막대를 둔다
      if (I) { const bx = 8 + b.d.name.length * 9.6 + 4; this.text(b.d.name, 6, 8.4, 9.5, 'left', 0.95); this.bar(bx, 5.4, 84, 5, Math.max(0, b.hp / b.hp0)); }
      else { const bw = 128, bx = W / 2 - bw / 2 + 18; this.text(b.d.name, bx - 4, 8.4, 9.5, 'right', 0.95); this.bar(bx, 5.4, bw, 5, Math.max(0, b.hp / b.hp0)); }
    }
    if (g.msg && g.mode === 'play') {      // 알림은 바닥 가까이, 종이 색을 옅게 깔고 쓴다
      const a = Math.min(1, g.msg.t / 20), tw = g.msg.txt.length * 10.4 + 12;
      c.globalAlpha = 0.62 * a; c.fillStyle = DS.FILL; c.fillRect((W / 2 - tw / 2) * S, (VH - 19) * S, tw * S, 12.5 * S); c.globalAlpha = 1;
      this.text(g.msg.txt, W / 2, VH - 12.4, 11, 'center', a);
    }

    if (g.mode === 'brief') {
      const Bq = DS.BOSS, gm = g.gates.filter(q => q.mid)[0], gb = g.gates.filter(q => !q.mid)[0];
      this.wash(0.5); this.box(92, 44, 216, 118, 3, 0.9, 0.85, 0.72);
      this.text(g.S.sub, W / 2, 58, 11, 'center', 0.85); this.text(g.S.name, W / 2, 78, 24, 'center');
      this.stroke([[140, 93], [200, 95], [260, 92.5]], 0.8, 0.7);
      this.text('중간 보스 ' + (gm ? Bq[gm.b].name : '—') + ' · 보스 ' + (gb ? Bq[gb.b].name : '—'), W / 2, 108, 11, 'center');
      this.text('잠수함 ×' + g.lives + ' · 폭탄 ×' + g.bombs, W / 2, 123, 10, 'center', 0.9);
      this.text(g.S.note.split('. ')[0].replace(/\.$/, ''), W / 2, 137, 9, 'center', 0.8);
      if (((g.modeT / 30) | 0) % 2 === 0) this.text(DS.touch ? '화면을 누르면 나선다' : 'X 또는 Enter로 나선다', W / 2, 152, 10, 'center');
    } else if (g.mode === 'clear') {
      const a = Math.min(1, g.modeT / 30); this.wash(a * 0.55); this.box(100, 44, 200, 118, 4, 0.9, 0.85 * a, 0.72 * a);
      this.text('스테이지 ' + (g.stage + 1) + ' 클리어', W / 2, 64, 21, 'center', a); this.text(g.S.name, W / 2, 83, 11, 'center', a * 0.85);
      if (g.modeT > 40) this.text('물리친 적 ' + g.kills, W / 2, 102, 11, 'center', a);
      if (g.modeT > 70) this.text('잠수함 ' + g.lives + ' × 300 + 폭탄 ' + g.bombs + ' × 100 = ' + g.bonus, W / 2, 117, 9.5, 'center', a * 0.9);
      if (g.modeT > 100) this.text('점수 ' + g.score, W / 2, 134, 12, 'center', a);
      if (g.modeT > 130 && ((g.modeT / 30) | 0) % 2 === 0) this.text(DS.touch ? '화면을 누르면 다음 장으로' : 'X 또는 Enter로 다음 장으로', W / 2, 151, 9, 'center');
    }
  };

  R.pageTurn = function (k) {      // 종이를 넘기는 전환 (k: 0→1)
    const c = this.c, x = Math.round(W * S * (1 - k));
    c.drawImage(this.paper, x, 0, W * S - x, H * S, x, 0, W * S - x, H * S);
    const gr = c.createLinearGradient(x - 26 * S, 0, x, 0); gr.addColorStop(0, 'rgba(40,40,40,0)'); gr.addColorStop(1, 'rgba(40,40,40,0.3)');
    c.fillStyle = gr; c.fillRect(x - 26 * S, 0, 26 * S, H * S);
    c.fillStyle = 'rgba(60,60,60,0.5)'; c.fillRect(x - 1, 0, 2, H * S);
  };

  DS.Render = Render;
})();
