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

    // Practice blocks: try it solo or step-by-step, switchable at any moment.
    initPractice();

    // "You learned this a while ago" refresher nudge.
    initRefresher();

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

  // ---------- Practice blocks ----------
  // A task you can attempt two ways, switching between them whenever you like:
  //   "I'll do it myself" — task only, plus a hint ladder that gets more specific
  //                         each press, and a reveal with the answer.
  //   "Guide me"          — checkable steps, one at a time, with feedback per
  //                         answer. Later steps can quote what you picked earlier
  //                         via {stepN} placeholders, so help fits your actual
  //                         attempt rather than restarting from scratch.
  // Switching never discards work: both tracks stay filled in underneath.
  //
  //   <div class="practice" data-practice data-practice-id="unique-id">
  //     <p class="practice-task"><span class="practice-kicker">Try it</span>Task…</p>
  //     <div class="practice-choose">
  //       <button type="button" class="practice-mode" data-mode="solo">I'll do it myself</button>
  //       <button type="button" class="practice-mode" data-mode="guided">Guide me</button>
  //     </div>
  //     <div class="practice-track" data-track="solo" hidden>
  //       <ol class="hint-list"><li class="hint">Nudge.</li><li class="hint">More specific.</li></ol>
  //       <details class="reveal"><summary>Show me the answer</summary>
  //         <div class="reveal-body">…</div></details>
  //     </div>
  //     <div class="practice-track" data-track="guided" hidden>
  //       <ol class="practice-steps">
  //         <li class="pstep">
  //           <p class="pstep-q">Which transport?</p>
  //           <div class="quiz-options">
  //             <button type="button" class="quiz-opt" data-correct
  //                     data-label="stdio" data-feedback="Right — …">stdio</button>
  //           </div>
  //           <p class="pstep-hint">You picked {step1}, so …</p>
  //         </li>
  //       </ol>
  //     </div>
  //   </div>
  function initPractice() {
    var blocks = Array.prototype.slice.call(document.querySelectorAll(".practice[data-practice]"));
    if (!blocks.length) return;

    var page = location.pathname.split("/").pop() || "index.html";
    var STORE = "aihub-practice-" + page;
    var state = readStore(STORE);

    blocks.forEach(function (block, bi) {
      var id = block.getAttribute("data-practice-id") || ("p" + bi);
      var mine = state[id] || (state[id] = { mode: null, hints: 0, steps: {} });

      var chooser = block.querySelector(".practice-choose");
      var tracks = {};
      block.querySelectorAll(".practice-track").forEach(function (t) {
        tracks[t.getAttribute("data-track")] = t;
      });

      // Labels of the answers picked so far, for {stepN} substitution in hints.
      var picked = {};

      // --- Solo track: laddered hints ---
      var hints = Array.prototype.slice.call(block.querySelectorAll(".hint-list .hint"));
      var hintBtn = null;
      if (hints.length) {
        hints.forEach(function (h) { h.hidden = true; });
        hintBtn = document.createElement("button");
        hintBtn.type = "button";
        hintBtn.className = "hint-btn";
        hints[0].parentNode.parentNode.insertBefore(hintBtn, hints[0].parentNode);
        hintBtn.addEventListener("click", function () {
          revealHints(mine.hints + 1);
          save();
        });
      }
      function revealHints(n) {
        mine.hints = Math.min(n, hints.length);
        hints.forEach(function (h, i) { h.hidden = i >= mine.hints; });
        if (!hintBtn) return;
        var left = hints.length - mine.hints;
        hintBtn.textContent = mine.hints === 0
          ? "Stuck? Get a hint"
          : (left > 0 ? "Still stuck? Next hint (" + left + " left)" : "That's every hint");
        hintBtn.disabled = left === 0;
      }

      // --- Guided track: checkable steps, revealed one at a time ---
      var steps = Array.prototype.slice.call(block.querySelectorAll(".pstep"));
      steps.forEach(function (step, si) {
        var opts = Array.prototype.slice.call(step.querySelectorAll(".quiz-opt"));
        var hint = step.querySelector(".pstep-hint");
        if (hint) { hint.dataset.tpl = hint.textContent; hint.hidden = true; }

        var fb = document.createElement("p");
        fb.className = "quiz-feedback";
        fb.setAttribute("aria-live", "polite");
        fb.hidden = true;
        step.appendChild(fb);

        opts.forEach(function (opt, oi) {
          opt.addEventListener("click", function () {
            if (step.classList.contains("answered")) return;
            mine.steps[si] = oi;
            save();
            gradeStep(si, oi);
            showSteps();
          });
        });

        step._grade = function (oi) {
          var opt = opts[oi];
          if (!opt) return;
          var correct = opt.hasAttribute("data-correct");
          step.classList.add("answered");
          opts.forEach(function (o, i) {
            o.disabled = true;
            if (o.hasAttribute("data-correct")) o.classList.add("is-correct");
            if (i === oi && !correct) o.classList.add("is-wrong");
          });
          // Later hints quote the *correct* choice, not necessarily the one made.
          // A guided walkthrough has to keep building toward the real answer, and
          // grading already revealed it — quoting a wrong pick back ("you picked
          // Streamable HTTP, so there's no URL") would contradict itself.
          var key = opts.filter(function (o) { return o.hasAttribute("data-correct"); })[0] || opt;
          picked[si + 1] = key.getAttribute("data-label") || key.textContent.trim();
          fb.hidden = false;
          fb.className = "quiz-feedback " + (correct ? "right" : "wrong");
          fb.textContent = correct ? "✓ " : "✕ ";
          var note = opt.getAttribute("data-feedback");
          if (note) fb.appendChild(document.createTextNode(note));
        };
        step._showHint = function () {
          if (!hint) return;
          hint.hidden = false;
          // Quote the learner's own earlier answers back at them.
          hint.textContent = hint.dataset.tpl.replace(/\{step(\d+)\}/g, function (m, n) {
            return picked[n] || "your earlier answer";
          });
        };
      });

      function gradeStep(si, oi) { if (steps[si]) steps[si]._grade(oi); }

      // Only show up to the first unanswered step, plus its hint.
      function showSteps() {
        var reached = 0;
        steps.forEach(function (step, si) {
          var done = typeof mine.steps[si] === "number";
          step.hidden = si > reached;
          if (done && si === reached) reached++;
        });
        steps.forEach(function (step, si) {
          if (!step.hidden && !step.classList.contains("answered")) step._showHint();
        });
      }

      // --- Mode switching ---
      function setMode(mode, remember) {
        mine.mode = mode;
        Object.keys(tracks).forEach(function (k) { tracks[k].hidden = k !== mode; });
        if (chooser) chooser.hidden = true;
        block.setAttribute("data-active-mode", mode);
        block.querySelectorAll(".practice-switch").forEach(function (b) {
          b.hidden = b.getAttribute("data-to") === mode;
        });
        if (remember) save();
      }

      // The switch buttons live in both tracks and are always available.
      Object.keys(tracks).forEach(function (k) {
        var other = k === "solo" ? "guided" : "solo";
        if (!tracks[other]) return;
        var sw = document.createElement("button");
        sw.type = "button";
        sw.className = "practice-switch";
        sw.setAttribute("data-to", other);
        sw.textContent = other === "guided"
          ? "Actually, guide me through it →"
          : "I've got it from here →";
        sw.addEventListener("click", function () { setMode(other, true); });
        tracks[k].appendChild(sw);
      });

      if (chooser) {
        chooser.querySelectorAll(".practice-mode").forEach(function (b) {
          b.addEventListener("click", function () { setMode(b.getAttribute("data-mode"), true); });
        });
      }

      // Restore whatever they were doing last time.
      Object.keys(mine.steps).forEach(function (si) { gradeStep(+si, mine.steps[si]); });
      showSteps();
      revealHints(mine.hints || 0);
      if (mine.mode && tracks[mine.mode]) setMode(mine.mode, false);

      function save() { writeStore(STORE, state); }
    });
  }

  // ---------- Spaced-review nudge ----------
  // Stamps the time a page's quizzes were last answered, and on a later visit
  // offers a refresher once the material has had time to fade.
  var REVIEW_AFTER_DAYS = 8;
  function initRefresher() {
    var host = document.querySelector("[data-refresher]");
    var page = location.pathname.split("/").pop() || "index.html";
    var STAMP = "aihub-seen-" + page;
    var quizzes = document.querySelectorAll(".quiz[data-quiz]");
    if (!quizzes.length) return;

    var last = parseInt(localStorage.getItem(STAMP) || "0", 10);
    var answered = Object.keys(readStore("aihub-quiz-" + page)).length;

    // Only nudge someone who actually worked through it before.
    if (host && last && answered) {
      var days = Math.floor((Date.now() - last) / 86400000);
      if (days >= REVIEW_AFTER_DAYS) {
        host.hidden = false;
        host.innerHTML =
          '<p class="refresh-line"><b>You worked through this ' + days + ' days ago.</b> ' +
          'Memory fades on a curve — a quick second pass now is worth far more than rereading it later.</p>';
        var go = document.createElement("button");
        go.type = "button";
        go.className = "btn ghost refresh-go";
        go.textContent = "Clear my answers and re-test me";
        go.addEventListener("click", function () {
          writeStore("aihub-quiz-" + page, {});
          localStorage.setItem(STAMP, String(Date.now()));
          location.reload();
        });
        host.appendChild(go);
      }
    }

    // Re-stamp whenever they answer something, so the clock tracks real use.
    document.addEventListener("click", function (e) {
      if (e.target && e.target.classList && e.target.classList.contains("quiz-opt")) {
        localStorage.setItem(STAMP, String(Date.now()));
      }
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
