/* Hifz web app: the practice player of a surah file (mode 'web' of tools/make_book.py), 2026-10-12.
   Plays the surah's recording — the copy saved on this device, else its address (app/core.js) —
   between cut times: the ledger's at the segment seams, and tools/ayah_cuts.py's (the middle of
   the pause after every ayah) inside the segments (data "a" of tools/app_data.py).
   What it plays (the bar at the bottom; ⚙ opens the practice panel):
     range     this segment, its unit, the page, the quarter-ḥizb, the whole surah, any ayah to any
               ayah, or the ayat marked as slips (app/test.js)
     repeat    the range 1, 2, 3, 5, 7, 10 or 20 times, any typed count up to 99, or without end
     drill     each ayah N times before the range; chaining: 1, 1–2, 1–3 … ; link: the range
               starts with the last ayah before it (the junction with the previous segment)
     gaps      after every play a silence as long as it (×1, ×1.5, ×2) to recite it back
     speed     0.75–1.25 with the pitch kept; a sleep timer
   While it plays: the word being recited is lit (QUL's word timings, data "w"), the page follows
   it, a tap on a word plays from that word to the end of its segment, Focus shows one ayah at a
   time in large print, the lock screen's controls work (Media Session), and the screen stays on
   (Wake Lock) when the display setting asks for it.
   A play stops by a timer at its cut, or at the first timeupdate within 0.025 s of it (0.125 s
   while the page is hidden and the browser may hold timers back): inside the pause either way.
   window.HifzPlayer for the tests and the other scripts; window.HifzPage() = the page in view.
   Interface text in three languages, following the switch of tools/ui.py (window.hifzUI). */
(function () {
  'use strict';
  var Au = window.HifzAudio, W = window.HifzWords;
  if (!Au || !W) return;
  var D = W.D, S = D.s, N = D.n, AT = D.a, de = document.documentElement;
  var WT = D.w.map(function (r) {
    var b = r[0] / 1000, out = [];
    for (var j = 1; j + 2 < r.length; j += 3) out.push([r[j], b + r[j + 1] / 100, b + r[j + 2] / 100]);
    return out;
  });
  var STEM = {};
  [].forEach.call(document.querySelectorAll('section.seg .player .play[data-k]'), function (b) {
    STEM[+b.closest('section').id.slice(1)] = b.getAttribute('data-k');
  });
  function segById(id) { for (var i = 0; i < D.g.length; i++) if (D.g[i][0] === id) return D.g[i]; return null; }

  // ---------------------------------------------------------------- text in three languages
  function lang() { var u = de.getAttribute('data-ui'); return u === 'en' || u === 'es' ? u : 'ar'; }
  function nm(n) { return lang() === 'ar' ? String(n).replace(/[0-9]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.charAt(+d); }) : String(n); }
  function fmt(s) { var a = arguments; return String(s).replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1]; }); }
  function rng(a, b) { return a === b ? nm(a) : nm(a) + '–' + nm(b); }
  var TX = {
    ar: {
      player: 'المشغّل', play: 'تشغيل', pause: 'إيقاف مؤقت', prev: 'الآية السابقة', next: 'الآية التالية', settings: 'إعدادات التسميع',
      rep: 'عدد مرات التكرار', repN: 'عدد آخر (١–٩٩)', inf: '∞', seg: 'المقطع {0}', unit: 'الوحدة {0}', page: 'ص {0} · {1}', quarter: 'ربع الحزب {0}',
      surah: 'السورة كاملة', custom: 'من آية إلى آية', slips: 'آيات تعثّرت فيها ({0})', here: 'من هذه الكلمة',
      ayat: 'الآيات {0}', ayah: 'الآية {0}', R: 'يمين', L: 'يسار',
      round: 'المرة {0} من {1}', roundInf: 'المرة {0}', drill: 'الآية {0} · {1} من {2}', chain: 'حتى الآية {0} · {1} من {2}',
      gap: 'دورك: ردّد الآن · {0} ث', done: 'انتهى', sleeping: 'مؤقت النوم: يتوقف بعد {0} د',
      t_range: 'ماذا أسمع', t_rep: 'كرّر المقطع المختار', t_drill: 'كل آية قبل ذلك', t_gap: 'مهلة لأردّد بعد كل تلاوة',
      t_speed: 'السرعة', t_sleep: 'مؤقت النوم', t_more: 'أثناء التلاوة', off: 'لا', min: '{0} د',
      chain2: 'التراكم: ١، ١–٢، ١–٣ …', link: 'الربط: ابدأ بآخر آية قبله', follow: 'تظليل الكلمة المتلوّة', scroll: 'متابعة الصفحة للتلاوة',
      tap: 'لمس كلمة يبدأ التلاوة منها', from: 'من الآية', to: 'إلى الآية', start: 'ابدأ', close: 'إغلاق',
      weak: 'آيات تعثّرت فيها: {0}', drillWeak: 'درّبني عليها', clearWeak: 'امسحها', sure: 'اضغط مرة أخرى للمسح', noWeak: 'لا آيات معلَّمة بعد. في وضع الاختبار تُعلَّم الآية التي احتجت فيها إلى تلميح.',
      x1: '×١', x15: '×١٫٥', x2: '×٢', err: 'تعذّر التشغيل: لا اتصال، وهذه السورة غير محفوظة على هذا الجهاز. احفظها من الصفحة الرئيسية.',
      focus: 'تركيز', fclose: 'إغلاق', fprev: 'الآية السابقة', fnext: 'الآية التالية', joined: 'يصل القارئ هذه الآية بما بعدها دون وقف',
      reciter: 'محمد صديق المنشاوي', surahN: 'سورة {0}'
    },
    en: {
      player: 'Player', play: 'Play', pause: 'Pause', prev: 'Previous ayah', next: 'Next ayah', settings: 'Practice settings',
      rep: 'Repeat count', repN: 'Another number (1–99)', inf: '∞', seg: 'Segment {0}', unit: 'Unit {0}', page: 'p. {0} · {1}', quarter: 'Quarter-ḥizb {0}',
      surah: 'Whole surah', custom: 'Ayah to ayah', slips: 'Ayat I slipped on ({0})', here: 'From this word',
      ayat: 'Ayat {0}', ayah: 'Ayah {0}', R: 'right', L: 'left',
      round: 'Time {0} of {1}', roundInf: 'Time {0}', drill: 'Ayah {0} · {1} of {2}', chain: 'Up to ayah {0} · {1} of {2}',
      gap: 'Your turn: recite now · {0} s', done: 'Finished', sleeping: 'Sleep timer: stops in {0} min',
      t_range: 'What to play', t_rep: 'Repeat the chosen range', t_drill: 'Each ayah first', t_gap: 'Pause to recite after each play',
      t_speed: 'Speed', t_sleep: 'Sleep timer', t_more: 'While it plays', off: 'Off', min: '{0} min',
      chain2: 'Chaining: 1, 1–2, 1–3 …', link: 'Link: start with the ayah before', follow: 'Highlight the word being recited',
      scroll: 'Keep the recited text in view', tap: 'Tap a word to play from it', from: 'From ayah', to: 'To ayah', start: 'Start', close: 'Close',
      weak: 'Ayat I slipped on: {0}', drillWeak: 'Drill them', clearWeak: 'Clear them', sure: 'Tap again to clear', noWeak: 'No ayat marked yet. In test mode, an ayah is marked when you needed a hint in it.',
      x1: '×1', x15: '×1.5', x2: '×2', err: "Can't play: offline, and this surah isn't saved on this device. Save it from the home page.",
      focus: 'Focus', fclose: 'Close', fprev: 'Previous ayah', fnext: 'Next ayah', joined: 'The reciter joins this ayah to the next without a pause',
      reciter: 'Muḥammad Ṣiddīq al-Minshāwī', surahN: 'Surah {0}'
    },
    es: {
      player: 'Reproductor', play: 'Reproducir', pause: 'Pausa', prev: 'Aleya anterior', next: 'Aleya siguiente', settings: 'Ajustes de práctica',
      rep: 'Número de repeticiones', repN: 'Otro número (1–99)', inf: '∞', seg: 'Segmento {0}', unit: 'Unidad {0}', page: 'pág. {0} · {1}', quarter: 'Cuarto de ḥizb {0}',
      surah: 'Sura completa', custom: 'De aleya a aleya', slips: 'Aleyas en que tropecé ({0})', here: 'Desde esta palabra',
      ayat: 'Aleyas {0}', ayah: 'Aleya {0}', R: 'derecha', L: 'izquierda',
      round: 'Vez {0} de {1}', roundInf: 'Vez {0}', drill: 'Aleya {0} · {1} de {2}', chain: 'Hasta la aleya {0} · {1} de {2}',
      gap: 'Su turno: recite ahora · {0} s', done: 'Terminado', sleeping: 'Temporizador: se detiene en {0} min',
      t_range: 'Qué reproducir', t_rep: 'Repetir el tramo elegido', t_drill: 'Antes, cada aleya', t_gap: 'Pausa para recitar tras cada vez',
      t_speed: 'Velocidad', t_sleep: 'Temporizador', t_more: 'Durante la recitación', off: 'No', min: '{0} min',
      chain2: 'Encadenar: 1, 1–2, 1–3 …', link: 'Enlace: empezar por la aleya anterior', follow: 'Resaltar la palabra recitada',
      scroll: 'Mantener a la vista el texto recitado', tap: 'Tocar una palabra reproduce desde ella', from: 'Desde la aleya', to: 'Hasta la aleya',
      start: 'Empezar', close: 'Cerrar',
      weak: 'Aleyas en que tropecé: {0}', drillWeak: 'Practicarlas', clearWeak: 'Borrarlas', sure: 'Toque de nuevo para borrar', noWeak: 'Aún no hay aleyas marcadas. En el modo de prueba se marca la aleya en que necesitó una pista.',
      x1: '×1', x15: '×1,5', x2: '×2', err: 'No se puede reproducir: sin conexión y esta sura no está guardada en este dispositivo. Guárdela desde la página principal.',
      focus: 'Enfoque', fclose: 'Cerrar', fprev: 'Aleya anterior', fnext: 'Aleya siguiente', joined: 'El recitador une esta aleya a la siguiente sin pausa',
      reciter: 'Muḥammad Ṣiddīq al-Minshāwī', surahN: 'Sura {0}'
    }
  };
  function T(k) { return TX[lang()][k]; }
  var SNAME = (document.querySelector('.idx h1') || {}).textContent || '';

  // ---------------------------------------------------------------- settings (this device)
  var PK = 'hifz-practice';
  var P = { rep: 1, drill: 0, chain: false, gap: 0, link: false, rate: 1, sleep: 0, follow: true, scroll: true, tap: true };
  try { var sv = JSON.parse(localStorage.getItem(PK) || '{}'); for (var k in P) if (sv && sv[k] !== undefined) P[k] = sv[k]; } catch (e) {}
  function saveP() { try { localStorage.setItem(PK, JSON.stringify(P)); } catch (e) {} }
  var REPS = [1, 2, 3, 5, 7, 10, 20, 0], DRILLS = [0, 2, 3, 5, 7, 10], GAPS = [0, 1, 1.5, 2], RATES = [0.75, 0.85, 1, 1.15, 1.25], SLEEPS = [0, 10, 20, 30, 60];

  // ---------------------------------------------------------------- where things are
  function ayahAt(t) {
    var lo = 0, hi = N - 1;
    if (t < AT[0][0]) return 1;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (AT[mid][0] <= t) lo = mid; else hi = mid - 1; }
    return lo + 1;
  }
  function wordAt(a, t) {
    var w = WT[a - 1], best = 0;
    if (!w || !w.length || t < w[0][1] - 0.05) return 0;
    for (var j = 0; j < w.length; j++) { if (w[j][1] - 0.05 <= t) best = w[j][0]; else break; }
    return best;
  }
  function wordTime(a, i) { var w = WT[a - 1] || []; for (var j = 0; j < w.length; j++) if (w[j][0] === i) return w[j][1]; return AT[a - 1][0]; }
  function toolsH() { var t = document.querySelector('.tools'); return t ? t.getBoundingClientRect().height : 0; }
  function inView() {           // the first ayah of the first segment in view
    var top = toolsH() + 30, secs = document.querySelectorAll('section.seg');
    for (var i = 0; i < secs.length; i++) {
      var r = secs[i].getBoundingClientRect();
      if (r.bottom > top + 40) {
        var ws = secs[i].querySelectorAll('.quran .wd[data-a]');
        for (var j = 0; j < ws.length; j++) { var q = ws[j].getBoundingClientRect(); if (q.bottom > top) return +ws[j].getAttribute('data-a'); }
        var g = segById(+secs[i].id.slice(1)); return g ? g[1] : 1;
      }
    }
    return 1;
  }
  function ctxAyah() { return run && !run.idle ? curA || run.plan[0].a0 : inView(); }

  // ---------------------------------------------------------------- ranges
  var R = null;     // {kind, a0, a1, id, list, t0}
  function rangeOf(kind, a) {
    var g = W.segOf(a) || D.g[0];
    if (kind === 'seg') return { kind: 'seg', a0: g[1], a1: g[2], id: g[0] };
    if (kind === 'unit') {
      var us = D.g.filter(function (x) { return x[3] === g[3]; });
      return { kind: 'unit', a0: us[0][1], a1: us[us.length - 1][2], id: g[3] };
    }
    if (kind === 'page') {
      var p = W.pageOf(a), nx = N + 1;
      D.p.forEach(function (e) { if (e[1] > p[1] && e[1] < nx) nx = e[1]; });
      return { kind: 'page', a0: Math.max(1, D.p[0] === p ? 1 : p[1]), a1: nx - 1, id: p[0], side: p[2] };
    }
    if (kind === 'quarter') {
      var q0 = null, a0 = 1, a1 = N, qi = 0;
      D.q.forEach(function (e) { if (e[1] <= a) { q0 = e; a0 = e[1]; qi = e[0]; } });
      D.q.forEach(function (e) { if (e[1] > a && e[1] - 1 < a1) a1 = e[1] - 1; });
      return { kind: 'quarter', a0: a0, a1: a1, id: qi || (q0 ? q0[0] : 0) };
    }
    if (kind === 'surah') return { kind: 'surah', a0: 1, a1: N };
    return null;
  }
  function rangeLabel(r) {
    if (!r) return '';
    var ay = r.a0 === r.a1 ? fmt(T('ayah'), nm(r.a0)) : fmt(T('ayat'), rng(r.a0, r.a1));
    switch (r.kind) {
      case 'seg': return fmt(T('seg'), nm(r.id)) + ' · ' + ay;
      case 'unit': return fmt(T('unit'), nm(r.id)) + ' · ' + ay;
      case 'page': return fmt(T('page'), nm(r.id), T(r.side)) + ' · ' + ay;
      case 'quarter': return (r.id ? fmt(T('quarter'), nm(r.id)) + ' · ' : '') + ay;
      case 'surah': return T('surah');
      case 'slips': return fmt(T('slips'), nm(r.list.length));
      case 'here': return T('here') + ' · ' + ay;
      default: return ay;
    }
  }

  // ---------------------------------------------------------------- the plan
  function dur(x0, x1) { return AT[x1 - 1][1] - AT[x0 - 1][0]; }
  function buildPlan(r) {
    var steps = [], loop = -1;
    function play(x0, x1, kind, n, of, t0) {
      steps.push({ t0: t0 !== undefined ? t0 : AT[x0 - 1][0], t1: AT[x1 - 1][1], a0: x0, a1: x1, kind: kind, n: n, of: of });
      if (P.gap > 0 && kind !== 'here') steps.push({ gap: Math.min(120, P.gap * dur(x0, x1) / (P.rate || 1)), a0: x0, a1: x1 });
    }
    if (r.kind === 'here') { play(r.a0, r.a1, 'here', 1, 1, r.t0); return { steps: steps, loop: -1 }; }
    if (r.kind === 'slips') {
      var times = Math.max(1, P.drill || 1);
      r.list.forEach(function (x) { for (var i = 1; i <= times; i++) play(x, x, 'drill', i, times); });
      if (P.rep === 0) loop = 0;
      return { steps: steps, loop: loop };
    }
    var a0 = r.a0, a1 = r.a1, lead = P.link && a0 > 1 ? a0 - 1 : a0, times2 = Math.max(1, P.drill || 1);
    if (P.chain) {
      for (var k = a0; k <= a1; k++) for (var i = 1; i <= times2; i++) play(a0, k, 'chain', i, times2);
    } else if (P.drill > 0) {
      for (var k2 = a0; k2 <= a1; k2++) for (var j = 1; j <= P.drill; j++) play(k2, k2, 'drill', j, P.drill);
    }
    if (P.rep === 0) { loop = steps.length; play(lead, a1, 'range', 1, 0); }
    else for (var m = 1; m <= P.rep; m++) play(lead, a1, 'range', m, P.rep);
    if (loop < 0 && steps.length && steps[steps.length - 1].gap !== undefined) steps.pop();
    return { steps: steps, loop: loop };
  }

  // ---------------------------------------------------------------- audio
  var au = new Audio(), src = null, run = null, timer = 0, gapTimer = 0, seeking = false, curA = 0, curW = null, lockedA = [];
  au.preload = 'auto';
  try { au.preservesPitch = true; } catch (e) {}
  function pad(s) { s = String(s); while (s.length < 3) s = '0' + s; return s; }
  function now() { return au.currentTime + (src ? src.off : 0); }
  function source(r) {
    return Au.get('surah:' + pad(S)).then(function (b) {
      if (b) return { url: URL.createObjectURL(b), key: 'surah', off: 0, blob: true };
      var g = W.segOf(r.a0);
      var inOne = g && r.kind !== 'slips' && W.segOf(r.a1) === g && (!P.link || r.a0 > g[1]);
      var online = navigator.onLine !== false;
      if (online || !inOne) return { url: Au.url(S), key: 'url', off: 0, blob: false, alt: inOne ? g : null };
      return Au.get('seg:' + STEM[g[0]]).then(function (b2) {
        return b2 ? { url: URL.createObjectURL(b2), key: 'seg:' + g[0], off: g[6], blob: true, lo: g[6], hi: g[7] }
                  : { url: Au.url(S), key: 'url', off: 0, blob: false };
      });
    });
  }
  function use(s) {
    return new Promise(function (ok, no) {
      if (src && src.key === s.key) { if (s.blob) URL.revokeObjectURL(s.url); src.alt = s.alt; ok(); return; }
      if (src && src.blob) URL.revokeObjectURL(src.url);
      src = s;
      var done = false;
      function fin(e) {
        if (done) return; done = true;
        au.removeEventListener('loadedmetadata', fin); au.removeEventListener('error', fin);
        if (e && e.type === 'error') no(e); else ok();
      }
      au.addEventListener('loadedmetadata', fin); au.addEventListener('error', fin);
      au.src = s.url; au.load();
    });
  }
  function clearTimers() { clearTimeout(timer); clearTimeout(gapTimer); timer = gapTimer = 0; }
  function live() { return !!run && !run.idle && !run.paused; }
  function stepNow() { return run && !run.idle ? run.plan[run.i] : null; }
  function schedule() {
    clearTimeout(timer); timer = 0;
    var st = stepNow();
    if (!live() || !st || st.gap !== undefined || au.paused || seeking) return;
    var left = (st.t1 - now()) / (au.playbackRate || 1);
    timer = setTimeout(check, Math.max(0, left * 1000 - 20));
  }
  function check() {
    var st = stepNow();
    if (!live() || !st || st.gap !== undefined || seeking) return;
    var early = document.hidden ? 0.125 : 0.025;
    if (now() >= st.t1 - early) next(); else schedule();
  }
  var seekGuard = 0;
  function seekTo(t) {
    var x = Math.max(0, t - (src ? src.off : 0));
    if (Math.abs(au.currentTime - x) < 0.04) return;
    seeking = true;
    clearTimeout(seekGuard);
    seekGuard = setTimeout(function () { if (seeking) { seeking = false; schedule(); } }, 3000);   // a seek that never reports back
    try { au.currentTime = x; } catch (e) { seeking = false; }
  }
  au.addEventListener('seeked', function () { seeking = false; schedule(); follow(true); });
  au.addEventListener('timeupdate', function () { if (live()) { check(); follow(); } });
  au.addEventListener('playing', function () { schedule(); paint(); });
  au.addEventListener('pause', function () { clearTimeout(timer); paint(); });
  au.addEventListener('ratechange', schedule);
  au.addEventListener('ended', function () { if (live()) next(); });
  au.addEventListener('error', function () {
    if (!run || !src || src.key !== 'url') return;
    var alt = src.alt;
    if (alt && STEM[alt[0]]) {
      Au.get('seg:' + STEM[alt[0]]).then(function (b) {
        if (!b) return fail();
        use({ url: URL.createObjectURL(b), key: 'seg:' + alt[0], off: alt[6], blob: true, lo: alt[6], hi: alt[7] }).then(function () { go(run.i); }, fail);
      });
    } else fail();
  });
  function playAudio() {
    au.playbackRate = P.rate || 1;
    var pr = au.play();
    if (pr && pr.catch) pr.catch(function (e) { if (!e || e.name !== 'AbortError') { if (run) { run.paused = true; paint(); } } });
  }
  function go(i) {
    clearTimers();
    if (!run || run.idle) return;
    if (i >= run.plan.length) {
      if (run.loop >= 0) { run.round = (run.round || 1) + 1; i = run.loop; } else { finish(); return; }
    }
    run.i = i;
    var st = run.plan[i];
    if (st.gap !== undefined) {
      au.pause();
      run.gapEnd = Date.now() + st.gap * 1000;
      gapTimer = setTimeout(function () { go(i + 1); }, st.gap * 1000);
      paint(); tick();
      return;
    }
    if (src && src.lo !== undefined && (st.t0 < src.lo - 0.01 || st.t1 > src.hi + 0.01)) { fail(); return; }
    var t = now();
    if (au.paused || Math.abs(t - st.t0) > 0.12) seekTo(st.t0);
    playAudio(); schedule(); paint(); media(); follow(true);
  }
  function next() { if (live()) go(run.i + 1); }
  function finish() {
    clearTimers();
    au.pause();
    if (run) { var r = run.r; run = { idle: true, r: r, plan: run.plan, i: 0 }; }
    unlit(); paint(); awake(false);
    msg(T('done'));
  }
  function fail() {
    clearTimers(); au.pause();
    if (run) run.paused = true;
    msg(T('err'), true); paint();
  }
  function start(r) {
    if (!r) return;
    if (r.kind !== 'here') R = r;
    var b = buildPlan(r);
    if (!b.steps.length) return;
    clearTimers();
    run = { r: r, plan: b.steps, loop: b.loop, i: 0, paused: false, round: 1, sleepAt: P.sleep ? Date.now() + P.sleep * 60000 : 0 };
    msg('');
    var my = run;
    source(r).then(function (s) { return use(s); }).then(function () {
      if (run !== my) return;
      go(0); awake(true);
    }, function () { if (run === my) fail(); });
    paint();
  }
  function stop() { clearTimers(); au.pause(); run = null; unlit(); paint(); awake(false); }
  function toggle() {
    if (!run || run.idle) { start(R || rangeOf('seg', ctxAyah())); return; }
    if (run.paused) {
      run.paused = false; msg('');
      var st = stepNow();
      if (st && st.gap !== undefined) { go(run.i + 1); return; }
      if (st && (now() < st.t0 - 0.2 || now() > st.t1)) seekTo(st.t0);
      playAudio(); awake(true); paint();
    } else {
      run.paused = true; clearTimers(); au.pause(); paint(); awake(false);
    }
  }
  function jump(dir) {
    if (!run || run.idle) { var r = R || rangeOf('seg', ctxAyah()); start(r); return; }
    var st = stepNow(), t = now(), a = st && st.gap === undefined ? ayahAt(t) : (st ? st.a0 : 1);
    if (st && st.gap === undefined && st.a1 > st.a0) {
      var target = dir > 0 ? a + 1 : (t - AT[a - 1][0] > 1.5 ? a : a - 1);
      if (target >= st.a0 && target <= st.a1) {
        if (run.paused) { run.paused = false; playAudio(); }
        seekTo(AT[target - 1][0]); return;
      }
    }
    var pl = run.plan, j;
    if (dir > 0) { for (j = run.i + 1; j < pl.length; j++) if (pl[j].gap === undefined && pl[j].a1 > a) { run.paused = false; go(j); return; } }
    else {
      var want = -1;
      for (j = run.i - 1; j >= 0; j--) {
        if (pl[j].gap !== undefined) continue;
        if (pl[j].a0 < a) { want = j; var x0 = pl[j].a0; while (j - 1 >= 0 && (pl[j - 1].gap !== undefined || pl[j - 1].a0 === x0)) { j--; if (pl[j].gap === undefined) want = j; } break; }
      }
      if (want >= 0) { run.paused = false; go(want); return; }
      run.paused = false; go(run.i);
    }
  }

  // ---------------------------------------------------------------- follow-along
  var raf = 0, lastUser = 0;
  function unlit() {
    lockedA.forEach(function (e) { e.classList.remove('ca'); });
    lockedA = [];
    if (curW) curW.classList.remove('cw');
    curW = null; curA = 0;
    [].forEach.call(document.querySelectorAll('.player.playing'), function (p) { p.classList.remove('playing'); });
    if (fv) paintFocus();
  }
  function follow(force) {
    if (!run || run.idle) return;
    var st = stepNow(), t = st && st.gap !== undefined ? AT[st.a1 - 1][1] - 0.01 : now();
    var a = ayahAt(t);
    if (a !== curA) {
      lockedA.forEach(function (e) { e.classList.remove('ca'); });
      lockedA = P.follow ? W.words(a).slice() : [];
      lockedA.forEach(function (e) { e.classList.add('ca'); });
      curA = a;
      var g = W.segOf(a);
      [].forEach.call(document.querySelectorAll('section.seg .player'), function (p) {
        p.classList.toggle('playing', !!g && p.parentNode.id === 's' + (g[0] < 10 ? '0' : '') + g[0] && !run.paused);
      });
      if (fv && fv.follow) { fv.a = a; paintFocus(); }
      paintStat();
    }
    var i = st && st.gap !== undefined ? 0 : wordAt(a, t), w = P.follow && i ? W.word(a, i) : null;
    if (w !== curW || force) {
      if (curW) curW.classList.remove('cw');
      curW = w;
      if (w) { w.classList.add('cw'); if (P.scroll) keep(w); }
      else if (P.scroll && P.follow && W.words(a)[0]) keep(W.words(a)[0]);
      if (fv) litFocus(i);
    }
  }
  function keep(el) {
    if (Date.now() - lastUser < 6000 || (fv && !fv.hidden)) return;
    var r = el.getBoundingClientRect(), top = toolsH() + 12, bot = window.innerHeight - barH() - 16;
    if (r.top < top || r.bottom > bot) {
      var y = window.scrollY + r.top - (top + (bot - top) * 0.3);
      try { window.scrollTo({ top: y, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, y); }
    }
  }
  ['wheel', 'touchmove', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function (e) { if (ev !== 'keydown' || /Arrow|Page|Home|End/.test(e.key)) lastUser = Date.now(); }, { passive: true });
  });
  function loop() {
    raf = 0;
    if (!run || run.idle || run.paused) return;
    follow(); tick();
    raf = requestAnimationFrame(loop);
  }
  function tick() {
    if (!run || run.idle) return;
    if (run.sleepAt && Date.now() >= run.sleepAt) { sleepNow(); return; }
    paintStat();
  }
  setInterval(function () { if (run && !run.idle && !run.paused) { tick(); if (!raf && !document.hidden) raf = requestAnimationFrame(loop); } }, 500);
  function sleepNow() {
    run.sleepAt = 0;
    var v = au.volume, k = 0;
    var f = setInterval(function () {
      k++; au.volume = Math.max(0, v * (1 - k / 15));
      if (k >= 15) { clearInterval(f); stop(); au.volume = v; }
    }, 200);
  }

  // ---------------------------------------------------------------- wake lock, media session
  var lock = null;
  function awake(on) {
    var want = on && (!window.HifzView || window.HifzView.get().awake) && 'wakeLock' in navigator;
    if (want && !lock) {
      navigator.wakeLock.request('screen').then(function (l) { lock = l; l.addEventListener('release', function () { lock = null; }); }, function () {});
    } else if (!want && lock && !(window.HifzTest && window.HifzTest.active())) { try { lock.release(); } catch (e) {} lock = null; }
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && run && !run.idle && !run.paused) awake(true); });
  window.HifzAwake = awake;
  function media() {
    if (!('mediaSession' in navigator) || !window.MediaMetadata || !run) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: rangeLabel(run.r), artist: T('reciter'), album: SNAME.trim(),
        artwork: [{ src: Au.root + 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                  { src: Au.root + 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }] });
      var ms = navigator.mediaSession;
      ms.setActionHandler('play', function () { if (run && run.paused) toggle(); });
      ms.setActionHandler('pause', function () { if (run && !run.paused) toggle(); });
      ms.setActionHandler('previoustrack', function () { jump(-1); });
      ms.setActionHandler('nexttrack', function () { jump(1); });
    } catch (e) {}
  }

  // ---------------------------------------------------------------- the bar
  var bar = document.createElement('div');
  bar.className = 'pbar ui';
  bar.setAttribute('role', 'region');
  bar.innerHTML = '<div class="pb-in"><div class="pb-row">' +
    '<button type="button" class="pb-b pb-prev" data-a="prev">⏮</button>' +
    '<button type="button" class="pb-b pb-play" data-a="play"><span class="ic">▶</span></button>' +
    '<button type="button" class="pb-b pb-next" data-a="next">⏭</button>' +
    '<button type="button" class="pb-range" data-a="sheet"></button>' +
    '<button type="button" class="pb-b pb-rep" data-a="rep"></button>' +
    '<button type="button" class="pb-b pb-set" data-a="sheet">⚙</button></div>' +
    '<div class="pb-prog" role="presentation"><span class="pb-fill"></span></div>' +
    '<div class="pb-stat" aria-live="polite"></div><div class="pb-msg" hidden></div></div>';
  document.body.appendChild(bar);
  de.classList.add('has-pbar');
  function barH() { return bar.getBoundingClientRect().height; }
  function msg(t, bad) { var m = bar.querySelector('.pb-msg'); m.textContent = t || ''; m.hidden = !t; m.classList.toggle('bad', !!bad); }
  function paint() {
    var playing = run && !run.idle && !run.paused;
    var pb = bar.querySelector('.pb-play');
    pb.querySelector('.ic').textContent = playing ? '⏸' : '▶';
    pb.setAttribute('aria-label', playing ? T('pause') : T('play')); pb.title = pb.getAttribute('aria-label');
    var pv = bar.querySelector('.pb-prev'), nx = bar.querySelector('.pb-next');
    pv.setAttribute('aria-label', T('prev')); pv.title = T('prev'); nx.setAttribute('aria-label', T('next')); nx.title = T('next');
    var st = bar.querySelector('.pb-set'); st.setAttribute('aria-label', T('settings')); st.title = T('settings');
    var rp = bar.querySelector('.pb-rep');
    rp.textContent = '×' + (P.rep === 0 ? '∞' : nm(P.rep)); rp.setAttribute('aria-label', T('rep') + ': ' + (P.rep === 0 ? '∞' : nm(P.rep))); rp.title = T('rep');
    bar.querySelector('.pb-range').textContent = rangeLabel(run && run.r || R || rangeOf('seg', ctxAyah()));
    bar.setAttribute('aria-label', T('player'));
    bar.setAttribute('dir', lang() === 'ar' ? 'rtl' : 'ltr');
    if (!playing) [].forEach.call(document.querySelectorAll('.player.playing'), function (p) { p.classList.remove('playing'); });
    paintStat();
    if (fv && !fv.hidden) paintFocus();
    if (playing && !raf) raf = requestAnimationFrame(loop);
  }
  function clock(t) { t = Math.max(0, Math.round(t)); var m = Math.floor(t / 60), s = t % 60; return nm(m + ':' + (s < 10 ? '0' : '') + s); }
  function paintStat() {
    var el = bar.querySelector('.pb-stat'), fill = bar.querySelector('.pb-fill');
    if (!run || run.idle) { el.textContent = ''; fill.style.width = '0'; return; }
    var st = stepNow(), txt = '';
    if (!st) return;
    if (st.gap !== undefined) {
      var left = Math.max(0, Math.ceil((run.gapEnd - Date.now()) / 1000));
      txt = fmt(T('gap'), nm(left));
      fill.style.width = '100%';
    } else {
      var a = curA || st.a0;
      if (st.kind === 'drill') txt = fmt(T('drill'), nm(st.a0), nm(st.n), nm(st.of));
      else if (st.kind === 'chain') txt = fmt(T('chain'), nm(st.a1), nm(st.n), nm(st.of));
      else txt = fmt(T('ayah'), nm(a)) + (st.of === 0 ? ' · ' + fmt(T('roundInf'), nm(run.round || 1)) : st.of > 1 ? ' · ' + fmt(T('round'), nm(st.n), nm(st.of)) : '');
      var pos = now() - st.t0, len = st.t1 - st.t0;
      txt += ' · ' + clock(pos) + ' / ' + clock(len);
      fill.style.width = Math.max(0, Math.min(100, 100 * pos / len)).toFixed(1) + '%';
      if (D.j && D.j.charAt(a - 1) === 'x' && a < st.a1) txt += ' · ' + T('joined');
    }
    if (run.sleepAt) txt += ' · ' + fmt(T('sleeping'), nm(Math.max(1, Math.ceil((run.sleepAt - Date.now()) / 60000))));
    if (el.textContent !== txt) el.textContent = txt;
  }
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]');
    if (!b) return;
    var a = b.getAttribute('data-a');
    if (a === 'play') toggle();
    else if (a === 'prev') jump(-1);
    else if (a === 'next') jump(1);
    else if (a === 'rep') {
      var i = REPS.indexOf(P.rep);
      if (i < 0) { i = 0; while (i < REPS.length - 1 && REPS[i] !== 0 && REPS[i] < P.rep) i++; P.rep = REPS[i]; }   // a typed count: on to the next preset above it
      else P.rep = REPS[(i + 1) % REPS.length];
      saveP(); replan(); paint(); if (sheet && !sheet.hidden) paintSheet();
    }
    else if (a === 'sheet') openSheet();
  });
  bar.querySelector('.pb-prog').addEventListener('click', function (e) {
    var st = stepNow();
    if (!st || st.gap !== undefined) return;
    var r = this.getBoundingClientRect(), f = (e.clientX - r.left) / r.width;
    if (lang() === 'ar') f = 1 - f;
    seekTo(st.t0 + Math.max(0, Math.min(1, f)) * (st.t1 - st.t0));
  });
  function replan() {           // a setting changed while playing: same range, new plan from the same place
    if (!run || run.idle) return;
    var b = buildPlan(run.r), a = curA || run.plan[run.i].a0, j = 0;
    for (var i = 0; i < b.steps.length; i++) if (b.steps[i].gap === undefined && b.steps[i].a0 <= a && a <= b.steps[i].a1) { j = i; break; }
    var was = run.paused, keepT = now();
    run.plan = b.steps; run.loop = b.loop; run.i = j;
    var st = run.plan[j];
    if (st && st.gap === undefined && keepT >= st.t0 && keepT < st.t1) { if (!was) { au.playbackRate = P.rate || 1; schedule(); } }
    else if (!was) go(j);
  }

  // ---------------------------------------------------------------- the practice panel
  var sheet = null, shade = null, weakSure = false;
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function segBtns(key, vals, lab) {
    var g = el('div', 'vseg');
    vals.forEach(function (v) { var b = el('button'); b.type = 'button'; b.setAttribute('data-p', key); b.setAttribute('data-v', JSON.stringify(v)); b.setAttribute('data-lab', lab(v)); g.appendChild(b); });
    return g;
  }
  function grp(t, body) { var g = el('div', 'vg'), l = el('span', 'vl'); l.setAttribute('data-t', t); g.appendChild(l); g.appendChild(body); return g; }
  function swRow(key, t) { var r = el('div', 'vrow'), s = el('span'), b = el('button', 'vsw'); s.setAttribute('data-t', t); b.type = 'button'; b.setAttribute('data-sw', key); b.setAttribute('role', 'switch'); r.appendChild(s); r.appendChild(b); return r; }
  function buildSheet() {
    shade = el('div', 'vshade'); shade.hidden = true;
    sheet = el('div', 'vsheet psheet ui'); sheet.hidden = true; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true');
    var h = el('h2'); h.setAttribute('data-t', 'settings'); sheet.appendChild(h);
    var kinds = el('div', 'vseg pkinds');
    ['seg', 'unit', 'page', 'quarter', 'surah', 'custom'].forEach(function (k) { var b = el('button'); b.type = 'button'; b.setAttribute('data-kind', k); kinds.appendChild(b); });
    var cust = el('div', 'pcust');
    cust.innerHTML = '<label><span data-t="from"></span> <select class="pfrom"></select></label><label><span data-t="to"></span> <select class="pto"></select></label>';
    var rg = grp('t_range', kinds); rg.appendChild(cust); sheet.appendChild(rg);
    var rg2 = grp('t_rep', segBtns('rep', REPS, function (v) { return v === 0 ? '∞' : '×' + v; }));
    var rn = el('label', 'prepn');   // any count from 1 to 99, besides the presets
    rn.innerHTML = '<span data-t="repN"></span><input type="number" class="prep" min="1" max="99" step="1" inputmode="numeric">';
    rg2.appendChild(rn); sheet.appendChild(rg2);
    var dr = grp('t_drill', segBtns('drill', DRILLS, function (v) { return v === 0 ? 'off' : '×' + v; }));
    sheet.appendChild(dr);
    sheet.appendChild(grp('t_gap', segBtns('gap', GAPS, function (v) { return v === 0 ? 'off' : v === 1 ? 'x1' : v === 1.5 ? 'x15' : 'x2'; })));
    sheet.appendChild(grp('t_speed', segBtns('rate', RATES, function (v) { return '×' + v; })));
    sheet.appendChild(grp('t_sleep', segBtns('sleep', SLEEPS, function (v) { return v === 0 ? 'off' : 'min:' + v; })));
    var more = el('div', 'vg'); var ml = el('span', 'vl'); ml.setAttribute('data-t', 't_more'); more.appendChild(ml);
    [['chain', 'chain2'], ['link', 'link'], ['follow', 'follow'], ['scroll', 'scroll'], ['tap', 'tap']].forEach(function (x) { more.appendChild(swRow(x[0], x[1])); });
    sheet.appendChild(more);
    var wk = el('div', 'vg pweak'); wk.innerHTML = '<span class="vl pweak-t"></span><p class="pweak-n"></p><div class="vseg"><button type="button" class="pdrillweak"></button><button type="button" class="pclearweak"></button></div>';
    sheet.appendChild(wk);
    var row = el('div', 'pacts');
    row.innerHTML = '<button type="button" class="vdone pgo"></button><button type="button" class="vbtn pclose"></button>';
    sheet.appendChild(row);
    document.body.appendChild(shade); document.body.appendChild(sheet);
    shade.addEventListener('click', closeSheet);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet && !sheet.hidden) closeSheet(); });
    sheet.addEventListener('change', function (e) {
      if (e.target.matches('.prep')) {
        var v = Math.round(+e.target.value);
        if (v >= 1 && v <= 99) { P.rep = v; saveP(); replan(); paint(); }
        e.target.value = REPS.indexOf(P.rep) < 0 ? String(P.rep) : '';   // a preset is shown by its button; a refused number goes
        paintSheet(); return;
      }
      if (e.target.matches('.pfrom,.pto')) { var f = +sheet.querySelector('.pfrom').value, t = +sheet.querySelector('.pto').value; if (t < f) { var x = f; f = t; t = x; } pick = { kind: 'custom', a0: f, a1: t }; paintSheet(); }
    });
    sheet.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-kind')) {
        var k = b.getAttribute('data-kind');
        pick = k === 'custom' ? { kind: 'custom', a0: (pick || R || rangeOf('seg', ctxAyah())).a0, a1: (pick || R || rangeOf('seg', ctxAyah())).a1 } : rangeOf(k, ctxAyah());
        paintSheet();
      } else if (b.hasAttribute('data-p')) {
        P[b.getAttribute('data-p')] = JSON.parse(b.getAttribute('data-v')); saveP(); paintSheet(); paint();
        if (b.getAttribute('data-p') === 'rate') au.playbackRate = P.rate || 1; else if (b.getAttribute('data-p') !== 'sleep') replan();
        if (b.getAttribute('data-p') === 'sleep' && run && !run.idle) run.sleepAt = P.sleep ? Date.now() + P.sleep * 60000 : 0;
      } else if (b.hasAttribute('data-sw')) {
        var key = b.getAttribute('data-sw'); P[key] = !P[key]; saveP(); paintSheet();
        if (key === 'chain' || key === 'link') replan();
        if (key === 'follow' && !P.follow) { lockedA.forEach(function (x) { x.classList.remove('ca'); }); lockedA = []; if (curW) curW.classList.remove('cw'); curW = null; curA = 0; }
      } else if (b.classList.contains('pgo')) { closeSheet(); start(pick || R || rangeOf('seg', ctxAyah())); }
      else if (b.classList.contains('pclose')) closeSheet();
      else if (b.classList.contains('pdrillweak')) { var l = slips(); if (l.length) { closeSheet(); start({ kind: 'slips', a0: l[0], a1: l[l.length - 1], list: l }); } }
      else if (b.classList.contains('pclearweak')) {
        if (!weakSure) { weakSure = true; paintSheet(); setTimeout(function () { weakSure = false; if (sheet && !sheet.hidden) paintSheet(); }, 3000); return; }
        weakSure = false; if (window.HifzTest) window.HifzTest.clearSlips(); paintSheet();
      }
    });
  }
  var pick = null;
  function slips() { return window.HifzTest ? window.HifzTest.slips() : []; }
  function lab(k) {
    if (k === 'off') return T('off');
    if (k.indexOf('min:') === 0) return fmt(T('min'), nm(k.slice(4)));
    if (k === 'x1' || k === 'x15' || k === 'x2') return T(k);
    if (k.charAt(0) === '×') return '×' + nm(k.slice(1)).replace('.', lang() === 'ar' ? '٫' : lang() === 'es' ? ',' : '.');
    return k;
  }
  function paintSheet() {
    sheet.setAttribute('dir', lang() === 'ar' ? 'rtl' : 'ltr');
    sheet.setAttribute('aria-label', T('settings'));
    [].forEach.call(sheet.querySelectorAll('[data-t]'), function (e) { e.textContent = T(e.getAttribute('data-t')); });
    var cur = pick || R || rangeOf('seg', ctxAyah());
    [].forEach.call(sheet.querySelectorAll('[data-kind]'), function (b) {
      var k = b.getAttribute('data-kind'), r = k === 'custom' ? null : rangeOf(k, ctxAyah());
      b.textContent = k === 'custom' ? T('custom') : rangeLabel(r);
      b.setAttribute('aria-pressed', cur && cur.kind === k ? 'true' : 'false');
    });
    var cu = sheet.querySelector('.pcust'); cu.hidden = !(cur && cur.kind === 'custom');
    var fs = sheet.querySelector('.pfrom'), ts = sheet.querySelector('.pto');
    if (fs.options.length !== N || fs.getAttribute('data-l') !== lang()) {
      var h = ''; for (var a = 1; a <= N; a++) h += '<option value="' + a + '">' + nm(a) + '</option>';
      fs.innerHTML = h; ts.innerHTML = h; fs.setAttribute('data-l', lang());
    }
    if (cur) { fs.value = String(cur.a0); ts.value = String(cur.a1); }
    [].forEach.call(sheet.querySelectorAll('[data-p]'), function (b) {
      var k = b.getAttribute('data-p'), v = JSON.parse(b.getAttribute('data-v'));
      b.textContent = lab(b.getAttribute('data-lab'));
      b.setAttribute('aria-pressed', P[k] === v ? 'true' : 'false');
    });
    var pi = sheet.querySelector('.prep');
    if (document.activeElement !== pi) pi.value = REPS.indexOf(P.rep) < 0 ? String(P.rep) : '';
    pi.classList.toggle('on', REPS.indexOf(P.rep) < 0);
    [].forEach.call(sheet.querySelectorAll('[data-sw]'), function (b) {
      var k = b.getAttribute('data-sw'); b.setAttribute('aria-pressed', P[k] ? 'true' : 'false');
      b.setAttribute('aria-label', T({ chain: 'chain2' }[k] || k));
    });
    var l = slips();
    sheet.querySelector('.pweak-t').textContent = fmt(T('weak'), nm(l.length));
    sheet.querySelector('.pweak-n').textContent = l.length ? l.map(nm).join(lang() === 'ar' ? '، ' : ', ') : T('noWeak');
    var dw = sheet.querySelector('.pdrillweak'), cw = sheet.querySelector('.pclearweak');
    dw.textContent = T('drillWeak'); cw.textContent = weakSure ? T('sure') : T('clearWeak');
    dw.disabled = cw.disabled = !l.length;
    sheet.querySelector('.pgo').textContent = T('start') + ' · ' + rangeLabel(cur);
    sheet.querySelector('.pclose').textContent = T('close');
  }
  function openSheet() { if (!sheet) buildSheet(); pick = null; paintSheet(); shade.hidden = false; sheet.hidden = false; var f = sheet.querySelector('.pgo'); if (f) f.focus(); }
  function closeSheet() { if (!sheet) return; sheet.hidden = true; shade.hidden = true; }

  // ---------------------------------------------------------------- the segment rows and the text
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('section.seg .player .play, section.seg .player .fcs');
    if (b) {
      e.preventDefault();
      var id = +b.closest('section').id.slice(1), g = segById(id);
      if (!g) return;
      if (b.classList.contains('fcs')) { openFocus(curA && W.segOf(curA) === g ? curA : g[1]); return; }
      if (run && !run.idle && run.r.kind === 'seg' && run.r.id === id) { toggle(); return; }
      start({ kind: 'seg', a0: g[1], a1: g[2], id: id });
      return;
    }
    var w = e.target.closest && e.target.closest('.quran .wd');
    if (w && P.tap && !w.closest('section.testing') && !e.target.closest('.aya')) {
      var a = +w.getAttribute('data-a'), i = +w.getAttribute('data-i') || 0;
      if (!a) return;
      if (!i) { var nx = w.nextElementSibling; while (nx && !nx.hasAttribute('data-i')) nx = nx.nextElementSibling; if (nx && +nx.getAttribute('data-a') === a) i = +nx.getAttribute('data-i'); }
      var g2 = W.segOf(a);
      var t0 = Math.max(AT[a - 1][0], (i ? wordTime(a, i) : AT[a - 1][0]) - 0.06);
      start({ kind: 'here', a0: a, a1: g2 ? g2[2] : a, t0: t0, id: g2 ? g2[0] : 0 });
    }
  });

  // ---------------------------------------------------------------- focus view
  var fv = null;
  function openFocus(a) {
    if (!fv) {
      fv = el('div', 'focusv ui'); fv.hidden = true; fv.setAttribute('role', 'dialog'); fv.setAttribute('aria-modal', 'true');
      fv.innerHTML = '<div class="fv-top"><span class="fv-ref"></span><button type="button" class="fv-b fv-x" data-f="x">×</button></div>' +
        '<div class="fv-body"><p class="fv-text"></p></div>' +
        '<div class="fv-nav"><button type="button" class="fv-b" data-f="prev">→</button><button type="button" class="fv-b fv-play" data-f="play">▶</button>' +
        '<button type="button" class="fv-b" data-f="next">←</button></div>';
      document.body.appendChild(fv);
      fv.addEventListener('click', function (e) {
        var b = e.target.closest('[data-f]'); if (!b) return;
        var f = b.getAttribute('data-f');
        if (f === 'x') closeFocus();
        else if (f === 'prev') { fv.follow = false; fv.a = Math.max(1, fv.a - 1); paintFocus(); }
        else if (f === 'next') { fv.follow = false; fv.a = Math.min(N, fv.a + 1); paintFocus(); }
        else if (f === 'play') {
          if (run && !run.idle && !run.paused) { toggle(); return; }
          fv.follow = true;
          var r = R && R.a0 <= fv.a && fv.a <= R.a1 && R.kind !== 'here' ? R : rangeOf('seg', fv.a);
          if (run && !run.idle && run.paused && run.r === r) toggle(); else start(r);
        }
      });
      var sx = 0, sy = 0;
      fv.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
      fv.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) > 60 && Math.abs(dx) > 1.5 * Math.abs(dy)) { fv.follow = false; fv.a = Math.max(1, Math.min(N, fv.a + (dx > 0 ? 1 : -1))); paintFocus(); }
      }, { passive: true });
      document.addEventListener('keydown', function (e) {
        if (!fv || fv.hidden) return;
        if (e.key === 'Escape') closeFocus();
        else if (e.key === 'ArrowLeft') { fv.follow = false; fv.a = Math.min(N, fv.a + 1); paintFocus(); }
        else if (e.key === 'ArrowRight') { fv.follow = false; fv.a = Math.max(1, fv.a - 1); paintFocus(); }
      });
    }
    fv.a = a; fv.follow = true; fv.hidden = false; de.classList.add('fv-open');
    paintFocus();
    if (window.HifzAwake) window.HifzAwake(true);
  }
  function closeFocus() { if (!fv) return; fv.hidden = true; de.classList.remove('fv-open'); if (!run || run.idle || run.paused) awake(false); }
  function paintFocus() {
    if (!fv || fv.hidden) return;
    var a = fv.a, box = fv.querySelector('.fv-text');
    if (box.getAttribute('data-a') !== String(a)) {
      box.innerHTML = '';
      var ws = W.words(a), m = W.marker(a);
      if (ws.length) {
        var n = ws[0];
        while (n) { box.appendChild(n.cloneNode(true)); if (n === m) break; n = n.nextSibling; }
      }
      [].forEach.call(box.querySelectorAll('.cw,.ca'), function (x) { x.classList.remove('cw'); x.classList.remove('ca'); });
      [].forEach.call(box.querySelectorAll('.pgm'), function (x) { x.parentNode.removeChild(x); });
      box.setAttribute('data-a', a);
    }
    var p = W.pageOf(a);
    fv.querySelector('.fv-ref').textContent = fmt(T('ayah'), nm(a)) + ' · ' + fmt(T('page'), nm(p[0]), T(p[2]));
    fv.setAttribute('dir', lang() === 'ar' ? 'rtl' : 'ltr');
    var lb = { x: 'fclose', prev: 'fprev', next: 'fnext' };
    [].forEach.call(fv.querySelectorAll('[data-f]'), function (b) {
      var f = b.getAttribute('data-f'), l = f === 'play' ? (run && !run.idle && !run.paused ? T('pause') : T('play')) : T(lb[f]);
      b.setAttribute('aria-label', l); b.title = l;
    });
    fv.querySelector('.fv-play').textContent = run && !run.idle && !run.paused ? '⏸' : '▶';
    fv.querySelector('.fv-body').classList.toggle('testing', !!(window.HifzTest && window.HifzTest.active()));
    litFocus(curA === a ? (curW ? +curW.getAttribute('data-i') : 0) : 0);
  }
  function litFocus(i) {
    if (!fv || fv.hidden) return;
    var box = fv.querySelector('.fv-text');
    [].forEach.call(box.querySelectorAll('.cw'), function (x) { x.classList.remove('cw'); });
    if (i && P.follow && curA === fv.a) { var w = box.querySelector('.wd[data-i="' + i + '"]'); if (w) w.classList.add('cw'); }
  }

  // ---------------------------------------------------------------- the rest
  window.HifzPage = function () { var a = run && !run.idle && curA ? curA : inView(); return W.pageOf(a)[0]; };
  if (window.hifzUI) window.hifzUI.on(function () { paint(); if (sheet && !sheet.hidden) paintSheet(); media(); });
  window.HifzPlayer = {
    audio: au, settings: P, set: function (o) { for (var k in o) P[k] = o[k]; saveP(); replan(); paint(); },
    start: start, stop: stop, toggle: toggle, jump: jump, range: function () { return run ? run.r : R; }, rangeOf: rangeOf,
    plan: function () { return run ? run.plan : null; }, step: function () { return run ? run.i : -1; },
    state: function () { return { running: !!run && !run.idle, paused: !!run && !!run.paused, a: curA, w: curW ? +curW.getAttribute('data-i') : 0, t: now(), src: src && src.key, seeking: seeking }; },
    ayahAt: ayahAt, wordAt: wordAt, now: now, focus: openFocus, label: rangeLabel, current: function () { return run; }
  };
  paint();
  window.addEventListener('scroll', function () { if (!run || run.idle) { var l = bar.querySelector('.pb-range'), t = rangeLabel(R || rangeOf('seg', ctxAyah())); if (l.textContent !== t) l.textContent = t; } }, { passive: true });
})();
