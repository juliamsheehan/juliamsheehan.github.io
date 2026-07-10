# Working in this repo

This repo is **two sites in one**:

1. **The AI × Coding learning hub** (the homepage + `index/fundamentals/timeline/news/apply/tools/glossary.html`,
   with shared `assets/style.css` and `assets/hub.js`). A static, beginner-friendly hub for learning AI concepts and
   applying them to coding.
2. **The Game Design Lab** in `game/` — a self-contained Phaser project. Leave it alone unless explicitly asked.

## 👉 For any change to the learning hub, use the `ai-hub-editor` agent

There is a project agent at `.claude/agents/ai-hub-editor.md` that already knows the site's beginner-friendly voice,
its callout / **If → Then** / diagram / glossary / timeline patterns, and the verify-and-publish rules. **Route hub
edits through it** (e.g. *“use the ai-hub-editor to add a section on X”*) so the style and structure stay consistent —
you don't need to re-explain preferences each time.

## Non-negotiables (these apply even without the agent)

- **Voice:** beginner level, plain English, concrete examples, visual grouping (bullets/cards/diagrams), and explicit
  **If → Then** guidance. Reuse the existing `.callout` and `.ifthen` markup — don't invent new patterns.
- **Keep it current:** when updating a topic, check the latest, and bump the “Last reviewed / snapshot” date in the
  footer of any page you edit. The `news.html` page is a periodic manual snapshot.
- **Verify locally:** serve with `python -m http.server 8791` (NOT 8000 — a local NT-ware service grabs it and
  redirects to https://localhost:8443). Confirm the change renders.
- **Publishing needs a PR:** `main` is protected — changes go through a **pull request** the owner merges. This is a
  public GitHub Pages **user site**, so anything merged goes live. **Never push to `main` directly; open a PR and let
  the owner merge.**
