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

    // ---- Quizzes + per-page progress tracker ----
    // Reusable markup (works with JS off — options just don't grade):
    //   <div class="quiz" data-quiz data-quiz-id="unique-id">
    //     <p class="quiz-q"><span class="quiz-kicker">Check your knowledge</span>Question?</p>
    //     <div class="quiz-options" role="group">
    //       <button type="button" class="quiz-opt" data-correct>Right answer</button>
    //       <button type="button" class="quiz-opt">Wrong answer</button>
    //     </div>
    //     <p class="quiz-explain">Why the right answer is right.</p>
    //   </div>
    // Optional: add data-feedback="…" to any option for feedback tailored to that
    // specific choice (e.g. naming the exact misconception behind a wrong answer).
    // Add <div class="quiz-progress" data-quiz-progress hidden></div> once per page.
    initQuizzes();

    // Interactive "which one should I use?" picker (progressive enhancement).
    initPickers();

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

  // ---------- Quiz engine ----------
  function initQuizzes() {
    var quizzes = Array.prototype.slice.call(document.querySelectorAll(".quiz[data-quiz]"));
    if (!quizzes.length) return;

    var page = location.pathname.split("/").pop() || "index.html";
    var STORE = "aihub-quiz-" + page;
    var state = readStore(STORE);
    var progress = document.querySelector("[data-quiz-progress]");

    quizzes.forEach(function (quiz, i) {
      var id = quiz.getAttribute("data-quiz-id") || ("q" + i);
      quiz.dataset.resolvedId = id;
      var q = quiz.querySelector(".quiz-q");
      var group = quiz.querySelector(".quiz-options");
      var opts = Array.prototype.slice.call(quiz.querySelectorAll(".quiz-opt"));
      var explain = quiz.querySelector(".quiz-explain");

      // Accessible grouping: label the option group by the question text.
      if (q && group) {
        if (!q.id) q.id = "quizq-" + page.replace(/\W+/g, "") + "-" + i;
        group.setAttribute("role", "group");
        group.setAttribute("aria-labelledby", q.id);
      }

      // Live region for pass/fail feedback.
      var feedback = document.createElement("p");
      feedback.className = "quiz-feedback";
      feedback.setAttribute("aria-live", "polite");
      feedback.hidden = true;
      if (explain) explain.parentNode.insertBefore(feedback, explain);
      else quiz.appendChild(feedback);

      opts.forEach(function (opt, oi) {
        opt.setAttribute("data-opt-index", oi);
        opt.addEventListener("click", function () {
          answer(oi);
        });
      });

      function answer(chosenIndex) {
        if (quiz.classList.contains("answered")) return;
        var correct = opts[chosenIndex].hasAttribute("data-correct");
        markAnswered(chosenIndex, correct);
        state[id] = { chosen: chosenIndex, correct: correct };
        writeStore(STORE, state);
        updateProgress();
      }

      function markAnswered(chosenIndex, correct) {
        quiz.classList.add("answered");
        opts.forEach(function (opt, oi) {
          opt.disabled = true;
          if (opt.hasAttribute("data-correct")) opt.classList.add("is-correct");
          if (oi === chosenIndex && !correct) opt.classList.add("is-wrong");
          if (oi === chosenIndex) opt.setAttribute("aria-pressed", "true");
        });
        feedback.hidden = false;
        feedback.className = "quiz-feedback " + (correct ? "right" : "wrong");
        feedback.textContent = correct ? "✓ Correct!" : "✕ Not quite —";

        // Optional per-answer feedback: data-feedback on the chosen .quiz-opt.
        // Without it, the block behaves exactly as before (generic verdict + .quiz-explain).
        var note = opts[chosenIndex].getAttribute("data-feedback");
        if (note) {
          var span = document.createElement("span");
          span.className = "qf-note";
          span.textContent = " " + note;
          feedback.appendChild(span);
        }
      }

      // Restore a previous answer for returning learners.
      var prev = state[id];
      if (prev && typeof prev.chosen === "number" && opts[prev.chosen]) {
        markAnswered(prev.chosen, prev.correct);
      }
    });

    function updateProgress() {
      if (!progress) return;
      var total = quizzes.length;
      var answered = 0, right = 0;
      quizzes.forEach(function (quiz) {
        var s = state[quiz.dataset.resolvedId];
        if (s) { answered++; if (s.correct) right++; }
      });
      var pct = total ? Math.round((right / total) * 100) : 0;
      progress.querySelector(".qp-count").innerHTML =
        "<b>" + right + " / " + total + "</b> correct" +
        (answered < total ? " · " + (total - answered) + " to go" : "");
      progress.querySelector(".qp-fill").style.width = pct + "%";
      progress.querySelector(".qp-bar").setAttribute("aria-valuenow", String(right));
    }

    // Build the progress widget's inner UI, then wire it up.
    if (progress) {
      progress.hidden = false;
      progress.innerHTML =
        '<span class="qp-label">Your score</span>' +
        '<span class="qp-count" aria-live="polite"></span>' +
        '<span class="qp-bar" role="progressbar" aria-label="Quiz score" ' +
          'aria-valuemin="0" aria-valuemax="' + quizzes.length + '" aria-valuenow="0">' +
          '<span class="qp-fill"></span></span>' +
        '<button type="button" class="quiz-reset">Reset</button>';
      progress.querySelector(".quiz-reset").addEventListener("click", function () {
        state = {};
        writeStore(STORE, state);
        location.reload();
      });
      updateProgress();
    }
  }

  // ---------- Situation picker ----------
  // Enhances a hidden .picker[hidden] block; on choice it reveals a result and
  // highlights the matching static .ifthen[data-mode] (the no-JS fallback).
  var PICKER_ADVICE = {
    autocomplete: { name: "⌨️ Autocomplete", text: "Stay in flow and press Tab. Don't stop to write a prompt for a single line." },
    chat: { name: "💬 Chat / ask", text: "Open a chat and ask it to compare options and explain trade-offs before you write code." },
    review: { name: "🔍 Review & explain", text: "Ask for a map or a second opinion — then confirm the important parts yourself." },
    inline: { name: "✏️ Inline edit", text: "Select the code, describe the change, and eyeball the rewrite in place." },
    agent: { name: "🤖 Agent", text: "Give it the goal — but work on a branch and review the diff before merging." }
  };
  function initPickers() {
    var pickers = Array.prototype.slice.call(document.querySelectorAll(".picker[data-picker]"));
    pickers.forEach(function (picker) {
      picker.hidden = false;
      var choices = Array.prototype.slice.call(picker.querySelectorAll(".picker-choice"));
      var result = picker.querySelector(".picker-result");
      var scope = picker.closest("section") || document;
      choices.forEach(function (choice) {
        choice.setAttribute("aria-pressed", "false");
        choice.addEventListener("click", function () {
          var mode = choice.getAttribute("data-mode");
          choices.forEach(function (c) { c.setAttribute("aria-pressed", c === choice ? "true" : "false"); });
          var info = PICKER_ADVICE[mode];
          if (result && info) {
            result.hidden = false;
            result.innerHTML =
              '<p class="pr-mode">Reach for: ' + info.name + '</p>' +
              '<p class="pr-advice">' + info.text + '</p>';
          }
          scope.querySelectorAll(".ifthen[data-mode]").forEach(function (row) {
            row.classList.toggle("highlight", row.getAttribute("data-mode") === mode);
          });
        });
      });
    });
  }

  // ---------- localStorage helpers (fail safe) ----------
  function readStore(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; }
    catch (e) { return {}; }
  }
  function writeStore(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
})();
