/* Hifz web app: the prayer page (salat.html, tools/make_app.py), 2026-10-29, at the learner's request: "add
   athan (the daily prayer calls) to the Hifz app and qibla direction".
   - Today's times (Fajr, sunrise, Dhuhr, Asr, Maghrib, Isha) for his location, the next prayer and the time
     left, the Gregorian and Hijri (Umm al-Qura) dates; each prayer's athan on or off (the bell).
   - Location from the device (asked once; kept on this device only) or typed coordinates.
   - The convention (ISNA by default, his choice; any of adhan-js's), the Asr school, minute adjustments to
     match a mosque's timetable.
   - The athan: on or off, his own mp3 for every prayer and another for Fajr if he likes (app/athan.js keeps
     them in IndexedDB on this device), a try button, notifications when the app is in the background.
   - The qibla: the great-circle bearing from true north (adhan-js), the distance to the Kaaba, and on a phone
     a live compass, corrected for the magnetic declination of the place (app/wmm.js, WMM2025), which turns
     green when the top of the phone faces the qibla.
   Settings through window.HifzSalat (app/athan.js).  Interface text in three languages, following the switch
   of tools/ui.py (window.hifzUI). */
(function () {
  'use strict';
  var S0 = window.HifzSalat, box = document.getElementById('sl');
  if (!S0 || !box) return;
  var de = document.documentElement;
  var KAABA = [21.4225241, 39.8261818];
  var METHODS = ['NorthAmerica', 'MuslimWorldLeague', 'Egyptian', 'UmmAlQura', 'Karachi', 'MoonsightingCommittee', 'Dubai', 'Qatar',
                 'Kuwait', 'Singapore', 'Turkey', 'Tehran'];
  var TX = {
    ar: {
      today: 'اليوم', hijri: '{0} (أم القرى)', loc: 'الموقع', noLoc: 'لم يُضبط الموقع بعد: المواقيت والقبلة تُحسب له.',
      gps: 'استعمل موقعي', typed: 'أدخل الإحداثيات', lat: 'خط العرض', lon: 'خط الطول', name: 'اسم المكان (اختياري)', save: 'احفظ',
      cancel: 'إلغاء', locating: 'جارٍ تحديد الموقع…', locErr: 'تعذّر تحديد الموقع: {0}', locDenied: 'لم يُسمح بالوصول إلى الموقع. اسمح به للتطبيق، أو أدخل الإحداثيات.',
      locBad: 'إحداثيات غير صحيحة: خط العرض بين −٩٠ و٩٠، وخط الطول بين −١٨٠ و١٨٠.',
      fromDev: 'من الجهاز', fromHand: 'مُدخلة يدوياً', privacy: 'يبقى الموقع على هذا الجهاز ولا يرسله التطبيق إلى أي جهة.',
      times: 'مواقيت اليوم', next: 'الصلاة القادمة: {0} {1}', tomorrow: 'فجر الغد', tz: 'بتوقيت هذا الجهاز ({0}).',
      bellOn: 'الأذان مفعّل لصلاة {0}', bellOff: 'الأذان متوقف لصلاة {0}',
      athan: 'الأذان', athanOn: 'ارفع الأذان عند دخول الوقت والتطبيق مفتوح', main: 'صوت الأذان', fajrF: 'أذان الفجر (اختياري)',
      choose: 'اختر ملفاً', tryIt: '▶ جرّب', stopIt: '■ أوقف', drop: 'احذف', none: 'لم يُختر ملف: تُسمع نغمة قصيرة بدلاً منه.',
      noneF: 'لم يُختر ملف: يُرفع أذان الصلوات الأخرى.', notAudio: 'هذا الملف ليس ملفاً صوتياً يمكن تشغيله.',
      notify: 'أشعرني إن كان التطبيق في الخلفية', notifyNo: 'لم يُسمح بالإشعارات في هذا المتصفح.',
      limits: 'يُرفع الأذان ما دام التطبيق مفتوحاً: على الشاشة، أو في نافذة خلفية على الحاسوب، فيوقف التلاوة ويؤذّن. أما والهاتف مقفل أو التطبيق مغلق فلا يستطيع تطبيق ويب أن يوقظه، فاحتفظ لذلك بتطبيق أذان مخصص.',
      calc: 'طريقة الحساب', method: 'الطريقة', asr: 'العصر', shafi: 'الجمهور (ظل المثل)', hanafi: 'الحنفي (ظل المثلين)',
      adj: 'تعديل بالدقائق ليوافق تقويم مسجدك', reset: 'أعد الضبط', fajrA: 'الفجر {0}°', ishaA: 'العشاء {0}°', ishaI: 'العشاء بعد المغرب بـ{0} دقيقة',
      mNorthAmerica: 'ISNA، أمريكا الشمالية', mMuslimWorldLeague: 'رابطة العالم الإسلامي', mEgyptian: 'الهيئة المصرية العامة للمساحة',
      mUmmAlQura: 'أم القرى، مكة المكرمة', mKarachi: 'جامعة العلوم الإسلامية، كراتشي', mMoonsightingCommittee: 'لجنة رؤية الهلال',
      mDubai: 'دبي', mQatar: 'قطر', mKuwait: 'الكويت', mSingapore: 'سنغافورة', mTurkey: 'تركيا (رئاسة الشؤون الدينية)', mTehran: 'طهران',
      qibla: 'القبلة', bearing: 'اتجاه القبلة: {0}° من الشمال الحقيقي ({1})', dist: 'المسافة إلى الكعبة: {0} كم',
      compass: 'شغّل البوصلة', compassOn: 'البوصلة تعمل: أمسك الهاتف أفقياً، وأعلاه بعيداً عنك.', facing: 'أنت مستقبل القبلة',
      turn: 'استدر {0}° {1}', right: 'يميناً', left: 'يساراً', decl: 'الانحراف المغناطيسي هنا {0}° {1}، والبوصلة مصحَّحة له.', east: 'شرقاً', west: 'غرباً',
      noCompass: 'لا بوصلة في هذا الجهاز: الشمال إلى أعلى الدائرة، فوجّه أعلى الشاشة نحو الشمال.', flat: 'أمسك الهاتف أفقياً.',
      calib: 'إن اضطرب الاتجاه فحرّك الهاتف في الهواء على شكل ٨ وابتعد عن المعادن.', denied: 'لم يُسمح باستعمال البوصلة.',
      dirs: ['الشمال', 'الشمال الشرقي', 'الشرق', 'الجنوب الشرقي', 'الجنوب', 'الجنوب الغربي', 'الغرب', 'الشمال الغربي'], N: 'ش', E: 'ق', S: 'ج', W: 'غ',
      noEngine: 'تعذّر تحميل حساب المواقيت: افتح التطبيق مرة متصلاً بالإنترنت.'
    },
    en: {
      today: 'Today', hijri: '{0} (Umm al-Qura)', loc: 'Location', noLoc: 'No location yet: the times and the qibla are worked out for it.',
      gps: 'Use my location', typed: 'Enter coordinates', lat: 'Latitude', lon: 'Longitude', name: 'Place name (optional)', save: 'Save',
      cancel: 'Cancel', locating: 'Finding your location…', locErr: "Couldn't find the location: {0}", locDenied: 'Location access was not allowed. Allow it for the app, or enter the coordinates.',
      locBad: 'Invalid coordinates: latitude between −90 and 90, longitude between −180 and 180.',
      fromDev: 'from the device', fromHand: 'entered by hand', privacy: 'The location stays on this device; the app sends it nowhere.',
      times: "Today's times", next: 'Next prayer: {0} {1}', tomorrow: "Tomorrow's Fajr", tz: "In this device's time zone ({0}).",
      bellOn: 'Athan on for {0}', bellOff: 'Athan off for {0}',
      athan: 'Athan', athanOn: 'Call the athan at each prayer time while the app is open', main: 'Athan sound', fajrF: 'Fajr athan (optional)',
      choose: 'Choose a file', tryIt: '▶ Try', stopIt: '■ Stop', drop: 'Remove', none: 'No file chosen: a short chime plays instead.',
      noneF: 'No file chosen: the athan of the other prayers plays.', notAudio: "This file isn't audio the browser can play.",
      notify: 'Notify me when the app is in the background', notifyNo: 'Notifications are not allowed in this browser.',
      limits: 'The athan is called while the app is open: on screen, or in a background window on a computer; it pauses the recitation and plays. With the phone locked or the app closed, a web app cannot wake it, so keep a dedicated athan app for that.',
      calc: 'Calculation', method: 'Convention', asr: 'Asr', shafi: 'Standard (shadow once its length)', hanafi: 'Hanafi (shadow twice its length)',
      adj: "Minute adjustments to match your mosque's timetable", reset: 'Reset', fajrA: 'Fajr {0}°', ishaA: 'Isha {0}°', ishaI: 'Isha {0} min after Maghrib',
      mNorthAmerica: 'ISNA, North America', mMuslimWorldLeague: 'Muslim World League', mEgyptian: 'Egyptian General Authority of Survey',
      mUmmAlQura: 'Umm al-Qura, Makkah', mKarachi: 'University of Islamic Sciences, Karachi', mMoonsightingCommittee: 'Moonsighting Committee',
      mDubai: 'Dubai', mQatar: 'Qatar', mKuwait: 'Kuwait', mSingapore: 'Singapore', mTurkey: 'Turkey (Diyanet)', mTehran: 'Tehran',
      qibla: 'Qibla', bearing: 'Qibla: {0}° from true north ({1})', dist: 'Distance to the Kaaba: {0} km',
      compass: 'Start the compass', compassOn: 'Compass on: hold the phone flat, its top away from you.', facing: 'You are facing the qibla',
      turn: 'Turn {0}° {1}', right: 'right', left: 'left', decl: 'Magnetic declination here {0}° {1}; the compass is corrected for it.', east: 'east', west: 'west',
      noCompass: 'No compass on this device: north is at the top of the circle, so point the top of the screen north.', flat: 'Hold the phone flat.',
      calib: 'If the direction wanders, move the phone in a figure 8 and keep away from metal.', denied: 'Compass access was not allowed.',
      dirs: ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'], N: 'N', E: 'E', S: 'S', W: 'W',
      noEngine: "Couldn't load the prayer-time calculation: open the app once while online."
    },
    es: {
      today: 'Hoy', hijri: '{0} (Umm al-Qura)', loc: 'Ubicación', noLoc: 'Sin ubicación todavía: los horarios y la alquibla se calculan para ella.',
      gps: 'Usar mi ubicación', typed: 'Introducir coordenadas', lat: 'Latitud', lon: 'Longitud', name: 'Nombre del lugar (opcional)', save: 'Guardar',
      cancel: 'Cancelar', locating: 'Buscando su ubicación…', locErr: 'No se pudo obtener la ubicación: {0}', locDenied: 'No se permitió el acceso a la ubicación. Permítalo para la aplicación o introduzca las coordenadas.',
      locBad: 'Coordenadas no válidas: latitud entre −90 y 90, longitud entre −180 y 180.',
      fromDev: 'del dispositivo', fromHand: 'introducida a mano', privacy: 'La ubicación se queda en este dispositivo; la aplicación no la envía a nadie.',
      times: 'Horarios de hoy', next: 'Próxima oración: {0} {1}', tomorrow: 'Fayr de mañana', tz: 'En la zona horaria de este dispositivo ({0}).',
      bellOn: 'Adhán activado para {0}', bellOff: 'Adhán desactivado para {0}',
      athan: 'Adhán', athanOn: 'Llamar al adhán en cada oración mientras la aplicación está abierta', main: 'Sonido del adhán', fajrF: 'Adhán del Fayr (opcional)',
      choose: 'Elegir un archivo', tryIt: '▶ Probar', stopIt: '■ Detener', drop: 'Quitar', none: 'Sin archivo: suena un tono breve en su lugar.',
      noneF: 'Sin archivo: suena el adhán de las demás oraciones.', notAudio: 'Este archivo no es un audio que el navegador pueda reproducir.',
      notify: 'Avisarme cuando la aplicación esté en segundo plano', notifyNo: 'Las notificaciones no están permitidas en este navegador.',
      limits: 'El adhán suena mientras la aplicación está abierta: en pantalla o en una ventana en segundo plano en un ordenador; pausa la recitación y suena. Con el teléfono bloqueado o la aplicación cerrada, una aplicación web no puede despertarlo: para eso conserve una aplicación de adhán.',
      calc: 'Cálculo', method: 'Convención', asr: 'Asr', shafi: 'Mayoritaria (sombra igual a su longitud)', hanafi: 'Hanafí (sombra el doble)',
      adj: 'Ajustes en minutos para coincidir con el horario de su mezquita', reset: 'Restablecer', fajrA: 'Fayr {0}°', ishaA: 'Isha {0}°', ishaI: 'Isha {0} min después del Magrib',
      mNorthAmerica: 'ISNA, Norteamérica', mMuslimWorldLeague: 'Liga del Mundo Islámico', mEgyptian: 'Autoridad General Egipcia de Topografía',
      mUmmAlQura: 'Umm al-Qura, La Meca', mKarachi: 'Universidad de Ciencias Islámicas, Karachi', mMoonsightingCommittee: 'Comité de Avistamiento de la Luna',
      mDubai: 'Dubái', mQatar: 'Catar', mKuwait: 'Kuwait', mSingapore: 'Singapur', mTurkey: 'Turquía (Diyanet)', mTehran: 'Teherán',
      qibla: 'Alquibla', bearing: 'Alquibla: {0}° desde el norte verdadero ({1})', dist: 'Distancia a la Kaaba: {0} km',
      compass: 'Activar la brújula', compassOn: 'Brújula activa: sostenga el teléfono en horizontal, con la parte superior hacia delante.', facing: 'Está orientado hacia la alquibla',
      turn: 'Gire {0}° a la {1}', right: 'derecha', left: 'izquierda', decl: 'Declinación magnética aquí {0}° {1}; la brújula la corrige.', east: 'este', west: 'oeste',
      noCompass: 'Este dispositivo no tiene brújula: el norte está arriba del círculo; oriente la parte superior de la pantalla al norte.', flat: 'Sostenga el teléfono en horizontal.',
      calib: 'Si la dirección oscila, mueva el teléfono dibujando un 8 y aléjese de objetos metálicos.', denied: 'No se permitió usar la brújula.',
      dirs: ['norte', 'noreste', 'este', 'sureste', 'sur', 'suroeste', 'oeste', 'noroeste'], N: 'N', E: 'E', S: 'S', W: 'O',
      noEngine: 'No se pudo cargar el cálculo de horarios: abra la aplicación una vez con conexión.'
    }
  };
  function lang() { var u = de.getAttribute('data-ui'); return u === 'en' || u === 'es' ? u : 'ar'; }
  function T(k) { return TX[lang()][k]; }
  function fmt(s) { var a = arguments; return String(s).replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1]; }); }
  function nm(n, dec) {
    var s = dec != null ? Number(n).toFixed(dec) : String(n);
    if (s.charAt(0) === '-') s = '−' + s.slice(1);
    if (lang() === 'ar') s = s.replace('.', '٫').replace(/[0-9]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.charAt(+d); });
    else if (lang() === 'es') s = s.replace('.', ',');
    return s;
  }
  function sep() { return lang() === 'ar' ? '، ' : ', '; }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function btn(cls, txt) { var b = el('button', cls, txt); b.type = 'button'; return b; }
  var LOCALE = { ar: 'ar-u-nu-arab', en: 'en-US', es: 'es' };
  function D2R(x) { return x * Math.PI / 180; }

  // ---------------------------------------------------------------- skeleton
  var secDate = el('section', 'sl-card sl-date'), secLoc = el('section', 'sl-card sl-loc'), secTimes = el('section', 'sl-card sl-times'),
      secQ = el('section', 'sl-card sl-qibla'), secAthan = el('section', 'sl-card sl-athan'), secCalc = el('section', 'sl-card sl-calc');
  [secDate, secLoc, secTimes, secQ, secAthan, secCalc].forEach(function (s) { box.appendChild(s); });

  // date
  var dG = el('p', 'sl-g'), dH = el('p', 'sl-h');
  secDate.appendChild(dG); secDate.appendChild(dH);
  function paintDate() {
    var now = new Date(), L = LOCALE[lang()];
    try { dG.textContent = new Intl.DateTimeFormat(L, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now); } catch (e) { dG.textContent = now.toDateString(); }
    try { dH.textContent = fmt(T('hijri'), new Intl.DateTimeFormat(L.split('-u-')[0] + '-u-ca-islamic-umalqura' + (lang() === 'ar' ? '-nu-arab' : ''), { day: 'numeric', month: 'long', year: 'numeric' }).format(now)); }
    catch (e) { dH.textContent = ''; }
  }

  // ---------------------------------------------------------------- location
  var lH = el('h2'), lText = el('p', 'sl-loctext'), lRow = el('div', 'sl-row'), bGps = btn('vbtn on'), bTyped = btn('vbtn'),
      lForm = el('form', 'sl-form'), lMsg = el('p', 'sl-msg'), lPriv = el('p', 'sl-note');
  lForm.hidden = true; lForm.noValidate = true;      // its own message, in the interface language
  lForm.innerHTML = '<label><span data-t="lat"></span><input name="lat" type="number" step="any" min="-90" max="90" inputmode="decimal" required></label>' +
    '<label><span data-t="lon"></span><input name="lon" type="number" step="any" min="-180" max="180" inputmode="decimal" required></label>' +
    '<label class="wide"><span data-t="name"></span><input name="name" type="text" maxlength="60"></label>' +
    '<div class="sl-row"><button type="submit" class="vbtn on" data-t="save"></button><button type="button" class="vbtn sl-cancel" data-t="cancel"></button></div>';
  lRow.appendChild(bGps); lRow.appendChild(bTyped);
  [lH, lText, lRow, lForm, lMsg, lPriv].forEach(function (e) { secLoc.appendChild(e); });
  lMsg.hidden = true;
  function say(e, t, bad) { e.textContent = t || ''; e.hidden = !t; e.classList.toggle('bad', !!bad); }
  bGps.addEventListener('click', function () {
    if (!navigator.geolocation) { say(lMsg, fmt(T('locErr'), '—'), true); return; }
    say(lMsg, T('locating'));
    navigator.geolocation.getCurrentPosition(function (p) {
      say(lMsg, '');
      S0.set({ loc: { lat: Math.round(p.coords.latitude * 1e4) / 1e4, lon: Math.round(p.coords.longitude * 1e4) / 1e4,
                      acc: Math.round(p.coords.accuracy || 0), src: 'gps', name: '', at: new Date().toISOString() } });
    }, function (e) {
      say(lMsg, e && e.code === 1 ? T('locDenied') : fmt(T('locErr'), (e && e.message) || '—'), true);
    }, { enableHighAccuracy: false, timeout: 20000, maximumAge: 10 * 60000 });
  });
  bTyped.addEventListener('click', function () {
    var S = S0.get();
    lForm.hidden = !lForm.hidden;
    if (!lForm.hidden) {
      lForm.lat.value = S.loc ? S.loc.lat : ''; lForm.lon.value = S.loc ? S.loc.lon : ''; lForm.name.value = S.loc ? S.loc.name || '' : '';
      lForm.lat.focus();
    }
  });
  lForm.querySelector('.sl-cancel').addEventListener('click', function () { lForm.hidden = true; });
  lForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var la = parseFloat(String(lForm.lat.value).replace(',', '.')), lo = parseFloat(String(lForm.lon.value).replace(',', '.'));
    if (!(la >= -90 && la <= 90 && lo >= -180 && lo <= 180)) { say(lMsg, T('locBad'), true); return; }
    say(lMsg, '');
    S0.set({ loc: { lat: la, lon: lo, src: 'manual', name: String(lForm.name.value || '').trim().slice(0, 60), at: new Date().toISOString() } });
    lForm.hidden = true;
  });
  function paintLoc() {
    var S = S0.get();
    lH.textContent = T('loc');
    bGps.textContent = T('gps'); bTyped.textContent = T('typed');
    [].forEach.call(lForm.querySelectorAll('[data-t]'), function (x) { x.textContent = T(x.getAttribute('data-t')); });
    lPriv.textContent = T('privacy');
    if (!S.loc) { lText.textContent = T('noLoc'); lText.classList.add('empty'); return; }
    lText.classList.remove('empty');
    lText.textContent = (S.loc.name ? S.loc.name + ' · ' : '') + nm(Math.abs(S.loc.lat), 4) + '° ' + T(S.loc.lat >= 0 ? 'N' : 'S') + sep() +
      nm(Math.abs(S.loc.lon), 4) + '° ' + T(S.loc.lon >= 0 ? 'E' : 'W') + ' · ' + (S.loc.src === 'gps' ? T('fromDev') : T('fromHand'));
  }

  // ---------------------------------------------------------------- times
  var tH = el('h2'), tNext = el('p', 'sl-next'), tList = el('ol', 'sl-list'), tMeta = el('p', 'sl-note'), tErr = el('p', 'sl-msg bad');
  tErr.hidden = true;
  [tH, tNext, tList, tMeta, tErr].forEach(function (e) { secTimes.appendChild(e); });
  var rows = {};
  S0.order.forEach(function (k) {
    var li = el('li'), n = el('span', 'sl-n'), t = el('span', 'sl-t');
    li.setAttribute('data-k', k); li.appendChild(n); li.appendChild(t);
    if (S0.calls.indexOf(k) >= 0) {
      var b = btn('sl-bell'); b.setAttribute('data-k', k); li.appendChild(b);
      b.addEventListener('click', function () { var S = S0.get(), on = Object.assign({}, S.on); on[k] = !on[k]; S0.set({ on: on }); });
    } else li.appendChild(el('span', 'sl-bell-x'));
    tList.appendChild(li); rows[k] = li;
  });
  var tomorrowLi = el('li', 'sl-tm'); tomorrowLi.setAttribute('data-k', 'fajr2');
  tomorrowLi.appendChild(el('span', 'sl-n')); tomorrowLi.appendChild(el('span', 'sl-t')); tomorrowLi.appendChild(el('span', 'sl-bell-x'));
  tList.appendChild(tomorrowLi);
  function paintTimes() {
    var S = S0.get();
    tH.textContent = T('times');
    secTimes.classList.toggle('off', !S.loc);
    if (!S.loc) { tNext.textContent = ''; tMeta.textContent = ''; tList.hidden = true; return Promise.resolve(); }
    tList.hidden = false;
    return S0.next().then(function (n) {
      var t = n.today, now = new Date();
      say(tErr, '');
      S0.order.forEach(function (k) {
        var li = rows[k];
        li.querySelector('.sl-n').textContent = S0.name(k);
        li.querySelector('.sl-t').textContent = S0.fmtTime(t[k]);
        li.classList.toggle('past', t[k] <= now);
        li.classList.toggle('next', !n.tomorrow && n.name === k);
        var b = li.querySelector('.sl-bell');
        if (b) {
          var on = S.athan && S.on[k];
          b.textContent = S.on[k] ? '🔔' : '🔕'; b.setAttribute('aria-pressed', S.on[k] ? 'true' : 'false');
          b.classList.toggle('dim', !S.athan);
          var l = fmt(T(S.on[k] ? 'bellOn' : 'bellOff'), S0.name(k)); b.title = l; b.setAttribute('aria-label', l);
          li.classList.toggle('mute', !on);
        }
      });
      tomorrowLi.hidden = !n.tomorrow;
      if (n.tomorrow) {
        tomorrowLi.querySelector('.sl-n').textContent = T('tomorrow');
        tomorrowLi.querySelector('.sl-t').textContent = S0.fmtTime(n.at);
        tomorrowLi.classList.add('next');
      }
      tNext.textContent = fmt(T('next'), S0.name(n.name), S0.fmtTime(n.at)) + ' · ' + S0.until(n.at - now);
      var tz = '';
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { tz = ''; }
      return S0.lib().then(function (L) {
        var P = L.CalculationMethod[S.method]();
        tMeta.textContent = methodLabel(S.method, P) + ' · ' + T('asr') + ': ' + T(S.madhab === 'hanafi' ? 'hanafi' : 'shafi') + '. ' + fmt(T('tz'), tz);
      });
    }).catch(function () { say(tErr, T('noEngine'), true); });
  }
  function methodLabel(m, P) {
    var bits = [fmt(T('fajrA'), nm(P.fajrAngle))];
    bits.push(P.ishaInterval ? fmt(T('ishaI'), nm(P.ishaInterval)) : fmt(T('ishaA'), nm(P.ishaAngle)));
    return T('m' + m) + ' (' + bits.join(sep()) + ')';
  }

  // ---------------------------------------------------------------- athan
  var aH = el('h2'), aSw = el('div', 'vrow'), aSwL = el('span'), aSwB = btn('vsw'), files = {}, aNote = el('p', 'sl-note'), nRow = el('div', 'vrow'),
      nL = el('span'), nB = btn('vsw'), nMsg = el('p', 'sl-msg');
  aSwB.setAttribute('role', 'switch'); nB.setAttribute('role', 'switch');
  aSw.appendChild(aSwL); aSw.appendChild(aSwB); nRow.appendChild(nL); nRow.appendChild(nB);
  secAthan.appendChild(aH); secAthan.appendChild(aSw);
  ['main', 'fajr'].forEach(function (kind) {
    var r = el('div', 'sl-file'), lb = el('p', 'sl-fl'), st = el('p', 'sl-fs'), row = el('div', 'sl-row');
    var inp = el('input', 'sl-inp'); inp.type = 'file'; inp.accept = 'audio/*,.mp3,.m4a,.aac,.ogg,.opus,.wav';   // hidden visually, still focusable
    var ch = el('label', 'vbtn'); ch.appendChild(inp); ch.appendChild(el('span', 'sl-ch'));
    var tr = btn('vbtn sl-try'), dr = btn('vbtn sl-drop'), msg = el('p', 'sl-msg');
    msg.hidden = true;
    row.appendChild(ch); row.appendChild(tr); row.appendChild(dr);
    [lb, st, row, msg].forEach(function (e) { r.appendChild(e); });
    secAthan.appendChild(r);
    files[kind] = { lb: lb, st: st, inp: inp, ch: ch, tr: tr, dr: dr, msg: msg, f: null };
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0];
      inp.value = '';
      if (!f) return;
      checkAudio(f).then(function () { return S0.saveFile(kind, f, f.name); }).then(function () { say(msg, ''); paintFiles(); },
        function () { say(msg, T('notAudio'), true); });
    });
    tr.addEventListener('click', function () {
      if (playingKind === kind) { S0.stop(); playingKind = ''; paintFiles(); return; }
      playingKind = kind; paintFiles();
      S0.play(kind === 'fajr' ? 'fajr' : 'main').then(function () {}, function () { playingKind = ''; paintFiles(); });
    });
    dr.addEventListener('click', function () { S0.dropFile(kind).then(paintFiles); });
  });
  secAthan.appendChild(nRow); secAthan.appendChild(nMsg); secAthan.appendChild(aNote);
  nMsg.hidden = true;
  var playingKind = '';
  document.addEventListener('hifz-athan-end', function () { if (playingKind) { playingKind = ''; paintFiles(); } });
  function checkAudio(f) {
    return new Promise(function (ok, no) {
      var u = URL.createObjectURL(f), a = new Audio(), done = false;
      function fin(good) { if (done) return; done = true; URL.revokeObjectURL(u); if (good) ok(); else no(new Error('not audio')); }
      a.preload = 'metadata';
      a.addEventListener('loadedmetadata', function () { fin(isFinite(a.duration) ? a.duration > 0 : true); });
      a.addEventListener('error', function () { fin(false); });
      setTimeout(function () { fin(false); }, 8000);
      a.src = u;
    });
  }
  aSwB.addEventListener('click', function () { S0.set({ athan: !S0.get().athan }); });
  nB.addEventListener('click', function () {
    var S = S0.get();
    if (S.notify) { S0.set({ notify: false }); return; }
    if (!('Notification' in window)) { say(nMsg, T('notifyNo'), true); return; }
    Promise.resolve(Notification.permission === 'default' ? Notification.requestPermission() : Notification.permission).then(function (p) {
      if (p === 'granted') { say(nMsg, ''); S0.set({ notify: true }); } else say(nMsg, T('notifyNo'), true);
    });
  });
  function paintFiles() {
    ['main', 'fajr'].forEach(function (kind) {
      var o = files[kind];
      S0.file(kind).then(function (f) {
        o.f = f;
        o.lb.textContent = T(kind === 'main' ? 'main' : 'fajrF');
        var mb = f && f.size >= 1048576;
        o.st.textContent = f ? f.name + ' · ' + (mb ? nm(f.size / 1048576, 1) : nm(Math.max(1, Math.round(f.size / 1024)))) +
          (lang() === 'ar' ? (mb ? ' م.ب' : ' ك.ب') : (mb ? ' MB' : ' KB')) : T(kind === 'main' ? 'none' : 'noneF');
        o.st.classList.toggle('empty', !f);
        o.ch.querySelector('.sl-ch').textContent = T('choose');
        o.tr.textContent = playingKind === kind ? T('stopIt') : T('tryIt');
        o.dr.textContent = T('drop'); o.dr.hidden = !f;
      });
    });
  }
  function paintAthan() {
    var S = S0.get();
    aH.textContent = T('athan');
    aSwL.textContent = T('athanOn'); aSwB.setAttribute('aria-pressed', S.athan ? 'true' : 'false'); aSwB.setAttribute('aria-label', T('athanOn'));
    nL.textContent = T('notify'); nB.setAttribute('aria-pressed', S.notify ? 'true' : 'false'); nB.setAttribute('aria-label', T('notify'));
    aNote.textContent = T('limits');
    secAthan.classList.toggle('off', !S.athan);
    paintFiles();
  }

  // ---------------------------------------------------------------- calculation
  var cH = el('h2'), mL = el('label', 'sl-sel'), mT = el('span'), mS = el('select'), aL = el('div', 'vg'), aLl = el('span', 'vl'),
      aSeg = el('div', 'vseg'), adjH = el('p', 'sl-fl'), adjG = el('div', 'sl-adj'), adjR = btn('vbtn sl-reset');
  METHODS.forEach(function (m) { var o = el('option'); o.value = m; mS.appendChild(o); });
  mL.appendChild(mT); mL.appendChild(mS);
  ['shafi', 'hanafi'].forEach(function (k) { var b = btn(''); b.setAttribute('data-m', k); aSeg.appendChild(b); });
  aL.appendChild(aLl); aL.appendChild(aSeg);
  var adjCells = {};
  S0.order.forEach(function (k) {
    var c = el('div', 'sl-adjc'), n = el('span', 'sl-adjn'), minus = btn('sl-adjb', '−'), v = el('output'), plus = btn('sl-adjb', '+');
    minus.setAttribute('data-d', '-1'); plus.setAttribute('data-d', '1'); c.setAttribute('data-k', k);
    c.appendChild(n); c.appendChild(minus); c.appendChild(v); c.appendChild(plus); adjG.appendChild(c); adjCells[k] = c;
  });
  [cH, mL, aL, adjH, adjG, adjR].forEach(function (e) { secCalc.appendChild(e); });
  mS.addEventListener('change', function () { S0.set({ method: mS.value }); });
  aSeg.addEventListener('click', function (e) { var b = e.target.closest('[data-m]'); if (b) S0.set({ madhab: b.getAttribute('data-m') }); });
  adjG.addEventListener('click', function (e) {
    var b = e.target.closest('.sl-adjb'); if (!b) return;
    var k = b.closest('.sl-adjc').getAttribute('data-k'), S = S0.get(), adj = Object.assign({}, S.adj);
    adj[k] = Math.max(-30, Math.min(30, (+adj[k] || 0) + (+b.getAttribute('data-d'))));
    S0.set({ adj: adj });
  });
  adjR.addEventListener('click', function () { S0.set({ adj: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 } }); });
  function paintCalc() {
    var S = S0.get();
    cH.textContent = T('calc'); mT.textContent = T('method'); aLl.textContent = T('asr'); adjH.textContent = T('adj'); adjR.textContent = T('reset');
    S0.lib().then(function (L) {
      [].forEach.call(mS.options, function (o) { o.textContent = methodLabel(o.value, L.CalculationMethod[o.value]()); });
      mS.value = S.method;
    }, function () { [].forEach.call(mS.options, function (o) { o.textContent = T('m' + o.value); }); mS.value = S.method; });
    [].forEach.call(aSeg.children, function (b) { var k = b.getAttribute('data-m'); b.textContent = T(k); b.setAttribute('aria-pressed', S.madhab === k ? 'true' : 'false'); });
    S0.order.forEach(function (k) {
      var c = adjCells[k], v = +S.adj[k] || 0;
      c.querySelector('.sl-adjn').textContent = S0.name(k);
      c.querySelector('output').textContent = (v > 0 ? '+' : '') + nm(v);
      c.classList.toggle('set', !!v);
    });
    adjR.hidden = !S0.order.some(function (k) { return +S.adj[k]; });
  }

  // ---------------------------------------------------------------- qibla
  var qH = el('h2'), qWrap = el('div', 'sl-cmp'), qInfo = el('div', 'sl-qinfo'), qB = el('p', 'sl-qb'), qD = el('p', 'sl-qd'),
      qStat = el('p', 'sl-qs'), qDecl = el('p', 'sl-note'), qCal = el('p', 'sl-note'), qBtn = btn('vbtn on');
  var NS = 'http://www.w3.org/2000/svg';
  function sv(tag, at) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); return e; }
  var svg = sv('svg', { viewBox: '-120 -120 240 240', role: 'img' }), dial = sv('g', { class: 'cmp-dial' });
  dial.appendChild(sv('circle', { r: 104, class: 'cmp-ring' }));
  for (var d = 0; d < 360; d += 15) {
    var big = d % 90 === 0, r1 = big ? 86 : 94;
    dial.appendChild(sv('line', { x1: 0, y1: -r1, x2: 0, y2: -102, class: big ? 'cmp-tk big' : 'cmp-tk', transform: 'rotate(' + d + ')' }));
  }
  var letters = {}, ANG = { N: 0, E: 90, S: 180, W: 270 };
  ['N', 'E', 'S', 'W'].forEach(function (k) {
    var g = sv('g', { transform: 'rotate(' + ANG[k] + ')' }), t = sv('text', { x: 0, y: -66, class: 'cmp-l' + (k === 'N' ? ' n' : '') });
    g.appendChild(t); dial.appendChild(g); letters[k] = t;
  });
  var qArm = sv('g', { class: 'cmp-q' }), kaaba = sv('g');
  qArm.appendChild(sv('line', { x1: 0, y1: 0, x2: 0, y2: -76, class: 'cmp-ql' }));
  kaaba.appendChild(sv('rect', { x: -9, y: -98, width: 18, height: 18, rx: 2, class: 'cmp-k' }));
  kaaba.appendChild(sv('rect', { x: -9, y: -94, width: 18, height: 3.2, class: 'cmp-kb' }));
  qArm.appendChild(kaaba);
  dial.appendChild(qArm);
  svg.appendChild(dial);
  svg.appendChild(sv('path', { d: 'M0,-118 L-8,-104 L8,-104 Z', class: 'cmp-me' }));
  svg.appendChild(sv('circle', { r: 5, class: 'cmp-c' }));
  qWrap.appendChild(svg);
  [qB, qD, qStat, qBtn, qDecl, qCal].forEach(function (e) { qInfo.appendChild(e); });
  qStat.hidden = true; qDecl.hidden = true;
  [qH, qWrap, qInfo].forEach(function (e) { secQ.appendChild(e); });
  var Q = null, decl = 0, heading = null, hx = 0, hy = 0, listening = '', gotAny = false, flatOK = true;
  function bearingWord(b) { return T('dirs')[Math.round(((b % 360) + 360) % 360 / 45) % 8]; }
  function distanceKm(a, b) {
    var p1 = D2R(a[0]), p2 = D2R(b[0]), dp = p2 - p1, dl = D2R(b[1] - a[1]);
    var h = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 2 * 6371.0088 * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function decYear(d) { var y = d.getFullYear(), s = new Date(y, 0, 1), e = new Date(y + 1, 0, 1); return y + (d - s) / (e - s); }
  function paintQibla() {
    var S = S0.get();
    qH.textContent = T('qibla');
    letters.N.textContent = T('N'); letters.E.textContent = T('E'); letters.S.textContent = T('S'); letters.W.textContent = T('W');
    qCal.textContent = T('calib');
    qBtn.textContent = T('compass'); qBtn.hidden = !!listening;
    secQ.classList.toggle('off', !S.loc);
    if (!S.loc) { qB.textContent = T('noLoc'); qD.textContent = ''; Q = null; rotate(); return; }
    S0.lib().then(function (L) {
      Q = L.Qibla(new L.Coordinates(S.loc.lat, S.loc.lon));
      if (window.HifzWMM) decl = window.HifzWMM.declination(S.loc.lat, S.loc.lon, 0, decYear(new Date()));
      qB.textContent = fmt(T('bearing'), nm(Q, 1), bearingWord(Q));
      var km = distanceKm([S.loc.lat, S.loc.lon], KAABA);
      qD.textContent = fmt(T('dist'), new Intl.NumberFormat(LOCALE[lang()], { maximumFractionDigits: 0 }).format(km));
      svg.setAttribute('aria-label', qB.textContent);
      qDecl.textContent = fmt(T('decl'), nm(Math.abs(decl), 1), T(decl >= 0 ? 'east' : 'west'));
      rotate();
    }, function () { qB.textContent = T('noEngine'); });
  }
  function rotate() {
    var h = heading == null ? 0 : heading;
    dial.setAttribute('transform', 'rotate(' + (-h).toFixed(1) + ')');
    for (var k in letters) letters[k].setAttribute('transform', 'rotate(' + (h - ANG[k]).toFixed(1) + ' 0 -66)');   // letters upright
    qArm.style.display = Q == null ? 'none' : '';
    if (Q != null) { qArm.setAttribute('transform', 'rotate(' + Q.toFixed(2) + ')'); kaaba.setAttribute('transform', 'rotate(' + (h - Q).toFixed(1) + ' 0 -89)'); }
    var facing = false;
    if (heading != null && Q != null && flatOK) {
      var diff = ((Q - heading + 540) % 360) - 180;          // −180..180: + = turn right
      facing = Math.abs(diff) <= 3;
      say(qStat, facing ? T('facing') : fmt(T('turn'), nm(Math.round(Math.abs(diff))), T(diff > 0 ? 'right' : 'left')));
      qStat.classList.toggle('ok', facing);
    }
    secQ.classList.toggle('facing', facing);
  }
  function onHeading(mag, e) {
    gotAny = true;
    flatOK = !(e && e.beta != null && (Math.abs(e.beta) > 65 || Math.abs(e.gamma) > 65));
    if (!flatOK) { say(qStat, T('flat')); qStat.classList.remove('ok'); secQ.classList.remove('facing'); return; }
    var scr = (screen.orientation && typeof screen.orientation.angle === 'number') ? screen.orientation.angle : (window.orientation || 0);
    var h = mag + scr + decl, r = D2R(h);
    hx = heading == null ? Math.cos(r) : hx * 0.75 + Math.cos(r) * 0.25;      // smoothing on the circle
    hy = heading == null ? Math.sin(r) : hy * 0.75 + Math.sin(r) * 0.25;
    heading = (Math.atan2(hy, hx) * 180 / Math.PI + 360) % 360;
    rotate();
  }
  function onAbs(e) { if (e.alpha != null && (e.absolute || e.type === 'deviceorientationabsolute')) onHeading((360 - e.alpha) % 360, e); }
  function onIOS(e) { if (e.webkitCompassHeading != null) onHeading(e.webkitCompassHeading, e); else onAbs(e); }
  function startCompass() {
    if (listening) return;
    var DOE = window.DeviceOrientationEvent;
    function listen() {
      if ('ondeviceorientationabsolute' in window) { window.addEventListener('deviceorientationabsolute', onAbs); listening = 'abs'; }
      else { window.addEventListener('deviceorientation', onIOS); listening = 'rel'; }
      qBtn.hidden = true; qDecl.hidden = false;
      say(qStat, T('compassOn'));
      setTimeout(function () { if (!gotAny) { say(qStat, T('noCompass')); qDecl.hidden = true; } }, 2500);
    }
    if (DOE && typeof DOE.requestPermission === 'function') {
      DOE.requestPermission().then(function (p) { if (p === 'granted') listen(); else say(qStat, T('denied'), true); }, function () { say(qStat, T('denied'), true); });
    } else if (DOE) listen();
    else say(qStat, T('noCompass'));
  }
  qBtn.addEventListener('click', startCompass);
  // Android starts without asking; iOS needs the button (a tap) for its permission
  if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission !== 'function' && 'ondeviceorientationabsolute' in window) startCompass();

  // ---------------------------------------------------------------- painting
  function paintAll() { paintDate(); paintLoc(); paintTimes(); paintAthan(); paintCalc(); paintQibla(); box.setAttribute('dir', lang() === 'ar' ? 'rtl' : 'ltr'); }
  S0.on(function () { paintLoc(); paintTimes(); paintAthan(); paintCalc(); paintQibla(); });
  if (window.hifzUI) window.hifzUI.on(paintAll);
  paintAll();
  setInterval(function () { paintTimes(); paintDate(); }, 20000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { paintTimes(); paintDate(); } });
  window.HifzSalatPage = { heading: function () { return heading; }, qibla: function () { return Q; }, decl: function () { return decl; }, onHeading: onHeading };
})();
