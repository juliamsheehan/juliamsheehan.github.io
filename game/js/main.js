/* ============================================================
   main.js  —  Navigation + wiring for the whole experience.
   ------------------------------------------------------------
   • Moves between the 5 step-screens and the 3 build tabs.
   • Builds the mission picker, the World toolbox, the HUD,
     the Step-2 mini demos, sharing and the certificate.
   • Connects GAME's callbacks (toast / hud / win / lose).
   ============================================================ */

(function () {
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  let currentTab = "world";

  // ---------- screen / tab navigation ----------
  function showScreen(id, tab) {
    $$(".screen").forEach(s => s.classList.toggle("active", s.id === "screen-" + id));
    if (id === "build") showTab(tab || currentTab);
    if (id === "step5") onEnterShare();
    updateSteps(id, tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateSteps(id, tab) {
    let active = null;
    if (id === "step1") active = 0;
    else if (id === "step2") active = 1;
    else if (id === "build") active = (tab === "play") ? 3 : 2;
    else if (id === "step5") active = 4;
    $$("#steps .step").forEach((b, i) => b.classList.toggle("on", i === active));
  }

  function moveCanvas(slotId) {
    const c = GAME.game && GAME.game.canvas;
    if (!c) return;
    const slot = document.getElementById(slotId);
    if (slot && c.parentNode !== slot) slot.appendChild(c);
    if (GAME.game.scale) GAME.game.scale.refresh();
  }

  function showTab(tab) {
    currentTab = tab;
    $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
    $$(".tabpanel").forEach(p => p.classList.toggle("active", p.id === "panel-" + tab));

    if (tab === "world") {
      GAME.enterPlan();
      moveCanvas("world-stage-slot");
      refreshWorldUI();
    } else if (tab === "brain") {
      Coder.render($("#coder-root"));
    } else if (tab === "play") {
      const v = GAME.validate();
      if (!v.ok) {
        toast(!v.hasStart ? "Place a hero start first! 🚩" : "Add a goal to reach! 🏁");
        showTab("world");
        return;
      }
      hideResult();
      GAME.enterTest();
      moveCanvas("play-stage-slot");
      renderCoach();
    }
    updateSteps("build", tab);
  }

  // ---------- toast ----------
  let toastTimer = null;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  // ---------- HUD + coach ----------
  function renderHud(s) {
    const m = GAME.mission();
    let html = '<div class="chip score">⭐ Score: <b>' + s.score + "</b></div>";
    if (s.totalGems > 0) html += '<div class="chip">' + m.gem + " " + s.gemsLeft + " / " + s.totalGems + " left</div>";
    if (s.keys > 0) html += '<div class="chip">🔑 ' + s.keys + "</div>";
    if (s.timer !== null && s.timer !== undefined)
      html += '<div class="chip timer' + (s.timer <= 5 ? " low" : "") + '">⏱️ ' + Math.max(0, s.timer) + "</div>";
    $("#hud").innerHTML = html;
  }

  function renderCoach() {
    const m = GAME.mission();
    $("#coach").innerHTML =
      "<h4>🦊 Watch for your code!</h4>" +
      "<p>➡️ Each arrow press is a <b>sequence</b> step.</p>" +
      "<p>🔁 A countdown timer is a <b>loop</b>.</p>" +
      "<p>🔀 A locked " + m.doorName + " or a scoring rule is a <b>conditional</b>.</p>" +
      "<p class='muted'>Not working right? Press <b>← Fix my code</b> — that's iteration!</p>";
  }

  // ---------- win / lose ----------
  function showResult(won, info) {
    const m = GAME.mission();
    const card = $("#result-card");
    if (won) {
      card.className = "result-card win";
      card.innerHTML = "<div class='big-emoji'>🏆</div><h2>You did it!</h2>" +
        "<p>" + m.winMsg + "</p><p class='score-line'>Final score: <b>" + info.score + "</b></p>" +
        resultButtons();
    } else {
      card.className = "result-card lose";
      card.innerHTML = "<div class='big-emoji'>💪</div><h2>Try again!</h2>" +
        "<p>Game over — but real designers <b>persevere</b>. Tweak your world or your code and go again!</p>" +
        resultButtons();
    }
    $("#result-overlay").classList.add("show");
    wireResultButtons();
  }
  function resultButtons() {
    return "<div class='result-btns'>" +
      "<button class='mini-btn' data-act='again'>🔄 Play again</button>" +
      "<button class='ghost' data-act='code'>🧠 Edit code</button>" +
      "<button class='ghost' data-act='world'>🎨 Edit world</button>" +
      "<button class='big-btn' data-act='share'>🔗 Share</button></div>";
  }
  function wireResultButtons() {
    $$("#result-card [data-act]").forEach(b => b.onclick = () => {
      const a = b.dataset.act;
      hideResult();
      if (a === "again") { GAME.enterTest(); }
      else if (a === "code") showTab("brain");
      else if (a === "world") showTab("world");
      else if (a === "share") showScreen("step5");
    });
  }
  function hideResult() { $("#result-overlay").classList.remove("show"); }

  // ---------- mission cards ----------
  function missionCardHtml(m, selected) {
    return '<button class="mission' + (selected ? " sel" : "") + '" data-m="' + m.id + '" ' +
      'style="--accent:' + m.accent + ';--bg:' + m.bg + '">' +
      '<div class="m-emoji">' + m.emoji + "</div>" +
      '<div class="m-name">' + m.name + "</div>" +
      '<div class="m-good">' + m.forGood + "</div></button>";
  }
  function renderMissionCards() {
    const cur = GAME.state.missionId;
    const html = MISSIONS.map(m => missionCardHtml(m, m.id === cur)).join("");
    $("#mission-cards").innerHTML = html;
    $("#mission-cards-modal").innerHTML = html;
    $$("[data-m]").forEach(b => b.onclick = () => selectMission(b.dataset.m));
  }
  function selectMission(id) {
    GAME.state.missionId = id;
    GAME.save();
    renderMissionCards();
    refreshWorldUI();
    if (currentTab === "world") GAME.enterPlan();
    if ($("#coder-root").children.length) Coder.refresh();
    $("#mission-modal").classList.remove("show");
    toast(getMission(id).emoji + " Mission: " + getMission(id).name);
  }

  // ---------- World toolbox ----------
  function toolLabel(type) {
    const m = GAME.mission();
    return {
      start: { e: m.hero, t: "Hero start" },
      goal: { e: m.goal, t: m.goalName },
      wall: { e: "⬛", t: "Wall" },
      gem: { e: m.gem, t: m.gemName },
      hazard: { e: m.hazard, t: m.hazardName },
      key: { e: m.key, t: m.keyName },
      door: { e: m.door, t: m.doorName },
      eraser: { e: "🩹", t: "Eraser" }
    }[type];
  }
  function renderToolbox() {
    const tools = TILE_TYPES.concat(["eraser"]);
    $("#toolbox").innerHTML = "<h4>🧰 Tools</h4>" + tools.map(t => {
      const l = toolLabel(t);
      return '<button class="tool' + (GAME.tool === t ? " sel" : "") + '" data-tool="' + t + '">' +
        '<span class="t-e">' + l.e + "</span> " + l.t + "</button>";
    }).join("");
    $$("[data-tool]").forEach(b => b.onclick = () => {
      GAME.tool = b.dataset.tool;
      $$("[data-tool]").forEach(x => x.classList.toggle("sel", x === b));
    });
  }
  function refreshWorldUI() {
    renderToolbox();
    const m = GAME.mission();
    $("#mission-chip").innerHTML = m.emoji + " " + m.name;
    checkWorldWarn();
  }
  function checkWorldWarn() {
    const v = GAME.validate();
    let msg = "";
    if (!v.hasStart) msg = "⚠️ Add a hero start (🚩).";
    else if (!v.hasGoal) msg = "⚠️ Add a goal to reach (🏁).";
    $("#world-warn").textContent = msg;
  }

  // ---------- Step 2 mini-demos ----------
  function buildTrack(el, n) {
    el.innerHTML = "";
    for (let i = 0; i < n; i++) {
      const c = document.createElement("span");
      c.className = "demo-cell";
      el.appendChild(c);
    }
  }
  function runStepper(el, steps) {
    const cells = Array.from(el.children);
    cells.forEach(c => (c.textContent = ""));
    let pos = 0;
    cells[0].textContent = "🐢";
    let i = 0;
    const tick = () => {
      if (i >= steps) return;
      cells[pos].textContent = "·";
      pos = Math.min(pos + 1, cells.length - 1);
      cells[pos].textContent = "🐢";
      i++;
      setTimeout(tick, 420);
    };
    setTimeout(tick, 350);
  }
  function setupDemos() {
    buildTrack($("#seq-track"), 4);
    buildTrack($("#loop-track"), 5);
    $("#seq-btn").onclick = () => runStepper($("#seq-track"), 3);
    $("#loop-btn").onclick = () => runStepper($("#loop-track"), 4);
    let hasKey = false;
    $("#cond-btn").onclick = () => {
      hasKey = !hasKey;
      $("#cond-key").style.opacity = hasKey ? "0.25" : "1";
      $("#cond-door").textContent = hasKey ? "🔓" : "🚪";
      $("#cond-btn").textContent = hasKey ? "Put the key back" : "Pick up the key 🔑";
      toast(hasKey ? "IF you have the key → THEN the door opens! 🔓" : "No key → the door stays locked. 🔒");
    };
  }

  // ---------- Share + certificate ----------
  function onEnterShare() {
    $("#share-link").value = Share.link(GAME.state);
    updateCert();
  }
  function updateCert() {
    const m = GAME.mission();
    $("#cert-game").textContent = GAME.state.title || "My Game";
    $("#cert-name").textContent = GAME.state.designer || "a Game Designer";
    $("#cert-mission").textContent = m.emoji + " " + m.name + " — " + m.forGood;
  }

  // ---------- field bindings ----------
  function bindFields() {
    const gn = $("#game-name");
    gn.value = GAME.state.title || "";
    gn.addEventListener("input", () => { GAME.state.title = gn.value; GAME.save(); });

    const rf = $("#reflection");
    rf.value = GAME.state.reflection || "";
    rf.addEventListener("input", () => { GAME.state.reflection = rf.value; GAME.save(); });

    const imp = $("#improve-note");
    imp.value = GAME.state.improve || "";
    imp.addEventListener("input", () => { GAME.state.improve = imp.value; GAME.save(); });

    const dn = $("#designer-name");
    dn.value = GAME.state.designer || "";
    dn.addEventListener("input", () => { GAME.state.designer = dn.value; GAME.save(); updateCert(); });
  }

  // ---------- wire everything ----------
  function wire() {
    // nav buttons (data-go = screen; may also carry data-tab)
    $$("[data-go]").forEach(b => b.addEventListener("click", () => showScreen(b.dataset.go, b.dataset.tab)));
    // build tabs + any in-page tab links
    $$(".tab").forEach(t => t.addEventListener("click", () => showTab(t.dataset.tab)));
    $$("[data-tab]:not(.tab):not([data-go])").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));

    // World controls
    $("#change-mission").onclick = () => $("#mission-modal").classList.add("show");
    $("#mission-close").onclick = () => $("#mission-modal").classList.remove("show");
    $("#add-border").onclick = () => GAME.editor && GAME.editor.addBorder();
    $("#clear-world").onclick = () => {
      if (confirm("Clear your whole world? This can't be undone.")) GAME.editor && GAME.editor.clearAll();
    };

    // D-pad + restart
    $$("[data-dir]").forEach(b => b.addEventListener("click", () => GAME.play && GAME.play.press(b.dataset.dir)));
    $("#restart-btn").onclick = () => GAME.play && GAME.play.resetLevel();

    // Share + cert
    $("#copy-link").onclick = () => {
      $("#share-link").select();
      navigator.clipboard && navigator.clipboard.writeText($("#share-link").value);
      toast("Link copied! Paste it to a friend. 🔗");
    };
    $("#print-cert").onclick = () => window.print();
    $("#finish-btn").onclick = () => {
      toast("🎉 You earned your Digital Game Design badge! Amazing work!");
      burst();
    };

    setupDemos();
    bindFields();
  }

  // confetti burst on finish
  function burst() {
    for (let i = 0; i < 40; i++) {
      const d = document.createElement("div");
      d.className = "confetti";
      d.textContent = ["🎉", "⭐", "✨", "🎊", "💖", "🏅"][i % 6];
      d.style.left = Math.random() * 100 + "vw";
      d.style.animationDelay = (Math.random() * 0.6) + "s";
      d.style.fontSize = (16 + Math.random() * 22) + "px";
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 3000);
    }
  }

  // ---------- boot ----------
  function start() {
    // 1) figure out the starting state
    const shared = Share.fromHash();
    let startTab = null, startScreen = "welcome";
    if (shared && shared.grid && shared.start) {
      GAME.state = shared;
      GAME.state.brain = GAME.state.brain || GAME.emptyBrain();
      startScreen = "build"; startTab = "play";
    } else {
      GAME.state = Store.load() || GAME.starterState("ocean");
      if (!GAME.state.brain) GAME.state.brain = GAME.emptyBrain();
    }

    // 2) hooks from the game engine
    GAME.hooks.toast = toast;
    GAME.hooks.hud = renderHud;
    GAME.hooks.win = info => showResult(true, info);
    GAME.hooks.lose = info => showResult(false, info);
    GAME.hooks.editorChanged = checkWorldWarn;

    // 3) build UI
    renderMissionCards();
    refreshWorldUI();
    wire();

    // 4) create Phaser, then show the start screen
    GAME.init("world-stage-slot");
    const go = () => {
      moveCanvas("world-stage-slot");
      showScreen(startScreen, startTab);
      if (shared) toast("🎮 Playing a shared game! Move with the arrow keys.");
    };
    if (GAME.game.isBooted) go();
    else GAME.game.events.once("ready", go);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
