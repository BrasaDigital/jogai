// Motor do Mister v2: Série A com 20 clubes, lesões e cartões, finanças, transferências,
// contratos e várias temporadas. Sem DOM: roda no node. `rng` é injetável (padrão Math.random).
import { SERIE_A, SERIE_B } from "/mister/data/serieA.js";

export const VERSAO = 2;
export const FORMATIONS = {
  "4-4-2": { D: 4, M: 4, A: 2 },
  "4-3-3": { D: 4, M: 3, A: 3 },
  "3-5-2": { D: 3, M: 5, A: 2 },
  "4-5-1": { D: 4, M: 5, A: 1 },
  "5-3-2": { D: 5, M: 3, A: 2 },
};
export const POS_ORDER = ["G", "D", "M", "A"];
export const POS_NAME = { G: "Goleiro", D: "Defensor", M: "Meia", A: "Atacante" };
export const MIN_POS = { G: 3, D: 8, M: 8, A: 6 }; // elenco mínimo por posição
export const MAX_ELENCO = 30;
export const VAGAS_REBAIXAMENTO = 4;
export const PREMIOS = [40, 30, 24, 20, 17, 14, 12, 10, 8, 7, 6, 5, 4, 3, 2.5, 2, 1.5, 1, 0.5, 0]; // R$ milhões por posição final

const NOMES = ["João", "Pedro", "Lucas", "Gabriel", "Mateus", "Rafael", "Bruno", "Felipe", "Thiago", "Diego", "Caio", "Vitor", "Leandro", "Rodrigo", "Marcelo", "André", "Henrique", "Gustavo", "Renan", "Danilo", "Everton", "Fábio", "Igor", "Jonas", "Kauê", "Leonardo", "Murilo", "Nathan", "Otávio", "Paulo", "Davi", "Enzo", "Samuel", "Ruan", "Yago"];
const SOBRENOMES = ["Silva", "Souza", "Costa", "Santos", "Oliveira", "Pereira", "Lima", "Ferreira", "Almeida", "Ribeiro", "Carvalho", "Gomes", "Martins", "Rocha", "Barbosa", "Moreira", "Nunes", "Teixeira", "Araújo", "Cardoso", "Dias", "Freitas", "Machado", "Pinto", "Vieira", "Moura", "Campos", "Borges", "Rezende", "Matos"];

const ri = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const pickOne = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const arred = (v) => Math.round(v * 100) / 100;

// ---------- jogadores ----------
export function valorDe(j) {
  const base = Math.max(0.2, 1.2 * ((j.ovr - 52) / 10) ** 3);
  const f = j.idade <= 22 ? 1.4 : j.idade <= 27 ? 1.1 : j.idade <= 30 ? 0.8 : j.idade <= 33 ? 0.5 : 0.25;
  return arred(Math.max(0.1, base * f));
}
export const salarioDe = (j) => arred(clamp(valorDe(j) * 0.18, 0.25, 7));
export const disponivel = (j) => !j.lesao && !j.susp;

function novoJogador(liga, rng, pos, nome, ovr, idade, extra = {}) {
  return { id: ++liga.seq, nome, pos, ovr: clamp(Math.round(ovr), 38, 92), idade, contrato: ri(rng, 1, 4), lesao: 0, susp: 0, amarelos: 0, ...extra };
}
function nomeAleatorio(rng) { return `${pickOne(rng, NOMES)} ${pickOne(rng, SOBRENOMES)}`; }

function lerJogador(liga, rng, linha) {
  const t = linha.split(" ");
  const idade = Number(t.pop()), ovr = Number(t.pop()), pos = t.shift();
  return novoJogador(liga, rng, pos, t.join(" "), ovr, idade);
}
function jogadorDaBase(liga, rng, pos, forca) {
  return novoJogador(liga, rng, pos, nomeAleatorio(rng), forca - ri(rng, 6, 14) + (rng() < 0.15 ? 8 : 0), ri(rng, 17, 22), { base: true, contrato: ri(rng, 2, 4) });
}
// completa o elenco até o mínimo por posição
export function preencherElenco(liga, rng, time, forca) {
  for (const p of POS_ORDER) {
    while (time.elenco.filter((j) => j.pos === p).length < MIN_POS[p]) time.elenco.push(jogadorDaBase(liga, rng, p, forca));
  }
}

// ---------- escalação ----------
export const slots = (formacao) => {
  const f = FORMATIONS[formacao];
  return ["G", ...Array(f.D).fill("D"), ...Array(f.M).fill("M"), ...Array(f.A).fill("A")];
};
const fatorPos = (slot, pos) => (slot === pos ? 1 : slot === "G" || pos === "G" ? 0.45 : 0.85);

// melhores disponíveis para cada vaga (mesma posição primeiro, depois quem sobrar)
export function melhorTime(elenco, formacao) {
  const usados = new Set();
  const out = [];
  for (const s of slots(formacao)) {
    let melhor = null, nota = -1;
    for (const j of elenco) {
      if (usados.has(j.id) || !disponivel(j)) continue;
      const n = j.ovr * fatorPos(s, j.pos);
      if (n > nota) { nota = n; melhor = j; }
    }
    if (!melhor) melhor = elenco.find((j) => !usados.has(j.id)); // elenco todo indisponível: improvisa
    usados.add(melhor.id);
    out.push(melhor.id);
  }
  return out;
}

export function escalacaoValida(elenco, formacao, ids) {
  if (!FORMATIONS[formacao] || ids.length !== 11 || new Set(ids).size !== 11) return false;
  return ids.every((id) => { const j = elenco.find((x) => x.id === id); return j && disponivel(j); });
}

// troca quem está lesionado/suspenso; devolve o que foi trocado
export function corrigirTitulares(time) {
  const trocas = [];
  const usados = new Set(time.titulares);
  const sl = slots(time.formacao);
  time.titulares = time.titulares.map((id, i) => {
    const j = time.elenco.find((x) => x.id === id);
    if (j && disponivel(j)) return id;
    let melhor = null, nota = -1;
    for (const c of time.elenco) {
      if (usados.has(c.id) || !disponivel(c)) continue;
      const n = c.ovr * fatorPos(sl[i], c.pos);
      if (n > nota) { nota = n; melhor = c; }
    }
    if (!melhor) return id;
    usados.add(melhor.id);
    if (j) trocas.push({ saiu: j, entrou: melhor });
    return melhor.id;
  });
  return trocas;
}

export function forcaDoTime(elenco, ids, formacao = "4-4-2") {
  const sl = slots(formacao);
  const por = { G: [], D: [], M: [], A: [] };
  ids.forEach((id, i) => {
    const j = elenco.find((x) => x.id === id);
    if (j) por[sl[i]].push(j.ovr * fatorPos(sl[i], j.pos));
  });
  const gk = mean(por.G), def = mean(por.D), mid = mean(por.M), att = mean(por.A);
  return {
    ataque: att * 0.55 + mid * 0.45,
    defesa: def * 0.6 + gk * 0.4,
    meio: mid,
    geral: Math.round((gk + def * (sl.filter((s) => s === "D").length) + mid * (sl.filter((s) => s === "M").length) + att * (sl.filter((s) => s === "A").length)) / 11),
  };
}

// ---------- criação da liga ----------
function montaTime(liga, rng, base, id) {
  const time = {
    id, nome: base.nome, sigla: base.sigla, hue: base.hue, caixa: base.caixa ?? 25, forca: base.forca,
    elenco: (base.jogadores || []).map((l) => lerJogador(liga, rng, l)),
    formacao: "4-4-2", titulares: [],
  };
  preencherElenco(liga, rng, time, base.forca);
  time.titulares = melhorTime(time.elenco, time.formacao);
  return time;
}

export function novaLiga(rng = Math.random) {
  const liga = { v: VERSAO, seq: 0, temporada: 1, rodada: 0, resultados: [], gols: {}, livres: [], vencendo: [], resumo: null, serieB: SERIE_B.map((b) => ({ ...b })) };
  liga.times = SERIE_A.map((c, i) => montaTime(liga, rng, c, i));
  liga.calendario = calendario(liga.times.length);
  gerarLivres(liga, rng, 24);
  return liga;
}

export function gerarLivres(liga, rng, n) {
  while (liga.livres.length < n) {
    const pos = pickOne(rng, ["G", "D", "D", "M", "M", "A", "A"]);
    liga.livres.push(novoJogador(liga, rng, pos, nomeAleatorio(rng), 52 + ri(rng, 0, 18), ri(rng, 22, 36), { livre: true, contrato: 0 }));
  }
}

// método do círculo: turno e returno
export function calendario(n) {
  const ids = Array.from({ length: n }, (_, i) => i);
  const rodadas = [];
  for (let r = 0; r < n - 1; r++) {
    const jogos = [];
    for (let i = 0; i < n / 2; i++) {
      const a = ids[i], b = ids[n - 1 - i];
      jogos.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rodadas.push(jogos);
    ids.splice(1, 0, ids.pop());
  }
  return [...rodadas, ...rodadas.map((js) => js.map(([a, b]) => [b, a]))];
}

// ---------- partida ----------
export const CAL = { c0: 0.09, ce: 1.0, g0: 0.29, ge: 0.5, jog: 1.0 };
const FRASES_CHANCE = ["arma o ataque", "chega pela direita", "chega pela esquerda", "toca de primeira", "acelera no contra-ataque", "cruza na área"];
const FRASES_GOL = ["balança a rede!", "não perdoa e marca!", "bate firme e é GOL!", "completa de cabeça para o gol!", "finaliza no canto e faz!"];
const FRASES_DEFESA = ["O goleiro faz grande defesa!", "A defesa afasta o perigo!", "O goleiro espalma para escanteio!"];
const FRASES_FORA = ["A bola passa por cima do gol.", "Bate fraco, pra fora.", "Chutou na trave!"];

function escolheArtilheiro(rng, jogadores) {
  const cand = jogadores.filter((j) => j.pos !== "G");
  const peso = { D: 0.15, M: 0.9, A: 2.6 };
  const w = cand.map((j) => peso[j.pos] * (j.ovr / 60) ** 3);
  let x = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < cand.length; i++) { x -= w[i]; if (x <= 0) return cand[i]; }
  return cand[cand.length - 1];
}

const duracaoLesao = (rng) => { const r = rng(); return r < 0.5 ? ri(rng, 1, 2) : r < 0.8 ? ri(rng, 3, 5) : r < 0.95 ? ri(rng, 6, 10) : ri(rng, 11, 20); };

// simula 90 minutos. Devolve placar, lances (texto), gols e eventos (cartões e lesões).
export function simularPartida(casa, fora, rng = Math.random) {
  const times = [casa, fora];
  const campo = times.map((t) => t.titulares.map((id) => t.elenco.find((j) => j.id === id)));
  const mult = [1, 1]; // cartão vermelho enfraquece o time
  const placar = [0, 0], lances = [], gols = [], eventos = [];
  const amar = [new Map(), new Map()]; // amarelos recebidos na partida
  const forca = (i) => forcaDoTime(times[i].elenco, times[i].titulares, times[i].formacao);
  let F = [forca(0), forca(1)];
  const mando = 6;

  for (let min = 1; min <= 90; min++) {
    // disciplina e lesões (por time e minuto)
    for (let i = 0; i < 2; i++) {
      const em = campo[i].filter(Boolean);
      if (!em.length) continue;
      if (rng() < 0.013) {
        const j = pickOne(rng, em);
        const ja = amar[i].get(j.id) || 0;
        amar[i].set(j.id, ja + 1);
        if (ja + 1 >= 2) { // segundo amarelo = vermelho
          eventos.push({ min, time: i, jogador: j.id, tipo: "vermelho", jogos: 1 });
          lances.push({ min, time: i, tipo: "vermelho", texto: `🟥 Segundo amarelo e expulsão de ${j.nome} (${times[i].sigla})!` });
          campo[i] = campo[i].filter((x) => x.id !== j.id); mult[i] *= 0.88;
        } else {
          eventos.push({ min, time: i, jogador: j.id, tipo: "amarelo" });
          lances.push({ min, time: i, tipo: "amarelo", texto: `🟨 Cartão amarelo para ${j.nome} (${times[i].sigla}).` });
        }
      }
      if (rng() < 0.0003) {
        const j = pickOne(rng, em);
        eventos.push({ min, time: i, jogador: j.id, tipo: "vermelho", jogos: ri(rng, 1, 3) });
        lances.push({ min, time: i, tipo: "vermelho", texto: `🟥 Vermelho direto! ${j.nome} (${times[i].sigla}) está fora.` });
        campo[i] = campo[i].filter((x) => x.id !== j.id); mult[i] *= 0.88;
      }
      if (rng() < 0.0012) {
        const j = pickOne(rng, em);
        eventos.push({ min, time: i, jogador: j.id, tipo: "lesao", rodadas: duracaoLesao(rng) });
        lances.push({ min, time: i, tipo: "lesao", texto: `🩹 ${j.nome} (${times[i].sigla}) sente uma lesão e sai de campo.` });
        campo[i] = campo[i].filter((x) => x.id !== j.id); mult[i] *= 0.95;
      }
    }
    const Hh = { ataque: F[0].ataque * mult[0], defesa: F[0].defesa * mult[0], meio: F[0].meio * mult[0] };
    const Aa = { ataque: F[1].ataque * mult[1], defesa: F[1].defesa * mult[1], meio: F[1].meio * mult[1] };
    const pCasa = (Hh.meio + mando) / (Hh.meio + mando + Aa.meio);
    const ataca = rng() < pCasa ? 0 : 1;
    const [atk, def] = ataca === 0 ? [Hh, Aa] : [Aa, Hh];
    const razao = atk.ataque / def.defesa;
    const pChance = clamp(CAL.c0 * razao ** CAL.ce, 0.02, 0.4);
    if (rng() > pChance) continue;
    const jogador = escolheArtilheiro(rng, campo[ataca].filter(Boolean));
    const pGol = clamp(CAL.g0 * razao ** CAL.ge * (jogador.ovr / 68) ** CAL.jog, 0.05, 0.6);
    const r = rng();
    const nome = `${jogador.nome} (${times[ataca].sigla})`;
    if (r < pGol) {
      placar[ataca]++;
      gols.push({ time: ataca, jogador: jogador.id });
      lances.push({ min, time: ataca, tipo: "gol", texto: `⚽ GOL! ${nome} ${pickOne(rng, FRASES_GOL)}`, placar: [...placar] });
    } else if (r < pGol + (1 - pGol) * 0.55) {
      lances.push({ min, time: ataca, tipo: "defesa", texto: `${times[ataca].sigla} ${pickOne(rng, FRASES_CHANCE)}. ${pickOne(rng, FRASES_DEFESA)}` });
    } else {
      lances.push({ min, time: ataca, tipo: "fora", texto: `${nome}: ${pickOne(rng, FRASES_FORA)}` });
    }
  }
  return { placar, lances, gols, eventos };
}

// ---------- tabela ----------
export function tabela(liga) {
  const t = liga.times.map((c) => ({ id: c.id, nome: c.nome, sigla: c.sigla, hue: c.hue, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, SG: 0, P: 0 }));
  for (const r of liga.resultados) {
    const a = t[r.casa], b = t[r.fora];
    a.J++; b.J++;
    a.GP += r.placar[0]; a.GC += r.placar[1];
    b.GP += r.placar[1]; b.GC += r.placar[0];
    if (r.placar[0] > r.placar[1]) { a.V++; b.D++; a.P += 3; }
    else if (r.placar[0] < r.placar[1]) { b.V++; a.D++; b.P += 3; }
    else { a.E++; b.E++; a.P++; b.P++; }
  }
  t.forEach((x) => (x.SG = x.GP - x.GC));
  return t.sort((x, y) => y.P - x.P || y.SG - x.SG || y.GP - x.GP || x.nome.localeCompare(y.nome));
}

// ---------- finanças ----------
export const folhaAnual = (time) => arred(time.elenco.reduce((s, j) => s + salarioDe(j), 0));
export const folhaRodada = (time, liga) => folhaAnual(time) / liga.calendario.length;
function receitaRodada(time, emCasa) {
  const f = forcaDoTime(time.elenco, time.titulares, time.formacao).geral;
  const cota = 0.35 + Math.max(0, f - 60) * 0.012;       // cota de TV
  const bilheteria = emCasa ? 0.25 + Math.max(0, f - 58) * 0.03 : 0;
  return cota + bilheteria;
}

// ---------- efeitos de lesão e cartão ----------
function avancaAfastamentos(liga) {
  for (const t of liga.times) for (const j of t.elenco) {
    if (j.susp > 0) j.susp--;
    if (j.lesao > 0) j.lesao--;
  }
}
function aplicaEventos(liga, sim, c, f) {
  const times = [liga.times[c], liga.times[f]];
  for (const e of sim.eventos) {
    const j = times[e.time].elenco.find((x) => x.id === e.jogador);
    if (!j) continue;
    if (e.tipo === "amarelo") { j.amarelos++; if (j.amarelos >= 3) { j.amarelos = 0; j.susp = Math.max(j.susp, 1); } }
    else if (e.tipo === "vermelho") j.susp = Math.max(j.susp, e.jogos || 1);
    else if (e.tipo === "lesao") j.lesao = Math.max(j.lesao, e.rodadas);
  }
}

// ---------- rodada ----------
// joga a rodada atual inteira. `jogoUsuario` = {casa, fora, sim} já simulado (para mostrar ao vivo).
export function jogarRodada(liga, rng = Math.random, jogoUsuario = null, usuario = -1) {
  const jogos = liga.calendario[liga.rodada];
  // quem já estava afastado no início da rodada cumpre um jogo
  avancaAfastamentos(liga);
  const saidas = [];
  for (const [c, f] of jogos) {
    const pronto = jogoUsuario && jogoUsuario.casa === c && jogoUsuario.fora === f ? jogoUsuario.sim : null;
    const sim = pronto || simularPartida(liga.times[c], liga.times[f], rng);
    liga.resultados.push({ rodada: liga.rodada, casa: c, fora: f, placar: sim.placar });
    for (const g of sim.gols) liga.gols[g.jogador] = (liga.gols[g.jogador] || 0) + 1;
    aplicaEventos(liga, sim, c, f);
    // dinheiro
    liga.times[c].caixa = arred(liga.times[c].caixa + receitaRodada(liga.times[c], true));
    liga.times[f].caixa = arred(liga.times[f].caixa + receitaRodada(liga.times[f], false));
    saidas.push({ casa: c, fora: f, placar: sim.placar });
  }
  for (const t of liga.times) t.caixa = arred(t.caixa - folhaRodada(t, liga));
  liga.rodada++;
  return saidas;
}

export const temporadaAcabou = (liga) => liga.rodada >= liga.calendario.length;

// IA: ajusta formação e escalação antes de cada rodada
export function preparaIA(liga, usuario, rng = Math.random) {
  for (const t of liga.times) {
    if (t.id === usuario) continue;
    t.titulares = melhorTime(t.elenco, t.formacao);
  }
}

export function artilheiros(liga, n = 8) {
  const out = [];
  for (const t of liga.times) for (const j of t.elenco) if (liga.gols[j.id]) out.push({ nome: j.nome, sigla: t.sigla, gols: liga.gols[j.id], hue: t.hue });
  return out.sort((a, b) => b.gols - a.gols || a.nome.localeCompare(b.nome)).slice(0, n);
}

// ---------- transferências ----------
const contagem = (elenco) => { const c = { G: 0, D: 0, M: 0, A: 0 }; elenco.forEach((j) => c[j.pos]++); return c; };
const MIN_VENDA = { G: 2, D: 6, M: 6, A: 4 };

export function precoCompra(j) { return arred(Math.max(0.2, valorDe(j) * 1.15)); }

export function mercado(liga, usuario) {
  const out = [];
  for (const t of liga.times) if (t.id !== usuario) for (const j of t.elenco) out.push({ jogador: j, clube: t, preco: precoCompra(j) });
  return out.sort((a, b) => b.jogador.ovr - a.jogador.ovr);
}

function mover(liga, de, para, j) {
  de.elenco = de.elenco.filter((x) => x.id !== j.id);
  de.titulares = de.titulares.filter((id) => id !== j.id);
  para.elenco.push(j);
  j.livre = false;
}
function reporTitulares(time) {
  if (time.titulares.length < 11) time.titulares = melhorTime(time.elenco, time.formacao);
}

export function comprar(liga, usuario, jogadorId, rng = Math.random) {
  const eu = liga.times[usuario];
  let vendedor = null, j = null;
  for (const t of liga.times) { if (t.id === usuario) continue; const x = t.elenco.find((y) => y.id === jogadorId); if (x) { vendedor = t; j = x; } }
  if (!j) return { ok: false, msg: "Jogador não encontrado." };
  const preco = precoCompra(j);
  if (eu.elenco.length >= MAX_ELENCO) return { ok: false, msg: `Seu elenco já tem ${MAX_ELENCO} jogadores.` };
  if (eu.caixa < preco) return { ok: false, msg: "Dinheiro insuficiente em caixa." };
  const c = contagem(vendedor.elenco); c[j.pos]--;
  if (c[j.pos] < MIN_VENDA[j.pos]) return { ok: false, msg: `${vendedor.nome} não aceita ficar sem ${POS_NAME[j.pos].toLowerCase()}es suficientes.` };
  eu.caixa = arred(eu.caixa - preco);
  vendedor.caixa = arred(vendedor.caixa + preco);
  mover(liga, vendedor, eu, j);
  j.contrato = 3; j.amarelos = 0;
  preencherElenco(liga, rng, vendedor, vendedor.forca);
  reporTitulares(vendedor);
  return { ok: true, msg: `${j.nome} é reforço do ${eu.nome} por R$ ${preco.toFixed(1)} mi.`, preco };
}

// propostas de outros clubes por um jogador seu
export function ofertasPor(liga, usuario, jogadorId, rng = Math.random) {
  const eu = liga.times[usuario];
  const j = eu.elenco.find((x) => x.id === jogadorId);
  if (!j) return [];
  const v = valorDe(j);
  const cands = liga.times.filter((t) => t.id !== usuario && t.elenco.length < MAX_ELENCO)
    .sort(() => rng() - 0.5).slice(0, 8);
  const ofertas = [];
  for (const t of cands) {
    const valor = arred(Math.max(0.1, v * (0.8 + rng() * 0.4)));
    if (t.caixa >= valor) ofertas.push({ clube: t, valor });
  }
  return ofertas.sort((a, b) => b.valor - a.valor).slice(0, 3);
}

export function vender(liga, usuario, jogadorId, clubeId, valor) {
  const eu = liga.times[usuario], comprador = liga.times[clubeId];
  const j = eu.elenco.find((x) => x.id === jogadorId);
  if (!j || !comprador) return { ok: false, msg: "Negociação inválida." };
  if (comprador.caixa < valor) return { ok: false, msg: "O clube comprador não tem esse dinheiro." };
  const c = contagem(eu.elenco); c[j.pos]--;
  if (c[j.pos] < MIN_VENDA[j.pos]) return { ok: false, msg: `Você ficaria com poucos ${POS_NAME[j.pos].toLowerCase()}es (mínimo ${MIN_VENDA[j.pos]}).` };
  eu.caixa = arred(eu.caixa + valor);
  comprador.caixa = arred(comprador.caixa - valor);
  mover(liga, eu, comprador, j);
  comprador.titulares = melhorTime(comprador.elenco, comprador.formacao);
  eu.titulares = eu.titulares.length === 11 ? eu.titulares : melhorTime(eu.elenco, eu.formacao);
  return { ok: true, msg: `${j.nome} vendido ao ${comprador.nome} por R$ ${valor.toFixed(1)} mi.` };
}

export function contratarLivre(liga, usuario, jogadorId) {
  const eu = liga.times[usuario];
  const j = liga.livres.find((x) => x.id === jogadorId);
  if (!j) return { ok: false, msg: "Jogador não está mais disponível." };
  if (eu.elenco.length >= MAX_ELENCO) return { ok: false, msg: `Seu elenco já tem ${MAX_ELENCO} jogadores.` };
  liga.livres = liga.livres.filter((x) => x.id !== jogadorId);
  j.livre = false; j.contrato = 2; eu.elenco.push(j);
  return { ok: true, msg: `${j.nome} contratado como jogador livre (sem custo de transferência).` };
}

export function multaRescisao(j) { return arred(salarioDe(j) * Math.max(1, j.contrato) * 0.5); }

export function dispensar(liga, usuario, jogadorId) {
  const eu = liga.times[usuario];
  const j = eu.elenco.find((x) => x.id === jogadorId);
  if (!j) return { ok: false, msg: "Jogador não encontrado." };
  const c = contagem(eu.elenco); c[j.pos]--;
  if (c[j.pos] < MIN_VENDA[j.pos]) return { ok: false, msg: `Mínimo de ${MIN_VENDA[j.pos]} ${POS_NAME[j.pos].toLowerCase()}es no elenco.` };
  const multa = multaRescisao(j);
  if (eu.caixa < multa) return { ok: false, msg: "Sem caixa para pagar a multa de rescisão." };
  eu.caixa = arred(eu.caixa - multa);
  eu.elenco = eu.elenco.filter((x) => x.id !== j.id);
  eu.titulares = eu.titulares.length === 11 && !eu.titulares.includes(j.id) ? eu.titulares : melhorTime(eu.elenco, eu.formacao);
  j.livre = true; j.contrato = 0; liga.livres.push(j);
  return { ok: true, msg: `${j.nome} dispensado (multa R$ ${multa.toFixed(2)} mi).`, multa };
}

export const custoRenovacao = (j) => arred(Math.max(0.1, valorDe(j) * 0.1));

export function renovar(liga, usuario, jogadorId, anos) {
  const eu = liga.times[usuario];
  const j = eu.elenco.find((x) => x.id === jogadorId);
  if (!j) return { ok: false, msg: "Jogador não encontrado." };
  const custo = custoRenovacao(j);
  if (eu.caixa < custo) return { ok: false, msg: "Sem caixa para as luvas da renovação." };
  eu.caixa = arred(eu.caixa - custo);
  j.contrato = anos;
  liga.vencendo = liga.vencendo.filter((id) => id !== j.id);
  return { ok: true, msg: `${j.nome} renovou por ${anos} ano(s) (luvas R$ ${custo.toFixed(2)} mi).` };
}

// ---------- fim e início de temporada ----------
// 1) encerra: prêmios, resumo, quem sobe e desce, contratos vencendo
export function encerrarTemporada(liga, usuario, rng = Math.random) {
  const tab = tabela(liga);
  tab.forEach((x, i) => { liga.times[x.id].caixa = arred(liga.times[x.id].caixa + (PREMIOS[i] ?? 0)); });
  const pos = tab.findIndex((x) => x.id === usuario) + 1;
  const rebaixados = tab.slice(-VAGAS_REBAIXAMENTO).map((x) => x.id);
  // quem sobe da Série B: força + sorte
  const b = liga.serieB.map((c) => ({ c, nota: c.forca + (rng() + rng() + rng() - 1.5) * 8 })).sort((x, y) => y.nota - x.nota);
  const promovidos = b.slice(0, VAGAS_REBAIXAMENTO).map((x) => x.c);
  liga.vencendo = liga.times[usuario].elenco.filter((j) => j.contrato <= 1).map((j) => j.id);
  liga.resumo = {
    temporada: liga.temporada,
    campeao: tab[0].nome, campeaoId: tab[0].id, pos, premio: PREMIOS[pos - 1] ?? 0,
    rebaixados: rebaixados.map((id) => liga.times[id].nome),
    rebaixadoIds: rebaixados, promovidos: promovidos.map((c) => c.nome),
    usuarioRebaixado: rebaixados.includes(usuario),
  };
  liga.pendentePromovidos = promovidos.map((c) => c.sigla);
  return liga.resumo;
}

function evolui(rng, j) {
  j.idade++;
  const d = j.idade <= 21 ? ri(rng, 1, 5) : j.idade <= 24 ? ri(rng, 0, 3) : j.idade <= 30 ? ri(rng, -1, 2) : j.idade <= 33 ? ri(rng, -3, 1) : ri(rng, -4, 0);
  j.ovr = clamp(j.ovr + d, 38, 92);
}

// 2) começa a próxima: contratos, evolução, aposentadoria, base, subida/descida, calendário
export function iniciarTemporada(liga, usuario, rng = Math.random) {
  const aposentados = [];
  const saiu = []; // contratos que acabaram (usuário)
  const subs = liga.resumo ? liga.resumo.rebaixadoIds : [];
  for (const t of liga.times) {
    const ehUsuario = t.id === usuario;
    for (const j of [...t.elenco]) {
      j.contrato--;
      evolui(rng, j);
      j.lesao = 0; j.susp = 0; j.amarelos = 0;
      const aposenta = j.idade >= 38 || (j.idade >= 35 && rng() < 0.3);
      const acabou = j.contrato <= 0 && (ehUsuario || rng() < 0.2);
      if (aposenta) { t.elenco = t.elenco.filter((x) => x.id !== j.id); if (ehUsuario) aposentados.push(j.nome); }
      else if (acabou) {
        t.elenco = t.elenco.filter((x) => x.id !== j.id);
        j.livre = true; liga.livres.push(j);
        if (ehUsuario) saiu.push(j.nome);
      } else if (j.contrato <= 0) j.contrato = ri(rng, 1, 3); // IA renova
    }
    // categorias de base: 2 jovens por ano
    for (let k = 0; k < 2; k++) t.elenco.push(jogadorDaBase(liga, rng, pickOne(rng, POS_ORDER), t.forca));
    preencherElenco(liga, rng, t, t.forca);
    // IA enxuga elenco grande demais
    while (!ehUsuario && t.elenco.length > MAX_ELENCO - 2) {
      const pior = [...t.elenco].sort((a, b) => a.ovr - b.ovr).find((j) => contagem(t.elenco)[j.pos] > MIN_POS[j.pos]);
      if (!pior) break;
      t.elenco = t.elenco.filter((x) => x.id !== pior.id);
    }
    t.titulares = melhorTime(t.elenco, t.formacao);
    // força de referência acompanha o elenco
    t.forca = forcaDoTime(t.elenco, t.titulares, t.formacao).geral;
  }
  // livres que ficaram velhos somem; repõe o mercado
  liga.livres = liga.livres.filter((j) => j.idade < 36).slice(-40);
  gerarLivres(liga, rng, 24);

  // sobe e desce
  if (liga.resumo && liga.pendentePromovidos) {
    const entram = liga.serieB.filter((c) => liga.pendentePromovidos.includes(c.sigla));
    const saem = [];
    subs.forEach((id, i) => {
      const velho = liga.times[id];
      saem.push(velho);
      const novo = entram[i];
      if (novo) liga.times[id] = montaTime(liga, rng, { ...novo, caixa: 20, jogadores: [] }, id);
    });
    // clubes rebaixados (exceto o do usuário) viram clubes da Série B
    liga.serieB = liga.serieB.filter((c) => !liga.pendentePromovidos.includes(c.sigla));
    saem.forEach((t) => liga.serieB.push({ sigla: t.sigla, nome: t.nome, hue: t.hue, forca: t.forca }));
    liga.pendentePromovidos = null;
  }
  liga.temporada++;
  liga.rodada = 0; liga.resultados = []; liga.gols = {};
  liga.calendario = calendario(liga.times.length);
  liga.vencendo = liga.times[usuario].elenco.filter((j) => j.contrato <= 1).map((j) => j.id);
  return { aposentados, saiu };
}

// usuário rebaixado: antes de iniciarTemporada, assume outro clube que continua na Série A
export function clubesParaAssumir(liga) {
  const fora = new Set(liga.resumo ? liga.resumo.rebaixadoIds : []);
  return liga.times.filter((t) => !fora.has(t.id));
}
