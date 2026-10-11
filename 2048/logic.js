// 2048 em grade 4x4. Grade = array de 16 números.
export const N = 4;
export const novo = () => Array(N * N).fill(0);

export function adicionar(g, rng = Math.random) {
  const livres = [];
  g.forEach((v, i) => { if (!v) livres.push(i); });
  if (!livres.length) return false;
  g[livres[Math.floor(rng() * livres.length)]] = rng() < 0.9 ? 2 : 4;
  return true;
}

function comprime(linha) {
  const xs = linha.filter((v) => v);
  const out = [];
  for (let i = 0; i < xs.length; i++) {
    if (xs[i] === xs[i + 1]) { out.push(xs[i] * 2); i++; } else out.push(xs[i]);
  }
  while (out.length < N) out.push(0);
  return out;
}

// dir: "esq" | "dir" | "cima" | "baixo". Devolve { grade, moveu }
export function mover(g, dir) {
  const out = g.slice();
  for (let k = 0; k < N; k++) {
    const idx = Array.from({ length: N }, (_, i) =>
      dir === "esq" ? k * N + i : dir === "dir" ? k * N + (N - 1 - i) : dir === "cima" ? i * N + k : (N - 1 - i) * N + k);
    const nova = comprime(idx.map((i) => g[i]));
    idx.forEach((i, j) => (out[i] = nova[j]));
  }
  return { grade: out, moveu: out.some((v, i) => v !== g[i]) };
}

export const maior = (g) => Math.max(...g);
export function temMovimento(g) {
  return ["esq", "dir", "cima", "baixo"].some((d) => mover(g, d).moveu);
}
