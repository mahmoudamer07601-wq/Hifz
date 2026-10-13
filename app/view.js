/* Hifz web app: display settings on every page (2026-10-12, at the learner's request: a night
   mode with colours and brightness he can read without glasses, larger text).
   - Settings kept on this device (localStorage "hifz-view"), applied before the page is drawn by
     ui.VIEW_JS and here after every change: theme (auto follows the phone's dark mode, light,
     night, black), text size, line spacing, font, bold letters, tajweed colours on or off, the
     size of the controls, keeping the screen on while practising.
   - The toolbar's Aa button opens the display panel; ☾ switches night mode on and off; "Mushaf"
     opens a small box to go to any page of the Mushaf (mushaf.html), on the page in view.
   - window.HifzView = {get(), set(patch), on(fn), theme()} for the other scripts.
   Interface text in three languages, following the switch of tools/ui.py (window.hifzUI). */
(function () {
  'use strict';
  var K = 'hifz-view', de = document.documentElement, hooks = [];
  var FONTS = [['Uthman Naskh', 'عثمان طه نسخ', 'Uthman Taha Naskh', 'Uthman Taha Naskh'],
               ['Uthman Hafs', 'مصحف المدينة (حفص)', 'Madinah Mushaf (Hafs)', 'Mushaf de Medina (Hafs)'],
               ['Amiri Quran', 'أميري قرآن', 'Amiri Quran', 'Amiri Quran'],
               ['Scheherazade New', 'شهرزاد', 'Scheherazade', 'Scheherazade']];
  var DEF = { theme: 'auto', size: 1, lead: '1', font: 'Uthman Naskh', bold: false, plain: false, ui: 1, awake: true };
  var TX = {
    ar: { title: 'عرض النص', theme: 'الوضع', light: 'نهاري', night: 'ليلي', black: 'أسود', auto: 'حسب الجهاز',
      size: 'حجم الخط', lead: 'تباعد الأسطر', l1: 'عادي', l2: 'واسع', l3: 'أوسع', font: 'الخط', bold: 'حروف عريضة',
      colors: 'ألوان التجويد', ui: 'حجم الأزرار', u1: 'عادي', u2: 'كبير', u3: 'أكبر', awake: 'إبقاء الشاشة مضاءة أثناء التلاوة والاختبار',
      done: 'تم', smaller: 'أصغر', larger: 'أكبر', goTitle: 'المصحف', go: 'اذهب', page: 'صفحة', pgLbl: 'رقم الصفحة (١–٦٠٤)',
      cur: 'الصفحة الحالية: {0}', R: 'يمين', L: 'يسار', nightOn: 'الوضع الليلي: مفعّل', nightOff: 'الوضع الليلي' },
    en: { title: 'Display', theme: 'Mode', light: 'Light', night: 'Night', black: 'Black', auto: 'Like the device',
      size: 'Text size', lead: 'Line spacing', l1: 'Normal', l2: 'Wide', l3: 'Wider', font: 'Font', bold: 'Bold letters',
      colors: 'Tajweed colours', ui: 'Button size', u1: 'Normal', u2: 'Large', u3: 'Larger', awake: 'Keep the screen on while reciting and testing',
      done: 'Done', smaller: 'Smaller', larger: 'Larger', goTitle: 'Mushaf', go: 'Go', page: 'Page', pgLbl: 'Page number (1–604)',
      cur: 'Current page: {0}', R: 'right', L: 'left', nightOn: 'Night mode: on', nightOff: 'Night mode' },
    es: { title: 'Visualización', theme: 'Modo', light: 'Claro', night: 'Noche', black: 'Negro', auto: 'Como el dispositivo',
      size: 'Tamaño del texto', lead: 'Interlineado', l1: 'Normal', l2: 'Amplio', l3: 'Más amplio', font: 'Fuente', bold: 'Letras en negrita',
      colors: 'Colores del tajwid', ui: 'Tamaño de los botones', u1: 'Normal', u2: 'Grande', u3: 'Más grande',
      awake: 'Mantener la pantalla encendida al recitar y practicar',
      done: 'Listo', smaller: 'Más pequeño', larger: 'Más grande', goTitle: 'Mushaf', go: 'Ir', page: 'Página', pgLbl: 'Número de página (1–604)',
      cur: 'Página actual: {0}', R: 'derecha', L: 'izquierda', nightOn: 'Modo nocturno: activado', nightOff: 'Modo nocturno' }
  };
  function lang() { var u = de.getAttribute('data-ui'); return u === 'en' || u === 'es' ? u : 'ar'; }
  function T(k) { return TX[lang()][k]; }
  function fmt(s) { var a = arguments; return String(s).replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1]; }); }
  function nm(n) { return lang() === 'ar' ? String(n).replace(/[0-9]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.charAt(+d); }) : String(n); }

  function load() {
    var v = {};
    try { v = JSON.parse(localStorage.getItem(K) || '{}') || {}; } catch (e) { v = {}; }
    var o = {};
    for (var k in DEF) o[k] = v[k] === undefined ? DEF[k] : v[k];
    return o;
  }
  var S = load();
  function save() { try { localStorage.setItem(K, JSON.stringify(S)); } catch (e) {} }
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function theme() {
    var t = S.theme;
    if (t === 'auto') t = mq && mq.matches ? 'night' : 'light';
    return t === 'night' || t === 'black' ? t : 'light';
  }
  function apply() {
    var t = theme();
    de.setAttribute('data-theme', t);
    if (S.bold) de.setAttribute('data-bold', ''); else de.removeAttribute('data-bold');
    if (S.plain) de.setAttribute('data-plain', ''); else de.removeAttribute('data-plain');
    if (S.lead && S.lead !== '1') de.setAttribute('data-lead', S.lead); else de.removeAttribute('data-lead');
    de.style.setProperty('--qscale', String(+S.size || 1));
    de.style.setProperty('--ui', String(+S.ui || 1));
    de.style.setProperty('--qfont', '"' + String(S.font || DEF.font).replace(/["\\]/g, '') + '"');
    if ((+S.size || 1) >= 1.4) de.setAttribute('data-big', ''); else de.removeAttribute('data-big');
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'black' ? '#000000' : t === 'night' ? '#24221d' : '#f3f0e8');
    [].forEach.call(document.querySelectorAll('[data-theme-toggle]'), function (b) {
      b.setAttribute('aria-pressed', t === 'light' ? 'false' : 'true');
      b.textContent = t === 'light' ? '☾' : '☀';
      var l = t === 'light' ? T('nightOff') : T('nightOn');
      b.setAttribute('title', l); b.setAttribute('aria-label', l);
    });
    if (sheet && !sheet.hidden) paint();
    for (var i = 0; i < hooks.length; i++) { try { hooks[i](S, t); } catch (e) {} }
  }
  function set(p) { for (var k in p) S[k] = p[k]; save(); apply(); }
  if (mq) { var f = function () { if (S.theme === 'auto') apply(); }; if (mq.addEventListener) mq.addEventListener('change', f); else if (mq.addListener) mq.addListener(f); }

  // ---- the display panel ----
  var sheet = null, shade = null, lastFocus = null;
  var SIZES = [0.8, 0.9, 1, 1.1, 1.2, 1.35, 1.5, 1.7, 1.9, 2.2, 2.5, 2.8, 3.2];
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function seg(key, opts) {
    var g = el('div', 'vseg');
    opts.forEach(function (o) {
      var b = el('button'); b.type = 'button'; b.setAttribute('data-k', key); b.setAttribute('data-v', String(o[0]));
      b.setAttribute('data-l', o[1]); g.appendChild(b);
    });
    return g;
  }
  function group(lbl, body) { var g = el('div', 'vg'); var l = el('span', 'vl'); l.setAttribute('data-l', lbl); g.appendChild(l); g.appendChild(body); return g; }
  function sw(key, lbl) {
    var r = el('div', 'vrow'); var t = el('span'); t.setAttribute('data-l', lbl);
    var b = el('button', 'vsw'); b.type = 'button'; b.setAttribute('data-sw', key); b.setAttribute('role', 'switch');
    r.appendChild(t); r.appendChild(b); return r;
  }
  function build() {
    shade = el('div', 'vshade'); shade.hidden = true;
    sheet = el('div', 'vsheet ui'); sheet.hidden = true; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true');
    var h = el('h2'); h.setAttribute('data-l', 'title'); sheet.appendChild(h);
    sheet.appendChild(group('theme', seg('theme', [['light', 'light'], ['night', 'night'], ['black', 'black'], ['auto', 'auto']])));
    var st = el('div', 'vstep');
    var m = el('button'); m.type = 'button'; m.setAttribute('data-step', '-1'); m.textContent = 'A−';
    var o = el('output'); var p = el('button'); p.type = 'button'; p.setAttribute('data-step', '1'); p.textContent = 'A+';
    st.appendChild(m); st.appendChild(o); st.appendChild(p);
    sheet.appendChild(group('size', st));
    sheet.appendChild(group('lead', seg('lead', [['1', 'l1'], ['2', 'l2'], ['3', 'l3']])));
    sheet.appendChild(group('font', seg('font', FONTS.map(function (f) { return [f[0], 'font:' + f[0]]; }))));
    var sws = el('div', 'vg'); sws.appendChild(sw('colors', 'colors')); sws.appendChild(sw('bold', 'bold')); sws.appendChild(sw('awake', 'awake'));
    sheet.appendChild(sws);
    sheet.appendChild(group('ui', seg('ui', [['1', 'u1'], ['1.25', 'u2'], ['1.5', 'u3']])));
    var d = el('button', 'vdone'); d.type = 'button'; d.setAttribute('data-l', 'done'); sheet.appendChild(d);
    document.body.appendChild(shade); document.body.appendChild(sheet);
    sheet.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-k')) {
        var k = b.getAttribute('data-k'), v = b.getAttribute('data-v');
        var p2 = {}; p2[k] = k === 'ui' ? +v : v; set(p2);
      } else if (b.hasAttribute('data-step')) {
        var i = 0, cur = +S.size || 1;
        for (var j = 0; j < SIZES.length; j++) if (Math.abs(SIZES[j] - cur) < Math.abs(SIZES[i] - cur)) i = j;
        i = Math.max(0, Math.min(SIZES.length - 1, i + (+b.getAttribute('data-step'))));
        set({ size: SIZES[i] });
      } else if (b.hasAttribute('data-sw')) {
        var key = b.getAttribute('data-sw');
        if (key === 'colors') set({ plain: !S.plain }); else { var q = {}; q[key] = !S[key]; set(q); }
      } else if (b.classList.contains('vdone')) close();
    });
    shade.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet && !sheet.hidden) close(); });
  }
  function label(k) {
    if (k.indexOf('font:') === 0) {
      var f = k.slice(5);
      for (var i = 0; i < FONTS.length; i++) if (FONTS[i][0] === f) return FONTS[i][{ ar: 1, en: 2, es: 3 }[lang()]];
    }
    return T(k);
  }
  function paint() {
    sheet.setAttribute('dir', lang() === 'ar' ? 'rtl' : 'ltr');
    sheet.setAttribute('aria-label', T('title'));
    [].forEach.call(sheet.querySelectorAll('[data-l]'), function (e) { e.textContent = label(e.getAttribute('data-l')); });
    [].forEach.call(sheet.querySelectorAll('[data-k]'), function (b) {
      var k = b.getAttribute('data-k'), v = b.getAttribute('data-v');
      var on = k === 'ui' ? Math.abs((+S.ui || 1) - (+v)) < 0.01 : String(S[k]) === v;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (k === 'font') b.style.fontFamily = '"' + v + '",serif';
    });
    sheet.querySelector('output').textContent = nm(Math.round((+S.size || 1) * 100)) + (lang() === 'ar' ? '٪' : '%');
    [].forEach.call(sheet.querySelectorAll('[data-step]'), function (b) {
      var l = b.getAttribute('data-step') === '1' ? T('larger') : T('smaller'); b.setAttribute('aria-label', l); b.title = l;
    });
    [].forEach.call(sheet.querySelectorAll('[data-sw]'), function (b) {
      var k = b.getAttribute('data-sw'), on = k === 'colors' ? !S.plain : !!S[k];
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', label(k));
    });
  }
  function open() {
    if (!sheet) build();
    lastFocus = document.activeElement;
    paint(); shade.hidden = false; sheet.hidden = false;
    var f = sheet.querySelector('[aria-pressed="true"]') || sheet.querySelector('button'); if (f) f.focus();
  }
  function close() { if (!sheet) return; sheet.hidden = true; shade.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }

  // ---- go to a page of the Mushaf ----
  var pop = null;
  function root() { return (window.HifzAudio && window.HifzAudio.root) || ''; }
  function curPage() {
    var p = 0;
    try { if (window.HifzPage) p = window.HifzPage(); } catch (e) { p = 0; }
    if (!p) { try { p = +localStorage.getItem('hifz-mushaf-page') || 0; } catch (e) { p = 0; } }
    return p || 1;
  }
  function popup(anchor) {
    if (document.querySelector('main.mushaf')) {          // on the Mushaf page itself: its own page box
      var i = document.querySelector('.mb-p'); if (i) { i.focus(); i.select(); } return;
    }
    if (!pop) {
      pop = el('div', 'vpop ui'); pop.hidden = true; pop.setAttribute('role', 'dialog');
      pop.innerHTML = '<h2 style="margin:0 0 .3rem;font-size:1.05em" data-l="goTitle"></h2><p class="vcur"></p>' +
        '<form><input type="number" min="1" max="604" step="1" inputmode="numeric" required>' +
        '<button type="submit" class="vbtn on" data-l="go"></button></form>';
      document.body.appendChild(pop);
      pop.querySelector('form').addEventListener('submit', function (e) {
        e.preventDefault();
        var n = Math.max(1, Math.min(604, Math.round(+pop.querySelector('input').value || 0)));
        if (!n) return;
        location.href = root() + 'mushaf.html#p=' + n;
      });
      document.addEventListener('click', function (e) {
        if (pop.hidden) return;
        if (!pop.contains(e.target) && !e.target.closest('[data-mushaf]')) pop.hidden = true;
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pop && !pop.hidden) pop.hidden = true; });
    }
    var p = curPage();
    pop.setAttribute('dir', lang() === 'ar' ? 'rtl' : 'ltr');
    [].forEach.call(pop.querySelectorAll('[data-l]'), function (e) { e.textContent = T(e.getAttribute('data-l')); });
    pop.querySelector('.vcur').textContent = fmt(T('cur'), nm(p) + ' · ' + T(p % 2 ? 'R' : 'L'));
    var inp = pop.querySelector('input'); inp.value = p; inp.setAttribute('aria-label', T('pgLbl'));
    pop.hidden = !pop.hidden;
    if (!pop.hidden) { inp.focus(); inp.select(); }
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-view-open],[data-theme-toggle],[data-mushaf]');
    if (!b) return;
    if (b.hasAttribute('data-view-open')) { e.preventDefault(); open(); }
    else if (b.hasAttribute('data-theme-toggle')) { e.preventDefault(); set({ theme: theme() === 'light' ? 'night' : 'light' }); }
    else if (b.hasAttribute('data-mushaf')) { e.preventDefault(); popup(b); }
  });
  if (window.hifzUI) window.hifzUI.on(function () { apply(); });
  window.HifzView = { get: function () { var o = {}; for (var k in S) o[k] = S[k]; return o; }, set: set, theme: theme,
    on: function (fn) { hooks.push(fn); }, open: open, close: close };
  apply();
})();
