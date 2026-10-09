import { createKit } from "/js/kit.js";
import { sfx, initAudio } from "/js/sound.js";
import { shuffle } from "/js/quiz.js";
import { CENARIOS } from "/processo/data.js";

const $ = (id) => document.getElementById(id);
const MAX_ERRORS = 3;
let sc = CENARIOS[0], next = 0, errors = 0;

const kit = createKit({
  game: "processo",
  total: CENARIOS.length,
  goalText: (n) => `${CENARIOS[n - 1].nome} · ${CENARIOS[n - 1].steps.length} etapas`,
  onSelect(n) {
    sc = CENARIOS[n - 1];
    next = 0; errors = 0;
    $("steps-done").innerHTML = "";
    $("steps-pool").innerHTML = "";
    $("hud-a").textContent = "0"; $("hud-g").textContent = sc.steps.length; $("hud-e").textContent = "0";
    $("scenario").textContent = `${sc.nome}: toque nas etapas na ordem em que acontecem.`;
  },
  onBegin() {
    next = 0; errors = 0;
    $("steps-done").innerHTML = "";
    $("hud-e").textContent = "0";
    const pool = $("steps-pool");
    pool.innerHTML = "";
    shuffle(sc.steps.map((text, i) => ({ text, i }))).forEach(({ text, i }) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "step-btn";
      b.textContent = text;
      b.addEventListener("click", () => tap(b, i));
      pool.appendChild(b);
    });
  },
});

function tap(btn, i) {
  if (!kit.isRunning()) return;
  initAudio();
  if (i === next) {
    sfx.place();
    const li = document.createElement("li");
    li.textContent = btn.textContent;
    $("steps-done").appendChild(li);
    btn.remove();
    next++;
    $("hud-a").textContent = next;
    if (next >= sc.steps.length) kit.win();
  } else {
    errors++;
    $("hud-e").textContent = errors;
    btn.classList.add("bad");
    setTimeout(() => btn.classList.remove("bad"), 350);
    if (errors >= MAX_ERRORS) kit.lose(`Você errou a ordem ${MAX_ERRORS} vezes.`);
    else sfx.fail();
  }
}
