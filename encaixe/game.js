import { getRanking, saveScore } from "/js/supabase.js";
import { initAudio, sfx, isMuted, setMuted } from "/js/sound.js";
import { onAuthChange, openAuth } from "/js/account.js";
import { mountMoreLevels } from "/js/more-levels.js";
import { onProgress, isDone, isUnlocked, firstOpen, completeLevel } from "/js/progress.js";
import { CHALLENGES } from "/encaixe/challenges.js";
import {
  ROWS, COLS, BOARD, NAMES,
  orient, computePlacement, emptyOccupancy, formatTime,
} from "/encaixe/logic.js";

const GAME = "encaixe";
const SHAPE_COLOR = { O: "#ff4f81", X: "#ffd23f", S: "#4fc3ff" };

const $ = (id) => document.getElementById(id);
const boardEl = $("board");
const trayEl = $("tray");
const overlay = $("overlay");
const overlayTitle = $("overlay-title");
const timerEl = $("timer");
const levelLabel = $("level-label");
const rankLevel = $("rank-level");
const rankingList = $("ranking-list");
const submitBox = $("submit-box");
const submitInfo = $("submit-info");
const submitBtn = $("submit-btn");
const submitMsg = $("submit-msg");
const winTitle = $("win-title");
const winActions = $("win-actions");
const levelsEl = $("levels");

// ---------- estado ----------
let level = 1;
let instances = [];      // { id, name, rot }
let occupied = emptyOccupancy();
let placed = {};         // id -> [[r,c], ...]
let selected = null;     // id da peça escolhida
let hover = null;        // [r, c] sob o mouse
let running = false;
let startTime = 0;
let timerId = null;
let finalSeconds = null;
let alreadySaved = false;

// ---------- desenho ----------
function pieceColor(name) {
  return `hsl(${NAMES.indexOf(name) * 26} 70% 62%)`;
}

function shapeSVG(s) {
  const body =
    s === "O" ? '<circle cx="12" cy="12" r="7.5"/>'
    : s === "S" ? '<rect x="4.5" y="4.5" width="15" height="15" rx="2"/>'
    : '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>';
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
}

const cellEls = [];
function buildBoard() {
  boardEl.innerHTML = "";
  for (let r = 0; r < ROWS; r++) {
    cellEls[r] = [];
    for (let c = 0; c < COLS; c++) {
      const s = BOARD[r][c];
      const el = document.createElement("div");
      el.className = "cell";
      el.style.setProperty("--shape", SHAPE_COLOR[s]);
      el.innerHTML = shapeSVG(s);
      el.addEventListener("click", () => onCellClick(r, c));
      el.addEventListener("pointerenter", (e) => {
        if (e.pointerType === "mouse") { hover = [r, c]; renderBoard(); }
      });
      cellEls[r][c] = el;
      boardEl.appendChild(el);
    }
  }
  boardEl.addEventListener("pointerleave", () => { hover = null; renderBoard(); });
}

function currentPreview() {
  if (!running || selected === null || hover === null) return null;
  const inst = instances[selected];
  return computePlacement(inst.name, inst.rot, hover[0], hover[1], occupied);
}

function renderBoard() {
  const pv = currentPreview();
  const pvSet = new Set();
  if (pv) pv.cells.forEach(([r, c]) => pvSet.add(`${r},${c}`));
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const el = cellEls[r][c];
      const id = occupied[r][c];
      el.className = "cell";
      el.style.removeProperty("--pc");
      if (id !== null) {
        el.classList.add("covered");
        el.style.setProperty("--pc", pieceColor(instances[id].name));
      }
      if (pv && pvSet.has(`${r},${c}`)) {
        el.classList.add(pv.ok ? "pv-ok" : "pv-bad");
        if (r === hover[0] && c === hover[1]) el.classList.add("anchor");
      }
    }
  }
}

function renderTray() {
  trayEl.innerHTML = "";
  instances.forEach((inst) => {
    const cells = orient(inst.name, inst.rot);
    const h = Math.max(...cells.map((x) => x[0])) + 1;
    const w = Math.max(...cells.map((x) => x[1])) + 1;

    const card = document.createElement("button");
    card.type = "button";
    card.className = "pcard" + (selected === inst.id ? " sel" : "") + (placed[inst.id] ? " used" : "");
    card.style.setProperty("--pc", pieceColor(inst.name));
    card.setAttribute("aria-label", `Peça ${inst.name}`);

    const grid = document.createElement("div");
    grid.className = "pgrid";
    grid.style.gridTemplateColumns = `repeat(${w}, var(--tc))`;
    grid.style.gridTemplateRows = `repeat(${h}, var(--tc))`;
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const idx = cells.findIndex((x) => x[0] === r && x[1] === c);
        const d = document.createElement("div");
        if (idx === -1) {
          d.className = "pgap";
        } else {
          d.className = "pcell" + (idx === 0 ? " anchor" : "");
          d.innerHTML = shapeSVG(cells[idx][2]);
        }
        grid.appendChild(d);
      }
    }
    card.appendChild(grid);
    card.addEventListener("click", () => onCardClick(inst.id));
    trayEl.appendChild(card);
  });
}

function renderLevels() {
  levelsEl.innerHTML = "";
  CHALLENGES.forEach((ch) => {
    const open = isUnlocked(GAME, ch.id);
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lv"
      + (isDone(GAME, ch.id) ? " done" : "")
      + (ch.id === level ? " cur" : "")
      + (open ? "" : " locked");
    b.textContent = open ? String(ch.id) : "🔒";
    b.disabled = !open;
    b.setAttribute("aria-label", open ? `Desafio ${ch.id}` : `Desafio ${ch.id} bloqueado`);
    b.addEventListener("click", () => {
      userPicked = true;
      initAudio();
      sfx.tick();
      startLevel(ch.id);
    });
    levelsEl.appendChild(b);
  });
}

// ---------- jogo ----------
function unplace(id) {
  (placed[id] || []).forEach(([r, c]) => { occupied[r][c] = null; });
  delete placed[id];
}

function onCardClick(id) {
  if (!running) return;
  initAudio();
  if (placed[id]) {
    unplace(id);
    selected = id;
    sfx.tick();
  } else if (selected === id) {
    rotateSelected();
    return;
  } else {
    selected = id;
    sfx.tick();
  }
  renderBoard();
  renderTray();
}

function onCellClick(r, c) {
  if (!running) return;
  initAudio();
  const occ = occupied[r][c];
  if (occ !== null) {
    unplace(occ);
    selected = occ;
    sfx.tick();
    hover = [r, c];
    renderBoard();
    renderTray();
    return;
  }
  if (selected === null) return;
  const inst = instances[selected];
  const res = computePlacement(inst.name, inst.rot, r, c, occupied);
  if (!res.ok) {
    sfx.fail();
    return;
  }
  res.cells.forEach(([rr, cc]) => { occupied[rr][cc] = inst.id; });
  placed[inst.id] = res.cells;
  selected = null;
  sfx.place();
  renderBoard();
  renderTray();
  checkWin();
}

function rotateSelected() {
  if (!running || selected === null) return;
  initAudio();
  const inst = instances[selected];
  inst.rot = (inst.rot + 1) % 4;
  sfx.tick();
  renderBoard();
  renderTray();
}

function tickTimer() {
  const secs = Math.floor((performance.now() - startTime) / 1000);
  timerEl.textContent = formatTime(secs);
}

function checkWin() {
  if (!occupied.every((row) => row.every((v) => v !== null))) return;
  running = false;
  clearInterval(timerId);
  const elapsed = (performance.now() - startTime) / 1000;
  finalSeconds = Math.max(5, Math.round(elapsed));
  timerEl.textContent = formatTime(finalSeconds);
  completeLevel(GAME, level); // libera o próximo desafio
  renderLevels();
  sfx.win();
  winTitle.textContent = `🎉 Completou em ${formatTime(finalSeconds)}!`;
  submitBox.hidden = false;
  winActions.hidden = level >= CHALLENGES.length;
  submitBtn.disabled = false;
  submitMsg.textContent = "";
  submitMsg.className = "msg";
  alreadySaved = false;
  renderSubmit();
}

function startLevel(n) {
  // desafio bloqueado: vai para o primeiro que ainda não foi concluído
  if (!isUnlocked(GAME, n)) n = firstOpen(GAME, CHALLENGES.length);
  const ch = CHALLENGES.find((c) => c.id === n) || CHALLENGES[0];
  level = ch.id;
  try { history.replaceState(null, "", `#${level}`); } catch (_) {}

  clearInterval(timerId);
  running = false;
  finalSeconds = null;
  selected = null;
  hover = null;
  occupied = emptyOccupancy();
  placed = {};
  instances = ch.pieces.split("").map((name, id) => ({ id, name, rot: 0 }));

  timerEl.textContent = "00:00";
  levelLabel.textContent = `Desafio ${level} de ${CHALLENGES.length}`;
  rankLevel.textContent = `Desafio ${level}`;
  overlayTitle.textContent = `Desafio ${level}`;
  overlay.hidden = false;
  submitBox.hidden = true;

  renderBoard();
  renderTray();
  renderLevels();
  loadRanking();
}

function begin() {
  initAudio();
  overlay.hidden = true;
  running = true;
  startTime = performance.now();
  clearInterval(timerId);
  timerId = setInterval(tickTimer, 200);
  sfx.go();
}

$("start-btn").addEventListener("click", begin);
$("restart-btn").addEventListener("click", () => { initAudio(); sfx.tick(); startLevel(level); });
$("rotate-btn").addEventListener("click", rotateSelected);
$("next-btn").addEventListener("click", () => {
  userPicked = true;
  initAudio();
  sfx.tick();
  startLevel(level + 1);
});

document.addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (e.key === "r" || e.key === "R") { e.preventDefault(); rotateSelected(); }
  if (e.key === "Escape") { selected = null; renderBoard(); renderTray(); }
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
    submitInfo.textContent = `Seu tempo será salvo como ${authNick || "jogador"}.`;
    submitBtn.textContent = "Salvar no ranking";
  } else {
    submitInfo.textContent = "Entre na sua conta para salvar seu tempo no ranking.";
    submitBtn.textContent = "Entrar para salvar";
  }
}

submitBtn.addEventListener("click", async () => {
  if (finalSeconds === null || alreadySaved) return;
  if (!authUser) { openAuth("login"); return; }

  submitBtn.disabled = true;
  submitMsg.className = "msg";
  submitMsg.textContent = "Salvando...";
  try {
    await saveScore(GAME, finalSeconds, level);
    alreadySaved = true;
    submitInfo.textContent = "Tempo salvo no ranking.";
    initAudio();
    sfx.saved();
    submitMsg.className = "msg ok";
    submitMsg.textContent = "Tempo salvo! 🎉";
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
    if (asked !== level) return; // trocou de desafio enquanto carregava
    rankingList.innerHTML = "";
    if (!rows.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "Ninguém no ranking deste desafio ainda. Seja o primeiro!";
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
      val.textContent = formatTime(row.score);
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
buildBoard();
const fromHash = parseInt(location.hash.slice(1), 10);
let userPicked = Number.isFinite(fromHash);
startLevel(Number.isFinite(fromHash) ? fromHash : 1);

onProgress(() => {
  renderLevels();
  // o progresso da conta chega depois da página abrir: leva ao primeiro desafio em aberto
  const untouched = !running && finalSeconds === null && Object.keys(placed).length === 0;
  const target = firstOpen(GAME, CHALLENGES.length);
  if (!userPicked && untouched && target !== level) startLevel(target);
});

mountMoreLevels(GAME);
