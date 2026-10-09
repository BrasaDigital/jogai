import { mk, pick, take } from "/js/quiz.js";
import { CAP, PRODUTOS_CAP, POSICOES } from "/ncm/data.js";

const capLabel = (c) => `Cap. ${c} — ${CAP[c]}`;

function capQ() {
  const [prod, cap] = pick(PRODUTOS_CAP)[0];
  const errados = pick(Object.keys(CAP).filter((c) => c !== cap), 3);
  return mk(`Em qual capítulo do SH/NCM se classifica: ${prod}?`, capLabel(cap), errados.map(capLabel),
    `${prod} fica no capítulo ${cap} (${CAP[cap]}).`);
}
// fácil: só capítulos bem distintos entre si
function capFacil() {
  const [prod, cap] = pick(PRODUTOS_CAP)[0];
  const pool = Object.keys(CAP).filter((c) => c !== cap && c[0] !== cap[0]);
  return mk(`Em qual capítulo do SH/NCM se classifica: ${prod}?`, capLabel(cap), pick(pool, 3).map(capLabel),
    `${prod} fica no capítulo ${cap} (${CAP[cap]}).`);
}
function posQ() {
  const [prod, pos, tit] = pick(POSICOES)[0];
  const errados = pick(POSICOES.filter((p) => p[1] !== pos), 3).map((p) => p[1]);
  return mk(`Qual a posição (4 dígitos do SH) de: ${prod}?`, pos, errados, `${pos} — ${tit}.`);
}
function posReversa() {
  const [, pos, tit] = pick(POSICOES)[0];
  const errados = pick(POSICOES.filter((p) => p[1] !== pos), 3).map((p) => p[2]);
  return mk(`O que descreve a posição ${pos}?`, tit, errados, `${pos} — ${tit}.`);
}
const regras = [
  () => mk("Quantos dígitos tem a NCM?", "8", ["6", "10", "12"], "O SH tem 6 dígitos; o Mercosul acrescenta mais 2, formando a NCM de 8 dígitos."),
  () => mk("Quantos dígitos do código são comuns a todos os países que usam o SH?", "6", ["4", "8", "10"], "Os 6 primeiros dígitos são do Sistema Harmonizado."),
  () => mk("Os 2 dígitos finais da NCM (7º e 8º) foram acrescentados por…", "Mercosul", ["ONU", "Receita Federal sozinha", "OMC"], "A NCM é a nomenclatura comum do Mercosul."),
  () => mk("Os 2 primeiros dígitos da NCM indicam…", "O capítulo", ["O país de origem", "O imposto devido", "O tipo de transporte"], "Capítulo (2), posição (4), subposição (6)."),
  () => mk("A TEC (Tarifa Externa Comum) é baseada em qual código?", "NCM", ["CNPJ", "CEP", "CFOP"], "A alíquota de importação é definida por NCM."),
  () => mk("O CFOP identifica…", "A natureza da operação fiscal", ["O produto na importação", "O porto de embarque", "O tipo de contêiner"], "A NCM identifica a mercadoria; o CFOP, a operação."),
];

export function makeNcm(level, count) {
  const pool = level <= 3 ? [capFacil, capFacil, ...regras]
    : level <= 6 ? [capQ, capQ, capQ, ...regras]
    : level <= 8 ? [capQ, posQ, posQ, posReversa]
    : [posQ, posQ, posReversa, posReversa, capQ];
  return take(pool, count);
}
