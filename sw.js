/* Hifz web app: the service worker (template; tools/make_app.py fills in VERSION and FILES).
   Install: every file of the app (FILES: path relative to this folder, and a hash of its
   content) is stored under "<path>?v=<hash>"; a file whose hash has not changed since the
   version already on the device is copied from there instead of downloaded again, so an update
   downloads only what changed.  Fetch: the app's own files come from that store (the app opens
   offline); the fonts are kept after their first use; the recitation is left to the browser
   (the pages keep their own copy of it, app/core.js).  Activate: older versions are removed. */
'use strict';
var VERSION = "ccadbd94a23a";
var FILES = [["app/book.css","164486fadfb0"],["app/core.js","cab30d50828a"],["app/home.css","30a814c2cc1c"],["app/home.js","853f907e7cdc"],["app/player.js","42439a9e2ed3"],["icons/icon-192.png","8f30dbc0ceee"],["icons/icon-512.png","c18801c6b9a7"],["icons/maskable-192.png","8af6dbba638a"],["icons/maskable-512.png","262b56681ccd"],["index.html","5f768d053ab0"],["manifest.webmanifest","959d46fe042d"],["packages/001-package/001-Al-Faatiha.html","aa0de9961466"],["packages/002-package/002-Al-Baqara.html","c54b862c591c"],["packages/003-package/003-Aal-i-Imraan.html","fe4c0e3790ba"],["packages/004-package/004-An-Nisaa.html","c0fb5bf8a196"],["packages/005-package/005-Al-Maaida.html","5e332df4756f"],["packages/006-package/006-Al-An%27aam.html","68aa6a2f21d5"],["packages/007-package/007-Al-A%27raaf.html","0b173e3f2d6d"],["packages/008-package/008-Al-Anfaal.html","37c702757a4d"],["packages/009-package/009-At-Tawba.html","1f7b41a3f417"],["packages/010-package/010-Yunus.html","07f91da60bbe"],["packages/011-package/011-Hud.html","c2385d66fe4b"],["packages/012-package/012-Yusuf.html","56de519397f3"],["packages/013-package/013-Ar-Ra%27d.html","db93390321b1"],["packages/014-package/014-Ibrahim.html","de5f89c64fe7"],["packages/015-package/015-Al-Hijr.html","3c568e525f4b"],["packages/016-package/016-An-Nahl.html","97d9f0a6b3dc"],["packages/017-package/017-Al-Israa.html","cb50713706ba"],["packages/018-package/018-Al-Kahf.html","4970e6a20b57"],["packages/019-package/019-Maryam.html","7ec9c60b28aa"],["packages/020-package/020-Taa-Haa.html","3f65f12a47e0"],["packages/021-package/021-Al-Anbiyaa.html","9e548b71e0d2"],["packages/022-package/022-Al-Hajj.html","c7a5742fbebe"],["packages/023-package/023-Al-Muminoon.html","29cf316e3290"],["packages/024-package/024-An-Noor.html","c0c1d1c26810"],["packages/025-package/025-Al-Furqaan.html","2d6f0664ded8"],["packages/026-package/026-Ash-Shu%27araa.html","2ee7d459cfd3"],["packages/027-package/027-An-Naml.html","53c8a63672cd"],["packages/028-package/028-Al-Qasas.html","baa30c189ddc"],["packages/029-package/029-Al-Ankaboot.html","00bdb8c281c5"],["packages/030-package/030-Ar-Room.html","866ffd5ebcc2"],["packages/031-package/031-Luqman.html","6124ffdce413"],["packages/032-package/032-As-Sajda.html","dc90510ecab7"],["packages/033-package/033-Al-Ahzaab.html","d5a18c70ffeb"],["packages/034-package/034-Saba.html","96a7cdfc9565"],["packages/035-package/035-Faatir.html","d30993bd8cfe"],["packages/036-package/036-Yaseen.html","b2ae4f83085c"],["packages/037-package/037-As-Saaffaat.html","42fd14022287"],["packages/038-package/038-Saad.html","baa9a717cc99"],["packages/039-package/039-Az-Zumar.html","a8e18ad8f432"],["packages/040-package/040-Al-Ghaafir.html","df603342c6d8"],["packages/041-package/041-Fussilat.html","744679c6deee"],["packages/042-package/042-Ash-Shura.html","9b5f8ac186d4"],["packages/043-package/043-Az-Zukhruf.html","6fbcafb8c1e4"],["packages/044-package/044-Ad-Dukhaan.html","3ffd5c55f8ef"],["packages/045-package/045-Al-Jaathiya.html","74da0b7a695e"],["packages/046-package/046-Al-Ahqaf.html","2d6f383ade87"],["packages/047-package/047-Muhammad.html","d5f24a20e0e7"],["packages/048-package/048-Al-Fath.html","b78d88d8d6ec"],["packages/049-package/049-Al-Hujuraat.html","5e7ed90553ff"],["packages/050-package/050-Qaaf.html","76592e78d21a"],["packages/051-package/051-Adh-Dhaariyat.html","0c9c70c3f840"],["packages/052-package/052-At-Tur.html","59a6bc357ea1"],["packages/053-package/053-An-Najm.html","eb8cb734145b"],["packages/054-package/054-Al-Qamar.html","c2465323f9b3"],["packages/055-package/055-Ar-Rahmaan.html","e1444b79980c"],["packages/056-package/056-Al-Waaqia.html","a179683bc063"],["packages/057-package/057-Al-Hadid.html","72d1438e1cc6"],["packages/058-package/058-Al-Mujaadila.html","e6e5fcf45854"],["packages/059-package/059-Al-Hashr.html","005fbb6901af"],["packages/060-package/060-Al-Mumtahana.html","4081ee7ccb60"],["packages/061-package/061-As-Saff.html","3f253b805b78"],["packages/062-package/062-Al-Jumu%27a.html","fc10c9fb871b"],["packages/063-package/063-Al-Munaafiqoon.html","942f81fae7ff"],["packages/064-package/064-At-Taghaabun.html","fe927cc3fb09"],["packages/065-package/065-At-Talaaq.html","419317012355"],["packages/066-package/066-At-Tahrim.html","e01923dc41c6"],["packages/067-package/067-Al-Mulk.html","cd803ec2642c"],["packages/068-package/068-Al-Qalam.html","de077bd1e51a"],["packages/069-package/069-Al-Haaqqa.html","bedacca3f4b6"],["packages/070-package/070-Al-Ma%27aarij.html","4f5c7669057c"],["packages/071-package/071-Nooh.html","6c9ea96815f3"],["packages/072-package/072-Al-Jinn.html","b1a374515c9f"],["packages/073-package/073-Al-Muzzammil.html","f837626f5c48"],["packages/074-package/074-Al-Muddaththir.html","d712d884d79f"],["packages/075-package/075-Al-Qiyaama.html","0f898449fa0f"],["packages/076-package/076-Al-Insaan.html","547957d9752c"],["packages/077-package/077-Al-Mursalaat.html","573bc1f1ae7b"],["packages/078-package/078-An-Naba.html","c470a1b34981"],["packages/079-package/079-An-Naazi%27aat.html","f540ed4a9ac3"],["packages/080-package/080-Abasa.html","45d4e1122278"],["packages/081-package/081-At-Takwir.html","95bfef6b9b5f"],["packages/082-package/082-Al-Infitaar.html","49375a59df1e"],["packages/083-package/083-Al-Mutaffifin.html","02089d71dfe2"],["packages/084-package/084-Al-Inshiqaaq.html","5ee35dc8ebcb"],["packages/085-package/085-Al-Burooj.html","bbe90413a8e3"],["packages/086-package/086-At-Taariq.html","069e8d8ddfbb"],["packages/087-package/087-Al-A%27laa.html","87f04ddbbd0c"],["packages/088-package/088-Al-Ghaashiya.html","6077c84a1271"],["packages/089-package/089-Al-Fajr.html","3fea1a1c36cb"],["packages/090-package/090-Al-Balad.html","4036b0ed5e35"],["packages/091-package/091-Ash-Shams.html","59e012577f0a"],["packages/092-package/092-Al-Lail.html","068046f37811"],["packages/093-package/093-Ad-Dhuhaa.html","a1c150fa1bca"],["packages/094-package/094-Ash-Sharh.html","ca279f5acd09"],["packages/095-package/095-At-Tin.html","3e6bea628bec"],["packages/096-package/096-Al-Alaq.html","ae2156a51cf4"],["packages/097-package/097-Al-Qadr.html","de50a8bde592"],["packages/098-package/098-Al-Bayyina.html","76bb662cf6fa"],["packages/099-package/099-Az-Zalzala.html","17ba19665c43"],["packages/100-package/100-Al-Aadiyaat.html","9bfae806ebe9"],["packages/101-package/101-Al-Qaari%27a.html","fbc948f5b6fa"],["packages/102-package/102-At-Takaathur.html","d89ea02786b0"],["packages/103-package/103-Al-Asr.html","cc1f45b7b9b2"],["packages/104-package/104-Al-Humaza.html","0bb6f8a83163"],["packages/105-package/105-Al-Fil.html","7863027a0cd0"],["packages/106-package/106-Quraish.html","ee54bde05121"],["packages/107-package/107-Al-Maa%27un.html","c901a4efa007"],["packages/108-package/108-Al-Kawthar.html","3330c0985c65"],["packages/109-package/109-Al-Kaafiroon.html","369910d1c7f2"],["packages/110-package/110-An-Nasr.html","80c7b29717eb"],["packages/111-package/111-Al-Masad.html","24f03baa05bb"],["packages/112-package/112-Al-Ikhlaas.html","cc0d5ee2b2e4"],["packages/113-package/113-Al-Falaq.html","b03b0d12fab2"],["packages/114-package/114-An-Naas.html","f6ac0dee777e"],["packages/hifz-search.js","343ade32eb1a"],["repeats-all-surahs.html","a4c2f77b32a9"],["tanzil-license.txt","9e0f561d049a"]];
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
