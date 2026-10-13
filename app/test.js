/* Hifz web app: test mode of a surah file (mode 'web' of tools/make_book.py), 2026-10-12, at the
   learner's request: "worksheets for every segment to test my memorization with clues to help me
   remember when I am stuck".
   - Test (on every segment's row) hides the segment's text: the ayah numbers stay, every word
     keeps its place as a blank.  Clues, from the least to the most: the first letter of every
     word; the first word of every ayah; a tap on a blank shows that word; "Next word" shows the
     next one; a tap on an ayah number shows the whole ayah.  Everything shown comes from the
     page's own text (app/words.js); nothing is typed.
   - A word or ayah shown by a tap or by "Next word" marks its ayah as a slip (kept on this
     device, localStorage "hifz-slips"): a red dot on its number, and the practice panel drills
     the slips (app/player.js).  The recitation check (app/recite.js) marks the words it missed.
   - Look-alikes: in test mode, an ayah that has look-alikes in this surah or elsewhere (data "eg"
     and "m" of tools/app_data.py, from tools/repeats.py) carries ⚠; a tap lists them, with links.
   - Worksheet: prints the segment with the first letters as clues, on its own page.
   window.HifzTest = {active(), slips(), clearSlips(), slip(a), reveal(el)}.
   Interface text in three languages, following the switch of tools/ui.py (window.hifzUI). */
(function () {
  'use strict';
  var W = window.HifzWords;
  if (!W) return;
  var D = W.D, S = D.s, de = document.documentElement;
  var TX = {
    ar: { hidden: 'مخفي', letters: 'الحرف الأول', firsts: 'أول كل آية', all: 'أظهر الكل', nextw: 'الكلمة التالية', exit: 'إنهاء الاختبار',
      recite: 'سمّع بصوتك', record: 'سجّل تلاوتك', sheet: 'ورقة عمل', tip: 'المس فراغاً لتظهر كلمته، أو رقم الآية لتظهر الآية كلها.',
      simT: 'ما يشبه الآية {0}', inSurah: 'تتكرر في هذه السورة {0} مرة: الآيات {1}', e: 'مطابقة', n: 'متشابهة', c: 'عبارة مشتركة',
      where: 'سورة {0} {1}', here: 'هذه السورة', close: 'إغلاق', simB: 'لها شبيه: المس لترى', ws: 'ورقة عمل — {0} — المقطع {1}', slip: 'تعثّرت هنا' },
    en: { hidden: 'Hidden', letters: 'First letters', firsts: 'First words', all: 'Show all', nextw: 'Next word', exit: 'End the test',
      recite: 'Recite aloud', record: 'Record yourself', sheet: 'Worksheet', tip: 'Tap a blank to show its word, or an ayah number to show the whole ayah.',
      simT: 'Look-alikes of ayah {0}', inSurah: 'Repeated {0} times in this surah: ayat {1}', e: 'identical', n: 'similar', c: 'shared phrase',
      where: 'Surah {0} {1}', here: 'this surah', close: 'Close', simB: 'Has look-alikes: tap to see', ws: 'Worksheet — {0} — segment {1}', slip: 'Slipped here' },
    es: { hidden: 'Oculto', letters: 'Primeras letras', firsts: 'Primeras palabras', all: 'Mostrar todo', nextw: 'Palabra siguiente', exit: 'Terminar la prueba',
      recite: 'Recitar en voz alta', record: 'Grabarse', sheet: 'Hoja de trabajo', tip: 'Toque un hueco para ver su palabra, o un número de aleya para ver la aleya entera.',
      simT: 'Aleyas parecidas a la {0}', inSurah: 'Se repite {0} veces en esta sura: aleyas {1}', e: 'idéntica', n: 'parecida', c: 'expresión compartida',
      where: 'Sura {0} {1}', here: 'esta sura', close: 'Cerrar', simB: 'Tiene aleyas parecidas: toque para verlas', ws: 'Hoja de trabajo — {0} — segmento {1}', slip: 'Tropecé aquí' }
  };
  function lang() { var u = de.getAttribute('data-ui'); return u === 'en' || u === 'es' ? u : 'ar'; }
  function T(k) { return TX[lang()][k]; }
  function nm(n) { return lang() === 'ar' ? String(n).replace(/[0-9]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.charAt(+d); }) : String(n); }
  function fmt(s) { var a = arguments; return String(s).replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1]; }); }

  // ---- slips ----
  var SK = 'hifz-slips';
  function readSlips() { try { return JSON.parse(localStorage.getItem(SK) || '{}') || {}; } catch (e) { return {}; } }
  function slip(a) {
    var o = readSlips(), k = S + ':' + a;
    o[k] = (o[k] || 0) + 1;
    try { localStorage.setItem(SK, JSON.stringify(o)); } catch (e) {}
    dot(a);
  }
  function slips() {
    var o = readSlips(), out = [];
    for (var k in o) { var m = /^(\d+):(\d+)$/.exec(k); if (m && +m[1] === S && o[k] > 0) out.push(+m[2]); }
    return out.sort(function (x, y) { return x - y; });
  }
  function clearSlips() {
    var o = readSlips();
    for (var k in o) if (k.indexOf(S + ':') === 0) delete o[k];
    try { localStorage.setItem(SK, JSON.stringify(o)); } catch (e) {}
    [].forEach.call(document.querySelectorAll('.quran .aya.slip'), function (m) { m.classList.remove('slip'); });
  }
  function dot(a) { var m = W.marker(a); if (m) { m.classList.add('slip'); m.setAttribute('data-slip', T('slip')); } }
  slips().forEach(dot);

  // ---- first-letter clues ----
  var LET = /[ء-يٱ]/, MARK = /[ؐ-ًؚ-ٰٟۖ-ۭ]/;
  var NOJOIN = 'اأإآٱدذرزوؤءةى';
  function clue(w) {
    var t = w.textContent, i = 0, out = '';
    while (i < t.length && !LET.test(t.charAt(i))) i++;
    if (i >= t.length) return '';
    var c = t.charAt(i); out = c; i++;
    while (i < t.length && MARK.test(t.charAt(i))) { out += t.charAt(i); i++; }
    var rest = t.slice(i).replace(/[^ء-يٱ]/g, '');
    if (rest && NOJOIN.indexOf(c) < 0) out += 'ـ';
    return out;
  }

  // ---- test mode of a segment ----
  var on = {};
  function words(sec) { return [].slice.call(sec.querySelectorAll('.quran .wd')); }
  function setMode(sec, mode) {
    sec.classList.remove('h-hidden', 'h-letters', 'h-firsts');
    sec.classList.add('h-' + mode);
    sec.setAttribute('data-hint', mode);
    [].forEach.call(sec.querySelectorAll('.tb-mode'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-m') === mode ? 'true' : 'false'); });
  }
  function bar(sec) {
    var b = document.createElement('div');
    b.className = 'tbar ui';
    b.innerHTML = '<div class="tb-row"><span class="vseg tb-modes">' +
      '<button type="button" class="tb-mode" data-m="hidden"></button><button type="button" class="tb-mode" data-m="letters"></button>' +
      '<button type="button" class="tb-mode" data-m="firsts"></button></span>' +
      '<button type="button" class="tb-b" data-t="nextw"></button><button type="button" class="tb-b" data-t="all"></button></div>' +
      '<div class="tb-row"><button type="button" class="tb-b tb-recite" data-t="recite"></button>' +
      '<button type="button" class="tb-b tb-record" data-t="record"></button><button type="button" class="tb-b" data-t="sheet"></button>' +
      '<button type="button" class="tb-b tb-exit" data-t="exit"></button></div>' +
      '<p class="tb-tip"></p><div class="tb-live" hidden></div><div class="tb-rec" hidden></div>';
    return b;
  }
  function paintBar(sec) {
    var b = sec.querySelector('.tbar'); if (!b) return;
    b.setAttribute('dir', lang() === 'ar' ? 'rtl' : 'ltr');
    [].forEach.call(b.querySelectorAll('.tb-mode'), function (x) { x.textContent = T(x.getAttribute('data-m')); });
    [].forEach.call(b.querySelectorAll('[data-t]'), function (x) { if (!x.classList.contains('busy')) x.textContent = T(x.getAttribute('data-t')); });
    b.querySelector('.tb-tip').textContent = T('tip');
    if (!window.HifzRecite || !window.HifzRecite.canListen()) b.querySelector('.tb-recite').hidden = true;
    if (!window.HifzRecite || !window.HifzRecite.canRecord()) b.querySelector('.tb-record').hidden = true;
  }
  function badges(sec, show) {
    [].forEach.call(sec.querySelectorAll('.simb'), function (x) { x.parentNode.removeChild(x); });
    if (!show) return;
    [].forEach.call(sec.querySelectorAll('.quran .aya[data-ref]'), function (m) {
      var a = +m.getAttribute('data-ref').split(':')[1];
      if (!sims(a).count) return;
      var s = document.createElement('span');
      s.className = 'simb'; s.setAttribute('data-a', a); s.setAttribute('role', 'button'); s.setAttribute('tabindex', '0');
      s.setAttribute('aria-label', T('simB')); s.title = T('simB');
      m.parentNode.insertBefore(s, m.nextSibling);
    });
  }
  function enter(sec) {
    if (on[sec.id]) return;
    on[sec.id] = true;
    words(sec).forEach(function (w) { if (!w.hasAttribute('data-h')) w.setAttribute('data-h', clue(w)); w.classList.remove('shown', 'help', 'ok', 'miss'); });
    sec.classList.add('testing');
    var h = sec.querySelector('.quran');
    var b = bar(sec); h.parentNode.insertBefore(b, h);
    paintBar(sec); setMode(sec, 'hidden'); badges(sec, true);
    var t = sec.querySelector('.player .tst'); if (t) t.setAttribute('aria-pressed', 'true');
    if (window.HifzAwake) window.HifzAwake(true);
    if (window.HifzPlayer) { var st = window.HifzPlayer.state(); if (st.running && !st.paused) window.HifzPlayer.toggle(); }
  }
  function leave(sec) {
    if (!on[sec.id]) return;
    delete on[sec.id];
    if (window.HifzRecite) window.HifzRecite.stop(sec);
    sec.classList.remove('testing', 'h-hidden', 'h-letters', 'h-firsts');
    words(sec).forEach(function (w) { w.classList.remove('shown', 'help', 'ok', 'miss'); });
    var b = sec.querySelector('.tbar'); if (b) b.parentNode.removeChild(b);
    badges(sec, false);
    var t = sec.querySelector('.player .tst'); if (t) t.setAttribute('aria-pressed', 'false');
    if (window.HifzAwake && !active()) window.HifzAwake(false);
  }
  function active() { for (var k in on) if (on[k]) return true; return false; }
  function reveal(w, help) {
    if (!w || w.classList.contains('shown')) return;
    w.classList.add('shown');
    if (help) { w.classList.add('help'); var a = +w.getAttribute('data-a'); if (a) slip(a); }
  }
  function nextWord(sec) {
    var ws = words(sec);
    for (var i = 0; i < ws.length; i++) {
      if (ws[i].classList.contains('shown') || ws[i].classList.contains('wm')) continue;
      if (sec.classList.contains('h-firsts') && ws[i].getAttribute('data-i') === '1') continue;
      reveal(ws[i], true);
      try { ws[i].scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
      return;
    }
  }

  // ---- look-alikes ----
  function sims(a) {
    var g = null;
    (D.eg || []).forEach(function (x) { if (x.indexOf(a) >= 0) g = x; });
    var m = (D.m && D.m[String(a)]) || [];
    return { group: g, list: m, count: (g ? g.length - 1 : 0) + m.length };
  }
  var pop = null;
  function showSims(a, anchor) {
    if (!pop) {
      pop = document.createElement('div'); pop.className = 'vpop simpop ui'; pop.hidden = true; pop.setAttribute('role', 'dialog');
      document.body.appendChild(pop);
      document.addEventListener('click', function (e) { if (!pop.hidden && !pop.contains(e.target) && !e.target.closest('.simb')) pop.hidden = true; });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pop && !pop.hidden) pop.hidden = true; });
    }
    var s = sims(a), h = '<h2 style="margin:0 0 .4rem;font-size:1.05em">' + esc(fmt(T('simT'), nm(a))) + '</h2>';
    if (s.group) h += '<p>' + esc(fmt(T('inSurah'), nm(s.group.length), s.group.map(nm).join(lang() === 'ar' ? '، ' : ', '))) + '</p>';
    if (s.list.length) {
      h += '<ul class="simlist">';
      s.list.forEach(function (e) {
        var same = e[1] === S, ref = nm(e[1]) + ':' + nm(e[2]);
        var href = same ? '#a=' + S + ':' + e[2] : (D.bk && D.bk[String(e[1])] ? '../' + ('00' + e[1]).slice(-3) + '-package/' + encodeURI(D.bk[String(e[1])]) + '#a=' + e[1] + ':' + e[2] : '');
        h += '<li><span class="simk simk-' + e[0] + '">' + esc(T(e[0])) + '</span> ' +
          (href ? '<a href="' + href + '" data-same="' + (same ? e[2] : '') + '">' + esc(same ? T('here') + ' ' + ref : ref) + '</a>' : esc(ref)) + '</li>';
      });
      h += '</ul>';
    }
    h += '<button type="button" class="vbtn simx">' + esc(T('close')) + '</button>';
    pop.innerHTML = h;
    pop.setAttribute('dir', lang() === 'ar' ? 'rtl' : 'ltr');
    pop.hidden = false;
    pop.querySelector('.simx').addEventListener('click', function () { pop.hidden = true; });
    [].forEach.call(pop.querySelectorAll('a[data-same]'), function (l) {
      if (!l.getAttribute('data-same')) return;
      l.addEventListener('click', function (e) {
        e.preventDefault(); pop.hidden = true;
        var m = W.marker(+l.getAttribute('data-same'));
        if (m) { try { m.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) { m.scrollIntoView(); } m.classList.add('flash'); setTimeout(function () { m.classList.remove('flash'); }, 2200); }
      });
    });
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---- worksheet ----
  function worksheet(sec) {
    var was = sec.getAttribute('data-hint') || 'hidden';
    setMode(sec, 'letters');
    words(sec).forEach(function (w) { w.classList.remove('shown', 'help', 'ok', 'miss'); });
    var id = +sec.id.slice(1), title = (document.querySelector('.idx h1') || {}).textContent || '';
    sec.setAttribute('data-ws', fmt(T('ws'), title.trim(), nm(id)));
    de.classList.add('ws-print'); sec.classList.add('ws-target');
    function done() {
      de.classList.remove('ws-print'); sec.classList.remove('ws-target'); setMode(sec, was);
      window.removeEventListener('afterprint', done);
    }
    window.addEventListener('afterprint', done);
    setTimeout(function () { window.print(); setTimeout(function () { if (de.classList.contains('ws-print') && !window.matchMedia('print').matches) done(); }, 1500); }, 50);
  }

  // ---- events ----
  document.addEventListener('click', function (e) {
    var t = e.target;
    var tb = t.closest && t.closest('section.seg .player .tst');
    if (tb) { e.preventDefault(); var sec0 = tb.closest('section'); if (on[sec0.id]) leave(sec0); else enter(sec0); return; }
    var sec = t.closest && t.closest('section.seg.testing');
    if (!sec) return;
    var b = t.closest('.tbar button');
    if (b) {
      if (b.classList.contains('tb-mode')) setMode(sec, b.getAttribute('data-m'));
      else if (b.getAttribute('data-t') === 'nextw') nextWord(sec);
      else if (b.getAttribute('data-t') === 'all') words(sec).forEach(function (w) { w.classList.add('shown'); });
      else if (b.getAttribute('data-t') === 'exit') leave(sec);
      else if (b.getAttribute('data-t') === 'sheet') worksheet(sec);
      else if (b.getAttribute('data-t') === 'recite' && window.HifzRecite) window.HifzRecite.toggle(sec, b);
      else if (b.getAttribute('data-t') === 'record' && window.HifzRecite) window.HifzRecite.record(sec, b);
      return;
    }
    var sb = t.closest('.simb');
    if (sb) { e.preventDefault(); e.stopPropagation(); showSims(+sb.getAttribute('data-a'), sb); return; }
    var w = t.closest('.quran .wd');
    if (w) { reveal(w, true); return; }
  });
  // an ayah number in test mode shows its ayah (and does not open the reference panel)
  document.addEventListener('click', function (e) {
    var m = e.target.closest && e.target.closest('section.seg.testing .quran .aya[data-ref]');
    if (!m) return;
    e.preventDefault(); e.stopPropagation();
    var a = +m.getAttribute('data-ref').split(':')[1], any = false;
    W.words(a).forEach(function (w) { if (!w.classList.contains('shown') && !w.classList.contains('wm')) { any = true; reveal(w, false); w.classList.add('help'); } });
    if (any) slip(a);
  }, true);
  document.addEventListener('keydown', function (e) {
    var s = e.target.closest && e.target.closest('.simb');
    if (s && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); showSims(+s.getAttribute('data-a'), s); }
  });
  if (window.hifzUI) window.hifzUI.on(function () {
    for (var k in on) { var s = document.getElementById(k); if (s) { paintBar(s); badges(s, true); } }
    [].forEach.call(document.querySelectorAll('.quran .aya.slip'), function (m) { m.setAttribute('data-slip', T('slip')); });
  });
  window.HifzTest = { active: active, slips: slips, clearSlips: clearSlips, slip: slip, reveal: reveal, enter: enter, leave: leave,
    clue: clue, setMode: setMode, paint: paintBar };
})();
