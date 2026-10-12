/* Hifz web app: the home page (tools/make_app.py).
   - search: the kit's search (packages/hifz-search.js, the engine of tools/search_engine.js);
     a result opens the surah file at that ayah with the results (#a=s:a&v=find&q=…, the link
     format of the reference panel, tools/refs.py);
   - the surah list: ⤓ saves a surah's recording on this device, ✓ shows it is saved;
   - offline audio: save all, add the learner's own mp3s (NNN.mp3 for a whole surah, or the
     segment files NNN-Sxx-vaaa-bbb.mp3), remove; a file is kept only when its duration matches
     the recording the ledger's cut times were measured on;
   - the Install button, when the browser offers one.
   Interface text in three languages, following the switch of tools/ui.py (window.hifzUI). */
(function () {
  'use strict';
  var A = window.HifzAudio, D = JSON.parse(document.getElementById('app-data').textContent);
  var BY = {}, STEM = {};
  D.surahs.forEach(function (x) {
    BY[x.s] = x;
    x.segs.forEach(function (g) { STEM[g[0]] = { s: x.s, t0: g[1], t1: g[2] }; });
  });

  function plural(n, one, two, few, many) {
    return n === 1 ? one : n === 2 ? two : nm(n) + ' ' + (n % 100 >= 3 && n % 100 <= 10 ? few : many);
  }
  var TX = {
    ar: {
      ph: 'ابحث في القرآن', phT: 'ابحث في القرآن: كلمة أو أكثر، بالتشكيل أو بدونه، أو رقم آية مثل ٢٥:٤٩',
      short: 'اكتب حرفين على الأقل من كلمة في القرآن، بالتشكيل أو بدونه، أو رقم آية مثل ٢٥:٤٩.',
      noHit: 'لا آية فيها «{0}»', more: 'عرض المزيد ({0})', where: 'سورة {0}، الآية {1}',
      noFile: 'تعذّر تحميل ملف البحث.',
      count: function (n, o) { return 'النتائج: ' + plural(n, 'آية واحدة', 'آيتان', 'آيات', 'آية') + (o > n ? ' · ' + plural(o, 'موضع واحد', 'موضعان', 'مواضع', 'موضعًا') : ''); },
      save: 'احفظ تلاوة السورة على هذا الجهاز', saved: 'محفوظة على هذا الجهاز — اضغط لحذفها', sure: 'اضغط مرة أخرى للحذف',
      part: 'بعض مقاطعها محفوظة على هذا الجهاز', saving: 'جارٍ الحفظ… {0}٪',
      st: 'محفوظ على هذا الجهاز: {0} · {1}', none: 'لا صوت محفوظ على هذا الجهاز بعد؛ تُسمع التلاوة من الإنترنت.',
      prog: 'جارٍ حفظ {0} من {1}: سورة {2} — {3}٪', done: 'حُفظ: {0}.', stopped: 'توقّف الحفظ.',
      noCors: 'لا يسمح خادم التلاوة بحفظها من هذا الموقع. استعمل «إضافة ملفاتي الصوتية».',
      offline: 'لا اتصال بالإنترنت.', full: 'لا مساحة كافية على هذا الجهاز.',
      mismatch: 'تسجيل سورة {0} في العنوان لا يطابق التسجيل الذي قُطعت عليه المقاطع ({1} ث بدل {2} ث)، فلم يُحفظ.',
      reading: 'جارٍ فحص الملفات… {0} من {1}', added: 'أُضيف: {0}، {1}. تُرك: {2}.',
      clearSure: 'اضغط مرة أخرى لحذف كل الصوت المحفوظ', cleared: 'حُذف كل الصوت المحفوظ.',
      surahs: function (n) { return plural(n, 'سورة واحدة', 'سورتان', 'سور', 'سورة'); },
      segs: function (n) { return plural(n, 'ملف مقطع واحد', 'ملفا مقطعين', 'ملفات مقاطع', 'ملف مقطع'); },
      files: function (n) { return plural(n, 'ملف واحد', 'ملفان', 'ملفات', 'ملفًا'); },
      mb: '{0} ميغابايت', gb: '{0} غيغابايت'
    },
    en: {
      ph: 'Search the Qurʾān', phT: 'Search the Qurʾān: one or more words, with or without diacritics, or an ayah number such as 25:49',
      short: 'Type at least two letters of a word of the Qurʾān, with or without diacritics, or an ayah number such as 25:49.',
      noHit: 'No ayah contains «{0}»', more: 'Show more ({0})', where: 'Surah {0}, ayah {1}',
      noFile: 'The search file could not be loaded.',
      count: function (n, o) { return 'Results: ' + (n === 1 ? '1 ayah' : n + ' ayat') + (o > n ? ' · ' + o + ' occurrences' : ''); },
      save: "Save this surah's recitation on this device", saved: 'Saved on this device — tap to remove', sure: 'Tap again to remove',
      part: 'Some of its segments are saved on this device', saving: 'Saving… {0}%',
      st: 'Saved on this device: {0} · {1}', none: 'No audio saved on this device yet; the recitation plays from the internet.',
      prog: 'Saving {0} of {1}: Surah {2} — {3}%', done: 'Saved: {0}.', stopped: 'Saving stopped.',
      noCors: "The recitation server doesn't allow saving from this site. Use “Add my mp3 files”.",
      offline: 'No internet connection.', full: 'Not enough storage on this device.',
      mismatch: "The recording of Surah {0} at the address doesn't match the one the segments were cut from ({1} s instead of {2} s), so it wasn't saved.",
      reading: 'Checking the files… {0} of {1}', added: 'Added: {0}, {1}. Skipped: {2}.',
      clearSure: 'Tap again to remove all saved audio', cleared: 'All saved audio removed.',
      surahs: function (n) { return n === 1 ? '1 surah' : n + ' surahs'; },
      segs: function (n) { return n === 1 ? '1 segment file' : n + ' segment files'; },
      files: function (n) { return n === 1 ? '1 file' : n + ' files'; },
      mb: '{0} MB', gb: '{0} GB'
    },
    es: {
      ph: 'Buscar en el Corán', phT: 'Buscar en el Corán: una o más palabras, con o sin signos vocálicos, o un número de aleya como 25:49',
      short: 'Escriba al menos dos letras de una palabra del Corán, con o sin signos vocálicos, o un número de aleya como 25:49.',
      noHit: 'Ninguna aleya contiene «{0}»', more: 'Mostrar más ({0})', where: 'Sura {0}, aleya {1}',
      noFile: 'No se pudo cargar el archivo de búsqueda.',
      count: function (n, o) { return 'Resultados: ' + (n === 1 ? '1 aleya' : n + ' aleyas') + (o > n ? ' · ' + o + ' coincidencias' : ''); },
      save: 'Guardar la recitación de esta sura en este dispositivo', saved: 'Guardada en este dispositivo: toque para borrarla', sure: 'Toque de nuevo para borrar',
      part: 'Algunos de sus segmentos están guardados en este dispositivo', saving: 'Guardando… {0} %',
      st: 'Guardado en este dispositivo: {0} · {1}', none: 'Todavía no hay audio guardado en este dispositivo; la recitación se reproduce desde internet.',
      prog: 'Guardando {0} de {1}: sura {2} — {3} %', done: 'Guardado: {0}.', stopped: 'Se detuvo el guardado.',
      noCors: 'El servidor de la recitación no permite guardarla desde este sitio. Use «Añadir mis archivos mp3».',
      offline: 'Sin conexión a internet.', full: 'No hay espacio suficiente en este dispositivo.',
      mismatch: 'La grabación de la sura {0} en la dirección no coincide con aquella de la que se cortaron los segmentos ({1} s en lugar de {2} s), así que no se guardó.',
      reading: 'Comprobando los archivos… {0} de {1}', added: 'Añadido: {0}, {1}. Omitido: {2}.',
      clearSure: 'Toque de nuevo para borrar todo el audio guardado', cleared: 'Se borró todo el audio guardado.',
      surahs: function (n) { return n === 1 ? '1 sura' : n + ' suras'; },
      segs: function (n) { return n === 1 ? '1 archivo de segmento' : n + ' archivos de segmentos'; },
      files: function (n) { return n === 1 ? '1 archivo' : n + ' archivos'; },
      mb: '{0} MB', gb: '{0} GB'
    }
  };
  function L() { var u = window.hifzUI; return u && u.lang ? u.lang() : 'ar'; }
  function T(k) { var l = TX[L()] || TX.ar; return l.hasOwnProperty(k) ? l[k] : TX.ar[k]; }
  function fmt(t) { var a = arguments; return String(t).replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1]; }); }
  function nm(n) { return L() === 'ar' ? String(n).replace(/[0-9]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.charAt(+d); }).replace('.', '٫') : (L() === 'es' ? String(n).replace('.', ',') : String(n)); }
  function iso(t) { return L() === 'ar' ? t : '⁨' + t + '⁩'; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function size(b) {
    return b >= 1e9 ? fmt(T('gb'), nm((b / 1e9).toFixed(2))) : fmt(T('mb'), nm(b >= 1e7 ? Math.round(b / 1e6) : (b / 1e6).toFixed(1)));
  }
  function book(s) { var x = BY[s]; return 'packages/' + A.pad(s) + '-package/' + encodeURIComponent(x.book); }

  /* ---------------- search ---------------- */
  var qi = document.getElementById('q'), out = document.getElementById('results'), HS = null, loading = null,
    timer = 0, res = null, shown = 0, PAGE = 30;
  function engine() {
    if (HS) return Promise.resolve(HS);
    if (!loading) loading = new Promise(function (ok) {
      if (window.HIFZ_SEARCH) { ok(window.HIFZ_SEARCH); return; }
      var sc = document.createElement('script');
      sc.src = 'packages/hifz-search.js';
      sc.onload = function () { ok(window.HIFZ_SEARCH || null); };
      sc.onerror = function () { ok(null); };
      document.head.appendChild(sc);
    }).then(function (h) { HS = h; if (!h) loading = null; return h; });
    return loading;
  }
  function hl(t, sp) {
    var o = '', p = 0, i;
    for (i = 0; i < sp.length; i += 2) { o += esc(t.slice(p, sp[i])) + '<mark>' + esc(t.slice(sp[i], sp[i + 1])) + '</mark>'; p = sp[i + 1]; }
    return o + esc(t.slice(p));
  }
  function render() {
    if (!res) { out.innerHTML = ''; return; }
    if (res.short) { out.innerHTML = '<p class="rs-count">' + esc(T('short')) + '</p>'; return; }
    if (!res.n) { out.innerHTML = '<p class="rs-count">' + esc(fmt(T('noHit'), res.q)) + '</p>'; return; }
    var h = ['<p class="rs-count">' + esc(T('count')(res.n, res.occ)) + '</p><ol class="rs-list">'], i, x, s, a;
    for (i = 0; i < Math.min(shown, res.n); i++) {
      x = HS.ref(res.ayat[i]); s = x[0]; a = x[1];
      h.push('<li><a href="' + book(s) + '#a=' + s + ':' + a + '&v=find&q=' + encodeURIComponent(res.q) + '">' +
        '<span class="rs-ref">' + esc(fmt(T('where'), iso(BY[s].name), nm(a))) + '</span>' +
        '<p class="rs-q ar">' + hl(HS.text(res.ayat[i]), res.spans[i] || []) + '</p></a></li>');
    }
    h.push('</ol>');
    if (shown < res.n) h.push('<button type="button" class="btn rs-more">' + esc(fmt(T('more'), nm(res.n - shown))) + '</button>');
    out.innerHTML = h.join('');
    var m = out.querySelector('.rs-more');
    if (m) m.addEventListener('click', function () { shown += PAGE; render(); });
  }
  function run() {
    var q = qi.value.trim();
    if (!q) { res = null; render(); return; }
    engine().then(function (h) {
      if (q !== qi.value.trim()) return;
      if (!h) { out.innerHTML = '<p class="rs-count">' + esc(T('noFile')) + '</p>'; return; }
      res = h.search(q); res.q = q; shown = PAGE; render();
    });
  }
  qi.addEventListener('focus', engine);
  qi.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 220); });
  function labels() {
    qi.placeholder = T('ph'); qi.title = T('phT'); qi.setAttribute('aria-label', T('ph'));
  }

  /* ---------------- saved audio ---------------- */
  var saved = {}, busy = {}, stop = false, sure = {}, all = false;
  var stat = document.getElementById('astat'), msg = document.getElementById('amsg'),
    prog = document.getElementById('prog'), bar = prog.querySelector('.bar span'), pl = prog.querySelector('.pl'),
    bAll = document.getElementById('saveall'), bStop = document.getElementById('stop'),
    bClear = document.getElementById('clear'), inp = document.getElementById('files');
  var buttons = [].slice.call(document.querySelectorAll('.sv'));

  function say(t, bad) { msg.hidden = !t; msg.textContent = t || ''; msg.className = 'msg' + (bad ? ' bad' : ''); }
  function partOf(s) { var n = 0; BY[s].segs.forEach(function (g) { if (saved['seg:' + g[0]]) n++; }); return n; }
  function paint() {
    buttons.forEach(function (b) {
      var s = +b.getAttribute('data-s'), k = 'surah:' + A.pad(s), p = partOf(s), whole = saved[k] || p === BY[s].segs.length;
      b.className = 'sv' + (busy[s] != null ? ' busy' : sure[s] ? ' sure' : whole ? ' saved' : p ? ' part' : '');
      b.textContent = busy[s] != null ? nm(busy[s]) + (L() === 'ar' ? '٪' : '%') : sure[s] ? '✕' : whole ? '✓' : p ? '◐' : '⤓';
      var t = busy[s] != null ? fmt(T('saving'), nm(busy[s])) : sure[s] ? T('sure') : whole ? T('saved') : p ? T('part') : T('save');
      b.title = t; b.setAttribute('aria-label', t);
    });
    var ns = 0, ng = 0, bytes = 0, k;
    for (k in saved) { if (k.indexOf('surah:') === 0) ns++; else ng++; bytes += saved[k].size || 0; }
    var what = [ns ? T('surahs')(ns) : '', ng ? T('segs')(ng) : ''].filter(Boolean).join(L() === 'ar' ? '، ' : ', ');
    stat.textContent = ns || ng ? fmt(T('st'), what, size(bytes)) : T('none');
    var lb = bClear.querySelector('.lb'), sr = bClear.querySelector('.sr');
    lb.hidden = !!sure.all; sr.hidden = !sure.all; sr.textContent = sure.all ? T('clearSure') : '';
    bClear.hidden = !(ns || ng);
  }
  function refresh() { return A.list().then(function (o) { saved = o; paint(); }); }

  // the duration of an mp3, from its own header (the browser's decoder)
  function duration(blob) {
    return new Promise(function (ok) {
      var u = URL.createObjectURL(blob), a = new Audio(), done = false;
      function end(d) { if (done) return; done = true; URL.revokeObjectURL(u); a.removeAttribute('src'); ok(d); }
      a.preload = 'metadata';
      a.onloadedmetadata = function () { end(isFinite(a.duration) ? a.duration : NaN); };
      a.onerror = function () { end(NaN); };
      setTimeout(function () { end(NaN); }, 15000);
      a.src = u;
    });
  }
  function persist() { try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {} }

  function download(s, onp) {
    return fetch(A.url(s), { mode: 'cors', credentials: 'omit' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var total = +(r.headers.get('content-length') || 0), got = 0, parts = [];
      if (!r.body || !r.body.getReader) return r.blob();
      var rd = r.body.getReader();
      function pump() {
        return rd.read().then(function (x) {
          if (stop) { rd.cancel(); throw new Error('stopped'); }
          if (x.done) return new Blob(parts, { type: 'audio/mpeg' });
          parts.push(x.value); got += x.value.length;
          if (onp && total) onp(got / total);
          return pump();
        });
      }
      return pump();
    }, function (e) { e.cors = true; throw e; });
  }
  function why(e) {
    if (e && e.message === 'stopped') return T('stopped');
    if (e && e.name === 'QuotaExceededError') return T('full');
    if (!navigator.onLine) return T('offline');
    if (e && e.cors) return T('noCors');
    return String(e && e.message || e);
  }
  // save the recitation of surah s; resolves true when saved
  function saveOne(s, onp) {
    busy[s] = 0; paint(); persist();
    return download(s, function (f) { busy[s] = Math.floor(f * 100); if (onp) onp(f); paint(); })
      .then(function (blob) {
        return duration(blob).then(function (d) {
          var want = BY[s].dur;
          if (!(Math.abs(d - want) <= 0.6)) {
            var e = new Error(fmt(T('mismatch'), iso(BY[s].name), nm(isFinite(d) ? d.toFixed(1) : '?'), nm(want.toFixed(1))));
            e.shown = true; throw e;
          }
          return A.put('surah:' + A.pad(s), blob, { size: blob.size, from: 'address', at: new Date().toISOString() });
        });
      })
      .then(function () { delete busy[s]; return refresh().then(function () { return true; }); },
        function (e) { delete busy[s]; paint(); say(e && e.shown ? e.message : why(e), true); return false; });
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function (ev) {
      ev.preventDefault();
      var s = +b.getAttribute('data-s'), k = 'surah:' + A.pad(s);
      if (busy[s] != null || all) return;
      if (saved[k] || partOf(s)) {
        if (!sure[s]) { sure[s] = true; paint(); setTimeout(function () { if (sure[s]) { delete sure[s]; paint(); } }, 3500); return; }
        delete sure[s];
        var keys = [k].concat(BY[s].segs.map(function (g) { return 'seg:' + g[0]; })).filter(function (x) { return saved[x]; });
        Promise.all(keys.map(function (x) { return A.del(x); })).then(refresh);
        return;
      }
      say('');
      stop = false;
      saveOne(s);
    });
  });

  bAll.addEventListener('click', function () {
    if (all) return;
    var todo = D.surahs.map(function (x) { return x.s; }).filter(function (s) { return !saved['surah:' + A.pad(s)] && partOf(s) < BY[s].segs.length; });
    if (!todo.length) return;
    all = true; stop = false; say(''); bAll.hidden = true; bStop.hidden = false; prog.hidden = false;
    var i = 0, ok = 0;
    function show(f) {
      var s = todo[i];
      bar.style.width = (100 * (i + f) / todo.length).toFixed(1) + '%';
      pl.textContent = fmt(T('prog'), nm(i + 1), nm(todo.length), iso(BY[s].name), nm(Math.floor(f * 100)));
    }
    function next() {
      if (stop || i >= todo.length) return finish();
      show(0);
      return saveOne(todo[i], show).then(function (good) {
        if (!good) return finish();
        ok++; i++; return next();
      });
    }
    function finish() {
      all = false; bAll.hidden = false; bStop.hidden = true; prog.hidden = true;
      if (ok && !msg.textContent) say(fmt(T('done'), T('surahs')(ok)));
      paint();
    }
    next();
  });
  bStop.addEventListener('click', function () { stop = true; });

  bClear.addEventListener('click', function () {
    if (!sure.all) { sure.all = true; paint(); setTimeout(function () { if (sure.all) { delete sure.all; paint(); } }, 3500); return; }
    delete sure.all;
    Promise.all(Object.keys(saved).map(function (k) { return A.del(k); })).then(refresh).then(function () { say(T('cleared')); });
  });

  inp.addEventListener('change', function () {
    var files = [].slice.call(inp.files || []), i = 0, nS = 0, nG = 0, skip = 0;
    if (!files.length) return;
    persist(); say(''); prog.hidden = false;
    function next() {
      if (i >= files.length) {
        prog.hidden = true; inp.value = '';
        say(fmt(T('added'), T('surahs')(nS), T('segs')(nG), T('files')(skip)), nS + nG === 0);
        return refresh();
      }
      var f = files[i++], name = f.name.toLowerCase(), m, key, want;
      bar.style.width = (100 * i / files.length).toFixed(1) + '%';
      pl.textContent = fmt(T('reading'), nm(i), nm(files.length));
      if ((m = /^(\d{1,3})\.mp3$/.exec(name)) && BY[+m[1]]) { key = 'surah:' + A.pad(+m[1]); want = BY[+m[1]].dur; }
      else if ((m = /^(\d{3}-s\d\d-v\d{3}-\d{3})\.mp3$/.exec(name)) && STEM[m[1].replace('-s', '-S')]) {
        var g = STEM[m[1].replace('-s', '-S')]; key = 'seg:' + m[1].replace('-s', '-S'); want = g.t1 - g.t0;
      } else { skip++; return next(); }
      return duration(f).then(function (d) {
        // a segment's file is measured after the decoder's start padding (up to a tenth of a second
        // in these files) and to the nearest frame at both cuts, so it may be ~0.16 s shorter than its cut times
        var tol = key.indexOf('surah:') === 0 ? 0.6 : 0.5;
        if (!(Math.abs(d - want) <= tol)) { skip++; return next(); }
        return A.put(key, f, { size: f.size, from: 'file', name: f.name, at: new Date().toISOString() }).then(function () {
          if (key.indexOf('surah:') === 0) nS++; else nG++;
          return next();
        }, function (e) { prog.hidden = true; inp.value = ''; say(why(e), true); return refresh(); });
      });
    }
    next();
  });

  /* ---------------- install ---------------- */
  var bInst = document.getElementById('install');
  function inst() { bInst.hidden = !A.install || (window.matchMedia && matchMedia('(display-mode: standalone)').matches); }
  bInst.addEventListener('click', function () {
    if (!A.install) return;
    A.install.prompt();
    A.install.userChoice.then(function () { A.install = null; inst(); }, function () {});
  });
  document.addEventListener('hifz-installable', inst);
  document.addEventListener('hifz-installed', inst);

  function relabel() { labels(); render(); paint(); }
  if (window.hifzUI) window.hifzUI.on(relabel);
  labels(); inst(); refresh();
  window.HifzHome = { refresh: refresh, saved: function () { return saved; } };   // for tests
})();
