/* ============================================================
   game.js  —  The Phaser game (World editor + Play scene)
   ------------------------------------------------------------
   GAME owns the level data ("state") and the Phaser game.
   It switches between two scenes:
     • EditorScene  -> design the WORLD (paint tiles)
     • PlayScene    -> PLAY it. The hero moves with the arrow
                       keys, and the game runs the BRAIN the girl
                       wrote (event blocks with loops & ifs).

   state = {
     missionId, title,
     start: {x, y},
     grid:  { "x,y": "wall"|"gem"|"hazard"|"key"|"door"|"goal" },
     brain: {                       // the code the girl writes
       start:       [blocks],       // ▶ When the game starts
       touchGem:    [blocks],       // 👆 When I touch a [gem]
       touchHazard: [blocks],       // ⚠️ When I touch a [hazard]
       reachGoal:   [blocks],       // 🏁 When I reach the [goal]
       everySecond: [blocks]        // ⏱ Every 1 second
     }
   }

   A block is one of:
     { id, t:"score",  n: 1 }           change score by n
     { id, t:"setScore", n: 0 }
     { id, t:"remove" }                 remove what I touched
     { id, t:"setTimer", n: 30 }
     { id, t:"timer", n: -1 }           change timer by n
     { id, t:"back" }                   go back to start
     { id, t:"win" }
     { id, t:"lose" }
     { id, t:"say", text: "Yay!" }
     { id, t:"repeat", n: 3, body:[blocks] }            🔁 LOOP
     { id, t:"if", cond:"scoreGte", n:5, body:[blocks] } 🔀 IF
   ============================================================ */

let _blockId = 1;
function newBlockId() { return "b" + (_blockId++); }

const GAME = {
  COLS: 13,
  ROWS: 9,
  CELL: 48,
  game: null,
  state: null,
  tool: "wall",       // selected World tool
  hooks: {},          // callbacks set by main.js (toast, hud, win, lose, ...)

  // ---- level data ---------------------------------------------------------
  emptyBrain() {
    return { start: [], touchGem: [], touchHazard: [], reachGoal: [], everySecond: [] };
  },

  blankState(missionId) {
    return {
      missionId: missionId || MISSIONS[0].id,
      title: "",
      start: { x: 1, y: 1 },
      grid: {},
      brain: this.emptyBrain()
    };
  },

  // A friendly starter so nothing is ever a blank page:
  // a small world that is already winnable (reach the goal => win).
  starterState(missionId) {
    const s = this.blankState(missionId);
    s.start = { x: 1, y: 1 };
    s.grid[(this.COLS - 2) + "," + (this.ROWS - 2)] = "goal";
    s.grid["4,1"] = "gem";
    s.grid["7,4"] = "gem";
    s.grid["10,6"] = "gem";
    s.grid["6,1"] = "wall";
    s.grid["6,2"] = "wall";
    s.grid["6,3"] = "wall";
    s.grid["3,5"] = "hazard";
    // starter brain: touching a gem scores + removes it; reaching goal wins.
    s.brain.touchGem = [
      { id: newBlockId(), t: "score", n: 1 },
      { id: newBlockId(), t: "remove" }
    ];
    s.brain.reachGoal = [
      { id: newBlockId(), t: "win" }
    ];
    return s;
  },

  mission() { return getMission(this.state.missionId); },

  fire(name, payload) {
    const fn = this.hooks[name];
    if (typeof fn === "function") fn(payload);
  },

  // ---- create Phaser once -------------------------------------------------
  init(parentId) {
    if (this.game) return;
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: parentId,
      width: this.COLS * this.CELL,
      height: this.ROWS * this.CELL,
      backgroundColor: "#0d3b66",
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
      scene: [BootScene, EditorScene, PlayScene]
    });
  },

  enterPlan() {
    if (!this.game) return;
    this.game.scene.stop("Play");
    this.game.scene.start("Editor");
  },

  enterTest() {
    if (!this.game) return;
    this.game.scene.stop("Editor");
    this.game.scene.start("Play");
  },

  // Ready to play? Needs a start and a goal.
  validate() {
    const hasStart = !!this.state.start;
    let hasGoal = false;
    for (const k in this.state.grid) if (this.state.grid[k] === "goal") hasGoal = true;
    return { ok: hasStart && hasGoal, hasStart, hasGoal };
  },

  countTiles(type) {
    let n = 0;
    for (const k in this.state.grid) if (this.state.grid[k] === type) n++;
    return n;
  },

  save() { if (window.Store) window.Store.save(this.state); }
};

/* ============================================================
   BootScene — empty; scenes are started on demand.
   ============================================================ */
class BootScene extends Phaser.Scene {
  constructor() { super("Boot"); }
  create() {}
}

/* ---- shared drawing helpers ------------------------------- */
const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';

function cellCenter(cx, cy) {
  return { x: cx * GAME.CELL + GAME.CELL / 2, y: cy * GAME.CELL + GAME.CELL / 2 };
}

function drawBoard(scene) {
  const m = GAME.mission();
  const W = GAME.COLS * GAME.CELL, H = GAME.ROWS * GAME.CELL;
  scene.add.rectangle(0, 0, W, H, Phaser.Display.Color.HexStringToColor(m.bg).color).setOrigin(0);
  const tint = Phaser.Display.Color.HexStringToColor(m.bgGrid).color;
  for (let y = 0; y < GAME.ROWS; y++) {
    for (let x = 0; x < GAME.COLS; x++) {
      if ((x + y) % 2 === 0) {
        scene.add.rectangle(x * GAME.CELL, y * GAME.CELL, GAME.CELL, GAME.CELL, tint)
          .setOrigin(0).setAlpha(0.5);
      }
    }
  }
}

function tileFace(type) {
  const m = GAME.mission();
  return { start: m.hero, goal: m.goal, gem: m.gem, key: m.key,
           door: m.door, hazard: m.hazard }[type] || "❓";
}

function makeTile(scene, type, cx, cy) {
  const m = GAME.mission();
  const c = cellCenter(cx, cy);
  const cell = GAME.CELL;
  if (type === "wall") {
    return scene.add.rectangle(c.x, c.y, cell - 4, cell - 4,
      Phaser.Display.Color.HexStringToColor(m.wall).color).setStrokeStyle(3, 0x000000, 0.25);
  }
  return scene.add.text(c.x, c.y, tileFace(type),
    { fontFamily: EMOJI_FONT, fontSize: Math.floor(cell * 0.62) + "px" }).setOrigin(0.5);
}

/* ============================================================
   EditorScene — paint tiles to design the WORLD
   ============================================================ */
class EditorScene extends Phaser.Scene {
  constructor() { super("Editor"); }

  create() {
    GAME.editor = this;
    this.redraw();
    this.input.on("pointerdown", p => this.paintAt(p));
    this.input.on("pointermove", p => { if (p.isDown) this.paintAt(p); });
  }

  pointerToCell(p) {
    const cx = Math.floor(p.worldX / GAME.CELL);
    const cy = Math.floor(p.worldY / GAME.CELL);
    if (cx < 0 || cy < 0 || cx >= GAME.COLS || cy >= GAME.ROWS) return null;
    return { cx, cy };
  }

  paintAt(p) {
    const cell = this.pointerToCell(p);
    if (!cell) return;
    const { cx, cy } = cell;
    const key = cx + "," + cy;
    const tool = GAME.tool;
    const clearStartHere = () => {
      if (GAME.state.start && GAME.state.start.x === cx && GAME.state.start.y === cy) GAME.state.start = null;
    };

    if (tool === "eraser") {
      delete GAME.state.grid[key];
      clearStartHere();
    } else if (tool === "start") {
      GAME.state.start = { x: cx, y: cy };
      delete GAME.state.grid[key];
    } else if (tool === "goal") {
      for (const k in GAME.state.grid) if (GAME.state.grid[k] === "goal") delete GAME.state.grid[k];
      GAME.state.grid[key] = "goal";
      clearStartHere();
    } else {
      GAME.state.grid[key] = tool;
      clearStartHere();
    }
    GAME.save();
    this.redraw();
  }

  redraw() {
    this.children.removeAll();
    drawBoard(this);
    const g = this.add.graphics();
    g.lineStyle(1, 0xffffff, 0.12);
    for (let x = 0; x <= GAME.COLS; x++) g.lineBetween(x * GAME.CELL, 0, x * GAME.CELL, GAME.ROWS * GAME.CELL);
    for (let y = 0; y <= GAME.ROWS; y++) g.lineBetween(0, y * GAME.CELL, GAME.COLS * GAME.CELL, y * GAME.CELL);

    for (const k in GAME.state.grid) {
      const [cx, cy] = k.split(",").map(Number);
      makeTile(this, GAME.state.grid[k], cx, cy);
    }
    if (GAME.state.start) makeTile(this, "start", GAME.state.start.x, GAME.state.start.y);
    if (GAME.hooks.editorChanged) GAME.hooks.editorChanged();
  }

  clearAll() {
    GAME.state.grid = {};
    GAME.state.start = { x: 1, y: 1 };
    GAME.save();
    this.redraw();
  }

  addBorder() {
    for (let x = 0; x < GAME.COLS; x++) {
      GAME.state.grid[x + ",0"] = "wall";
      GAME.state.grid[x + "," + (GAME.ROWS - 1)] = "wall";
    }
    for (let y = 0; y < GAME.ROWS; y++) {
      GAME.state.grid["0," + y] = "wall";
      GAME.state.grid[(GAME.COLS - 1) + "," + y] = "wall";
    }
    GAME.save();
    this.redraw();
  }
}

/* ============================================================
   PlayScene — play & test; runs the authored BRAIN
   ============================================================ */
class PlayScene extends Phaser.Scene {
  constructor() { super("Play"); }

  create() {
    GAME.play = this;
    this.buildModel();
    this.moving = false;
    this.ended = false;          // win OR lose stops the game
    this.touchedKey = null;      // cell of the tile the hero is standing on (for "remove what I touched")

    drawBoard(this);
    this.tileLayer = this.add.container(0, 0);
    this.renderTiles();

    const c = cellCenter(this.heroPos.x, this.heroPos.y);
    this.hero = this.add.text(c.x, c.y, GAME.mission().hero,
      { fontFamily: EMOJI_FONT, fontSize: Math.floor(GAME.CELL * 0.7) + "px" }).setOrigin(0.5).setDepth(10);
    this.idle = this.tweens.add({ targets: this.hero, y: c.y - 3, duration: 700, yoyo: true, repeat: -1, ease: "Sine.inOut" });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,S,D,R");
    this.input.keyboard.addCapture("UP,DOWN,LEFT,RIGHT,W,A,S,D,R,SPACE");
    this.input.keyboard.on("keydown-R", () => this.resetLevel());

    // runtime state
    this.score = 0;
    this.timer = null;            // null = no timer running
    this.keyCount = 0;

    // ▶ When the game starts
    this.run(GAME.state.brain.start);
    // ⏱ Every 1 second (only if used)
    if (GAME.state.brain.everySecond && GAME.state.brain.everySecond.length) {
      this.secondTimer = this.time.addEvent({
        delay: 1000, loop: true,
        callback: () => { if (!this.ended) this.run(GAME.state.brain.everySecond); }
      });
    }
    this.pushHud();
  }

  buildModel() {
    const st = GAME.state;
    this.start = { x: st.start.x, y: st.start.y };
    this.heroPos = { x: st.start.x, y: st.start.y };
    this.tiles = {};                 // cell -> type (mutable copy)
    for (const k in st.grid) this.tiles[k] = st.grid[k];
    this.totalGems = GAME.countTiles("gem");
  }

  renderTiles() {
    this.tileLayer.removeAll(true);
    for (const k in this.tiles) {
      const [cx, cy] = k.split(",").map(Number);
      this.tileLayer.add(makeTile(this, this.tiles[k], cx, cy));
    }
  }

  gemsLeft() {
    let n = 0;
    for (const k in this.tiles) if (this.tiles[k] === "gem") n++;
    return n;
  }

  update() {
    if (this.ended || this.moving) return;
    const c = this.cursors, k = this.wasd;
    if (Phaser.Input.Keyboard.JustDown(c.left) || Phaser.Input.Keyboard.JustDown(k.A)) this.tryMove(-1, 0);
    else if (Phaser.Input.Keyboard.JustDown(c.right) || Phaser.Input.Keyboard.JustDown(k.D)) this.tryMove(1, 0);
    else if (Phaser.Input.Keyboard.JustDown(c.up) || Phaser.Input.Keyboard.JustDown(k.W)) this.tryMove(0, -1);
    else if (Phaser.Input.Keyboard.JustDown(c.down) || Phaser.Input.Keyboard.JustDown(k.S)) this.tryMove(0, 1);
  }

  // called by keyboard AND the on-screen arrow buttons
  press(dir) {
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    if (d) this.tryMove(d[0], d[1]);
  }

  tryMove(dx, dy) {
    if (this.ended || this.moving) return;
    const m = GAME.mission();
    const nx = this.heroPos.x + dx, ny = this.heroPos.y + dy;
    const key = nx + "," + ny;

    if (nx < 0 || ny < 0 || nx >= GAME.COLS || ny >= GAME.ROWS || this.tiles[key] === "wall") {
      this.bump(dx, dy);
      return;
    }
    // door = built-in conditional: opens IF you have a key
    if (this.tiles[key] === "door") {
      if (this.keyCount > 0) {
        this.keyCount--;
        delete this.tiles[key];
        this.renderTiles();
        GAME.fire("toast", "🔑➜🚪 A key opened the " + m.doorName + "! (a conditional!)");
        this.pushHud();
      } else {
        this.bump(dx, dy);
        GAME.fire("toast", "🔒 The " + m.doorName + " is locked — find a " + m.keyName + "! (IF key, THEN open)");
        return;
      }
    }

    this.moving = true;
    const c = cellCenter(nx, ny);
    this.tweens.add({
      targets: this.hero, x: c.x, y: c.y, duration: 110, ease: "Quad.inOut",
      onComplete: () => {
        this.heroPos = { x: nx, y: ny };
        this.moving = false;
        this.onArrive(nx + "," + ny);
      }
    });
  }

  onArrive(key) {
    const m = GAME.mission();
    const type = this.tiles[key];
    this.touchedKey = key;

    // key pickup is built-in
    if (type === "key") {
      delete this.tiles[key];
      this.keyCount++;
      this.renderTiles();
      GAME.fire("toast", "You picked up a " + m.keyName + " 🔑");
      this.pushHud();
      return;
    }

    // fire the brain events the girl wrote
    if (type === "gem") this.run(GAME.state.brain.touchGem);
    else if (type === "hazard") this.run(GAME.state.brain.touchHazard);
    else if (type === "goal") this.run(GAME.state.brain.reachGoal);

    this.pushHud();
  }

  // -------- the interpreter: runs a stack of blocks ----------
  run(blocks) {
    if (!blocks || this.ended) return;
    for (const b of blocks) {
      if (this.ended) break;
      this.runBlock(b);
    }
  }

  runBlock(b) {
    const m = GAME.mission();
    switch (b.t) {
      case "score":    this.score += (b.n || 0); this.scorePop(); break;
      case "setScore": this.score = (b.n || 0); break;
      case "remove":
        if (this.touchedKey && this.tiles[this.touchedKey]) {
          delete this.tiles[this.touchedKey];
          this.touchedKey = null;
          this.renderTiles();
          this.pop();
        }
        break;
      case "setTimer": this.timer = (b.n || 0); break;
      case "timer":    if (this.timer === null) this.timer = 0; this.timer += (b.n || 0); break;
      case "back":     this.sendToStart(); break;
      case "win":      this.endGame(true); break;
      case "lose":     this.endGame(false); break;
      case "say":      if (b.text) GAME.fire("toast", b.text); break;
      case "repeat": {
        const n = Math.max(0, Math.min(50, b.n || 0));
        for (let i = 0; i < n && !this.ended; i++) this.run(b.body);
        break;
      }
      case "if":
        if (this.evalCond(b)) this.run(b.body);
        break;
    }
    this.pushHud();
  }

  evalCond(b) {
    switch (b.cond) {
      case "scoreGte": return this.score >= (b.n || 0);
      case "scoreEq":  return this.score === (b.n || 0);
      case "timerZero": return this.timer !== null && this.timer <= 0;
      case "haveKey":  return this.keyCount > 0;
      case "allGems":  return this.gemsLeft() === 0;
      default: return false;
    }
  }

  // -------- effects & feedback ----------
  sendToStart() {
    const c = cellCenter(this.start.x, this.start.y);
    this.heroPos = { x: this.start.x, y: this.start.y };
    this.hero.setPosition(c.x, c.y);
    this.tweens.add({ targets: this.hero, angle: 12, duration: 60, yoyo: true, repeat: 2,
      onComplete: () => this.hero.setAngle(0) });
  }

  bump(dx, dy) {
    const cur = cellCenter(this.heroPos.x, this.heroPos.y);
    this.tweens.add({ targets: this.hero, x: cur.x + dx * 6, y: cur.y + dy * 6, duration: 70, yoyo: true });
  }

  pop() { this.tweens.add({ targets: this.hero, scale: 1.25, duration: 90, yoyo: true }); }
  scorePop() { this.pop(); }

  endGame(won) {
    if (this.ended) return;
    this.ended = true;
    if (this.secondTimer) this.secondTimer.remove();
    if (won) {
      for (let i = 0; i < 26; i++) {
        const e = ["🎉", "⭐", "✨", "🎊", "💖"][i % 5];
        const t = this.add.text(Phaser.Math.Between(20, GAME.COLS * GAME.CELL - 20), -20, e,
          { fontFamily: EMOJI_FONT, fontSize: "28px" }).setDepth(20);
        this.tweens.add({ targets: t, y: GAME.ROWS * GAME.CELL + 30, angle: Phaser.Math.Between(-180, 180),
          duration: Phaser.Math.Between(1200, 2400), delay: Phaser.Math.Between(0, 600), ease: "Quad.in" });
      }
      GAME.fire("win", { score: this.score });
    } else {
      this.hero.setTint && this.hero.setTint(0x888888);
      GAME.fire("lose", { score: this.score });
    }
  }

  resetLevel() { if (this.scene.isActive()) this.scene.restart(); }

  pushHud() {
    GAME.fire("hud", {
      score: this.score,
      timer: this.timer,
      keys: this.keyCount,
      gemsLeft: this.gemsLeft(),
      totalGems: this.totalGems
    });
  }
}

window.GAME = GAME;
window.newBlockId = newBlockId;
