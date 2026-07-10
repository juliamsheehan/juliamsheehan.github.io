/* ============================================================
   themes.js  —  "Make-a-Difference" mission packs
   ------------------------------------------------------------
   Each mission is a game that does GOOD. A girl picks one, then
   designs and plays her own level. Everything here is plain data
   (emoji + colors), so the game loads instantly with no image
   files to download — great for school/library wifi.

   TILE TYPES used everywhere in the game:
     start  - where the hero begins   (exactly 1)
     goal   - reach this to win        (exactly 1)
     wall   - blocks the path          (sequence)
     gem    - collect them ALL to win  (loop)
     friend - a bonus pal to help      (extra, not required)
     key    - pick up to open gates    (conditional)
     gate   - locked until you have a key (conditional)
     hazard - sends the hero back to start (gentle "oops")
   ============================================================ */

const MISSIONS = [
  {
    id: "ocean",
    name: "Ocean Cleanup",
    emoji: "🌊",
    forGood: "Help keep the ocean clean and safe for sea animals!",
    intro: "Trash hurts sea creatures. Your hero swims around, scoops up every piece of trash, and drops it in the recycling bin.",
    // colors
    bg: "#0d3b66",
    bgGrid: "#11487c",
    wall: "#0a2c4d",
    accent: "#3fc1c9",
    // tile faces
    hero: "🐢",
    gem: "🥤",
    gemName: "piece of trash",
    gemNamePlural: "trash",
    friend: "🐠",
    friendName: "fish friend",
    goal: "♻️",
    goalName: "recycling bin",
    key: "🐚",
    keyName: "shell key",
    door: "🪸",
    doorName: "coral gate",
    hazard: "🪼",
    hazardName: "jellyfish",
    winMsg: "You cleaned up the whole ocean! The sea animals are so happy. 🐢🐠"
  },
  {
    id: "garden",
    name: "Community Garden",
    emoji: "🌻",
    forGood: "Grow healthy food to share with your whole neighborhood!",
    intro: "Your hero plants seeds all over the garden, then heads to the watering can so everything can grow.",
    bg: "#3b5323",
    bgGrid: "#456026",
    wall: "#2a3d18",
    accent: "#a3d977",
    hero: "🐰",
    gem: "🌱",
    gemName: "seed",
    gemNamePlural: "seeds",
    friend: "🐝",
    friendName: "busy bee",
    goal: "🪴",
    goalName: "garden patch",
    key: "🔑",
    keyName: "shed key",
    door: "🚪",
    doorName: "garden gate",
    hazard: "🐌",
    hazardName: "hungry slug",
    winMsg: "Your garden is full of seeds and ready to grow! The whole neighborhood can share the food. 🌻"
  },
  {
    id: "pets",
    name: "Pet Rescue",
    emoji: "🐾",
    forGood: "Find lost pets and bring them safely to the animal shelter!",
    intro: "Some pets got lost! Your hero finds every one of them and leads them home to the cozy shelter.",
    bg: "#5d4037",
    bgGrid: "#6b4a3f",
    wall: "#3e2723",
    accent: "#ffb74d",
    hero: "🧒",
    gem: "🐶",
    gemName: "lost pet",
    gemNamePlural: "lost pets",
    friend: "🐱",
    friendName: "shelter cat",
    goal: "🏠",
    goalName: "animal shelter",
    key: "🔑",
    keyName: "gate key",
    door: "🚧",
    doorName: "blocked road",
    hazard: "🌧️",
    hazardName: "rain puddle",
    winMsg: "Every lost pet is safe at the shelter now. You're a real animal hero! 🐾"
  },
  {
    id: "space",
    name: "Space Station Supply",
    emoji: "🚀",
    forGood: "Deliver supplies so astronauts can live and work in space!",
    intro: "The astronauts need supplies! Your hero floats through the station, grabs every supply box, and brings them to the docking bay.",
    bg: "#1a1a2e",
    bgGrid: "#23233f",
    wall: "#0f0f1c",
    accent: "#9d8df1",
    hero: "👩‍🚀",
    gem: "📦",
    gemName: "supply box",
    gemNamePlural: "supply boxes",
    friend: "🛰️",
    friendName: "helper satellite",
    goal: "🛸",
    goalName: "docking bay",
    key: "🗝️",
    keyName: "access card",
    door: "🔒",
    doorName: "airlock",
    hazard: "☄️",
    hazardName: "space rock",
    winMsg: "All supplies delivered! The astronauts can keep exploring space thanks to you. 🚀"
  },
  {
    id: "health",
    name: "Helping Hands Hospital",
    emoji: "💊",
    forGood: "Bring medicine and care to people who need help feeling better!",
    intro: "People in the hospital need medicine. Your hero gathers every medicine kit and delivers them to the care center.",
    bg: "#1f4e5f",
    bgGrid: "#265c6e",
    wall: "#143640",
    accent: "#7fd1c1",
    hero: "🧑‍⚕️",
    gem: "💊",
    gemName: "medicine kit",
    gemNamePlural: "medicine kits",
    friend: "🧸",
    friendName: "comfort bear",
    goal: "🏥",
    goalName: "care center",
    key: "🔑",
    keyName: "supply key",
    door: "🚪",
    doorName: "locked ward",
    hazard: "🧫",
    hazardName: "germy spill",
    winMsg: "Everyone got their medicine and care. You helped so many people feel better! 💗"
  }
];

// Tile types that the editor palette can place.
// (start & goal are special — only one of each is allowed.)
const TILE_TYPES = ["start", "goal", "wall", "gem", "hazard", "key", "door"];

function getMission(id) {
  return MISSIONS.find(m => m.id === id) || MISSIONS[0];
}

// Make available to the rest of the app.
window.MISSIONS = MISSIONS;
window.TILE_TYPES = TILE_TYPES;
window.getMission = getMission;
