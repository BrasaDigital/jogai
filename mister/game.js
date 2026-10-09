import { supabase } from "/js/supabase.js";
import { onAuthChange } from "/js/account.js";
import {
  FORMATIONS, POS_ORDER, POS_NAME, novaLiga, melhorTime, escalacaoValida, forcaDoTime,
  simularPartida, jogarRodada, tabela, artilheiros, temporadaAcabou, ajustaIA, novaTemporada,
} from "/mister/engine.js";

const $ = (id) => document.getElementById(id);
const KEY = "jogai_mister_save";

let save = null;   // { v, liga, usuario, updatedAt }
let user = null;
let tocando = false;
let selecionado = null; // id do titular escolhido para troca
let timer = null;

const me = () => save.liga.times[save.usuario];
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };

// ---------- salvar / carregar ----------
function lerLocal() {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (_) { return null; }
}
let cloudTimer = null;
function gravar() {
  save.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (_) {}
  $("m-saved").textContent = user ? "salvo na conta" : "salvo neste aparelho";
  if (!user) return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(async () => {
    const { error } = await supabase.from("career_saves").upsert(
      { user_id: user.id, game: "mister", data: save, updated_at: new Date(save.updatedAt).toISOString() },
      { onConflict: "user_id,game" });
    $("m-saved").textContent = error ? "salvo só neste aparelho" : "salvo na conta";
  }, 800);
}

async function buscarNuvem() {
  if (!user) return;
  const { data, error } = await supabase.from("career_saves").select("data,updated_at").eq("game", "mister").maybeSingle();
  if (error || !data) { if (save) gravar(); return; }
  const nuvem = data.data;
  if (!save || (nuvem.updatedAt || 0) > (save.updatedAt || 0)) {
    save = nuvem;
    try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (_) {}
    render();
  } else if (save.updatedAt > (nuvem.updatedAt || 0)) gravar();
}

onAuthChange(({ user: u }) => {
  const mudou = (u && u.id) !== (user && user.id);
  user = u || null;
  if (mudou) buscarNuvem();
  if (save) $("m-saved").textContent = user ? "salvo na conta" : "salvo neste aparelho";
});

// ---------- escolha do clube ----------
function mostrarEscolha() {
  $("carreira").hidden = true;
  $("escolha").hidden = false;
  const liga = novaLiga();
  const box = $("clubes");
  box.innerHTML = "";
  liga.times.forEach((t) => {
    const b = el("button", "clube");
    b.type = "button";
    const badge = el("span", "badge");
    badge.style.background = `hsl(${t.hue} 70% 50%)`;
    const nome = el("b");
    nome.append(badge, t.nome);
    const forca = forcaDoTime(t.elenco, t.titulares).geral;
    b.append(nome, el("small", "", `Força ${forca}`));
    b.addEventListener("click", () => {
      save = { v: 1, liga, usuario: t.id, updatedAt: Date.now() };
      gravar();
      render();
    });
    box.appendChild(b);
  });
}

// ---------- tela principal ----------
function render() {
  if (!save) return mostrarEscolha();
  $("escolha").hidden = true;
  $("carreira").hidden = false;
  const liga = save.liga;
  $("m-clube").textContent = me().nome;
  $("m-temp").textContent = liga.temporada;
  $("m-rodada").textContent = liga.rodada;
  $("m-total").textContent = liga.calendario.length;
  $("m-saved").textContent = user ? "salvo na conta" : "salvo neste aparelho";
  renderJogo();
  renderEscalacao();
  renderTabela();
  renderArtilheiros();
}

function jogoDoUsuario() {
  const liga = save.liga;
  return liga.calendario[liga.rodada].find(([c, f]) => c === save.usuario || f === save.usuario);
}

function renderJogo() {
  const liga = save.liga;
  const next = $("m-next");
  const play = $("m-play");
  next.innerHTML = "";
  if (temporadaAcabou(liga)) {
    const t = tabela(liga);
    const pos = t.findIndex((x) => x.id === save.usuario) + 1;
    const f = el("div", "m-final");
    f.append(el("div", "", pos === 1 ? `🏆 ${me().nome} é o campeão da temporada ${liga.temporada}!` : `Temporada ${liga.temporada} encerrada.`));
    f.append(el("div", "vs", `${t[0].nome} foi campeão. Você terminou em ${pos}º lugar com ${t.find((x) => x.id === save.usuario).P} pontos.`));
    next.appendChild(f);
    play.textContent = "➡ Nova temporada";
    return;
  }
  const [c, f] = jogoDoUsuario();
  const H = liga.times[c], A = liga.times[f];
  const mando = c === save.usuario ? "em casa" : "fora de casa";
  next.append(el("div", "", `${H.nome} × ${A.nome}`));
  const rival = c === save.usuario ? A : H;
  next.append(el("span", "vs", `Rodada ${liga.rodada + 1} · você joga ${mando} · força do rival: ${forcaDoTime(rival.elenco, rival.titulares).geral} (a sua: ${forcaDoTime(me().elenco, me().titulares).geral})`));
  play.textContent = "▶ Jogar rodada";
}

// ---------- partida ao vivo ----------
function jogar() {
  if (tocando) return;
  const liga = save.liga;
  if (temporadaAcabou(liga)) {
    novaTemporada(liga);
    $("m-score").hidden = true; $("m-feed").innerHTML = ""; $("m-others").innerHTML = "";
    gravar(); render();
    return;
  }
  if (!escalacaoValida(me().elenco, me().formacao, me().titulares)) {
    $("m-next").appendChild(el("p", "msg err", "Sua escalação está inválida. Ajuste na aba Escalação."));
    return;
  }
  ajustaIA(liga, save.usuario);
  const [c, f] = jogoDoUsuario();
  const sim = simularPartida(liga.times[c], liga.times[f]);
  const H = liga.times[c], A = liga.times[f];
  const score = $("m-score"), feed = $("m-feed");
  score.hidden = false;
  feed.innerHTML = "";
  $("m-others").innerHTML = "";
  let i = 0, min = 0, placar = [0, 0];
  const mostra = () => { score.textContent = `${H.sigla} ${placar[0]} × ${placar[1]} ${A.sigla}  ·  ${min}'`; };
  mostra();
  tocando = true;
  $("m-play").disabled = true;
  $("m-skip").hidden = false;

  const passo = () => {
    min++;
    while (i < sim.lances.length && sim.lances[i].min === min) {
      const l = sim.lances[i++];
      if (l.placar) placar = l.placar;
      const li = el("li", l.tipo === "gol" ? "gol" : "");
      li.append(el("span", "min", `${l.min}'`), document.createTextNode(l.texto));
      feed.prepend(li);
    }
    mostra();
    if (min >= 90) fim();
  };
  const fim = () => {
    clearInterval(timer);
    min = 90; placar = sim.placar; mostra();
    // restante dos lances (caso tenha pulado)
    feed.innerHTML = "";
    sim.lances.slice().reverse().forEach((l) => {
      const li = el("li", l.tipo === "gol" ? "gol" : "");
      li.append(el("span", "min", `${l.min}'`), document.createTextNode(l.texto));
      feed.appendChild(li);
    });
    const saidas = jogarRodada(liga, Math.random, { casa: c, fora: f, sim });
    const box = $("m-others");
    box.innerHTML = "";
    box.appendChild(el("div", "", "Outros resultados da rodada:"));
    saidas.filter((s) => !(s.casa === c && s.fora === f)).forEach((s) => {
      const d = el("div");
      const b = el("b", "", `${liga.times[s.casa].sigla} ${s.placar[0]} × ${s.placar[1]} ${liga.times[s.fora].sigla}`);
      d.appendChild(b);
      box.appendChild(d);
    });
    tocando = false;
    $("m-play").disabled = false;
    $("m-skip").hidden = true;
    gravar();
    $("m-rodada").textContent = liga.rodada;
    renderJogo(); renderTabela(); renderArtilheiros(); renderEscalacao();
  };
  $("m-skip").onclick = fim;
  timer = setInterval(passo, 110);
}

// ---------- escalação ----------
function linhaJogador(j, cls) {
  const b = el("button", `jog ${cls || ""}`);
  b.type = "button";
  b.append(el("span", "pos", j.pos), el("span", "nome", j.nome), el("span", "idade", `${j.idade} anos`), el("span", "ovr", String(j.ovr)));
  return b;
}

function renderEscalacao() {
  const t = me();
  const sel = $("m-form");
  if (!sel.options.length) {
    Object.keys(FORMATIONS).forEach((f) => { const o = el("option", "", f); o.value = f; sel.appendChild(o); });
    sel.addEventListener("change", () => {
      if (tocando) { sel.value = me().formacao; return; }
      me().formacao = sel.value;
      me().titulares = melhorTime(me().elenco, sel.value);
      selecionado = null;
      gravar(); renderEscalacao(); renderJogo();
    });
  }
  sel.value = t.formacao;
  const forca = forcaDoTime(t.elenco, t.titulares);
  $("m-forca").textContent = `Força do time: ${forca.geral} · ataque ${Math.round(forca.ataque)} · defesa ${Math.round(forca.defesa)}`;

  const xi = $("m-xi"), bench = $("m-bench");
  xi.innerHTML = ""; bench.innerHTML = "";
  const titulares = t.titulares.map((id) => t.elenco.find((j) => j.id === id));
  const ordem = (a, b) => POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos) || b.ovr - a.ovr;
  const selJ = selecionado ? t.elenco.find((j) => j.id === selecionado) : null;

  titulares.sort(ordem).forEach((j) => {
    const b = linhaJogador(j, j.id === selecionado ? "sel" : "");
    b.title = POS_NAME[j.pos];
    b.addEventListener("click", () => { if (tocando) return; selecionado = selecionado === j.id ? null : j.id; renderEscalacao(); });
    xi.appendChild(b);
  });
  t.elenco.filter((j) => !t.titulares.includes(j.id)).sort(ordem).forEach((j) => {
    const alvo = selJ && selJ.pos === j.pos;
    const b = linhaJogador(j, alvo ? "alvo" : "");
    b.addEventListener("click", () => {
      if (tocando || !selJ || selJ.pos !== j.pos) return;
      t.titulares = t.titulares.map((id) => (id === selJ.id ? j.id : id));
      selecionado = null;
      gravar(); renderEscalacao(); renderJogo();
    });
    bench.appendChild(b);
  });
}

// ---------- tabela e artilheiros ----------
function renderTabela() {
  const tb = $("m-table");
  tb.innerHTML = "";
  const head = el("tr");
  ["#", "Time", "P", "J", "V", "E", "D", "SG"].forEach((h) => head.appendChild(el("th", "", h)));
  tb.appendChild(head);
  tabela(save.liga).forEach((x, i) => {
    const tr = el("tr", x.id === save.usuario ? "eu" : "");
    [i + 1, x.nome, x.P, x.J, x.V, x.E, x.D, x.SG].forEach((v) => tr.appendChild(el("td", "", String(v))));
    tb.appendChild(tr);
  });
}

function renderArtilheiros() {
  const ol = $("m-scorers");
  ol.innerHTML = "";
  const l = artilheiros(save.liga, 10);
  if (!l.length) { ol.appendChild(el("li", "", "Ninguém marcou ainda.")); return; }
  l.forEach((a) => ol.appendChild(el("li", "", `${a.nome} (${a.sigla}) — ${a.gols} gol(s)`)));
}

// ---------- abas e botões ----------
document.querySelectorAll(".m-tabs button").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".m-tabs button").forEach((x) => x.classList.toggle("on", x === b));
    document.querySelectorAll(".m-panel").forEach((p) => (p.hidden = p.id !== `tab-${b.dataset.tab}`));
  }));
$("m-play").addEventListener("click", jogar);
$("m-reset").addEventListener("click", () => {
  if (tocando) return;
  if (!confirm("Começar um novo jogo? A carreira atual será apagada.")) return;
  save = null;
  try { localStorage.removeItem(KEY); } catch (_) {}
  if (user) supabase.from("career_saves").delete().eq("game", "mister").then(() => {});
  mostrarEscolha();
});

// ---------- início ----------
save = lerLocal();
render();
