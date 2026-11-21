/* Hifz web app: the drills (2026-10-31, at the learner's request: "add every option you suggested").
   A panel (🎯 in the arrows row of a surah file; the Drills button of the home page) with three drills:
   - Random start (ابدأ من أي آية): a random ayah of this surah, of a span of surahs or of them all; its first
     three words are shown, the rest is recited from memory, then revealed; "next ayah" carries on; a link
     opens it in its surah file.  Reciting from a random point, not from a segment's beginning, is the test
     of ḥifẓ mutqan.
   - Look-alikes (المتشابهات), on a surah file: an ayah with a look-alike (data "m" of tools/app_data.py,
     from tools/repeats.py) and the longest run of words the two share; what follows that run here (or,
     when both end the same way, what comes before it) is asked, the choices being this ayah's words and
     the look-alike's (the texts come from the kit's search file, packages/hifz-search.js).
   - Seam cards (بطاقات الوصل): flashcards from deck.json (tools/make_app.py, from the ledger): the last
     words of a segment on the front, the first words of the next segment (the connector clue of the ledger)
     on the back, or the other way round; shuffled over this surah, a span of surahs or all of them; "knew it"
     / "didn't" count the round.
   Every Qur'anic word shown is copied from the kit's text (the page's own words, the search file or deck.json);
   nothing is typed.  window.HifzAids = {open(tab), close(), draw(), pick(), deck()} for the tests.
   Interface text in three languages, following the switch of tools/ui.py (window.hifzUI). */
(function () {
  'use strict';
  var de = document.documentElement, A = window.HifzAudio, W = window.HifzWords;
  var D = W ? W.D : null, S = D ? D.s : 0;
  function root() { return (A && A.root) || ''; }
  var TX = {
    ar: {
      title: 'تدريبات الحفظ', rnd: 'ابدأ من أي آية', sim: 'المتشابهات', cards: 'بطاقات الوصل', close: 'إغلاق',
      scope: 'من أين؟', here: 'هذه السورة', amma: 'الجزءان ٢٩–٣٠', span: 'من سورة إلى سورة', all: 'كل السور', from: 'من', to: 'إلى',
      draw: 'اسحب آية', again: 'آية أخرى', reveal: 'أظهر الآية', next: 'الآية التالية', open: 'افتحها في سورتها', surah: 'سورة {0}', ayah: 'الآية {0}',
      rndTip: 'أكمل من حفظك، ثم أظهر الآية لتتحقق.', end: 'انتهت السورة.',
      simTip: 'ما الذي يأتي بعد هذه الكلمات في هذه الآية؟', simQ: 'الآية {0}: «{1}» …', which: 'التكملة الصحيحة:', right: 'صحيح', wrong: 'ليس هذا: هذا ما يأتي في {0}',
      simTipB: 'ما الذي يسبق هذه الكلمات في هذه الآية؟', simQB: 'الآية {0}: … «{1}»', whichB: 'ما قبلها:', soa: '﴿أول الآية﴾',
      noSim: 'لا متشابهات في هذه السورة.', simHome: 'افتح سورة لتتدرب على متشابهاتها.', simNext: 'آية أخرى', where: 'سورة {0} {1}', hereS: 'هذه السورة',
      eoa: '﴿نهاية الآية﴾', twin: 'الشبيهة: {0}', score: '{0} صحيحة من {1}',
      cardTip: 'آخر كلمات مقطع، وأول كلمات المقطع التالي: اذكرها ثم اقلب البطاقة.', front: 'آخر المقطع {0} — {1}', frontN: 'آخر المقطع {0}', back: 'أول المقطع {0}', flip: 'اقلب', knew: 'عرفتها', missed: 'لم أعرفها',
      reverse: 'بالعكس: أعطني أول المقطع التالي وأذكر آخر المقطع', shuffle: 'خلط', done: 'انتهت البطاقات: {0} معروفة من {1}', noDeck: 'لا بطاقات: تعذّر تحميل deck.json.',
      left: 'بقي {0}', nextS: 'السورة التالية', ofS: 'سورة {0} — المقطع {1} من {2}'
    },
    en: {
      title: 'Memorization drills', rnd: 'Random start', sim: 'Look-alikes', cards: 'Seam cards', close: 'Close',
      scope: 'From where?', here: 'This surah', amma: 'Juzʾ 29–30', span: 'Surah to surah', all: 'All surahs', from: 'From', to: 'To',
      draw: 'Draw an ayah', again: 'Another ayah', reveal: 'Show the ayah', next: 'Next ayah', open: 'Open it in its surah', surah: 'Surah {0}', ayah: 'Ayah {0}',
      rndTip: 'Carry on from memory, then show the ayah to check.', end: 'End of the surah.',
      simTip: 'What follows these words in this ayah?', simQ: 'Ayah {0}: “{1}” …', which: 'The right continuation:', right: 'Right', wrong: 'Not this one: that is what follows in {0}',
      simTipB: 'What comes before these words in this ayah?', simQB: 'Ayah {0}: … “{1}”', whichB: 'What comes before:', soa: '(start of the ayah)',
      noSim: 'No look-alikes in this surah.', simHome: 'Open a surah to drill its look-alikes.', simNext: 'Another ayah', where: 'Surah {0} {1}', hereS: 'this surah',
      eoa: '(end of the ayah)', twin: 'The look-alike: {0}', score: '{0} right of {1}',
      cardTip: 'The last words of a segment, and the first words of the next: say them, then flip the card.', front: 'End of segment {0} — {1}', frontN: 'End of segment {0}', back: 'Start of segment {0}', flip: 'Flip', knew: 'Knew it', missed: "Didn't",
      reverse: 'Reverse: give me the start of the next segment and I recall the end of the segment', shuffle: 'Shuffle', done: 'No cards left: {0} known of {1}', noDeck: "No cards: deck.json couldn't be loaded.",
      left: '{0} left', nextS: 'Next surah', ofS: 'Surah {0} — segment {1} of {2}'
    },
    es: {
      title: 'Ejercicios de memorización', rnd: 'Comienzo al azar', sim: 'Aleyas parecidas', cards: 'Tarjetas de enlace', close: 'Cerrar',
      scope: '¿De dónde?', here: 'Esta sura', amma: 'Yuz 29–30', span: 'De una sura a otra', all: 'Todas las suras', from: 'De', to: 'A',
      draw: 'Sacar una aleya', again: 'Otra aleya', reveal: 'Mostrar la aleya', next: 'Aleya siguiente', open: 'Abrirla en su sura', surah: 'Sura {0}', ayah: 'Aleya {0}',
      rndTip: 'Siga de memoria y luego muestre la aleya para comprobar.', end: 'Fin de la sura.',
      simTip: '¿Qué sigue a estas palabras en esta aleya?', simQ: 'Aleya {0}: «{1}» …', which: 'La continuación correcta:', right: 'Correcto', wrong: 'No es esa: así sigue en {0}',
      simTipB: '¿Qué precede a estas palabras en esta aleya?', simQB: 'Aleya {0}: … «{1}»', whichB: 'Lo que precede:', soa: '(comienzo de la aleya)',
      noSim: 'No hay aleyas parecidas en esta sura.', simHome: 'Abra una sura para ejercitar sus aleyas parecidas.', simNext: 'Otra aleya', where: 'Sura {0} {1}', hereS: 'esta sura',
      eoa: '(fin de la aleya)', twin: 'La parecida: {0}', score: '{0} bien de {1}',
      cardTip: 'Las últimas palabras de un segmento y las primeras del siguiente: dígalas y luego gire la tarjeta.', front: 'Final del segmento {0} — {1}', frontN: 'Final del segmento {0}', back: 'Comienzo del segmento {0}', flip: 'Girar', knew: 'La sabía', missed: 'No la sabía',
      reverse: 'Al revés: deme el comienzo del siguiente segmento y recuerdo el final del segmento', shuffle: 'Barajar', done: 'No quedan tarjetas: {0} sabidas de {1}', noDeck: 'Sin tarjetas: no se pudo cargar deck.json.',
      left: 'Quedan {0}', nextS: 'Sura siguiente', ofS: 'Sura {0} — segmento {1} de {2}'
    }
  };
  function lang() { var u = de.getAttribute('data-ui'); return u === 'en' || u === 'es' ? u : 'ar'; }
  function T(k) { return TX[lang()][k]; }
  function nm(n) { return lang() === 'ar' ? String(n).replace(/[0-9]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.charAt(+d); }) : String(n); }
  function fmt(s) { var a = arguments; return String(s).replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1]; }); }
  function iso(t) { return lang() === 'ar' ? t : '⁨' + t + '⁩'; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var LET = /[ء-يٱ]/;
  function words(t) { return String(t).split(/\s+/).filter(function (w) { return LET.test(w); }); }
  function norm(t) {
    t = String(t).replace(/ـ?ٰ/g, 'ا').replace(/[ؐ-ًؚ-ٟۖ-ۭـ]/g, '').replace(/[ٱآأإ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ء/g, '');
    return t.replace(/[^ء-ي]/g, '');
  }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // ---------------------------------------------------------------- the text of any ayah (the kit's search file)
  var HS = null, hsWait = [], hsState = 0;
  function engine(cb) {
    if (HS) return cb(HS);
    if (window.HIFZ_SEARCH && window.HIFZ_SEARCH.api === 1) { HS = window.HIFZ_SEARCH; return cb(HS); }
    hsWait.push(cb);
    if (hsState) return;
    hsState = 1;
    var sc = document.createElement('script');
    sc.src = root() + 'packages/hifz-search.js';
    sc.onload = sc.onerror = function () {
      if (sc.parentNode) sc.parentNode.removeChild(sc);
      HS = window.HIFZ_SEARCH && window.HIFZ_SEARCH.api === 1 ? window.HIFZ_SEARCH : null;
      hsState = HS ? 2 : 0;
      var w = hsWait; hsWait = []; w.forEach(function (f) { f(HS); });
    };
    document.head.appendChild(sc);
  }
  function text(s, a) {                   // this surah's words from the page (the source of truth here), else the search file
    if (W && s === S) { var ws = W.words(a).filter(function (w) { return w.hasAttribute('data-i'); }); if (ws.length) return ws.map(function (w) { return w.textContent; }).join(' '); }
    return HS ? HS.text(HS.gidx(s, a)) : '';
  }
  function nAyat(s) { return HS ? HS.n[s - 1] : (D && s === S ? D.n : 0); }
  function sName(s) {
    if (HS) return HS.names[s - 1];
    if (D && D.nv && D.nv.f[String(s)]) return D.nv.f[String(s)][0];
    // this surah (2026-11-21: its seam cards named no surah before the search index had loaded)
    var h = D && +D.s === +s ? document.querySelector('.idx h1') : null;
    return h ? h.textContent.replace(/^\s*سورة\s+/, '').trim() : '';
  }
  function fileOf(s) { return HS ? root() + 'packages/' + ('00' + s).slice(-3) + '-package/' + encodeURIComponent(HS.files[s - 1]) : null; }

  // ---------------------------------------------------------------- the panel
  var sheet = null, shade = null, tab = 'rnd', body = null, lastFocus = null;
  function build() {
    shade = el('div', 'vshade'); shade.hidden = true;
    sheet = el('div', 'vsheet aids ui'); sheet.hidden = true; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true');
    sheet.innerHTML = '<h2 class="ad-h"></h2><div class="vseg ad-tabs"><button type="button" data-tab="rnd"></button><button type="button" data-tab="sim"></button>' +
      '<button type="button" data-tab="cards"></button></div><div class="ad-body"></div><button type="button" class="vdone ad-close"></button>';
    body = sheet.querySelector('.ad-body');
    document.body.appendChild(shade); document.body.appendChild(sheet);
    sheet.querySelector('.ad-tabs').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) show(b.getAttribute('data-tab')); });
    sheet.querySelector('.ad-close').addEventListener('click', close);
    shade.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet && !sheet.hidden) close(); });
  }
  function paintFrame() {
    sheet.setAttribute('dir', lang() === 'ar' ? 'rtl' : 'ltr');
    sheet.querySelector('.ad-h').textContent = T('title'); sheet.setAttribute('aria-label', T('title'));
    [].forEach.call(sheet.querySelectorAll('[data-tab]'), function (b) { b.textContent = T(b.getAttribute('data-tab')); b.setAttribute('aria-pressed', b.getAttribute('data-tab') === tab ? 'true' : 'false'); });
    sheet.querySelector('.ad-close').textContent = T('close');
  }
  function open(t) {
    if (!sheet) build();
    lastFocus = document.activeElement;
    shade.hidden = false; sheet.hidden = false;
    show(t || tab);
  }
  function close() { if (!sheet) return; sheet.hidden = true; shade.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  function show(t) {
    tab = t; paintFrame();
    body.innerHTML = '';
    if (t === 'rnd') rndTab(); else if (t === 'sim') simTab(); else cardsTab();
  }

  // ---------------------------------------------------------------- the scope (which surahs)
  var scope = { kind: W ? 'here' : 'all', from: 1, to: 114 };
  function scopeBox(onchange) {
    var g = el('div', 'vg');
    var l = el('span', 'vl', esc(T('scope'))); g.appendChild(l);
    var seg = el('div', 'vseg');
    [['here', W], ['amma', true], ['span', true], ['all', true]].forEach(function (k) {
      if (!k[1]) return;
      var b = el('button'); b.type = 'button'; b.setAttribute('data-sc', k[0]); b.textContent = T(k[0]); b.setAttribute('aria-pressed', scope.kind === k[0] ? 'true' : 'false'); seg.appendChild(b);
    });
    g.appendChild(seg);
    var sp = el('div', 'ad-span'); sp.hidden = scope.kind !== 'span';
    sp.innerHTML = '<label><span>' + esc(T('from')) + '</span> <input type="number" min="1" max="114" class="ad-from" value="' + scope.from + '"></label>' +
      '<label><span>' + esc(T('to')) + '</span> <input type="number" min="1" max="114" class="ad-to" value="' + scope.to + '"></label>';
    g.appendChild(sp);
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      scope.kind = b.getAttribute('data-sc');
      [].forEach.call(seg.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      sp.hidden = scope.kind !== 'span';
      onchange();
    });
    sp.addEventListener('change', function () {
      var f = Math.max(1, Math.min(114, +sp.querySelector('.ad-from').value || 1)), t = Math.max(1, Math.min(114, +sp.querySelector('.ad-to').value || 114));
      scope.from = Math.min(f, t); scope.to = Math.max(f, t); onchange();
    });
    return g;
  }
  function surahs() {
    if (scope.kind === 'here' && W) return [S];
    if (scope.kind === 'amma') { var o = []; for (var s = 67; s <= 114; s++) o.push(s); return o; }
    if (scope.kind === 'span') { var o2 = []; for (var s2 = scope.from; s2 <= scope.to; s2++) o2.push(s2); return o2; }
    var all = []; for (var s3 = 1; s3 <= 114; s3++) all.push(s3); return all;
  }

  // ---------------------------------------------------------------- random start
  var cur = null;        // {s, a, shown}
  function rndTab() {
    body.appendChild(scopeBox(function () { cur = null; paintRnd(); }));
    var p = el('p', 'ad-tip', esc(T('rndTip'))); body.appendChild(p);
    var card = el('div', 'ad-card rnd'); body.appendChild(card);
    var acts = el('div', 'vseg ad-acts'); body.appendChild(acts);
    paintRnd();
  }
  function draw() {
    var ss = surahs();
    engine(function (hs) {
      if (!hs && !(ss.length === 1 && ss[0] === S)) { cur = null; paintRnd(); return; }
      // weigh the surahs by their ayat, so every ayah is as likely as any other
      var tot = 0, cnt = ss.map(function (s) { var n = nAyat(s); tot += n; return n; });
      var k = rnd(tot), s = ss[0];
      for (var i = 0; i < ss.length; i++) { if (k < cnt[i]) { s = ss[i]; break; } k -= cnt[i]; }
      cur = { s: s, a: 1 + rnd(nAyat(s)), shown: false };
      paintRnd();
    });
  }
  function paintRnd() {
    var card = body.querySelector('.ad-card.rnd'), acts = body.querySelector('.ad-acts');
    if (!card) return;
    acts.innerHTML = '';
    if (!cur) {
      card.innerHTML = '';
      var b = el('button', 'vbtn on', esc(T('draw'))); b.type = 'button'; b.addEventListener('click', draw); acts.appendChild(b);
      return;
    }
    var t = text(cur.s, cur.a), ws = words(t), head = ws.slice(0, 3).join(' ');
    card.innerHTML = '<p class="ad-ref">' + esc(fmt(T('surah'), iso(sName(cur.s))) + ' · ' + fmt(T('ayah'), nm(cur.a))) + '</p>' +
      '<p class="ad-q quran">' + esc(head) + ' …</p>' + (cur.shown ? '<p class="ad-a quran">' + esc(t) + ' <span class="aya">﴿' + nm(cur.a) + '﴾</span></p>' : '');
    var b1 = el('button', 'vbtn' + (cur.shown ? '' : ' on'), esc(T(cur.shown ? 'next' : 'reveal'))); b1.type = 'button';
    b1.addEventListener('click', function () {
      if (!cur.shown) { cur.shown = true; paintRnd(); return; }
      if (cur.a >= nAyat(cur.s)) { card.insertAdjacentHTML('beforeend', '<p class="ad-tip">' + esc(T('end')) + '</p>'); return; }
      cur = { s: cur.s, a: cur.a + 1, shown: false }; paintRnd();
    });
    acts.appendChild(b1);
    var b2 = el('button', 'vbtn', esc(T('again'))); b2.type = 'button'; b2.addEventListener('click', draw); acts.appendChild(b2);
    var f = fileOf(cur.s) || (W && cur.s === S ? '' : null);
    if (f !== null) {
      var a = el('a', 'vbtn', esc(T('open'))); a.href = (f || '') + '#a=' + cur.s + ':' + cur.a;
      if (cur.s === S && W) a.addEventListener('click', function () { close(); });
      acts.appendChild(a);
    }
  }

  // ---------------------------------------------------------------- look-alikes
  var simPool = null, simQ = null, simScore = [0, 0];
  function simTab() {
    var tip = el('p', 'ad-tip'); body.appendChild(tip);
    var card = el('div', 'ad-card sim'); body.appendChild(card);
    var acts = el('div', 'vseg ad-acts'); body.appendChild(acts);
    if (!W) { tip.textContent = T('simHome'); return; }
    tip.textContent = T('simTip');
    if (!simPool) {
      simPool = [];
      for (var a = 1; a <= D.n; a++) if (D.m && D.m[String(a)] && D.m[String(a)].length) simPool.push(a);
    }
    if (!simPool.length) { tip.textContent = T('noSim'); return; }
    engine(function (hs) { if (!hs) { tip.textContent = T('noDeck'); return; } pick(); });
  }
  function longestRun(w1, w2) {            // the longest run of words the two share: [start in w1, start in w2, length]
    var n1 = w1.map(norm), n2 = w2.map(norm), best = [0, 0, 0], prev = [], i, j;
    for (i = 0; i <= n1.length; i++) {
      var row = [];
      for (j = 0; j <= n2.length; j++) {
        var v = i && j && n1[i - 1] === n2[j - 1] ? (prev[j - 1] || 0) + 1 : 0;
        row.push(v);
        if (v > best[2]) best = [i - v, j - v, v];
      }
      prev = row;
    }
    return best;
  }
  function pick() {
    var tries = 0, best = null;
    while (tries++ < 60 && !best) {
      var a = simPool[rnd(simPool.length)], own = words(text(S, a));
      var cands = D.m[String(a)].filter(function (e) { return e[0] !== 'e'; });
      cands.forEach(function (e) {
        var ws = words(text(e[1], e[2]));
        if (!ws.length) return;
        var r = longestRun(own, ws);
        if (r[2] < 2) return;
        var after = [own.slice(r[0] + r[2], r[0] + r[2] + 4).join(' '), ws.slice(r[1] + r[2], r[1] + r[2] + 4).join(' ')];
        var before = [own.slice(Math.max(0, r[0] - 4), r[0]).join(' '), ws.slice(Math.max(0, r[1] - 4), r[1]).join(' ')];
        var mode = norm(after[0]) !== norm(after[1]) ? 'after' : norm(before[0]) !== norm(before[1]) ? 'before' : null;
        if (!mode) return;
        if (!best || r[2] > best.k) best = { a: a, own: own, k: r[2], run: own.slice(r[0], r[0] + r[2]).join(' '), mode: mode,
          mine: (mode === 'after' ? after[0] : before[0]), theirs: (mode === 'after' ? after[1] : before[1]), s2: e[1], a2: e[2] };
      });
    }
    if (!best) { body.querySelector('.ad-tip').textContent = T('noSim'); return; }
    var mine = best.mine || T(best.mode === 'after' ? 'eoa' : 'soa'), theirs = best.theirs || T(best.mode === 'after' ? 'eoa' : 'soa');
    simQ = { a: best.a, head: best.run, mode: best.mode, right: mine, wrong: theirs, s2: best.s2, a2: best.a2, opts: shuffle([{ t: mine, ok: true }, { t: theirs, ok: false }]), done: false };
    paintSim();
  }
  function paintSim() {
    var card = body.querySelector('.ad-card.sim'), acts = body.querySelector('.ad-acts');
    if (!card || !simQ) return;
    var q = simQ, tip0 = body.querySelector('.ad-tip');
    if (tip0) tip0.textContent = '';
    card.innerHTML = '<p class="ad-ref">' + esc(T(q.mode === 'after' ? 'simTip' : 'simTipB')) + '</p><p class="ad-q quran">' + esc(fmt(T(q.mode === 'after' ? 'simQ' : 'simQB'), nm(q.a), q.head)) + '</p><p class="ad-ref">' + esc(T(q.mode === 'after' ? 'which' : 'whichB')) + '</p>';
    var og = el('div', 'ad-opts');
    q.opts.forEach(function (o, i) {
      var b = el('button', 'vbtn quran', esc(o.t)); b.type = 'button'; b.setAttribute('data-i', i);
      if (q.done) { b.disabled = true; if (o.ok) b.classList.add('ok'); else if (q.chosen === i) b.classList.add('bad'); }
      b.addEventListener('click', function () {
        if (q.done) return;
        q.done = true; q.chosen = i; simScore[1]++; if (o.ok) simScore[0]++;
        paintSim();
      });
      og.appendChild(b);
    });
    card.appendChild(og);
    if (q.done) {
      var ok = q.opts[q.chosen].ok, whereT = fmt(T('where'), iso(sName(q.s2)), nm(q.a2));
      card.appendChild(el('p', 'ad-res ' + (ok ? 'ok' : 'bad'), esc(ok ? T('right') : fmt(T('wrong'), whereT))));
      card.appendChild(el('p', 'ad-ref', esc(fmt(T('twin'), whereT))));
      card.appendChild(el('p', 'ad-ref', esc(fmt(T('score'), nm(simScore[0]), nm(simScore[1])))));
    }
    acts.innerHTML = '';
    var b2 = el('button', 'vbtn on', esc(T('simNext'))); b2.type = 'button'; b2.addEventListener('click', pick); acts.appendChild(b2);
    if (q.done) {
      var f = fileOf(q.s2);
      if (f) { var l = el('a', 'vbtn', esc(T('open'))); l.href = (q.s2 === S ? '' : f) + '#a=' + q.s2 + ':' + q.a2; acts.appendChild(l); }
    }
  }

  // ---------------------------------------------------------------- seam cards
  var DECK = null, deckWait = [], cards = null, ci = 0, flipped = false, reverse = false, known = 0;
  function deck(cb) {
    if (DECK) return cb(DECK);
    deckWait.push(cb);
    if (deckWait.length > 1) return;
    var x = new XMLHttpRequest();
    x.open('GET', root() + 'deck.json');
    x.onload = x.onerror = function () {
      try { DECK = x.status === 200 ? JSON.parse(x.responseText) : null; } catch (e) { DECK = null; }
      var w = deckWait; deckWait = []; w.forEach(function (f) { f(DECK); });
    };
    x.send();
  }
  function cardsTab() {
    body.appendChild(scopeBox(function () { cards = null; startCards(); }));
    var tip = el('p', 'ad-tip', esc(T('cardTip'))); body.appendChild(tip);
    var rv = el('div', 'vrow'); rv.innerHTML = '<span>' + esc(T('reverse')) + '</span><button type="button" class="vsw" role="switch" aria-pressed="' + (reverse ? 'true' : 'false') + '"></button>';
    rv.querySelector('.vsw').addEventListener('click', function () { reverse = !reverse; this.setAttribute('aria-pressed', reverse ? 'true' : 'false'); flipped = false; paintCards(); });
    body.appendChild(rv);
    var card = el('div', 'ad-card cards'); body.appendChild(card);
    var acts = el('div', 'vseg ad-acts'); body.appendChild(acts);
    startCards();
  }
  function startCards() {
    deck(function (d) {
      if (!d) { cards = []; paintCards(); return; }
      cards = [];
      surahs().forEach(function (s) { (d.s[String(s)] || []).forEach(function (c) { cards.push({ s: s, id: c[0], a1: c[2], title: c[3], last: c[4], clue: c[5], n: (d.s[String(s)] || []).length }); }); });
      shuffle(cards); ci = 0; flipped = false; known = 0;
      paintCards();
    });
  }
  function paintCards() {
    var card = body.querySelector('.ad-card.cards'), acts = body.querySelector('.ad-acts');
    if (!card) return;
    acts.innerHTML = '';
    if (!cards) { card.innerHTML = ''; return; }
    if (!DECK) { card.innerHTML = '<p class="ad-tip">' + esc(T('noDeck')) + '</p>'; return; }
    if (ci >= cards.length) {
      card.innerHTML = '<p class="ad-res">' + esc(fmt(T('done'), nm(known), nm(cards.length))) + '</p>';
      var b0 = el('button', 'vbtn on', esc(T('shuffle'))); b0.type = 'button'; b0.addEventListener('click', startCards); acts.appendChild(b0);
      return;
    }
    var c = cards[ci], nextId = c.id < c.n ? c.id + 1 : 1, nextLabel = c.id < c.n ? fmt(T('back'), nm(nextId)) : T('nextS');
    // the segment's title only when the titles are switched on (app/view.js, 2026-11-21)
    var endL = document.documentElement.hasAttribute('data-notitles') ? fmt(T('frontN'), nm(c.id)) : fmt(T('front'), nm(c.id), c.title);
    var frontT = reverse ? nextLabel : endL, frontW = reverse ? c.clue : c.last;
    var backT = reverse ? endL : nextLabel, backW = reverse ? c.last : c.clue;
    card.innerHTML = '<p class="ad-ref">' + esc(fmt(T('ofS'), iso(sName(c.s) || ''), nm(c.id), nm(c.n))) + ' · ' + esc(fmt(T('left'), nm(cards.length - ci))) + '</p>' +
      '<p class="ad-ref">' + esc(frontT) + '</p><p class="ad-q quran">' + esc(frontW) + '</p>' +
      (flipped ? '<p class="ad-ref">' + esc(backT) + '</p><p class="ad-a quran">' + esc(backW) + '</p>' : '');
    if (!flipped) {
      var b = el('button', 'vbtn on', esc(T('flip'))); b.type = 'button'; b.addEventListener('click', function () { flipped = true; paintCards(); }); acts.appendChild(b);
    } else {
      var k = el('button', 'vbtn ok', esc(T('knew'))); k.type = 'button'; k.addEventListener('click', function () { known++; ci++; flipped = false; paintCards(); }); acts.appendChild(k);
      var m = el('button', 'vbtn bad', esc(T('missed'))); m.type = 'button'; m.addEventListener('click', function () { cards.push(cards[ci]); ci++; flipped = false; paintCards(); }); acts.appendChild(m);
    }
    var sh = el('button', 'vbtn', esc(T('shuffle'))); sh.type = 'button'; sh.addEventListener('click', startCards); acts.appendChild(sh);
  }

  // ---------------------------------------------------------------- the buttons
  function button() {
    var nav = document.querySelector('.tools .hnav'), home = document.querySelector('.home .hero .actions');
    var b = el('button', nav ? 'hn-dr' : 'btn ad-open'); b.type = 'button';
    b.innerHTML = '<span class="hn-ri" aria-hidden="true">🎯</span><span class="hn-rt"></span>';
    function lab() { b.querySelector('.hn-rt').textContent = T('title'); b.title = T('title'); b.setAttribute('aria-label', T('title')); }
    lab();
    b.addEventListener('click', function () { open(); });
    if (nav) { var rd = nav.querySelector('.hn-rd'); nav.insertBefore(b, rd ? rd.nextSibling : nav.firstChild); }
    else if (home) home.appendChild(b);
    if (window.hifzUI) window.hifzUI.on(function () { lab(); if (sheet && !sheet.hidden) show(tab); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', button); else button();
  window.HifzAids = { open: open, close: close, draw: draw, pick: pick, deck: deck, scope: scope, cur: function () { return cur; }, q: function () { return simQ; },
    cards: function () { return { cards: cards, i: ci, flipped: flipped, known: known }; } };
})();
