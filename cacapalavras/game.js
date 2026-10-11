import { createKit } from "/js/kit.js";
import { sfx, initAudio } from "/js/sound.js";
import { gerarGarantido, DIRS, conferir, linha } from "./logic.js";

export const TAM = [8, 8, 9, 10, 10, 11, 12, 12, 13, 14];
export const QTD = [4, 5, 6, 7, 8, 8, 9, 10, 11, 12];
export const dirDe = (n) => (n <= 3 ? DIRS.facil : n <= 6 ? DIRS.medio : DIRS.dificil);
const $ = (id) => document.getElementById(id);
let lvl = 1, d = null, achadas = new Set(), ini = null, cor = new Map();
const ws = $("ws"), lista = $("wordlist");
const CORES = ["#ff6fb5", "#6fd6ff", "#ffd56f", "#8dff9b", "#c79bff", "#ff9b6f"];

function build() {
  const n = d.grade.length;
  ws.style.setProperty("--n", n);
  ws.innerHTML = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "wc"; b.dataset.r = r; b.dataset.c = c; b.textContent = d.grade[r][c];
    ws.appendChild(b);
  }
  lista.innerHTML = "";
  [...d.colocadas.map((x) => x.palavra)].sort().forEach((w) => {
    const s = document.createElement("span"); s.className = "ww"; s.dataset.w = w; s.textContent = w; lista.appendChild(s);
  });
}
function draw() {
  const n = d.grade.length;
  [...ws.children].forEach((el) => {
    const r = +el.dataset.r, c = +el.dataset.c;
    const k = cor.get(r * n + c);
    el.style.background = k || "";
    el.style.color = k ? "#1b1530" : "";
    el.classList.toggle("ini", !!ini && ini[0] === r && ini[1] === c);
  });
  [...lista.children].forEach((s) => s.classList.toggle("ok", achadas.has(s.dataset.w)));
  $("hud-l").textContent = `Achadas: ${achadas.size} / ${d.colocadas.length}`;
}

const kit = createKit({
  game: "cacapalavras",
  total: 10,
  goalText: (n) => `${QTD[n - 1]} palavras em grade ${TAM[n - 1]}×${TAM[n - 1]}`,
  onSelect(n) {
    lvl = n; d = gerarGarantido(TAM[n - 1], QTD[n - 1], dirDe(n));
    achadas = new Set(); ini = null; cor = new Map(); build(); draw();
  },
  onBegin() { ini = null; draw(); },
  onStop() { ini = null; },
});

ws.addEventListener("pointerdown", (e) => {
  const b = e.target.closest(".wc"); if (!b || !kit.isRunning()) return;
  e.preventDefault(); initAudio();
  const r = +b.dataset.r, c = +b.dataset.c;
  if (!ini) { ini = [r, c]; sfx.tick(); return draw(); }
  if (ini[0] === r && ini[1] === c) { ini = null; return draw(); }
  const h = conferir(d.grade, d.colocadas, achadas, ini[0], ini[1], r, c);
  if (h) {
    achadas.add(h.palavra);
    const k = CORES[(achadas.size - 1) % CORES.length], n = d.grade.length;
    h.celulas.forEach(([rr, cc]) => cor.set(rr * n + cc, k));
    ini = null; sfx.place(); draw();
    if (achadas.size === d.colocadas.length) kit.win();
  } else {
    // não formou palavra: a casa tocada vira o novo começo
    ini = [r, c]; sfx.tick(); draw();
  }
});
