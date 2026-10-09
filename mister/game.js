import { supabase } from "/js/supabase.js";
import { onAuthChange } from "/js/account.js";
import * as M from "/mister/engine.js";

const $ = (id) => document.getElementById(id);
const KEY = "jogai_mister_save";
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const mi = (v) => `R$ ${v.toFixed(1)} mi`;

let save = null;   // { v, liga, usuario, updatedAt }
let user = null;
let tocando = false;
let selecionado = null;
let timer = null;

const liga = () => save.liga;
const me = () => save.liga.times[save.usuario];

// ---------- salvar / carregar ----------
function lerLocal() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (s && s.v !== M.VERSAO) { localStorage.removeItem(KEY); return null; } // carreira da versão antiga (8 clubes fictícios)
    return s;
  } catch (_) { return null; }
}
let cloudTimer = null;
function gravar() {
  save.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (_) {}
  $("m-saved").textContent = user ? "· salvo na conta" : "· salvo neste aparelho";
  if (!user) return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(async () => {
    const { error } = await supabase.from("career_saves").upsert(
      { user_id: user.id, game: "mister", data: save, updated_at: new Date(save.updatedAt).toISOString() },
      { onConflict: "user_id,game" });
    $("m-saved").textContent = error ? "· salvo só neste aparelho" : "· salvo na conta";
  }, 800);
}

async function buscarNuvem() {
  if (!user) return;
  const { data, error } = await supabase.from("career_saves").select("data,updated_at").eq("game", "mister").maybeSingle();
  if (error || !data || !data.data || data.data.v !== M.VERSAO) { if (save) gravar(); return; }
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
  if (save) $("m-saved").textContent = user ? "· salvo na conta" : "· salvo neste aparelho";
});

// ---------- escolha do clube ----------
let ligaNova = null;
function mostrarEscolha() {
  $("carreira").hidden = true;
  $("escolha").hidden = false;
  ligaNova = M.novaLiga();
  const box = $("clubes");
  box.innerHTML = "";
  [...ligaNova.times].sort((a, b) => b.forca - a.forca).forEach((t) => {
    const b = el("button", "clube");
    b.type = "button";
    const badge = el("span", "badge");
    badge.style.background = `hsl(${t.hue} 70% 50%)`;
    const nome = el("b");
    nome.append(badge, t.nome);
    const f = M.forcaDoTime(t.elenco, t.titulares, t.formacao).geral;
    b.append(nome, el("small", "", `Força ${f}`), el("small", "caixa", `Caixa ${mi(t.caixa)}`));
    b.addEventListener("click", () => {
      save = { v: M.VERSAO, liga: ligaNova, usuario: t.id, updatedAt: Date.now() };
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
  cabecalho();
  renderJogo(); renderEscalacao(); renderMercado(); renderFinancas(); renderTabela(); renderArtilheiros();
}
function cabecalho() {
  $("m-clube").textContent = me().nome;
  $("m-temp").textContent = liga().temporada;
  $("m-rodada").textContent = liga().rodada;
  $("m-total").textContent = liga().calendario.length;
  const cx = $("m-caixa");
  cx.textContent = `Caixa ${mi(me().caixa)}`;
  cx.style.color = me().caixa < 0 ? "var(--bad)" : "var(--accent)";
}
function msg(id, texto, erro) { const e = $(id); e.textContent = texto || ""; e.classList.toggle("err", !!erro); }

function jogoDoUsuario() {
  return liga().calendario[liga().rodada].find(([c, f]) => c === save.usuario || f === save.usuario);
}

function renderJogo() {
  const next = $("m-next");
  const play = $("m-play");
  next.innerHTML = "";
  if (M.temporadaAcabou(liga())) return renderFimDeTemporada(next, play);
  const [c, f] = jogoDoUsuario();
  const H = liga().times[c], A = liga().times[f];
  const rival = c === save.usuario ? A : H;
  next.append(el("div", "", `${H.nome} × ${A.nome}`));
  const fr = M.forcaDoTime(rival.elenco, rival.titulares, rival.formacao).geral;
  const fm = M.forcaDoTime(me().elenco, me().titulares, me().formacao).geral;
  next.append(el("span", "vs", `Rodada ${liga().rodada + 1} · você joga ${c === save.usuario ? "em casa" : "fora de casa"} · força do rival: ${fr} (a sua: ${fm})`));
  play.textContent = "▶ Jogar rodada";
  play.hidden = false;
}

function renderFimDeTemporada(next, play) {
  const L = liga();
  if (!L.resumo || L.resumo.temporada !== L.temporada) M.encerrarTemporada(L, save.usuario);
  const r = L.resumo;
  const box = el("div", "m-final");
  box.append(el("div", "", r.pos === 1 ? `🏆 ${me().nome} é campeão da temporada ${L.temporada}!` : `Temporada ${L.temporada} encerrada.`));
  box.append(el("div", "vs", `${r.campeao} foi campeão. Você terminou em ${r.pos}º lugar e recebeu ${mi(r.premio)} de premiação.`));
  box.append(el("div", "vs", `Rebaixados: ${r.rebaixados.join(", ")}. Sobem da Série B: ${r.promovidos.join(", ")}.`));
  next.appendChild(box);
  gravar();
  if (r.usuarioRebaixado) {
    play.hidden = true;
    const d = el("div", "m-demit");
    d.append(el("b", "", "Você foi demitido: o clube caiu para a Série B."), el("p", "help", "Escolha outro clube da Série A para assumir."));
    const lista = el("div", "m-list");
    M.clubesParaAssumir(L).sort((a, b) => b.caixa - a.caixa).forEach((t) => {
      const b = el("button", "jog");
      b.type = "button";
      b.append(el("span", "nome", t.nome), el("span", "info", `caixa ${mi(t.caixa)}`), el("span", "ovr", String(M.forcaDoTime(t.elenco, t.titulares, t.formacao).geral)));
      b.addEventListener("click", () => { save.usuario = t.id; novaTemporada(); });
      lista.appendChild(b);
    });
    d.appendChild(lista);
    next.appendChild(d);
    return;
  }
  play.hidden = false;
  play.textContent = "➡ Nova temporada";
  if (L.vencendo.length) next.append(el("p", "msg err", `${L.vencendo.length} jogador(es) seu(s) estão com o contrato no fim. Renove na aba Finanças antes de começar, senão eles saem.`));
}

function novaTemporada() {
  const r = M.iniciarTemporada(liga(), save.usuario);
  $("m-score").hidden = true; $("m-feed").innerHTML = ""; $("m-others").innerHTML = "";
  selecionado = null;
  const partes = [];
  if (r.saiu.length) partes.push(`Contratos encerrados: ${r.saiu.join(", ")}.`);
  if (r.aposentados.length) partes.push(`Aposentados: ${r.aposentados.join(", ")}.`);
  gravar(); render();
  msg("m-msg", partes.join(" "));
}

// ---------- partida ao vivo ----------
function jogar() {
  if (tocando) return;
  msg("m-msg", "");
  if (M.temporadaAcabou(liga())) return novaTemporada();
  const L = liga();
  M.preparaIA(L, save.usuario);
  const trocas = M.corrigirTitulares(me());
  if (!M.escalacaoValida(me().elenco, me().formacao, me().titulares)) return msg("m-msg", "Sua escalação está inválida. Ajuste na aba Escalação.", true);
  if (trocas.length) msg("m-msg", "Ajustes automáticos: " + trocas.map((t) => `${t.entrou.nome} no lugar de ${t.saiu.nome}`).join("; ") + ".");
  const [c, f] = jogoDoUsuario();
  const sim = M.simularPartida(L.times[c], L.times[f]);
  const H = L.times[c], A = L.times[f];
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
  const linha = (l) => {
    const li = el("li", l.tipo);
    li.append(el("span", "min", `${l.min}'`), document.createTextNode(l.texto));
    return li;
  };
  const passo = () => {
    min++;
    while (i < sim.lances.length && sim.lances[i].min === min) {
      const l = sim.lances[i++];
      if (l.placar) placar = l.placar;
      feed.prepend(linha(l));
    }
    mostra();
    if (min >= 90) fim();
  };
  const fim = () => {
    clearInterval(timer);
    min = 90; placar = sim.placar; mostra();
    feed.innerHTML = "";
    sim.lances.slice().reverse().forEach((l) => feed.appendChild(linha(l)));
    const saidas = M.jogarRodada(L, Math.random, { casa: c, fora: f, sim }, save.usuario);
    const box = $("m-others");
    box.innerHTML = "";
    box.appendChild(el("div", "", "Outros resultados da rodada:"));
    saidas.filter((s) => !(s.casa === c && s.fora === f)).forEach((s) => {
      const d = el("div");
      d.appendChild(el("b", "", `${L.times[s.casa].sigla} ${s.placar[0]} × ${s.placar[1]} ${L.times[s.fora].sigla}`));
      box.appendChild(d);
    });
    tocando = false;
    $("m-play").disabled = false;
    $("m-skip").hidden = true;
    gravar();
    cabecalho();
    renderJogo(); renderEscalacao(); renderMercado(); renderFinancas(); renderTabela(); renderArtilheiros();
  };
  $("m-skip").onclick = fim;
  timer = setInterval(passo, 110);
}

// ---------- escalação ----------
const POS_COR = {};
function flags(j) {
  let s = "";
  if (j.lesao) s += ` 🩹${j.lesao}`;
  if (j.susp) s += ` 🟥${j.susp}`;
  if (j.amarelos) s += " " + "🟨".repeat(j.amarelos);
  return s;
}
function linhaJogador(j, cls, slotPos) {
  const imp = slotPos && slotPos !== j.pos;
  const b = el("button", `jog ${cls || ""} ${imp ? "imp" : ""}`);
  b.type = "button";
  b.append(el("span", "pos", slotPos || j.pos), el("span", "nome", j.nome), el("span", "flag", flags(j)), el("span", "info", `${j.idade}a`), el("span", "ovr", String(j.ovr)));
  if (imp) b.title = `Joga improvisado (é ${M.POS_NAME[j.pos]})`;
  return b;
}

function renderEscalacao() {
  const t = me();
  const sel = $("m-form");
  if (!sel.options.length) {
    Object.keys(M.FORMATIONS).forEach((f) => { const o = el("option", "", f); o.value = f; sel.appendChild(o); });
    sel.addEventListener("change", () => {
      if (tocando) { sel.value = me().formacao; return; }
      me().formacao = sel.value;
      me().titulares = M.melhorTime(me().elenco, sel.value);
      selecionado = null;
      gravar(); renderEscalacao(); renderJogo();
    });
  }
  sel.value = t.formacao;
  const fz = M.forcaDoTime(t.elenco, t.titulares, t.formacao);
  $("m-forca").textContent = `Força do time: ${fz.geral} · ataque ${Math.round(fz.ataque)} · defesa ${Math.round(fz.defesa)}`;
  const xi = $("m-xi"), bench = $("m-bench");
  xi.innerHTML = ""; bench.innerHTML = "";
  const sl = M.slots(t.formacao);
  t.titulares.forEach((id, i) => {
    const j = t.elenco.find((x) => x.id === id);
    if (!j) return;
    const b = linhaJogador(j, j.id === selecionado ? "sel" : "", sl[i]);
    b.addEventListener("click", () => { if (tocando) return; selecionado = selecionado === j.id ? null : j.id; renderEscalacao(); });
    xi.appendChild(b);
  });
  const ordem = (a, b) => M.POS_ORDER.indexOf(a.pos) - M.POS_ORDER.indexOf(b.pos) || b.ovr - a.ovr;
  t.elenco.filter((j) => !t.titulares.includes(j.id)).sort(ordem).forEach((j) => {
    const b = linhaJogador(j, selecionado && M.disponivel(j) ? "alvo" : "");
    b.addEventListener("click", () => {
      if (tocando || !selecionado) return;
      if (!M.disponivel(j)) return msg("m-msg", `${j.nome} não pode jogar (lesão ou suspensão).`, true);
      t.titulares = t.titulares.map((id) => (id === selecionado ? j.id : id));
      selecionado = null;
      gravar(); renderEscalacao(); renderJogo();
    });
    bench.appendChild(b);
  });
}

// ---------- mercado ----------
let sub = "comprar";
function renderMercado() {
  document.querySelectorAll(".m-sub button").forEach((b) => b.classList.toggle("on", b.dataset.sub === sub));
  ["comprar", "vender", "livres"].forEach((s) => { $(`sub-${s}`).hidden = s !== sub; });
  if (sub === "comprar") renderCompra();
  else if (sub === "vender") renderVenda();
  else renderLivres();
}
function linhaMercado(j, extra) {
  const r = el("div", "row");
  r.append(el("span", "pos", j.pos), el("span", "nome", j.nome), el("span", "info", `${j.idade}a · nota ${j.ovr}${extra || ""}`));
  return r;
}
function renderCompra() {
  const box = $("m-compra");
  box.innerHTML = "";
  const pos = $("f-pos").value, teto = Number($("f-preco").value);
  const lista = M.mercado(liga(), save.usuario).filter((x) => (!pos || x.jogador.pos === pos) && (!teto || x.preco <= teto)).slice(0, 40);
  if (!lista.length) box.appendChild(el("p", "help", "Nenhum jogador com esse filtro."));
  lista.forEach(({ jogador, clube, preco }) => {
    const r = linhaMercado(jogador, ` · ${clube.sigla}`);
    const b = el("button", "btn", mi(preco));
    b.type = "button";
    b.addEventListener("click", () => {
      const res = M.comprar(liga(), save.usuario, jogador.id);
      msg("m-mmsg", res.msg, !res.ok);
      if (res.ok) { gravar(); cabecalho(); renderEscalacao(); renderCompra(); renderFinancas(); }
    });
    r.appendChild(b);
    box.appendChild(r);
  });
}
function renderVenda() {
  const box = $("m-venda");
  box.innerHTML = "";
  [...me().elenco].sort((a, b) => b.ovr - a.ovr).forEach((j) => {
    const r = linhaMercado(j, ` · vale ${mi(M.valorDe(j))}`);
    const b = el("button", "btn ghost", "Ver ofertas");
    b.type = "button";
    b.addEventListener("click", () => {
      if (r.querySelector(".ofertas")) { r.querySelector(".ofertas").remove(); return; }
      const of = M.ofertasPor(liga(), save.usuario, j.id);
      const caixa = el("div", "ofertas");
      if (!of.length) caixa.appendChild(el("span", "info", "Nenhum clube fez proposta agora. Tente de novo depois."));
      of.forEach((o) => {
        const a = el("button", "btn", `${o.clube.nome}: ${mi(o.valor)}`);
        a.type = "button";
        a.addEventListener("click", () => {
          const res = M.vender(liga(), save.usuario, j.id, o.clube.id, o.valor);
          msg("m-mmsg", res.msg, !res.ok);
          if (res.ok) { selecionado = null; gravar(); cabecalho(); renderEscalacao(); renderVenda(); renderFinancas(); }
        });
        caixa.appendChild(a);
      });
      r.appendChild(caixa);
    });
    r.appendChild(b);
    box.appendChild(r);
  });
}
function renderLivres() {
  const box = $("m-livres");
  box.innerHTML = "";
  [...liga().livres].sort((a, b) => b.ovr - a.ovr).slice(0, 30).forEach((j) => {
    const r = linhaMercado(j, ` · salário ${mi(M.salarioDe(j))}/ano`);
    const b = el("button", "btn", "Contratar");
    b.type = "button";
    b.addEventListener("click", () => {
      const res = M.contratarLivre(liga(), save.usuario, j.id);
      msg("m-mmsg", res.msg, !res.ok);
      if (res.ok) { gravar(); cabecalho(); renderEscalacao(); renderLivres(); renderFinancas(); }
    });
    r.appendChild(b);
    box.appendChild(r);
  });
}

// ---------- finanças e contratos ----------
function renderFinancas() {
  const t = me();
  const folha = M.folhaAnual(t);
  const box = $("m-fin");
  box.innerHTML = "";
  const item = (rot, val, neg) => { const d = el("div", neg ? "neg" : ""); d.append(el("b", "", val), document.createTextNode(rot)); box.appendChild(d); };
  item("Caixa", mi(t.caixa), t.caixa < 0);
  item("Folha salarial por ano", mi(folha));
  item("Elenco", `${t.elenco.length} jogadores`);
  item("Contratos acabando", String(t.elenco.filter((j) => j.contrato <= 1).length));
  const lista = $("m-contratos");
  lista.innerHTML = "";
  [...t.elenco].sort((a, b) => a.contrato - b.contrato || b.ovr - a.ovr).forEach((j) => {
    const r = linhaMercado(j, ` · ${j.contrato} ano(s) · sal. ${mi(M.salarioDe(j))}`);
    if (j.contrato <= 2) {
      [1, 2, 3].forEach((anos) => {
        const b = el("button", "btn ghost", `+${anos}a (${mi(M.custoRenovacao(j))})`);
        b.type = "button";
        b.addEventListener("click", () => {
          const res = M.renovar(liga(), save.usuario, j.id, anos);
          msg("m-mmsg", res.msg, !res.ok);
          if (res.ok) { gravar(); cabecalho(); renderFinancas(); renderJogo(); }
        });
        r.appendChild(b);
      });
    }
    const d = el("button", "btn ghost", `Dispensar (${mi(M.multaRescisao(j))})`);
    d.type = "button";
    d.addEventListener("click", () => {
      const res = M.dispensar(liga(), save.usuario, j.id);
      msg("m-mmsg", res.msg, !res.ok);
      if (res.ok) { selecionado = null; gravar(); cabecalho(); renderEscalacao(); renderFinancas(); }
    });
    r.appendChild(d);
    lista.appendChild(r);
  });
}

// ---------- tabela e artilheiros ----------
function renderTabela() {
  const tb = $("m-table");
  tb.innerHTML = "";
  const head = el("tr");
  ["#", "Time", "P", "J", "V", "E", "D", "SG"].forEach((h) => head.appendChild(el("th", "", h)));
  tb.appendChild(head);
  const tab = M.tabela(liga());
  tab.forEach((x, i) => {
    const cls = (x.id === save.usuario ? "eu " : "") + (i < 4 ? "lib " : i >= tab.length - M.VAGAS_REBAIXAMENTO ? "reb" : "");
    const tr = el("tr", cls.trim());
    [i + 1, x.nome, x.P, x.J, x.V, x.E, x.D, x.SG].forEach((v) => tr.appendChild(el("td", "", String(v))));
    tb.appendChild(tr);
  });
}
function renderArtilheiros() {
  const ol = $("m-scorers");
  ol.innerHTML = "";
  const l = M.artilheiros(liga(), 10);
  if (!l.length) { ol.appendChild(el("li", "", "Ninguém marcou ainda.")); return; }
  l.forEach((a) => ol.appendChild(el("li", "", `${a.nome} (${a.sigla}) — ${a.gols} gol(s)`)));
}

// ---------- abas e botões ----------
document.querySelectorAll(".m-tabs button").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".m-tabs button").forEach((x) => x.classList.toggle("on", x === b));
    document.querySelectorAll(".m-panel").forEach((p) => (p.hidden = p.id !== `tab-${b.dataset.tab}`));
  }));
document.querySelectorAll(".m-sub button").forEach((b) => b.addEventListener("click", () => { sub = b.dataset.sub; msg("m-mmsg", ""); renderMercado(); }));
$("f-pos").addEventListener("change", renderCompra);
$("f-preco").addEventListener("change", renderCompra);
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
