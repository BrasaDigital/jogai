// Motor do Mister: times fictícios, elenco, escalação, partida simulada, tabela.
// Sem DOM: pode ser testado no node. `rng` é injetável (padrão Math.random).

export const FORMATIONS = {
  "4-4-2": { D: 4, M: 4, A: 2 },
  "4-3-3": { D: 4, M: 3, A: 3 },
  "3-5-2": { D: 3, M: 5, A: 2 },
  "4-5-1": { D: 4, M: 5, A: 1 },
  "5-3-2": { D: 5, M: 3, A: 2 },
};
export const POS_ORDER = ["G", "D", "M", "A"];
export const POS_NAME = { G: "Goleiro", D: "Defensor", M: "Meia", A: "Atacante" };

const NOMES = ["João", "Pedro", "Lucas", "Gabriel", "Mateus", "Rafael", "Bruno", "Felipe", "Thiago", "Diego", "Caio", "Vitor", "Leandro", "Rodrigo", "Marcelo", "André", "Henrique", "Gustavo", "Renan", "Danilo", "Everton", "Fábio", "Igor", "Jonas", "Kauê", "Leonardo", "Murilo", "Nathan", "Otávio", "Paulo"];
const SOBRENOMES = ["Silva", "Souza", "Costa", "Santos", "Oliveira", "Pereira", "Lima", "Ferreira", "Almeida", "Ribeiro", "Carvalho", "Gomes", "Martins", "Rocha", "Barbosa", "Moreira", "Nunes", "Teixeira", "Araújo", "Cardoso", "Dias", "Freitas", "Machado", "Pinto", "Vieira", "Moura", "Campos", "Borges", "Rezende", "Matos"];

export const CLUBES = [
  { nome: "Vale Verde AC", sigla: "VVE", hue: 140 },
  { nome: "Ribeirão SC", sigla: "RIB", hue: 0 },
  { nome: "Serra Azul EC", sigla: "SAZ", hue: 215 },
  { nome: "União Porto Norte", sigla: "UPN", hue: 30 },
  { nome: "Planalto GR", sigla: "PLA", hue: 275 },
  { nome: "Costa Dourada AA", sigla: "CDO", hue: 48 },
  { nome: "Ipê FC", sigla: "IPE", hue: 320 },
  { nome: "Cerrado EC", sigla: "CER", hue: 95 },
];

const ri = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const pickOne = (rng, arr) => arr[Math.floor(rng() * arr.length)];

// ---------- elenco ----------
const ELENCO = { G: 2, D: 6, M: 6, A: 4 }; // 18 jogadores
let _id = 0;

export function gerarJogador(rng, pos, base) {
  const idade = ri(rng, 18, 36);
  const ovr = clamp(Math.round(base + (rng() + rng() + rng() - 1.5) * 12), 38, 92);
  return { id: ++_id, nome: `${pickOne(rng, NOMES)} ${pickOne(rng, SOBRENOMES)}`, pos, ovr, idade };
}

export function gerarElenco(rng, base) {
  const out = [];
  for (const p of POS_ORDER) for (let i = 0; i < ELENCO[p]; i++) out.push(gerarJogador(rng, p, base));
  return out;
}

// ---------- escalação ----------
// devolve os ids dos 11 titulares: melhores de cada posição para a formação
export function melhorTime(elenco, formacao) {
  const f = FORMATIONS[formacao];
  const need = { G: 1, D: f.D, M: f.M, A: f.A };
  const ids = [];
  for (const p of POS_ORDER) {
    elenco.filter((j) => j.pos === p).sort((a, b) => b.ovr - a.ovr).slice(0, need[p]).forEach((j) => ids.push(j.id));
  }
  return ids;
}

export function escalacaoValida(elenco, formacao, ids) {
  const f = FORMATIONS[formacao];
  if (!f || new Set(ids).size !== 11) return false;
  const need = { G: 1, D: f.D, M: f.M, A: f.A };
  const cnt = { G: 0, D: 0, M: 0, A: 0 };
  for (const id of ids) {
    const j = elenco.find((x) => x.id === id);
    if (!j) return false;
    cnt[j.pos]++;
  }
  return POS_ORDER.every((p) => cnt[p] === need[p]);
}

export function forcaDoTime(elenco, ids) {
  const xi = ids.map((id) => elenco.find((j) => j.id === id));
  const por = (p) => xi.filter((j) => j.pos === p).map((j) => j.ovr);
  const gk = mean(por("G")), def = mean(por("D")), mid = mean(por("M")), att = mean(por("A"));
  return {
    ataque: att * 0.55 + mid * 0.45,
    defesa: def * 0.6 + gk * 0.4,
    meio: mid,
    geral: Math.round((gk + def * 4 + mid * 4 + att * 2) / 11),
  };
}

// ---------- liga ----------
export function novaLiga(rng = Math.random) {
  const tiers = [76, 73, 70, 68, 66, 64, 62, 60].sort(() => rng() - 0.5);
  const times = CLUBES.map((c, i) => {
    const elenco = gerarElenco(rng, tiers[i]);
    const formacao = "4-4-2";
    return { ...c, id: i, elenco, formacao, titulares: melhorTime(elenco, formacao) };
  });
  return { temporada: 1, times, rodada: 0, calendario: calendario(times.length), resultados: [], gols: {} };
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
  const returno = rodadas.map((js) => js.map(([a, b]) => [b, a]));
  return [...rodadas, ...returno];
}

// ---------- partida ----------
// parâmetros de calibragem da simulação
export const CAL = { c0: 0.09, ce: 1.0, g0: 0.29, ge: 0.5, jog: 1.0 };

const FRASES_CHANCE = ["arma o ataque", "chega pela direita", "chega pela esquerda", "toca de primeira", "acelera no contra-ataque", "cruza na área"];
const FRASES_GOL = ["balança a rede!", "não perdoa e marca!", "bate firme e é GOL!", "completa de cabeça para o gol!", "finaliza no canto e faz!"];
const FRASES_DEFESA = ["O goleiro faz grande defesa!", "A defesa afasta o perigo!", "O goleiro espalma para escanteio!"];
const FRASES_FORA = ["A bola passa por cima do gol.", "Bate fraco, pra fora.", "Chutou na trave!"];

function escolheArtilheiro(rng, elenco, ids) {
  const xi = ids.map((id) => elenco.find((j) => j.id === id)).filter((j) => j.pos !== "G");
  const peso = { D: 0.15, M: 0.9, A: 2.6 };
  const w = xi.map((j) => peso[j.pos] * (j.ovr / 60) ** 3);
  let x = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < xi.length; i++) { x -= w[i]; if (x <= 0) return xi[i]; }
  return xi[xi.length - 1];
}

// simula 90 minutos. casa/fora: {nome, elenco, titulares}. Devolve placar e lances.
export function simularPartida(casa, fora, rng = Math.random) {
  const H = forcaDoTime(casa.elenco, casa.titulares);
  const A = forcaDoTime(fora.elenco, fora.titulares);
  const placar = [0, 0];
  const lances = [];
  const gols = []; // {time, jogador}
  const mando = 6; // vantagem de jogar em casa (no meio-campo)
  for (let min = 1; min <= 90; min++) {
    const pCasa = (H.meio + mando) / (H.meio + mando + A.meio);
    const ataca = rng() < pCasa ? 0 : 1;
    const [atk, def, atkTime] = ataca === 0 ? [H, A, casa] : [A, H, fora];
    // chance de criar jogada perigosa
    const razao = atk.ataque / def.defesa;
    const pChance = clamp(CAL.c0 * razao ** CAL.ce, 0.02, 0.4);
    if (rng() > pChance) continue;
    const jogador = escolheArtilheiro(rng, atkTime.elenco, atkTime.titulares);
    // qualidade da finalização contra o goleiro/defesa
    const pGol = clamp(CAL.g0 * razao ** CAL.ge * (jogador.ovr / 68) ** CAL.jog, 0.05, 0.6);
    const r = rng();
    const nome = `${jogador.nome} (${atkTime.sigla})`;
    if (r < pGol) {
      placar[ataca]++;
      gols.push({ time: ataca, jogador: jogador.id });
      lances.push({ min, time: ataca, tipo: "gol", texto: `⚽ GOL! ${nome} ${pickOne(rng, FRASES_GOL)}`, placar: [...placar] });
    } else if (r < pGol + (1 - pGol) * 0.55) {
      lances.push({ min, time: ataca, tipo: "defesa", texto: `${atkTime.sigla} ${pickOne(rng, FRASES_CHANCE)}. ${pickOne(rng, FRASES_DEFESA)}` });
    } else {
      lances.push({ min, time: ataca, tipo: "fora", texto: `${nome}: ${pickOne(rng, FRASES_FORA)}` });
    }
  }
  return { placar, lances, gols };
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

// joga a rodada atual inteira; `deixarDeFora` = id do jogo do usuário (já simulado fora) — opcional
export function jogarRodada(liga, rng = Math.random, jogoUsuarioPronto = null) {
  const jogos = liga.calendario[liga.rodada];
  const saidas = [];
  for (const [c, f] of jogos) {
    const pronto = jogoUsuarioPronto && jogoUsuarioPronto.casa === c && jogoUsuarioPronto.fora === f ? jogoUsuarioPronto.sim : null;
    const sim = pronto || simularPartida(liga.times[c], liga.times[f], rng);
    registrar(liga, c, f, sim);
    saidas.push({ casa: c, fora: f, placar: sim.placar });
  }
  liga.rodada++;
  return saidas;
}

function registrar(liga, c, f, sim) {
  liga.resultados.push({ rodada: liga.rodada, casa: c, fora: f, placar: sim.placar });
  for (const g of sim.gols) liga.gols[g.jogador] = (liga.gols[g.jogador] || 0) + 1;
}

export const temporadaAcabou = (liga) => liga.rodada >= liga.calendario.length;

export function artilheiros(liga, n = 8) {
  const out = [];
  for (const t of liga.times) for (const j of t.elenco) if (liga.gols[j.id]) out.push({ nome: j.nome, sigla: t.sigla, gols: liga.gols[j.id], hue: t.hue });
  return out.sort((a, b) => b.gols - a.gols || a.nome.localeCompare(b.nome)).slice(0, n);
}

// ---------- IA e virada de temporada ----------
export function ajustaIA(liga, usuario) {
  for (const t of liga.times) {
    if (t.id === usuario) continue;
    t.titulares = melhorTime(t.elenco, t.formacao);
  }
}

export function novaTemporada(liga, rng = Math.random) {
  for (const t of liga.times) {
    for (const j of t.elenco) {
      j.idade++;
      const d = j.idade <= 23 ? ri(rng, 0, 4) : j.idade <= 30 ? ri(rng, -1, 2) : ri(rng, -3, 0);
      j.ovr = clamp(j.ovr + d, 38, 92);
    }
  }
  liga.temporada++;
  liga.rodada = 0;
  liga.resultados = [];
  liga.gols = {};
  liga.calendario = calendario(liga.times.length);
}
