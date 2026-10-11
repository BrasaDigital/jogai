import { createKit } from "/js/kit.js";
import { sfx, initAudio } from "/js/sound.js";
import { novo, revelar, bandeira, bandeiras, venceu } from "./logic.js";

export const NIVEIS = [[8, 8, 8], [9, 9, 10], [10, 10, 12], [10, 10, 15], [12, 12, 20], [12, 12, 25], [14, 14, 30], [14, 14, 38], [16, 16, 45], [16, 16, 55]];
const $ = (id) => document.getElementById(id);
let lvl = 1, s = null, modoBandeira = false;
const board = $("mines");

function build() {
  board.style.setProperty("--cols", s.colunas);
  board.innerHTML = "";
  for (let i = 0; i < s.cel.length; i++) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "mc"; b.dataset.i = i;
    board.appendChild(b);
  }
}
function draw() {
  [...board.children].forEach((el, i) => {
    const c = s.cel[i];
    el.className = "mc" + (c.aberta ? " open" : "") + (c.aberta && c.mina ? " boom" : "");
    el.dataset.n = c.aberta && !c.mina ? c.n : 0;
    el.textContent = c.aberta ? (c.mina ? "💣" : c.n || "") : c.bandeira ? "🚩" : "";
    if (s.perdeu && c.mina && !c.aberta && !c.bandeira) { el.classList.add("open"); el.textContent = "💣"; }
  });
  $("hud-l").textContent = `Minas: ${s.minas - bandeiras(s)}`;
}
function tocar(i, bandeirar) {
  if (!kit.isRunning()) return;
  initAudio();
  if (bandeirar) { bandeira(s, i); sfx.tick(); return draw(); }
  const c = s.cel[i];
  if (c.bandeira) return;
  if (c.aberta) return;
  revelar(s, i);
  draw();
  if (s.perdeu) return kit.lose("Pisou numa mina!");
  sfx.tick();
  if (venceu(s)) kit.win();
}

const kit = createKit({
  game: "minas",
  total: 10,
  goalText: (n) => { const [r, c, m] = NIVEIS[n - 1]; return `Campo ${r}×${c} com ${m} minas`; },
  onSelect(n) { lvl = n; const [r, c, m] = NIVEIS[n - 1]; s = novo(r, c, m); build(); draw(); },
  onBegin() { const [r, c, m] = NIVEIS[lvl - 1]; s = novo(r, c, m); build(); draw(); },
  onStop() {},
});

let press = null, longo = false;
board.addEventListener("pointerdown", (e) => {
  const b = e.target.closest(".mc"); if (!b || e.button === 2) return;
  longo = false;
  press = setTimeout(() => { longo = true; tocar(+b.dataset.i, true); }, 450);
});
const fim = () => clearTimeout(press);
board.addEventListener("pointerup", (e) => {
  fim();
  const b = e.target.closest(".mc"); if (!b || longo || e.button === 2) return;
  tocar(+b.dataset.i, modoBandeira);
});
board.addEventListener("pointerleave", fim);
board.addEventListener("pointercancel", fim);
board.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const b = e.target.closest(".mc"); if (b) tocar(+b.dataset.i, true);
});
$("flag-btn").addEventListener("click", () => {
  modoBandeira = !modoBandeira;
  $("flag-btn").textContent = `🚩 Bandeira: ${modoBandeira ? "ligada" : "desligada"}`;
});
