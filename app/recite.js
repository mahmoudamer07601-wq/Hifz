/* Hifz web app: reciting aloud in test mode (app/test.js), 2026-10-12, at the learner's request
   ("orally recite the ayahs and get instant feedback"; he chose both ways below).
   - Recite aloud: the browser's speech recognition in Arabic (in Chrome it is Google's service:
     it needs the internet, and the voice goes to Google, as with voice typing).  What it hears
     is matched, word by word, against the segment's own words from where the test stands: a word
     heard is shown (green); a word skipped or said otherwise is shown in red and its ayah marked
     as a slip.  Matching compares letters only (marks dropped, alif forms, tāʾ marbūṭa, alif
     maqṣūra and hamza seats folded; dagger alif read as alif), with room for the recogniser's
     spelling (edit distance), and two words heard as one or one heard as two.  It checks the
     words, not the tajweed.  A final result counts once even when the recogniser sends it again,
     and a result that repeats the previous one before going on (Chrome on Android may give the
     whole text again; the reciter may start the phrase again) counts only its new words, unless
     the repeated words are what the text says next.
   - Record yourself: the microphone is recorded on this device only (MediaRecorder; kept in the
     browser, IndexedDB "hifz-rec", one recording per segment); play it back, the reciter's
     segment, or both one after the other.
   window.HifzRecite = {canListen(), canRecord(), toggle(sec, button), stop(sec), record(sec, button),
   align(expected, heard)} (align is pure, for the tests).
   Interface text in three languages, following the switch of tools/ui.py (window.hifzUI). */
(function () {
  'use strict';
  var W = window.HifzWords;
  if (!W) return;
  var de = document.documentElement;
  var TX = {
    ar: { listening: 'أستمع… ابدأ التلاوة', stopL: 'أوقف الاستماع', heard: 'سُمع: {0}', noMic: 'اسمح للمتصفح باستعمال الميكروفون.',
      noNet: 'التحقق الفوري يحتاج اتصالاً بالإنترنت.', noRec: 'لا يدعم هذا المتصفح التعرّف على الكلام.', done: 'انتهى المقطع: {0} صحيحة، {1} فاتتك.',
      score: '{0} صحيحة · {1} فاتتك', rec: 'جارٍ التسجيل… {0}', stopR: 'أوقف التسجيل', mine: 'تلاوتي', his: 'القارئ', both: 'القارئ ثم أنا',
      del: 'احذف التسجيل', saved: 'تسجيلك ({0}) محفوظ على هذا الجهاز فقط.', privacy: 'التعرّف على الكلام من خدمة المتصفح (Google في Chrome)، ويحتاج اتصالاً.' },
    en: { listening: 'Listening… start reciting', stopL: 'Stop listening', heard: 'Heard: {0}', noMic: 'Allow the browser to use the microphone.',
      noNet: 'Live checking needs an internet connection.', noRec: "This browser doesn't offer speech recognition.", done: 'End of the segment: {0} right, {1} missed.',
      score: '{0} right · {1} missed', rec: 'Recording… {0}', stopR: 'Stop recording', mine: 'Mine', his: 'Reciter', both: 'Reciter, then me',
      del: 'Delete the recording', saved: 'Your recording ({0}) is kept on this device only.', privacy: "Speech recognition is the browser's service (Google in Chrome) and needs a connection." },
    es: { listening: 'Escuchando… empiece a recitar', stopL: 'Dejar de escuchar', heard: 'Oído: {0}', noMic: 'Permita al navegador usar el micrófono.',
      noNet: 'La comprobación en directo necesita conexión a internet.', noRec: 'Este navegador no ofrece reconocimiento de voz.', done: 'Fin del segmento: {0} bien, {1} omitidas.',
      score: '{0} bien · {1} omitidas', rec: 'Grabando… {0}', stopR: 'Detener la grabación', mine: 'La mía', his: 'Recitador', both: 'Recitador y luego yo',
      del: 'Borrar la grabación', saved: 'Su grabación ({0}) se guarda solo en este dispositivo.', privacy: 'El reconocimiento de voz es un servicio del navegador (Google en Chrome) y necesita conexión.' }
  };
  function lang() { var u = de.getAttribute('data-ui'); return u === 'en' || u === 'es' ? u : 'ar'; }
  function T(k) { return TX[lang()][k]; }
  function nm(n) { return lang() === 'ar' ? String(n).replace(/[0-9]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.charAt(+d); }) : String(n); }
  function fmt(s) { var a = arguments; return String(s).replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1]; }); }
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  // ---- matching ----
  function norm(t) {
    t = String(t).replace(/ـ?ٰ/g, 'ا');                     // dagger alif (on a tatweel or a letter) = alif
    t = t.replace(/[ؐ-ًؚ-ٟۖ-ۭـ]/g, '');
    t = t.replace(/[ٱآأإ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
      .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ء/g, '');
    return t.replace(/[^ء-ي]/g, '');
  }
  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    if (!m) return n; if (!n) return m;
    for (j = 0; j <= n; j++) d[j] = j;
    for (i = 1; i <= m; i++) {
      var prev = d[0]; d[0] = i;
      for (j = 1; j <= n; j++) { var tmp = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)); prev = tmp; }
    }
    return d[n];
  }
  function like(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    var l = Math.max(a.length, b.length);
    if (l <= 2) return false;
    return 1 - lev(a, b) / l >= (l <= 4 ? 0.74 : 0.66);
  }
  // two words heard as one, or one heard as two: a closer match is asked for
  function close(a, b) { return !!a && !!b && (a === b || 1 - lev(a, b) / Math.max(a.length, b.length) >= 0.85); }
  // expected: [normalised words]; heard: [normalised words]; from: index in expected.
  // Returns {ok: [indices matched], miss: [indices skipped], at: next index}.
  function align(expected, heard, from) {
    var p = from || 0, ok = [], miss = [], i = 0, unk = 0;
    while (i < heard.length && p < expected.length) {
      var h = heard[i];
      if (like(h, expected[p])) { ok.push(p); p++; i++; unk = 0; continue; }
      if (i + 1 < heard.length && close(h + heard[i + 1], expected[p])) { ok.push(p); p++; i += 2; unk = 0; continue; }
      if (p + 1 < expected.length && close(h, expected[p] + expected[p + 1])) { ok.push(p, p + 1); p += 2; i++; unk = 0; continue; }
      var j = -1;
      for (var k = 1; k <= 3 && p + k < expected.length; k++) if (like(h, expected[p + k])) { j = k; break; }
      if (j > 0) { for (var x = 0; x < j; x++) miss.push(p + x); ok.push(p + j); p += j + 1; i++; unk = 0; continue; }
      i++; unk++;
      if (unk >= 2) { miss.push(p); p++; unk = 0; }
    }
    return { ok: ok, miss: miss, at: p };
  }

  // ---- live checking ----
  var live = null;        // {sec, rec, btn, words, exp, at, okN, missN, stopped}
  function canListen() { return !!SR; }
  function status(sec, t, bad) {
    var l = sec.querySelector('.tb-live'); if (!l) return;
    l.hidden = !t; l.textContent = t || ''; l.classList.toggle('bad', !!bad);
  }
  function start(sec, btn) {
    if (!SR) { status(sec, T('noRec'), true); return; }
    if (live) stop(live.sec);
    var ws = [].slice.call(sec.querySelectorAll('.quran .wd[data-i]'));
    var at = 0;
    for (var i = 0; i < ws.length; i++) if (!ws[i].classList.contains('shown')) { at = i; break; }
    var rec = new SR();
    rec.lang = 'ar-SA'; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    live = { sec: sec, rec: rec, btn: btn, words: ws, exp: ws.map(function (w) { return norm(w.textContent); }), at: at, okN: 0, missN: 0, stopped: false,
             done: {}, last: [] };
    var me = live;
    rec.onresult = function (e) {
      if (live !== me) return;
      var interim = '';
      for (var r = e.resultIndex; r < e.results.length; r++) {
        var res = e.results[r], txt = res[0].transcript;
        if (!res.isFinal) interim += txt;
        else if (!me.done[r]) { me.done[r] = true; feed(me, txt); }   // a final result counts once, even when sent again
      }
      status(sec, interim ? fmt(T('heard'), interim) : T('listening') + ' · ' + fmt(T('score'), nm(me.okN), nm(me.missN)));
    };
    rec.onerror = function (e) {
      if (live !== me) return;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { status(sec, T('noMic'), true); stop(sec); }
      else if (e.error === 'network') { status(sec, T('noNet'), true); stop(sec); }
      else if (e.error === 'audio-capture') { status(sec, T('noMic'), true); stop(sec); }
    };
    rec.onend = function () { if (live === me && !me.stopped) { me.done = {}; try { rec.start(); } catch (x) {} } };   // a new session numbers its results anew
    try { rec.start(); } catch (x) { status(sec, T('noRec'), true); live = null; return; }
    btn.classList.add('busy', 'on'); btn.textContent = T('stopL');
    status(sec, T('listening') + ' — ' + T('privacy'));
  }
  function feed(me, txt) {
    var all = String(txt).split(/\s+/).map(norm).filter(function (x) { return x; });
    // a result that repeats the previous one before going on (Chrome on Android may give the whole text again, or the
    // reciter starts the phrase again): the repeated words are dropped, unless they are what the text says next
    var prev = me.last, k = 0;
    if (prev.length && all.length >= prev.length) {
      while (k < prev.length && all[k] === prev[k]) k++;
      if (k < prev.length) k = 0;
      else { var fit = align(me.exp, all.slice(0, k), me.at); if (fit.ok.length === k && !fit.miss.length) k = 0; }
    }
    me.last = all;
    var heard = all.slice(k);
    if (!heard.length) return;
    var r = align(me.exp, heard, me.at);
    r.ok.forEach(function (k) { var w = me.words[k]; w.classList.add('shown', 'ok'); w.classList.remove('miss'); me.okN++; });
    r.miss.forEach(function (k) {
      var w = me.words[k]; w.classList.add('shown', 'miss'); me.missN++;
      var a = +w.getAttribute('data-a'); if (a && window.HifzTest) window.HifzTest.slip(a);
    });
    me.at = r.at;
    var cur = me.words[Math.min(me.at, me.words.length - 1)];
    if (cur) { try { cur.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (x) {} }
    if (me.at >= me.words.length) { var sec = me.sec; stop(sec); status(sec, fmt(T('done'), nm(me.okN), nm(me.missN)), me.missN > 0); }
  }
  function stop(sec) {
    if (!live || (sec && live.sec !== sec)) return;
    var me = live; live = null; me.stopped = true;
    try { me.rec.abort(); } catch (x) {}
    me.btn.classList.remove('busy', 'on');
    if (window.HifzTest) window.HifzTest.paint(me.sec);
  }
  function toggle(sec, btn) { if (live && live.sec === sec) { stop(sec); status(sec, ''); } else start(sec, btn); }

  // ---- record and compare ----
  var DBN = 'hifz-rec', dbp = null;
  function db() {
    if (!dbp) dbp = new Promise(function (ok, no) {
      var r = indexedDB.open(DBN, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('rec'); };
      r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); };
    });
    return dbp;
  }
  function idb(mode, fn) { return db().then(function (d) { return new Promise(function (ok, no) { var t = d.transaction('rec', mode), out = fn(t.objectStore('rec')); t.oncomplete = function () { ok(out && out.result); }; t.onerror = function () { no(t.error); }; }); }); }
  function canRecord() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder && window.indexedDB); }
  var recs = null;      // {sec, mr, stream, t0, btn, timer}
  function stemOf(sec) { var b = sec.querySelector('.player .play[data-k]'); return b ? b.getAttribute('data-k') : sec.id; }
  function record(sec, btn) {
    if (recs) { var same = recs.sec === sec; recs.mr.stop(); if (same) return; }
    if (!canRecord()) return;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var mr = new MediaRecorder(stream), chunks = [];
      recs = { sec: sec, mr: mr, stream: stream, t0: Date.now(), btn: btn };
      mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      mr.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        clearInterval(recs && recs.timer);
        var dur = (Date.now() - (recs ? recs.t0 : Date.now())) / 1000;
        recs = null; btn.classList.remove('busy', 'on');
        if (window.HifzTest) window.HifzTest.paint(sec);
        var blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
        idb('readwrite', function (s) { return s.put({ blob: blob, dur: dur, at: Date.now() }, stemOf(sec)); }).then(function () { panel(sec); }, function () { panel(sec, { blob: blob, dur: dur }); });
      };
      mr.start(250);
      btn.classList.add('busy', 'on');
      recs.timer = setInterval(function () { if (recs) btn.textContent = T('stopR') + ' · ' + clock((Date.now() - recs.t0) / 1000); }, 500);
      btn.textContent = T('stopR');
      if (window.HifzPlayer) { var st = window.HifzPlayer.state(); if (st.running && !st.paused) window.HifzPlayer.toggle(); }
    }, function () { status(sec, T('noMic'), true); });
  }
  function clock(t) { t = Math.max(0, Math.round(t)); var m = Math.floor(t / 60), s = t % 60; return nm(m + ':' + (s < 10 ? '0' : '') + s); }
  var mine = new Audio(), mineUrl = '';
  function panel(sec, direct) {
    var box = sec.querySelector('.tb-rec'); if (!box) return;
    (direct ? Promise.resolve(direct) : idb('readonly', function (s) { return s.get(stemOf(sec)); })).then(function (r) {
      if (!r) { box.hidden = true; return; }
      box.hidden = false;
      box.innerHTML = '<p>' + fmt(T('saved'), clock(r.dur || 0)) + '</p><div class="vseg"><button type="button" data-r="mine">▶ ' + T('mine') + '</button>' +
        '<button type="button" data-r="his">▶ ' + T('his') + '</button><button type="button" data-r="both">▶ ' + T('both') + '</button>' +
        '<button type="button" data-r="del">✕ ' + T('del') + '</button></div>';
      box.onclick = function (e) {
        var b = e.target.closest('[data-r]'); if (!b) return;
        var k = b.getAttribute('data-r');
        if (k === 'del') { idb('readwrite', function (s) { return s.delete(stemOf(sec)); }).then(function () { box.hidden = true; }); return; }
        if (k === 'mine') playMine(r.blob);
        else if (k === 'his') playHis(sec, null);
        else if (k === 'both') playHis(sec, function () { playMine(r.blob); });
      };
    }, function () { box.hidden = true; });
  }
  function playMine(blob) {
    if (window.HifzPlayer) { var st = window.HifzPlayer.state(); if (st.running && !st.paused) window.HifzPlayer.toggle(); }
    if (mineUrl) URL.revokeObjectURL(mineUrl);
    mineUrl = URL.createObjectURL(blob); mine.src = mineUrl; mine.play();
  }
  function playHis(sec, then) {
    mine.pause();
    var P = window.HifzPlayer; if (!P) return;
    var g = W.segOf(+(sec.querySelector('.quran .wd[data-a]') || { getAttribute: function () { return 1; } }).getAttribute('data-a'));
    if (!g) return;
    var keep = P.settings.rep, kd = P.settings.drill, kc = P.settings.chain, kg = P.settings.gap;
    P.settings.rep = 1; P.settings.drill = 0; P.settings.chain = false; P.settings.gap = 0;
    P.start({ kind: 'seg', a0: g[1], a1: g[2], id: g[0] });
    P.settings.rep = keep; P.settings.drill = kd; P.settings.chain = kc; P.settings.gap = kg;
    if (then) {
      var iv = setInterval(function () { var st = P.state(); if (!st.running) { clearInterval(iv); then(); } }, 300);
    }
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('section.seg .player .tst');
    if (t) setTimeout(function () { var sec = t.closest('section'); if (sec.classList.contains('testing')) panel(sec); }, 0);
  });
  window.HifzRecite = { canListen: canListen, canRecord: canRecord, toggle: toggle, stop: function (sec) { stop(sec); if (recs && (!sec || recs.sec === sec)) recs.mr.stop(); },
    record: record, align: align, norm: norm, like: like };
})();
