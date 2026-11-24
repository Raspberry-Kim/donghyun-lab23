/* 효과음과 승리 팡파르 — 파일 없이 그 자리에서 만든다 (효과음은 연필 긁는 소리 느낌) */
(function () {
  'use strict';
  const DS = window.DS;
  let ac = null, master = null, nbuf = null, muted = false; const last = {};
  function init() {
    if (ac) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ac = new AC(); } catch (_) { ac = null; return; }
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.55; master.connect(ac.destination);
    nbuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = nbuf.getChannelData(0); let v = 0;
    for (let i = 0; i < d.length; i++) { v = v * 0.2 + (Math.random() * 2 - 1) * 0.8; d[i] = v; }
  }
  function env(g, t, vol, dur, atk) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + (atk || 0.004)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  function tone(type, f0, f1, dur, vol, delay) {
    const t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    env(g, t, vol, dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, f0, f1, type, q, delay, atk) {
    const t = ac.currentTime + (delay || 0), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = nbuf; s.loop = true; f.type = type || 'lowpass'; f.Q.value = q || 0.8;
    f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    env(g, t, vol, dur, atk); s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 0.8); s.stop(t + dur + 0.02);
  }
  const D = {
    shot() { noise(0.045, 0.07, 4200, 2600, 'bandpass', 1.4); },
    eshot() { noise(0.06, 0.05, 900, 500, 'bandpass', 2); },
    chg() { tone('triangle', 520, 780, 0.09, 0.09); },
    charge() { noise(0.34, 0.2, 700, 3800, 'bandpass', 1.1); tone('triangle', 240, 620, 0.26, 0.09); },
    bomb() { noise(1.3, 0.34, 2600, 120, 'lowpass', 0.7, 0, 0.03); tone('sine', 130, 42, 1.1, 0.3); },
    boom_s() { noise(0.2, 0.2, 1500, 220); },
    boom() { noise(0.42, 0.28, 1100, 110); tone('sine', 120, 50, 0.3, 0.16); },
    bigboom() { noise(1.5, 0.4, 1400, 60, 'lowpass', 0.7, 0, 0.02); tone('sine', 100, 30, 1.2, 0.34); noise(0.5, 0.2, 3000, 600, 'bandpass', 1, 0.15); },
    bossdie() { noise(0.9, 0.3, 2000, 150); tone('sawtooth', 220, 55, 0.8, 0.07); },
    die() { noise(0.6, 0.32, 2400, 140); tone('sawtooth', 440, 60, 0.55, 0.1); },
    item() { tone('triangle', 660, 660, 0.07, 0.11); tone('triangle', 990, 990, 0.12, 0.11, 0.07); },
    medal() { tone('sine', 1320, 1320, 0.05, 0.09); tone('sine', 1760, 1760, 0.1, 0.09, 0.05); },
    warn() { for (let i = 0; i < 4; i++) { tone('square', 330, 330, 0.16, 0.05, i * 0.42); tone('square', 262, 262, 0.16, 0.05, i * 0.42 + 0.2); } },
    clear() { [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, 0.22, 0.12, i * 0.13)); },
    extend() { [784, 988, 1175, 1568].forEach((f, i) => tone('triangle', f, f, 0.12, 0.12, i * 0.08)); },
    tick() { noise(0.03, 0.08, 3000, 2000, 'bandpass', 2); },
    ok() { tone('triangle', 520, 780, 0.1, 0.1); },
    page() { noise(0.5, 0.16, 500, 5000, 'bandpass', 0.6, 0, 0.1); },
    torp() { noise(0.26, 0.13, 500, 1900, 'bandpass', 0.9, 0, 0.03); tone('sine', 150, 90, 0.2, 0.1); },
    mine() { tone('sine', 220, 120, 0.16, 0.1); noise(0.12, 0.06, 600, 300, 'lowpass', 0.8); },
    ssm() { noise(0.5, 0.16, 700, 3600, 'bandpass', 0.8, 0, 0.05); tone('triangle', 200, 520, 0.4, 0.07); },
    splash() { noise(0.3, 0.14, 2600, 700, 'bandpass', 0.7, 0, 0.02); },
    whip() { noise(0.16, 0.16, 900, 3400, 'bandpass', 1.2, 0, 0.02); },
    snap() { noise(0.06, 0.2, 2400, 1200, 'bandpass', 1.6); tone('square', 180, 90, 0.07, 0.05); },
    bump() { tone('sine', 110, 60, 0.14, 0.16); noise(0.08, 0.08, 500, 200); },
    ping() { tone('sine', 1180, 1160, 0.5, 0.06); tone('sine', 1180, 1160, 0.4, 0.025, 0.28); }
  };
  /* 승리 팡파르(약 10초): 엘가 〈위풍당당 행진곡〉 1번(1901) 트리오 가락의 첫 줄을 라장조로 옮겨 금관·저음·팀파니 소리로 합성한다. 녹음은 쓰지 않는다.
     동현삼·동현항의 팡파르를 그대로 옮겼다(가락·화음·저음·빠르기가 같다). 끝판왕을 이긴 엔딩 화면에서만 울린다.
     음은 MIDI 번호(69 = 가온 라 440Hz), 길이는 박으로 적는다. 팡파르만 따로 묶어(fan), 소리를 끄거나 엔딩 화면을 떠날 때 바로 줄인다 */
  let fan = null, fanEnd = 0; const played = [];
  function hush() {
    if (!fan || !ac) return; const g = fan, u = ac.currentTime; fan = null; fanEnd = 0;
    try { g.gain.cancelScheduledValues(u); g.gain.setValueAtTime(g.gain.value, u); g.gain.linearRampToValueAtTime(0, u + 0.12); } catch (_) { }
    setTimeout(() => { try { g.disconnect(); } catch (_) { } }, 400);
  }
  function penv(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function pnoise(t, dur, type, freq, q, peak, a, out) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = nbuf; s.loop = true;
    f.type = type; f.frequency.setValueAtTime(freq, t); if (q) f.Q.value = q; penv(g, t, a || 0.005, peak, dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 0.5); s.stop(t + (a || 0.005) + dur + 0.05);
  }
  function ptone(t, type, freq, dur, peak, a, out) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t); penv(g, t, a || 0.01, peak, dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + (a || 0.01) + dur + 0.05); return o;
  }
  function pomp() {
    hush(); const t = ac.currentTime + 0.01, out = fan = ac.createGain(), comp = ac.createDynamicsCompressor(); out.gain.value = 0.5; out.connect(comp); comp.connect(master);
    const pre = ac.createGain(), dl = ac.createDelay(0.5), fb = ac.createGain(), wet = ac.createGain(); dl.delayTime.value = 0.115; fb.gain.value = 0.28; wet.gain.value = 0.22;
    pre.connect(out); pre.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(out);
    const B = 0.53, at = b => t + (b <= 12 ? b * B : 12 * B + (b - 12) * B * (1 + 0.05 * (b - 12))), hz = m => 440 * Math.pow(2, (m - 69) / 12);
    function horn(b, len, m, peak, cut) {
      const u = at(b), d = at(b + len) - u - 0.035, lp = ac.createBiquadFilter(), g = ac.createGain(); lp.type = 'lowpass'; lp.Q.value = 0.7;
      lp.frequency.setValueAtTime(cut * 0.4, u); lp.frequency.linearRampToValueAtTime(cut, u + 0.07); lp.frequency.setTargetAtTime(cut * 0.62, u + 0.07, 0.3);
      g.gain.setValueAtTime(0.0001, u); g.gain.linearRampToValueAtTime(peak, u + 0.04); g.gain.setTargetAtTime(peak * 0.8, u + 0.04, 0.25); g.gain.setTargetAtTime(0.0001, u + d, 0.05);
      [-5, 5].forEach(c => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = c; o.connect(lp); o.start(u); o.stop(u + d + 0.4); });
      lp.connect(g); g.connect(pre);
    }
    function timp(b, m, peak) { const u = at(b), o = ptone(u, 'sine', hz(m) * 1.1, 0.5, peak, 0.004, pre); o.frequency.exponentialRampToValueAtTime(hz(m), u + 0.06); pnoise(u, 0.07, 'lowpass', 700, 0, peak * 0.5, 0.002, pre); }
    function crash(b, peak, dur) {
      const u = at(b); pnoise(u, dur, 'highpass', 4800, 0, peak, 0.004, pre); pnoise(u, dur * 0.6, 'bandpass', 2600, 0.6, peak * 0.5, 0.004, pre);
      const o = ptone(u, 'sine', 58, 0.45, peak * 1.5, 0.004, pre); o.frequency.exponentialRampToValueAtTime(34, u + 0.45);
    }
    /* 가락: 한 옥타브 위를 겹쳐 트럼펫처럼 밝게 한다 */
    [[74, 0, 2], [73, 2, 0.5], [74, 2.5, 0.5], [76, 3, 1], [71, 4, 2], [69, 6, 2], [67, 8, 2], [66, 10, 0.5], [67, 10.5, 0.5], [69, 11, 1], [64, 12, 4], [66, 16, 1.4]].forEach(n => { horn(n[1], n[2], n[0], 0.2, 2500); horn(n[1], n[2], n[0] + 12, 0.1, 3300); });
    /* 화음(박마다 다시 짚는다)과 저음 */
    const CH = [[57, 62, 66], [57, 62, 66], [57, 61, 64], [57, 61, 64], [59, 62, 66], [59, 62, 66], [57, 62, 66], [57, 62, 66], [59, 62, 67], [59, 62, 67], [57, 62, 66], [57, 62, 66], [56, 62, 64], [56, 62, 64], [55, 61, 64], [55, 61, 64]],
      BS = [38, 38, 40, 40, 42, 42, 42, 45, 43, 43, 45, 45, 47, 47, 45, 45];
    CH.forEach((c, b) => { c.forEach(m => horn(b, 0.94, m, 0.065, 1300)); horn(b, 0.94, BS[b], 0.2, 520); horn(b, 0.94, BS[b] + 12, 0.085, 760); });
    [57, 62, 66, 69, 74].forEach(m => horn(16, 1.4, m, 0.085, 1700)); horn(16, 1.4, 38, 0.22, 520); horn(16, 1.4, 50, 0.1, 760);
    /* 팀파니·심벌즈·작은북: 첫 박과 마디 머리를 짚고, 끝 두 박에서 굴려 마지막 화음으로 몰아간다 */
    crash(0, 0.16, 0.9); timp(0, 50, 0.5); timp(4, 50, 0.3); timp(8, 50, 0.36); timp(12, 52, 0.3);
    for (let i = 0; i < 12; i++) { const b = 14 + i / 6, k = i / 11; timp(b, 45, 0.1 + 0.3 * k); pnoise(at(b), 0.05, 'bandpass', 1900, 0.7, 0.05 + 0.2 * k, 0.002, pre); }
    crash(16, 0.28, 1.1); timp(16, 50, 0.5); fanEnd = performance.now() + (at(17.4) + 0.5 - ac.currentTime) * 1000;
  }
  const GAP = { shot: 0.07, eshot: 0.12, boom_s: 0.05, boom: 0.06, medal: 0.04, item: 0.04, whip: 0.05, bump: 0.12, splash: 0.06 };
  DS.Sfx = {
    /* 소리 장치가 돌고 있지 않으면 다시 켠다. Safari는 탭을 바꾸거나 통화가 끝난 뒤 'interrupted'로 남는다 */
    unlock() { init(); this.wake(); },
    wake() { if (!ac || ac.state === 'running' || ac.state === 'closed') return; try { const r = ac.resume(); if (r && r.catch) r.catch(() => { }); } catch (_) { } },
    play(n) {
      if (!ac || muted || ac.state !== 'running' || !D[n]) return;
      const t = ac.currentTime; if (t - (last[n] == null ? -9 : last[n]) < (GAP[n] || 0.02)) return; last[n] = t;
      try { D[n](); } catch (_) { }
    },
    /* 승리 팡파르를 울린다. 소리가 꺼져 있거나 소리 장치가 아직 열리지 않았으면 내지 않는다 */
    pomp() { if (!ac || muted || ac.state !== 'running') return false; try { pomp(); } catch (_) { hush(); return false; } played.push('pomp'); if (played.length > 40) played.shift(); return true; },
    /* 팡파르를 멈춘다(짧은 효과음은 그대로 둔다) */
    stop() { hush(); },
    /* 팡파르가 울리는 중인가 · 실제로 낸 팡파르 기록(시험이 읽는다) */
    get ringing() { return !!fan && performance.now() < fanEnd; },
    get played() { return played.slice(); },
    get muted() { return muted; },
    setMuted(m) { muted = !!m; if (master) master.gain.value = muted ? 0 : 0.55; if (muted) hush(); },
    get ready() { return !!ac && ac.state === 'running'; }
  };
})();
