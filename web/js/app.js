(function () {
  "use strict";

  /* ================= البيانات والفهرسة ================= */

  var SECTIONS = [
    { t: "المقدمات: الكلمة والكلام والإعراب", ids: ["kalima", "kalam", "irab", "taqdir"] },
    { t: "إعراب الفعل المضارع", ids: ["mudari-nasb", "jazm"] },
    { t: "النكرة والمعرفة", ids: ["marifa"] },
    { t: "المبتدأ والخبر ونواسخهما", ids: ["mubtada-khabar", "kana", "ma-laysa", "kada", "inna", "la-nafiya", "zanna"] },
    { t: "الفاعل وما يتصل به", ids: ["fail", "naib-fail", "ishtighal", "tanazu"] },
    { t: "المنصوبات", ids: ["mafool-bih", "nida", "mafool-mutlaq", "mafool-lah", "mafool-fih", "mafool-maah", "hal", "tamyiz", "istithna"] },
    { t: "المخفوضات والعاملون عمل الفعل", ids: ["makhfudat", "amil"] },
    { t: "التوابع", ids: ["tawabi"] },
    { t: "أبواب متفرقة", ids: ["adad", "mamnu-sarf", "taajjub", "waqf", "hamzat-wasl"] }
  ];
  var TYPE = { q: "قرآن", h: "حديث", p: "شعر", a: "قول مأثور", m: "مثال" };
  var DEPTH_COLOR = ["var(--gold)", "var(--red)", "var(--lapis)", "var(--teal)", "var(--gold)"];
  var LETTERS = ["أ", "ب", "ج", "د"];

  var chapters = [];      // بترتيب المتن
  var flat = [];          // كل العقد بترتيب القراءة
  var byKey = {};

  (function index() {
    var src = window.QATR || [], known = {}, used = {}, groups = [];
    src.forEach(function (c) { known[c.id] = c; });
    SECTIONS.forEach(function (s) {
      var list = s.ids.filter(function (id) { return known[id]; }).map(function (id) { used[id] = 1; return known[id]; });
      if (list.length) groups.push({ t: s.t, list: list });
    });
    var rest = src.filter(function (c) { return !used[c.id]; });
    if (rest.length) groups.push({ t: "أبواب أخرى", list: rest });

    groups.forEach(function (sec) {
      sec.list.forEach(function (c) {
        var root = null;
        var walk = function (node, key, depth, parent) {
          var e = { key: key, node: node, depth: depth, parent: parent, kids: [], i: flat.length, sec: sec };
          e.ch = root || e;
          if (!root) root = e;
          flat.push(e);
          byKey[key] = e;
          if (parent) parent.kids.push(e);
          (node.k || []).forEach(function (k, i) { walk(k, key + "." + i, depth + 1, e); });
        };
        walk(c, c.id, 0, null);
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
  function ar(s) { return String(s).replace(/\d/g, function (d) { return "٠١٢٣٤٥٦٧٨٩"[d]; }); }
  function pct(a, b) { return b ? Math.round(a * 100 / b) : 0; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function norm(s) {
    return String(s || "").replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي").toLowerCase();
  }
  function icon(id, cls) { return '<svg' + (cls ? ' class="' + cls + '"' : "") + '><use href="#' + id + '"/></svg>'; }
  function bul() { return window.ORN ? ORN.bullet() : ""; }
  function lbl(t) { return '<div class="lbl">' + bul() + t + "</div>"; }
  function eyebrow(t) { return '<span class="eyebrow">' + bul() + t + "</span>"; }
  function medal(inner, cls) { return '<span class="med' + (cls ? " " + cls : "") + '">' + ORN.rosette() + (inner ? "<b>" + inner + "</b>" : "") + "</span>"; }
  function hair(p) { return '<div class="hair"><span style="width:' + p + '%"></span></div>'; }
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.tm);
    toast.tm = setTimeout(function () { t.classList.remove("show"); }, 1600);
  }
  function chDone(ch) { return ch.all.filter(function (e) { return done.has(e.key); }).length; }

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

  function shahidHTML(s, withW) {
    var hs = s.h ? (Array.isArray(s.h) ? s.h : [s.h]) : [];
    var body = (s.s === "p" && s.x.indexOf(" ** ") !== -1)
      ? '<div class="bayt">' + s.x.split(" ** ").map(function (p) { return "<span>" + hl(p, hs) + "</span>"; }).join("") + "</div>"
      : hl(s.x, hs);
    return '<div class="illum sm"><div class="sh-top"><span class="tag ' + s.s + '">' + TYPE[s.s] + "</span>" +
      (s.ref ? "<span>" + esc(ar(s.ref)) + "</span>" : "") + "</div>" +
      '<div class="sh-x ' + s.s + '">' + body + "</div>" +
      (s.w && withW !== false ? '<div class="sh-w"><b>وجه الشاهد:</b> ' + esc(s.w) + "</div>" : "") + "</div>";
  }

  function contentHTML(n, kids) {
    var h = "";
    if (n.m) h += '<div class="matn"><small>من المتن</small>«' + esc(n.m) + "»</div>";
    if (n.d) h += '<div class="blk">' + lbl("الشرح") + "<p>" + esc(n.d) + "</p></div>";
    if (n.c) h += '<div class="blk">' + lbl("الشروط") + '<ol class="cl">' + n.c.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol></div>";
    if (n.r) h += '<div class="blk">' + lbl("الأحكام والقواعد") + '<ul class="rl">' + n.r.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>";
    if (n.sh) h += '<div class="blk">' + lbl(n.sh.length > 1 ? "الشواهد" : "الشاهد") + n.sh.map(function (s) { return shahidHTML(s); }).join("") + "</div>";
    if (n.n) h += '<div class="blk">' + lbl("تنبيهات") + '<ul class="nl">' + n.n.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>";
    if (kids && kids.length) {
      h += '<div class="blk">' + lbl("يتفرّع إلى") + '<div class="kids">' +
        kids.map(function (k) { return '<button data-open="' + k.key + '">' + esc(k.node.t) + "</button>"; }).join("") + "</div></div>";
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
    var r = current(), tab = "home";
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
    var p = pct(done.size, total), C = 150.8;
    var last = prefs.last && byKey[prefs.last];
    var h = '<section class="illum hero has-crest has-crest-b"><i class="crest t"></i><i class="crest b"></i>' +
      "<h2>قَطْرُ النَّدَى وَبَلُّ الصَّدَى</h2>" +
      '<p class="by">مشجرة المتن للإمام جمال الدين ابن هشام الأنصاري · ت ٧٦١هـ</p>' +
      '<div class="stats"><div class="stat"><b>' + ar(chapters.length) + "</b><span>بابًا</span></div>" + bul() +
      '<div class="stat"><b>' + ar(total) + "</b><span>فرعًا</span></div>" + bul() +
      '<div class="stat"><b>' + ar(shs) + "</b><span>شاهدًا</span></div></div>" +
      '<div class="progress"><svg class="ring" viewBox="0 0 56 56"><circle class="bgc" cx="28" cy="28" r="24"/><circle class="fgc" cx="28" cy="28" r="24" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C - C * p / 100) + '"/></svg>' +
      '<div class="pt"><b>' + ar(p) + "٪</b><span>" + (done.size ? "فهمتَ " + ar(done.size) + " فرعًا" : "ابدأ وعلّم ما تفهمه") + "</span></div></div>" +
      '<div class="btn-row"><button class="btn" data-go="#/map">' + icon("i-tree") + "المشجرة الكبرى</button>" +
      (last ? '<button class="btn ghost" data-resume>' + icon("i-scroll") + "تابع: " + esc(last.node.t) + "</button>"
            : '<button class="btn ghost" data-go="#/ch/' + (chapters[0] ? chapters[0].key : "") + '">' + icon("i-scroll") + "ابدأ من أول باب</button>") +
      "</div></section>";

    if (!chapters.length) h += '<div class="empty">لم تُحمَّل بيانات المتن.</div>';

    sections().forEach(function (g) {
      h += '<div class="sec-h">' + ORN.sprig() + "<h3>" + esc(g.sec.t) + '</h3></div><div class="ch-list">';
      g.list.forEach(function (ch) {
        var dn = chDone(ch), cp = pct(dn, ch.all.length);
        h += '<button class="ch" data-go="#/ch/' + ch.key + '">' + medal(ar(ch.num), cp === 100 ? "done" : "") +
          '<span class="ch-main"><div class="ch-t">' + esc(ch.node.t) + '</div><div class="ch-meta">' + ar(ch.all.length - 1) + " فرعًا · " + ar(ch.shCount) + " شاهدًا" + (dn ? " · فهمتَ " + ar(dn) : "") + "</div>" + hair(cp) + "</span>" +
          icon("i-next", "ch-go") + "</button>";
      });
      h += "</div>";
    });
    h += '<p class="foot-note">صُنع لطلاب العلم · والرجوع إلى الشروح للتوسّع</p>';
    view.innerHTML = h;
  }

  /* ================= المشجرة الكبرى ================= */

  var zoom = prefs.zoom || 1;

  function zoomTools() {
    return '<div class="grp"><button class="ib sm" data-zoom="-1" aria-label="تصغير">' + icon("i-minus") + '</button><button class="ib sm" data-zoom="1" aria-label="تكبير">' + icon("i-plus") + "</button></div>";
  }

  function renderBigMap() {
    var h = '<section class="illum thin has-crest ch-head"><i class="crest t"></i>' + eyebrow("المشجرة الكبرى") + "<h2>أبواب المتن كلها</h2>" +
      '<p class="lead">أبواب «قطر الندى» على شجرة واحدة بترتيب ابن هشام، اضغط أي باب لتفتح مشجرته التفصيلية.</p>' +
      '<div class="tools"><span class="hint" style="margin:0">التكبير</span>' + zoomTools() + "</div></section>";
    h += '<div class="map-wrap"><div class="mm mm-top" style="zoom:' + zoom + '"><button class="mm-node d0 root" data-about>قطر الندى</button><div class="mm-trunk">';
    sections().forEach(function (g) {
      h += '<div class="mm-item"><span class="mm-nw"><button class="mm-node sec">' + esc(g.sec.t) + '</button></span><div class="mm-kids">';
      g.list.forEach(function (ch) {
        h += '<div class="mm-item"><span class="mm-nw"><button class="mm-node" data-go="#/ch/' + ch.key + '">' + ar(ch.num) + " · " + esc(ch.node.t) + "</button></span></div>";
      });
      h += "</div></div>";
    });
    h += "</div></div></div>";
    view.innerHTML = h;
    fitMap();
  }

  // يصغّر المشجرة لتلائم عرض الشاشة ما لم يختر المستخدم تكبيرًا بنفسه
  function fitMap() {
    if (prefs.zoom) return;
    var wrap = view.querySelector(".map-wrap"), mm = wrap && wrap.querySelector(".mm");
    if (!mm) return;
    mm.style.zoom = 1;
    var avail = wrap.clientWidth - 24, need = mm.scrollWidth;
    zoom = need > avail ? Math.max(0.78, Math.floor(avail / need * 20) / 20) : 1;
    mm.style.zoom = zoom;
  }

  function setZoom(dir) {
    zoom = Math.min(1.5, Math.max(0.5, Math.round((zoom + dir * 0.1) * 10) / 10));
    prefs.zoom = zoom; savePrefs();
    document.querySelectorAll(".mm").forEach(function (m) { m.style.zoom = zoom; });
    toast("التكبير " + ar(Math.round(zoom * 100)) + "٪");
  }

  /* ================= صفحة الباب ================= */

  // طيّ الفروع: الأبواب الكبيرة تُعرض مطويّة بعد المستوى الثاني ما لم يفتحها المستخدم
  var toggled = {};
  function isClosed(e) {
    if (!e.kids.length) return false;
    if (e.key in toggled) return toggled[e.key];
    return e.depth >= 2 && e.ch.all.length > 30;
  }
  function descCount(e) { return e.kids.reduce(function (n, k) { return n + 1 + descCount(k); }, 0); }
  function setAll(ch, closed) { ch.all.forEach(function (e) { if (e.kids.length && e.depth > 0) toggled[e.key] = closed; }); }

  function renderChapter(ch, keepZoom) {
    var mode = prefs.view === "list" ? "list" : "map";
    var dn = chDone(ch), cp = pct(dn, ch.all.length);
    var h = '<section class="illum thin has-crest ch-head"><i class="crest t"></i>' + eyebrow("الباب " + ar(ch.num) + " · " + esc(ch.sec.t)) +
      "<h2>" + esc(ch.node.t) + "</h2>" +
      (ch.node.d ? '<p class="lead">' + esc(ch.node.d) + "</p>" : "") +
      '<div class="pline"><span>فهمتَ ' + ar(dn) + " من " + ar(ch.all.length) + "</span>" + hair(cp) + "</div>" +
      '<div class="tabs2"><button data-mode="map"' + (mode === "map" ? ' class="on"' : "") + ">" + icon("i-tree") + "المشجرة</button>" +
      '<button data-mode="list"' + (mode === "list" ? ' class="on"' : "") + ">" + icon("i-scroll") + "الشرح المفصّل</button></div>" +
      (mode === "map"
        ? '<div class="tools"><div class="grp"><button class="btn ghost sm" data-expand="1">' + icon("i-expand") + 'توسيع الكل</button><button class="btn ghost sm" data-expand="0">' + icon("i-collapse") + "طيّ الكل</button></div>" + zoomTools() + "</div>" +
          '<p class="hint">اضغط أي فرع لترى شرحه وشروطه وشاهده، والدائرة الذهبية تفتح الفروع المطويّة.</p>'
        : '<p class="hint" style="margin-top:0">الباب كاملًا من أوله إلى آخره، واضغط «فتح» لعرض الفرع في نافذة.</p>') +
      "</section>";

    if (mode === "map") {
      h += '<div class="map-wrap"><div class="mm mm-top" style="zoom:' + zoom + '"><button class="mm-node d0" data-open="' + ch.key + '">' + okMark(ch) + esc(ch.node.t) + '</button><div class="mm-trunk">' + ch.kids.map(mapNode).join("") + "</div></div></div>";
    } else {
      h += '<div class="outline">' + ch.all.map(outlineNode).join("") + "</div>";
    }
    var prev = chapters[ch.num - 2], next = chapters[ch.num];
    h += '<div class="chap-nav">' +
      (prev ? '<button class="btn ghost sm" data-go-replace="#/ch/' + prev.key + '">' + icon("i-prev") + "<span>" + esc(prev.node.t) + "</span></button>" : "<span></span>") +
      (next ? '<button class="btn sm" data-go-replace="#/ch/' + next.key + '"><span>' + esc(next.node.t) + "</span>" + icon("i-next") + "</button>" : "") + "</div>";
    view.innerHTML = h;
    if (mode === "map" && !keepZoom) fitMap();
  }

  function okMark(e) { return done.has(e.key) ? '<span class="ok">' + icon("i-check") + "</span>" : ""; }

  function mapNode(e) {
    var closed = isClosed(e);
    var h = '<div class="mm-item' + (closed ? " closed" : "") + '"><span class="mm-nw"><button class="mm-node d' + Math.min(e.depth, 6) + '" data-open="' + e.key + '">' + okMark(e) + esc(e.node.t) + "</button>";
    if (e.kids.length) h += '<button class="mm-tog" data-tog="' + e.key + '" aria-label="' + (closed ? "فتح الفروع" : "طيّ الفروع") + '">' + (closed ? "+" + ar(descCount(e)) : icon("i-minus")) + "</button>";
    h += "</span>";
    if (e.kids.length && !closed) h += '<div class="mm-kids">' + e.kids.map(mapNode).join("") + "</div>";
    return h + "</div>";
  }

  function outlineNode(e) {
    var d = Math.min(e.depth, 4);
    return '<div class="ol-node lv' + d + '" style="--depth:' + Math.min(e.depth, 5) + '"><div class="ol-card" style="--dc:' + DEPTH_COLOR[d] + '">' +
      '<div class="ol-t">' + (done.has(e.key) ? icon("i-check", "ok") : "") + "<span>" + esc(e.node.t) + '</span><button data-open="' + e.key + '">فتح</button></div>' +
      contentHTML(e.node) + "</div></div>";
  }

  /* ================= نافذة الفرع ================= */

  var sheetKey = null;

  function openNode(key) {
    var e = byKey[key];
    if (!e) return;
    sheetKey = key;
    prefs.last = key; savePrefs();
    var path = [], p = e.parent;
    while (p) { path.unshift(p); p = p.parent; }
    $("#sheet-body").innerHTML = '<div class="crumbs">' + path.map(function (a) { return '<button data-open="' + a.key + '">' + esc(a.node.t) + "</button><i>‹</i>"; }).join("") + "</div>" +
      '<h3 class="node-title" id="sheet-title">' + esc(e.node.t) + "</h3>" + contentHTML(e.node, e.kids);
    $("#sheet-body").scrollTop = 0;
    $("#sheet-bar").textContent = "الباب " + ar(e.ch.num) + " · الفرع " + ar(e.ch.all.indexOf(e) + 1) + " من " + ar(e.ch.all.length);
    var prev = flat[e.i - 1], next = flat[e.i + 1], isDone = done.has(key), isStar = stars.has(key);
    $("#sheet-foot").innerHTML =
      '<button class="ib" data-step="-1"' + (prev ? "" : " disabled") + ' aria-label="السابق">' + icon("i-prev") + "</button>" +
      '<button class="btn sm ' + (isDone ? "done-on" : "ghost") + '" data-done>' + icon("i-check") + (isDone ? "فهمتُه" : "فهمتُه؟") + "</button>" +
      '<button class="ib' + (isStar ? " on" : "") + '" data-star aria-label="حفظ">' + icon("i-bookmark") + "</button>" +
      '<span class="grow"></span><button class="btn sm" data-step="1"' + (next ? "" : " disabled") + ">التالي" + icon("i-next") + "</button>";
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

  function refreshView() {
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
    $("#sheet-bar").textContent = "عن التطبيق";
    $("#sheet-body").innerHTML = '<div class="about"><h3 class="node-title" id="sheet-title">عن المشجرة</h3>' +
      "<p><b>قطر الندى وبلّ الصدى</b> متن مختصر في النحو للإمام جمال الدين ابن هشام الأنصاري (ت ٧٦١هـ). رُتّبت أبوابه هنا على هيئة مشجرة بترتيب المتن.</p>" +
      '<div class="blk">' + lbl("طريقة الاستعمال") + '<ul class="rl">' +
      "<li>افتح بابًا، ثم اضغط أي فرع في المشجرة لتظهر لك صفحته: الشرح، والشروط، والأحكام، والشاهد.</li>" +
      "<li>الدائرة الذهبية بجانب الفرع تطويه أو تفتحه، و«توسيع الكل» يعرض الشجرة كاملة.</li>" +
      "<li>«الشرح المفصّل» يعرض الباب كاملًا للقراءة المتصلة.</li>" +
      "<li>علّم ما فهمته ليظهر تقدّمك، واحفظ المهم في «محفوظاتي».</li>" +
      "<li>«اختبر نفسك»: يُعرض عليك شاهد وتختار القاعدة التي يُستشهد به عليها.</li></ul></div>" +
      '<div class="blk">' + lbl("ألوان الفروع") + '<div class="legend"><span class="mm-node d1">فرع أول</span><span class="mm-node d2">فرع ثانٍ</span><span class="mm-node d3">فرع ثالث</span><span class="mm-node d4">تفصيل</span></div>' +
      '<div class="legend"><span class="tag q">قرآن</span><span class="tag h">حديث</span><span class="tag p">شعر</span><span class="tag a">قول مأثور</span><span class="tag m">مثال</span></div></div>' +
      '<div class="blk">' + lbl("تنبيه") + '<ul class="nl"><li>الشرح هنا تبسيط للمراجعة والحفظ، والعبارات بتصرّف إلا ما وُسم «من المتن»، ويُرجع إلى شرح ابن هشام وحواشيه للتوسّع.</li></ul></div>' +
      '<p class="hint">الخطوط: عارف رقعة، وIBM Plex Sans Arabic، والأميري — برخصة SIL Open Font License.</p></div>';
    $("#sheet-foot").innerHTML = '<span class="grow"></span><button class="btn sm" data-close>حسنًا</button>';
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
    view.innerHTML = '<section class="illum thin">' + eyebrow("البحث في المتن") +
      '<label class="search-box">' + icon("i-search") + '<input id="q" type="search" placeholder="الحال، لن، كان، فاء السببية…" autocomplete="off" value="' + esc(lastQuery) + '"></label>' +
      '<p class="hint">يبحث في العناوين والشروح والشروط والشواهد، ولا يتأثر بالتشكيل.</p></section><div id="results"></div>';
    var q = $("#q");
    q.addEventListener("input", function () { lastQuery = q.value; doSearch(q.value); });
    doSearch(lastQuery);
    if (!lastQuery) setTimeout(function () { q.focus(); }, 60);
  }

  function emptyState(msg) { return '<div class="empty">' + medal("") + msg + "</div>"; }

  function doSearch(q) {
    var out = $("#results");
    var terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) { out.innerHTML = emptyState("اكتب كلمة للبحث في المتن كله"); return; }
    var hits = searchIndex.filter(function (x) { return terms.every(function (t) { return x.all.indexOf(t) !== -1; }); });
    hits.sort(function (a, b) {
      var sa = terms.every(function (t) { return a.title.indexOf(t) !== -1; }) ? 0 : 1;
      var sb = terms.every(function (t) { return b.title.indexOf(t) !== -1; }) ? 0 : 1;
      return sa - sb || a.e.i - b.e.i;
    });
    if (!hits.length) { out.innerHTML = emptyState("لا نتائج، جرّب كلمة أخرى"); return; }
    out.innerHTML = '<p class="count">' + ar(hits.length) + " نتيجة</p>" + hits.slice(0, 80).map(function (x) {
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
      if ((quiz.ch && e.ch.key !== quiz.ch) || e.depth === 0) return;
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
    var pick = pool[Math.floor(Math.random() * pool.length)], e = pick.e, seen = {};
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
    var h = '<section class="illum thin">' + eyebrow("اختبر نفسك بالشواهد") +
      '<div class="qhead"><select class="sel" id="quiz-ch"><option value="">كل الأبواب</option>' +
      chapters.map(function (ch) { return '<option value="' + ch.key + '"' + (quiz.ch === ch.key ? " selected" : "") + ">" + ar(ch.num) + " · " + esc(ch.node.t) + "</option>"; }).join("") +
      '</select><div class="score"><span>الصحيح <b>' + ar(quiz.score) + "</b> من <b>" + ar(quiz.total) + "</b></span><span>متتالية <b>" + ar(quiz.streak) + "</b></span></div></div>";
    if (!c) { view.innerHTML = h + emptyState("لا شواهد في هذا الباب") + "</section>"; bindQuizSelect(); return; }
    h += '<p class="q-ask">هذا الشاهد يُستشهد به على أيّ قاعدة؟</p>' + shahidHTML(c.s, false) +
      '<div class="opts">' + c.opts.map(function (o, i) {
        var cls = "opt";
        if (c.answered) { if (o === c.e) cls += " right"; else if (i === c.picked) cls += " wrong"; }
        return '<button class="' + cls + '" data-ans="' + i + '"' + (c.answered ? " disabled" : "") + '><span class="lt">' + LETTERS[i] + '</span><span class="ot"><small>' +
          esc(o.ch.node.t + (o.parent && o.parent.depth > 0 ? " ‹ " + o.parent.node.t : "")) + "</small>" + esc(o.node.t) + "</span></button>";
      }).join("") + "</div>";
    if (c.answered) {
      h += (c.s.w ? '<div class="sh-w" style="margin-top:.8rem"><b>وجه الشاهد:</b> ' + esc(c.s.w) + "</div>" : "") +
        '<div class="btn-row" style="margin-top:.9rem"><button class="btn ghost sm" data-open="' + c.e.key + '">' + icon("i-scroll") + 'افتح الشرح</button><span style="flex:1"></span><button class="btn sm" data-next-q>السؤال التالي' + icon("i-next") + "</button></div>";
    }
    view.innerHTML = h + "</section>";
    bindQuizSelect();
  }

  function bindQuizSelect() {
    $("#quiz-ch").addEventListener("change", function (ev) { quiz.ch = ev.target.value; newQuestion(); renderQuiz(); });
  }

  function answer(i) {
    var c = quiz.cur;
    if (!c || c.answered) return;
    c.answered = true; c.picked = i;
    quiz.total++;
    if (c.opts[i] === c.e) { quiz.score++; quiz.streak++; toast(quiz.streak > 2 ? "أحسنت، " + ar(quiz.streak) + " على التوالي" : "إجابة صحيحة"); }
    else { quiz.streak = 0; toast("راجع هذه القاعدة"); }
    renderQuiz();
  }

  /* ================= محفوظاتي ================= */

  function renderSaved() {
    var list = Array.from(stars).map(function (k) { return byKey[k]; }).filter(Boolean).sort(function (a, b) { return a.i - b.i; });
    var h = '<section class="illum thin">' + eyebrow("المحفوظات");
    h += list.length ? '<div style="margin-top:.6rem">' + list.map(function (e) {
      return '<button class="res" data-open="' + e.key + '"><div class="rp">' + esc(e.ch.node.t) + '</div><div class="rt">' + esc(e.node.t) + "</div></button>";
    }).join("") + "</div>" : emptyState("اضغط علامة الحفظ في صفحة أي فرع ليظهر هنا");
    h += '</section><section class="illum thin">' + eyebrow("تقدّمك في الأبواب") + '<div style="margin-top:.6rem">';
    chapters.forEach(function (ch) {
      var dn = chDone(ch);
      h += '<button class="res" data-go="#/ch/' + ch.key + '"><div class="rt">' + ar(ch.num) + " · " + esc(ch.node.t) + '</div><div class="pline"><span>' + ar(dn) + " من " + ar(ch.all.length) + "</span>" + hair(pct(dn, ch.all.length)) + "</div></button>";
    });
    h += '</div><div class="btn-row" style="margin-top:.4rem"><button class="btn ghost sm" data-reset>مسح التقدّم</button></div></section>';
    view.innerHTML = h;
  }

  /* ================= الوضع وحجم الخط ================= */

  var FS = [0.9, 1, 1.12, 1.25];
  var FS_NAMES = ["صغير", "متوسط", "كبير", "كبير جدًا"];
  function isDark() { return prefs.theme === "dark" || (!prefs.theme && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches); }
  function syncTheme() {
    $("#btn-theme use").setAttribute("href", isDark() ? "#i-sun" : "#i-moon");
    try { if (window.AndroidBridge) window.AndroidBridge.setDark(isDark()); } catch (e) { /* خارج أندرويد */ }
  }
  function rerender() {
    var y = window.scrollY;
    ORN.apply();
    route();
    window.scrollTo(0, y);
  }
  function toggleTheme() {
    prefs.theme = isDark() ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", prefs.theme);
    savePrefs(); syncTheme(); rerender();
    toast(prefs.theme === "dark" ? "الوضع الليلي اللازوردي" : "وضع الرَّقّ العتيق");
  }
  if (window.matchMedia) {
    var mql = matchMedia("(prefers-color-scheme: dark)");
    var onScheme = function () { if (!prefs.theme) { syncTheme(); rerender(); } };
    if (mql.addEventListener) mql.addEventListener("change", onScheme); else if (mql.addListener) mql.addListener(onScheme);
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
    if (d.tog) { toggled[d.tog] = !isClosed(byKey[d.tog]); refreshView(); return; }
    if (d.expand) { setAll(byKey[current().slice(4)], d.expand === "0"); refreshView(); toast(d.expand === "0" ? "طُويت الفروع" : "فُتحت الفروع كلها"); return; }
    if (d.step) { var e = byKey[sheetKey], n = e && flat[e.i + +d.step]; if (n) openNode(n.key); return; }
    if ("done" in d && sheetKey) {
      if (done.has(sheetKey)) done.delete(sheetKey); else { done.add(sheetKey); toast("أحسنت، بارك الله فيك"); }
      saveDone(); openNode(sheetKey); refreshView(); return;
    }
    if ("star" in d && sheetKey) {
      if (stars.has(sheetKey)) stars.delete(sheetKey); else { stars.add(sheetKey); toast("حُفظ في محفوظاتي"); }
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
    }
  });

  $("#btn-back").addEventListener("click", function () { window.__back(); });
  $("#brand").addEventListener("click", function () {
    if (current() === "/") return;
    var d = (history.state && history.state.d) || 0;
    if (d > 0) history.go(-d); else go("#/", true);
  });
  $("#btn-theme").addEventListener("click", toggleTheme);
  $("#btn-font").addEventListener("click", cycleFont);
  $("#btn-about").addEventListener("click", openAbout);
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") closeSheet(); });

  /* ================= البدء ================= */

  history.replaceState({ d: 0 }, "", location.hash || "#/");
  route();
  syncTheme();
  setTimeout(function () { $("#boot").classList.add("gone"); }, 1300);
})();
