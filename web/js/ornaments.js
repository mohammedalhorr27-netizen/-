// زخارف التذهيب: ورود وأزهار وأوراق وأغصان على شريط فيروزي مذهّب، تُرسم SVG بألوان الوضع الحالي.
(function () {
  "use strict";

  var PAL = {
    light: {
      band: "#b8d9dc", bandL: "#d6edee", edge: "#6aa2a8", vine: "#5b9298",
      gold: "#d1ad55", goldD: "#9a7629", goldL: "#f0da97",
      rose: "#eeaab5", rose2: "#e08e9d", roseD: "#b5677a",
      peach: "#f5c9a2", peachD: "#c88858", lilac: "#c6b5e0", lilacD: "#8d76b4",
      leaf: "#a9c793", leafD: "#6a8f62", paper: "#f8f0de"
    },
    dark: {
      band: "#1f464c", bandL: "#2a5a61", edge: "#4f8f95", vine: "#8ec5c9",
      gold: "#d8b660", goldD: "#a3802e", goldL: "#f0d995",
      rose: "#e9a3ae", rose2: "#d98596", roseD: "#a65d6e",
      peach: "#efc29c", peachD: "#b67c50", lilac: "#bba9da", lilacD: "#8670ad",
      leaf: "#9cc08a", leafD: "#5f855a", paper: "#15282d"
    }
  };
  var c = PAL.light;

  function g(x, y, s, rot, inner) {
    return '<g transform="translate(' + x + " " + y + ")" + (rot ? " rotate(" + rot + ")" : "") + (s !== 1 ? " scale(" + s + ")" : "") + '">' + inner + "</g>";
  }

  function rose(x, y, s) {
    return g(x, y, s, 0,
      '<circle r="10" fill="' + c.rose + '" stroke="' + c.roseD + '" stroke-width="1"/>' +
      '<path d="M-9.5-2.5C-8-7.5-3-9.5 0-7C3-9.5 8-7.5 9.5-2.5" fill="none" stroke="' + c.roseD + '" stroke-width=".9"/>' +
      '<path d="M-9 3C-6.5 8.5 6.5 8.5 9 3" fill="none" stroke="' + c.roseD + '" stroke-width=".8"/>' +
      '<circle r="6" cy="-.5" fill="' + c.rose2 + '" stroke="' + c.roseD + '" stroke-width=".8"/>' +
      '<path d="M-3-.5C-3-4 3-4 3-.5C3 2.2-1.5 2.8-1.5.2C-1.5-1.5 1.2-1.5 1.2 0" fill="none" stroke="' + c.roseD + '" stroke-width=".9" stroke-linecap="round"/>');
  }

  function blossom(x, y, s, fill, stroke) {
    var p = "";
    for (var k = 0; k < 5; k++) p += '<ellipse cy="-4.3" rx="3" ry="4.1" fill="' + fill + '" stroke="' + stroke + '" stroke-width=".7" transform="rotate(' + k * 72 + ')"/>';
    return g(x, y, s, 0, p + '<circle r="2" fill="' + c.gold + '" stroke="' + c.goldD + '" stroke-width=".5"/>');
  }

  function leaf(x, y, rot, s) {
    return g(x, y, s, rot,
      '<path d="M0 0C3-4.5 9-4.5 12 0C9 4.5 3 4.5 0 0Z" fill="' + c.leaf + '" stroke="' + c.leafD + '" stroke-width=".7"/>' +
      '<path d="M1.5 0H10" stroke="' + c.leafD + '" stroke-width=".6"/>');
  }

  function rumi(x, y, rot, s) {
    return g(x, y, s, rot, '<path d="M0 0C1-6 9-9 15-3C11.5-4 9-2.6 8.6.4C7-1.6 3.6-1.4 2.6 1.2C1.6.2.8.2 0 0Z" fill="' + c.gold + '" stroke="' + c.goldD + '" stroke-width=".7"/>');
  }

  // شريط زخرفي أفقي يتكرر بلا فواصل (120×40)
  function bandBody() {
    return '<rect width="120" height="40" fill="' + c.band + '"/>' +
      '<path d="M0 20C10 9 20 9 30 20S50 31 60 20S80 9 90 20S110 31 120 20" fill="none" stroke="' + c.vine + '" stroke-width="1.4"/>' +
      '<path d="M37 16.5c-.5-4 4.5-5 5-1.8M83 23.5c.5 4-4.5 5-5 1.8M113 16.5c-.5-4 4.5-5 5-1.8" fill="none" stroke="' + c.vine + '" stroke-width=".9" stroke-linecap="round"/>' +
      leaf(21, 15.5, 30, .78) + leaf(9, 15.5, 150, .78) + rose(15, 11.5, .6) +
      rumi(30, 20, -70, .75) + leaf(40, 26, -160, .7) + leaf(50, 26, -20, .7) + blossom(45, 28.5, .72, c.peach, c.peachD) +
      rumi(60, 20, 110, .75) + leaf(81, 15.5, 30, .78) + leaf(69, 15.5, 150, .78) + rose(75, 11.5, .6) +
      rumi(90, 20, -70, .75) + leaf(100, 26, -160, .7) + leaf(110, 26, -20, .7) + blossom(105, 28.5, .72, c.lilac, c.lilacD) +
      '<rect width="120" height="2.2" fill="' + c.gold + '"/><rect y="37.8" width="120" height="2.2" fill="' + c.gold + '"/>' +
      '<path d="M0 4h120M0 36h120" stroke="' + c.edge + '" stroke-width=".7"/>';
  }
  function svg(w, h, body, vb) { return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="' + (vb || "0 0 " + w + " " + h) + '">' + body + "</svg>"; }
  function band() { return svg(120, 40, bandBody()); }
  function bandV() { return svg(40, 120, '<g transform="translate(40 0) rotate(90)">' + bandBody() + "</g>"); }

  function corner() {
    return svg(40, 40,
      '<rect width="40" height="40" fill="' + c.band + '"/><rect x="1.1" y="1.1" width="37.8" height="37.8" fill="none" stroke="' + c.gold + '" stroke-width="2.2"/>' +
      '<circle cx="20" cy="20" r="13.5" fill="' + c.bandL + '" stroke="' + c.gold + '" stroke-width="1.6"/>' +
      leaf(20, 20, 45, .95) + leaf(20, 20, 135, .95) + leaf(20, 20, 225, .95) + leaf(20, 20, 315, .95) + rose(20, 20, .72));
  }

  // التاج البصلي فوق الإطار وتحته
  function crest(flip) {
    var body = '<path d="M0 70C26 70 42 60 54 46C64 34 72 22 80 8C88 22 96 34 106 46C118 60 134 70 160 70Z" fill="' + c.band + '" stroke="' + c.gold + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M18 70C38 68 49 60 59 50C67 41 74 31 80 20C86 31 93 41 101 50C111 60 122 68 142 70Z" fill="' + c.bandL + '" stroke="' + c.edge + '" stroke-width="1"/>' +
      leaf(80, 50, 200, 1) + leaf(80, 50, -20, 1) + leaf(80, 52, 150, .8) + leaf(80, 52, 30, .8) +
      blossom(58, 62, .55, c.peach, c.peachD) + blossom(102, 62, .55, c.peach, c.peachD) +
      rose(80, 48, .95) +
      rumi(80, 8, -110, .8) + rumi(80, 8, -70, .8) +
      '<path d="M80-5C85 1 85 6 80 10C75 6 75 1 80-5Z" fill="' + c.gold + '" stroke="' + c.goldD + '" stroke-width=".8"/>';
    if (flip) body = '<g transform="translate(0 70) scale(1 -1)">' + body + "</g>";
    return svg(160, 76, body, flip ? "0 0 160 76" : "0 -6 160 76");
  }

  function url(s) { return 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s) + '")'; }

  /* ── عناصر مضمّنة في الصفحة ── */

  // وردة مذهّبة ذات فصوص ثمانية (للأرقام والشعار)
  function rosette(inner) {
    var lobes = "", dots = "";
    for (var k = 0; k < 8; k++) {
      var a = k * Math.PI / 4, x = (50 + 30 * Math.cos(a)).toFixed(2), y = (50 + 30 * Math.sin(a)).toFixed(2);
      var b = a + Math.PI / 8, dx = (50 + 36 * Math.cos(b)).toFixed(2), dy = (50 + 36 * Math.sin(b)).toFixed(2);
      lobes += '<circle cx="' + x + '" cy="' + y + '" r="17" fill="' + c.band + '" stroke="' + c.gold + '" stroke-width="2.6"/>';
      dots += '<circle cx="' + dx + '" cy="' + dy + '" r="3.2" fill="' + c.rose + '" stroke="' + c.roseD + '" stroke-width=".8"/>';
    }
    var core = inner === "rose"
      ? '<circle cx="50" cy="50" r="27" fill="' + c.gold + '"/><circle cx="50" cy="50" r="23.5" fill="' + c.bandL + '" stroke="' + c.goldD + '" stroke-width="1"/>' +
        leaf(50, 50, 45, 1.25) + leaf(50, 50, 135, 1.25) + leaf(50, 50, 225, 1.25) + leaf(50, 50, 315, 1.25) + rose(50, 50, 1.25)
      : '<circle cx="50" cy="50" r="27" fill="' + c.gold + '"/><circle cx="50" cy="50" r="23.5" fill="' + c.paper + '" stroke="' + c.goldD + '" stroke-width="1"/>';
    return '<svg viewBox="-4 -4 108 108" aria-hidden="true">' + lobes + '<circle cx="50" cy="50" r="33" fill="' + c.band + '"/>' + dots + core + "</svg>";
  }

  function sprig() {
    return '<svg class="sprig" viewBox="0 0 48 26" aria-hidden="true"><path d="M2 18C13 20 26 18 36 11" fill="none" stroke="' + c.leafD + '" stroke-width="1"/>' +
      leaf(13, 19, -165, .85) + leaf(23, 17, -25, .85) + leaf(27, 15, -150, .7) + blossom(6, 17.5, .5, c.peach, c.peachD) + rose(36, 11, .8) + "</svg>";
  }

  function bullet() { return '<svg class="bul" viewBox="0 0 24 24" aria-hidden="true">' + leaf(12, 12, 200, .9) + leaf(12, 12, -20, .9) + rose(12, 11, .62) + "</svg>"; }

  function isDark() {
    var prefs = {};
    try { prefs = JSON.parse(localStorage.getItem("qatr.prefs") || "{}") || {}; } catch (e) { /* التخزين غير متاح */ }
    return prefs.theme === "dark" || (!prefs.theme && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function apply() {
    c = isDark() ? PAL.dark : PAL.light;
    var s = document.documentElement.style;
    s.setProperty("--band-h", url(band()));
    s.setProperty("--band-v", url(bandV()));
    s.setProperty("--corner", url(corner()));
    s.setProperty("--crest-t", url(crest(false)));
    s.setProperty("--crest-b", url(crest(true)));
    var em = document.getElementById("emblem"), bt = document.getElementById("boot-art");
    if (em) em.innerHTML = rosette("rose");
    if (bt) bt.innerHTML = rosette("rose");
  }

  window.ORN = { apply: apply, rosette: rosette, sprig: sprig, bullet: bullet, isDark: isDark };
  apply();
})();
