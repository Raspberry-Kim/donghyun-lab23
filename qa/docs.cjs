// node qa/docs.cjs -- 문서에 적은 동현랭 예시가 적힌 수를 실제로 출력하는지, 판 번호가 맞는지 본다
const fs = require('fs'), path = require('path'), D = require('../src/donghyun.js');
const root = path.join(__dirname, '..'); let fail = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fail++; };
const rd = n => fs.readFileSync(path.join(root, n), 'utf8');
const readme = rd('README.md'), h = rd('src/index.html'), credits = rd('CREDITS.md'), cff = rd('CITATION.cff'), log = rd('CHANGELOG.md');
ok(D.run(readme.match(/```\n([\s\S]*?)```/)[1]).output === '3\n', 'README 예시는 3을 출력한다');
const pre = h.slice(h.indexOf('id="tab-protocol"')).match(/<pre[^>]*>([\s\S]*?)<\/pre>/)[1].replace(/<[^>]+>/g, '');
ok(D.run(pre).output === '5\n2\n', '출전 규약 탭 예시는 5 2를 출력한다');
// README에 적은 예제 아홉의 출력
const ex = new Function(rd('src/examples.js') + '\n;return examples;')();
const want = [...readme.matchAll(/\*\*(\d\d) [^*]+\*\*\(([\d ]+)\)/g)].map(m => [m[1], m[2]]);
ok(want.length === ex.length && ex.length === 9, 'README의 예제 수 ' + want.length + ' = ' + ex.length);
ex.forEach((e, i) => ok(want[i] && e.title.startsWith(want[i][0]) && D.run(e.code).output.trim().split('\n').join(' ') === want[i][1], '예제 ' + e.title + ' → ' + (want[i] || [])[1]));
const ver = h.match(/class="edition">v([\d.]+)/)[1];
ok(readme.startsWith('# 동현잠 v' + ver), 'README 판 번호 v' + ver);
ok(cff.includes('version: "' + ver + '"'), 'CITATION.cff 판 번호');
ok(log.includes('## v' + ver + ' '), 'CHANGELOG 판 번호');
ok(h.includes('<footer><span>동현잠 v' + ver + ' ') && (h.match(new RegExp(' · v' + ver.replace('.', '\\.') + '<', 'g')) || []).length === 2, '바닥글·탭 머리의 판 번호');
ok(!/요청\s?반영|사용자 요청|시안|가칭/.test(readme + log + h + credits), '금지 표현 없음');
ok(!/\uBFD0/.test(readme + credits + h + log), '한정 조사(U+BFD0) 없음');
ok(!/noindex/.test(h), 'noindex 없음');
ok([readme, credits, h].every(t => t.includes('제작자 본인이 직접 쓴')) && cff.includes('by the author;'), '제목 글씨 표기(README · CREDITS · 모델과 출처 탭 · CITATION)');
ok(/코드와 글꼴의 이용 조건<\/h3><p>[^<]*제목 ‘동현잠’은 글꼴이 아니라 제작자 본인이 직접 쓴 글씨이고, 이 글씨의 권리는 MIT와 별개로 쓴 사람에게 있다\./.test(h), '글꼴 설명란에 제목 글씨 표기');
ok(h.includes('id="slot-list"') && h.includes('id="load-file"') && h.includes('id="load-file-setup"') && /저장 · 불러오기/.test(readme) && !/저장·불러오기와 난이도 고르기는 없다/.test(readme), '저장·불러오기 안내(판 · README)');
ok((rd('src/series.html').match(/class="series-item/g) || []).length === 24 && rd('src/series.html').includes('data-series="zam" aria-current="page"'), '시리즈 띠 24칸, 동현잠이 지금 여기');
console.log(fail ? fail + ' FAILED' : 'all ok'); process.exit(fail ? 1 : 0);
