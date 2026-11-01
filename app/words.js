/* Hifz web app: the words of a surah file (mode 'web' of tools/make_book.py).
   - Wraps every space-separated word of the Qur'anic text (.quran) in <span class="wd">, without
     changing a letter: the text nodes and tajweed spans are moved, never retyped (a span that
     holds a space is split into copies of itself).  Each word that carries letters gets
     data-a (its ayah) and data-i (its number in the ayah: the words of kitlib.words, the same
     numbering as QUL's word timings); pause signs between words get class "wm".
   - Marks where each page of the Mushaf begins, with its side as in his printed copy (odd pages
     on the right): a divider before the first word of the page, and the pages of every segment
     in its header (data "p" of tools/app_data.py).
   - Since 2026-10-31 (at the learner's request, for those who memorize by the picture of the page): the
     lines of the Mushaf (data "ln", mushaf-lines.json): every line's words are wrapped in <span class="ln">
     (display: contents until the lines view is on), so html[data-lines] (app/view.js) shows the text line
     for line as it sits on the page, with the line number at the start of each line, a partial first or
     last line kept to its own share of the width, and a thumbnail of each page in the segment's header
     with the segment's lines marked; the last word of every ayah carries class "rw" for the rhyme view
     (html[data-rhyme]).
   - window.HifzWords = {D, ayah(a), word(a, i), words(a), marker(a), section(a), segOf(a), pageOf(a),
     lineOf(a, i), mismatch} for the player, the tests and the recitation check.
   Interface text in three languages, following the switch of tools/ui.py (window.hifzUI). */
(function () {
  'use strict';
  var node = document.getElementById('hifz-data');
  if (!node) return;
  var D = JSON.parse(node.textContent), S = D.s, de = document.documentElement;
  var LET = /[ء-يٱ]/, SP = /(\s+)/;
  var AY = {};      // a -> {w: [word elements, by number], all: [every .wd], m: marker, sec}
  function A(a) { return AY[a] || (AY[a] = { w: [], all: [], m: null, sec: null }); }

  function wordify(p) {
    var kids = [].slice.call(p.childNodes), cur = null;
    function open(before) { cur = document.createElement('span'); cur.className = 'wd'; p.insertBefore(cur, before); return cur; }
    function piece(t, before, make) {
      if (!t) return;
      if (/^\s+$/.test(t)) { cur = null; p.insertBefore(document.createTextNode(t), before); }
      else (cur || open(before)).appendChild(make(t));
    }
    kids.forEach(function (n) {
      if (n.nodeType === 1 && n.classList.contains('aya')) { cur = null; return; }
      if (n.nodeType === 3) {
        n.nodeValue.split(SP).forEach(function (t) { piece(t, n, function (x) { return document.createTextNode(x); }); });
        p.removeChild(n);
      } else if (n.nodeType === 1) {
        if (!/\s/.test(n.textContent)) { (cur || open(n)).appendChild(n); return; }
        n.textContent.split(SP).forEach(function (t) {
          piece(t, n, function (x) { var c = n.cloneNode(false); c.textContent = x; return c; });
        });
        p.removeChild(n);
      }
    });
    // number the words by ayah: an ayah's words come before its marker
    var pend = [];
    [].forEach.call(p.childNodes, function (n) {
      if (n.nodeType !== 1) return;
      if (n.classList.contains('wd')) { pend.push(n); return; }
      if (n.classList.contains('aya')) {
        var m = /^(\d+):(\d+)$/.exec(n.getAttribute('data-ref') || '');
        if (!m || +m[1] !== S) { pend = []; return; }
        var a = +m[2], o = A(a), i = 0;
        o.m = n;
        pend.forEach(function (w) {
          w.setAttribute('data-a', a);
          o.all.push(w);
          if (LET.test(w.textContent)) { i++; w.setAttribute('data-i', i); o.w[i] = w; } else w.classList.add('wm');
        });
        pend = [];
      }
    });
  }

  var t0 = Date.now(), before = {};
  [].forEach.call(document.querySelectorAll('section.seg'), function (sec) {
    var p = sec.querySelector('p.quran');
    if (!p) return;
    before[sec.id] = p.textContent;
    wordify(p);
    [].forEach.call(p.querySelectorAll('.aya[data-ref]'), function (m) {
      var x = /^(\d+):(\d+)$/.exec(m.getAttribute('data-ref'));
      if (x && +x[1] === S) A(+x[2]).sec = sec;
    });
  });
  var mismatch = [], changed = [];
  [].forEach.call(document.querySelectorAll('section.seg'), function (sec) {
    var p = sec.querySelector('p.quran');
    if (p && before[sec.id] !== p.textContent) changed.push(sec.id);
  });
  for (var a = 1; a <= D.n; a++) {
    var n = AY[a] ? AY[a].w.length - 1 : 0;
    if (Math.max(n, 0) !== D.ws[a - 1]) mismatch.push([a, n, D.ws[a - 1]]);
  }

  function segOf(a) {
    for (var i = 0; i < D.g.length; i++) if (D.g[i][1] <= a && a <= D.g[i][2]) return D.g[i];
    return null;
  }
  function pageOf(a) {
    var p = D.p[0];
    for (var i = 0; i < D.p.length; i++) if (D.p[i][1] <= a) p = D.p[i];
    return p;         // [page, first ayah, side]
  }

  // ---- pages and their sides ----
  var TX = {
    ar: { pg: 'ص {0} · {1}', R: 'يمين', L: 'يسار', hd: 'في المصحف: {0}', line: 'السطر {0}', lines: 'الأسطر {0}–{1}' },
    en: { pg: 'p. {0} · {1}', R: 'right', L: 'left', hd: 'In the Mushaf: {0}', line: 'line {0}', lines: 'lines {0}–{1}' },
    es: { pg: 'pág. {0} · {1}', R: 'derecha', L: 'izquierda', hd: 'En el mushaf: {0}', line: 'línea {0}', lines: 'líneas {0}–{1}' }
  };
  function lang() { var u = de.getAttribute('data-ui'); return u === 'en' || u === 'es' ? u : 'ar'; }
  function nm(n) { return lang() === 'ar' ? String(n).replace(/[0-9]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.charAt(+d); }) : String(n); }
  function fmt(s) { var a = arguments; return String(s).replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1]; }); }
  function pgLabel(p, side) { var t = TX[lang()]; return fmt(t.pg, nm(p), t[side]); }
  var marks = [], heads = [];
  D.p.forEach(function (e, k) {
    var a = e[1], o = AY[a];
    if (!o || !o.all.length) return;
    var w = o.all[0], first = w.parentNode.querySelector('.wd') === w;
    if (k === 0 && !first) return;
    var m = document.createElement('span');
    m.className = 'pgm' + (first ? ' top' : '');
    m.setAttribute('data-p', e[0]); m.setAttribute('data-side', e[2]); m.setAttribute('role', 'note');
    w.parentNode.insertBefore(m, w);
    marks.push(m);
  });
  [].forEach.call(document.querySelectorAll('section.seg'), function (sec) {
    var id = +sec.id.slice(1), g = null;
    for (var i = 0; i < D.g.length; i++) if (D.g[i][0] === id) g = D.g[i];
    var hd = sec.querySelector('header .hd-ay');
    if (!g || !hd) return;
    var ps = [pageOf(g[1])];
    D.p.forEach(function (e) { if (e[1] > g[1] && e[1] <= g[2]) ps.push(e); });
    var b = document.createElement('span'); b.className = 'pgs'; b.setAttribute('data-pages', JSON.stringify(ps.map(function (e) { return [e[0], e[2]]; })));
    hd.appendChild(b); heads.push(b);
  });
  // ---- the lines of the Mushaf (2026-10-31) ----
  // D.ln: [[page, line, a0, w0, a1, w1], ...] in order; an item is a word (1..n) or the ayah's marker (n + 1)
  var LN = D.ln || [], lineAt = {};          // "a:i" -> index in LN of the line that holds the item
  function itemEl(a, i) { var o = AY[a]; if (!o) return null; return i > o.w.length - 1 ? o.m : o.w[i]; }
  function lineItems(k) {                   // the items of line k as [a, i] pairs, in order
    var e = LN[k], out = [], a = e[2], i = e[3];
    while (true) {
      var n = AY[a] ? AY[a].w.length - 1 : D.ws[a - 1];
      var last = a === e[4] ? e[5] : n + 1;
      for (; i <= last; i++) out.push([a, i]);
      if (a === e[4]) break;
      a++; i = 1;
    }
    return out;
  }
  var lineWraps = [];
  if (LN.length && !mismatch.length) {
    LN.forEach(function (e, k) {
      var its = lineItems(k), all = its.length;
      its.forEach(function (x) { lineAt[x[0] + ':' + x[1]] = k; });
      // the line's items by paragraph: a line shared by two segments gets a wrapper in each, with its share of the width
      var runs = [], cur = null;
      its.forEach(function (x, j) {
        var el = itemEl(x[0], x[1]);
        if (!el) { cur = null; return; }
        if (cur && cur.p === el.parentNode) { cur.els.push(el); cur.end = j; }
        else { cur = { p: el.parentNode, els: [el], start: j, end: j }; runs.push(cur); }
      });
      runs.forEach(function (r) {
        var p = r.p, first = r.els[0], last = r.els[r.els.length - 1];
        var wrap = document.createElement('span');
        wrap.className = 'ln'; wrap.setAttribute('data-l', e[1]); wrap.setAttribute('data-p', e[0]);
        wrap.setAttribute('data-share', String(r.els.length / all)); wrap.style.setProperty('--share', String(r.els.length / all));
        if (r.start > 0) wrap.style.setProperty('--before', String(r.start / all));   // items of the previous segment on this line
        var start = first;
        while (start.previousSibling && start.previousSibling.nodeType === 1 && start.previousSibling.classList.contains('pgm')) start = start.previousSibling;
        p.insertBefore(wrap, start);
        var n = start;
        while (n) { var nx = n.nextSibling; wrap.appendChild(n); if (n === last) break; n = nx; }
        // a pause sign right after the last word of the line stays on the line
        while (wrap.nextSibling && wrap.nextSibling.nodeType === 1 && wrap.nextSibling.classList.contains('wm')) wrap.appendChild(wrap.nextSibling);
        lineWraps.push(wrap);
      });
    });
  }
  for (var a2 = 1; a2 <= D.n; a2++) { var o2 = AY[a2]; if (o2 && o2.w.length > 1) o2.w[o2.w.length - 1].classList.add('rw'); }
  function lineOf(a, i) { var k = lineAt[a + ':' + i]; return k === undefined ? null : LN[k]; }
  // the thumbnails: one small page per page of the segment, its lines, the segment's own lines marked
  function thumbs() {
    [].forEach.call(document.querySelectorAll('section.seg'), function (sec) {
      var id = +sec.id.slice(1), g = null;
      for (var i = 0; i < D.g.length; i++) if (D.g[i][0] === id) g = D.g[i];
      var hd = sec.querySelector('header .hd-ay');
      if (!g || !hd || hd.querySelector('.thumbs')) return;
      var pages = {};
      LN.forEach(function (e) {
        if (e[4] < g[1] || e[2] > g[2]) return;
        (pages[e[0]] = pages[e[0]] || {}); pages[e[0]][e[1]] = true;
      });
      var box = document.createElement('span'); box.className = 'thumbs';
      Object.keys(pages).sort(function (x, y) { return x - y; }).forEach(function (pg) {
        var rows = +pg <= 2 ? 8 : 15, side = +pg % 2 ? 'R' : 'L', t = document.createElement('span');
        t.className = 'thumb'; t.setAttribute('data-side', side); t.setAttribute('data-p', pg);
        for (var r = 1; r <= rows; r++) { var b = document.createElement('i'); if (pages[pg][r]) b.className = 'on'; t.appendChild(b); }
        box.appendChild(t);
      });
      hd.appendChild(box);
    });
  }
  thumbs();
  // in the lines view every line must fit its width: the longest line sets the text size of the paragraph
  var fitT = 0;
  function fit() {
    if (!de.hasAttribute('data-lines')) { [].forEach.call(document.querySelectorAll('.quran[style]'), function (p) { p.style.removeProperty('--lnfit'); }); return; }
    [].forEach.call(document.querySelectorAll('section.seg .quran'), function (p) {
      p.style.setProperty('--lnfit', '1');
      var r = 1;
      [].forEach.call(p.querySelectorAll('.ln'), function (w) {
        var share = +w.getAttribute('data-share') || 1, avail = p.clientWidth * share;
        if (w.scrollWidth > avail + 1) r = Math.min(r, avail / w.scrollWidth);
      });
      if (r < 1) p.style.setProperty('--lnfit', String(Math.max(0.8, r * 0.985)));    // below 0.8 a line wraps instead
      [].forEach.call(p.querySelectorAll('.ln'), function (w) {                        // a wrapped line is not stretched
        var lh = parseFloat(getComputedStyle(w).lineHeight) || 1;
        w.classList.toggle('wrapped', w.getBoundingClientRect().height > 1.6 * lh);
      });
    });
  }
  function fitLater() { clearTimeout(fitT); fitT = setTimeout(fit, 60); }
  window.addEventListener('resize', fitLater);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitLater);
  window.addEventListener('load', fitLater);
  document.addEventListener('hifz-view', fitLater);
  fit();

  function relabel() {
    var t = TX[lang()];
    marks.forEach(function (m) {
      var l = pgLabel(+m.getAttribute('data-p'), m.getAttribute('data-side'));
      m.setAttribute('data-label', l); m.setAttribute('aria-label', l);
    });
    heads.forEach(function (b) {
      var ps = JSON.parse(b.getAttribute('data-pages'));
      b.textContent = fmt(t.hd, ps.map(function (e) { return pgLabel(e[0], e[1]) + lineSpan(b, e[0]); }).join(lang() === 'ar' ? '، ' : ', '));
    });
    [].forEach.call(document.querySelectorAll('.thumb'), function (x) {
      x.setAttribute('aria-label', pgLabel(+x.getAttribute('data-p'), x.getAttribute('data-side'))); x.title = x.getAttribute('aria-label');
    });
  }
  function lineSpan(b, pg) {                 // "، الأسطر ٣–٩" of the segment on that page
    var sec = b.closest('section.seg'), id = sec ? +sec.id.slice(1) : 0, g = null, lo = 99, hi = 0;
    for (var i = 0; i < D.g.length; i++) if (D.g[i][0] === id) g = D.g[i];
    if (!g || !LN.length) return '';
    LN.forEach(function (e) { if (e[0] === pg && e[4] >= g[1] && e[2] <= g[2]) { lo = Math.min(lo, e[1]); hi = Math.max(hi, e[1]); } });
    if (!hi) return '';
    var t = TX[lang()];
    return ' · ' + fmt(lo === hi ? t.line : t.lines, nm(lo), nm(hi));
  }
  relabel();
  if (window.hifzUI) window.hifzUI.on(relabel);

  window.HifzWords = {
    D: D, ms: Date.now() - t0, mismatch: mismatch, changed: changed,
    ayah: function (a) { return AY[a] || null; },
    word: function (a, i) { return AY[a] ? AY[a].w[i] || null : null; },
    words: function (a) { return AY[a] ? AY[a].all : []; },
    marker: function (a) { return AY[a] ? AY[a].m : null; },
    section: function (a) { return AY[a] ? AY[a].sec : null; },
    segOf: segOf, pageOf: pageOf, pgLabel: pgLabel, lineOf: lineOf, lines: LN, fit: fit
  };
  document.dispatchEvent(new CustomEvent('hifz-words'));
})();
