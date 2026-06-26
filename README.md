# 🎮 Game Design Lab

An interactive, browser-based lab that walks girls (ages 7–11) through the
**Digital Game Design — Badge 2** experience in about **one hour**. Each girl
**plans, builds, codes, tests, and shares her own "game that does good."**

🔗 **Live site:** https://juliamsheehan.github.io/

---

## What the girls do

The activity follows the five badge steps:

1. **Games for Good** – discover how games help people, and pick a "for good" mission.
2. **Coding Tools** – a quick, hands-on recap of **sequence, loops, and conditionals**.
3. **Plan & Build (the World)** – design a level: place the hero, walls, collectibles, hazards, a goal, and a key + door.
4. **Code the Brain & Test** – assemble **real blocks** into event "hats" to give the game its rules:
   - **Sequence** – a stack of blocks under an event.
   - **Loop** – a countdown timer (🔁 *Every 1 second*) or the **Repeat** block.
   - **Conditional** – the **If** block (e.g. *If score ≥ 5 then Win*) and the locked door (opens only **if** you have a key).
   Then play with the **arrow keys**, find bugs, and iterate.
5. **Share & Improve** – get a link friends can play, reflect on improvements, and print a badge certificate.

Five "for good" missions are included (Ocean Cleanup, Community Garden, Pet Rescue,
Space Station Supply, Helping Hands Hospital). Every game ships **already working**,
so customizing is additive — perfect for a mixed-age group.

> 🧑‍🏫 Running this with a troop? See **[FACILITATOR-GUIDE.md](FACILITATOR-GUIDE.md)** for the minute-by-minute plan.

---

## How it works (tech)

- **Static site** — pure HTML/CSS/JS, no build step, no server, no accounts.
- **[Phaser 3](https://phaser.io/)** powers the level editor and gameplay. It's **bundled locally**
  (`lib/phaser.min.js`), so the lab works even on slow or filtered school/library wifi.
- Visuals are **emoji + colored shapes** drawn in code — no image files to download, instant load.
- Work auto-saves to the browser (`localStorage`); shared games are packed into the URL after `#play=`.

```
index.html
css/styles.css
js/themes.js   – the five "for good" mission packs
js/store.js    – auto-save to localStorage
js/share.js    – pack/unpack a game into a shareable link
js/game.js     – Phaser: World editor + Play scene + the "Brain" interpreter
js/coder.js    – the drag/click block editor (sequences, loops, conditionals)
js/main.js     – navigation, mission picker, HUD, certificate, wiring
lib/phaser.min.js
```

---

## Publishing to GitHub Pages

This repo is a **user site** (`juliamsheehan.github.io`), so its contents publish at the root URL.

### Option A — drag-and-drop in the browser (easiest)
1. Go to **https://github.com/juliamsheehan/juliamsheehan.github.io**.
2. Click **Add file ▸ Upload files**.
3. Drag in **everything inside this folder** (`index.html`, the `css/`, `js/`, and `lib/` folders, and the `.md` files). Keep the folder structure.
4. Scroll down, write a short message like *"Add Game Design Lab"*, and click **Commit changes**.
5. Make sure Pages is on: **Settings ▸ Pages ▸ Build and deployment ▸ Source = "Deploy from a branch", Branch = `main` / `(root)`**, then **Save**.
6. Wait ~1 minute, then open **https://juliamsheehan.github.io/**. 🎉

### Option B — git command line
```bash
git clone https://github.com/juliamsheehan/juliamsheehan.github.io.git
cd juliamsheehan.github.io
# copy the contents of this folder into the repo, then:
git add .
git commit -m "Add Game Design Lab"
git push origin main
```
Then enable Pages as in step 5 above.

> **Tip:** test it first by double-clicking `index.html`… *almost* works, but browsers
> block some features on `file://`. Better: run a tiny local server —
> `python -m http.server 8000` in this folder, then open `http://localhost:8000`.

---

## Troubleshooting
- **Blank page / "Phaser is not defined":** make sure the `lib/` and `js/` folders uploaded with their files intact.
- **Arrow keys scroll the page instead of moving the hero:** click once on the game first so it has focus.
- **A girl lost her work:** it auto-saves per browser — same laptop + same browser will restore it. Different laptop won't.
- **Reset everything on a shared laptop:** clear the site's storage, or open a new private/incognito window.
