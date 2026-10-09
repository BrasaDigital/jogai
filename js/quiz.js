// Motor dos jogos de perguntas (Incoterms, NCM, Rotas).
// Cada nível sorteia perguntas novas; 3 erros e o nível acaba. O tempo total vale para o ranking.
import { createKit } from "/js/kit.js";
import { sfx, initAudio } from "/js/sound.js";

export function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const pick = (arr, n = 1) => shuffle(arr).slice(0, n);

// monta a pergunta: embaralha as opções e guarda o índice da certa
export function mk(q, correct, wrongs, why = "") {
  const options = shuffle([correct, ...wrongs]);
  return { q, options, answer: options.indexOf(correct), why };
}

export const perLevel = (n) => (n <= 3 ? 6 : 8);
export const MAX_ERRORS = 3;

// sorteia `n` perguntas sem repetir o mesmo texto
export function take(makers, n) {
  const seen = new Set();
  const out = [];
  let guard = 0;
  while (out.length < n && guard++ < 400) {
    const m = makers[Math.floor(Math.random() * makers.length)];
    const q = m();
    if (!q || seen.has(q.q)) continue;
    seen.add(q.q);
    out.push(q);
  }
  return out;
}

export function createQuiz({ game, make }) {
  const $ = (id) => document.getElementById(id);
  let qs = [], idx = 0, errors = 0, locked = true, to = null;

  function render() {
    const q = qs[idx];
    $("hud-a").textContent = idx;
    $("q-text").textContent = q.q;
    $("q-why").textContent = "";
    const box = $("q-opts");
    box.innerHTML = "";
    q.options.forEach((o, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "qopt";
      b.textContent = o;
      b.addEventListener("click", () => answer(i, b));
      box.appendChild(b);
    });
    locked = false;
  }

  function answer(i, btn) {
    if (locked || !kit.isRunning()) return;
    locked = true;
    initAudio();
    const q = qs[idx];
    const btns = [...$("q-opts").children];
    btns[q.answer].classList.add("right");
    let wait = 650;
    if (i === q.answer) sfx.place();
    else {
      btn.classList.add("wrong");
      errors++;
      $("hud-e").textContent = errors;
      sfx.fail();
      $("q-why").textContent = q.why ? `Resposta: ${q.options[q.answer]}. ${q.why}` : `Resposta: ${q.options[q.answer]}.`;
      wait = 1800;
    }
    to = setTimeout(() => {
      if (errors >= MAX_ERRORS) return kit.lose(`Você errou ${MAX_ERRORS} perguntas. Estude e tente de novo!`);
      idx++;
      if (idx >= qs.length) return kit.win();
      render();
    }, wait);
  }

  const kit = createKit({
    game,
    total: 10,
    goalText: (n) => `${perLevel(n)} perguntas · máx. ${MAX_ERRORS - 1} erros`,
    onSelect(n) {
      clearTimeout(to);
      locked = true;
      $("hud-a").textContent = "0";
      $("hud-g").textContent = perLevel(n);
      $("hud-e").textContent = "0";
      $("q-text").textContent = "";
      $("q-opts").innerHTML = "";
      $("q-why").textContent = "";
    },
    onBegin(n) {
      qs = make(n);
      idx = 0; errors = 0;
      $("hud-e").textContent = "0";
      render();
    },
    onStop() { clearTimeout(to); locked = true; },
  });
  return kit;
}
