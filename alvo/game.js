import { createKit } from "/js/kit.js";
import { sfx, initAudio } from "/js/sound.js";

export const GOALS = [10, 12, 14, 16, 18, 20, 22, 24, 26, 30];
export const LIFE = [1600, 1450, 1300, 1200, 1100, 1000, 900, 820, 740, 670];
export const RADIUS = [0.09, 0.085, 0.08, 0.075, 0.07, 0.065, 0.06, 0.055, 0.05, 0.045];
const GAP = 250;
const MAX_MISS = 3;

const $ = (id) => document.getElementById(id);
const arena = $("arena-alvo");
let lvl = 1, hits = 0, miss = 0, to = null, cur = null;

function clear() { clearTimeout(to); to = null; if (cur) { cur.remove(); cur = null; } }

const kit = createKit({
  game: "alvo",
  total: 10,
  goalText: (n) => `Acerte ${GOALS[n - 1]} alvos`,
  onSelect(n) {
    lvl = n; hits = 0; miss = 0; clear();
    $("hud-a").textContent = "0"; $("hud-m").textContent = "0"; $("hud-g").textContent = GOALS[n - 1];
  },
  onBegin() { hits = 0; miss = 0; $("hud-a").textContent = "0"; $("hud-m").textContent = "0"; next(); },
  onStop: clear,
});

function missed(why) {
  miss++;
  $("hud-m").textContent = miss;
  sfx.fail();
  if (miss >= MAX_MISS) return kit.lose(`${hits} acertos antes de errar 3 vezes. Meta: ${GOALS[lvl - 1]}.`);
  clear();
  to = setTimeout(next, GAP);
}

function next() {
  if (!kit.isRunning()) return;
  clear();
  const w = arena.clientWidth, h = arena.clientHeight;
  const r = RADIUS[lvl - 1] * w;
  const x = r + Math.random() * (w - 2 * r);
  const y = r + Math.random() * (h - 2 * r);
  const t = document.createElement("button");
  t.type = "button";
  t.className = "target";
  t.setAttribute("aria-label", "Alvo");
  t.style.cssText = `left:${x}px;top:${y}px;width:${2 * r}px;height:${2 * r}px`;
  t.addEventListener("pointerdown", (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!kit.isRunning() || t !== cur) return;
    initAudio();
    hits++;
    $("hud-a").textContent = hits;
    sfx.hit(300);
    if (hits >= GOALS[lvl - 1]) { clear(); return kit.win(); }
    clear();
    to = setTimeout(next, GAP);
  });
  arena.appendChild(t);
  cur = t;
  to = setTimeout(() => missed("sumiu"), LIFE[lvl - 1]);
}

// tocar fora do alvo conta como erro
arena.addEventListener("pointerdown", (e) => {
  if (!kit.isRunning() || !cur || e.target !== arena) return;
  e.preventDefault();
  clearTimeout(to);
  missed("fora");
});
