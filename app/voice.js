/* Hifz web app: voice search (2026-11-05, at the learner's request: "a voice search feature that brings the searched
   ayah and opens it highlighted within the surah, if the search string is unique. If the search string points to
   several surahs, it should present all them with clickable links that opens the intended one highlighted within the
   surah. It should also be able to open the surah by a voice command").
   - 🎤 beside the search box of the home page and of every surah file (the box of tools/refs.py), where the browser
     offers speech recognition (Chrome, Edge, Safari; online: the speech goes to the browser's service, Google in
     Chrome).  Arabic (ar-SA), one utterance; a second tap stops listening; a recitation that is playing is paused.
     What is heard shows in the box as it comes.
   - A command opens a surah: «سورة الكهف», «افتح سورة يس», «سورة ١٨», with an ayah «سورة البقرة آية ٢٥٥».  Names are
     those of quran-data.xml or a common other name (براءة، بني إسرائيل، عمّ، تبارك …), compared without hamza seats,
     ta marbuta, alif maqsura, spaces or the article, a longer name allowing one letter of difference.
   - Anything else is an ayah, searched with the engine of hifz-search.js (tools/search_engine.js: the ordinary
     spelling meets the Uthmani text) in each of the recognizer's alternatives: within an ayah first, then across the
     end of one ayah into the next (each surah's ayat searched as one text); then without a leading isti'adha or
     basmalah or a closing صدق الله العظيم.  In one ayah: the surah opens there with the ayah and the words lit and no panel (tools/refs.py
     #a=s:a&h=…, or HifzRefs.show in the same file).  In several: the list, each opening its ayah lit the same way
     (home: the results under the box, app/home.js HifzHome.voice; a surah file: the panel, HifzRefs.list).  Not
     found as a whole: the longest run of the words heard that is found (two words at least), offered as a list with
     a note, or opened when it is one ayah and covers 60 % of the words or more.
   window.HifzVoice = {supported(), command(text), decide(alternatives), listen(), mics()} for the tests.
   Interface text in three languages, following the switch of tools/ui.py (window.hifzUI). */
(function () {
  'use strict';
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var de = document.documentElement, me = document.currentScript;
  var ROOT = me && me.src ? new URL('..', me.src).href : '';
  var CUR = 0;                                         // the surah of this file; 0 on the home page
  try { CUR = window.HifzWords ? +window.HifzWords.D.s : 0; } catch (e) { CUR = 0; }

  var TX = {
    ar: {
      mic: 'البحث بالصوت: اتلُ آية أو بعضها، أو قل «سورة» واسمها', stop: 'أوقف الاستماع',
      listening: 'أستمع… اتلُ آية أو بعضها، أو قل: سورة الكهف', heard: 'سُمع: «{0}»',
      none: 'لم أجد «{0}» في القرآن. اضغط 🎤 وأعد المحاولة.', part: 'سُمع: «{0}» ولم يوجد كاملاً، فهذه مواضع «{1}».',
      noMic: 'اسمح للمتصفح باستعمال الميكروفون.', noNet: 'البحث بالصوت يحتاج اتصالاً بالإنترنت.',
      noSpeech: 'لم أسمع شيئاً. اضغط 🎤 وتكلّم.', noFile: 'تعذّر تحميل ملف البحث.',
      surah: 'سورة {0}', ayah: 'سورة {0}، الآية {1}'
    },
    en: {
      mic: 'Voice search: recite an ayah or part of one, or say «سورة» and the surah’s name', stop: 'Stop listening',
      listening: 'Listening… recite an ayah or part of one, or say: سورة الكهف', heard: 'Heard: “{0}”',
      none: 'Couldn’t find “{0}” in the Qurʾān. Tap 🎤 and try again.', part: 'Heard: “{0}”, not found as a whole; here is where “{1}” occurs.',
      noMic: 'Allow the browser to use the microphone.', noNet: 'Voice search needs an internet connection.',
      noSpeech: 'Nothing was heard. Tap 🎤 and speak.', noFile: 'Couldn’t load the search file.',
      surah: 'Surah {0}', ayah: 'Surah {0}, ayah {1}'
    },
    es: {
      mic: 'Búsqueda por voz: recite una aleya o parte de ella, o diga «سورة» y el nombre de la sura', stop: 'Dejar de escuchar',
      listening: 'Escuchando… recite una aleya o parte de ella, o diga: سورة الكهف', heard: 'Se oyó: «{0}»',
      none: 'No encontré «{0}» en el Corán. Toque 🎤 e inténtelo de nuevo.', part: 'Se oyó: «{0}», no se encontró entero; estos son los lugares de «{1}».',
      noMic: 'Permita al navegador usar el micrófono.', noNet: 'La búsqueda por voz necesita conexión a internet.',
      noSpeech: 'No se oyó nada. Toque 🎤 y hable.', noFile: 'No se pudo cargar el archivo de búsqueda.',
      surah: 'Sura {0}', ayah: 'Sura {0}, aleya {1}'
    }
  };
  function lang() { var u = de.getAttribute('data-ui'); return u === 'en' || u === 'es' ? u : 'ar'; }
  function T(k) { return TX[lang()][k]; }
  function fmt(s) { var a = arguments; return String(s).replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1]; }); }
  function nm(n) { return lang() === 'ar' ? String(n).replace(/[0-9]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.charAt(+d); }) : String(n); }
  function iso(t) { return lang() === 'ar' ? t : '⁨' + t + '⁩'; }
  function pad(s) { s = String(s); while (s.length < 3) s = '0' + s; return s; }

  // ---------------------------------------------------------------- the words heard
  /* the recognizer's text without marks, tatweel and punctuation, with Western digits */
  function plain(t) {
    return String(t || '').replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
      .replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x660); })
      .replace(/[۰-۹]/g, function (d) { return String(d.charCodeAt(0) - 0x6F0); })
      .replace(/[^ء-غف-يٱ-ۓ0-9A-Za-z\s]/g, ' ')
      .replace(/\s+/g, ' ').replace(/^ | $/g, '');
  }
  /* for names and commands: hamza seats, ta marbuta and alif maqsura folded */
  function fold(t) {
    return plain(t).replace(/[أإآٱ]/g, 'ا').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/ء/g, '').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
  }
  function words(t) { return t ? t.split(' ') : []; }

  // ---------------------------------------------------------------- commands: «سورة …»
  var ALIAS = {
    1: ['الحمد', 'فاتحة الكتاب', 'أم الكتاب', 'أم القرآن', 'السبع المثاني'], 9: ['براءة'], 17: ['بني إسرائيل', 'سبحان'],
    20: ['طاها', 'طا ها'], 23: ['المؤمنين'], 36: ['ياسين', 'يا سين', 'يسن'], 38: ['صاد'], 40: ['المؤمن'], 41: ['حم السجدة'],
    47: ['القتال'], 50: ['قاف'], 54: ['اقتربت'], 55: ['الرحمان'], 63: ['المنافقين'], 67: ['تبارك'], 68: ['ن', 'نون', 'ن والقلم'],
    76: ['الإنسان', 'الدهر', 'هل أتى'], 78: ['النبأ', 'عم', 'عم يتساءلون'], 83: ['التطفيف'], 87: ['سبح'], 88: ['هل أتاك'],
    94: ['الانشراح', 'ألم نشرح'], 96: ['اقرأ'], 98: ['لم يكن'], 99: ['الزلزال', 'إذا زلزلت'], 106: ['لإيلاف', 'الإيلاف'],
    107: ['أرأيت'], 109: ['الكافرين'], 110: ['إذا جاء نصر الله', 'إذا جاء'], 111: ['تبت', 'اللهب', 'أبي لهب', 'أبو لهب'],
    112: ['التوحيد', 'قل هو الله أحد']
  };
  function key(n) { n = fold(n).replace(/ /g, ''); return n.length > 3 && n.indexOf('ال') === 0 ? n.slice(2) : n; }
  var NAMES = null;
  function names(HS) {
    if (NAMES) return NAMES;
    NAMES = [];
    for (var s = 1; s <= 114; s++) NAMES.push([key(HS.names[s - 1]), s]);
    for (var k in ALIAS) if (ALIAS.hasOwnProperty(k)) ALIAS[k].forEach(function (n) { NAMES.push([key(n), +k]); });
    return NAMES;
  }
  function near(a, b) {                                // at most one letter added, dropped or changed
    if (Math.abs(a.length - b.length) > 1) return false;
    var i = 0, j = 0, d = 0;
    while (i < a.length && j < b.length) {
      if (a.charAt(i) === b.charAt(j)) { i++; j++; continue; }
      if (++d > 1) return false;
      if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
    }
    return d + (a.length - i) + (b.length - j) <= 1;
  }
  function surahOf(HS, name) {
    var k = key(name), L = names(HS), i, hit = 0;
    if (!k) return 0;
    for (i = 0; i < L.length; i++) if (L[i][0] === k) return L[i][1];
    if (k.length < 5) return 0;
    for (i = 0; i < L.length; i++) if (L[i][0].length >= 4 && near(L[i][0], k)) { if (hit && hit !== L[i][1]) return 0; hit = L[i][1]; }
    return hit;
  }
  var CMD = /^(?:(?:افتح(?: ?لي)?|افتحي|اذهب(?:ي)?(?: الي)?|روح(?: (?:الي|علي))?|انتقل(?: الي)?|اعرض(?:ي)?|هات|شغل|اقرا|ابحث عن) )?(?:ال)?سوره (.+)$/;
  function command(HS, text) {
    var m = CMD.exec(fold(text)), w, k, s = 0, a = 0, rest = [], i;
    if (!m) return null;
    w = words(m[1].replace(/^رقم /, ''));
    if (/^\d{1,3}$/.test(w[0])) { s = +w[0]; rest = w.slice(1); }
    else for (k = Math.min(4, w.length); k >= 1 && !s; k--) { s = surahOf(HS, w.slice(0, k).join(' ')); if (s) rest = w.slice(k); }
    if (!s || s > 114) return null;
    for (i = 0; i < rest.length; i++) if (/^\d{1,3}$/.test(rest[i])) { a = +rest[i]; break; }
    if (a > HS.n[s - 1]) a = 0;
    return { kind: 'surah', s: s, a: a };
  }

  // ---------------------------------------------------------------- ayat
  var ISTI = /^اعوذ بالله (?:السميع العليم )?من الشيطان الرجيم ?/, BASM = /^بسم الله الرحمن الرحيم /, SADAQ = / صدق الله العظيم$/;
  function strip(q) {                                   // without a leading isti'adha and basmalah, or a closing صدق الله العظيم
    var f = fold(q), w = words(q), m = ISTI.exec(f), n = 0, e = 0;
    if (m) { n = words(m[0].replace(/ $/, '')).length; f = words(f).slice(n).join(' '); }
    if (BASM.test(f)) n += 4;
    if (SADAQ.test(f)) e = 3;
    return n || e ? w.slice(n, w.length - e).join(' ') : q;
  }
  var SUR = null;
  function surahTexts(HS) {                             // each surah's ayat as one text, with where each ayah starts
    if (SUR) return SUR;
    SUR = [];
    for (var s = 1; s <= 114; s++) {
      var g0 = HS.gidx(s, 1), n = HS.n[s - 1], parts = [], off = [], pos = 0, t;
      for (var a = 0; a < n; a++) { t = HS.text(g0 + a); off.push(pos); parts.push(t); pos += t.length + 1; }
      SUR[s] = { t: parts.join(' '), off: off, g0: g0 };
    }
    return SUR;
  }
  function across(HS, q) {                              // matches that run from one ayah into the next
    var S = surahTexts(HS), out = { ayat: [], spans: [], n: 0, occ: 0, across: true }, seen = {}, s, sp, i, o, lo, hi, md, g, st, len;
    for (s = 1; s <= 114; s++) {
      sp = HS.find(q, S[s].t);
      for (i = 0; i < sp.length; i += 2) {
        o = S[s].off; lo = 0; hi = o.length - 1;
        while (lo < hi) { md = (lo + hi + 1) >> 1; if (o[md] <= sp[i]) lo = md; else hi = md - 1; }
        g = S[s].g0 + lo; st = sp[i] - o[lo]; len = HS.text(g).length;
        out.occ++;
        if (seen[g] === undefined) { seen[g] = out.ayat.length; out.ayat.push(g); out.spans.push([]); }
        out.spans[seen[g]].push(st, Math.min(sp[i + 1] - o[lo], len));
      }
    }
    out.n = out.ayat.length;
    return out;
  }
  function longest(HS, q) {                            // the longest run of the words heard that is found
    var w = words(q), best = null, n, k, sub, r;
    if (w.length > 16) w = w.slice(0, 16);
    for (n = w.length - 1; n >= 2 && !best; n--)
      for (k = 0; k + n <= w.length; k++) {
        sub = w.slice(k, k + n).join(' ');
        if (HS.compile(sub).n < 6) continue;
        r = HS.search(sub);
        if (r.n && !r.ref && (!best || r.n < best.r.n)) best = { q: sub, r: r, cover: n / w.length };
      }
    return best;
  }
  function found(HS, q, r, exact, cover, heard) {
    if (r.ref) return { kind: 'ayah', s: r.ref[0], a: r.ref[1], q: '', exact: true, heard: heard };
    if (r.n === 1 && (exact || (cover >= 0.6 && words(q).length >= 3))) {
      var sa = HS.ref(r.ayat[0]), h = q;
      if (r.across) h = HS.text(r.ayat[0]).slice(r.spans[0][0], r.spans[0][1]);   // the words of the match in its first ayah
      return { kind: 'ayah', s: sa[0], a: sa[1], q: h, exact: exact, heard: heard };
    }
    return { kind: 'list', q: q, r: r, exact: exact, heard: heard };
  }
  /* what to do with the recognizer's alternatives (the most likely first) */
  function decide(HS, alts) {
    var i, c, r, full = [], bare = [], heard = plain(alts[0] || ''), q;
    for (i = 0; i < alts.length; i++) { c = command(HS, alts[i]); if (c) return c; }
    for (i = 0; i < alts.length; i++) {
      q = plain(alts[i]); if (q && full.indexOf(q) < 0) full.push(q);
      q = strip(q); if (q && q !== plain(alts[i]) && bare.indexOf(q) < 0) bare.push(q);
    }
    function pass(list) {
      var j;
      for (j = 0; j < list.length; j++) { r = HS.search(list[j]); if (r.n || r.ref) return found(HS, list[j], r, true, 1, heard); }
      for (j = 0; j < list.length && j < 2; j++) { r = across(HS, list[j]); if (r.n) return found(HS, list[j], r, true, 1, heard); }
      return null;
    }
    var d = pass(full) || pass(bare), best;
    if (d) return d;
    best = longest(HS, bare[0] || full[0] || '');
    if (best) return found(HS, best.q, best.r, false, best.cover, heard);
    return { kind: 'none', heard: heard };
  }

  // ---------------------------------------------------------------- the search file
  var loading = null;
  function engine() {
    if (window.HIFZ_SEARCH) return Promise.resolve(window.HIFZ_SEARCH);
    if (window.HifzRefs && window.HifzRefs.engine)
      return new Promise(function (ok) { window.HifzRefs.engine(function (h) { ok(h || null); }); });
    if (!loading) loading = new Promise(function (ok) {
      var sc = document.createElement('script');
      sc.src = ROOT + 'packages/hifz-search.js';
      sc.onload = function () { ok(window.HIFZ_SEARCH || null); };
      sc.onerror = function () { loading = null; ok(null); };
      document.head.appendChild(sc);
    });
    return loading;
  }

  // ---------------------------------------------------------------- doing it
  function href(HS, s, a, q) {
    return ROOT + 'packages/' + pad(s) + '-package/' + encodeURIComponent(HS.files[s - 1]) +
      (a ? '#a=' + s + ':' + a + (q ? '&h=' + encodeURIComponent(q) : '') : '');
  }
  function go(u) { location.href = u; }
  function act(HS, d, box) {
    var nm1 = d.s ? iso(HS.names[d.s - 1]) : '';
    if (d.kind === 'surah') {
      toast(d.a ? fmt(T('ayah'), nm1, nm(d.a)) : fmt(T('surah'), nm1));
      if (d.s === CUR) {
        if (d.a && window.HifzRefs) window.HifzRefs.show(d.s, d.a, '');
        else { var top = document.getElementById('top'); if (top) top.scrollIntoView(); }
        box.value = '';
        return;
      }
      go(href(HS, d.s, d.a, ''));
      return;
    }
    if (d.kind === 'ayah') {
      box.value = d.q && !/[ً-ْٰ]/.test(d.q) ? d.q : d.heard;
      toast(fmt(T('ayah'), nm1, nm(d.a)));
      if (CUR && window.HifzRefs) { window.HifzRefs.show(d.s, d.a, d.q); return; }
      go(href(HS, d.s, d.a, d.q));
      return;
    }
    if (d.kind === 'list') {
      var note = d.exact ? '' : fmt(T('part'), iso(d.heard), iso(d.q));
      if (CUR && window.HifzRefs) { window.HifzRefs.list(d.q, d.r); toast(note, note ? { ms: 10000 } : null); return; }
      if (window.HifzHome && window.HifzHome.voice) { toast(''); window.HifzHome.voice(d.q, d.r, note); return; }
    }
    box.value = d.heard;
    toast(fmt(T('none'), iso(d.heard)), { bad: true, ms: 9000 });
  }

  // ---------------------------------------------------------------- listening
  var toastEl = null, toastT = 0, rec = null, MICS = [];
  function toast(t, o) {
    o = o || {};
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'vc-toast ui'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); toastEl.hidden = true;
      document.body.appendChild(toastEl);
    }
    clearTimeout(toastT);
    if (!t) { toastEl.hidden = true; return; }
    toastEl.textContent = t; toastEl.hidden = false;
    toastEl.classList.toggle('bad', !!o.bad);
    toastEl.setAttribute('dir', lang() === 'ar' ? 'rtl' : 'ltr');
    if (!o.stay) toastT = setTimeout(function () { toastEl.hidden = true; }, o.ms || 5000);
  }
  function paint() {
    MICS.forEach(function (b) {
      var t = rec ? T('stop') : T('mic');
      b.title = t; b.setAttribute('aria-label', t); b.setAttribute('aria-pressed', rec ? 'true' : 'false');
      b.classList.toggle('on', !!(rec && rec.btn === b));
    });
  }
  function pausePlayer() {
    var P = window.HifzPlayer;
    try { if (P && P.state) { var st = P.state(); if (st.running && !st.paused) P.toggle(); } } catch (e) {}
  }
  function listen(btn, box) {
    if (!SR) return;
    if (rec) { try { rec.r.stop(); } catch (e) {} return; }
    pausePlayer();
    engine();                                           // the search file loads while he speaks
    var r = new SR(), got = [], err = '', keep = box.value, me = { r: r, btn: btn };
    rec = me;
    r.lang = 'ar-SA'; r.continuous = false; r.interimResults = true; r.maxAlternatives = 5;
    r.onresult = function (e) {
      if (rec !== me) return;
      var interim = '', i, j, x, alts, said;
      got = [];
      for (i = 0; i < e.results.length; i++) {
        x = e.results[i];
        if (x.isFinal) { alts = []; for (j = 0; j < x.length; j++) if (x[j] && x[j].transcript) alts.push(x[j].transcript); if (alts.length) got.push(alts); }
        else if (x[0]) interim += ' ' + x[0].transcript;
      }
      said = plain(got.map(function (a) { return a[0]; }).join(' ') + interim);
      if (said) { box.value = said; toast(fmt(T('heard'), iso(said)), { stay: true }); }
    };
    r.onerror = function (e) { if (rec === me) err = (e && e.error) || 'error'; };
    r.onend = function () {
      if (rec !== me) return;
      rec = null; paint();
      if (err === 'not-allowed' || err === 'service-not-allowed' || err === 'audio-capture') { box.value = keep; toast(T('noMic'), { bad: true, ms: 8000 }); return; }
      if (err === 'network') { box.value = keep; toast(T('noNet'), { bad: true, ms: 8000 }); return; }
      if (!got.length) { box.value = keep; toast(err === 'aborted' ? '' : T('noSpeech'), { bad: true }); return; }
      var alts = got.length === 1 ? got[0] : [got.map(function (a) { return a[0]; }).join(' ')];
      engine().then(function (HS) {
        if (!HS) { toast(T('noFile'), { bad: true }); return; }
        act(HS, decide(HS, alts), box);
      });
    };
    try { r.start(); } catch (x) { rec = null; paint(); toast(T('noSpeech'), { bad: true }); return; }
    paint();
    toast(T('listening'), { stay: true });
  }

  // ---------------------------------------------------------------- the buttons
  function mic(box, cls) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'vc-mic ' + cls; b.textContent = '🎤';
    b.addEventListener('click', function () { listen(b, box); });
    MICS.push(b);
    return b;
  }
  function mount() {
    if (!SR) return;
    var q = document.getElementById('q');
    if (q && q.closest && q.closest('.home .find')) {        // the home page
      var w = document.createElement('span');
      w.className = 'vc-wrap';
      q.parentNode.insertBefore(w, q); w.appendChild(q); w.appendChild(mic(q, 'vc-home'));
    }
    var box = document.querySelector('.tools .hs-box'), inp = box && box.querySelector('.hs-q');   // a surah file
    if (inp) { box.classList.add('vc'); box.appendChild(mic(inp, 'vc-bar')); }
    paint();
    if (window.hifzUI && window.hifzUI.on) window.hifzUI.on(function () { paint(); if (toastEl) toastEl.hidden = true; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();

  window.HifzVoice = {
    supported: function () { return !!SR; },
    mics: function () { return MICS.slice(); },
    command: function (t) { return engine().then(function (HS) { return HS ? command(HS, t) : null; }); },
    decide: function (alts) { return engine().then(function (HS) { return HS ? decide(HS, alts) : null; }); },
    listen: function (i) { var b = MICS[i || 0]; if (b) b.click(); }
  };
})();
