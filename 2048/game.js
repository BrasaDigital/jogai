import { createKit } from "/js/kit.js";
import { sfx, initAudio } from "/js/sound.js";
import { novo, adicionar, mover, maior, temMovimento } from "./logic.js";

export const METAS = [64, 128, 256, 256, 512, 512, 1024, 1024, 2048, 2048];
const $ = (id) => document.getElementById(id);
let lvl = 1, g = novo(), pontos = 0;
const board = $("g2048");
for (let i = 0; i < 16; i++) { const t = document.createElement("div"); t.className = "tl"; board.appendChild(t); }

function draw() {
  [...board.children].forEach((el, i) => {
    const v = g[i];
    el.textContent = v || "";
    el.dataset.v = v || 0;
  });
  $("hud-l").textContent = `Meta: ${METAS[lvl - 1]} · Maior: ${maior(g)}`;
}
function jogar(dir) {
  if (!kit.isRunning()) return;
  initAudio();
  const r = mover(g, dir);
  if (!r.moveu) return;
  g = r.grade; adicionar(g); sfx.tick(); draw();
  if (maior(g) >= METAS[lvl - 1]) return kit.win();
  if (!temMovimento(g)) kit.lose(`Sem movimentos. Maior peça: ${maior(g)}. Meta: ${METAS[lvl - 1]}.`);
}

const kit = createKit({
  game: "2048",
  total: 10,
  goalText: (n) => `Chegue na peça ${METAS[n - 1]}`,
  onSelect(n) { lvl = n; g = novo(); draw(); },
  onBegin() { g = novo(); adicionar(g); adicionar(g); draw(); },
  onStop() {},
});

document.addEventListener("keydown", (e) => {
  const d = { ArrowLeft: "esq", ArrowRight: "dir", ArrowUp: "cima", ArrowDown: "baixo" }[e.key];
  if (d && kit.isRunning()) { e.preventDefault(); jogar(d); }
});
document.querySelector(".dpad").addEventListener("pointerdown", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  e.preventDefault(); jogar(b.dataset.d);
});
let t0 = null;
board.addEventListener("touchstart", (e) => { const t = e.touches[0]; t0 = [t.clientX, t.clientY]; }, { passive: true });
board.addEventListener("touchmove", (e) => { if (kit.isRunning()) e.preventDefault(); }, { passive: false });
board.addEventListener("touchend", (e) => {
  if (!t0) return;
  const t = e.changedTouches[0], dx = t.clientX - t0[0], dy = t.clientY - t0[1];
  t0 = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  jogar(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "dir" : "esq") : (dy > 0 ? "baixo" : "cima"));
});
