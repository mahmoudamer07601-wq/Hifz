/* Hifz web app: the Mushaf (mushaf.html, tools/make_app.py), 2026-10-12, at the learner's request:
   a "go to page" that opens the Mushaf already in the app, every page marked right or left as in
   his printed copy.
   - The scans of his Tajweed Mushaf (Dār al-Maʿrifah, from the reference source shown as "scan"),
     one page, or two facing pages on a wide screen: the odd page on the right and the even one
     on the left, as in print (al-Fātiḥa, page 1, is on the right).
   - The page box, the arrows, a swipe (towards the right = the next page, as a page is turned in
     an Arabic book) or the keyboard (← next, → previous); the address keeps the page (#p=N) and
     the device remembers the last one (localStorage "hifz-mushaf-page").
   - "Dark page" shows the scan inverted (light text on a dark page, colours kept), on by itself in
     the night and black modes of the display settings (app/view.js).
   - "Open the text" opens the page's first ayah in its surah file.
   - The juzʾ arrows "→ الجزء N ←" (2026-10-31, at the learner's request: "jump from juz' to juz' by arrows"): the
     first page of the previous and the next juzʾ (data "jz": [surah, ayah, page] of the 30 starts); the label
     goes to the first page of the juzʾ shown, which is the last juzʾ starting on this page or before it.
   Interface text in three languages, following the switch of tools/ui.py (window.hifzUI). */
(function () {
  'use strict';
  var node = document.getElementById('mushaf-data');
  if (!node) return;
  var D = JSON.parse(node.textContent), NP = D.pages.length, de = document.documentElement;
  var TX = {
    ar: { info: 'سورة {0} · الجزء {1} · الحزب {2}', pg: 'ص {0} · {1}', R: 'يمين', L: 'يسار', err: 'تعذّر تحميل صفحة {0}: لا اتصال؟', q: ['', '¼', '½', '¾'],
      j: 'الجزء', jPrev: 'الجزء السابق: {0}، أوله {1} {2} (ص {3})', jNext: 'الجزء التالي: {0}، أوله {1} {2} (ص {3})', jTop: 'أول الجزء {0}: {1} {2} (ص {3})',
      jNo0: 'لا جزء قبله', jNo1: 'لا جزء بعده' },
    en: { info: 'Surah {0} · Juzʾ {1} · Ḥizb {2}', pg: 'p. {0} · {1}', R: 'right', L: 'left', err: "Page {0} couldn't load: offline?", q: ['', '¼', '½', '¾'],
      j: 'Juzʾ', jPrev: 'Previous juzʾ: {0}, from {1} {2} (p. {3})', jNext: 'Next juzʾ: {0}, from {1} {2} (p. {3})', jTop: 'Start of juzʾ {0}: {1} {2} (p. {3})',
      jNo0: 'No juzʾ before this one', jNo1: 'No juzʾ after this one' },
    es: { info: 'Sura {0} · Yuz {1} · Ḥizb {2}', pg: 'pág. {0} · {1}', R: 'derecha', L: 'izquierda', err: 'No se pudo cargar la página {0}: ¿sin conexión?', q: ['', '¼', '½', '¾'],
      j: 'Yuz', jPrev: 'Yuz anterior: {0}, desde {1} {2} (pág. {3})', jNext: 'Yuz siguiente: {0}, desde {1} {2} (pág. {3})', jTop: 'Inicio del yuz {0}: {1} {2} (pág. {3})',
      jNo0: 'No hay yuz antes de este', jNo1: 'No hay yuz después de este' }
  };
  function lang() { var u = de.getAttribute('data-ui'); return u === 'en' || u === 'es' ? u : 'ar'; }
  function T(k) { return TX[lang()][k]; }
  function nm(n) { return lang() === 'ar' ? String(n).replace(/[0-9]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.charAt(+d); }) : String(n); }
  function fmt(s) { var a = arguments; return String(s).replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1]; }); }
  function side(p) { return p % 2 ? 'R' : 'L'; }
  function url(p) { return D.url.replace('{page-1}', String(p - 1)).replace('{page}', String(p)); }
  var MK = 'hifz-mushaf';
  var opt = { two: 'auto', dark: 'auto' };
  try { var o = JSON.parse(localStorage.getItem(MK) || '{}'); if (o.two) opt.two = o.two; if (o.dark) opt.dark = o.dark; } catch (e) {}
  function saveOpt() { try { localStorage.setItem(MK, JSON.stringify(opt)); } catch (e) {} }
  var wide = window.matchMedia ? window.matchMedia('(min-width: 900px) and (min-aspect-ratio: 5/4)') : null;
  function two() { return opt.two === 'on' || (opt.two === 'auto' && !!(wide && wide.matches)); }
  function dark() { var t = de.getAttribute('data-theme'); return opt.dark === 'on' || (opt.dark === 'auto' && (t === 'night' || t === 'black')); }

  var p = 0, m = /[#&]p=(\d+)/.exec(location.hash);
  if (m) p = +m[1];
  if (!p) { try { p = +localStorage.getItem('hifz-mushaf-page') || 1; } catch (e) { p = 1; } }
  p = Math.max(1, Math.min(NP, p));

  var spread = document.querySelector('.spread'), inp = document.querySelector('.mb-p'), info = document.querySelector('.mb-info');
  var bTwo = document.querySelector('.mb-two'), bDark = document.querySelector('.mb-dark'), bText = document.querySelector('.mb-text');
  var bPrev = document.querySelector('.mb-prev'), bNext = document.querySelector('.mb-next');
  // the juzʾ arrows (2026-10-31): the juzʾ of a page is the last one that starts on it or before it, so that a page
  // where a juzʾ begins half-way down counts as that juzʾ and ← always moves on
  var JZ = D.jz || [], jg = document.querySelector('.mb-juz');
  var jP = jg && jg.querySelector('.hn-p'), jL = jg && jg.querySelector('.hn-l'), jN = jg && jg.querySelector('.hn-x');
  if (jg) [jP, jL, jN].forEach(function (b) { b.removeAttribute('data-i18n-attr'); });
  function iso(t) { return lang() === 'ar' ? t : '\u2068' + t + '\u2069'; }
  function juzOfPage(q) { var j = 1; for (var i = 0; i < JZ.length; i++) if (JZ[i][2] <= q) j = i + 1; return j; }
  function jt(t, j) { var e = JZ[j - 1]; return fmt(T(t), nm(j), iso(D.names[String(e[0])] || ''), nm(e[1]), nm(e[2])); }
  function paintJuz() {
    if (!jg || JZ.length !== 30) return;
    var j = juzOfPage(p);
    jL.querySelector('.hn-c').textContent = T('j');
    jL.querySelector('.hn-v').textContent = nm(j);
    jP.disabled = j <= 1; jN.disabled = j >= 30;
    [[jP, j > 1 ? jt('jPrev', j - 1) : T('jNo0')], [jL, jt('jTop', j)], [jN, j < 30 ? jt('jNext', j + 1) : T('jNo1')]].forEach(function (x) {
      x[0].title = x[1]; x[0].setAttribute('aria-label', x[1]);
    });
  }

  function shown() {
    if (!two()) return [p];
    var a = p % 2 ? p : p - 1, out = [];
    if (a >= 1) out.push(a);
    if (a + 1 <= NP) out.push(a + 1);
    return out;            // odd first: in the right-to-left spread it stands on the right
  }
  function render() {
    var ps = shown();
    spread.innerHTML = '';
    spread.classList.toggle('two', ps.length > 1 || two());
    spread.classList.toggle('dark', dark());
    ps.forEach(function (q) {
      var f = document.createElement('figure');
      f.className = 'pg'; f.setAttribute('data-side', side(q)); f.setAttribute('data-p', q);
      if (q === p) f.classList.add('cur');
      var img = new Image();
      img.alt = fmt(T('pg'), nm(q), T(side(q)));
      img.decoding = 'async';
      img.onerror = function () { f.classList.add('err'); f.setAttribute('data-err', fmt(T('err'), nm(q))); };
      img.onload = function () { f.classList.add('ok'); };
      img.src = url(q);
      var c = document.createElement('figcaption');
      c.textContent = fmt(T('pg'), nm(q), T(side(q)));
      f.appendChild(img); f.appendChild(c);
      f.addEventListener('click', function () { if (q !== p) { p = q; paint(); } });
      spread.appendChild(f);
    });
    paint();
    [p - 2, p - 1, p + 1, p + 2, p + 3].forEach(function (q) { if (q >= 1 && q <= NP) { var i = new Image(); i.src = url(q); } });
  }
  function paint() {
    var e = D.pages[p - 1], s = e[0], a = e[1], juz = e[4], qu = e[5];
    var hz = Math.ceil(qu / 4), part = (qu - 1) % 4;
    info.textContent = fmt(T('info'), D.names[String(s)] || D.names[s], nm(juz), nm(hz) + (part ? ' ' + T('q')[part] : '')) +
      ' · ' + fmt(T('pg'), nm(p), T(side(p)));
    inp.value = p;
    bPrev.disabled = p <= 1; bNext.disabled = p >= NP;
    paintJuz();
    bTwo.setAttribute('aria-pressed', two() ? 'true' : 'false');
    bDark.setAttribute('aria-pressed', dark() ? 'true' : 'false');
    var pad = ('00' + s).slice(-3);
    bText.setAttribute('href', 'packages/' + pad + '-package/' + encodeURI(e[2]) + '#a=' + s + ':' + a);
    [].forEach.call(spread.querySelectorAll('.pg'), function (f) { f.classList.toggle('cur', +f.getAttribute('data-p') === p); });
    try { localStorage.setItem('hifz-mushaf-page', String(p)); } catch (x) {}
    try { history.replaceState(history.state, '', location.pathname + location.search + '#p=' + p); } catch (x) {}
    document.title = (document.querySelector('title') ? document.title.replace(/ · .*$/, '') : '') + ' · ' + fmt(T('pg'), nm(p), T(side(p)));
  }
  function go(q) {
    q = Math.max(1, Math.min(NP, q));
    if (q === p) return;
    var before = shown().join();
    p = q;
    if (shown().join() === before) paint(); else render();
  }
  function step(d) { go(two() ? (d > 0 ? (p % 2 ? p + 2 : p + 1) : (p % 2 ? p - 2 : p - 3)) : p + d); }
  bPrev.addEventListener('click', function () { step(-1); });
  bNext.addEventListener('click', function () { step(1); });
  if (jg) {
    jP.addEventListener('click', function () { var j = juzOfPage(p); if (j > 1) go(JZ[j - 2][2]); });
    jN.addEventListener('click', function () { var j = juzOfPage(p); if (j < 30) go(JZ[j][2]); });
    jL.addEventListener('click', function () { go(JZ[juzOfPage(p) - 1][2]); });
  }
  document.querySelector('.mb-go').addEventListener('submit', function (e) { e.preventDefault(); go(Math.round(+inp.value || p)); inp.blur(); });
  bTwo.addEventListener('click', function () { opt.two = two() ? 'off' : 'on'; saveOpt(); render(); });
  bDark.addEventListener('click', function () { opt.dark = dark() ? 'off' : 'on'; saveOpt(); spread.classList.toggle('dark', dark()); paint(); });
  document.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'ArrowLeft' || e.key === 'PageDown') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowRight' || e.key === 'PageUp') { e.preventDefault(); step(-1); }
  });
  var sx = 0, sy = 0, st = 0;
  spread.addEventListener('touchstart', function (e) { if (e.touches.length === 1) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now(); } }, { passive: true });
  spread.addEventListener('touchend', function (e) {
    if (!st || e.changedTouches.length !== 1 || (window.visualViewport && window.visualViewport.scale > 1.05)) { st = 0; return; }
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 1.5 * Math.abs(dy) && Date.now() - st < 800) step(dx > 0 ? 1 : -1);
    st = 0;
  }, { passive: true });
  window.addEventListener('hashchange', function () { var x = /[#&]p=(\d+)/.exec(location.hash); if (x) go(+x[1]); });
  if (wide) { var f = function () { if (opt.two === 'auto') render(); }; if (wide.addEventListener) wide.addEventListener('change', f); else if (wide.addListener) wide.addListener(f); }
  if (window.HifzView) window.HifzView.on(function () { spread.classList.toggle('dark', dark()); paint(); });
  if (window.hifzUI) window.hifzUI.on(function () { render(); });
  window.HifzPage = function () { return p; };
  window.HifzMushaf = { go: go, page: function () { return p; }, shown: shown, juz: function () { return juzOfPage(p); } };
  render();
})();
