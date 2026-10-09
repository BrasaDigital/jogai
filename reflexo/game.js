import { getRanking, saveScore } from "/js/supabase.js";
import { initAudio, sfx, isMuted, setMuted } from "/js/sound.js";

const GAME = "reflexo";
const TOTAL_ROUNDS = 3;
const MIN_WAIT = 1500;
const MAX_WAIT = 4000;

const arena = document.getElementById("arena");
const titleEl = document.getElementById("arena-title");
const subEl = document.getElementById("arena-sub");
const roundsEl = document.getElementById("rounds");
const submitBox = document.getElementById("submit-box");
const submitForm = document.getElementById("submit-form");
const submitBtn = document.getElementById("submit-btn");
const submitMsg = document.getElementById("submit-msg");
const nameInput = document.getElementById("player-name");
const rankingList = document.getElementById("ranking-list");

let state = "idle"; // idle | waiting | go | result | fail | finished
let timer = null;
let startTime = 0;
let times = [];
let finalScore = null;
let alreadySaved = false;

try { nameInput.value = localStorage.getItem("jogai_name") || ""; } catch (_) {}

function setState(next, title, sub) {
  state = next;
  arena.className = next === "finished" ? "result" : next;
  titleEl.textContent = title;
  subEl.textContent = sub || "";
  renderDots();
}

function renderDots() {
  roundsEl.innerHTML = "";
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const d = document.createElement("span");
    d.className = "dot" + (i < times.length ? " done" : "");
    roundsEl.appendChild(d);
  }
}

function startRound() {
  setState("waiting", "Espere o verde...", "Não clique ainda!");
  sfx.wait();
  const wait = MIN_WAIT + Math.random() * (MAX_WAIT - MIN_WAIT);
  timer = setTimeout(() => {
    startTime = performance.now();
    setState("go", "CLIQUE!", "");
    sfx.go();
  }, wait);
}

function resetGame() {
  clearTimeout(timer);
  times = [];
  finalScore = null;
  alreadySaved = false;
  submitBox.hidden = true;
  submitMsg.textContent = "";
  submitMsg.className = "msg";
  submitBtn.disabled = false;
  startRound();
}

function handleClick() {
  initAudio(); // o navegador só libera o som depois de um clique

  if (state === "idle") return resetGame();

  if (state === "waiting") {
    clearTimeout(timer);
    sfx.fail();
    return setState("fail", "Cedo demais!", "Clique para tentar essa rodada de novo");
  }

  if (state === "fail") return startRound();

  if (state === "go") {
    const ms = Math.round(performance.now() - startTime);
    times.push(ms);
    if (times.length < TOTAL_ROUNDS) {
      sfx.hit(ms);
      return setState("result", `${ms} ms`, "Clique para a próxima rodada");
    }
    finalScore = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    sfx.win();
    setState("finished", `Média: ${finalScore} ms`, `Rodadas: ${times.join(" · ")} ms — clique para jogar de novo`);
    submitBox.hidden = false;
    nameInput.focus({ preventScroll: true });
    return;
  }

  if (state === "result") return startRound();

  if (state === "finished") {
    times = [];
    return resetGame();
  }
}

arena.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  handleClick();
});
arena.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    handleClick();
  }
});

submitForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (finalScore === null || alreadySaved) return;
  const name = nameInput.value.trim();
  if (!name) return;

  submitBtn.disabled = true;
  submitMsg.className = "msg";
  submitMsg.textContent = "Salvando...";
  try {
    await saveScore(GAME, name, finalScore);
    try { localStorage.setItem("jogai_name", name); } catch (_) {}
    alreadySaved = true;
    initAudio();
    sfx.saved();
    submitMsg.className = "msg ok";
    submitMsg.textContent = "Pontuação salva! 🎉";
    loadRanking();
  } catch (err) {
    submitBtn.disabled = false;
    submitMsg.className = "msg err";
    submitMsg.textContent = err.message;
  }
});

async function loadRanking() {
  try {
    const rows = await getRanking(GAME, { ascending: true, limit: 10 });
    rankingList.innerHTML = "";
    if (!rows.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "Ninguém no ranking ainda. Seja o primeiro!";
      rankingList.appendChild(li);
      return;
    }
    rows.forEach((row, i) => {
      const li = document.createElement("li");
      const pos = document.createElement("span");
      pos.className = "pos";
      pos.textContent = `${i + 1}º`;
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = row.player_name;
      const val = document.createElement("span");
      val.className = "val";
      val.textContent = `${row.score} ms`;
      li.append(pos, name, val);
      rankingList.appendChild(li);
    });
  } catch (err) {
    rankingList.innerHTML = "";
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = err.message;
    rankingList.appendChild(li);
  }
}

const muteBtn = document.getElementById("mute-btn");
function renderMute() {
  muteBtn.textContent = isMuted() ? "🔇 Som desligado" : "🔊 Som ligado";
  muteBtn.setAttribute("aria-pressed", String(isMuted()));
}
muteBtn.addEventListener("click", () => {
  initAudio();
  setMuted(!isMuted());
  renderMute();
  if (!isMuted()) sfx.saved(); // toca um bipe para confirmar que o som voltou
});
renderMute();

renderDots();
loadRanking();
