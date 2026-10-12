import { createKit } from "/js/kit.js";
import { sfx, initAudio } from "/js/sound.js";
import { avaliar } from "/termo/engine.js";

const $ = (id) => document.getElementById(id);
const LINHAS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const dicts = {};
const pools = {};
async function lerLinhas(url) {
  try { return (await (await fetch(url)).text()).split("\n").filter(Boolean); } catch (_) { return null; }
}
async function carregar(len) {
  if (!dicts[len]) { const l = await lerLinhas(`/termo/dict/${len}.txt`); dicts[len] = l && new Set(l); }
  if (!pools[len]) pools[len] = (await lerLinhas(`/termo/respostas/${len}.txt`)) || [];
  return dicts[len];
}

// cfg: { game, nivel(n) -> {len, tries, boards}, escolher(len, qtd, n) -> [{palavra, dica?}], goalText(n), lingo? }
export function criarJogoPalavras(cfg) {
  let c = null, boards = [], cur = [], fixo = [], gastas = 0, conhecidas = [], teclas = {}, msgTimer = 0;
  const area = $("tboards"), kb = $("tkeys"), msg = $("hud-s");

  function aviso(t, ms = 1800) {
    msg.textContent = t; clearTimeout(msgTimer);
    if (ms) msgTimer = setTimeout(() => (msg.innerHTML = "&nbsp;"), ms);
  }

  function montar() {
    area.innerHTML = "";
    area.dataset.n = boards.length;
    boards.forEach((b, bi) => {
      const el = document.createElement("div");
      el.className = "tb"; el.style.setProperty("--len", c.len);
      for (let r = 0; r < c.tries; r++) for (let k = 0; k < c.len; k++) {
        const d = document.createElement("div"); d.className = "tc"; d.dataset.b = bi; d.dataset.r = r; d.dataset.k = k; el.appendChild(d);
      }
      area.appendChild(el);
    });
    kb.innerHTML = "";
    LINHAS.forEach((l, i) => {
      const row = document.createElement("div"); row.className = "kr";
      if (i === 2) row.appendChild(tecla("ENTER", "↵", true));
      [...l].forEach((ch) => row.appendChild(tecla(ch, ch)));
      if (i === 2) row.appendChild(tecla("DEL", "⌫", true));
      kb.appendChild(row);
    });
  }
  function tecla(valor, txt, larga) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "tk" + (larga ? " big" : ""); b.dataset.k = valor; b.textContent = txt;
    return b;
  }

  function desenhar() {
    boards.forEach((b, bi) => {
      for (let r = 0; r < c.tries; r++) for (let k = 0; k < c.len; k++) {
        const el = area.children[bi].children[r * c.len + k];
        const lin = b.rows[r];
        let cls = "tc", txt = "";
        if (lin) { cls += " s" + lin.res[k]; txt = lin.palavra[k]; }
        else if (r === gastas && !b.done) {
          txt = cur[k] || "";
          if (txt) cls += fixo[k] ? " fx" : " typed";
        }
        el.className = cls; el.textContent = txt;
      }
    });
    kb.querySelectorAll(".tk").forEach((t) => {
      const s = teclas[t.dataset.k];
      t.classList.remove("s0", "s1", "s2");
      if (s !== undefined) t.classList.add("s" + s);
    });
    $("hud-l").textContent = `Tentativas: ${gastas} / ${c.tries}` + (boards.length > 1 ? ` · Palavras: ${boards.filter((b) => b.done).length} / ${boards.length}` : "");
  }

  function prepararLinha() {
    cur = Array(c.len).fill(""); fixo = Array(c.len).fill(false);
    if (cfg.lingo) conhecidas.forEach((ch, i) => { if (ch) { cur[i] = ch; fixo[i] = true; } });
  }

  function digitar(ch) {
    if (!kit.isRunning()) return;
    const i = cur.findIndex((x, k) => !x && !fixo[k]);
    if (i < 0) return;
    initAudio(); cur[i] = ch; sfx.tick(); desenhar();
  }
  function apagar() {
    if (!kit.isRunning()) return;
    for (let i = c.len - 1; i >= 0; i--) if (cur[i] && !fixo[i]) { cur[i] = ""; break; }
    desenhar();
  }
  async function enviar() {
    if (!kit.isRunning()) return;
    if (cur.some((x) => !x)) { sfx.fail(); return aviso("Faltam letras"); }
    const palavra = cur.join("");
    const dic = dicts[c.len];
    if (dic && !dic.has(palavra)) { sfx.fail(); area.classList.add("shake"); setTimeout(() => area.classList.remove("shake"), 400); return aviso("Palavra não encontrada"); }
    initAudio();
    boards.forEach((b) => {
      if (b.done) { b.rows.push(null); return; }
      const res = avaliar(palavra, b.palavra);
      b.rows.push({ palavra, res });
      for (let k = 0; k < c.len; k++) teclas[palavra[k]] = Math.max(teclas[palavra[k]] ?? -1, res[k]);
      if (res.every((v) => v === 2)) b.done = true;
    });
    gastas++;
    if (cfg.lingo) boards[0].rows[gastas - 1].res.forEach((v, k) => { if (v === 2) conhecidas[k] = palavra[k]; });
    prepararLinha(); sfx.place(); desenhar();
    if (boards.every((b) => b.done)) return kit.win();
    if (gastas >= c.tries) {
      const falt = boards.filter((b) => !b.done).map((b) => b.palavra).join(", ");
      kit.lose(`Acabaram as tentativas. ${boards.length > 1 ? "Faltaram" : "A palavra era"}: ${falt}.`);
    }
  }

  function rodada(n) {
    c = cfg.nivel(n);
    const sorteadas = cfg.escolher(c.len, c.boards, n, pools[c.len] || []);
    boards = sorteadas.map((s) => ({ palavra: s.palavra, dica: s.dica || "", rows: [], done: false }));
    gastas = 0; teclas = {};
    conhecidas = Array(c.len).fill("");
    if (cfg.lingo) conhecidas[0] = boards[0].palavra[0];
    prepararLinha(); montar(); desenhar();
    if (boards.length === 1 && boards[0].dica) aviso("Dica: " + boards[0].dica, 0); else msg.innerHTML = "&nbsp;";
  }

  const kit = createKit({
    game: cfg.game,
    total: 10,
    goalText: cfg.goalText,
    onSelect(n) { const len = cfg.nivel(n).len; carregar(len); rodada(n); },
    onBegin(n) { rodada(n); },
    onStop() {},
  });

  kb.addEventListener("pointerdown", (e) => {
    const t = e.target.closest(".tk"); if (!t) return;
    e.preventDefault();
    const v = t.dataset.k;
    if (v === "ENTER") enviar(); else if (v === "DEL") apagar(); else digitar(v);
  });
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || !kit.isRunning()) return;
    if (e.key === "Enter") { e.preventDefault(); enviar(); }
    else if (e.key === "Backspace") { e.preventDefault(); apagar(); }
    else if (/^[a-zA-Z]$/.test(e.key)) digitar(e.key.toUpperCase());
  });
  return kit;
}
