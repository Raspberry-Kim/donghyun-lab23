/* 동현잠 앱: 동현랭 편집기 → 출전 규약(잠수함 수·시작 스테이지·배경 색·폭탄 수) → 게임.
   조작은 키보드(방향키·X/Space·Z·C)·손가락(화면 십자 버튼과 A·B)·게임패드. */
(function () {
'use strict';
const DS = window.DS, W = DS.W, H = DS.H, VH = DS.VH, S = DS.S, PI = Math.PI, K = DS.K;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const Q = new URLSearchParams(location.search), num = (n, d, lo, hi) => { const v = parseInt(Q.get(n), 10); return isNaN(v) ? d : Math.max(lo, Math.min(hi, v)); };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cv = $('#game'), R = new DS.Render(cv), IN = new DS.Input(cv), SFX = DS.Sfx, inp = IN.s;
const canvas = cv;
const STEP = 1000 / 60, TURN = 44, NUM = n => Number(n).toLocaleString('ko-KR');
const HI_KEY = 'donghyunzam:hi';
const A = DS.app = { render: R, input: IN,
  scr: 'load', t: 0, sel: 0, g: null, demo: null, live: false, turn: 0, hi: 0, prep: 0, prepFn: null, sum: { kills: 0 },
  auto: Q.get('auto') === '1', god: Q.get('god') === '1' || (Q.get('auto') === '1' && Q.get('god') !== '0'), debug: Q.get('debug') === '1', manual: false, loadI: 0, st: { step: 0, draw: 0, fps: 0, n: 0 }
};
try { A.hi = Math.max(0, parseInt(localStorage.getItem(HI_KEY), 10) || 0); } catch (e) { }
let tab = 'play', menu = null, last = 0, acc = 0;
IN.active = () => A.live && tab === 'play';
IN.onFirst = () => SFX.unlock();
/* 누르거나 화면으로 돌아올 때마다 멈춘 소리 장치를 다시 켠다 */
['pointerdown', 'keydown', 'touchend', 'click'].forEach(ev => addEventListener(ev, () => SFX.wake(), true));
document.addEventListener('visibilitychange', () => { if (!document.hidden) SFX.wake(); }); addEventListener('pageshow', () => SFX.wake()); addEventListener('focus', () => SFX.wake());
IN.bindPad($('#dpad')); IN.bind($('#b-a'), 'a'); IN.bind($('#b-b'), 'b'); IN.bind($('#b-sel'), 'sel'); IN.bind($('#b-pause'), 'pause');

/* ---------- 화면 전환·소리·탭 ---------- */
$('#theme').onclick = () => { const dark = document.documentElement.dataset.theme !== 'dark'; document.documentElement.dataset.theme = dark ? 'dark' : 'light'; $('#theme').setAttribute('aria-pressed', String(dark)); };
const SOUND_KEY = 'donghyunzam:sound';
try { if (localStorage.getItem(SOUND_KEY) === 'off') SFX.setMuted(true); } catch (e) { }
function sndUI() { const b = $('#sound'), on = !SFX.muted; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('muted', !on); b.title = on ? '효과음 끄기 (M)' : '효과음 켜기 (M)'; }
function setSound(on) { SFX.setMuted(!on); if (on) SFX.unlock(); try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch (e) { } sndUI(); }
$('#sound').onclick = () => setSound(SFX.muted); sndUI();
const typing = () => { const el = document.activeElement; return !!el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.tagName === 'SELECT'); };
document.addEventListener('keydown', e => { if (e.code !== 'KeyM' || e.metaKey || e.ctrlKey || e.altKey || typing()) return; setSound(SFX.muted); });
document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
  tab = b.dataset.tab;
  document.querySelectorAll('.tabs button').forEach(x => { const on = x.dataset.tab === tab; x.classList.toggle('active', on); on ? x.setAttribute('aria-current', 'page') : x.removeAttribute('aria-current'); });
  document.querySelectorAll('.tab-panel').forEach(p => p.hidden = p.id !== 'tab-' + tab);
  if (tab === 'play') fit(); else { IN.clear(); if (inGame() && !menu && !A.auto) mainMenu(); if (tab === 'rules') foeCards(); }
});
$('.brand').onclick = e => { e.preventDefault(); document.querySelector('[data-tab=play]').click(); scrollTo({ top: 0, behavior: 'smooth' }); };

/* ---------- 규칙 탭의 표 ---------- */
$('#stage-table').innerHTML = '<thead><tr><th>스테이지</th><th>이름</th><th>중간 보스</th><th>보스</th><th>길이</th><th>특징</th></tr></thead><tbody>' + DS.STAGES.map((st, i) => `<tr><td>${i + 1}</td><td><b>${st.name}</b> <small>${st.sub}</small></td><td>${DS.BOSS[st.mid].name}</td><td>${DS.BOSS[st.boss].name}</td><td>${NUM(st.len)}칸</td><td>${st.note}</td></tr>`).join('') + '</tbody>';
const FOES = [
  ['mini', '작은 잠수정', '깊이를 맞추며 다가와 어뢰를 쏜다. 어뢰 한 발.'],
  ['angler', '초롱아귀', '가까이 가면 몸을 떨다가 곧장 달려든다. 어뢰 한 발.'],
  ['shrimp', '새우 떼', '여럿이 줄지어 몰려와 부딪힌다. 어뢰가 터지면 곁의 새우도 함께 쓸린다.'],
  ['hair', '갈치', '선 채로 위아래로 오르내리며 먹물탄을 쏜다. 어뢰 한 발.'],
  ['emine', '계류 기뢰', '줄에 묶여 떠 있다. 닿으면 터진다. 멀리서 어뢰로 터뜨린다.'],
  ['chim', '열수 굴뚝', '거품이 오른 뒤 뜨거운 물기둥을 뿜는다. 부술 수 없다. 멎은 사이에 지나간다.'],
  ['frig', '호위함', '수면을 오가며 폭뢰 하나를 떨군다. 대함미사일 한 발, 어뢰로는 세 발.'],
  ['dest', '구축함', '폭뢰 셋을 한꺼번에 떨군다. 대함미사일 두 발.'],
  ['aegis', '이지스함', '폭뢰 둘에 더해 잠수함을 쫓는 유도 어뢰를 쏜다. 대함미사일 두 발.'],
  ['plane', '전투기', '길목을 지나면 화면 밖에서 날아와 폭뢰를 떨군다. 대함미사일로만 맞힐 수 있다.'],
  ['b_crab', '게 무리 (꽃게 · 소라게 · 킹크랩 · 거미게)', '바닥을 걸으며 큰 집게발이나 긴 다리를 뻗는다.'],
  ['b_octo', '두족류 (문어 · 오징어 · 갑오징어 · 앵무조개 · 크라켄)', '먹물탄을 쏘고 긴 다리를 뻗거나 휘두른다. 뻗은 다리를 어뢰로 맞히면 거둔다.'],
  ['b_frog', '양서류 (개구리 · 도롱뇽 · 두꺼비 왕)', '혀를 길게 뻗어 잠수함을 입 쪽으로 끌어당기고 올챙이를 푼다.'],
  ['star', '별', '500점.'],
  ['itbox', '상자', 'B 폭탄 +2 · R 수리(데미지 −50). 군함을 가라앉히면 B가 떠오른다.']
];
$('#foe-grid').innerHTML = FOES.map(f => `<article><canvas width="168" height="120" data-spr="${f[0]}" role="img" aria-label="${esc(f[1])} 연필 그림"></canvas><div><h4>${esc(f[1])}</h4><p>${esc(f[2])}</p></div></article>`).join('');
function foeCards() {
  if (A.scr === 'load') return;
  document.querySelectorAll('#foe-grid canvas').forEach(c => {
    const s = DS.ART.get(c.dataset.spr), f = s.frames[0], g = c.getContext('2d'), k = Math.min(1, 150 / f.width, 104 / f.height);
    g.clearRect(0, 0, c.width, c.height); g.drawImage(f, (c.width - f.width * k) / 2, (c.height - f.height * k) / 2, f.width * k, f.height * k);
  });
}

/* ---------- 동현랭 편집기(동현랭 시리즈와 같은 모양) ---------- */
for(const ex of examples){const o=document.createElement('option');o.value=ex.id;o.textContent=ex.title;$('#example').append(o);}
const DH_TOKEN=/(ㅋㅋ.*$)|(나는 동현이냐\?|동현이구나)|(오겡끼데스까)|(신중동역|신중동|뭉치)|(뿡뿡뿡|뿡뿡|포동이)|(꽥꽥)|(동+현아)|(동+현)|(도오*옹)|(ㅠ+)|(뚱띠|또치)/g;
const DH_CLS=[null,'t-cmt','t-frame','t-halt','t-ctl','t-out','t-in','t-assign','t-var','t-num','t-minus','t-op'];
function dhLine(line){let html='',last=0;line.replace(DH_TOKEN,(m,...gr)=>{const idx=gr[gr.length-2];html+=esc(line.slice(last,idx));const k=gr.slice(0,11).findIndex(x=>x!==undefined)+1;html+=`<span class="${DH_CLS[k]}">${esc(m)}</span>`;last=idx+m.length;return m;});return html+esc(line.slice(last));}
const code=$('#code'), area=document.createElement('div'), hl=document.createElement('div');
area.className='code-area'; hl.id='hl'; hl.setAttribute('aria-hidden','true'); code.parentNode.insertBefore(area,code); area.append(hl,code);
function hlSync(){hl.scrollTop=code.scrollTop;hl.scrollLeft=code.scrollLeft;}
function hlMetrics(){const cs=getComputedStyle(code);for(const p of ['paddingTop','paddingRight','paddingBottom','paddingLeft','fontFamily','fontSize','lineHeight','tabSize','letterSpacing'])hl.style[p]=cs[p];}
function highlight(){hlMetrics();hl.innerHTML=code.value.split('\n').map(l=>`<span class="ln">${dhLine(l)||' '}</span>`).join('')+'<span class="ln"> </span>';hlSync();}
code.addEventListener('scroll',()=>{hlSync();$('#lines').scrollTop=code.scrollTop;});addEventListener('resize',()=>{highlight();fit();});
function indent(){
  const text=code.value,lines=text.split('\n'),lead=l=>l.length-l.replace(/^[ \t]+/,'').length;
  const next=lines.map(l=>{const b=l.slice(lead(l));if(!b)return '';if(b.startsWith('ㅋㅋ'))return '   '+b;const s=b.split('~')[0].replace(/ㅋㅋ.*$/,'').trim();return (s==='나는 동현이냐?'||s==='동현이구나'?'':'  ')+b;});
  const {selectionStart:a,selectionEnd:b,selectionDirection:dir,scrollTop:y,scrollLeft:x}=code;
  const moved=p=>{let o=0,n=0;for(let i=0;i<lines.length;i++){const L=lines[i].length;if(p<=o+L){const c=p-o,ol=lead(lines[i]),nl=lead(next[i]);return n+Math.min(next[i].length,c<ol?nl:c-ol+nl);}o+=L+1;n+=next[i].length+1;}return n;};
  const value=next.join('\n'),na=moved(a),nb=moved(b);if(value===text&&na===a&&nb===b)return;if(value!==text)code.value=value;code.setSelectionRange(na,nb,dir);code.scrollTop=y;code.scrollLeft=x;
}
function codeChanged(e){if(!e?.isComposing)indent();const n=code.value.split('\n').length;$('#line-count').textContent=n+'줄';$('#lines').textContent=Array.from({length:n},(_,i)=>i+1).join('\n');highlight();autoPreview();}
code.addEventListener('compositionend',()=>codeChanged());
function codeLead(){const a=code.selectionStart,v=code.value,ls=v.lastIndexOf('\n',a-1)+1,le=v.indexOf('\n',ls);return {a,ls,lead:/^[ \t]*/.exec(v.slice(ls,le<0?v.length:le))[0].length};}
document.addEventListener('selectionchange',()=>{if(document.activeElement!==code||code.selectionStart!==code.selectionEnd)return;const {a,ls,lead}=codeLead();if(a-ls<lead)code.setSelectionRange(ls+lead,ls+lead);});
code.addEventListener('beforeinput',e=>{const {a,ls,lead}=codeLead();if(a!==code.selectionEnd)return;if(e.inputType==='deleteContentBackward'&&ls>0&&a>ls&&a-ls<=lead){e.preventDefault();code.setRangeText('',ls-1,a,'end');codeChanged();}});
code.oninput=codeChanged;
code.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();sortie();}});
function selectExample(){const ex=examples.find(e=>e.id===$('#example').value);code.value=ex.code;$('#example-note').textContent=ex.note;codeChanged();}
$('#example').onchange=selectExample;
$('#save').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([code.value+'\n'],{type:'text/plain;charset=utf-8'}));a.download='sortie.dh';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
$('#open').onchange=async e=>{const f=e.target.files[0];if(!f)return;code.value=(await f.text()).replace(/\r/g,'').replace(/\n$/,'');codeChanged();e.target.value='';};
$('#run').onclick=()=>sortie();



/* ---------- 출전 규약: 첫 정수 잠수함 수(필수) · 둘째 시작 스테이지 · 셋째 배경 색 · 넷째 시작 폭탄 수 ---------- */
const DEFAULT = { lives: 3, stage: 1, bg: 1, bombs: 4 };
let cfg = { lives: num('lives', 3, 1, 9), stage: num('stage', 1, 1, DS.STAGES.length), bg: num('bg', 1, 1, 2), bombs: num('bombs', 4, 0, 10) };
const NSTAGE = DS.STAGES.length, NPAPER = DS.PAPERS.length, NWORD = ['한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'][NSTAGE - 1] || String(NSTAGE);
function parseSortie(out) {
  const tok = out.split(/\s+/).filter(Boolean).map(Number), c = { ...DEFAULT }, err = [];
  if (tok.length === 0) return { c, go: false, err: [] };
  const [li, st, bg, bm] = tok, int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  if (!int(li, 1, 9)) err.push(`첫 정수 ${li}은(는) 잠수함 수가 아니다. 1~9만 된다.`); else c.lives = li;
  if (!err.length && tok.length >= 2) { if (!int(st, 1, NSTAGE)) err.push(`둘째 정수 ${st}은(는) 시작 스테이지가 아니다. 1~${NSTAGE}만 된다.`); else c.stage = st; }
  if (!err.length && tok.length >= 3) { if (!int(bg, 1, NPAPER)) err.push(`셋째 정수 ${bg}은(는) 배경 색 번호가 아니다. ${DS.PAPERS.map((p, i) => (i + 1) + ' ' + p.name).join(' · ')} 중 하나를 출력하자.`); else c.bg = bg; }
  if (!err.length && tok.length >= 4) { if (!int(bm, 0, 10)) err.push(`넷째 정수 ${bm}은(는) 폭탄 수가 아니다. 0~10만 된다.`); else c.bombs = bm; }
  if (!err.length && tok.length > 4) err.push(`정수가 ${tok.length}개 나왔다. 잠수함 · 시작 스테이지 · 배경 색 · 폭탄 네 개까지만 읽는다.`);
  return { c, go: !err.length, err };
}
const paperName = c => DS.PAPERS[c.bg - 1].name, stageName = i => DS.STAGES[i].name;
function sortieCard(c) {
  const st = DS.STAGES[c.stage - 1];
  $('#sortie-card').innerHTML = [['잠수함', `${c.lives}`], ['시작 스테이지', `${c.stage} · ${st.name}`], ['보스', `${DS.BOSS[st.mid].name} · ${DS.BOSS[st.boss].name}`], ['배경 색', `${c.bg} · ${paperName(c)}`], ['폭탄', `${c.bombs}`], ['조작', '방향키 항해 · X 또는 Space 어뢰 · Z 폭탄(기뢰 · 대함미사일) · C 폭탄 바꾸기']].map(([a, b]) => `<div><span>${a}</span><strong>${b}</strong></div>`).join('');
  $('#stamp-mode').innerHTML = `잠수함 ${c.lives} <span>폭탄 ${c.bombs}</span>`;
}
function result(text, kind) { const r = $('#result'); r.textContent = text; r.dataset.kind = kind || ''; }
function status(t, kind) { const s = $('#status'); s.textContent = t; s.dataset.kind = kind || ''; }
function readyLabels() { $('#day').textContent = '출전 준비'; $('#turn-badge').textContent = `잠수함 ${cfg.lives} · 폭탄 ${cfg.bombs}`; $('#tile-info').textContent = `스테이지 ${cfg.stage} 「${stageName(cfg.stage - 1)}」부터. 종이는 ${paperName(cfg)}.`; $('#hint').innerHTML = ''; }
let previewT = 0;
function autoPreview() { clearTimeout(previewT); previewT = setTimeout(() => { if (A.live || A.auto) return;   /* 자동 시험(?auto=1)에서는 주소로 준 값을 그대로 쓴다 */ try { const r = Donghyun.run(code.value, { maxSteps: 300000 }); const p = parseSortie(r.output); if (!p.err.length && p.go) { const st = cfg.stage; cfg = p.c; sortieCard(cfg); readyLabels(); if (st !== cfg.stage && A.scr === 'ready') demoStart(); } } catch (e) { } }, 250); }
function sortie() {
  if (A.live || A.scr === 'load') return;
  let out;
  try { const r = Donghyun.run(code.value, { maxSteps: 300000 }); out = r.output; }
  catch (e) { result(`동현랭 오류${e.line ? ` (${e.line}줄)` : ''}: ${e.message}`, 'error'); status('동현랭 오류', 'error'); return; }
  const p = parseSortie(out);
  if (p.err.length) { result('출전 규약 오류: ' + p.err[0], 'error'); status('출전 규약 오류', 'error'); return; }
  if (!p.go) { result('정수가 하나도 출력되지 않았다. 첫 정수로 잠수함 수(1~9)를 출력해야 나선다.', 'error'); status('출전 규약 오류', 'error'); return; }
  cfg = p.c; sortieCard(cfg); go();
}

/* ---------- 준비: 그림을 조금씩 미리 그려 둔다 ---------- */
const WARM = DS.WARM;
function warm(then) {
  const t0 = performance.now();
  while (A.loadI < WARM.length && performance.now() - t0 < 24) DS.ART.get(WARM[A.loadI++]);
  draw();
  if (A.loadI < WARM.length) { setTimeout(() => warm(then), 0); return; }
  setTimeout(() => { then(); last = 0; if (tab === 'rules') foeCards(); }, 0);
}
/* 종이 색을 바꾼다. 바뀌면 그림을 모두 새로 그린다 */
function setPaper(bg, then) {
  if (!DS.setPaper(bg - 1)) { then(); return; }
  DS.ART.clear(); if (R.paper) R.paper.width = R.paper.height = 0;
  R.paper = DS.makePaper(W * S, H * S, 11); document.documentElement.style.setProperty('--ds-paper', DS.PAPERS[DS.paperIdx].css);
  A.scr = 'load'; A.loadI = 0; setTimeout(() => warm(then), 0);
}
function later(fn) { A.scr = 'prep'; A.prep = 0; A.prepFn = fn; }

/* ---------- 시작·종료 ---------- */
const HINT0 = '<span><kbd>X</kbd>어뢰</span><span><kbd>Z</kbd>기뢰 · 대함</span><span><kbd>C</kbd>바꾸기</span><span><kbd>↵</kbd>메뉴</span>';
const inGame = () => A.scr === 'game' && !!A.g && A.turn === 0 && A.g.mode === 'play';
function liveUI() { $('#setup-panel').hidden = true; $('#hud').hidden = false; $('#board-wrap').classList.add('live'); $('#touchpad').classList.add('on'); $('#full').disabled = false; fit(); $('#board-wrap').focus({ preventScroll: true }); }
/* 출전 준비 화면 뒤에서는 잠수함이 혼자 스테이지를 지난다 */
function demoStart() { A.demo = new DS.Game({ stage: cfg.stage - 1, lives: 9, bombs: 10, god: true }); R.prepare(A.demo.L); }
function go() {                       // 출전: 종이 색을 맞추고 바로 스테이지로
  A.live = true; A.g = null; A.demo = null; closeMenu(); SFX.unlock(); IN.clear(); A.sum = { kills: 0 };
  liveUI(); if (!A.auto) $('#board-wrap').scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
  $('#log').innerHTML = ''; log(`출전. 잠수함 ${cfg.lives}, 폭탄 ${cfg.bombs}, 스테이지 ${cfg.stage} 「${stageName(cfg.stage - 1)}」부터, ${paperName(cfg)} 종이.`);
  result('출전했다.'); status('진행 중'); $('#hint').innerHTML = HINT0;
  setPaper(cfg.bg, () => later(() => {
    A.g = new DS.Game({ stage: cfg.stage - 1, lives: cfg.lives, bombs: cfg.bombs, hi: A.hi, sfx: SFX.play, god: A.god });
    R.prepare(A.g.L); A.turn = 0; A.scr = 'game'; watch = null; observe(); hud();
  }));
}
/* 일곱 스테이지를 모두 클리어한 축하: 팡파르(약 10초)와 꽃비. 엔딩 화면을 떠나면 함께 멈춘다. 소리를 꺼 두어도 꽃비는 내린다 */
function fete(g) { if (!SFX.pomp()) SFX.play('clear'); DHPETALS.start($('.board-stage.ds-board'), { dur: 10.4, alive: () => A.g === g && g.mode === 'ending', cut: () => SFX.stop() }); }
function feteOff() { DHPETALS.stop(); SFX.stop(); }
function keepHi() { if (A.g && !A.god) { A.hi = Math.max(A.hi, A.g.hi, A.g.score); try { localStorage.setItem(HI_KEY, String(A.hi)); } catch (e) { } } }
function backToSetup() {
  feteOff(); keepHi();
  A.g = null; A.live = false; A.turn = 0; closeMenu(); IN.clear(); watch = null;
  $('#setup-panel').hidden = false; $('#hud').hidden = true; $('#board-wrap').classList.remove('live'); $('#touchpad').classList.remove('on'); exitFull(); $('#full').disabled = true;
  later(() => { demoStart(); A.scr = 'ready'; A.t = 0; });
  readyLabels(); status('출전 준비'); result('다시 나서려면 코드를 고치거나 그대로 출전을 누르자.'); renderSlotList(); fit();
}
$('#concede').onclick = () => { if (!A.live || A.scr === 'load' || A.scr === 'prep') return; if (inGame()) confirmMenu('포기하고 출전 준비로 돌아갈까?', [['포기한다', backToSetup], ['계속 간다', () => { }]]); else if (!menu) backToSetup(); };

/* ---------- 옆 칸: 정보·기록 ---------- */
function log(t) { const li = document.createElement('li'); li.textContent = t; const l = $('#log'); l.prepend(li); while (l.children.length > 40) l.lastChild.remove(); }
let hudText = '';
function hud() {
  const g = A.g; let rows;
  if (!g) rows = [['잠수함', cfg.lives], ['시작 스테이지', `${cfg.stage} · ${stageName(cfg.stage - 1)}`], ['종이', paperName(cfg)], ['폭탄', cfg.bombs]];
  else {
    const gt = g.gates, b = g.boss, left = gt.filter(q => q.st !== 2).map(q => DS.BOSS[q.b].name);
    rows = [['스테이지', `${g.stage + 1} / ${NSTAGE} · ${g.S.name}`], ['항해', `${Math.min(100, Math.round(g.pl.x / g.L.len * 100))}%`], ['보스', b ? `${b.d.name} ${Math.max(0, Math.round(b.hp / b.hp0 * 100))}%` : left.length ? '남은 보스 ' + left.join(' · ') : '모두 물리쳤다'], ['잠수함', g.mode === 'over' ? 0 : g.lives], ['데미지', Math.min(100, Math.round(g.pl.dmg)) + ' / 100'], ['폭탄', `${g.bombs} / ${K.BMAX} · ${g.bsel === 'mine' ? '기뢰' : '대함미사일'}`], ['물리친 적', g.kills], ['점수', NUM(g.score)], ['최고', NUM(Math.max(g.hi, A.hi))]];
  }
  const html = rows.map(([a, b]) => `<div><span>${a}</span><strong>${esc(b)}</strong></div>`).join('');
  if (html !== hudText) { hudText = html; $('#info-card').innerHTML = html; }
  if (g) { const d = `스테이지 ${g.stage + 1} · ${g.S.name}`, b = `잠수함 ${g.mode === 'over' ? 0 : g.lives} · 폭탄 ${g.bombs}`; if ($('#day').textContent !== d) $('#day').textContent = d; if ($('#turn-badge').textContent !== b) $('#turn-badge').textContent = b; }
}
/* 게임 상태가 바뀐 것을 보고 기록을 남긴다 */
let watch = null;
const snap = g => ({ stage: g.stage, mode: g.mode, lives: g.lives, conts: g.conts, boss: g.boss && !g.boss.dead ? g.boss.key : '', done: g.gates.filter(q => q.st === 2).length });
function observe() {
  const g = A.g, w = watch, now = snap(g);
  if (!w || w.stage !== now.stage || w.conts !== now.conts) { log(`스테이지 ${g.stage + 1} 「${g.S.name}」 시작. 중간 보스 ${DS.BOSS[g.S.mid].name}, 보스 ${DS.BOSS[g.S.boss].name}.`); $('#tile-info').textContent = g.S.note; }
  else {
    if (now.boss && now.boss !== w.boss) log(`${DS.BOSS[now.boss].name}${g.gates[g.boss.gi].mid ? '(중간 보스)' : '(보스)'}와 맞섰다.`);
    if (now.done > w.done) { const gt = g.gates.filter(q => q.st === 2)[now.done - 1] || g.gates[now.done - 1]; log(`${DS.BOSS[gt.b].name}${gt.mid ? '(중간 보스)' : '(보스)'}를 물리쳤다.`); }
    if (now.lives < w.lives) log(`잠수함이 가라앉았다. 남은 잠수함 ${g.lives}.`);
    if (w.mode !== 'clear' && now.mode === 'clear') { A.sum.kills += g.kills; log(`스테이지 ${g.stage + 1} 「${g.S.name}」 클리어. 물리친 적 ${g.kills}, 점수 ${NUM(g.score)}.`); status(`스테이지 ${g.stage + 1} 클리어`); keepHi(); }
    if (w.mode !== 'over' && now.mode === 'over') { log(`게임 오버. ${g.why}. 점수 ${NUM(g.score)}.`); status('게임 오버', 'error'); $('#hint').innerHTML = '<span><kbd>↑</kbd><kbd>↓</kbd>고르기</span><span><kbd>X</kbd>정하기</span>'; keepHi(); }
    if (w.mode === 'clear' && now.mode !== 'clear') status('진행 중');
  }
  watch = now;
}

/* ---------- 메뉴(일시정지) ---------- */
function openMenu(title, items, onCancel) { menu = { title, items: items.map(it => Array.isArray(it) ? { label: it[0], fn: it[1] } : it), onCancel }; menu.i = Math.max(0, menu.items.findIndex(it => !it.off)); drawMenu(); IN.clear(); const el = document.activeElement; if (el && el.tagName === 'BUTTON') el.blur(); }
function drawMenu() { const m = $('#menu'); if (!menu) { m.hidden = true; return; } m.hidden = false; m.className = 'game-menu center'; m.innerHTML = (menu.title ? `<h4>${esc(menu.title)}</h4>` : '') + menu.items.map((it, i) => `<div class="mi ${i === menu.i ? 'sel' : ''} ${it.off ? 'off' : ''}" role="menuitem" data-i="${i}"><span>${esc(it.label)}</span>${it.note ? `<small>${esc(it.note)}</small>` : ''}</div>`).join(''); m.querySelectorAll('.mi').forEach(el => el.onclick = e => { e.stopPropagation(); menu.i = +el.dataset.i; pickMenu(); }); const s = m.querySelector('.sel'); if (s) s.scrollIntoView({ block: 'nearest' }); }
function closeMenu() { menu = null; $('#menu').hidden = true; last = 0; }
function cancelMenu() { const c = menu && menu.onCancel; closeMenu(); if (c) c(); }
function pickMenu() { const it = menu.items[menu.i]; if (!it || it.off) return; closeMenu(); SFX.play('ok'); it.fn(); }
function confirmMenu(q, opts, back) { openMenu(q, opts.map(([label, fn]) => ({ label, fn })), back); }
function mainMenu() { openMenu('잠시 멈춤', [['계속 간다', () => { }], [SFX.muted ? '소리 켜기' : '소리 끄기', () => { setSound(SFX.muted); mainMenu(); }], ['저장', saveMenu], ['불러오기', loadMenu], ['포기하고 출전 준비로', () => confirmMenu('포기하고 출전 준비로 돌아갈까?', [['포기한다', backToSetup], ['계속 간다', () => { }]], mainMenu)]]); }
function menuKey(k) {                 // up · down · ok · back
  if (!menu) return;
  if (k === 'up' || k === 'down') { const n = menu.items.length; menu.i = (menu.i + (k === 'up' ? -1 : 1) + n) % n; SFX.play('tick'); drawMenu(); }
  else if (k === 'ok') pickMenu(); else if (k === 'back') cancelMenu();
}
const MENUKEY = { ArrowUp: 'up', ArrowDown: 'down', KeyX: 'ok', Space: 'ok', Enter: 'ok', NumpadEnter: 'ok', KeyZ: 'back', Escape: 'back', KeyP: 'back' };
document.addEventListener('keydown', e => {          // 메뉴가 떠 있는 동안은 키를 여기서 받는다 (파일 고르기 창은 키를 누른 그 자리에서 열어야 한다)
  if (!menu || tab !== 'play' || e.metaKey || e.ctrlKey || e.altKey || typing()) return;
  const k = MENUKEY[e.code]; if (!k) return;
  e.preventDefault(); e.stopPropagation(); if (e.repeat && k !== 'up' && k !== 'down') return; menuKey(k);
});
/* 어깨 버튼: R=X키(어뢰) · L=Z키(폭탄) · ZL·ZR=Shift키(폭탄 바꾸기). 네 버튼과 +, −, 십자, 왼 스틱은 시리즈 공통 그대로다 */
GP.start({ hint: 'A·R 어뢰 · B·L 폭탄 · X·Y·ZL·ZR 폭탄 바꾸기 · + 메뉴', buttons: { 4: 'z', 5: 'x', 6: 'shift', 7: 'shift' }, status: t => status(t),
  down(k) { if (menu) { if (tab === 'play') menuKey(k === 'x' || k === 'enter' ? 'ok' : k === 'z' ? 'back' : k); return; } IN.padDown(k); }, up(k) { IN.padUp(k); } });


/* ---------- 저장·불러오기: 브라우저 칸 3개 + .dhsave 파일 ---------- */
const SAVE_FORMAT = 'donghyunzam-save', SAVE_VERSION = 1, SLOT_KEY = n => 'donghyunzam:slot' + n, SLOTS = 3;
function snapshot() {
  const g = A.g; if (!g || !inGame()) throw new Error('지금은 저장할 수 없다.');
  const logs = [...$('#log').children].reverse().map(li => li.textContent);
  return { format: SAVE_FORMAT, version: SAVE_VERSION, savedAt: new Date().toISOString(), summary: { stage: g.stage + 1, stageName: g.S.name, lives: g.lives, bombs: g.bombs, score: g.score }, cfg: { ...cfg }, sum: { ...A.sum }, state: g.save(), logs };
}
function restore(data) {
  if (!data || data.format !== SAVE_FORMAT) throw new Error('동현잠 저장 파일이 아니다.');
  if (data.version !== SAVE_VERSION) throw new Error('지원하지 않는 저장 형식 버전이다(' + data.version + ').');
  const g = DS.Game.load(data.state, { sfx: SFX.play, hi: A.hi, god: A.god });             // 맞지 않으면 여기서 멈춘다. 지금 판은 그대로 남는다
  const c = data.cfg || {}, m = data.sum || {}, int = (v, lo, hi, d) => Number.isInteger(v) && v >= lo && v <= hi ? v : d;
  cfg = { lives: g.life0, stage: int(c.stage, 1, NSTAGE, 1), bg: int(c.bg, 1, NPAPER, 1), bombs: g.bomb0 };
  feteOff();
  const fresh = !A.live;
  A.g = null; A.demo = null; A.live = true; A.turn = 0; closeMenu(); SFX.unlock(); IN.clear(); sortieCard(cfg); liveUI();
  if (fresh && !A.auto) $('#board-wrap').scrollIntoView({ block: 'nearest', behavior: 'auto' });      // 불러오기 영역은 판에서 멀다. 곧바로 판으로 옮긴다
  A.sum = { kills: int(m.kills, 0, 99999, 0) };
  const l = $('#log'); l.innerHTML = ''; for (const t of (Array.isArray(data.logs) ? data.logs : []).slice(-38)) log(String(t).slice(0, 200));
  status('불러오는 중');
  setPaper(cfg.bg, () => later(() => {
    R.prepare(g.L); A.g = g; A.scr = 'game'; A.t = 0;
    watch = snap(g);
    log('저장한 판을 불러왔다.'); $('#tile-info').textContent = g.S.note; $('#hint').innerHTML = HINT0; status('진행 중'); hud();
    openMenu('저장한 판을 불러왔다. 준비되면 계속 간다.', [['계속 간다', () => { }], ['메뉴', mainMenu]], () => { });
  }));
}
function readSlot(n) { try { const t = localStorage.getItem(SLOT_KEY(n)); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
function slotNote(d) { if (!d || !d.summary) return '비어 있음'; const t = new Date(d.savedAt), pad = v => String(v).padStart(2, '0'), s = d.summary; return `스테이지 ${s.stage} · 잠수함 ${s.lives} · 폭탄 ${s.bombs} · ${t.getMonth() + 1}/${t.getDate()} ${pad(t.getHours())}:${pad(t.getMinutes())}`; }
function toast(t, kind) { log(t); status(t, kind); }
function saveToSlot(n) { let d; try { d = snapshot(); } catch (e) { toast(e.message); return; } try { localStorage.setItem(SLOT_KEY(n), JSON.stringify(d)); toast(`브라우저 칸 ${n}에 저장했다.`); renderSlotList(); } catch (e) { toast('브라우저 저장에 실패했다. 파일로 내려받아 저장하자.'); } }
function deleteSlot(n) { try { localStorage.removeItem(SLOT_KEY(n)); } catch (e) { } renderSlotList(); }
function saveToFile() { let d; try { d = snapshot(); } catch (e) { toast(e.message); return; } const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d)], { type: 'application/json' })); a.download = `donghyunzam-stage${d.summary.stage}-${d.summary.score}.dhsave`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); toast('저장 파일을 내려받았다.'); }
function saveMenu() {
  const items = [];
  for (let n = 1; n <= SLOTS; n++) { const d = readSlot(n); items.push({ label: `브라우저 칸 ${n}`, note: slotNote(d), fn: () => { if (d) confirmMenu(`칸 ${n}에 덮어쓸까?`, [['덮어쓴다', () => { saveToSlot(n); mainMenu(); }], ['그만둔다', saveMenu]], saveMenu); else { saveToSlot(n); mainMenu(); } } }); }
  items.push({ label: '파일로 내려받기', note: '.dhsave', fn: () => { saveToFile(); mainMenu(); } });
  items.push({ label: '브라우저 칸 지우기', note: '', off: !Array.from({ length: SLOTS }, (_, i) => readSlot(i + 1)).some(Boolean), fn: deleteMenu });
  openMenu('저장', items, mainMenu);
}
function deleteMenu() {
  const items = [];
  for (let n = 1; n <= SLOTS; n++) { const d = readSlot(n); items.push({ label: `브라우저 칸 ${n}`, note: slotNote(d), off: !d, fn: () => confirmMenu(`칸 ${n}${n === 2 ? '를' : '을'} 지울까? 되돌릴 수 없다.`, [['지운다', () => { deleteSlot(n); toast(`브라우저 칸 ${n}${n === 2 ? '를' : '을'} 지웠다.`); deleteMenu(); }], ['그만둔다', deleteMenu]], deleteMenu) }); }
  openMenu('지울 칸', items, saveMenu);
}
function loadFrom(d) { try { restore(d); } catch (e) { const msg = '불러오기 실패: ' + e.message; if (A.live) { toast(msg, 'error'); if (inGame() && !menu) mainMenu(); } else { result(msg, 'error'); status('불러오기 실패', 'error'); } } }
function loadMenu() {
  const items = [];
  for (let n = 1; n <= SLOTS; n++) { const d = readSlot(n); items.push({ label: `브라우저 칸 ${n}`, note: slotNote(d), off: !d, fn: () => confirmMenu('지금 판을 버리고 불러올까?', [['불러온다', () => loadFrom(readSlot(n))], ['그만둔다', loadMenu]], loadMenu) }); }
  items.push({ label: '파일에서 불러오기', note: '.dhsave', fn: () => { mainMenu(); $('#load-file').click(); } });
  openMenu('불러오기', items, mainMenu);
}
$('#load-file').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; if (A.scr === 'load' || A.scr === 'prep') return; let d = null; try { d = JSON.parse(await f.text()); } catch (err) { } loadFrom(d); };
$('#load-file-setup').onchange = $('#load-file').onchange;
document.querySelector('.load-head label').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#load-file-setup').click(); } });
function renderSlotList() {
  const box = $('#slot-list'); box.innerHTML = '';
  for (let n = 1; n <= SLOTS; n++) {
    const d = readSlot(n), b = document.createElement('button'); b.className = 'slot-btn'; b.disabled = !d;
    b.innerHTML = `<b>칸 ${n}</b><span>${esc(slotNote(d))}</span>${d && d.summary ? `<small>${esc(d.summary.stageName || '')} · ${NUM(d.summary.score || 0)}점</small>` : ''}`;
    b.onclick = () => { if (A.scr === 'load' || A.scr === 'prep') return; loadFrom(readSlot(n)); };
    const row = document.createElement('div'); row.className = 'slot-row'; row.append(b);
    if (d) {
      const x = document.createElement('button'); x.className = 'slot-del'; x.type = 'button'; x.textContent = '지우기'; x.setAttribute('aria-label', `칸 ${n} 지우기`);
      let t = 0; x.onclick = () => { if (!x.classList.contains('armed')) { x.classList.add('armed'); x.textContent = '정말 지운다'; t = setTimeout(() => { x.classList.remove('armed'); x.textContent = '지우기'; }, 4000); return; } clearTimeout(t); deleteSlot(n); status(`브라우저 칸 ${n}${n === 2 ? '를' : '을'} 지웠다.`); };
      row.append(x);
    }
    box.append(row);
  }
}

/* ---------- 화면 크기 ---------- */
function fit() {
  const full = $('#stage-full'), ratio = canvas.width / canvas.height, h = el => el && el.offsetHeight || 0;
  if (full.classList.contains('fs')) {
    const side = full.classList.contains('side'), cs = getComputedStyle(full);
    let aw = full.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), ah = full.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (!side) { const tp = $('#touchpad'); ah -= h(full.querySelector('.board-top')) + h(full.querySelector('.board-bottom')) + (getComputedStyle(tp).display === 'none' ? 0 : h(tp) + 10) + 30; }
    canvas.style.width = Math.floor(Math.max(120, Math.min(aw, ah * ratio))) + 'px';
    // 가로 휴대폰: 겹쳐 놓은 버튼에 계기판 글자가 가리지 않게 안쪽으로 모은다
    R.inset = 0;
    if (side && $('#touchpad').classList.contains('on')) {
      const c = canvas.getBoundingClientRect(), d = $('#dpad').getBoundingClientRect(), b = $('.pad-btns').getBoundingClientRect();
      if (c.width > 0 && d.width > 0) { R.inset = Math.max(0, Math.min(112, Math.ceil(Math.max(d.right - c.left, c.right - b.left) / c.width * W) + 3)); const x = $('#exit-full').getBoundingClientRect(); R.insetTop = x.width > 0 ? Math.max(0, Math.min(190, Math.ceil((c.right - x.left) / c.width * W) + 4)) : 78; }
    }
    return;
  }
  R.inset = 0;
  const wrap = $('#board-wrap'), cs = getComputedStyle(wrap), w = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); if (!(w > 0)) return;
  const maxH = Math.max(200, innerHeight - 130);
  canvas.style.width = Math.floor(Math.min(w, maxH * ratio)) + 'px';
}

/* 자동 조종(출전 준비 화면의 시범 항해와 시험용)은 game.js의 DS.autoPilot이다 */
const autoPilot = DS.autoPilot;

/* ---------- 고르기(캔버스 화면) ---------- */
function pick(n, horiz, rects, twoTap) {   // 돌려주는 값: 정한 번호 또는 -1
  let s = A.sel;
  if (horiz ? inp.ml : inp.mu) s = (s + n - 1) % n;
  if (horiz ? inp.mr : inp.md) s = (s + 1) % n;
  if (s !== A.sel) { A.sel = s; SFX.play('tick'); }
  if (inp.tap) for (let i = 0; i < n; i++) { const r = rects[i]; if (inp.tap.x >= r[0] && inp.tap.x <= r[0] + r[2] && inp.tap.y >= r[1] && inp.tap.y <= r[1] + r[3]) { if (twoTap && A.sel !== i) { A.sel = i; SFX.play('tick'); return -1; } A.sel = i; SFX.play('ok'); return i; } }
  if (inp.ok) { SFX.play('ok'); return A.sel; }
  return -1;
}
const OVER_R = [0, 1].map(i => [130, 118 + i * 30, 140, 24]);

/* ---------- 한 걸음 ---------- */
function step() {
  A.t++;
  if (inp.bigEdge && A.live) $('#full').click();
  if (menu) { if (inp.pauseEdge) cancelMenu(); IN.endStep(); return; }
  if (A.scr === 'prep') { if (++A.prep === 3) { const f = A.prepFn; A.prepFn = null; f(); } }
  else if (A.scr === 'ready') { const d = A.demo; if (d) { if (d.mode === 'next' || d.mode === 'over' || (d.mode === 'clear' && d.modeT > 240)) d.startStage(d.stage); d.update(autoPilot(d)); R.pump(d.cam); } }
  else if (A.scr === 'game') stepGame();
  IN.endStep();
}
function stepGame() {
  const g = A.g;
  if (A.turn > 0) {                                    // 종이를 넘기는 중
    A.turn++;
    if (A.turn === TURN + 3) { g.startStage(g.stage + 1); R.prepare(g.L); A.turn = 0; observe(); hud(); }
    return;
  }
  R.pump(g.cam);
  if (g.mode === 'over') {
    g.update(inp); observe();
    if (g.modeT <= 50) A.sel = 0;
    else { const c = A.auto ? 1 : pick(2, false, OVER_R); if (c === 0) { g.cont(); R.prepare(g.L); log(`이어 하기 ${g.conts}번째. 점수는 0부터 다시 센다.`); $('#hint').innerHTML = HINT0; status('진행 중'); observe(); } else if (c === 1) backToSetup(); }
    hud(); return;
  }
  if (g.mode === 'next') {
    if (g.stage < NSTAGE - 1) { A.turn = 1; SFX.play('page'); } else { g.mode = 'ending'; g.modeT = 0; fete(g); keepHi(); log(`축하한다. ${NWORD} 스테이지를 모두 클리어했다. 점수 ${NUM(g.score)}.`); status(`${NWORD} 스테이지 클리어`); $('#hint').innerHTML = '<span><kbd>X</kbd>출전 준비로</span>'; }
    return;
  }
  if (g.mode === 'ending') { g.modeT++; g.t++; if (g.modeT > 150 && (inp.ok || inp.tap) && !A.auto) backToSetup(); return; }
  if (inp.pauseEdge && g.mode === 'play' && !A.auto) { mainMenu(); return; }
  if (A.auto) g.update(autoPilot(g)); else g.update(inp);
  if (g.score > g.hi) g.hi = g.score;
  observe(); if (g.t % 6 === 0) hud();
}

/* ---------- 그리기 ---------- */
const T = (s, x, y, px, al, a, w) => R.text(s, x, y, px, al || 'center', a, w);
function menuDraw(items, rects) {
  for (let i = 0; i < items.length; i++) {
    const r = rects[i], on = i === A.sel;
    R.box(r[0], r[1], r[2], r[3], i + (on ? ((A.t / 9) | 0) % 2 * 5 : 0), on ? 1.3 : 0.6, on ? 0.95 : 0.5, on ? 0.8 : 0.5);
    T(items[i], W / 2, r[1] + r[3] / 2 + 0.5, 13, 'center', on ? 1 : 0.6);
  }
}
function draw() {
  const t = A.t, g = A.g;
  if (A.scr === 'load' || A.scr === 'prep') {
    R.draw(null); T('연필 깎는 중', W / 2, H / 2 - 6, 16);
    if (A.scr === 'load') { const k = A.loadI / WARM.length; R.bar(W / 2 - 50, H / 2 + 12, 100, 3, k); }
    return;
  }
  if (A.scr === 'ready') {
    R.turn = 0; R.draw(A.demo, true); R.wash(0.3);
    R.title(W / 2, 44, 100); T('연필로 그린 잠수함 전투', W / 2, 92, 14, 'center', 0.9);
    R.box(112, 104, 176, 40, 3, 0.6, 0.6, 0.78);
    T(`잠수함 ${cfg.lives} · 폭탄 ${cfg.bombs}`, W / 2, 117, 12.5);
    T(`스테이지 ${cfg.stage} ${stageName(cfg.stage - 1)}부터 · ${paperName(cfg)}`, W / 2, 133, 9.5, 'center', 0.85);
    R.stroke([[2, DS.VH + 0.4], [130, DS.VH + 0.9], [270, DS.VH + 0.2], [W - 2, DS.VH + 0.7]], 0.9, 0.85);
    if (((t / 32) | 0) % 2 === 0) T('출전을 누르면 시작한다', W / 2, DS.VH + 10.5, 11.5);
    if (A.hi > 0) T('최고 ' + A.hi, W - 6, DS.VH + 10.5, 9, 'right', 0.75);
    return;
  }
  // 게임
  R.turn = A.turn > 0 ? Math.min(1, A.turn / TURN) : 0;
  R.draw(g);
  if (A.turn > 0) return;
  if (menu) R.wash(0.38);
  else if (g.mode === 'over') {
    const a = Math.min(0.62, g.modeT / 60); R.wash(a); T('게임 오버', W / 2, 62, 30, 'center', Math.min(1, g.modeT / 40));
    if (g.modeT > 30) T(g.why, W / 2, 88, 10.5, 'center', 0.9);
    if (g.modeT > 50) { T('점수 ' + g.score, W / 2, 104, 10, 'center', 0.85); menuDraw(['이어 하기', '출전 준비로'], OVER_R); T('이어 하면 이 스테이지를 처음부터, 점수는 0부터 다시 센다', W / 2, 186, 8.5, 'center', 0.7); }
  } else if (g.mode === 'ending') {
    const a = Math.min(1, g.modeT / 60); R.wash(a * 0.86);
    T('축하한다', W / 2, 38, 13, 'center', a * 0.9); T(NWORD + ' 스테이지 클리어', W / 2, 62, 24, 'center', a);
    R.sub(W / 2, 104 + Math.sin(g.modeT * 0.05) * 4, 1, 0, -0.06, g.modeT, a);
    T('점수 ' + g.score, W / 2, 142, 16, 'center', a);
    T('물리친 적 ' + A.sum.kills + ' · 보스 ' + (NSTAGE * 2), W / 2, 160, 10, 'center', a * 0.85);
    T(g.conts > 0 ? '이어 하기 ' + g.conts + '번' : '한 번도 이어 하지 않았다', W / 2, 174, 10, 'center', a * 0.85);
    if (g.modeT > 150 && ((g.modeT / 32) | 0) % 2 === 0) T(IN.touch ? '화면을 눌러 출전 준비로' : 'X 키나 화면을 눌러 출전 준비로', W / 2, 194, 10.5);
  }
}

/* ---------- 돌리기: 1초에 60걸음 ---------- */
let fN = 0, fT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if (A.scr === 'load') return;
  if (!last) { last = now; }
  let dt = now - last; last = now;
  if (dt > 100) dt = 100;
  if (Math.abs(dt - STEP) < 2.2) dt = STEP; else if (Math.abs(dt - STEP / 2) < 1.2) dt = STEP / 2;     // 주사율에 맞춰 떨림을 줄인다
  IN.frame();
  if (!A.manual) {
    acc += dt; let n = 0; const t0 = performance.now();
    while (acc >= STEP - 0.01 && n < 6) { step(); acc -= STEP; n++; if (A.scr === 'load') { acc = 0; return; } }
    if (n) A.st.step = A.st.step * 0.95 + (performance.now() - t0) / n * 0.05;
  }
  const t1 = performance.now(); draw(); A.st.draw = A.st.draw * 0.95 + (performance.now() - t1) * 0.05;
  if (A.debug) {
    fN++; if (now - fT > 500) { A.st.fps = fN * 1000 / (now - fT); fN = 0; fT = now; const g = A.g, el = $('#dbg'); if (el) el.textContent = A.st.fps.toFixed(0) + ' fps · 걸음 ' + A.st.step.toFixed(2) + 'ms · 그리기 ' + A.st.draw.toFixed(2) + 'ms' + (g ? ' · 적 ' + g.en.length + ' · 탄 ' + g.bullets.length + ' · 내 탄 ' + g.shots.length : ''); }
  }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) { IN.clear(); if (inGame() && !A.auto && !menu) mainMenu(); } last = 0; });   /* 다른 탭을 보는 동안 멈추고, 돌아오면 멈춤 메뉴가 떠 있다 */
window.addEventListener('blur', () => { if (inGame() && !A.auto && !menu) mainMenu(); });

/* ---------- 시험용 연결 ---------- */
window.render_game_to_text = () => JSON.stringify({ screen: A.scr, live: A.live, sel: A.sel, cfg, paper: DS.PAPERS[DS.paperIdx].name, paused: !!menu, menu: menu ? { title: menu.title, items: menu.items.map(it => it.label), i: menu.i } : null, turning: A.turn > 0, muted: SFX.muted, petals: DHPETALS.on, hi: A.hi, sum: A.sum, coords: 'x는 왼쪽에서 오른쪽, y는 위에서 아래. 화면 400×225칸', game: A.g ? A.g.text() : null });
window.advanceTime = ms => { A.manual = true; const n = Math.max(1, Math.round(ms / STEP)); for (let i = 0; i < n; i++) { if (A.scr === 'load') break; IN.frame(); step(); } if (A.scr !== 'load') draw(); return n; };
window.__donghyunzam = { A, get cfg() { return cfg; }, set cfg(c) { cfg = c; sortieCard(cfg); }, get menu() { return menu; }, parseSortie, sortie, go, snapshot, restore, loadFrom, readSlot, saveToSlot, mainMenu, menuKey, closeMenu, backToSetup, fit, fete, feteOff, autoPilot, get petals() { return DHPETALS; } };

if (A.debug) { const d = $('#dbg'); if (d) d.hidden = false; }
selectExample(); sortieCard(cfg); readyLabels(); renderSlotList(); fit();

/* ---------- 전체 화면(동현램과 같은 규칙) ---------- */
const stageFull=$('#stage-full');
const fullEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
const canNativeFull=!!((document.fullscreenEnabled||document.webkitFullscreenEnabled)&&(stageFull.requestFullscreen||stageFull.webkitRequestFullscreen));
const isPseudo=()=>stageFull.classList.contains('pseudo-full');
const isFull=()=>fullEl()===stageFull||isPseudo();
const SIDE_MQ=matchMedia('(orientation: landscape) and (pointer: coarse)');
function setPseudo(on){ stageFull.classList.toggle('pseudo-full',on); document.documentElement.classList.toggle('pseudo-full-on',on); onFull(); }
/* 브라우저 전체 화면에서 Esc는 브라우저가 먼저 받아 전체 화면을 닫고 쪽에는 넘기지 않는다(Safari · Firefox · Chrome).
   메뉴를 열려고 누른 Esc에 게임이 멈추지 않은 채 화면만 작아지지 않도록, 닫기 버튼이나 F가 아닌 길로 닫혔으면 메뉴를 연다. */
let wasNative=false, leaving=false;
function exitFull(){ if(isPseudo()) return setPseudo(false); if(fullEl()===stageFull){ leaving=true; (document.exitFullscreen||document.webkitExitFullscreen||(()=>{})).call(document); } }
let hintTimer=0;
function onFull(){ const on=isFull(), native=fullEl()===stageFull;
  if(wasNative&&!native){ if(!leaving&&tab==='play'&&inGame()&&!A.auto&&!menu) mainMenu(); leaving=false; }
  if(native&&!wasNative) leaving=false;
  wasNative=native;
  stageFull.classList.toggle('fs',on); stageFull.classList.toggle('side',on&&SIDE_MQ.matches);
  $('#exit-full').hidden=!on; $('#full').textContent=on?'전체 화면 닫기':'전체 화면';
  clearTimeout(hintTimer); $('#full-hint').hidden=!on; if(on) hintTimer=setTimeout(()=>$('#full-hint').hidden=true,5000);
  fit(); setTimeout(fit,60); if(on) $('#full').blur(); }
document.addEventListener('fullscreenchange',onFull); document.addEventListener('webkitfullscreenchange',onFull);
SIDE_MQ.addEventListener?SIDE_MQ.addEventListener('change',onFull):SIDE_MQ.addListener(onFull);
$('#exit-full').onclick=exitFull;
$('#full').onclick=()=>{ if(isFull()) return exitFull(); if(!A.live) return;
  if(!canNativeFull) return setPseudo(true);
  try{ const r=stageFull.requestFullscreen?stageFull.requestFullscreen():stageFull.webkitRequestFullscreen();
    if(r&&r.catch) r.catch(()=>setPseudo(true)); }catch(e){ setPseudo(true); } };

const fontsReady = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load("700 30px Gaegu", '동현잠 0123'), document.fonts.load("400 16px Gaegu", '동현잠')]).catch(() => { }) : Promise.resolve();
Promise.race([Promise.all([fontsReady, R.titleReady]), new Promise(r => setTimeout(r, 2500))]).then(() => {
  draw(); requestAnimationFrame(frame);
  setTimeout(() => warm(() => { demoStart(); A.scr = 'ready'; A.t = 0; document.body.classList.add('ready'); if (A.auto) go(); }), 0);
});
})();
