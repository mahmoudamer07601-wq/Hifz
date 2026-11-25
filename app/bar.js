/* Hifz web app: the toolbar of every page (tools/ui.py app_bar), 2026-11-25, at the learner's request: "I want to see
   more of Quran text and less of the toolbars above and below the text without removing any feature or making it too
   hard to find … use drop-down menus to consolidate commands".
   - ☰ (.tb-mb) opens the menu (#tb-menu): home, read through, drills, Mushaf, prayer times, night mode, guide,
     language.  On a phone, ▾ of a surah file (.hn-more) opens the surah and juzʾ arrows (#hn-pop; on a wide screen
     they stand in the row, app/view.css).  A button with aria-expanded and aria-controls opens its box and closes the
     others; a tap outside, Escape, a choice in the menu, an arrow of the box or a scroll by the reader closes it.
   - 🔍 (.tb-fb), on a phone: the search field of tools/refs.py over the whole row (html.tb-finding), with ✕ to close
     it (Escape too); on a wide screen the field stands in the row.
   - While the reader scrolls down through the text by hand (touch, wheel or keys; not the player following the
     recitation, nor an arrow's jump), the toolbar slides up out of sight and the practice bar of app/player.js down
     (html.bars-off), except while it plays (html.is-playing); a scroll up, the top or the end of the page, or the
     keyboard's focus on a bar brings them back.  The display panel switches this off (app/view.js, "autohide").
   - On a wide screen the practice bar stands in the middle of the toolbar's row (html.pb-top), where the row has room.
   window.HifzBar = {show(), hidden(), bottom()} for the other scripts.
   Interface text in three languages, following the switch of tools/ui.py (window.hifzUI). */
(function () {
  'use strict';
  var de = document.documentElement, tb = document.querySelector('.tools');
  if (!tb || !tb.querySelector('.tb-mb')) return;
  var TX = { ar: { close: 'إغلاق البحث' }, en: { close: 'Close the search' }, es: { close: 'Cerrar la búsqueda' } };
  function lang() { var u = de.getAttribute('data-ui'); return u === 'en' || u === 'es' ? u : 'ar'; }
  function T(k) { return TX[lang()][k]; }

  // ---------------------------------------------------------------- the boxes that open from the bar
  function boxOf(b) { return document.getElementById(b.getAttribute('aria-controls')); }
  function toggles() { return [].slice.call(tb.querySelectorAll('[aria-controls][aria-expanded]')); }
  function setOpen(b, on) {
    var x = boxOf(b);
    if (!x) return;
    x.hidden = !on;
    b.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  function anyOpen() { return toggles().some(function (b) { return b.getAttribute('aria-expanded') === 'true'; }); }
  function closeAll(except) {
    toggles().forEach(function (b) { if (b !== except && b.getAttribute('aria-expanded') === 'true') setOpen(b, false); });
  }
  tb.addEventListener('click', function (e) {
    var t = e.target;
    var b = t.closest ? t.closest('[aria-controls][aria-expanded]') : null;
    if (b && tb.contains(b)) {
      var on = b.getAttribute('aria-expanded') !== 'true';
      closeAll(b); setOpen(b, on);
      if (on) show();
      return;
    }
    if (t.closest && (t.closest('.tb-menu a, .tb-menu button') || t.closest('.hn-pop a[href]'))) closeAll();   // chosen, or gone where it leads
  });
  document.addEventListener('click', function (e) { if (!tb.contains(e.target)) closeAll(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    if (anyOpen()) {
      var b = toggles().filter(function (x) { return x.getAttribute('aria-expanded') === 'true'; })[0];
      closeAll(); if (b && b.focus) b.focus();
    } else if (de.classList.contains('tb-finding')) finding(false);
  });

  // ---------------------------------------------------------------- the search, on a phone
  var fb = tb.querySelector('.tb-fb'), slot = tb.querySelector('.tb-find'), xb = null;
  function hsBox() { return slot && slot.querySelector('.hs-box'); }
  function finding(on) {
    if (!fb) return;
    on = !!on;
    de.classList.toggle('tb-finding', on);
    fb.setAttribute('aria-expanded', on ? 'true' : 'false');
    var bx = hsBox(), inp = bx && bx.querySelector('.hs-q');
    if (on) {
      closeAll(); show();
      if (bx && !xb) {            // ✕ beside the field (and the microphone of app/voice.js)
        xb = document.createElement('button'); xb.type = 'button'; xb.className = 'tb-x'; xb.textContent = '✕';
        xb.addEventListener('click', function () { finding(false); });
        bx.appendChild(xb); label();
      }
      if (inp) { inp.focus(); try { inp.select(); } catch (e2) {} }
    } else if (inp && document.activeElement === inp) inp.blur();
  }
  if (fb) fb.addEventListener('click', function () { finding(!de.classList.contains('tb-finding')); });
  function label() { if (xb) { xb.title = T('close'); xb.setAttribute('aria-label', T('close')); } }
  // a wide screen shows the field in the row: no overlay to keep
  var wide = window.matchMedia ? window.matchMedia('(min-width: 761px)') : null;
  function onWide() { if (wide && wide.matches) { de.classList.remove('tb-finding'); if (fb) fb.setAttribute('aria-expanded', 'false'); closeAll(); } }
  if (wide) { if (wide.addEventListener) wide.addEventListener('change', onWide); else if (wide.addListener) wide.addListener(onWide); }

  // ---------------------------------------------------------------- hiding the bars while the reader scrolls down
  function enabled() {
    var v = window.HifzView && window.HifzView.get ? window.HifzView.get() : {};
    return v.autohide !== false;
  }
  function setOff(off) {
    if (off === de.classList.contains('bars-off')) return;
    de.classList.toggle('bars-off', off);
  }
  var acc = 0;
  function show() { acc = 0; setOff(false); }
  var userT = 0, lastT = 0, chain = false, lastY = window.scrollY || 0;
  function user() { userT = Date.now(); }
  window.addEventListener('wheel', user, { passive: true });
  window.addEventListener('touchmove', user, { passive: true });
  window.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable)) return;
    if (/^(Arrow(Up|Down)|Page(Up|Down)|Home|End| )$/.test(e.key)) user();
  });
  window.addEventListener('scroll', function () {
    var y = window.scrollY || 0, dy = y - lastY, now = Date.now();
    lastY = y;
    // the reader's own scroll: just after his touch, wheel or key, and the glide that follows a flick
    var mine = now - userT < 450 || (chain && now - lastT < 160);
    chain = mine; lastT = now;
    var end = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    if (y <= Math.max(12, tb.offsetHeight) || y >= end - 48) { show(); return; }
    if (!mine) return;
    if (anyOpen()) closeAll();
    if (!enabled() || de.classList.contains('tb-finding') || typing()) { show(); return; }
    if (dy > 0) { acc = acc > 0 ? acc + dy : dy; if (acc > 28) setOff(true); }
    else if (dy < 0) { acc = acc < 0 ? acc + dy : dy; if (acc < -14) setOff(false); }
  }, { passive: true });
  // the bar stays while one types in it, or moves through it with the keyboard; a click leaves its button focused, which
  // does not hold the bar (else, with the practice bar in the row, it would never go after ▶)
  function typing() {
    var a = document.activeElement;
    if (!a || !tb.contains(a)) return false;
    if (/INPUT|TEXTAREA|SELECT/.test(a.tagName)) return true;
    try { return a.matches(':focus-visible'); } catch (e) { return false; }
  }
  tb.addEventListener('focusin', function () { if (typing()) show(); });
  // a touch or a click on the practice bar keeps both bars in view (a pause does not send it away under the finger)
  function onPbar(e) { var p = document.querySelector('.pbar'); if (p && p.contains(e.target)) show(); }
  document.addEventListener('focusin', onPbar);
  document.addEventListener('pointerdown', onPbar, true);
  document.addEventListener('hifz-view', function () { if (!enabled()) show(); });

  // ---------------------------------------------------------------- the practice bar in the row, on a wide screen
  // 2026-11-25, at the learner's request: "can you merge the audio toolbar with the top toolbar? I see a lot of space in
  // the middle of the top one and a lot of side space in the lower one".  Where the row has room for it (PB_EM of the
  // row's letter size besides everything else in it), the practice bar of app/player.js moves into the middle of the row
  // (html.pb-top, app/book.css); else, a phone or a narrow window, it stays at the bottom of the screen.  Checked when the
  // page has loaded, when the window, the language, the button size or the reference panel change the room.
  var PB_EM = 28, pbT = 0, rpWas = null;
  function placePbar() {
    var pb = document.querySelector('.pbar'), slot = tb.querySelector('.tb-sp');
    if (!pb || !slot) return;
    var cs = getComputedStyle(tb), fs = parseFloat(cs.fontSize) || 13, gap = parseFloat(cs.columnGap) || 0;
    var used = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0), n = 0;
    [].forEach.call(tb.children, function (c) {
      if (c === slot) return;
      var st = getComputedStyle(c);
      if (st.display === 'none' || st.position === 'absolute' || st.position === 'fixed') return;
      used += c.getBoundingClientRect().width; n++;
    });
    var top = pb.parentNode === slot, room = tb.clientWidth - used - gap * n;
    var fit = room >= PB_EM * fs * (top ? 0.96 : 1);          // a little slack once it is there, so that it does not flap
    if (fit && !top) { slot.appendChild(pb); de.classList.add('pb-top'); }
    else if (!fit && top) { document.body.appendChild(pb); de.classList.remove('pb-top'); }
  }
  function placeLater() { clearTimeout(pbT); pbT = setTimeout(placePbar, 60); }
  document.addEventListener('DOMContentLoaded', placePbar);          // after app/player.js has made its bar
  window.addEventListener('load', placeLater);
  window.addEventListener('resize', placeLater);
  document.addEventListener('hifz-view', placeLater);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeLater);
  if (window.MutationObserver) new MutationObserver(function () {   // the reference panel of a wide screen narrows the page
    var rp = de.classList.contains('rp-open');
    if (rp !== rpWas) { rpWas = rp; placeLater(); }
  }).observe(de, { attributes: true, attributeFilter: ['class'] });

  if (window.hifzUI) window.hifzUI.on(function () { label(); placeLater(); });
  window.HifzBar = { show: show, hidden: function () { return de.classList.contains('bars-off'); }, finding: finding, close: closeAll,
    // the height the practice bar covers at the bottom of the screen: none while it stands in the toolbar's row
    bottom: function () {
      var b = document.querySelector('.pbar');
      if (!b || de.classList.contains('pb-top') || getComputedStyle(b).display === 'none') return 0;
      return Math.max(0, window.innerHeight - b.getBoundingClientRect().top);
    } };
})();
