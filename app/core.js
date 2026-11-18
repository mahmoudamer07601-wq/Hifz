/* Hifz web app (tools/make_app.py): loaded first by every page of the app.
   - registers the service worker (sw.js in the app's top folder), so the app opens offline;
   - window.HifzAudio: where a segment's audio comes from — the segment's own mp3 or the surah's
     recording saved on this device (IndexedDB "hifz-audio": store "files" holds the mp3s, store
     "meta" what each one is), else the recording's address (data-cdn, NNN = the surah, the same
     recording the ledger's cut times were measured on);
   - keeps the browser's install prompt for the Install button of the home page;
   - loads app/athan.js (prayer times and the athan) on every page.
   The script tag carries data-root (the app's top folder relative to the page) and data-cdn.
   Reciters (2026-11-18, al-ʿAfasy added at the learner's request): data-reciters lists them,
   [{k: key, u: address pattern (NNN = surah on three digits, {s} = without zeros), n: [name ar, en,
   es], x: [surahs his timings do not fit, played by the first reciter]}]; the first is the ledger's
   (Minshawi, data-cdn).  The choice is kept on the device (localStorage "hifz-reciter"); a surah file
   reads it before its words are timed (app/words.js), so a change reloads the page.  Saved recordings
   of the first reciter keep their keys ("surah:NNN", "seg:<stem>"); another reciter's are "af:surah:NNN"
   (no segment mp3s: the segments are cut from the first reciter's recording). */
(function () {
  'use strict';
  var me = document.currentScript,
    root = (me && me.getAttribute('data-root')) || '',
    cdn = (me && me.getAttribute('data-cdn')) || '';
  var DBN = 'hifz-audio', dbp = null, RK = 'hifz-reciter';
  var RECS = null;
  try { RECS = JSON.parse((me && me.getAttribute('data-reciters')) || 'null'); } catch (e) { RECS = null; }
  if (!RECS || !RECS.length) RECS = [{ k: 'mn', u: cdn, n: ['محمد صديق المنشاوي', 'Muḥammad Ṣiddīq al-Minshāwī', 'Muḥammad Ṣiddīq al-Minshāwī'], x: [] }];
  function info(k) { for (var i = 0; i < RECS.length; i++) if (RECS[i].k === k) return RECS[i]; return RECS[0]; }
  function chosen() {
    var k = null;
    try { k = localStorage.getItem(RK); } catch (e) {}
    return info(k).k;
  }
  // the reciter that plays surah s: the chosen one, unless his timings do not fit that surah
  function recFor(s, k) { var r = info(k || chosen()); return r.x && r.x.indexOf(+s) >= 0 ? RECS[0].k : r.k; }

  function pad(s) { s = String(s); while (s.length < 3) s = '0' + s; return s; }

  function db() {
    if (!dbp) dbp = new Promise(function (res, rej) {
      if (!window.indexedDB) { rej(new Error('IndexedDB unavailable')); return; }
      var r = indexedDB.open(DBN, 1);
      r.onupgradeneeded = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains('files')) d.createObjectStore('files');
        if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta');
      };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
      r.onblocked = function () { rej(new Error('IndexedDB blocked')); };
    });
    return dbp;
  }

  // run fn(transaction) and resolve when the transaction completes
  function tx(stores, mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction(stores, mode), out = fn(t);
        t.oncomplete = function () { res(out); };
        t.onerror = t.onabort = function () { rej(t.error || new Error('transaction aborted')); };
      });
    });
  }

  var A = window.HifzAudio = {
    root: root,
    pad: pad,
    reciters: RECS,
    info: info,
    // the chosen reciter, and the one that plays surah s (the first where the chosen one's timings do not fit)
    rec: chosen,
    recFor: recFor,
    first: function () { return RECS[0].k; },
    setRec: function (k) {
      k = info(k).k;
      try { localStorage.setItem(RK, k); } catch (e) {}
      document.dispatchEvent(new CustomEvent('hifz-reciter', { detail: k }));
    },
    // the name of reciter k (default: the one of surah s, or the chosen one) in language l (ar, en, es)
    name: function (l, k) { var r = info(k || chosen()); return r.n[l === 'en' ? 1 : l === 'es' ? 2 : 0]; },
    // the recording of surah s at its address (reciter k, default: the one that plays it)
    url: function (s, k) { return info(k || recFor(s)).u.replace('NNN', pad(s)).replace('{s}', String(+s)); },
    // the key a whole surah is saved under on this device
    key: function (s, k) { k = k || recFor(s); return (k === RECS[0].k ? '' : k + ':') + 'surah:' + pad(s); },
    // a saved mp3 (Blob) or null; keys: "surah:NNN" (a whole surah), "seg:<stem>" (one segment)
    get: function (key) {
      var q;
      return tx('files', 'readonly', function (t) { q = t.objectStore('files').get(key); })
        .then(function () { return q.result || null; }, function () { return null; });
    },
    put: function (key, blob, info) {
      return tx(['files', 'meta'], 'readwrite', function (t) {
        t.objectStore('files').put(blob, key);
        t.objectStore('meta').put(info, key);
      });
    },
    del: function (key) {
      return tx(['files', 'meta'], 'readwrite', function (t) {
        t.objectStore('files').delete(key);
        t.objectStore('meta').delete(key);
      });
    },
    // {key: info} of everything saved
    list: function () {
      var k, v;
      return tx('meta', 'readonly', function (t) { var s = t.objectStore('meta'); k = s.getAllKeys(); v = s.getAll(); })
        .then(function () {
          var o = {}, i;
          for (i = 0; i < k.result.length; i++) o[k.result[i]] = v.result[i];
          return o;
        }, function () { return {}; });
    },
    // where segment <stem> of surah s plays from:
    // {url, key, whole: true when the mp3 is the segment itself, saved: on this device}
    source: function (s, stem) {
      var k = recFor(s), first = k === RECS[0].k;
      return (first ? A.get('seg:' + stem) : Promise.resolve(null)).then(function (b) {
        if (b) return { url: URL.createObjectURL(b), key: 'seg:' + stem, whole: true, saved: true };
        return A.get(A.key(s, k)).then(function (b2) {
          if (b2) return { url: URL.createObjectURL(b2), key: A.key(s, k), whole: false, saved: true };
          return { url: A.url(s, k), key: 'url:' + k + ':' + pad(s), whole: false, saved: false };
        });
      });
    },
    install: null      // the browser's install prompt, when it offers one
  };

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register(root + 'sw.js').catch(function () {});
    });
  }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    A.install = e;
    document.dispatchEvent(new CustomEvent('hifz-installable'));
  });
  window.addEventListener('appinstalled', function () {
    A.install = null;
    document.dispatchEvent(new CustomEvent('hifz-installed'));
  });
  // the prayer times and the athan on every page (app/athan.js, 2026-10-29); salat.html loads it itself too
  if (document.head && !window.HifzSalat) {
    var sa = document.createElement('script');
    sa.src = root + 'app/athan.js';
    document.head.appendChild(sa);
  }
})();
