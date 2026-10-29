/* Hifz web app: magnetic declination for the qibla compass (2026-10-29).  The World Magnetic Model
   WMM2025 (NOAA NCEI and the British Geological Survey; public domain), valid 2025.0-2030.0, coefficients
   from wmm/WMM2025.COF of the kit, embedded here; tools/prayer.py (run by tools/check_kit.py) checks
   them against that file and this code against the model's 100 official test values.  A phone's compass
   points to magnetic north; the qibla bearing is from true north: true = magnetic + declination.
   The method is the model's own (geomag.c): geodetic to geocentric coordinates, Schmidt
   semi-normalised associated Legendre functions by recursion, the field rotated back to geodetic.
   window.HifzWMM = {declination(latDeg, lonDeg, altKm, decimalYear), field(...) -> {x, y, z, h, f, dec, dip},
   epoch, valid(decimalYear)} */
(function () {
  'use strict';
  var EPOCH = 2025.0, COEF = [[1,0,-29351.8,0.0,12.0,0.0],[1,1,-1410.8,4545.4,9.7,-21.5],[2,0,-2556.6,0.0,-11.6,0.0],[2,1,2951.1,-3133.6,-5.2,-27.7],[2,2,1649.3,-815.1,-8.0,-12.1],[3,0,1361.0,0.0,-1.3,0.0],[3,1,-2404.1,-56.6,-4.2,4.0],[3,2,1243.8,237.5,0.4,-0.3],[3,3,453.6,-549.5,-15.6,-4.1],[4,0,895.0,0.0,-1.6,0.0],[4,1,799.5,278.6,-2.4,-1.1],[4,2,55.7,-133.9,-6.0,4.1],[4,3,-281.1,212.0,5.6,1.6],[4,4,12.1,-375.6,-7.0,-4.4],[5,0,-233.2,0.0,0.6,0.0],[5,1,368.9,45.4,1.4,-0.5],[5,2,187.2,220.2,0.0,2.2],[5,3,-138.7,-122.9,0.6,0.4],[5,4,-142.0,43.0,2.2,1.7],[5,5,20.9,106.1,0.9,1.9],[6,0,64.4,0.0,-0.2,0.0],[6,1,63.8,-18.4,-0.4,0.3],[6,2,76.9,16.8,0.9,-1.6],[6,3,-115.7,48.8,1.2,-0.4],[6,4,-40.9,-59.8,-0.9,0.9],[6,5,14.9,10.9,0.3,0.7],[6,6,-60.7,72.7,0.9,0.9],[7,0,79.5,0.0,-0.0,0.0],[7,1,-77.0,-48.9,-0.1,0.6],[7,2,-8.8,-14.4,-0.1,0.5],[7,3,59.3,-1.0,0.5,-0.8],[7,4,15.8,23.4,-0.1,0.0],[7,5,2.5,-7.4,-0.8,-1.0],[7,6,-11.1,-25.1,-0.8,0.6],[7,7,14.2,-2.3,0.8,-0.2],[8,0,23.2,0.0,-0.1,0.0],[8,1,10.8,7.1,0.2,-0.2],[8,2,-17.5,-12.6,0.0,0.5],[8,3,2.0,11.4,0.5,-0.4],[8,4,-21.7,-9.7,-0.1,0.4],[8,5,16.9,12.7,0.3,-0.5],[8,6,15.0,0.7,0.2,-0.6],[8,7,-16.8,-5.2,-0.0,0.3],[8,8,0.9,3.9,0.2,0.2],[9,0,4.6,0.0,-0.0,0.0],[9,1,7.8,-24.8,-0.1,-0.3],[9,2,3.0,12.2,0.1,0.3],[9,3,-0.2,8.3,0.3,-0.3],[9,4,-2.5,-3.3,-0.3,0.3],[9,5,-13.1,-5.2,0.0,0.2],[9,6,2.4,7.2,0.3,-0.1],[9,7,8.6,-0.6,-0.1,-0.2],[9,8,-8.7,0.8,0.1,0.4],[9,9,-12.9,10.0,-0.1,0.1],[10,0,-1.3,0.0,0.1,0.0],[10,1,-6.4,3.3,0.0,0.0],[10,2,0.2,0.0,0.1,-0.0],[10,3,2.0,2.4,0.1,-0.2],[10,4,-1.0,5.3,-0.0,0.1],[10,5,-0.6,-9.1,-0.3,-0.1],[10,6,-0.9,0.4,0.0,0.1],[10,7,1.5,-4.2,-0.1,0.0],[10,8,0.9,-3.8,-0.1,-0.1],[10,9,-2.7,0.9,-0.0,0.2],[10,10,-3.9,-9.1,-0.0,-0.0],[11,0,2.9,0.0,0.0,0.0],[11,1,-1.5,0.0,-0.0,-0.0],[11,2,-2.5,2.9,0.0,0.1],[11,3,2.4,-0.6,0.0,-0.0],[11,4,-0.6,0.2,0.0,0.1],[11,5,-0.1,0.5,-0.1,-0.0],[11,6,-0.6,-0.3,0.0,-0.0],[11,7,-0.1,-1.2,-0.0,0.1],[11,8,1.1,-1.7,-0.1,-0.0],[11,9,-1.0,-2.9,-0.1,0.0],[11,10,-0.2,-1.8,-0.1,0.0],[11,11,2.6,-2.3,-0.1,0.0],[12,0,-2.0,0.0,0.0,0.0],[12,1,-0.2,-1.3,0.0,-0.0],[12,2,0.3,0.7,-0.0,0.0],[12,3,1.2,1.0,-0.0,-0.1],[12,4,-1.3,-1.4,-0.0,0.1],[12,5,0.6,-0.0,-0.0,-0.0],[12,6,0.6,0.6,0.1,-0.0],[12,7,0.5,-0.1,-0.0,-0.0],[12,8,-0.1,0.8,0.0,0.0],[12,9,-0.4,0.1,0.0,-0.0],[12,10,-0.2,-1.0,-0.1,-0.0],[12,11,-1.3,0.1,-0.0,0.0],[12,12,-0.7,0.2,-0.1,-0.1]];
  var N = 12, D2R = Math.PI / 180;
  var c = [], cd = [], k = [], snorm = [], fn = [], fm = [];
  for (var i = 0; i <= N; i++) { c.push([]); cd.push([]); k.push([]); snorm.push([]); for (var j = 0; j <= N; j++) { c[i][j] = 0; cd[i][j] = 0; k[i][j] = 0; snorm[i][j] = 0; } }
  COEF.forEach(function (r) {
    var n = r[0], m = r[1];
    c[m][n] = r[2]; cd[m][n] = r[4];
    if (m !== 0) { c[n][m - 1] = r[3]; cd[n][m - 1] = r[5]; }
  });
  // Schmidt semi-normalised to unnormalised (geomag.c)
  snorm[0][0] = 1; fm[0] = 0; fn[0] = 1;
  for (var n = 1; n <= N; n++) {
    snorm[0][n] = snorm[0][n - 1] * (2 * n - 1) / n;
    var jj = 2;
    for (var m = 0; m <= n; m++) {
      k[m][n] = ((n - 1) * (n - 1) - m * m) / ((2 * n - 1) * (2 * n - 3));
      if (m > 0) {
        var flnmj = ((n - m + 1) * jj) / (n + m);
        snorm[m][n] = snorm[m - 1][n] * Math.sqrt(flnmj);
        jj = 1;
        c[n][m - 1] = snorm[m][n] * c[n][m - 1];
        cd[n][m - 1] = snorm[m][n] * cd[n][m - 1];
      }
      c[m][n] = snorm[m][n] * c[m][n];
      cd[m][n] = snorm[m][n] * cd[m][n];
    }
    fn[n] = n + 1; fm[n] = n;
  }
  k[1][1] = 0;
  function field(glat, glon, alt, time) {
    var a = 6378.137, b = 6356.7523142, re = 6371.2;
    var a2 = a * a, b2 = b * b, c2 = a2 - b2, a4 = a2 * a2, b4 = b2 * b2, c4 = a4 - b4;
    var dt = time - EPOCH, rlon = glon * D2R, rlat = glat * D2R;
    var srlon = Math.sin(rlon), srlat = Math.sin(rlat), crlon = Math.cos(rlon), crlat = Math.cos(rlat);
    var srlat2 = srlat * srlat, crlat2 = crlat * crlat;
    var sp = [0, srlon], cp = [1, crlon];
    // geodetic to spherical
    var q = Math.sqrt(a2 - c2 * srlat2), q1 = alt * q, q2 = ((q1 + a2) / (q1 + b2)) * ((q1 + a2) / (q1 + b2));
    var ct = srlat / Math.sqrt(q2 * crlat2 + srlat2), st = Math.sqrt(1 - ct * ct);
    var r2 = alt * alt + 2 * q1 + (a4 - c4 * srlat2) / (q * q), r = Math.sqrt(r2);
    var d = Math.sqrt(a2 * crlat2 + b2 * srlat2), ca = (alt + d) / r, sa = c2 * crlat * srlat / (r * d);
    for (var m = 2; m <= N; m++) { sp[m] = sp[1] * cp[m - 1] + cp[1] * sp[m - 1]; cp[m] = cp[1] * cp[m - 1] - sp[1] * sp[m - 1]; }
    var p = [], dp = [], tc = [], pp = [1];
    for (var i = 0; i <= N; i++) { p.push([]); dp.push([]); tc.push([]); for (var j = 0; j <= N; j++) { p[i][j] = 0; dp[i][j] = 0; tc[i][j] = 0; } }
    p[0][0] = 1; dp[0][0] = 0;
    var aor = re / r, ar = aor * aor, br = 0, bt = 0, bp = 0, bpp = 0;
    for (var n = 1; n <= N; n++) {
      ar = ar * aor;
      for (m = 0; m <= n; m++) {
        if (n === m) {
          p[m][n] = st * p[m - 1][n - 1];
          dp[m][n] = st * dp[m - 1][n - 1] + ct * p[m - 1][n - 1];
        } else if (n === 1 && m === 0) {
          p[m][n] = ct * p[m][n - 1];
          dp[m][n] = ct * dp[m][n - 1] - st * p[m][n - 1];
        } else if (n > 1 && n !== m) {
          if (m > n - 2) { p[m][n - 2] = 0; dp[m][n - 2] = 0; }
          p[m][n] = ct * p[m][n - 1] - k[m][n] * p[m][n - 2];
          dp[m][n] = ct * dp[m][n - 1] - st * p[m][n - 1] - k[m][n] * dp[m][n - 2];
        }
        tc[m][n] = c[m][n] + dt * cd[m][n];
        if (m !== 0) tc[n][m - 1] = c[n][m - 1] + dt * cd[n][m - 1];
        var par = ar * p[m][n], temp1, temp2;
        if (m === 0) { temp1 = tc[m][n] * cp[m]; temp2 = tc[m][n] * sp[m]; }
        else { temp1 = tc[m][n] * cp[m] + tc[n][m - 1] * sp[m]; temp2 = tc[m][n] * sp[m] - tc[n][m - 1] * cp[m]; }
        bt = bt - ar * temp1 * dp[m][n];
        bp += fm[m] * temp2 * par;
        br += fn[n] * temp1 * par;
        if (st === 0 && m === 1) {
          pp[n] = n === 1 ? pp[n - 1] : ct * pp[n - 1] - k[m][n] * pp[n - 2];
          bpp += fm[m] * temp2 * ar * pp[n];
        }
      }
    }
    bp = st === 0 ? bpp : bp / st;
    var bx = -bt * ca - br * sa, by = bp, bz = bt * sa - br * ca;
    var bh = Math.sqrt(bx * bx + by * by);
    return { x: bx, y: by, z: bz, h: bh, f: Math.sqrt(bh * bh + bz * bz), dec: Math.atan2(by, bx) / D2R, dip: Math.atan2(bz, bh) / D2R };
  }
  var api = {
    epoch: EPOCH,
    valid: function (t) { return t >= EPOCH && t < EPOCH + 5; },
    field: field,
    declination: function (lat, lon, altKm, t) { return field(lat, lon, altKm || 0, t).dec; }
  };
  if (typeof window !== 'undefined') window.HifzWMM = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
