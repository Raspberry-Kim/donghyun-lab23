/* 입력 — 키보드(방향키·X·Z·C)·게임패드(시리즈 공통 gamepad.js)·화면 버튼(십자·A·B·폭탄·메뉴).
   X=A(어뢰) · Z=B(폭탄) · C·Shift=Select(기뢰 ↔ 대함미사일) · Enter·Esc·P=Start(메뉴) */
(function () {
  'use strict';
  const DS = window.DS, W = DS.W, H = DS.H;
  const KEY = {
    ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'u', ArrowDown: 'd',
    KeyX: 'a', Space: 'a', KeyZ: 'b', KeyC: 'sel', ShiftLeft: 'sel', ShiftRight: 'sel',
    Enter: 'pause', NumpadEnter: 'pause', Escape: 'pause', KeyP: 'pause', KeyF: 'big'
  };
  /* 게임패드는 gamepad.js가 키보드와 같은 이름으로 알려 준다: A=x(어뢰) · B=z(폭탄) · X·Y·L·R=폭탄 바꾸기 · +=enter(메뉴) */
  const PADKEY = { x: 'a', z: 'b', s: 'sel', a: 'sel', shift: 'sel', enter: 'pause', up: 'u', down: 'd', left: 'l', right: 'r' };

  function Input(cv) {
    const s = this.s = { l: false, r: false, u: false, d: false, a: false, aEdge: false, bEdge: false, selEdge: false, pauseEdge: false, bigEdge: false, mu: false, md: false, ml: false, mr: false, ok: false, back: false, any: false, tap: null };
    const k = this.k = {}, pad = this.pad = {}, btn = this.btn = {}, self = this;
    this.cv = cv; DS.touch = this.touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); this.ptr = null; this.onFirst = null; this.active = null;
    const first = () => { if (self.onFirst) self.onFirst(); };

    function edge(a) {
      s.any = true;
      if (a === 'l') s.ml = true; else if (a === 'r') s.mr = true; else if (a === 'u') s.mu = true; else if (a === 'd') s.md = true;
      else if (a === 'a') { s.aEdge = true; s.ok = true; }
      else if (a === 'b') { s.bEdge = true; s.back = true; }
      else if (a === 'sel') s.selEdge = true;
      else if (a === 'pause') s.pauseEdge = true;
      else if (a === 'big') s.bigEdge = true;
    }
    this.edge = edge;

    window.addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tg = e.target && e.target.tagName; if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return;
      if (self.active && !self.active()) return;                 // 출전하기 전에는 키를 잡지 않는다 (쪽을 굴릴 수 있게)
      const a = KEY[e.code]; if (!a) return;
      if (tg === 'BUTTON' && (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space')) return;      // 초점이 버튼에 있으면 그 버튼을 누른다
      e.preventDefault(); first();
      if (e.repeat) return;
      if (!k['_' + e.code]) { k[a] = (k[a] || 0) + 1; k['_' + e.code] = a; }      // 떼는 신호를 놓친 키가 두 번 세어져 눌린 채 남지 않게
      edge(a); if (e.code === 'Enter' || e.code === 'NumpadEnter') s.ok = true; if (e.code === 'Escape') s.back = true;
    });
    window.addEventListener('keyup', e => { const a = k['_' + e.code]; if (a) { k[a] = Math.max(0, (k[a] || 0) - 1); delete k['_' + e.code]; } });
    this.padDown = function (key) { const a = PADKEY[key]; if (!a || (self.active && !self.active())) return; first(); pad[a] = true; edge(a); if (key === 'enter') s.ok = true; };
    this.padUp = function (key) { const a = PADKEY[key]; if (a) pad[a] = false; };
    const clear = () => { Object.keys(k).forEach(n => delete k[n]); Object.keys(pad).forEach(n => delete pad[n]); Object.keys(btn).forEach(n => delete btn[n]); self.ptr = null; document.querySelectorAll('.touchpad .on').forEach(el => el.classList.remove('on')); };
    this.clear = clear;
    window.addEventListener('blur', clear);

    /* 화면을 톡 누르기: 캔버스 위 고르기에 쓴다 */
    const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; };
    cv.addEventListener('pointerdown', e => {
      if (self.active && !self.active()) return;
      first(); e.preventDefault(); const q = pos(e); s.any = true; DS.touch = self.touch = e.pointerType === 'touch';
      self.ptr = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t: performance.now(), lx: q.x, ly: q.y };
    });
    const up = e => { const p = self.ptr; if (p && p.id === e.pointerId) { if (e.type === 'pointerup' && Math.hypot(e.clientX - p.x0, e.clientY - p.y0) < 14 && performance.now() - p.t < 600) s.tap = { x: p.lx, y: p.ly }; self.ptr = null; } };
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    cv.addEventListener('contextmenu', e => e.preventDefault());

    /* 화면 버튼: 누르고 있는 동안 켜진다 */
    this.bind = function (el, act) {
      if (!el) return;
      const on = e => { e.preventDefault(); first(); if (!btn[act]) edge(act); btn[act] = true; el.classList.add('on'); try { el.setPointerCapture(e.pointerId); } catch (_) { } }, off = () => { btn[act] = false; el.classList.remove('on'); };
      el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('lostpointercapture', off);
      el.addEventListener('contextmenu', e => e.preventDefault());
    };
    /* 화면 십자 버튼: 한 손가락을 댄 채 미끄러뜨리면 방향이 따라 바뀐다 (대각선도 된다) */
    this.bindPad = function (el) {
      if (!el) return;
      let id = null;
      const set = e => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5, m = Math.hypot(x, y), o = { l: false, r: false, u: false, d: false };
        if (m > 0.13) { const a = Math.atan2(y, x), q = Math.round(a / (Math.PI / 4)); if (q === 0 || q === 1 || q === -1) o.r = true; if (q === 4 || q === -4 || q === 3 || q === -3) o.l = true; if (q === 1 || q === 2 || q === 3) o.d = true; if (q === -1 || q === -2 || q === -3) o.u = true; }
        ['l', 'r', 'u', 'd'].forEach(n => { if (o[n] && !btn[n]) edge(n); btn[n] = o[n]; const b = el.querySelector('[data-dir=' + n + ']'); if (b) b.classList.toggle('on', o[n]); });
      };
      const off = e => { if (e && id !== null && e.pointerId !== id) return; id = null; ['l', 'r', 'u', 'd'].forEach(n => { btn[n] = false; const b = el.querySelector('[data-dir=' + n + ']'); if (b) b.classList.remove('on'); }); };
      el.addEventListener('pointerdown', e => { e.preventDefault(); first(); id = e.pointerId; try { el.setPointerCapture(e.pointerId); } catch (_) { } set(e); });
      el.addEventListener('pointermove', e => { if (id === e.pointerId) set(e); });
      el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('lostpointercapture', off);
      el.addEventListener('contextmenu', e => e.preventDefault());
    };
  }

  /* 화면 한 장마다 한 번: 누르고 있는 상태를 모은다 */
  Input.prototype.frame = function () {
    const s = this.s, k = this.k, pad = this.pad, btn = this.btn;
    s.l = k.l > 0 || !!pad.l || !!btn.l; s.r = k.r > 0 || !!pad.r || !!btn.r; s.u = k.u > 0 || !!pad.u || !!btn.u; s.d = k.d > 0 || !!pad.d || !!btn.d;
    s.a = k.a > 0 || !!pad.a || !!btn.a;
  };
  /* 한 걸음이 끝나면 '방금 눌림'을 지운다 */
  Input.prototype.endStep = function () {
    const s = this.s; s.aEdge = s.bEdge = s.selEdge = s.pauseEdge = s.bigEdge = s.mu = s.md = s.ml = s.mr = s.ok = s.back = s.any = false; s.tap = null;
  };
  DS.Input = Input;
})();
