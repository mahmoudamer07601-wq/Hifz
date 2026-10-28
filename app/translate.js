/* Hifz web app: the translations of the meanings (2026-10-28, at the learner's request: "a feature that
   shows ayahs English and Spanish translation when I touch the ayah on my phone or hover with a mouse").
   - With a mouse: resting the pointer on the words of an ayah for a moment shows a card beside them with
     the ayah in the translations chosen in the display settings (Aa: both, English, Spanish or off); it
     stays while the pointer is on the ayah or on the card.  A click on a word still plays from it.
   - On a touch screen: a tap on a word shows the card at the bottom of the screen and lights its ayah,
     instead of playing at once; ▶ in the card plays from that word, and the card then follows the
     recitation ayah by ayah.  × or a tap outside the text closes it.  With the translations off a tap
     plays from the word as before.
   - Not in test mode (the meaning would give the words away), nor on the ayah numbers (they open the
     reference panel).
   - The translations are the kit's (tools/translations.py: from Tanzil.net, unchanged), one file per surah
     in tr/ (tools/make_app.py), fetched when first needed and kept by the service worker for offline use.
     The card names each translation and links to tanzil.net/trans/, as Tanzil asks.
   window.HifzTranslate = {show(a, i, how), hide(), shown(), data()} for the tests.
   Interface text in three languages, following the switch of tools/ui.py (window.hifzUI). */
(function () {
  'use strict';
  var W = window.HifzWords, Au = window.HifzAudio;
  if (!W || !Au) return;
  var D = W.D, S = D.s, de = document.documentElement;
  var TX = {
    ar: { ayah: 'الآية {0}', play: '▶ من هنا', playA: '▶ من أول الآية', close: 'إغلاق', loading: 'جارٍ تحميل الترجمة…',
      err: 'تعذّر تحميل الترجمة: لا اتصال، والملف غير محفوظ بعد على هذا الجهاز.', src: 'الترجمات من {0} بلا تغيير.',
      lang: { en: 'الإنجليزية', es: 'الإسبانية' }, card: 'ترجمة معاني الآية' },
    en: { ayah: 'Ayah {0}', play: '▶ From here', playA: '▶ From the ayah', close: 'Close', loading: 'Loading the translation…',
      err: "Couldn't load the translation: offline, and it isn't saved on this device yet.", src: 'Translations from {0}, unchanged.',
      lang: { en: 'English', es: 'Spanish' }, card: 'Translation of the ayah' },
    es: { ayah: 'Aleya {0}', play: '▶ Desde aquí', playA: '▶ Desde la aleya', close: 'Cerrar', loading: 'Cargando la traducción…',
      err: 'No se pudo cargar la traducción: sin conexión y aún no está guardada en este dispositivo.', src: 'Traducciones de {0}, sin cambios.',
      lang: { en: 'Inglés', es: 'Español' }, card: 'Traducción de la aleya' }
  };
  function lang() { var u = de.getAttribute('data-ui'); return u === 'en' || u === 'es' ? u : 'ar'; }
  function L() { return TX[lang()]; }
  function nm(n) { return lang() === 'ar' ? String(n).replace(/[0-9]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.charAt(+d); }) : String(n); }
  function fmt(s) { var a = arguments; return String(s).replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1]; }); }
  function pad(s) { s = String(s); while (s.length < 3) s = '0' + s; return s; }
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function choice() { var v = window.HifzView ? window.HifzView.get().tr : 'both'; return v === 'off' ? '' : (v || 'both'); }

  // ---- the data: tr/NNN.json, fetched once ----
  var data = null, pending = null;
  function load() {
    if (data) return Promise.resolve(data);
    if (!pending) {
      pending = fetch(Au.root + 'tr/' + pad(S) + '.json').then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (d) {
        if (!d || d.s !== S || !d.t) throw new Error('not this surah');
        data = d; return d;
      }, function (e) { pending = null; throw e; });
    }
    return pending;
  }

  // ---- the card ----
  var card = null, ref, playB, xB, body, src, cur = null, lit = [];
  function build() {
    card = el('div', 'trc ui'); card.hidden = true; card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'false');
    var top = el('div', 'trc-top');
    ref = el('span', 'trc-ref'); playB = el('button', 'trc-play'); playB.type = 'button';
    xB = el('button', 'trc-x'); xB.type = 'button'; xB.textContent = '×';
    top.appendChild(ref); top.appendChild(playB); top.appendChild(xB);
    body = el('div', 'trc-body'); src = el('p', 'trc-src');
    card.appendChild(top); card.appendChild(body); card.appendChild(src);
    document.body.appendChild(card);
    xB.addEventListener('click', function () { hide(); });
    playB.addEventListener('click', function () {
      var P = window.HifzPlayer;
      if (!cur || !P || !P.playFrom) return;
      P.playFrom(cur.a, cur.i);
      if (cur.how === 'hover') hide(); else cur.follow = true;
    });
    card.addEventListener('pointerover', function (e) { if (e.pointerType === 'mouse') clearTimeout(hideT); });
  }
  function light(a) {
    lit.forEach(function (w) { w.classList.remove('tra'); });
    lit = a ? W.words(a).slice() : [];
    lit.forEach(function (w) { w.classList.add('tra'); });
  }
  function fill() {
    var T = L(), v = choice();
    card.setAttribute('aria-label', T.card);
    card.setAttribute('dir', lang() === 'ar' ? 'rtl' : 'ltr');
    ref.textContent = fmt(T.ayah, nm(cur.a));
    playB.textContent = cur.i ? T.play : T.playA;
    xB.setAttribute('aria-label', T.close); xB.title = T.close;
    body.innerHTML = ''; src.innerHTML = '';
    if (!data) { var p0 = el('p', 'trc-msg'); p0.textContent = cur.err ? T.err : T.loading; body.appendChild(p0); return; }
    data.t.forEach(function (t) {
      if (v !== 'both' && v !== t.lang) return;
      var box = el('div', 'trc-t'); box.setAttribute('lang', t.lang); box.setAttribute('dir', 'ltr');
      var p = el('p', 'trc-tx'); p.textContent = t.a[cur.a - 1] || '';
      var by = el('span', 'trc-by'); by.textContent = (T.lang[t.lang] || t.lang) + ' · ' + t.name;
      box.appendChild(p); box.appendChild(by); body.appendChild(box);
    });
    var parts = T.src.split('{0}'), a = el('a');
    a.href = data.link; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Tanzil.net';
    src.appendChild(document.createTextNode(parts[0])); src.appendChild(a); src.appendChild(document.createTextNode(parts[1] || ''));
  }
  function barH() {                 // the practice bar at the bottom (fixed: offsetParent is always null)
    var b = document.querySelector('.pbar');
    return b && getComputedStyle(b).display !== 'none' ? b.getBoundingClientRect().height : 0;
  }
  function place(w) {
    if (cur.how === 'tap') {
      card.style.top = ''; card.style.left = '';
      card.style.bottom = (barH() + 8) + 'px';
      if (w) {          // keep the tapped word above the card
        var r = w.getBoundingClientRect(), ct = card.getBoundingClientRect().top;
        if (r.bottom > ct - 8) window.scrollBy({ top: r.bottom - ct + 24, behavior: 'smooth' });
      }
      return;
    }
    card.style.bottom = '';
    var rr = w.getBoundingClientRect(), cw = card.offsetWidth, ch = card.offsetHeight;
    var vw = de.clientWidth, vh = window.innerHeight - barH();
    var y = rr.bottom + 10;
    if (y + ch > vh - 8) y = rr.top - 10 - ch >= 8 ? rr.top - 10 - ch : Math.max(8, vh - ch - 8);
    var x = Math.min(Math.max(8, rr.left + rr.width / 2 - cw / 2), vw - cw - 8);
    card.style.top = (y + window.scrollY) + 'px'; card.style.left = (x + window.scrollX) + 'px';
  }
  function show(a, i, how, w) {
    if (!choice() || !a) return;
    if (!card) build();
    clearTimeout(hideT);
    cur = { a: a, i: i || 0, how: how, follow: false, err: false };
    card.className = 'trc ui ' + how;
    light(a);
    fill();
    card.hidden = false;
    place(w || W.words(a)[0]);
    var mine = cur;
    load().then(function () { if (cur === mine) { fill(); place(w || W.words(a)[0]); } },   // the card is taller now
                function () { if (cur === mine) { cur.err = true; fill(); } });
  }
  function hide() {
    clearTimeout(hideT); clearTimeout(hoverT);
    if (card) card.hidden = true;
    cur = null; light(0);
  }

  // ---- touch: a tap on a word shows the card (and does not start the recitation) ----
  var lastPT = 'mouse';
  document.addEventListener('pointerdown', function (e) { lastPT = e.pointerType || 'mouse'; }, true);
  function wordOf(t) {
    var w = t && t.closest && t.closest('.quran .wd');
    if (!w || !w.hasAttribute('data-a') || w.closest('section.testing')) return null;
    return w;
  }
  document.addEventListener('click', function (e) {
    if (!choice()) return;
    var pt = e.pointerType || lastPT;
    if (pt !== 'touch' && pt !== 'pen') return;
    if (e.target.closest && e.target.closest('.aya')) return;      // ayah numbers: the reference panel
    var w = wordOf(e.target);
    if (!w) return;
    e.stopPropagation();                                            // not the player's tap-to-play: ▶ in the card plays
    show(+w.getAttribute('data-a'), +w.getAttribute('data-i') || 0, 'tap', w);
  }, true);
  document.addEventListener('click', function (e) {               // a tap anywhere else closes the card
    if (!cur || cur.how !== 'tap' || card.contains(e.target)) return;
    hide();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && cur) hide(); });

  // ---- mouse: resting on an ayah shows the card beside it ----
  var hoverT = 0, hideT = 0;
  function schedHide() { clearTimeout(hideT); hideT = setTimeout(function () { if (cur && cur.how === 'hover') hide(); }, 300); }
  document.addEventListener('pointerover', function (e) {
    if (e.pointerType !== 'mouse' || !choice()) return;
    if (card && card.contains(e.target)) { clearTimeout(hideT); return; }
    var w = wordOf(e.target);
    clearTimeout(hoverT);
    if (!w) { if (cur && cur.how === 'hover') schedHide(); return; }
    clearTimeout(hideT);
    var a = +w.getAttribute('data-a');
    if (cur && cur.a === a) return;
    if (cur && cur.how === 'tap') return;                           // a card opened by a tap stays until closed
    hoverT = setTimeout(function () { show(a, 0, 'hover', w); }, cur ? 150 : 350);
  });
  de.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { clearTimeout(hoverT); schedHide(); } });

  // ---- after ▶ in the card, the card follows the recitation ----
  var P0 = window.HifzPlayer;
  if (P0 && P0.audio) P0.audio.addEventListener('timeupdate', function () {
    if (!cur || !cur.follow || !card || card.hidden) return;
    var st = window.HifzPlayer.state();
    if (!st.running || !st.a || st.a === cur.a) return;
    cur.a = st.a; cur.i = 0; light(st.a); fill();
  });

  // settings and language
  if (window.HifzView) window.HifzView.on(function () { if (!choice()) { if (cur) hide(); } else if (cur) fill(); });
  if (window.hifzUI) window.hifzUI.on(function () { if (cur) fill(); });
  if (choice()) setTimeout(function () { load().catch(function () {}); }, 1500);   // ready before the first touch

  window.HifzTranslate = {
    show: function (a, i, how) { show(a, i, how || 'tap', null); }, hide: hide,
    shown: function () { return cur ? { a: cur.a, i: cur.i, how: cur.how, follow: cur.follow } : null; },
    data: function () { return load(); }
  };
})();
