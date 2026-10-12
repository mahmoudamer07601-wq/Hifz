/* Hifz web app (tools/make_app.py): loaded first by every page of the app.
   - registers the service worker (sw.js in the app's top folder), so the app opens offline;
   - window.HifzAudio: where a segment's audio comes from — the segment's own mp3 or the surah's
     recording saved on this device (IndexedDB "hifz-audio": store "files" holds the mp3s, store
     "meta" what each one is), else the recording's address (data-cdn, NNN = the surah, the same
     recording the ledger's cut times were measured on);
   - keeps the browser's install prompt for the Install button of the home page.
   The script tag carries data-root (the app's top folder relative to the page) and data-cdn. */
(function () {
  'use strict';
  var me = document.currentScript,
    root = (me && me.getAttribute('data-root')) || '',
    cdn = (me && me.getAttribute('data-cdn')) || '';
  var DBN = 'hifz-audio', dbp = null;

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
    // the recording of surah s at its address
    url: function (s) { return cdn.replace('NNN', pad(s)); },
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
      return A.get('seg:' + stem).then(function (b) {
        if (b) return { url: URL.createObjectURL(b), key: 'seg:' + stem, whole: true, saved: true };
        return A.get('surah:' + pad(s)).then(function (b2) {
          if (b2) return { url: URL.createObjectURL(b2), key: 'surah:' + pad(s), whole: false, saved: true };
          return { url: A.url(s), key: 'url:' + pad(s), whole: false, saved: false };
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
})();
