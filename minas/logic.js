// Campo Minado.
export function novo(linhas, colunas, minas) {
  const cel = Array.from({ length: linhas * colunas }, () => ({ mina: false, aberta: false, bandeira: false, n: 0 }));
  return { linhas, colunas, minas, cel, comecou: false, perdeu: false, abertas: 0 };
}
const vizinhos = (s, i) => {
  const r = Math.floor(i / s.colunas), c = i % s.colunas, out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && rr < s.linhas && cc >= 0 && cc < s.colunas) out.push(rr * s.colunas + cc);
  }
  return out;
};
export { vizinhos };

// minas só são colocadas no primeiro clique, longe dele (a primeira jogada nunca perde)
export function colocarMinas(s, primeiro, rng = Math.random) {
  const proibidos = new Set([primeiro, ...vizinhos(s, primeiro)]);
  const livres = [];
  for (let i = 0; i < s.cel.length; i++) if (!proibidos.has(i)) livres.push(i);
  for (let k = livres.length - 1; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [livres[k], livres[j]] = [livres[j], livres[k]]; }
  livres.slice(0, s.minas).forEach((i) => (s.cel[i].mina = true));
  s.cel.forEach((c, i) => { c.n = vizinhos(s, i).filter((v) => s.cel[v].mina).length; });
  s.comecou = true;
}

export function revelar(s, i, rng = Math.random) {
  if (s.perdeu) return;
  const c = s.cel[i];
  if (c.aberta || c.bandeira) return;
  if (!s.comecou) colocarMinas(s, i, rng);
  if (c.mina) { c.aberta = true; s.perdeu = true; return; }
  const fila = [i];
  while (fila.length) {
    const k = fila.pop();
    const x = s.cel[k];
    if (x.aberta || x.bandeira) continue;
    x.aberta = true; s.abertas++;
    if (x.n === 0) vizinhos(s, k).forEach((v) => { if (!s.cel[v].aberta) fila.push(v); });
  }
}

export function bandeira(s, i) {
  const c = s.cel[i];
  if (!c.aberta && !s.perdeu) c.bandeira = !c.bandeira;
}
export const bandeiras = (s) => s.cel.filter((c) => c.bandeira).length;
export const venceu = (s) => !s.perdeu && s.abertas === s.cel.length - s.minas;
