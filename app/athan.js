/* Hifz web app: prayer times and the athan, on every page (2026-10-29, at the learner's request: "add athan
   (the daily prayer calls) to the Hifz app and qibla direction"; he chose the athan while the app is open, the
   ISNA convention by default, and an athan file of his own on each device).
   - Loaded on every page by app/core.js (and by salat.html itself).  The times come from adhan-js (app/adhan/,
     MIT; tools/check_kit.py checks it against the library's reference timetables) for the location, convention,
     Asr school and minute adjustments set on the prayer page (localStorage "hifz-salat"), in this device's time
     zone; above 48° of latitude the library's recommended rule for Fajr and Isha.
   - At each prayer whose athan is on, while a page of the app is open: the recitation pauses and the athan plays
     (his own mp3, a separate one for Fajr if he chose one: IndexedDB "hifz-athan"; else a short chime), with a
     banner to stop it.  A prayer is called once, however many pages are open; a page opened within two minutes
     of the time still calls it, later ones do not.  With the page in the background, a notification too (when
     allowed).  A web app cannot wake a locked phone: for that the learner keeps a dedicated athan app.
   - The toolbar of every page gets a link to the prayer page (🕋) with the next prayer; on the home page the
     link [data-salat-next] shows the next prayer and the time left.
   window.HifzSalat = {get(), set(patch), times(date), next(from), lib(), file(kind), saveFile(kind, blob, name),
   dropFile(kind), play(kind), stop(), playing(), current(), tick(), on(fn), fmtTime(date), until(ms), name(key), order, calls}
   for the prayer page (app/salat.js) and the tests; the event "hifz-athan-end" when an athan ends or is stopped.
   Interface text in three languages, following the switch of tools/ui.py (window.hifzUI). */
(function () {
  'use strict';
  if (window.HifzSalat) return;
  var de = document.documentElement, Au = window.HifzAudio, root = Au ? Au.root : '';
  var LIB = new URL(root + 'app/adhan/Adhan.js', location.href).href;
  var K = 'hifz-salat', DONE = 'hifz-salat-done', LATE = 120000;
  var ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'], CALLS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  var DEF = { loc: null, method: 'NorthAmerica', madhab: 'shafi', adj: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
              athan: true, on: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true }, notify: false };
  var TX = {
    ar: { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء',
      now: 'حان الآن موعد أذان {0} · {1}', stop: 'أوقف الأذان', close: 'إغلاق', play: '▶ شغّل الأذان', in: 'بعد {0}',
      h: '{0} س', m: '{0} د', link: 'مواقيت الصلاة والقبلة', setLoc: 'مواقيت الصلاة والقبلة: اضبط موقعك',
      nextL: '{0} {1} · {2}', notif: 'حان وقت صلاة {0}', soon: 'الآن' },
    en: { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
      now: 'Time for the {0} athan · {1}', stop: 'Stop the athan', close: 'Close', play: '▶ Play the athan', in: 'in {0}',
      h: '{0} h', m: '{0} min', link: 'Prayer times and qibla', setLoc: 'Prayer times and qibla: set your location',
      nextL: '{0} {1} · {2}', notif: 'Time for {0} prayer', soon: 'now' },
    es: { fajr: 'Fayr', sunrise: 'Amanecer', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Magrib', isha: 'Isha',
      now: 'Hora del adhán de {0} · {1}', stop: 'Detener el adhán', close: 'Cerrar', play: '▶ Reproducir el adhán', in: 'en {0}',
      h: '{0} h', m: '{0} min', link: 'Horarios de oración y alquibla', setLoc: 'Horarios de oración y alquibla: indique su ubicación',
      nextL: '{0} {1} · {2}', notif: 'Hora de la oración de {0}', soon: 'ahora' }
  };
  function lang() { var u = de.getAttribute('data-ui'); return u === 'en' || u === 'es' ? u : 'ar'; }
  function T(k) { return TX[lang()][k]; }
  function fmt(s) { var a = arguments; return String(s).replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1]; }); }
  function nm(n) { return lang() === 'ar' ? String(n).replace(/[0-9]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.charAt(+d); }) : String(n); }
  var LOC = { ar: 'ar-u-nu-arab', en: 'en-US', es: 'es' };
  function fmtTime(d) { try { return new Intl.DateTimeFormat(LOC[lang()], { hour: 'numeric', minute: '2-digit' }).format(d); } catch (e) { return d.toTimeString().slice(0, 5); } }
  function until(ms) {
    var m = Math.max(0, Math.ceil(ms / 60000)), h = Math.floor(m / 60);
    if (!m) return T('soon');
    return fmt(T('in'), (h ? fmt(T('h'), nm(h)) + ' ' : '') + fmt(T('m'), nm(m % 60)));
  }

  // ---- settings (this device) ----
  var hooks = [];
  function load() {
    var v = {};
    try { v = JSON.parse(localStorage.getItem(K) || '{}') || {}; } catch (e) { v = {}; }
    var o = JSON.parse(JSON.stringify(DEF));
    for (var k in o) if (v[k] !== undefined) o[k] = v[k];
    o.adj = Object.assign({}, DEF.adj, v.adj || {}); o.on = Object.assign({}, DEF.on, v.on || {});
    return o;
  }
  function set(p) {
    var S = load();
    for (var k in p) S[k] = p[k];
    try { localStorage.setItem(K, JSON.stringify(S)); } catch (e) {}
    cache.t = null;
    hooks.forEach(function (f) { try { f(S); } catch (e) {} });
    paintLinks(); tick();
    return S;
  }

  // ---- the times (adhan-js, imported when first needed) ----
  var libP = null;
  function lib() { return libP || (libP = import(LIB).catch(function (e) { libP = null; throw e; })); }
  function params(L, S) {
    var P = (L.CalculationMethod[S.method] || L.CalculationMethod.NorthAmerica)();
    P.madhab = S.madhab === 'hanafi' ? L.Madhab.Hanafi : L.Madhab.Shafi;
    P.highLatitudeRule = L.HighLatitudeRule.recommended(new L.Coordinates(S.loc.lat, S.loc.lon));
    ORDER.forEach(function (k) { P.adjustments[k] = +S.adj[k] || 0; });
    return P;
  }
  function timesFor(L, S, date) {
    var pt = new L.PrayerTimes(new L.Coordinates(S.loc.lat, S.loc.lon), date, params(L, S)), o = {};
    ORDER.forEach(function (k) { o[k] = pt[k]; });
    return o;
  }
  function times(date) {
    var S = load();
    if (!S.loc) return Promise.resolve(null);
    return lib().then(function (L) { return timesFor(L, S, date || new Date()); });
  }
  function next(from) {                      // the next prayer (sunrise is not one)
    var S = load(), now = from || new Date();
    if (!S.loc) return Promise.resolve(null);
    return lib().then(function (L) {
      var t = timesFor(L, S, now);
      for (var i = 0; i < CALLS.length; i++) if (t[CALLS[i]] > now) return { name: CALLS[i], at: t[CALLS[i]], today: t };
      var t2 = timesFor(L, S, new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
      return { name: 'fajr', at: t2.fajr, today: t, tomorrow: t2 };
    });
  }
  var cache = { day: '', t: null };
  function dayKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function today() {
    var S = load(), k = dayKey(new Date());
    if (!S.loc) return Promise.resolve(null);
    if (cache.t && cache.day === k) return Promise.resolve(cache.t);
    return lib().then(function (L) { cache = { day: k, t: timesFor(L, S, new Date()) }; return cache.t; });
  }

  // ---- the athan files (IndexedDB "hifz-athan", store "files": main, fajr) ----
  var dbp = null;
  function db() {
    if (!dbp) dbp = new Promise(function (ok, no) {
      if (!window.indexedDB) { no(new Error('IndexedDB unavailable')); return; }
      var r = indexedDB.open('hifz-athan', 1);
      r.onupgradeneeded = function () { if (!r.result.objectStoreNames.contains('files')) r.result.createObjectStore('files'); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { dbp = null; no(r.error); };
    });
    return dbp;
  }
  function idb(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (ok, no) {
        var t = d.transaction('files', mode), out = fn(t.objectStore('files'));
        t.oncomplete = function () { ok(out && out.result); }; t.onerror = t.onabort = function () { no(t.error); };
      });
    });
  }
  function file(kind) { return idb('readonly', function (s) { return s.get(kind); }).then(function (v) { return v || null; }, function () { return null; }); }
  function saveFile(kind, blob, name) { return idb('readwrite', function (s) { s.put({ blob: blob, name: name || '', size: blob.size, at: new Date().toISOString() }, kind); }); }
  function dropFile(kind) { return idb('readwrite', function (s) { s.delete(kind); }); }

  // ---- playing ----
  var audio = null, actx = null, banner = null, hideT = 0, now = null;     // now: what plays ({file} or {chime})
  function chime() {                         // three soft notes, twice: when no athan file is set
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) return Promise.reject(new Error('no audio'));
    actx = actx || new C();
    var ctx = actx;            // resume() may wait for a tap: give it a moment, then report it blocked
    return Promise.race([ctx.resume(), new Promise(function (ok) { setTimeout(ok, 400); })]).then(function () {
      if (ctx.state !== 'running') throw new Error('blocked');
      var t0 = ctx.currentTime + 0.05;
      [0, 1].forEach(function (rep) {
        [523.25, 659.25, 783.99].forEach(function (f, i) {
          var o = ctx.createOscillator(), g = ctx.createGain(), at = t0 + rep * 2.2 + i * 0.55;
          o.type = 'sine'; o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.35, at + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, at + 1.4);
          o.connect(g); g.connect(ctx.destination); o.start(at); o.stop(at + 1.5);
        });
      });
      clearTimeout(hideT); hideT = setTimeout(hideBanner, 20000);
      setTimeout(function () { if (actx === ctx) ended(); }, 5000);
      return 'chime';
    });
  }
  function play(kind) {
    stop(true);
    var want = kind === 'fajr' ? 'fajr' : 'main';
    return file(want).then(function (f) { return f || (want === 'fajr' ? file('main') : null); }).then(function (f) {
      if (!f) return chime().then(function (r) { now = { chime: true }; return r; });
      audio = new Audio(URL.createObjectURL(f.blob));
      now = { file: f.name };
      audio.addEventListener('ended', function () { ended(); clearTimeout(hideT); hideT = setTimeout(hideBanner, 15000); });
      return audio.play().then(function () { return 'file'; });
    });
  }
  function ended() { now = null; document.dispatchEvent(new CustomEvent('hifz-athan-end')); }
  function stop(keepBanner) {
    var was = !!(audio || actx);
    if (audio) { try { audio.pause(); URL.revokeObjectURL(audio.src); } catch (e) {} audio = null; }
    if (actx) { try { actx.close(); } catch (e) {} actx = null; }
    if (was) ended();
    if (!keepBanner) hideBanner();
  }

  // ---- the banner at the top of the page ----
  function showBanner(k, at) {
    if (!document.body) return;
    if (!banner) {
      banner = document.createElement('div'); banner.className = 'athb ui'; banner.setAttribute('role', 'alert');
      banner.innerHTML = '<span class="athb-t"></span><button type="button" class="athb-play" hidden></button>' +
        '<button type="button" class="athb-stop"></button><button type="button" class="athb-x">×</button>';
      document.body.appendChild(banner);
      banner.querySelector('.athb-stop').addEventListener('click', function () { stop(); });
      banner.querySelector('.athb-x').addEventListener('click', function () { stop(); });
      banner.querySelector('.athb-play').addEventListener('click', function () {
        var k2 = banner.getAttribute('data-k'); this.hidden = true;
        play(k2).catch(function () { banner.querySelector('.athb-play').hidden = false; });
      });
    }
    banner.setAttribute('data-k', k); banner.setAttribute('data-at', at.getTime());
    paintBanner();
    banner.hidden = false;
    clearTimeout(hideT); hideT = setTimeout(hideBanner, 10 * 60000);
  }
  function paintBanner() {
    if (!banner) return;
    banner.setAttribute('dir', lang() === 'ar' ? 'rtl' : 'ltr');
    banner.querySelector('.athb-t').textContent = fmt(T('now'), T(banner.getAttribute('data-k')), fmtTime(new Date(+banner.getAttribute('data-at'))));
    banner.querySelector('.athb-stop').textContent = T('stop');
    banner.querySelector('.athb-play').textContent = T('play');
    var x = banner.querySelector('.athb-x'); x.setAttribute('aria-label', T('close')); x.title = T('close');
  }
  function hideBanner() { clearTimeout(hideT); if (banner) banner.hidden = true; }

  // ---- calling a prayer ----
  function call(k, at) {
    try { var P = window.HifzPlayer; if (P) { var st = P.state(); if (st.running && !st.paused) P.toggle(); } } catch (e) {}
    try { if (window.HifzRecite) window.HifzRecite.stop(); } catch (e) {}
    showBanner(k, at);
    play(k).catch(function () { if (banner) banner.querySelector('.athb-play').hidden = false; });   // blocked until a tap
    if (document.hidden && load().notify) notify(k, at);
  }
  function notify(k, at) {
    if (!('Notification' in window) || Notification.permission !== 'granted' || !navigator.serviceWorker) return;
    navigator.serviceWorker.ready.then(function (reg) {
      reg.showNotification(fmt(T('notif'), T(k)), { body: fmtTime(at), tag: 'hifz-athan', renotify: true,
        icon: root + 'icons/icon-192.png', lang: lang(), dir: lang() === 'ar' ? 'rtl' : 'ltr' });
    }).catch(function () {});
  }
  function doneList(day) { try { return (JSON.parse(localStorage.getItem(DONE) || '{}') || {})[day] || []; } catch (e) { return []; } }
  function mark(day, k) {
    var o = {}; o[day] = doneList(day).concat([k]);
    try { localStorage.setItem(DONE, JSON.stringify(o)); } catch (e) {}       // today's only
  }
  function tick() {
    var S = load();
    if (!S.loc) return Promise.resolve();
    return today().then(function (t) {
      if (!t) return;
      var now = Date.now(), day = dayKey(new Date()), was = doneList(day);
      CALLS.forEach(function (k) {
        if (was.indexOf(k) >= 0) return;
        var at = t[k].getTime();
        if (now < at) return;
        mark(day, k);
        if (now - at < LATE && S.athan && S.on[k]) call(k, t[k]);              // later than that: not called
      });
    }).catch(function () {});
  }

  // ---- links to the prayer page ----
  function addLink() {
    var mb = document.querySelector('.tools [data-mushaf]');
    if (!mb || document.querySelector('.tools [data-salat]')) return;
    var a = document.createElement('a');
    a.className = 'vw sl'; a.setAttribute('data-salat', ''); a.href = root + 'salat.html';
    a.innerHTML = '<span class="sl-i" aria-hidden="true">🕋</span><span class="sl-t"></span>';
    if (/(^|\/)salat\.html$/.test(location.pathname)) a.setAttribute('aria-current', 'page');
    mb.parentNode.insertBefore(a, mb.nextSibling);
  }
  function paintLinks() {
    var a = document.querySelector('.tools [data-salat]'), h = document.querySelector('[data-salat-next]');
    if (!a && !h) return;
    next().then(function (n) {
      var label = n ? fmt(T('nextL'), T(n.name), fmtTime(n.at), until(n.at - Date.now())) : T('setLoc');
      if (a) { a.querySelector('.sl-t').textContent = n ? T(n.name) + ' ' + fmtTime(n.at) : ''; a.title = T('link') + (n ? ' · ' + label : ''); a.setAttribute('aria-label', a.title); }
      if (h) h.textContent = '🕋 ' + label;
    }, function () {});
  }

  function ready() {                       // core.js may load this file before the page is parsed
    addLink(); paintLinks();
    if (window.hifzUI) window.hifzUI.on(function () { paintLinks(); paintBanner(); });
    setTimeout(tick, 600);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
  setInterval(function () { tick(); }, 5000);
  setInterval(paintLinks, 30000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { tick(); paintLinks(); } });

  window.HifzSalat = {
    get: load, set: set, times: times, next: next, lib: lib, file: file, saveFile: saveFile, dropFile: dropFile,
    play: function (k) { return play(k || 'main'); }, stop: function () { stop(); }, tick: tick,
    playing: function () { return !!((audio && !audio.paused) || actx); }, current: function () { return now; },
    on: function (fn) { hooks.push(fn); }, fmtTime: fmtTime, until: until, name: function (k) { return T(k); },
    order: ORDER, calls: CALLS
  };
})();
