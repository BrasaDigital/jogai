import { createKit } from "/js/kit.js";
import { sfx, initAudio } from "/js/sound.js";

export const PAIRS = [4, 5, 6, 7, 8, 9, 10, 12, 14, 15];
export const COLS = [4, 5, 4, 5, 4, 6, 5, 6, 7, 6];
export const PEEK = [900, 850, 800, 750, 700, 650, 600, 550, 500, 450];
const EMOJIS = ["🍎", "🍌", "🍇", "🍓", "🍉", "🍒", "🥝", "🍋", "🥕", "🌽", "🍄", "🍩", "🍪", "🍕", "🍔"];

const $ = (id) => document.getElementById(id);
const grid = $("mem-grid");
let lvl = 1;
let open = [];
let found = 0;
let locked = false;
let to = null;

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function build(n) {
  const faces = shuffle(EMOJIS.slice()).slice(0, PAIRS[n - 1]);
  const deck = shuffle([...faces, ...faces]);
  grid.innerHTML = "";
  grid.style.gridTemplateColumns = `repeat(${COLS[n - 1]}, auto)`;
  deck.forEach((f) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "mcard";
    b.dataset.f = f;
    b.textContent = "?";
    b.setAttribute("aria-label", "Carta virada para baixo");
    b.addEventListener("click", () => flip(b));
    grid.appendChild(b);
  });
}

const kit = createKit({
  game: "memoria",
  total: 10,
  goalText: (n) => `${PAIRS[n - 1]} pares`,
  onSelect(n) {
    lvl = n;
    clearTimeout(to);
    open = []; found = 0; locked = true;
    build(n);
    $("hud-a").textContent = "0";
    $("hud-g").textContent = PAIRS[n - 1];
  },
  onBegin() { locked = false; },
  onStop() { clearTimeout(to); locked = true; },
});

function flip(b) {
  if (!kit.isRunning() || locked || b.classList.contains("up") || b.classList.contains("ok")) return;
  initAudio();
  sfx.tick();
  b.classList.add("up");
  b.textContent = b.dataset.f;
  open.push(b);
  if (open.length < 2) return;
  locked = true;
  const [a, c] = open;
  if (a.dataset.f === c.dataset.f) {
    a.classList.replace("up", "ok"); c.classList.replace("up", "ok");
    open = [];
    found++;
    sfx.place();
    $("hud-a").textContent = found;
    if (found >= PAIRS[lvl - 1]) return kit.win();
    locked = false;
  } else {
    to = setTimeout(() => {
      [a, c].forEach((x) => { x.classList.remove("up"); x.textContent = "?"; });
      open = [];
      locked = false;
    }, PEEK[lvl - 1]);
  }
}
