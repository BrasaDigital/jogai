import { createKit } from "/js/kit.js";
import { sfx, note, initAudio } from "/js/sound.js";

export const GOALS = [4, 5, 6, 7, 8, 9, 10, 12, 14, 16];
export const NOTE_MS = [650, 600, 550, 500, 450, 400, 360, 330, 300, 270];
export const FREQ = [262, 330, 392, 523];

const $ = (id) => document.getElementById(id);
const pads = [...document.querySelectorAll(".pad")];
const status = $("hud-s");
let lvl = 1, seq = [], pos = 0, accepting = false, run = 0;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function flash(i, ms) {
  pads[i].classList.add("lit");
  note(FREQ[i], ms / 1000);
  setTimeout(() => pads[i].classList.remove("lit"), ms);
}

async function play(myRun) {
  accepting = false;
  status.textContent = "Observe...";
  await wait(500);
  const ms = NOTE_MS[lvl - 1];
  for (const i of seq) {
    if (myRun !== run) return;
    flash(i, ms * 0.8);
    await wait(ms);
  }
  if (myRun !== run) return;
  pos = 0;
  accepting = true;
  status.textContent = "Sua vez!";
}

function addStep() {
  seq.push(Math.floor(Math.random() * 4));
  $("hud-a").textContent = seq.length;
  play(run);
}

const kit = createKit({
  game: "simon",
  total: 10,
  goalText: (n) => `Repita ${GOALS[n - 1]} rodadas`,
  onSelect(n) {
    lvl = n; run++; seq = []; accepting = false;
    $("hud-a").textContent = "0"; $("hud-g").textContent = GOALS[n - 1]; status.innerHTML = "&nbsp;";
  },
  onBegin() { run++; seq = []; addStep(); },
  onStop() { run++; accepting = false; status.innerHTML = "&nbsp;"; },
});

pads.forEach((p) => p.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (!kit.isRunning() || !accepting) return;
  initAudio();
  const i = Number(p.dataset.i);
  if (i !== seq[pos]) { accepting = false; return kit.lose(`Errou na rodada ${seq.length}. Meta: ${GOALS[lvl - 1]}.`); }
  flash(i, 200);
  pos++;
  if (pos < seq.length) return;
  accepting = false;
  if (seq.length >= GOALS[lvl - 1]) return kit.win();
  sfx.place();
  const my = run;
  setTimeout(() => { if (my === run && kit.isRunning()) addStep(); }, 500);
}));
