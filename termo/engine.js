// Regras do Termo: 2 = letra certa no lugar, 1 = letra existe em outro lugar, 0 = não tem
export function avaliar(tentativa, resposta) {
  const n = resposta.length, res = Array(n).fill(0), resto = {};
  for (let i = 0; i < n; i++) {
    if (tentativa[i] === resposta[i]) res[i] = 2;
    else resto[resposta[i]] = (resto[resposta[i]] || 0) + 1;
  }
  for (let i = 0; i < n; i++) {
    if (res[i] === 0 && resto[tentativa[i]] > 0) { res[i] = 1; resto[tentativa[i]]--; }
  }
  return res;
}
export const sortear = (lista, qtd, rng = Math.random) => {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, qtd);
};
