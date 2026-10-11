import { createKit } from "/js/kit.js";
import { sfx, initAudio } from "/js/sound.js";
import { gerarPuzzle, conflitos, completo } from "./logic.js";

export const PISTAS = [40, 36, 33, 31, 30, 29, 28, 27, 26, 25];
const $ = (id) => document.getElementById(id);
let lvl = 1, p = null, g = [], fixo = [], notas = [], sel = -1, anotar = false;

const board = $("sdk"), pad = $("numpad");
for (let i = 0; i < 81; i++) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "sc"; b.dataset.i = i;
  const r = Math.floor(i / 9), c = i % 9;
  if (c % 3 === 2 && c < 8) b.classList.add("rb");
  if (r % 3 === 2 && r < 8) b.classList.add("bb");
  board.appendChild(b);
}
for (let n = 1; n <= 9; n++) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "np"; b.dataset.n = n; b.textContent = n;
  pad.appendChild(b);
}
const x = document.createElement("button");
x.type = "button"; x.className = "np"; x.dataset.n = 0; x.textContent = "⌫"; x.setAttribute("aria-label", "Apagar");
pad.appendChild(x);

function draw() {
  const bad = conflitos(g);
  const cells = board.children;
  const sv = sel >= 0 ? g[sel] : 0;
  for (let i = 0; i < 81; i++) {
    const el = cells[i];
    el.classList.toggle("fixo", !!fixo[i]);
    el.classList.toggle("sel", i === sel);
    el.classList.toggle("bad", bad.has(i) && !fixo[i]);
    el.classList.toggle("same", sv && g[i] === sv && i !== sel);
    if (g[i]) el.textContent = g[i];
    else if (notas[i] && notas[i].size) el.innerHTML = `<span class="nt">${[1,2,3,4,5,6,7,8,9].map((n) => (notas[i].has(n) ? n : "&nbsp;")).join("")}</span>`;
    else el.textContent = "";
  }
  $("hud-l").textContent = `Pistas: ${p ? p.pistas : 0} · Faltam: ${g.filter((v) => !v).length}`;
}

function entrar(n) {
  if (!kit.isRunning() || sel < 0 || fixo[sel]) return;
  initAudio();
  if (n && anotar) {
    const s = notas[sel] || (notas[sel] = new Set());
    if (g[sel]) return;
    s.has(n) ? s.delete(n) : s.add(n);
    sfx.tick(); return draw();
  }
  g[sel] = n; notas[sel] = null;
  n ? sfx.place() : sfx.tick();
  draw();
  if (n && completo(g)) kit.win();
}

const kit = createKit({
  game: "sudoku",
  total: 10,
  goalText: (n) => `Grade 9×9 com ${PISTAS[n - 1]} pistas`,
  onSelect(n) {
    lvl = n; p = gerarPuzzle(PISTAS[n - 1]);
    g = p.puzzle.slice(); fixo = p.puzzle.map((v) => v !== 0); notas = []; sel = -1;
    draw();
  },
  onBegin() { draw(); },
  onStop() {},
});

board.addEventListener("pointerdown", (e) => {
  const b = e.target.closest(".sc"); if (!b || !kit.isRunning()) return;
  e.preventDefault(); initAudio(); sel = Number(b.dataset.i); sfx.tick(); draw();
});
pad.addEventListener("pointerdown", (e) => {
  const b = e.target.closest(".np"); if (!b) return;
  e.preventDefault(); entrar(Number(b.dataset.n));
});
$("note-btn").addEventListener("click", () => {
  anotar = !anotar;
  $("note-btn").textContent = `✏️ Anotar: ${anotar ? "ligado" : "desligado"}`;
});
document.addEventListener("keydown", (e) => {
  if (!kit.isRunning()) return;
  if (/^[1-9]$/.test(e.key)) return entrar(Number(e.key));
  if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") return entrar(0);
  const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -9, ArrowDown: 9 }[e.key];
  if (d && sel >= 0) { const t = sel + d; if (t >= 0 && t < 81 && !(d === -1 && sel % 9 === 0) && !(d === 1 && sel % 9 === 8)) { sel = t; draw(); e.preventDefault(); } }
});
