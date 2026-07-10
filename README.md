# 🤖 AI × Coding — a beginner's learning hub

A friendly, up-to-date home base for understanding **AI concepts** and applying them
to **real coding** — for work and personal projects. Built as a static site so it loads
instantly and needs no server or accounts.

🔗 **Live site:** https://juliamsheehan.github.io/

---

## What's here

| Page | What it covers |
| --- | --- |
| **Home** (`index.html`) | The "AI in one minute" mental model + a map of the site. |
| **Fundamentals** (`fundamentals.html`) | Beginner explanations of LLMs, tokens, prompts, context windows, temperature, training/fine-tuning, hallucination, multimodal, embeddings, RAG, tool use, reasoning models, and agents — with diagrams. |
| **Timeline** (`timeline.html`) | The milestones that mattered, from the 2017 Transformer to ChatGPT to the rise of agents. |
| **Apply to Coding** (`apply.html`) | The 5 ways to use AI while coding, *If → Then* guides for picking one, prompt recipes, verification habits, and work-vs-personal guidance. |
| **Tools & Workflows** (`tools.html`) | Categories of AI coding tools, a comparison table, what MCP is, and workflow patterns that keep quality high. |
| **Glossary & Links** (`glossary.html`) | Every term defined in one line (with live search) plus trustworthy places to keep learning. |
| **Game Design Lab** (`game/`) | The interactive coding lab that used to be the homepage — still fully working. |

The writing uses a consistent set of callouts: **💡 In plain English**, **🔍 Example**,
**✅ Tip**, **⚠️ Watch out**, and green/amber **If → Then** cards for "when do I use this?"

---

## How it works (tech)

- **Static site** — plain HTML/CSS/JS, no build step, no dependencies.
- `assets/style.css` — the shared design system (light + dark themes).
- `assets/hub.js` — shared behavior: theme toggle (remembered), mobile nav, active-link
  highlighting, and the glossary search filter.
- Diagrams are **inline SVG** that adapt to the current theme — no image files.
- The **Game Design Lab** lives in `game/` (its own HTML/CSS/JS + a bundled copy of Phaser)
  and is unchanged apart from its folder.

```
index.html          – Home / overview
fundamentals.html   – core concepts + diagrams
timeline.html       – major updates over time
apply.html          – applying AI to coding
tools.html          – tools & workflow patterns
glossary.html       – searchable glossary + links
assets/style.css    – shared styles (themes)
assets/hub.js       – shared behavior
game/               – the Game Design Lab (was the old homepage)
```

---

## Editing & keeping it current

It's designed to be easy to grow:

- **Add a term** to the glossary: copy one `<div class="term">…</div>` block in
  `glossary.html`. (The count updates automatically as you search.)
- **Add a timeline entry**: copy a `.tl-item` block in `timeline.html` (use `.tl-item big`
  for era-defining moments).
- **Add a concept or If→Then card**: reuse the `.callout` and `.ifthen` markup — see any
  existing page for the pattern.
- Update the "Last reviewed" date in each page's footer when you make a pass.

Test locally with a tiny server (some things don't work from `file://`):

```bash
python -m http.server 8000
# then open http://localhost:8000
```

---

## Publishing

This is a **user site** (`juliamsheehan.github.io`), so committing to `main` publishes at
the root URL. In GitHub: **Settings ▸ Pages ▸ Source = "Deploy from a branch", Branch =
`main` / `(root)`**. Wait ~1 minute after pushing, then reload the live site.
