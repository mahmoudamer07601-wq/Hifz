/* Hifz web app: the segment players of a surah file (mode 'web' of tools/make_book.py).
   A player plays the surah's recording from data-t0 to data-t1 — the seconds at which the
   segment's mp3 was cut (the ledger's audio_start_s and audio_end_s) — or the segment's own mp3
   when one is saved on this device (app/core.js).  «Repeat» starts it again at data-t0.
   One audio element serves the whole file, so starting a segment stops the one playing. */
(function () {
  'use strict';
  var A = window.HifzAudio;
  if (!A) return;
  var au = new Audio(), cur = null, tm = 0, srcKey = '', blobUrl = '', token = 0, list = [];
  var de = document.documentElement;
  au.preload = 'auto';

  [].forEach.call(document.querySelectorAll('.player'), function (p) {
    var b = p.querySelector('.play[data-t0]');
    if (!b) return;
    list.push({ p: p, b: b, s: +b.getAttribute('data-s'), k: b.getAttribute('data-k'),
      t0: +b.getAttribute('data-t0'), t1: +b.getAttribute('data-t1'), whole: false, drag: false,
      loop: p.querySelector('.loop'), row: p.querySelector('.seekrow'), pos: p.querySelector('.pos'),
      seek: p.querySelector('.seek'), err: p.querySelector('.perr') });
  });

  function lang() { var u = de.getAttribute('data-ui'); return u === 'en' || u === 'es' ? u : 'ar'; }
  function digits(s) {
    return lang() === 'ar' ? String(s).replace(/[0-9]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.charAt(+d); }) : String(s);
  }
  function clock(t) {
    t = Math.max(0, Math.round(t));
    var h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t % 60;
    return digits((h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (s < 10 ? '0' : '') + s);
  }
  function begin(c) { return c.whole ? 0 : c.t0; }
  function length(c) {
    if (c.whole) return isFinite(au.duration) && au.duration > 0 ? au.duration : c.t1 - c.t0;
    return c.t1 - c.t0;
  }
  function show(c) {
    if (!c) return;
    var L = length(c), x = cur === c ? Math.min(Math.max(au.currentTime - begin(c), 0), L) : 0;
    c.pos.textContent = clock(x) + ' / ' + clock(L);
    if (!c.drag) c.seek.value = L > 0 ? Math.round(1000 * x / L) : 0;
  }
  function mark(c, on) {
    c.p.classList.toggle('playing', on);
    var ic = c.b.querySelector('.ic');
    if (ic) ic.textContent = on ? '⏸' : '▶';
  }
  function stopTimer() { if (tm) clearTimeout(tm); tm = 0; }
  // a timer to the end of the segment (timeupdate alone can be a quarter of a second late)
  function schedule() {
    stopTimer();
    if (!cur || au.paused || cur.whole) return;
    var left = (cur.t1 - au.currentTime) / (au.playbackRate || 1);
    tm = setTimeout(check, Math.max(0, left * 1000 - 20));
  }
  function atEnd() {
    var c = cur;
    if (c.loop.checked) { au.currentTime = begin(c); if (au.paused) play(c); }
    else { au.pause(); au.currentTime = begin(c); show(c); }
  }
  // While the page is hidden (screen off, another app in front) the browser may hold the timer
  // back, and only timeupdate (about every 0.25 s) is sure to come: then stop at the first one
  // within 0.125 s of the cut, so the stop falls on one side or the other of the cut by at most
  // 0.125 s — inside the pause, since the cut sits in its middle.
  function check() {
    if (!cur) return;
    var early = document.hidden ? 0.125 : 0.025;
    if (!cur.whole && au.currentTime >= cur.t1 - early) atEnd(); else schedule();
  }
  function fail(c) { mark(c, false); c.err.hidden = false; }
  function play(c) {
    var pr = au.play();
    if (pr && pr.catch) pr.catch(function (e) { if (!e || e.name !== 'AbortError') fail(c); });
  }

  au.addEventListener('timeupdate', function () { if (cur) { check(); show(cur); } });
  au.addEventListener('play', function () { if (cur) mark(cur, true); });
  au.addEventListener('playing', function () { if (cur) { mark(cur, true); cur.err.hidden = true; schedule(); } });
  au.addEventListener('pause', function () { stopTimer(); if (cur) mark(cur, false); });
  au.addEventListener('seeked', schedule);
  au.addEventListener('ratechange', schedule);
  au.addEventListener('ended', function () { if (cur) atEnd(); });
  au.addEventListener('error', function () { if (cur) fail(cur); });

  function media(c) {
    if (!('mediaSession' in navigator) || !window.MediaMetadata) return;
    var sec = c.p.closest('section'), h = sec && sec.querySelector('h1'), s = document.querySelector('.idx h1');
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: h ? h.textContent.trim() : '', artist: 'محمد صديق المنشاوي', album: s ? s.textContent.trim() : '',
        artwork: [{ src: A.root + 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                  { src: A.root + 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }] });
      var ms = navigator.mediaSession;
      ms.setActionHandler('play', function () { if (cur) play(cur); });
      ms.setActionHandler('pause', function () { au.pause(); });
      ms.setActionHandler('previoustrack', function () { var i = list.indexOf(cur); if (i > 0) start(list[i - 1]); });
      ms.setActionHandler('nexttrack', function () { var i = list.indexOf(cur); if (i >= 0 && i < list.length - 1) start(list[i + 1]); });
    } catch (e) {}
  }

  function start(c) {
    var my = ++token;
    if (cur && cur !== c) { au.pause(); cur.row.hidden = true; mark(cur, false); }
    cur = c; c.err.hidden = true; c.row.hidden = false; show(c);
    A.source(c.s, c.k).then(function (src) {
      if (my !== token) { if (src.url.indexOf('blob:') === 0) URL.revokeObjectURL(src.url); return; }
      c.whole = src.whole;
      if (src.key !== srcKey) {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        blobUrl = src.url.indexOf('blob:') === 0 ? src.url : '';
        srcKey = src.key;
        au.src = src.url;
      } else if (src.url.indexOf('blob:') === 0) {
        URL.revokeObjectURL(src.url);
      }
      function go() {
        if (my !== token) return;
        try { au.currentTime = begin(c); } catch (e) {}
        play(c); media(c); show(c);
      }
      if (au.readyState >= 1) go();
      else au.addEventListener('loadedmetadata', function once() { au.removeEventListener('loadedmetadata', once); go(); });
    });
  }

  list.forEach(function (c) {
    c.b.addEventListener('click', function () {
      if (cur === c && srcKey && au.readyState >= 1) {
        if (!au.paused) { au.pause(); return; }
        if (!c.whole && (au.currentTime < c.t0 - 0.05 || au.currentTime >= c.t1 - 0.05)) au.currentTime = c.t0;
        play(c);
        return;
      }
      start(c);
    });
    c.seek.addEventListener('input', function () {
      c.drag = true;
      if (cur !== c || au.readyState < 1) return;
      au.currentTime = begin(c) + length(c) * c.seek.value / 1000;
      show(c);
    });
    c.seek.addEventListener('change', function () { c.drag = false; });
  });
  if (window.hifzUI) window.hifzUI.on(function () { list.forEach(show); });
  window.HifzPlayer = { audio: au, current: function () { return cur; }, list: list };   // for tests
})();
