/* Hifz web app: the navigation arrows of a surah file (mode 'web' of tools/make_book.py), 2026-10-30, at the
   learner's request: "forward and back arrows to move between surahs and another to move between segments of
   the same surah and a third one to move between Juz".
   The row at the end of the toolbar (make_book.web_nav, written for the top of the file) has three groups
   "→ label ←", in the order of an Arabic book whatever the interface language, as the page arrows of the
   Mushaf: → the previous one (on the right), ← the next one (on the left).
     surah    the previous and the next surah file, from its top; the label goes to the top of this one
     segment  the previous and the next segment of this surah (none before the first, none after the last);
              the label (the segment in view, or the index) goes to the start of that segment
     juzʾ     the start of the previous and the next juzʾ, in this file or in another surah file; a juzʾ that
              starts a segment opens at the segment (#sNN), one that starts inside a segment at its ayah
              (#a=s:a, where tools/refs.py lands on it and lights it); the label goes to the start of the
              juzʾ in view
   "In view" is the first ayah at the top of the screen, under the toolbar (as the player's range), or the
   ayah an arrow or the address has just brought the reader to, while it stays on screen and until the
   reader scrolls.  A move inside the file adds nothing to the history (the browser's Back still leaves
   the file), and the address keeps the place (#sNN, #a=s:a), so a reload opens there.
   A recitation that is running moves with the reader to the segment or juzʾ he moves to (window.HifzPlayer.moved);
   the top of the file (the index) leaves it where it is.
   Since 2026-10-31 the row starts with 📖, the read-through view (at the learner's request: "view the whole surah in
   reading mode without any interruptions after I have already mastered segment by segment"): the segments as one
   text, without their rows, titles, clues or keys (app/book.css html[data-read]), kept per surah on this device; the
   arrows work the same in it (a segment opens at its first words, lit).
   Interface text in three languages, following the switch of tools/ui.py (window.hifzUI). */
(function () {
  'use strict';
  var W = window.HifzWords, bar = document.querySelector('.tools .hnav');
  if (!W || !bar || !W.D.nv) return;
  var D = W.D, S = D.s, G = D.g, K = G.length, NV = D.nv, JZ = NV.jz, de = document.documentElement;

  // ---------------------------------------------------------------- text in three languages
  function lang() { var u = de.getAttribute('data-ui'); return u === 'en' || u === 'es' ? u : 'ar'; }
  function nm(n) { return lang() === 'ar' ? String(n).replace(/[0-9]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.charAt(+d); }) : String(n); }
  function fmt(s) { var a = arguments; return String(s).replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1]; }); }
  function iso(t) { return lang() === 'ar' ? t : '⁨' + t + '⁩'; }
  var TX = {
    ar: {
      s: 'السورة', g: 'المقطع', j: 'الجزء', index: 'الفهرس',
      sPrev: 'السورة السابقة: {1} ({0})', sNext: 'السورة التالية: {1} ({0})', sNo0: 'لا سورة قبلها', sNo1: 'لا سورة بعدها', sTop: 'أول السورة',
      gPrev: 'المقطع السابق: {0}', gNext: 'المقطع التالي: {0}', gNo0: 'لا مقطع قبله في هذه السورة', gNo1: 'لا مقطع بعده في هذه السورة',
      gTop: 'أول المقطع {0}', gIdx: 'فهرس المقاطع',
      jPrev: 'الجزء السابق: {0}، أوله {1} {2}', jNext: 'الجزء التالي: {0}، أوله {1} {2}', jNo0: 'لا جزء قبله', jNo1: 'لا جزء بعده',
      jTop: 'أول الجزء {0}: {1} {2}',
      rdOff: 'قراءة متصلة: السورة كلها نصاً واحداً بلا فواصل', rdOn: 'القراءة المتصلة مفعّلة: اضغط للعودة إلى المقاطع'
    },
    en: {
      s: 'Surah', g: 'Segment', j: 'Juzʾ', index: 'Index',
      sPrev: 'Previous surah: {0} {1}', sNext: 'Next surah: {0} {1}', sNo0: 'No surah before this one', sNo1: 'No surah after this one',
      sTop: 'Top of this surah',
      gPrev: 'Previous segment: {0}', gNext: 'Next segment: {0}', gNo0: 'No segment before this one in this surah',
      gNo1: 'No segment after this one in this surah', gTop: 'Start of segment {0}', gIdx: 'Segment index',
      jPrev: 'Previous juzʾ: {0}, from {1} {2}', jNext: 'Next juzʾ: {0}, from {1} {2}', jNo0: 'No juzʾ before this one', jNo1: 'No juzʾ after this one',
      jTop: 'Start of juzʾ {0}: {1} {2}',
      rdOff: 'Read through: the whole surah as one text, without breaks', rdOn: 'Read-through is on: tap to go back to the segments'
    },
    es: {
      s: 'Sura', g: 'Segmento', j: 'Yuz', index: 'Índice',
      sPrev: 'Sura anterior: {0} {1}', sNext: 'Sura siguiente: {0} {1}', sNo0: 'No hay sura antes de esta', sNo1: 'No hay sura después de esta',
      sTop: 'Inicio de esta sura',
      gPrev: 'Segmento anterior: {0}', gNext: 'Segmento siguiente: {0}', gNo0: 'No hay segmento antes de este en esta sura',
      gNo1: 'No hay segmento después de este en esta sura', gTop: 'Inicio del segmento {0}', gIdx: 'Índice de segmentos',
      jPrev: 'Yuz anterior: {0}, desde {1} {2}', jNext: 'Yuz siguiente: {0}, desde {1} {2}', jNo0: 'No hay yuz antes de este', jNo1: 'No hay yuz después de este',
      jTop: 'Inicio del yuz {0}: {1} {2}',
      rdOff: 'Lectura seguida: toda la sura como un solo texto, sin cortes', rdOn: 'Lectura seguida activada: toque para volver a los segmentos'
    }
  };
  function T(k) { return TX[lang()][k]; }

  // ---------------------------------------------------------------- the surahs, segments and ajzāʾ
  function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }
  function name(s) { var x = NV.f[String(s)]; return x ? x[0] : ''; }
  function file(s) { var x = NV.f[String(s)]; return x ? '../' + pad(s, 3) + '-package/' + encodeURIComponent(x[1]) : null; }
  function juzOf(a) {             // the juzʾ ayah a of this surah is in
    var j = 1;
    for (var i = 0; i < JZ.length; i++) if (JZ[i][0] < S || (JZ[i][0] === S && JZ[i][1] <= a)) j = i + 1;
    return j;
  }
  function kOf(a) { for (var i = 0; i < K; i++) if (G[i][1] <= a && a <= G[i][2]) return i + 1; return 0; }   // 1..K
  function secOf(k) { return document.getElementById('s' + pad(G[k - 1][0], 2)); }
  // where an arrow leads: {href, here (in this file), k (segment, 0 = the top), a (ayah), sec (land on the segment)}
  function toSeg(k) { return k ? { href: '#s' + pad(G[k - 1][0], 2), here: true, k: k, a: G[k - 1][1], sec: true } : { href: '#top', here: true, k: 0, a: 1, top: true }; }
  function toJuz(j) {
    var e = JZ[j - 1], s = e[0], a = e[1], frag = e[2] ? '#s' + pad(e[2], 2) : '#a=' + s + ':' + a;
    if (s !== S) return { href: file(s) + frag, here: false, s: s, a: a };
    return { href: frag, here: true, k: kOf(a), a: a, sec: !!e[2] && kOf(a) > 0 && G[kOf(a) - 1][1] === a };
  }

  // ---------------------------------------------------------------- where the reader is
  function toolsH() { var t = document.querySelector('.tools'); return t ? t.getBoundingClientRect().height : 0; }
  function barH() {
    var b = document.querySelector('.pbar');
    return b && getComputedStyle(b).display !== 'none' ? b.getBoundingClientRect().height : 0;
  }
  var pin = null;                 // {a, k}: where an arrow (or the address) has just brought the reader
  function onScreen(a) {
    var w = W.words(a)[0];
    if (!w) return false;
    var r = w.getBoundingClientRect();
    return r.bottom > toolsH() && r.top < window.innerHeight - barH();
  }
  function probe() {              // the first ayah at the top of the screen (the player's inView, with the index)
    var top = toolsH() + 30, secs = document.querySelectorAll('section.seg');
    if (!secs.length || secs[0].getBoundingClientRect().top > top) return { a: 1, k: 0 };
    for (var i = 0; i < secs.length; i++) {
      var r = secs[i].getBoundingClientRect();
      if (r.bottom > top + 40 || i === secs.length - 1) {
        var k = i + 1, ws = secs[i].querySelectorAll('.quran .wd[data-a]');
        for (var j = 0; j < ws.length; j++) if (ws[j].getBoundingClientRect().bottom > top) return { a: +ws[j].getAttribute('data-a'), k: k };
        return { a: G[i][2], k: k };
      }
    }
    return { a: 1, k: 0 };
  }
  function where() {              // the pin holds while its ayah is on screen (or not yet reached: a landing to come)
    if (pin) { if (onScreen(pin.a)) pin.seen = true; else if (pin.seen) pin = null; }
    var w = pin || probe();
    return w.k === 0 && reading() && K ? { a: 1, k: 1 } : w;   // read through: the text starts at once, no index
  }

  // ---------------------------------------------------------------- the arrows
  var groups = {};
  [].forEach.call(bar.querySelectorAll('.hn-g'), function (g) {
    var x = { p: g.querySelector('.hn-p'), l: g.querySelector('.hn-l'), n: g.querySelector('.hn-x') };
    [x.p, x.l, x.n].forEach(function (el) { el.removeAttribute('data-i18n-attr'); });   // their titles are written here
    groups[g.getAttribute('data-g')] = x;
  });
  if (!groups.s || !groups.g || !groups.j) return;
  function set(el, to, title) {
    if (to) { el.setAttribute('href', to.href); el.removeAttribute('aria-disabled'); }
    else { el.removeAttribute('href'); el.setAttribute('aria-disabled', 'true'); }
    el._to = to || null;
    el.title = title; el.setAttribute('aria-label', title);
  }
  function label(x, cap, val) {
    var c = x.l.querySelector('.hn-c'), v = x.l.querySelector('.hn-v');
    if (c.textContent !== cap) c.textContent = cap;
    if (v.textContent !== val) v.textContent = val;
  }
  var shown = '';
  function update(force) {
    var w = where(), k = w.k, j = juzOf(w.a), key = [k, j, lang()].join();
    if (key === shown && !force) return;
    shown = key;
    var s = groups.s, g = groups.g, z = groups.j;
    label(s, T('s'), nm(S));
    set(s.p, S > 1 ? { href: file(S - 1), here: false } : null, S > 1 ? fmt(T('sPrev'), nm(S - 1), iso(name(S - 1))) : T('sNo0'));
    set(s.l, toSeg(0), T('sTop'));
    set(s.n, S < 114 ? { href: file(S + 1), here: false } : null, S < 114 ? fmt(T('sNext'), nm(S + 1), iso(name(S + 1))) : T('sNo1'));
    label(g, T('g'), k ? nm(G[k - 1][0]) : T('index'));
    set(g.p, k > 1 ? toSeg(k - 1) : null, k > 1 ? fmt(T('gPrev'), nm(G[k - 2][0])) : T('gNo0'));
    set(g.l, toSeg(k), k ? fmt(T('gTop'), nm(G[k - 1][0])) : T('gIdx'));
    set(g.n, k < K ? toSeg(k + 1) : null, k < K ? fmt(T('gNext'), nm(G[k][0])) : T('gNo1'));
    label(z, T('j'), nm(j));
    function jt(t, jj) { var e = JZ[jj - 1]; return fmt(T(t), nm(jj), iso(name(e[0])), nm(e[1])); }
    set(z.p, j > 1 ? toJuz(j - 1) : null, j > 1 ? jt('jPrev', j - 1) : T('jNo0'));
    set(z.l, toJuz(j), jt('jTop', j));
    set(z.n, j < 30 ? toJuz(j + 1) : null, j < 30 ? jt('jNext', j + 1) : T('jNo1'));
  }

  // ---------------------------------------------------------------- moving inside the file
  function address(h) {
    try { history.replaceState(history.state, '', location.pathname + location.search + h); } catch (e) {}
  }
  function lineTop(w) {           // the top of the line a word stands on (the line is taller than the word)
    var r = w.getBoundingClientRect(), p = w.closest('.quran') || w.parentNode, lh = parseFloat(getComputedStyle(p).lineHeight);
    return r.top - (lh > r.height ? (lh - r.height) / 2 : 0);
  }
  var flashT = 0, flashed = [];
  function flash(a) {
    clearTimeout(flashT);
    flashed.forEach(function (w) { w.classList.remove('hn-hit'); });
    flashed = W.words(a).slice();
    void document.body.offsetWidth;          // restart the animation when the same ayah is lit again
    flashed.forEach(function (w) { w.classList.add('hn-hit'); });
    flashT = setTimeout(function () { flashed.forEach(function (w) { w.classList.remove('hn-hit'); }); flashed = []; }, 2700);
  }
  function go(to) {
    if (window.HifzTranslate && window.HifzTranslate.hide) { try { window.HifzTranslate.hide(); } catch (e) {} }
    if (to.top) {
      pin = null;
      window.scrollTo(0, 0);
      address('');
    } else if (to.sec && !reading()) {
      var sec = secOf(to.k);
      if (!sec) return;
      sec.scrollIntoView({ block: 'start' });
      pin = { a: to.a, k: to.k };
      address(to.href);
    } else if (to.sec) {            // read through: no header to land on; the line of its first words, lit
      var w0 = W.words(to.a)[0];
      if (!w0) return;
      window.scrollTo(0, Math.max(0, window.scrollY + lineTop(w0) - toolsH() - 10));
      pin = { a: to.a, k: to.k };
      address(to.href);
      flash(to.a);
    } else {
      var w = W.words(to.a)[0];
      if (!w) return;
      window.scrollTo(0, Math.max(0, window.scrollY + lineTop(w) - toolsH() - 10));
      pin = { a: to.a, k: to.k };
      address('#a=' + S + ':' + to.a);
      flash(to.a);
    }
    // the recitation follows to a place in the text; the index is no place to recite from, so there the page is
    // left alone for a while, as after the reader's own scroll (the player's follow-along waits, then comes back)
    var HP = window.HifzPlayer;
    if (HP) { try { if (to.top) { if (HP.looked) HP.looked(); } else if (HP.moved) HP.moved(to.a); } catch (e) {} }
    update(true);
  }
  bar.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('a') : null;
    if (!el || !bar.contains(el)) return;
    var to = el._to;
    if (!to) { e.preventDefault(); return; }                       // nothing that way
    if (!to.here) return;                                          // another surah file: the link opens it
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button) return;
    e.preventDefault();
    go(to);
  });

  // ---------------------------------------------------------------- the read-through view (2026-10-31)
  // 📖 at the head of the row: the whole surah as one text (html[data-read], app/book.css), kept for this surah on
  // this device (localStorage "hifz-read" = {surah: 1}, read before the page is drawn by tools/ui.py VIEW_JS); the
  // ayah at the top of the screen stays at the top when it is switched; a segment in test mode leaves it.
  var RK = 'hifz-read', rdb = bar.querySelector('.hn-rd');
  function reading() { return de.hasAttribute('data-read'); }
  function paintRead() {
    if (!rdb) return;
    rdb.removeAttribute('data-i18n-attr');
    var on = reading(), t = T(on ? 'rdOn' : 'rdOff');
    rdb.setAttribute('aria-pressed', on ? 'true' : 'false'); rdb.title = t; rdb.setAttribute('aria-label', t);
  }
  function setReading(on) {
    on = !!on;
    if (on === reading()) return;
    var at = where();
    if (on && window.HifzTest && window.HifzTest.leave) {
      [].forEach.call(document.querySelectorAll('section.seg.testing'), function (sec) { try { window.HifzTest.leave(sec); } catch (e) {} });
    }
    if (window.HifzTranslate && window.HifzTranslate.hide) { try { window.HifzTranslate.hide(); } catch (e) {} }
    if (on) de.setAttribute('data-read', ''); else de.removeAttribute('data-read');
    var r = {};
    try { r = JSON.parse(localStorage.getItem(RK) || '{}') || {}; } catch (e) { r = {}; }
    if (on) r[S] = 1; else delete r[S];
    try { localStorage.setItem(RK, JSON.stringify(r)); } catch (e) {}
    paintRead();
    if ((at.k === 0 && !pin) || window.scrollY < 10) { pin = null; window.scrollTo(0, 0); }   // at the top it stays at the top
    else {
      var w = W.words(at.a)[0];
      if (w) { window.scrollTo(0, Math.max(0, window.scrollY + lineTop(w) - toolsH() - 10)); pin = { a: at.a, k: at.k || kOf(at.a) }; }
    }
    if (window.HifzPlayer && window.HifzPlayer.looked) { try { window.HifzPlayer.looked(); } catch (e) {} }
    update(true);
  }
  if (rdb) rdb.addEventListener('click', function () { setReading(!reading()); });
  paintRead();

  // ---------------------------------------------------------------- keeping up with the page
  var raf = 0;
  function later() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; update(); }); }
  window.addEventListener('scroll', later, { passive: true });
  window.addEventListener('resize', later);
  // a scroll by the reader ends the place an arrow brought him to (the player's own scrolling does not)
  var ty = null;
  function drop() { if (pin) { pin = null; later(); } }
  window.addEventListener('wheel', drop, { passive: true });
  window.addEventListener('touchstart', function (e) { ty = e.touches.length === 1 ? e.touches[0].clientY : null; }, { passive: true });
  window.addEventListener('touchmove', function (e) { if (ty !== null && e.touches.length === 1 && Math.abs(e.touches[0].clientY - ty) > 12) drop(); }, { passive: true });
  window.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (/^(Arrow(Up|Down)|Page(Up|Down)|Home|End| )$/.test(e.key)) drop();
  });
  if (window.hifzUI) window.hifzUI.on(function () { paintRead(); update(true); });

  // the place the address opens at: a segment (#sNN, from a juzʾ arrow of another file) or an ayah (#a=s:a,
  // where tools/refs.py lands); a segment is landed on again once the fonts have changed the lines
  (function () {
    var h = location.hash, m = /^#s(\d+)$/.exec(h), m2 = /[#&]a=(\d+):(\d+)/.exec(h), k = 0;
    if (m) { for (var i = 0; i < K; i++) if (G[i][0] === +m[1]) k = i + 1; }
    if (k) {
      pin = { a: G[k - 1][1], k: k };
      var touched = false, sec = secOf(k);
      ['wheel', 'touchmove', 'keydown'].forEach(function (ev) { window.addEventListener(ev, function () { touched = true; }, { passive: true, once: true }); });
      var again = function () { if (!touched && sec) { sec.scrollIntoView({ block: 'start' }); later(); } };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(again);
      window.addEventListener('load', again);
    } else if (m2 && +m2[1] === S && +m2[2] >= 1 && +m2[2] <= D.n) {
      pin = { a: +m2[2], k: kOf(+m2[2]) };
    }
  })();
  update(true);
  window.HifzNav = { update: update, where: where, reading: reading, setReading: setReading,
    go: function (k, x) { var g = groups[k]; if (g && g[x] && g[x]._to) g[x].click(); } };
})();
