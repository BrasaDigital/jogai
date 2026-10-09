import { mk, pick, take } from "/js/quiz.js";
import { PORTOS, PORTOS_BR, AEROPORTOS, FATOS } from "/rotas/data.js";

const paises = [...new Set(PORTOS.map((p) => p[1]))];

function portoPais() {
  const [porto, pais] = pick(PORTOS)[0];
  return mk(`Em qual país fica o porto de ${porto}?`, pais, pick(paises.filter((p) => p !== pais), 3), `${porto} fica em: ${pais}.`);
}
function paisPorto() {
  const [porto, pais] = pick(PORTOS)[0];
  const mesmos = PORTOS.filter((p) => p[1] === pais).map((p) => p[0]);
  const errados = pick(PORTOS.filter((p) => p[1] !== pais).map((p) => p[0]), 3);
  return mk(`Qual destes portos fica em: ${pais}?`, porto, errados, `${porto} fica em ${pais}.`);
}
function portoBr() {
  const [porto, uf] = pick(PORTOS_BR)[0];
  const ufs = [...new Set(PORTOS_BR.map((p) => p[1]))].filter((u) => u !== uf);
  return mk(`Em qual estado fica o porto de ${porto}?`, uf, pick(ufs, 3), `${porto} fica em ${uf}.`);
}
function iata() {
  const [cod, nome] = pick(AEROPORTOS)[0];
  return mk(`Qual aeroporto tem o código IATA ${cod}?`, nome, pick(AEROPORTOS.filter((a) => a[0] !== cod).map((a) => a[1]), 3), `${cod} = ${nome}.`);
}
const fato = () => { const [q, c, e, w] = pick(FATOS)[0]; return mk(q, c, e, w); };

export function makeRotas(level, count) {
  const pool = level <= 3 ? [portoBr, portoBr, fato, fato, paisPorto]
    : level <= 6 ? [portoPais, paisPorto, fato, iata, portoBr]
    : [portoPais, paisPorto, iata, iata, fato, fato];
  return take(pool, count);
}
