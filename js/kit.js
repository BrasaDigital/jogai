// Estrutura comum dos jogos por nível (Cobrinha, Memória, Alvo, Simon).
// Cuida de: níveis liberados em ordem, cronômetro, tela de início/derrota,
// ranking por nível (menor tempo), salvar nota (exige login) e som.
import { getRanking, saveScore } from "/js/supabase.js";
import { initAudio, sfx, isMuted, setMuted } from "/js/sound.js";
import { onAuthChange, openAuth } from "/js/account.js";
import { mountMoreLevels } from "/js/more-levels.js";
import { needsLogin, onProgress, isDone, isUnlocked, firstOpen, completeLevel } from "/js/progress.js";

const $ = (id) => document.getElementById(id);

export function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function createKit({ game, total, goalText, onSelect, onBegin, onStop }) {
  let level = 1;
  let running = false;
  let t0 = 0;
  let tick = null;
  let finalScore = null;
  let saved = false;
  let userPicked = false;

  const overlay = $("overlay");
  const ovTitle = $("overlay-title");
  const ovText = $("overlay-text");
  const startBtn = $("start-btn");
  const timerEl = $("timer");
  const submitBox = $("submit-box");
  const submitBtn = $("submit-btn");
  const submitInfo = $("submit-info");
  const submitMsg = $("submit-msg");
  const winActions = $("win-actions");

  const elapsed = () => (performance.now() - t0) / 1000;
  function stopTimer() { clearInterval(tick); tick = null; }

  function showOverlay(title, text, btn) {
    ovTitle.textContent = title;
    ovText.textContent = text;
    startBtn.textContent = btn;
    overlay.hidden = false;
  }

  function select(n) {
    if (!isUnlocked(game, n)) n = firstOpen(game, total);
    level = Math.min(Math.max(n, 1), total);
    try { history.replaceState(null, "", `#${level}`); } catch (_) {}
    running = false;
    stopTimer();
    if (onStop) onStop();
    finalScore = null;
    saved = false;
    submitBox.hidden = true;
    winActions.hidden = true;
    timerEl.textContent = "00:00";
    $("level-label").textContent = `Nível ${level} de ${total} · ${goalText(level)}`;
    $("rank-level").textContent = `Nível ${level}`;
    showOverlay(`Nível ${level}`, `${goalText(level)}. O cronômetro começa quando você clicar.`, "Começar");
    if (onSelect) onSelect(level);
    renderLevels();
    loadRanking();
  }

  function begin() {
    initAudio();
    sfx.tick();
    overlay.hidden = true;
    running = true;
    t0 = performance.now();
    stopTimer();
    tick = setInterval(() => { timerEl.textContent = formatTime(elapsed()); }, 250);
    onBegin(level);
  }
  startBtn.addEventListener("click", () => (running || !overlay.hidden) && begin());

  function lose(msg) {
    if (!running) return;
    running = false;
    stopTimer();
    if (onStop) onStop();
    sfx.fail();
    showOverlay("Não foi dessa vez", msg, "Tentar de novo");
  }

  function win() {
    if (!running) return;
    running = false;
    stopTimer();
    if (onStop) onStop();
    const sec = elapsed();
    finalScore = Math.max(3, Math.round(sec));
    timerEl.textContent = formatTime(sec);
    sfx.win();
    completeLevel(game, level);
    renderLevels();
    $("win-title").textContent = level >= total
      ? `🏆 Você zerou o jogo! ${formatTime(finalScore)}`
      : `🎉 Nível ${level} em ${formatTime(finalScore)}`;
    submitBox.hidden = false;
    winActions.hidden = level >= total;
    submitBtn.disabled = false;
    submitMsg.textContent = "";
    submitMsg.className = "msg";
    renderSubmit();
  }

  // ---------- níveis ----------
  function renderLevels() {
    const box = $("levels");
    box.innerHTML = "";
    for (let n = 1; n <= total; n++) {
      const open = isUnlocked(game, n);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "lv" + (isDone(game, n) ? " done" : "") + (n === level ? " cur" : "") + (open ? "" : " locked");
      b.textContent = open ? String(n) : "🔒";
      b.disabled = !open;
      b.title = goalText(n);
      b.setAttribute("aria-label", open ? `Nível ${n}` : `Nível ${n} bloqueado`);
      b.addEventListener("click", () => { userPicked = true; initAudio(); sfx.tick(); select(n); });
      box.appendChild(b);
    }
  }
  $("next-btn").addEventListener("click", () => {
    if (needsLogin(level + 1)) return openAuth("login");
    userPicked = true; initAudio(); sfx.tick(); select(level + 1);
  });
  $("restart-btn").addEventListener("click", () => { initAudio(); sfx.tick(); select(level); });

  // ---------- ranking ----------
  let authUser = null;
  let authNick = null;
  onAuthChange(({ user, nickname }) => { authUser = user; authNick = nickname; renderSubmit(); });

  function renderSubmit() {
    if (saved) return;
    if (authUser) {
      submitInfo.textContent = `Sua nota será salva como ${authNick || "jogador"}.`;
      submitBtn.textContent = "Salvar no ranking";
    } else {
      submitInfo.textContent = "Entre na sua conta para salvar sua nota no ranking.";
      submitBtn.textContent = "Entrar para salvar";
    }
  }

  submitBtn.addEventListener("click", async () => {
    if (finalScore === null || saved) return;
    if (!authUser) { openAuth("login"); return; }
    submitBtn.disabled = true;
    submitMsg.className = "msg";
    submitMsg.textContent = "Salvando...";
    try {
      await saveScore(game, finalScore, level);
      saved = true;
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
    const list = $("ranking-list");
    list.innerHTML = '<li class="empty">Carregando...</li>';
    const empty = (txt) => { list.innerHTML = ""; const li = document.createElement("li"); li.className = "empty"; li.textContent = txt; list.appendChild(li); };
    try {
      const rows = await getRanking(game, { ascending: true, limit: 10, level: asked });
      if (asked !== level) return;
      if (!rows.length) return empty("Ninguém no ranking deste nível ainda. Seja o primeiro!");
      list.innerHTML = "";
      rows.forEach((row, i) => {
        const li = document.createElement("li");
        const pos = document.createElement("span"); pos.className = "pos"; pos.textContent = `${i + 1}º`;
        const name = document.createElement("span"); name.className = "name"; name.textContent = row.player_name;
        const val = document.createElement("span"); val.className = "val"; val.textContent = formatTime(row.score);
        li.append(pos, name, val);
        list.appendChild(li);
      });
    } catch (err) { empty(err.message); }
  }

  // ---------- som ----------
  const muteBtn = $("mute-btn");
  const renderMute = () => {
    muteBtn.textContent = isMuted() ? "🔇 Som desligado" : "🔊 Som ligado";
    muteBtn.setAttribute("aria-pressed", String(isMuted()));
  };
  muteBtn.addEventListener("click", () => { initAudio(); setMuted(!isMuted()); renderMute(); if (!isMuted()) sfx.saved(); });
  renderMute();

  mountMoreLevels(game);

  // ---------- início ----------
  const fromHash = parseInt(location.hash.slice(1), 10);
  userPicked = Number.isFinite(fromHash);
  select(Number.isFinite(fromHash) ? fromHash : 1);
  onProgress(() => {
    renderLevels();
    const untouched = !running && finalScore === null && !overlay.hidden;
    const target = firstOpen(game, total);
    if (!userPicked && untouched && target !== level) select(target);
  });

  return { win, lose, isRunning: () => running, level: () => level };
}
