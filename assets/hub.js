/* ============================================================
   hub.js — shared behavior for the AI × Coding hub.
   Theme toggle, mobile nav, active-link highlight, glossary search.
   No dependencies, no build step.
   ============================================================ */
(function () {
  // ---- Theme (light/dark), remembered across visits ----
  var KEY = "aihub-theme";
  var root = document.documentElement;
  var saved = localStorage.getItem(KEY);
  if (saved === "dark" || saved === "light") {
    root.setAttribute("data-theme", saved);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    root.setAttribute("data-theme", "dark");
  }
  function syncToggleIcon() {
    var btn = document.querySelector(".theme-toggle");
    if (btn) btn.textContent = root.getAttribute("data-theme") === "dark" ? "☀️" : "🌙";
  }

  document.addEventListener("DOMContentLoaded", function () {
    syncToggleIcon();

    // Theme button
    var themeBtn = document.querySelector(".theme-toggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        localStorage.setItem(KEY, next);
        syncToggleIcon();
      });
    }

    // Mobile nav
    var navBtn = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".site-nav");
    if (navBtn && nav) {
      navBtn.addEventListener("click", function () {
        var open = nav.classList.toggle("open");
        navBtn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    // Highlight the current page's nav link
    var here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".site-nav a").forEach(function (a) {
      var target = a.getAttribute("href");
      if (target === here || (here === "index.html" && target === "index.html")) {
        a.classList.add("active");
      }
    });

    // Glossary search filter (only runs if a #glossary-search box exists)
    var search = document.getElementById("glossary-search");
    if (search) {
      var terms = Array.prototype.slice.call(document.querySelectorAll(".term"));
      var count = document.getElementById("glossary-count");
      search.addEventListener("input", function () {
        var q = search.value.trim().toLowerCase();
        var shown = 0;
        terms.forEach(function (t) {
          var match = t.textContent.toLowerCase().indexOf(q) !== -1;
          t.classList.toggle("hidden", !match);
          if (match) shown++;
        });
        if (count) count.textContent = shown + (shown === 1 ? " term" : " terms");
      });
    }
  });
})();
