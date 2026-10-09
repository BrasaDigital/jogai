import { getRanking, saveScore } from "/js/supabase.js";
import { initAudio, sfx, isMuted, setMuted } from "/js/sound.js";
import { onAuthChange, openAuth } from "/js/account.js";
import { mountMoreLevels } from "/js/more-levels.js";
import { needsLogin, onProgress, isDone, isUnlocked, firstOpen, completeLevel } from "/js/progress.js";
import { LEVELS, targetOf, passed } from "/reflexo/levels.js";

const GAME = "reflexo";
const TOTAL_ROUNDS = 3;
const MIN_WAIT = 1500;
const MAX_WAIT = 4000;

const $ = (id) => document.getElementById(id);
const arena = $("arena");
const titleEl = $("arena-title");
const subEl = $("arena-sub");
const roundsEl = $("rounds");
const submitBox = $("submit-box");
const submitInfo = $("submit-info");
const submitBtn = $("submit-btn");
const submitMsg = $("submit-msg");
const winTitle = $("win-title");
const winActions = $("win-actions");
const levelLabel = $("level-label");
const rankLevel = $("rank-level");
const rankingList = $("ranking-list");
const levelsEl = $("levels");

let level = 1;
let state = "idle"; // idle | waiting | go | result | fail | finished | missed
let timer = null;
let startTime = 0;
let times = [];
let finalScore = null; // só existe quando o nível foi concluído
let alreadySaved = false;

function setState(next, title, sub) {
  state = next;
  arena.className = next === "finished" ? "result" : next === "missed" ? "fail" : next;
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

function finishLevel() {
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const rounds = `Rodadas: ${times.join(" · ")} ms`;

  if (!passed(level, avg)) {
    finalScore = null;
    sfx.fail();
    setState("missed", `Média: ${avg} ms`,
      `Faltou pouco: a meta do nível ${level} é até ${targetOf(level)} ms. ${rounds} — clique para tentar de novo`);
    return;
  }

  finalScore = avg;
  sfx.win();
  completeLevel(GAME, level); // libera o próximo nível
  renderLevels();
  setState("finished", `Nível ${level} concluído! ${avg} ms`, `${rounds} — clique para jogar este nível de novo`);
  winTitle.textContent = level >= LEVELS ? "🏆 Você zerou o jogo!" : `🎉 Nível ${level} concluído!`;
  submitBox.hidden = false;
  winActions.hidden = level >= LEVELS;
  submitBtn.disabled = false;
  submitMsg.textContent = "";
  submitMsg.className = "msg";
  alreadySaved = false;
  renderSubmit();
}

function handleClick() {
  initAudio();

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
    return finishLevel();
  }

  if (state === "result") return startRound();

  if (state === "finished" || state === "missed") return resetGame();
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

// ---------- níveis ----------
function renderLevels() {
  levelsEl.innerHTML = "";
  for (let n = 1; n <= LEVELS; n++) {
    const open = isUnlocked(GAME, n);
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lv"
      + (isDone(GAME, n) ? " done" : "")
      + (n === level ? " cur" : "")
      + (open ? "" : " locked");
    b.textContent = open ? String(n) : "🔒";
    b.disabled = !open;
    b.title = `Meta: até ${targetOf(n)} ms`;
    b.setAttribute("aria-label", open ? `Nível ${n}, meta ${targetOf(n)} ms` : `Nível ${n} bloqueado`);
    b.addEventListener("click", () => {
      userPicked = true;
      initAudio();
      sfx.tick();
      startLevel(n);
    });
    levelsEl.appendChild(b);
  }
}

function startLevel(n) {
  // nível bloqueado: vai para o primeiro que ainda não foi concluído
  if (!isUnlocked(GAME, n)) n = firstOpen(GAME, LEVELS);
  level = Math.min(Math.max(n, 1), LEVELS);
  try { history.replaceState(null, "", `#${level}`); } catch (_) {}

  clearTimeout(timer);
  times = [];
  finalScore = null;
  alreadySaved = false;
  submitBox.hidden = true;
  winActions.hidden = true;

  levelLabel.textContent = `Nível ${level} de ${LEVELS} · meta: média até ${targetOf(level)} ms`;
  rankLevel.textContent = `Nível ${level}`;
  setState("idle", "Clique para começar", `Nível ${level}: média de até ${targetOf(level)} ms nas 3 rodadas`);
  renderLevels();
  loadRanking();
}

$("next-btn").addEventListener("click", () => {
  userPicked = true;
  initAudio();
  if (needsLogin(level + 1)) return openAuth("login");
  sfx.tick();
  startLevel(level + 1);
});

// ---------- ranking ----------
let authUser = null;
let authNick = null;
onAuthChange(({ user, nickname }) => {
  authUser = user;
  authNick = nickname;
  renderSubmit();
});

function renderSubmit() {
  if (alreadySaved) return;
  if (authUser) {
    submitInfo.textContent = `Sua nota será salva como ${authNick || "jogador"}.`;
    submitBtn.textContent = "Salvar no ranking";
  } else {
    submitInfo.textContent = "Entre na sua conta para salvar sua nota no ranking.";
    submitBtn.textContent = "Entrar para salvar";
  }
}

submitBtn.addEventListener("click", async () => {
  if (finalScore === null || alreadySaved) return;
  if (!authUser) { openAuth("login"); return; }

  submitBtn.disabled = true;
  submitMsg.className = "msg";
  submitMsg.textContent = "Salvando...";
  try {
    await saveScore(GAME, finalScore, level);
    alreadySaved = true;
    submitInfo.textContent = "Nota salva no ranking.";
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
  const asked = level;
  rankingList.innerHTML = '<li class="empty">Carregando...</li>';
  try {
    const rows = await getRanking(GAME, { ascending: true, limit: 10, level: asked });
    if (asked !== level) return; // trocou de nível enquanto carregava
    rankingList.innerHTML = "";
    if (!rows.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "Ninguém no ranking deste nível ainda. Seja o primeiro!";
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

// ---------- som ----------
const muteBtn = $("mute-btn");
function renderMute() {
  muteBtn.textContent = isMuted() ? "🔇 Som desligado" : "🔊 Som ligado";
  muteBtn.setAttribute("aria-pressed", String(isMuted()));
}
muteBtn.addEventListener("click", () => {
  initAudio();
  setMuted(!isMuted());
  renderMute();
  if (!isMuted()) sfx.saved();
});
renderMute();

// ---------- início ----------
const fromHash = parseInt(location.hash.slice(1), 10);
let userPicked = Number.isFinite(fromHash);
startLevel(Number.isFinite(fromHash) ? fromHash : 1);

onProgress(() => {
  renderLevels();
  // o progresso da conta chega depois da página abrir: leva ao primeiro nível em aberto
  const untouched = state === "idle" && times.length === 0;
  const target = firstOpen(GAME, LEVELS);
  if (!userPicked && untouched && target !== level) startLevel(target);
});

mountMoreLevels(GAME);
