/* ============================================================
   coder.js  —  The "Brain" block editor (the coding part!)
   ------------------------------------------------------------
   A friendly, Scratch-style editor where girls assemble REAL
   sequences, loops, and conditionals into event "hats".

   • Click a block in the palette to ADD it to the selected hat.
   • OR drag a block onto a hat / into a Repeat or If.
   • Each block has a ✕ to remove it; drag blocks to reorder.

   It edits GAME.state.brain directly and autosaves.
   ============================================================ */

const Coder = {
  root: null,
  scriptsEl: null,
  questsEl: null,
  selectedZoneId: "hat:touchGem",   // where click-to-add drops
  zones: {},                        // zoneId -> the model array it represents

  // The event hats, in display order. label() uses the mission's words.
  hats() {
    const m = GAME.mission();
    return [
      { key: "start",       label: "▶️ When the game starts", hint: "Runs once at the very beginning." },
      { key: "touchGem",    label: "👆 When I touch a " + m.gemName, hint: "Runs every time the hero steps on a " + m.gemName + "." },
      { key: "touchHazard", label: "⚠️ When I touch a " + m.hazardName, hint: "Runs when the hero hits a " + m.hazardName + "." },
      { key: "reachGoal",   label: "🏁 When I reach the " + m.goalName, hint: "Runs when the hero gets to the " + m.goalName + "." },
      { key: "everySecond", label: "⏱️ Every 1 second", hint: "Runs again and again, once a second — a loop!" }
    ];
  },

  // Palette definitions. cat = color class. Container blocks have body:true.
  palette() {
    const m = GAME.mission();
    return [
      { group: "Actions", items: [
        { t: "score",    cat: "score",  label: "Change score by", field: "n", def: 1 },
        { t: "setScore", cat: "score",  label: "Set score to", field: "n", def: 0 },
        { t: "remove",   cat: "action", label: "Remove what I touched" },
        { t: "back",     cat: "action", label: "Go back to start" },
        { t: "say",      cat: "action", label: "Say", field: "text", def: "Yay!" },
        { t: "setTimer", cat: "timer",  label: "Set timer to (sec)", field: "n", def: 30 },
        { t: "timer",    cat: "timer",  label: "Change timer by", field: "n", def: -1 },
        { t: "win",      cat: "win",    label: "Win the game 🏆" },
        { t: "lose",     cat: "lose",   label: "Lose the game 💔" }
      ]},
      { group: "Loops & Ifs", items: [
        { t: "repeat", cat: "loop", label: "🔁 Repeat ___ times", body: true },
        { t: "if",     cat: "if",   label: "🔀 If ___ then", body: true }
      ]}
    ];
  },

  condOptions() {
    const m = GAME.mission();
    return [
      { v: "scoreGte", label: "score ≥", needN: true, def: 5 },
      { v: "scoreEq",  label: "score =", needN: true, def: 5 },
      { v: "allGems",  label: "all " + m.gemNamePlural + " are gone", needN: false },
      { v: "haveKey",  label: "I have a key", needN: false },
      { v: "timerZero", label: "the timer hits 0", needN: false }
    ];
  },

  newBlock(t) {
    const b = { id: newBlockId(), t };
    if (t === "score") b.n = 1;
    else if (t === "setScore") b.n = 0;
    else if (t === "setTimer") b.n = 30;
    else if (t === "timer") b.n = -1;
    else if (t === "say") b.text = "Yay!";
    else if (t === "repeat") { b.n = 3; b.body = []; }
    else if (t === "if") { b.cond = "scoreGte"; b.n = 5; b.body = []; }
    return b;
  },

  // ---- mount into a container element -------------------------------------
  render(containerEl) {
    this.root = containerEl;
    this.root.innerHTML = "";
    this.root.classList.add("coder");

    // palette
    const pal = document.createElement("div");
    pal.className = "palette";
    pal.innerHTML = '<h3>🧩 Blocks <span class="muted">(click a hat, then click a block — or drag it)</span></h3>';
    this.palette().forEach(grp => {
      const g = document.createElement("div");
      g.className = "pal-group";
      g.innerHTML = '<div class="pal-group-title">' + grp.group + "</div>";
      grp.items.forEach(def => {
        const el = document.createElement("div");
        el.className = "pblock cat-" + def.cat;
        el.textContent = def.label.replace("___", def.field === "n" ? "[ ]" : "");
        el.draggable = true;
        el.addEventListener("dragstart", e => {
          this._dragType = def.t;
          e.dataTransfer.setData("text/plain", JSON.stringify({ kind: "new", t: def.t }));
        });
        el.addEventListener("dragend", () => { this._dragType = null; });
        el.addEventListener("click", () => this.clickAdd(def.t));
        g.appendChild(el);
      });
      pal.appendChild(g);
    });
    this.root.appendChild(pal);

    // scripts area
    const right = document.createElement("div");
    right.className = "scripts-wrap";
    this.questsEl = document.createElement("div");
    this.questsEl.className = "quests";
    right.appendChild(this.questsEl);
    this.scriptsEl = document.createElement("div");
    this.scriptsEl.className = "scripts";
    right.appendChild(this.scriptsEl);
    this.root.appendChild(right);

    this.renderScripts();
    this.renderQuests();
  },

  clickAdd(t) {
    const def = this.flatPalette()[t];
    const targetIsBody = this.selectedZoneId && this.selectedZoneId.startsWith("body:");
    if (def.body && targetIsBody) {
      this.flash("You can put a Repeat/If on a hat, but not inside another one. Pick a hat first! 🙂");
      return;
    }
    const arr = this.zones[this.selectedZoneId];
    if (!arr) { this.flash("Tap a hat first, then click a block. 👆"); return; }
    arr.push(this.newBlock(t));
    this.commit();
  },

  flatPalette() {
    const map = {};
    this.palette().forEach(g => g.items.forEach(d => { map[d.t] = d; }));
    return map;
  },

  // ---- render the hats & their blocks -------------------------------------
  renderScripts() {
    this.scriptsEl.innerHTML = "";
    this.zones = {};
    const brain = GAME.state.brain;
    this.hats().forEach(hat => {
      const hatEl = document.createElement("div");
      hatEl.className = "hat";
      const head = document.createElement("div");
      head.className = "hat-head";
      head.innerHTML = '<span class="hat-label">' + hat.label + '</span><span class="hat-hint">' + hat.hint + "</span>";
      hatEl.appendChild(head);

      const zoneId = "hat:" + hat.key;
      const zone = this.makeZone(zoneId, brain[hat.key], false);
      hatEl.appendChild(zone);
      this.scriptsEl.appendChild(hatEl);
    });
    // if the previously selected target was removed, fall back to a hat
    if (!this.zones[this.selectedZoneId]) this.selectedZoneId = "hat:touchGem";
    this.highlightSelected();
  },

  // Create a dropzone bound to a model array.
  makeZone(zoneId, arr, isBody) {
    this.zones[zoneId] = arr;
    const zone = document.createElement("div");
    zone.className = "dropzone" + (isBody ? " body" : "");
    zone.dataset.zone = zoneId;

    zone.addEventListener("click", e => {
      if (e.target === zone) { this.selectedZoneId = zoneId; this.highlightSelected(); }
    });
    zone.addEventListener("dragover", e => {
      const payload = this._dragType;
      const def = payload ? this.flatPalette()[payload] : null;
      if (isBody && def && def.body) return;       // no containers inside containers
      e.preventDefault();
      zone.classList.add("drag-hover");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("drag-hover"));
    zone.addEventListener("drop", e => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove("drag-hover");
      let data;
      try { data = JSON.parse(e.dataTransfer.getData("text/plain")); } catch (_) { return; }
      const idx = this.dropIndex(zone, e.clientY);
      this.handleDrop(data, zoneId, idx);
    });

    if (!arr.length) {
      const ph = document.createElement("div");
      ph.className = "placeholder";
      ph.textContent = isBody ? "drop blocks here" : "Click a block, or drag one here →";
      zone.appendChild(ph);
    } else {
      arr.forEach(b => zone.appendChild(this.makeBlockEl(b)));
    }
    return zone;
  },

  dropIndex(zone, clientY) {
    const blocks = Array.from(zone.children).filter(c => c.classList.contains("block"));
    for (let i = 0; i < blocks.length; i++) {
      const r = blocks[i].getBoundingClientRect();
      if (clientY < r.top + r.height / 2) return i;
    }
    return blocks.length;
  },

  makeBlockEl(b) {
    const def = this.flatPalette()[b.t];
    const el = document.createElement("div");
    el.className = "block cat-" + def.cat;
    el.dataset.id = b.id;
    el.draggable = true;
    el.addEventListener("dragstart", e => {
      e.stopPropagation();
      this._dragType = b.t;
      e.dataTransfer.setData("text/plain", JSON.stringify({ kind: "move", id: b.id }));
    });
    el.addEventListener("dragend", () => { this._dragType = null; });

    const label = document.createElement("span");
    label.className = "block-label";
    this.fillLabel(label, b, def);
    el.appendChild(label);

    const x = document.createElement("button");
    x.className = "block-x";
    x.textContent = "✕";
    x.title = "Remove this block";
    x.addEventListener("click", e => { e.stopPropagation(); this.removeById(b.id); this.commit(); });
    el.appendChild(x);

    if (def.body) {
      const bodyZone = this.makeZone("body:" + b.id, b.body, true);
      el.appendChild(bodyZone);
    }
    return el;
  },

  fillLabel(span, b, def) {
    span.innerHTML = "";
    const addText = t => span.appendChild(document.createTextNode(t));
    const addNum = (val, on) => {
      const inp = document.createElement("input");
      inp.type = "number"; inp.className = "num"; inp.value = val;
      inp.addEventListener("click", e => e.stopPropagation());
      inp.addEventListener("input", () => { on(parseInt(inp.value, 10) || 0); GAME.save(); this.renderQuests(); });
      span.appendChild(inp);
    };

    if (b.t === "repeat") {
      addText("🔁 Repeat ");
      addNum(b.n, v => b.n = Math.max(0, Math.min(50, v)));
      addText(" times");
    } else if (b.t === "if") {
      addText("🔀 If ");
      const sel = document.createElement("select");
      sel.className = "cond";
      sel.addEventListener("click", e => e.stopPropagation());
      this.condOptions().forEach(o => {
        const opt = document.createElement("option");
        opt.value = o.v; opt.textContent = o.label;
        if (o.v === b.cond) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener("change", () => {
        b.cond = sel.value;
        const o = this.condOptions().find(c => c.v === b.cond);
        if (o.needN && b.n == null) b.n = o.def;
        this.commit();
      });
      span.appendChild(sel);
      const o = this.condOptions().find(c => c.v === b.cond);
      if (o && o.needN) { addText(" "); addNum(b.n == null ? o.def : b.n, v => b.n = v); }
      addText(" then:");
    } else if (def.field === "n") {
      addText(def.label + " ");
      addNum(b.n, v => b.n = v);
    } else if (def.field === "text") {
      addText(def.label + " ");
      const inp = document.createElement("input");
      inp.type = "text"; inp.className = "txt"; inp.value = b.text || "";
      inp.addEventListener("click", e => e.stopPropagation());
      inp.addEventListener("input", () => { b.text = inp.value; GAME.save(); });
      span.appendChild(inp);
    } else {
      addText(def.label);
    }
  },

  // ---- drag/drop + tree edits ---------------------------------------------
  handleDrop(data, zoneId, idx) {
    const arr = this.zones[zoneId];
    if (!arr) return;
    const isBody = zoneId.startsWith("body:");
    if (data.kind === "new") {
      const def = this.flatPalette()[data.t];
      if (isBody && def.body) return;
      arr.splice(idx, 0, this.newBlock(data.t));
    } else if (data.kind === "move") {
      const found = this.findById(data.id);
      if (!found) return;
      const def = this.flatPalette()[found.block.t];
      if (isBody && def.body) return;                 // can't nest containers
      if (zoneId === "body:" + data.id) return;       // can't drop into itself
      const sameArr = found.arr === arr;
      found.arr.splice(found.index, 1);
      if (sameArr && found.index < idx) idx--;
      arr.splice(idx, 0, found.block);
    }
    this.selectedZoneId = zoneId;
    this.commit();
  },

  // walk the whole brain to find a block by id
  findById(id) {
    const brain = GAME.state.brain;
    const search = arr => {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].id === id) return { arr, index: i, block: arr[i] };
        if (arr[i].body) { const r = search(arr[i].body); if (r) return r; }
      }
      return null;
    };
    for (const k in brain) { const r = search(brain[k]); if (r) return r; }
    return null;
  },

  removeById(id) {
    const f = this.findById(id);
    if (f) f.arr.splice(f.index, 1);
  },

  // ---- helpers ------------------------------------------------------------
  commit() {
    GAME.save();
    this.renderScripts();
    this.renderQuests();
  },

  highlightSelected() {
    this.scriptsEl.querySelectorAll(".dropzone").forEach(z => {
      z.classList.toggle("selected", z.dataset.zone === this.selectedZoneId);
    });
  },

  flash(msg) { if (GAME.hooks.toast) GAME.hooks.toast(msg); },

  // Re-read everything (e.g., after mission change or load).
  refresh() {
    if (!this.root) return;
    this.render(this.root);
  },

  // ---- Code Quests (live checklist) ---------------------------------------
  hasBlock(arr, pred) {
    if (!arr) return false;
    for (const b of arr) {
      if (pred(b)) return true;
      if (b.body && this.hasBlock(b.body, pred)) return true;
    }
    return false;
  },

  questStatus() {
    const brain = GAME.state.brain;
    const anyHat = pred => Object.keys(brain).some(k => this.hasBlock(brain[k], pred));
    return {
      score: this.hasBlock(brain.touchGem, b => b.t === "score"),
      conditional: anyHat(b => b.t === "if"),
      loop: this.hasBlock(brain.everySecond, b => b.t === "timer") || anyHat(b => b.t === "repeat")
    };
  },

  renderQuests() {
    if (!this.questsEl) return;
    const m = GAME.mission();
    const s = this.questStatus();
    const row = (done, title, desc) =>
      '<div class="quest ' + (done ? "done" : "") + '"><span class="q-check">' +
      (done ? "✅" : "⬜") + '</span><span class="q-text"><b>' + title + "</b> " + desc + "</span></div>";
    this.questsEl.innerHTML =
      '<h3>🎯 Code Quests <span class="muted">(build these — each one is real code!)</span></h3>' +
      row(s.score, "1. Score points (a sequence!)",
        'On the "touch a ' + m.gemName + '" hat, add <i>Change score by 1</i> then <i>Remove what I touched</i>.') +
      row(s.conditional, "2. Make a rule to win (a conditional!)",
        'Add a <i>🔀 If</i> block — e.g. on the goal hat: <i>If score ≥ 5 then Win</i>.') +
      row(s.loop, "3. Add a timer challenge (a loop!)",
        'On <i>Every 1 second</i>, add <i>Change timer by -1</i>, then an <i>If the timer hits 0 then Lose</i>.');
  }
};

window.Coder = Coder;
