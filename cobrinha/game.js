import { createKit } from "/js/kit.js";
import { sfx, initAudio } from "/js/sound.js";
import { N, TICKS, GOALS, newState, turn, step } from "/cobrinha/logic.js";

const $ = (id) => document.getElementById(id);
const canvas = $("snake-canvas");
const ctx = canvas.getContext("2d");
const C = canvas.width / N;

let s = null;
let timer = null;
let pending = null; // virada guardada para o próximo passo
let lvl = 1;

function draw() {
  ctx.fillStyle = "#120f26";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!s) return;
  ctx.fillStyle = "#ff4f81";
  ctx.beginPath();
  ctx.arc((s.apple.x + 0.5) * C, (s.apple.y + 0.5) * C, C * 0.38, 0, 7);
  ctx.fill();
  s.snake.forEach((p, i) => {
    ctx.fillStyle = i === 0 ? "#ffd23f" : "#5be37d";
    ctx.fillRect(p.x * C + 2, p.y * C + 2, C - 4, C - 4);
  });
}

function stop() { clearInterval(timer); timer = null; }

const kit = createKit({
  game: "cobrinha",
  total: 10,
  goalText: (n) => `Coma ${GOALS[n - 1]} maçãs`,
  onSelect(n) {
    lvl = n;
    s = null;
    $("hud-a").textContent = "0";
    $("hud-g").textContent = GOALS[n - 1];
    draw();
  },
  onBegin(n) {
    lvl = n;
    s = newState();
    pending = null;
    $("hud-a").textContent = "0";
    draw();
    stop();
    timer = setInterval(tick, TICKS[n - 1]);
  },
  onStop: stop,
});

function tick() {
  if (pending) { turn(s, pending); pending = null; }
  const r = step(s);
  if (r === "dead") { draw(); kit.lose(`A cobrinha bateu com ${s.eaten} maçã(s) comida(s). Meta: ${GOALS[lvl - 1]}.`); return; }
  if (r === "eat") {
    sfx.place();
    $("hud-a").textContent = s.eaten;
    if (s.eaten >= GOALS[lvl - 1]) { draw(); kit.win(); return; }
  }
  draw();
}

function dir(name) {
  if (!kit.isRunning() || !s) return;
  initAudio();
  pending = name;
}

const KEYS = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right" };
document.addEventListener("keydown", (e) => {
  const d = KEYS[e.key];
  if (d && kit.isRunning()) { e.preventDefault(); dir(d); }
});
document.querySelectorAll(".dpad button").forEach((b) =>
  b.addEventListener("pointerdown", (e) => { e.preventDefault(); dir(b.dataset.d); }));

// deslizar no tabuleiro
let sx = 0, sy = 0;
canvas.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; });
canvas.addEventListener("pointerup", (e) => {
  const dx = e.clientX - sx, dy = e.clientY - sy;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
  dir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
});
