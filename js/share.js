/* ============================================================
   share.js  —  Turn a game into a link friends can play.
   ------------------------------------------------------------
   The whole game (level + brain) is packed into the URL after
   "#play=", so no server or accounts are needed. Open the link
   and the game loads, ready to play.
   ============================================================ */

const Share = {
  // base64 that survives being put in a URL
  encode(state) {
    const json = JSON.stringify(state);
    return btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  },

  decode(str) {
    try {
      let s = str.replace(/-/g, "+").replace(/_/g, "/");
      while (s.length % 4) s += "=";
      return JSON.parse(decodeURIComponent(escape(atob(s))));
    } catch (_) { return null; }
  },

  link(state) {
    const base = location.origin + location.pathname;
    return base + "#play=" + this.encode(state);
  },

  // If the page was opened with a shared game, return it (else null).
  fromHash() {
    const h = location.hash || "";
    const m = h.match(/[#&]play=([^&]+)/);
    if (!m) return null;
    return this.decode(m[1]);
  },

  clearHash() {
    history.replaceState(null, "", location.pathname + location.search);
  }
};

window.Share = Share;
