/* Hifz web app: the service worker (template; tools/make_app.py fills in VERSION and FILES).
   Install: every file of the app (FILES: path relative to this folder, and a hash of its
   content) is stored under "<path>?v=<hash>"; a file whose hash has not changed since the
   version already on the device is copied from there instead of downloaded again, so an update
   downloads only what changed.  Fetch: the app's own files come from that store (the app opens
   offline); the fonts are kept after their first use; the recitation is left to the browser
   (the pages keep their own copy of it, app/core.js).  Activate: older versions are removed. */
'use strict';
var VERSION = "2e10a36a6b8b";
var FILES = [["app/book.css","f7819c38135c"],["app/core.js","cab30d50828a"],["app/home.css","30a814c2cc1c"],["app/home.js","9bab70c8cd30"],["app/mushaf.css","ee21b858ac20"],["app/mushaf.js","025278bc299d"],["app/player.js","89f375aac2ba"],["app/recite.js","bb8ba42d7cba"],["app/test.js","7b3c5ea365e3"],["app/view.css","2eeec5473036"],["app/view.js","b3f1e70fcb96"],["app/words.js","b7c4b71d226c"],["icons/icon-192.png","8f30dbc0ceee"],["icons/icon-512.png","c18801c6b9a7"],["icons/maskable-192.png","8af6dbba638a"],["icons/maskable-512.png","262b56681ccd"],["index.html","e3f30f3c86b0"],["manifest.webmanifest","959d46fe042d"],["mushaf.html","60b26fc79cea"],["packages/001-package/001-Al-Faatiha.html","b1a250e70df7"],["packages/002-package/002-Al-Baqara.html","99170dc1ddeb"],["packages/003-package/003-Aal-i-Imraan.html","20171743b0a4"],["packages/004-package/004-An-Nisaa.html","7ef015810bea"],["packages/005-package/005-Al-Maaida.html","5545516b6e7e"],["packages/006-package/006-Al-An%27aam.html","477d0024b7cb"],["packages/007-package/007-Al-A%27raaf.html","efe8f95868af"],["packages/008-package/008-Al-Anfaal.html","3984443dcde0"],["packages/009-package/009-At-Tawba.html","98e5741f95cf"],["packages/010-package/010-Yunus.html","d82f3facc930"],["packages/011-package/011-Hud.html","381c7a120c47"],["packages/012-package/012-Yusuf.html","12e8f6e99109"],["packages/013-package/013-Ar-Ra%27d.html","bb15d264e411"],["packages/014-package/014-Ibrahim.html","a4f0063de7a6"],["packages/015-package/015-Al-Hijr.html","2254f8efa912"],["packages/016-package/016-An-Nahl.html","20bef59465cd"],["packages/017-package/017-Al-Israa.html","d35f895426e8"],["packages/018-package/018-Al-Kahf.html","cfb80fd787f0"],["packages/019-package/019-Maryam.html","d21cf181fd72"],["packages/020-package/020-Taa-Haa.html","8783b52ff96f"],["packages/021-package/021-Al-Anbiyaa.html","43c0cf4bca60"],["packages/022-package/022-Al-Hajj.html","1b9ed0f5655f"],["packages/023-package/023-Al-Muminoon.html","1663985dbbbf"],["packages/024-package/024-An-Noor.html","87db2699beb0"],["packages/025-package/025-Al-Furqaan.html","ebf9052be1eb"],["packages/026-package/026-Ash-Shu%27araa.html","ec4dfc6dc5b8"],["packages/027-package/027-An-Naml.html","12b738f7d4e1"],["packages/028-package/028-Al-Qasas.html","ecf17b4e4fe5"],["packages/029-package/029-Al-Ankaboot.html","5d0b33cd95b9"],["packages/030-package/030-Ar-Room.html","33b2881d1a17"],["packages/031-package/031-Luqman.html","c2cd85903601"],["packages/032-package/032-As-Sajda.html","e58ef7ac455e"],["packages/033-package/033-Al-Ahzaab.html","8cb71f4e514f"],["packages/034-package/034-Saba.html","64fee1694b4c"],["packages/035-package/035-Faatir.html","4273f717cbcf"],["packages/036-package/036-Yaseen.html","54c7f7298166"],["packages/037-package/037-As-Saaffaat.html","25e31e913201"],["packages/038-package/038-Saad.html","5cbcce743af9"],["packages/039-package/039-Az-Zumar.html","ee3d60fa848e"],["packages/040-package/040-Al-Ghaafir.html","335100a5b105"],["packages/041-package/041-Fussilat.html","c38062f15156"],["packages/042-package/042-Ash-Shura.html","f79aa3344603"],["packages/043-package/043-Az-Zukhruf.html","c3701584c20e"],["packages/044-package/044-Ad-Dukhaan.html","d6a27c0a3594"],["packages/045-package/045-Al-Jaathiya.html","c86c4e44636b"],["packages/046-package/046-Al-Ahqaf.html","02d1835baaef"],["packages/047-package/047-Muhammad.html","47e8df09bed2"],["packages/048-package/048-Al-Fath.html","6095a86754f5"],["packages/049-package/049-Al-Hujuraat.html","477001ab015c"],["packages/050-package/050-Qaaf.html","29f0b265005e"],["packages/051-package/051-Adh-Dhaariyat.html","4e14325ea341"],["packages/052-package/052-At-Tur.html","dc0a9075af18"],["packages/053-package/053-An-Najm.html","1efc01e23d50"],["packages/054-package/054-Al-Qamar.html","8aa3ef386473"],["packages/055-package/055-Ar-Rahmaan.html","6743893fc48e"],["packages/056-package/056-Al-Waaqia.html","29a737ff24e6"],["packages/057-package/057-Al-Hadid.html","2fa83030e5e4"],["packages/058-package/058-Al-Mujaadila.html","43f7306e3ae2"],["packages/059-package/059-Al-Hashr.html","9dc261d4ca76"],["packages/060-package/060-Al-Mumtahana.html","4a27a755f5ff"],["packages/061-package/061-As-Saff.html","1d7d25059d14"],["packages/062-package/062-Al-Jumu%27a.html","b6b3bcacbc4e"],["packages/063-package/063-Al-Munaafiqoon.html","68a08b4cb649"],["packages/064-package/064-At-Taghaabun.html","0d1fb34ce9d4"],["packages/065-package/065-At-Talaaq.html","d802457cf37a"],["packages/066-package/066-At-Tahrim.html","116655f53451"],["packages/067-package/067-Al-Mulk.html","a131b80fd839"],["packages/068-package/068-Al-Qalam.html","c37662d8a502"],["packages/069-package/069-Al-Haaqqa.html","bd653056b88e"],["packages/070-package/070-Al-Ma%27aarij.html","1f3770ed399a"],["packages/071-package/071-Nooh.html","e387e877f7f9"],["packages/072-package/072-Al-Jinn.html","62e31a7186c7"],["packages/073-package/073-Al-Muzzammil.html","a02cdfabc15c"],["packages/074-package/074-Al-Muddaththir.html","14ea1aa42b96"],["packages/075-package/075-Al-Qiyaama.html","6d769dd940ae"],["packages/076-package/076-Al-Insaan.html","1b7c101302f9"],["packages/077-package/077-Al-Mursalaat.html","964979054414"],["packages/078-package/078-An-Naba.html","bb381f388f53"],["packages/079-package/079-An-Naazi%27aat.html","195a830dbc88"],["packages/080-package/080-Abasa.html","722d5f31096b"],["packages/081-package/081-At-Takwir.html","39f0b3b908a3"],["packages/082-package/082-Al-Infitaar.html","f3f7f1c8465b"],["packages/083-package/083-Al-Mutaffifin.html","144d1f9dcdf4"],["packages/084-package/084-Al-Inshiqaaq.html","9b940c4c08ce"],["packages/085-package/085-Al-Burooj.html","93c551394941"],["packages/086-package/086-At-Taariq.html","22443f825455"],["packages/087-package/087-Al-A%27laa.html","7eef7802510a"],["packages/088-package/088-Al-Ghaashiya.html","e5adfce8ef91"],["packages/089-package/089-Al-Fajr.html","a5fed5dea425"],["packages/090-package/090-Al-Balad.html","b808e34ba33e"],["packages/091-package/091-Ash-Shams.html","f027b48a3042"],["packages/092-package/092-Al-Lail.html","c91068539ee9"],["packages/093-package/093-Ad-Dhuhaa.html","cec70881b30d"],["packages/094-package/094-Ash-Sharh.html","5a1874998adb"],["packages/095-package/095-At-Tin.html","0168a949e627"],["packages/096-package/096-Al-Alaq.html","9c2ab021c593"],["packages/097-package/097-Al-Qadr.html","1300c9d23c24"],["packages/098-package/098-Al-Bayyina.html","9f7273c2f6bd"],["packages/099-package/099-Az-Zalzala.html","6d367a4c2cb8"],["packages/100-package/100-Al-Aadiyaat.html","9cf97ef06c21"],["packages/101-package/101-Al-Qaari%27a.html","01a842b3a4f9"],["packages/102-package/102-At-Takaathur.html","7f1d89319c36"],["packages/103-package/103-Al-Asr.html","cd1a58b08160"],["packages/104-package/104-Al-Humaza.html","c16c59679c94"],["packages/105-package/105-Al-Fil.html","a13dc572fe07"],["packages/106-package/106-Quraish.html","fa170a9b790a"],["packages/107-package/107-Al-Maa%27un.html","9d2f3ec0925d"],["packages/108-package/108-Al-Kawthar.html","f64d2c1d7790"],["packages/109-package/109-Al-Kaafiroon.html","f59cff952dd0"],["packages/110-package/110-An-Nasr.html","3fa30d8e7f94"],["packages/111-package/111-Al-Masad.html","9c0b02ede19d"],["packages/112-package/112-Al-Ikhlaas.html","338bbb92545c"],["packages/113-package/113-Al-Falaq.html","ccd862593cc9"],["packages/114-package/114-An-Naas.html","8d1e6b433ec5"],["packages/hifz-search.js","343ade32eb1a"],["repeats-all-surahs.html","c3b60c6810ab"],["tanzil-license.txt","9e0f561d049a"]];
var SHELL = 'hifz-' + VERSION, RUNTIME = 'hifz-runtime';
var BASE = self.registration.scope;
var MAP = {};

function key(path, hash) { return new URL(path, BASE).href + '?v=' + hash; }
function norm(u) { try { return decodeURIComponent(new URL(u, BASE).pathname); } catch (e) { return new URL(u, BASE).pathname; } }

FILES.forEach(function (f) { MAP[norm(f[0])] = key(f[0], f[1]); });
if (MAP[norm('index.html')]) MAP[norm('./')] = MAP[norm('index.html')];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL).then(function (cache) {
    var i = 0;
    function one() {
      if (i >= FILES.length) return Promise.resolve();
      var f = FILES[i++], k = key(f[0], f[1]);
      return caches.match(k).then(function (hit) {
        return hit || fetch(k, { cache: 'no-cache' }).then(function (r) {
          if (!r.ok) throw new Error(f[0] + ': ' + r.status);
          return r;
        });
      }).then(function (r) { return cache.put(k, r); }).then(one);
    }
    return Promise.all([one(), one(), one(), one()]);     // four at a time
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf('hifz-') === 0 && k !== SHELL && k !== RUNTIME; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (u.origin === self.location.origin) {
    var k = MAP[norm(r.url)];
    if (k) e.respondWith(caches.match(k).then(function (hit) { return hit || fetch(r); }));
    return;
  }
  if (/^(fonts\.googleapis\.com|fonts\.gstatic\.com|raw\.githubusercontent\.com)$/.test(u.hostname)) {
    e.respondWith(caches.open(RUNTIME).then(function (c) {
      return c.match(r).then(function (hit) {
        var net = fetch(r).then(function (res) {
          if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone());
          return res;
        }).catch(function () { return hit; });
        return hit || net;
      });
    }));
  }
});
