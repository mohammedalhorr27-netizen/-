(function () {
  "use strict";

  /* ================= البيانات والفهرسة ================= */

  var SECTIONS = [
    { t: "المقدمات: الكلمة والكلام والإعراب", px: "INTRO", ids: ["kalima", "kalam", "irab", "taqdir"] },
    { t: "إعراب الفعل المضارع", px: "VERB", ids: ["mudari-nasb", "jazm"] },
    { t: "النكرة والمعرفة", px: "MAARIF", ids: ["marifa"] },
    { t: "المبتدأ والخبر ونواسخهما", px: "NAWASIKH", ids: ["mubtada-khabar", "kana", "ma-laysa", "kada", "inna", "la-nafiya", "zanna"] },
    { t: "الفاعل وما يتصل به", px: "FAIL", ids: ["fail", "naib-fail", "ishtighal", "tanazu"] },
    { t: "المنصوبات", px: "NASB", ids: ["mafool-bih", "nida", "mafool-mutlaq", "mafool-lah", "mafool-fih", "mafool-maah", "hal", "tamyiz", "istithna"] },
    { t: "المخفوضات والعاملون عمل الفعل", px: "JARR", ids: ["makhfudat", "amil"] },
    { t: "التوابع", px: "TAWABI", ids: ["tawabi"] },
    { t: "أبواب متفرقة", px: "EXTRA", ids: ["adad", "mamnu-sarf", "taajjub", "waqf", "hamzat-wasl"] }
  ];
  var TYPE = { q: "قرآن", h: "حديث", p: "شعر", a: "قول مأثور", m: "مثال" };
  var PALETTE = [["#ff63c9", "#7b5cff"], ["#31cff7", "#7b5cff"], ["#ffb02e", "#ff3fb4"], ["#7fe02a", "#10a9d6"], ["#a98bff", "#ff5ccf"], ["#ff7a59", "#ffb02e"]];

  var chapters = [];      // مرتبة بحسب ترتيب المتن
  var flat = [];          // كل العقد بترتيب القراءة
  var byKey = {};

  (function index() {
    var known = {};
    var src = window.QATR || [];
    src.forEach(function (c) { known[c.id] = c; });
    var used = {};
    var sections = [];
    SECTIONS.forEach(function (s) {
      var list = s.ids.filter(function (id) { return known[id]; }).map(function (id) { used[id] = 1; return known[id]; });
      if (list.length) sections.push({ t: s.t, px: s.px, list: list });
    });
    var rest = src.filter(function (c) { return !used[c.id]; });
    if (rest.length) sections.push({ t: "أبواب أخرى", px: "MORE", list: rest });

    sections.forEach(function (sec) {
      sec.list.forEach(function (c) {
        var chEntry = null;
        var walk = function (node, key, depth, parent) {
          var e = { key: key, node: node, depth: depth, parent: parent, kids: [], i: flat.length, sec: sec };
          e.ch = chEntry || e;
          if (!chEntry) chEntry = e;
          flat.push(e);
          byKey[key] = e;
          if (parent) parent.kids.push(e);
          (node.k || []).forEach(function (k, i) { walk(k, key + "." + i, depth + 1, e); });
          return e;
        };
        var root = walk(c, c.id, 0, null);
        root.num = chapters.length + 1;
        chapters.push(root);
      });
    });
    chapters.forEach(function (ch) {
      ch.all = flat.filter(function (e) { return e.ch === ch; });
      ch.shCount = ch.all.reduce(function (n, e) { return n + (e.node.sh ? e.node.sh.length : 0); }, 0);
    });
  })();

  function sections() {
    var out = [];
    chapters.forEach(function (ch) {
      var last = out[out.length - 1];
      if (!last || last.sec !== ch.sec) out.push({ sec: ch.sec, list: [ch] });
      else last.list.push(ch);
    });
    return out;
  }

  /* ================= التخزين ================= */

  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* التخزين غير متاح */ } }
  var prefs = load("qatr.prefs", {});
  var done = new Set(load("qatr.done", []));
  var stars = new Set(load("qatr.stars", []));
  function savePrefs() { save("qatr.prefs", prefs); }
  function saveDone() { save("qatr.done", Array.from(done)); }
  function saveStars() { save("qatr.stars", Array.from(stars)); }

  /* ================= أدوات ================= */

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var view = $("#view");
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function pct(a, b) { return b ? Math.round(a * 100 / b) : 0; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function norm(s) {
    return String(s || "").replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي").toLowerCase();
  }
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.tm);
    toast.tm = setTimeout(function () { t.classList.remove("show"); }, 1600);
  }
  function chDone(ch) { return ch.all.filter(function (e) { return done.has(e.key); }).length; }
  function segBar(p, sm) { return '<div class="seg' + (sm ? " sm" : "") + '"><span style="width:' + p + '%"></span></div>'; }
  function winBar(title, closable) {
    return '<div class="win-bar"><span class="win-title pixel">' + esc(title) + '</span><span class="win-btns">' +
      (closable ? '<button class="wb" data-close aria-label="إغلاق">×</button>' : '<span class="wb deco">_</span><span class="wb deco">□</span><span class="wb deco">×</span>') +
      "</span></div>";
  }

  // تظليل موضع الشاهد
  function hl(text, hs) {
    var ranges = [];
    hs.forEach(function (h) {
      if (!h) return;
      var i = text.indexOf(h);
      while (i !== -1) { ranges.push([i, i + h.length]); i = text.indexOf(h, i + h.length); }
    });
    if (!ranges.length) return esc(text);
    ranges.sort(function (a, b) { return a[0] - b[0]; });
    var merged = [ranges[0]];
    ranges.slice(1).forEach(function (r) {
      var last = merged[merged.length - 1];
      if (r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else merged.push(r);
    });
    var out = "", pos = 0;
    merged.forEach(function (r) { out += esc(text.slice(pos, r[0])) + "<mark>" + esc(text.slice(r[0], r[1])) + "</mark>"; pos = r[1]; });
    return out + esc(text.slice(pos));
  }

  function shahidHTML(s) {
    var hs = s.h ? (Array.isArray(s.h) ? s.h : [s.h]) : [];
    var body = (s.s === "p" && s.x.indexOf(" ** ") !== -1)
      ? '<div class="bayt">' + s.x.split(" ** ").map(function (p) { return "<span>" + hl(p, hs) + "</span>"; }).join("") + "</div>"
      : hl(s.x, hs);
    return '<div class="sh-card"><div class="sh-top"><span class="badge ' + s.s + '">' + TYPE[s.s] + "</span>" +
      (s.ref ? "<span>" + esc(s.ref) + "</span>" : "") + "</div>" +
      '<div class="sh-x ' + s.s + '">' + body + "</div>" +
      (s.w ? '<div class="sh-w"><b>وجه الشاهد:</b> ' + esc(s.w) + "</div>" : "") + "</div>";
  }

  function contentHTML(n, opts) {
    opts = opts || {};
    var h = "";
    if (n.m) h += '<div class="matn">«' + esc(n.m) + "»</div>";
    if (n.d) h += '<div class="blk d"><span class="blk-h">✦ الشرح المبسّط</span><p>' + esc(n.d) + "</p></div>";
    if (n.c) h += '<div class="blk c"><span class="blk-h">✔ الشروط</span><ol class="cl">' + n.c.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol></div>";
    if (n.r) h += '<div class="blk r"><span class="blk-h">◆ الأحكام والقواعد</span><ul class="rl">' + n.r.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>";
    if (n.sh) h += '<div class="blk sh"><span class="blk-h">❝ ' + (n.sh.length > 1 ? "الشواهد" : "الشاهد") + "</span>" + n.sh.map(shahidHTML).join("") + "</div>";
    if (n.n) h += '<div class="blk n"><span class="blk-h">⚠ تنبيهات</span><ul class="nl">' + n.n.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>";
    if (opts.kids && opts.kids.length) {
      h += '<div class="blk"><span class="blk-h" style="--bh:#1d1450">⤷ يتفرّع إلى</span><div class="kids-chips">' +
        opts.kids.map(function (k) { return '<button data-open="' + k.key + '">' + esc(k.node.t) + "</button>"; }).join("") + "</div></div>";
    }
    return h;
  }

  /* ================= التوجيه ================= */

  function current() { return (location.hash || "#/").slice(1); }
  function go(hash, replace) {
    var d = (history.state && history.state.d) || 0;
    if (replace) history.replaceState({ d: d }, "", hash);
    else history.pushState({ d: d + 1 }, "", hash);
    route();
  }
  window.addEventListener("popstate", route);

  function route() {
    var r = current();
    var tab = "home";
    closeSheet(true);
    if (r.indexOf("/ch/") === 0 && byKey[r.slice(4)]) renderChapter(byKey[r.slice(4)]);
    else if (r === "/map") renderBigMap();
    else if (r === "/search") { tab = "search"; renderSearch(); }
    else if (r === "/quiz") { tab = "quiz"; renderQuiz(); }
    else if (r === "/saved") { tab = "saved"; renderSaved(); }
    else renderHome();
    document.querySelectorAll("#tabs button").forEach(function (b) { b.classList.toggle("on", b.dataset.tab === tab); });
    $("#btn-back").hidden = r === "/" || r === "";
    window.scrollTo(0, 0);
  }

  // زر الرجوع في أندرويد يستدعي هذه الدالة
  window.__back = function () {
    if (!$("#sheet-wrap").hidden) { closeSheet(); return true; }
    var r = current();
    if (r === "/" || r === "") return false;
    if (history.state && history.state.d > 0) history.back();
    else go("#/", true);
    return true;
  };

  /* ================= الرئيسية ================= */

  function renderHome() {
    var total = flat.length, shs = chapters.reduce(function (n, c) { return n + c.shCount; }, 0);
    var p = pct(done.size, total);
    var last = prefs.last && byKey[prefs.last];
    var h = '<section class="win hero">' + winBar("QATR_ALNADA.EXE") + '<div class="win-body"><span class="sticker">v1.0 ✦</span>' +
      "<h2>مشجرة متن «قطر الندى وبلّ الصدى»</h2><p>لابن هشام الأنصاري — كل باب على هيئة شجرة، وتحت كل غصن: شرح مبسّط، وشروطه، وأحكامه، وشاهده.</p>" +
      '<div class="stats"><span class="chip"><b>' + chapters.length + "</b> بابًا</span><span class=\"chip\"><b>" + total + "</b> غصنًا</span><span class=\"chip\"><b>" + shs + "</b> شاهدًا</span></div>" +
      '<div class="progress-row"><span>إنجازك</span>' + segBar(p) + '<span class="pixel">' + p + "%</span></div>" +
      '<div class="btn-row"><button class="btn pink" data-go="#/map">✦ المشجرة الكبرى</button>' +
      (last ? '<button class="btn aqua" data-resume>↺ تابع: ' + esc(last.node.t) + "</button>" : '<button class="btn aqua" data-go="#/ch/' + (chapters[0] ? chapters[0].key : "") + '">ابدأ من أول باب ←</button>') +
      "</div></div></section>";

    if (!chapters.length) h += '<div class="empty"><span class="big">⚠</span>لم تُحمَّل بيانات المتن.</div>';

    sections().forEach(function (g, gi) {
      h += '<div class="section-h"><span class="pixel">' + pad(gi + 1) + " " + g.sec.px + "</span><h3>" + esc(g.sec.t) + "</h3></div><div class=\"ch-list\">";
      g.list.forEach(function (ch) {
        var dn = chDone(ch), cp = pct(dn, ch.all.length), pal = PALETTE[(ch.num - 1) % PALETTE.length];
        h += '<button class="ch" data-go="#/ch/' + ch.key + '"><span class="ch-num" style="--c1:' + pal[0] + ";--c2:" + pal[1] + '">' + pad(ch.num) + "</span>" +
          '<span class="ch-main"><div class="ch-t">' + esc(ch.node.t) + '</div><div class="ch-meta">' + (ch.all.length - 1) + " غصنًا · " + ch.shCount + " شاهدًا" + (dn ? " · ✓ " + dn : "") + "</div>" + segBar(cp, true) + "</span>" +
          '<span class="ch-go">‹</span></button>';
      });
      h += "</div>";
    });
    h += '<p class="hint" style="text-align:center;margin:1.2rem 0 .4rem">✦ صُنع لطلاب العلم · راجِع الشروح للتوسّع ✦</p>';
    view.innerHTML = h;
  }

  /* ================= المشجرة الكبرى ================= */

  var zoom = prefs.zoom || (window.innerWidth < 420 ? 0.9 : 1);

  function renderBigMap() {
    var h = '<section class="win ch-head">' + winBar("MUSHAJJARA_KUBRA.MAP") + '<div class="win-body"><h2 class="chrome-text">المشجرة الكبرى</h2>' +
      '<p class="lead">أبواب المتن كلها على شجرة واحدة بترتيب ابن هشام. اضغط على أي باب لتفتح مشجرته التفصيلية.</p>' + zoomCtl() + "</div></section>";
    h += '<section class="win">' + winBar("TREE.VIEW") + '<div class="map-wrap"><div class="mm mm-top" style="zoom:' + zoom + '"><button class="mm-node root" data-about>قطر الندى ✦</button><div class="mm-trunk">';
    sections().forEach(function (g) {
      h += '<div class="mm-item"><button class="mm-node sec">' + esc(g.sec.t) + '</button><div class="mm-kids">';
      g.list.forEach(function (ch) {
        h += '<div class="mm-item"><button class="mm-node d0 sm" data-go="#/ch/' + ch.key + '">' + esc(ch.node.t) + "</button></div>";
      });
      h += "</div></div>";
    });
    h += "</div></div></div></section>";
    view.innerHTML = h;
    fitMap();
  }

  // يصغّر المشجرة تلقائيًا لتلائم عرض الشاشة ما لم يختر المستخدم تكبيرًا بنفسه
  function fitMap() {
    if (prefs.zoom) return;
    var wrap = view.querySelector(".map-wrap"), mm = wrap && wrap.querySelector(".mm");
    if (!mm) return;
    mm.style.zoom = 1;
    var avail = wrap.clientWidth - 20, need = mm.scrollWidth;
    zoom = need > avail ? Math.max(0.78, Math.floor(avail / need * 20) / 20) : 1;
    mm.style.zoom = zoom;
  }

  function zoomCtl() {
    return '<div class="ctl-row"><span class="hint" style="margin:0">التكبير</span><div class="zoom"><button class="icon-btn" data-zoom="-1" aria-label="تصغير">−</button><button class="icon-btn" data-zoom="0" aria-label="الحجم الأصلي">⟲</button><button class="icon-btn" data-zoom="1" aria-label="تكبير">+</button></div></div>';
  }
  function setZoom(dir) {
    zoom = dir === 0 ? 1 : Math.min(1.5, Math.max(0.5, Math.round((zoom + dir * 0.1) * 10) / 10));
    prefs.zoom = zoom; savePrefs();
    document.querySelectorAll(".mm").forEach(function (m) { m.style.zoom = zoom; });
    toast("التكبير " + Math.round(zoom * 100) + "%");
  }

  /* ================= صفحة الباب ================= */

  function renderChapter(ch, keepZoom) {
    var mode = prefs.view === "list" ? "list" : "map";
    var dn = chDone(ch), cp = pct(dn, ch.all.length);
    var h = '<section class="win ch-head">' + winBar("BAB_" + pad(ch.num) + ".EXE") + '<div class="win-body">' +
      '<div class="crumbs"><span>' + esc(ch.sec.t) + "</span></div>" +
      '<h2 class="chrome-text">' + esc(ch.node.t) + "</h2>" +
      (ch.node.d ? '<p class="lead">' + esc(ch.node.d) + "</p>" : "") +
      '<div class="progress-row"><span>أنجزت</span>' + segBar(cp) + '<span class="pixel">' + dn + "/" + ch.all.length + "</span></div>" +
      '<div class="ctl-row" style="margin-top:.75rem"><div class="seg-ctl"><button data-mode="map"' + (mode === "map" ? ' class="on"' : "") + '>🌳 المشجرة</button><button data-mode="list"' + (mode === "list" ? ' class="on"' : "") + ">📜 الشرح المفصّل</button></div>" +
      (mode === "map" ? '<div class="zoom"><button class="icon-btn" data-zoom="-1" aria-label="تصغير">−</button><button class="icon-btn" data-zoom="1" aria-label="تكبير">+</button></div>' : "") + "</div>" +
      (mode === "map" ? '<div class="btn-row" style="margin-top:.6rem"><button class="btn ghost sm-btn" data-expand="1">⊕ توسيع الكل</button><button class="btn ghost sm-btn" data-expand="0">⊖ طي الكل</button></div>' : "") +
      '<p class="hint">' + (mode === "map" ? "اضغط على أي غصن لترى شرحه وشروطه وشاهده · الدائرة الصغيرة تفتح الفروع المطويّة · اسحب يمينًا ويسارًا للتنقّل" : "الباب كاملًا مقروءًا من أوله إلى آخره · اضغط «فتح» لعرض الغصن في نافذة") + "</p>" +
      "</div></section>";

    if (mode === "map") {
      h += '<section class="win">' + winBar("TREE.MAP") + '<div class="map-wrap"><div class="mm mm-top" style="zoom:' + zoom + '"><button class="mm-node d0 root-ch" data-open="' + ch.key + '">' + (done.has(ch.key) ? '<span class="ok">✓</span>' : "") + esc(ch.node.t) + '</button><div class="mm-trunk">' + ch.kids.map(mapNode).join("") + "</div></div></div></section>";
    } else {
      h += '<section class="win">' + winBar("SHARH.TXT") + '<div class="win-body outline">' + ch.all.map(outlineNode).join("") + "</div></section>";
    }
    var prev = chapters[ch.num - 2], next = chapters[ch.num];
    h += '<div class="btn-row" style="justify-content:space-between;margin-bottom:1rem">' +
      (prev ? '<button class="btn ghost" data-go-replace="#/ch/' + prev.key + '">→ ' + esc(prev.node.t) + "</button>" : "<span></span>") +
      (next ? '<button class="btn" data-go-replace="#/ch/' + next.key + '">' + esc(next.node.t) + " ←</button>" : "") + "</div>";
    view.innerHTML = h;
    if (mode === "map" && !keepZoom) fitMap();
  }

  // طيّ الفروع: الأبواب الكبيرة تُعرض مطويّة بعد المستوى الثاني ما لم يفتحها المستخدم
  var toggled = {};
  function isClosed(e) {
    if (!e.kids.length) return false;
    if (e.key in toggled) return toggled[e.key];
    return e.depth >= 2 && e.ch.all.length > 30;
  }
  function descCount(e) { return e.kids.reduce(function (n, k) { return n + 1 + descCount(k); }, 0); }
  function setAll(ch, closed) { ch.all.forEach(function (e) { if (e.kids.length && e.depth > 0) toggled[e.key] = closed; }); }

  function mapNode(e) {
    var n = e.node, closed = isClosed(e);
    var cls = "mm-node d" + Math.min(e.depth, 6);
    var h = '<div class="mm-item' + (closed ? " closed" : "") + '"><span class="mm-nw"><button class="' + cls + '" data-open="' + e.key + '">' + (done.has(e.key) ? '<span class="ok">✓</span>' : "") + esc(n.t) + "</button>";
    if (e.kids.length && e.depth > 0) h += '<button class="mm-tog" data-tog="' + e.key + '" aria-label="' + (closed ? "فتح الفروع" : "طي الفروع") + '">' + (closed ? "+" + descCount(e) : "−") + "</button>";
    h += "</span>";
    if (e.kids.length && !closed) h += '<div class="mm-kids">' + e.kids.map(mapNode).join("") + "</div>";
    return h + "</div>";
  }

  var DOTS = ["#ff3fb4", "#7b5cff", "#10bfee", "#7fe02a", "#ffc21a", "#ffc21a", "#ffc21a"];
  function outlineNode(e) {
    return '<div class="ol-node" style="--depth: ' + Math.min(e.depth, 5) + '"><div class="ol-card">' +
      '<div class="ol-t"><span class="bul" style="--dot:' + DOTS[Math.min(e.depth, 6)] + '"></span><span>' + (done.has(e.key) ? "✓ " : "") + esc(e.node.t) + '</span><button data-open="' + e.key + '">فتح ⤢</button></div>' +
      contentHTML(e.node) + "</div></div>";
  }

  /* ================= نافذة الغصن ================= */

  var sheetKey = null;

  function openNode(key) {
    var e = byKey[key];
    if (!e) return;
    sheetKey = key;
    prefs.last = key; savePrefs();
    var path = [], p = e.parent;
    while (p) { path.unshift(p); p = p.parent; }
    var b = '<div class="crumbs">' + path.map(function (a) { return '<button data-open="' + a.key + '">' + esc(a.node.t) + '</button><span class="sep">‹</span>'; }).join("") + "</div>" +
      '<h3 class="node-title" id="sheet-title">' + esc(e.node.t) + "</h3>" + contentHTML(e.node, { kids: e.kids });
    $("#sheet-body").innerHTML = b;
    $("#sheet-body").scrollTop = 0;
    $("#sheet-bar").textContent = "BAB_" + pad(e.ch.num) + " · NODE " + pad(e.ch.all.indexOf(e) + 1) + "/" + pad(e.ch.all.length);
    var prev = flat[e.i - 1], next = flat[e.i + 1];
    $("#sheet-foot").innerHTML =
      '<button class="btn ghost" data-step="-1"' + (prev ? "" : " disabled") + ' aria-label="السابق">→</button>' +
      '<button class="btn ' + (done.has(key) ? "on-done" : "ghost") + '" data-done>' + (done.has(key) ? "✓ فهمتُه" : "○ فهمتُه؟") + "</button>" +
      '<button class="btn ghost star' + (stars.has(key) ? " on" : "") + '" data-star aria-label="مفضلة">' + (stars.has(key) ? "★" : "☆") + "</button>" +
      '<span class="spacer"></span><button class="btn" data-step="1"' + (next ? "" : " disabled") + ">التالي ←</button>";
    $("#sheet-wrap").hidden = false;
  }

  function closeSheet(silent) {
    var wrap = $("#sheet-wrap");
    if (wrap.hidden) return;
    wrap.hidden = true;
    if (!silent && sheetKey) {
      var btn = view.querySelector('.mm-node[data-open="' + sheetKey + '"]');
      if (btn) {
        btn.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
        btn.classList.remove("flash"); void btn.offsetWidth; btn.classList.add("flash");
      }
    }
    sheetKey = null;
  }

  function refreshMarks() {
    var r = current();
    if (r.indexOf("/ch/") === 0) {
      var y = window.scrollY, wrap = view.querySelector(".map-wrap"), sx = wrap ? wrap.scrollLeft : 0, sy = wrap ? wrap.scrollTop : 0;
      renderChapter(byKey[r.slice(4)], true);
      window.scrollTo(0, y);
      wrap = view.querySelector(".map-wrap");
      if (wrap) { wrap.scrollLeft = sx; wrap.scrollTop = sy; }
    } else if (r === "/saved") renderSaved();
  }

  function openAbout() {
    sheetKey = null;
    $("#sheet-bar").textContent = "ABOUT.TXT";
    $("#sheet-body").innerHTML = '<div class="about"><h3 class="node-title" id="sheet-title">عن المشجرة</h3>' +
      "<p><b>قطر الندى وبلّ الصدى</b> متن مختصر في النحو للإمام جمال الدين ابن هشام الأنصاري (ت 761هـ)، وشرحه هو بنفسه. رتّبنا أبوابه هنا على هيئة مشجرة بترتيب المتن.</p>" +
      '<div class="blk d"><span class="blk-h">✦ طريقة الاستعمال</span><ul class="rl">' +
      "<li>افتح بابًا، ثم اضغط على أي غصن في المشجرة لتظهر لك نافذة فيها: الشرح، والشروط، والأحكام، والشاهد.</li>" +
      "<li>بدّل إلى «الشرح المفصّل» لتقرأ الباب كاملًا متصلًا.</li>" +
      "<li>علّم ما فهمته بـ ✓ ليظهر تقدّمك، واحفظ المهم بـ ☆.</li>" +
      "<li>«اختبر نفسك»: يعرض عليك شاهدًا، وتختار القاعدة التي يُستشهد به عليها.</li></ul></div>" +
      '<div class="blk r"><span class="blk-h">◆ ألوان الأغصان</span><div class="legend">' +
      '<span class="mm-node d0">الباب</span><span class="mm-node d1">فرع</span><span class="mm-node d2">فرع الفرع</span><span class="mm-node d3">تفصيل</span><span class="mm-node d4">دقيقة</span></div>' +
      '<div class="legend"><span class="badge q">قرآن</span><span class="badge h">حديث</span><span class="badge p">شعر</span><span class="badge a">قول مأثور</span><span class="badge m">مثال</span></div></div>' +
      '<div class="blk n"><span class="blk-h">⚠ تنبيه</span><ul class="nl"><li>هذه المشجرة تبسيط للمراجعة والحفظ، والعبارات بتصرّف إلا ما وُسم «من المتن». يُرجَع إلى شرح ابن هشام وحواشيه للتوسّع.</li></ul></div>' +
      '<p class="hint">الخطوط: Cairo، Lemonada، Amiri، Silkscreen — برخصة SIL Open Font License.</p></div>';
    $("#sheet-foot").innerHTML = '<span class="spacer"></span><button class="btn" data-close>حسنًا ✦</button>';
    $("#sheet-wrap").hidden = false;
  }

  /* ================= البحث ================= */

  var searchIndex = flat.map(function (e) {
    var n = e.node, parts = [n.t, n.d, n.m].concat(n.c || [], n.r || [], n.n || []);
    (n.sh || []).forEach(function (s) { parts.push(s.x, s.w, s.ref); });
    return { e: e, title: norm(n.t), all: norm(parts.filter(Boolean).join(" ")) };
  });
  var lastQuery = "";

  function renderSearch() {
    view.innerHTML = '<section class="win">' + winBar("SEARCH.EXE") + '<div class="win-body">' +
      '<label class="search-box"><span>⌕</span><input id="q" type="search" placeholder="ابحث: الحال، لن، كان، فاء السببية…" autocomplete="off" value="' + esc(lastQuery) + '"></label>' +
      '<p class="hint">يبحث في العناوين والشروح والشروط والشواهد، ويتجاهل التشكيل.</p></div></section><div id="results"></div>';
    var q = $("#q");
    q.addEventListener("input", function () { lastQuery = q.value; doSearch(q.value); });
    doSearch(lastQuery);
    if (!lastQuery) setTimeout(function () { q.focus(); }, 60);
  }

  function doSearch(q) {
    var out = $("#results");
    var terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) { out.innerHTML = '<div class="empty"><span class="big">✧</span>اكتب كلمة للبحث في المتن كله</div>'; return; }
    var hits = searchIndex.filter(function (x) { return terms.every(function (t) { return x.all.indexOf(t) !== -1; }); });
    hits.sort(function (a, b) {
      var sa = terms.every(function (t) { return a.title.indexOf(t) !== -1; }) ? 0 : 1;
      var sb = terms.every(function (t) { return b.title.indexOf(t) !== -1; }) ? 0 : 1;
      return sa - sb || a.e.i - b.e.i;
    });
    if (!hits.length) { out.innerHTML = '<div class="empty"><span class="big">∅</span>لا نتائج — جرّب كلمة أخرى</div>'; return; }
    out.innerHTML = '<p class="hint" style="margin:0 .3rem .5rem">' + hits.length + " نتيجة</p>" + hits.slice(0, 80).map(function (x) {
      var e = x.e, path = [], p = e.parent;
      while (p) { path.unshift(p.node.t); p = p.parent; }
      var snip = e.node.d || (e.node.sh && e.node.sh[0].x) || "";
      return '<button class="res" data-open="' + e.key + '"><div class="rp">' + esc(path.join(" ‹ ") || "باب") + '</div><div class="rt">' + esc(e.node.t) + '</div><div class="rs">' + esc(snip) + "</div></button>";
    }).join("");
  }

  /* ================= الاختبار ================= */

  var quiz = { ch: "", score: 0, total: 0, streak: 0, cur: null };

  function quizPool() {
    var pool = [];
    flat.forEach(function (e) {
      if (quiz.ch && e.ch.key !== quiz.ch) return;
      if (e.depth === 0) return;
      (e.node.sh || []).forEach(function (s) { pool.push({ e: e, s: s }); });
    });
    return pool;
  }

  function related(a, b) {
    for (var p = a; p; p = p.parent) if (p === b) return true;
    for (p = b; p; p = p.parent) if (p === a) return true;
    return false;
  }

  function newQuestion() {
    var pool = quizPool();
    if (!pool.length) { quiz.cur = null; return; }
    var pick = pool[Math.floor(Math.random() * pool.length)];
    var e = pick.e, seen = {};
    seen[norm(e.node.t)] = 1;
    var cands = shuffle(flat.filter(function (x) { return x.depth > 0 && x.ch === e.ch && !related(x, e); }));
    var others = shuffle(flat.filter(function (x) { return x.depth > 0 && x.ch !== e.ch && x.node.sh; }));
    var opts = [e];
    cands.concat(others).forEach(function (x) {
      if (opts.length >= 4) return;
      var k = norm(x.node.t);
      if (seen[k]) return;
      seen[k] = 1; opts.push(x);
    });
    quiz.cur = { e: e, s: pick.s, opts: shuffle(opts), answered: false };
  }

  function renderQuiz() {
    if (!quiz.cur) newQuestion();
    var c = quiz.cur;
    var h = '<section class="win">' + winBar("QUIZ.EXE") + '<div class="win-body">' +
      '<div class="score"><select class="sel" id="quiz-ch"><option value="">كل الأبواب</option>' +
      chapters.map(function (ch) { return '<option value="' + ch.key + '"' + (quiz.ch === ch.key ? " selected" : "") + ">" + esc(ch.node.t) + "</option>"; }).join("") +
      '</select><span class="lcd">SCORE ' + pad(quiz.score) + "/" + pad(quiz.total) + " · ★" + quiz.streak + "</span></div>";
    if (!c) {
      h += '<div class="empty"><span class="big">∅</span>لا شواهد في هذا الباب بعد</div></div></section>';
      view.innerHTML = h; return;
    }
    h += '<p class="q-ask">❓ هذا الشاهد يُستشهد به على أيّ قاعدة؟</p>' + shahidHTML({ x: c.s.x, h: c.s.h, s: c.s.s, ref: c.s.ref }) +
      '<div class="opts">' + c.opts.map(function (o, i) {
        var cls = "opt";
        if (c.answered) { if (o === c.e) cls += " right"; else if (i === c.picked) cls += " wrong"; }
        return '<button class="' + cls + '" data-ans="' + i + '"' + (c.answered ? " disabled" : "") + "><small>" + esc(o.ch.node.t + (o.parent && o.parent.depth > 0 ? " ‹ " + o.parent.node.t : "")) + "</small>" + esc(o.node.t) + "</button>";
      }).join("") + "</div>";
    if (c.answered) {
      h += (c.s.w ? '<div class="sh-w" style="margin-top:.7rem"><b>وجه الشاهد:</b> ' + esc(c.s.w) + "</div>" : "") +
        '<div class="btn-row"><button class="btn ghost" data-open="' + c.e.key + '">افتح الشرح ⤢</button><span class="spacer" style="flex:1"></span><button class="btn pink" data-next-q>السؤال التالي ←</button></div>';
    }
    h += "</div></section>";
    view.innerHTML = h;
    $("#quiz-ch").addEventListener("change", function (ev) { quiz.ch = ev.target.value; newQuestion(); renderQuiz(); });
  }

  function answer(i) {
    var c = quiz.cur;
    if (!c || c.answered) return;
    c.answered = true; c.picked = i;
    quiz.total++;
    if (c.opts[i] === c.e) { quiz.score++; quiz.streak++; toast(quiz.streak > 2 ? "رائع! " + quiz.streak + " على التوالي ★" : "إجابة صحيحة ✓"); }
    else { quiz.streak = 0; toast("راجع هذه القاعدة ↺"); }
    renderQuiz();
  }

  /* ================= محفوظاتي ================= */

  function renderSaved() {
    var list = Array.from(stars).map(function (k) { return byKey[k]; }).filter(Boolean).sort(function (a, b) { return a.i - b.i; });
    var h = '<section class="win">' + winBar("FAVORITES.DAT") + '<div class="win-body"><h2 class="node-title">☆ المفضلة</h2>';
    h += list.length ? list.map(function (e) {
      return '<button class="res" data-open="' + e.key + '"><div class="rp">' + esc(e.ch.node.t) + '</div><div class="rt">' + esc(e.node.t) + "</div></button>";
    }).join("") : '<div class="empty"><span class="big">☆</span>اضغط ☆ في نافذة أي غصن ليُحفظ هنا</div>';
    h += "</div></section>";
    h += '<section class="win">' + winBar("PROGRESS.LOG") + '<div class="win-body"><h2 class="node-title">✓ تقدّمك في الأبواب</h2>';
    chapters.forEach(function (ch) {
      var dn = chDone(ch);
      h += '<button class="res" data-go="#/ch/' + ch.key + '"><div class="rt">' + pad(ch.num) + " · " + esc(ch.node.t) + '</div><div class="progress-row">' + segBar(pct(dn, ch.all.length), true) + '<span class="pixel">' + dn + "/" + ch.all.length + "</span></div></button>";
    });
    h += '<div class="btn-row"><button class="btn ghost" data-reset>مسح التقدّم</button></div></div></section>';
    view.innerHTML = h;
  }

  /* ================= الثيم وحجم الخط ================= */

  var FS = [0.9, 1, 1.12, 1.25];
  var FS_NAMES = ["صغير", "متوسط", "كبير", "كبير جدًا"];
  function isDark() { return prefs.theme === "dark" || (!prefs.theme && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches); }
  function syncBars() {
    try { if (window.AndroidBridge) window.AndroidBridge.setDark(isDark()); } catch (e) { /* خارج أندرويد */ }
  }
  function toggleTheme() {
    prefs.theme = isDark() ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", prefs.theme);
    savePrefs(); syncBars();
    toast(prefs.theme === "dark" ? "ثيم Cyber ✦" : "ثيم Bubblegum ✿");
  }
  function cycleFont() {
    var i = (FS.indexOf(prefs.fs || 1) + 1) % FS.length;
    prefs.fs = FS[i];
    document.documentElement.style.setProperty("--fs", prefs.fs);
    savePrefs();
    toast("حجم الخط: " + FS_NAMES[i]);
  }

  /* ================= الأحداث ================= */

  document.addEventListener("click", function (ev) {
    var t = ev.target.closest("button, [data-close]");
    if (!t) return;
    var d = t.dataset;
    if ("close" in d) { closeSheet(); return; }
    if (d.open) { openNode(d.open); return; }
    if (d.go) { go(d.go); return; }
    if (d.goReplace) { go(d.goReplace, true); return; }
    if (d.mode) { prefs.view = d.mode; savePrefs(); renderChapter(byKey[current().slice(4)]); return; }
    if (d.zoom) { setZoom(+d.zoom); return; }
    if (d.tog) { var te = byKey[d.tog]; toggled[d.tog] = !isClosed(te); refreshMarks(); return; }
    if (d.expand) { setAll(byKey[current().slice(4)], d.expand === "0"); refreshMarks(); toast(d.expand === "0" ? "طُويت الفروع" : "فُتحت كل الفروع"); return; }
    if (d.step) { var e = byKey[sheetKey], n = e && flat[e.i + +d.step]; if (n) openNode(n.key); return; }
    if ("done" in d && sheetKey) {
      if (done.has(sheetKey)) done.delete(sheetKey); else { done.add(sheetKey); toast("أحسنت! ✓"); }
      saveDone(); openNode(sheetKey); refreshMarks(); return;
    }
    if ("star" in d && sheetKey) {
      if (stars.has(sheetKey)) stars.delete(sheetKey); else { stars.add(sheetKey); toast("أُضيف إلى المفضلة ★"); }
      saveStars(); openNode(sheetKey); if (current() === "/saved") renderSaved(); return;
    }
    if ("about" in d) { openAbout(); return; }
    if ("resume" in d) { var l = byKey[prefs.last]; if (l) { go("#/ch/" + l.ch.key); openNode(l.key); } return; }
    if (d.ans) { answer(+d.ans); return; }
    if ("nextQ" in d) { newQuestion(); renderQuiz(); return; }
    if ("reset" in d) {
      if (confirm("مسح كل علامات الفهم؟")) { done.clear(); saveDone(); renderSaved(); toast("تم المسح"); }
      return;
    }
    if (d.tab) {
      var target = { home: "#/", search: "#/search", quiz: "#/quiz", saved: "#/saved" }[d.tab];
      if (current() === target.slice(1)) return;
      var depth = (history.state && history.state.d) || 0;
      if (d.tab === "home" && depth > 0) history.go(-depth);
      else go(target, current() !== "/");
      return;
    }
  });

  $("#btn-back").addEventListener("click", function () { window.__back(); });
  $("#brand").addEventListener("click", function () { if (current() !== "/") { var d = (history.state && history.state.d) || 0; if (d > 0) history.go(-d); else go("#/", true); } });
  $("#btn-theme").addEventListener("click", toggleTheme);
  $("#btn-font").addEventListener("click", cycleFont);
  $("#btn-about").addEventListener("click", openAbout);
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") closeSheet(); });

  var mq = "✦ مشجرة متن قطر الندى وبلّ الصدى لابن هشام الأنصاري ✦ اضغط أي غصن لترى الشرح والشروط والشاهد ✦ علّم ما فهمته ✓ واحفظ المهم ☆ ✦ اختبر نفسك بالشواهد ★ ";
  $("#marquee-text").textContent = mq;
  $("#marquee-text2").textContent = mq;

  /* ================= البدء ================= */

  history.replaceState({ d: 0 }, "", location.hash || "#/");
  route();
  syncBars();
  setTimeout(function () { $("#boot").classList.add("gone"); }, 900);
})();
