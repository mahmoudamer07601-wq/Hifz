/* Hifz web app: the words of a surah file (mode 'web' of tools/make_book.py).
   - Wraps every space-separated word of the Qur'anic text (.quran) in <span class="wd">, without
     changing a letter: the text nodes and tajweed spans are moved, never retyped (a span that
     holds a space is split into copies of itself).  Each word that carries letters gets
     data-a (its ayah) and data-i (its number in the ayah: the words of kitlib.words, the same
     numbering as QUL's word timings); pause signs between words get class "wm".
   - Marks where each page of the Mushaf begins, with its side as in his printed copy (odd pages
     on the right): a divider before the first word of the page, and the pages of every segment
     in its header (data "p" of tools/app_data.py).
   - window.HifzWords = {D, ayah(a), word(a, i), words(a), marker(a), section(a), segOf(a), pageOf(a),
     mismatch} for the player, the tests and the recitation check.
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
    ar: { pg: 'ص {0} · {1}', R: 'يمين', L: 'يسار', hd: 'في المصحف: {0}' },
    en: { pg: 'p. {0} · {1}', R: 'right', L: 'left', hd: 'In the Mushaf: {0}' },
    es: { pg: 'pág. {0} · {1}', R: 'derecha', L: 'izquierda', hd: 'En el mushaf: {0}' }
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
  function relabel() {
    var t = TX[lang()];
    marks.forEach(function (m) {
      var l = pgLabel(+m.getAttribute('data-p'), m.getAttribute('data-side'));
      m.setAttribute('data-label', l); m.setAttribute('aria-label', l);
    });
    heads.forEach(function (b) {
      var ps = JSON.parse(b.getAttribute('data-pages'));
      b.textContent = fmt(t.hd, ps.map(function (e) { return pgLabel(e[0], e[1]); }).join(lang() === 'ar' ? '، ' : ', '));
    });
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
    segOf: segOf, pageOf: pageOf, pgLabel: pgLabel
  };
  document.dispatchEvent(new CustomEvent('hifz-words'));
})();
