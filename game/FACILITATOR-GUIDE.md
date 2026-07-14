# 🧑‍🏫 Facilitator Guide — Game Design Lab (1 hour)

A minute-by-minute plan for leading the **Digital Game Design (Badge 2)** lab with
girls ages **7–11**. They should already have completed the *intro coding website*
(sequence, loops, conditionals) before this session.

> **Big idea:** every girl designs her own "game that does good," then writes **real
> code** (sequences, loops, conditionals) to give it rules. The site already works out
> of the box, so no one ever stares at a blank page.

---

## Before the session (5 min setup)
- Open **https://juliamsheehan.github.io/** on each laptop.
- Each girl should use the **same laptop + same browser** the whole time (work auto-saves there).
- Optional: have a shared screen/projector for the intro and demos.
- Headphones not needed (no sound required).

---

## Minute-by-minute (≈60 min)

| Time | Step | What you do | What the girls do |
|---|---|---|---|
| **0–5** | Welcome | Hype it up: "Today YOU are the game designer!" Read the welcome screen together. | Click **Let's go!** |
| **5–12** | ① Games for Good | Talk through the examples (doctor sims, pilot training). Ask the **💭 Think** question aloud. | Type a quick idea, then **pick a mission**. |
| **12–18** | ② Coding Tools | Do each **Try it** demo on the projector. Name each concept: sequence, loop, conditional. | Press the three demo buttons. |
| **18–35** | ③ Build the World | Float and help. Remind: **place a hero start 🚩 and a goal 🏁** (both required!). Encourage walls, gems, a key + door, hazards. | Paint their level. This is the creative part — let it be messy and personal! |
| **35–50** | ④ Code the Brain + Test | Walk through the **🎯 Code Quests** on screen. Cheer bug-finding: "That's not a mistake, that's iteration!" | Build the 3 quests, press **Play & Test**, fix, repeat. |
| **50–58** | ⑤ Share & Improve | Have pairs **swap links** and play each other's games. Ask the play-test questions. | Copy link, get feedback, note one improvement, type their name on the certificate. |
| **58–60** | Celebrate | "You earned your badge!" Press the finish button for confetti. 🎉 | Click **I earned my badge!** |

⏱️ **Running short on time?** The World + 3 Code Quests + one play-test is the core.
Sharing and the certificate can be trimmed.

---

## The 3 Code Quests (what "real coding" looks like here)

These appear on screen in the **Brain** tab. Each one has the girls *assemble* a concept:

1. **Score points → a SEQUENCE.** On *"When I touch a [gem]"*, add `Change score by 1` then `Remove what I touched`. (Two blocks, in order = a sequence.)
2. **Make a rule to win → a CONDITIONAL.** Add a `🔀 If` block, e.g. on the goal hat: `If score ≥ 5 then Win`.
3. **Add a timer challenge → a LOOP.** On *"Every 1 second"*, add `Change timer by -1`, then `If the timer hits 0 then Lose`. (The per-second repeat is a loop.)

**To add a block:** click a hat to select it (it glows), then click a block in the palette — *or* drag the block onto the hat. The **✕** removes a block.

---

## Differentiating for ages 7–11
- **Youngest (7–8):** the starter game already scores and wins. Success = redesign the world + complete Quest 1, maybe Quest 2. That's plenty.
- **Oldest (10–11):** challenge them — multiple `If` rules, a `Repeat` block, a key+door puzzle, a tight timer, negative points for hazards.
- **Finished early?** "Make it harder for a friend," then swap links.

---

## Helpful answers to give
- *"My hero won't move!"* → Click the game once so the arrow keys work. Walls and locked doors block on purpose.
- *"My door won't open."* → You need to grab a **key** first — that's a conditional!
- *"My score keeps going up forever."* → You touched the gem again; add **Remove what I touched** so it disappears.
- *"I can't win."* → Make sure something in your Brain says **Win** (e.g. reach goal → Win, or score ≥ N → Win).
- *"It's broken!"* → "Real game makers call that a bug. Let's find it together — that's **iteration** and **perseverance**." (Badge language!)

---

## Badge talking points to weave in
- **Iteration:** "Every time you test and change something, that's an iteration — like improving a cookie recipe."
- **Perseverance:** "Keep going even when it's tricky. That's how real games get made."
- **Games for good:** revisit *their* mission — "Your game helps people learn/care about ____."
- **Service (after the badge):** show family how games aid science/health research, teach a friend the design process, encourage someone who's struggling to persevere.

---

## Tech notes for the helper
- Works offline once loaded (Phaser is bundled). No accounts, no installs.
- Auto-saves to the browser. To **reset a laptop** between groups: open the site, then in the browser clear site data, **or** use a fresh incognito window per girl.
- Shared game links contain the whole game in the URL — long links are normal and fine.
- Trouble? See **README.md ▸ Troubleshooting**.
