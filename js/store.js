/* ============================================================
   store.js  —  Auto-save the girl's work in the browser.
   ------------------------------------------------------------
   Saves to localStorage so a refresh (or accidental tab close)
   never loses her game during the hour.
   ============================================================ */

const Store = {
  KEY: "gs-game-design-badge-v1",

  save(state) {
    try { localStorage.setItem(this.KEY, JSON.stringify(state)); } catch (_) {}
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) { return null; }
  },

  clear() {
    try { localStorage.removeItem(this.KEY); } catch (_) {}
  }
};

window.Store = Store;
