// يُحمَّل قبل ملفات البيانات: يجمع الأبواب ويطبّق الثيم وحجم الخط مبكرًا لتجنّب الوميض.
window.QATR = [];
window.QATR_ADD = function (chapters) {
  for (var i = 0; i < chapters.length; i++) window.QATR.push(chapters[i]);
};

(function () {
  var store = {};
  try { store = JSON.parse(localStorage.getItem("qatr.prefs") || "{}") || {}; } catch (e) {}
  var root = document.documentElement;
  if (store.theme) root.setAttribute("data-theme", store.theme);
  if (store.fs) root.style.setProperty("--fs", store.fs);
})();
