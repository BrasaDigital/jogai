// Jogo diário: uma palavra por dia, igual para todos (vem do banco, liberada só no dia).
import "/js/account.js";
import { supabase } from "/js/supabase.js";
import { onAuthChange, openAuth } from "/js/account.js";
import { sfx, initAudio, isMuted, setMuted } from "/js/sound.js";
import { avaliar } from "/termo/engine.js";
import { TRIES, spHoje, diasEntre, estatisticas } from "/termo/stats.js";

const $ = (id) => document.getElementById(id);
const LINHAS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const INICIO = "2026-10-12"; // dia da palavra nº 1
const EMOJI = ["⬛", "🟨", "🟩"];

const bonito = (s) => s.slice(8) + "/" + s.slice(5, 7);
export const formatTime = (sec) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
const safe = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };

export function textoCompartilhar(nome, n, ganhou, tries, linhas) {
  return `Jogaí ${nome} #${n} ${ganhou ? tries : "X"}/${TRIES}\n\n` + linhas.map((r) => r.map((v) => EMOJI[v]).join("")).join("\n") + "\n\nhttps://jogai-iota.vercel.app";
}

export function criarDiario({ game, nome, comex }) {
  const hoje = spHoje();
  const n = diasEntre(INICIO, hoje) + 1;
  const KS = `jogai_dia_${game}`, KH = `jogai_dia_hist_${game}`, KW = `jogai_dia_word_${game}`;
  let palavra = null, dica = "", len = 5, dic = null;
  let st = { day: hoje, guesses: [], t0: null, done: false, won: false, secs: 0, saved: false };
  let cur = [], hist = safe.get(KH) || {}, user = null, timerId = 0, msgTimer = 0;
  const saved = safe.get(KS);
  if (saved && saved.day === hoje) st = saved;
  const gravar = () => safe.set(KS, st);
  const msg = $("hud-s");
  const aviso = (t, ms = 1800) => { msg.textContent = t; clearTimeout(msgTimer); if (ms) msgTimer = setTimeout(() => (msg.innerHTML = "&nbsp;"), ms); };

  $("dia-label").textContent = `${nome} #${Math.max(n, 1)} · ${bonito(hoje)}`;

  // ---------- som ----------
  const mute = $("mute-btn");
  const pintaMute = () => { mute.textContent = isMuted() ? "🔇 Som desligado" : "🔊 Som ligado"; mute.setAttribute("aria-pressed", String(isMuted())); };
  mute.addEventListener("click", () => { initAudio(); setMuted(!isMuted()); pintaMute(); if (!isMuted()) sfx.saved(); });
  pintaMute();

  // ---------- tabuleiro ----------
  const area = $("tboards"), kb = $("tkeys");
  function montar() {
    area.innerHTML = ""; area.dataset.n = 1;
    const el = document.createElement("div");
    el.className = "tb dia"; el.style.setProperty("--len", len);
    for (let r = 0; r < TRIES; r++) for (let k = 0; k < len; k++) { const d = document.createElement("div"); d.className = "tc"; el.appendChild(d); }
    area.appendChild(el);
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
    const b = document.createElement("button"); b.type = "button"; b.className = "tk" + (larga ? " big" : ""); b.dataset.k = valor; b.textContent = txt; return b;
  }
  function desenhar() {
    const el = area.firstChild; if (!el) return;
    const teclas = {};
    for (let r = 0; r < TRIES; r++) {
      const g = st.guesses[r];
      const res = g ? avaliar(g, palavra) : null;
      for (let k = 0; k < len; k++) {
        const c = el.children[r * len + k];
        let cls = "tc", txt = "";
        if (g) { cls += " s" + res[k]; txt = g[k]; teclas[g[k]] = Math.max(teclas[g[k]] ?? -1, res[k]); }
        else if (r === st.guesses.length && !st.done) { txt = cur[k] || ""; if (txt) cls += " typed"; }
        c.className = cls; c.textContent = txt;
      }
    }
    kb.querySelectorAll(".tk").forEach((t) => { t.classList.remove("s0", "s1", "s2"); const s = teclas[t.dataset.k]; if (s !== undefined) t.classList.add("s" + s); });
    $("hud-l").textContent = `Tentativas: ${st.guesses.length} / ${TRIES} · ${len} letras`;
  }

  function iniciaRelogio() {
    if (timerId || st.done || !st.t0) return;
    const tick = () => { $("timer").textContent = formatTime(Math.min(7200, (Date.now() - st.t0) / 1000)); };
    tick(); timerId = setInterval(tick, 500);
  }
  function digitar(ch) {
    if (st.done || !palavra) return;
    const i = cur.findIndex((x) => !x); if (i < 0) return;
    initAudio();
    if (!st.t0) { st.t0 = Date.now(); gravar(); iniciaRelogio(); }
    cur[i] = ch; sfx.tick(); desenhar();
  }
  function apagar() { if (st.done) return; for (let i = len - 1; i >= 0; i--) if (cur[i]) { cur[i] = ""; break; } desenhar(); }
  function enviar() {
    if (st.done || !palavra) return;
    if (cur.some((x) => !x)) { sfx.fail(); return aviso("Faltam letras"); }
    const g = cur.join("");
    if (dic && !dic.has(g)) { sfx.fail(); area.classList.add("shake"); setTimeout(() => area.classList.remove("shake"), 400); return aviso("Palavra não encontrada"); }
    initAudio();
    st.guesses.push(g); cur = Array(len).fill(""); sfx.place();
    if (g === palavra) fim(true);
    else if (st.guesses.length >= TRIES) fim(false);
    gravar(); desenhar();
  }

  // ---------- fim, estatísticas, compartilhar ----------
  function fim(ganhou) {
    st.done = true; st.won = ganhou;
    st.secs = Math.min(7200, Math.max(0, Math.round((Date.now() - (st.t0 || Date.now())) / 1000)));
    clearInterval(timerId); $("timer").textContent = formatTime(st.secs);
    hist[hoje] = { won: ganhou, tries: st.guesses.length };
    safe.set(KH, hist);
    ganhou ? sfx.win() : sfx.fail();
    gravar(); resultado(); salvar();
  }
  function linhasEmoji() { return st.guesses.map((g) => avaliar(g, palavra)); }

  function resultado() {
    $("dia-result").hidden = false;
    $("res-title").textContent = st.won ? `🎉 Acertou em ${st.guesses.length}/${TRIES}!` : "Não foi dessa vez";
    $("res-sub").textContent = st.won ? `Tempo: ${formatTime(st.secs)}` : `A palavra era ${palavra}.`;
    $("res-dica").textContent = dica ? `${palavra}: ${dica}` : "";
    const s = estatisticas(hist, hoje);
    $("stat-jogos").textContent = s.jogos;
    $("stat-vit").textContent = s.jogos ? Math.round((s.vit / s.jogos) * 100) + "%" : "0%";
    $("stat-seq").textContent = s.seq;
    $("stat-melhor").textContent = s.melhor;
    const max = Math.max(1, ...s.dist);
    $("dist").innerHTML = s.dist.map((v, i) => `<div class="drow"><span>${i + 1}</span><div class="dbar${st.won && st.guesses.length === i + 1 ? " me" : ""}" style="width:${Math.max(8, (v / max) * 100)}%">${v}</div></div>`).join("");
    pintaSalvar(); contagem();
  }
  const share = $("share-btn");
  share.addEventListener("click", async () => {
    const t = textoCompartilhar(nome, Math.max(n, 1), st.won, st.guesses.length, linhasEmoji());
    try {
      if (navigator.share) await navigator.share({ text: t });
      else { await navigator.clipboard.writeText(t); $("share-msg").textContent = "Resultado copiado! Cole onde quiser."; }
    } catch (_) { try { await navigator.clipboard.writeText(t); $("share-msg").textContent = "Resultado copiado! Cole onde quiser."; } catch (__) { $("share-msg").textContent = "Não consegui copiar."; } }
  });
  let cd = 0;
  function contagem() {
    clearInterval(cd);
    const tick = () => {
      const p = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(new Date());
      const g = (t) => Number(p.find((x) => x.type === t).value) % 24;
      const rest = 86400 - (g("hour") * 3600 + g("minute") * 60 + g("second"));
      $("next-in").textContent = `${String(Math.floor(rest / 3600)).padStart(2, "0")}:${String(Math.floor((rest % 3600) / 60)).padStart(2, "0")}:${String(rest % 60).padStart(2, "0")}`;
      if (rest >= 86399 && st.done) location.reload();
    };
    tick(); cd = setInterval(tick, 1000);
  }

  // ---------- conta: salvar no ranking e juntar o histórico ----------
  function pintaSalvar() {
    if (!st.done) return;
    const box = $("save-info"), btn = $("save-btn");
    if (st.saved) { box.textContent = "Resultado salvo no ranking de hoje."; btn.hidden = true; return; }
    if (!st.won) { box.textContent = "Só quem acerta entra no ranking do dia. Amanhã tem outra!"; btn.hidden = true; return; }
    if (!user) { box.textContent = "Entre na sua conta para guardar a sequência e entrar no ranking do dia."; btn.hidden = false; btn.textContent = "Entrar para salvar"; return; }
    box.textContent = "Salvando..."; btn.hidden = true;
  }
  $("save-btn").addEventListener("click", () => { if (!user) openAuth("login"); else salvar(); });
  let salvando = false;
  async function salvar() {
    if (!st.done || st.saved || !user || salvando) return;
    salvando = true;
    try {
      const { error } = await supabase.from("daily_results").insert({ game, day: hoje, won: st.won, tries: st.guesses.length, seconds: st.secs });
      if (error && error.code !== "23505") throw error;
      st.saved = true; gravar(); sfx.saved();
    } catch (_) { $("save-info").textContent = "Não foi possível salvar agora."; $("save-btn").hidden = false; $("save-btn").textContent = "Tentar de novo"; }
    salvando = false; pintaSalvar(); ranking();
  }
  async function juntarHistorico() {
    try {
      const { data, error } = await supabase.from("daily_results").select("day,won,tries").eq("game", game);
      if (error || !data) return;
      data.forEach((r) => { if (!hist[r.day]) hist[r.day] = { won: r.won, tries: r.tries }; });
      safe.set(KH, hist);
      if (st.done) resultado();
    } catch (_) {}
  }
  async function ranking() {
    const list = $("ranking-list");
    const vazio = (t) => { list.innerHTML = ""; const li = document.createElement("li"); li.className = "empty"; li.textContent = t; list.appendChild(li); };
    try {
      const { data, error } = await supabase.from("daily_results").select("player_name,tries,seconds").eq("game", game).eq("day", hoje).eq("won", true)
        .order("tries", { ascending: true }).order("seconds", { ascending: true }).limit(10);
      if (error) throw error;
      if (!data.length) return vazio("Ninguém acertou ainda hoje. Seja o primeiro!");
      list.innerHTML = "";
      data.forEach((r, i) => {
        const li = document.createElement("li");
        const pos = document.createElement("span"); pos.className = "pos"; pos.textContent = `${i + 1}º`;
        const nm = document.createElement("span"); nm.className = "name"; nm.textContent = r.player_name;
        const v = document.createElement("span"); v.className = "val"; v.textContent = `${r.tries}/${TRIES} · ${formatTime(r.seconds)}`;
        li.append(pos, nm, v); list.appendChild(li);
      });
    } catch (_) { vazio("Não foi possível carregar o ranking."); }
  }
  onAuthChange(({ user: u }) => {
    const mudou = (u && u.id) !== (user && user.id);
    user = u || null;
    if (!mudou) return;
    if (user) { juntarHistorico(); if (st.done) { pintaSalvar(); salvar(); } }
    else pintaSalvar();
  });

  // ---------- começar ----------
  async function carregarDicionario(l) {
    try { dic = new Set((await (await fetch(`/termo/dict/${l}.txt`)).text()).split("\n").filter(Boolean)); } catch (_) { dic = null; }
  }
  async function palavraDeHoje() {
    const c = safe.get(KW);
    if (c && c.day === hoje && c.word) return c;
    const { data, error } = await supabase.from("daily_words").select("word,hint").eq("game", game).eq("day", hoje).maybeSingle();
    if (error || !data) return null;
    const v = { day: hoje, word: data.word, hint: data.hint || "" };
    safe.set(KW, v); return v;
  }
  async function iniciar() {
    ranking();
    if (n < 1) { aviso(`O primeiro ${nome} sai em ${bonito(INICIO)}. Volte lá!`, 0); kb.hidden = true; return; }
    const w = await palavraDeHoje();
    if (!w) { aviso("A palavra de hoje ainda não está disponível. Tente de novo em instantes.", 0); kb.hidden = true; return; }
    palavra = w.word; dica = w.hint; len = palavra.length;
    await carregarDicionario(len);
    cur = Array(len).fill(""); montar();
    if (comex && dica && !st.done) aviso("Dica: " + dica, 0);
    if (st.t0 && !st.done) iniciaRelogio();
    desenhar();
    if (st.done) { $("timer").textContent = formatTime(st.secs); resultado(); }
  }

  kb.addEventListener("pointerdown", (e) => {
    const t = e.target.closest(".tk"); if (!t) return;
    e.preventDefault(); const v = t.dataset.k;
    if (v === "ENTER") enviar(); else if (v === "DEL") apagar(); else digitar(v);
  });
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Enter") { e.preventDefault(); enviar(); }
    else if (e.key === "Backspace") { e.preventDefault(); apagar(); }
    else if (/^[a-zA-Z]$/.test(e.key)) digitar(e.key.toUpperCase());
  });
  iniciar();
}
