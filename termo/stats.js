// Datas (fuso de Brasília) e estatísticas dos jogos do dia. Sem dependências.
export const TRIES = 6;
export const spHoje = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const toUTC = (s) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };
export const diasEntre = (a, b) => Math.round((toUTC(b) - toUTC(a)) / 86400000);
export const prevDay = (s) => new Date(toUTC(s) - 86400000).toISOString().slice(0, 10);
export function estatisticas(hist, hoje) {
  const dias = Object.keys(hist).sort();
  const jogos = dias.length, vit = dias.filter((d) => hist[d].won).length;
  let seq = 0, d = hoje;
  if (!hist[d]) d = prevDay(d);
  while (hist[d] && hist[d].won) { seq++; d = prevDay(d); }
  let melhor = 0, run = 0, ant = null;
  for (const x of dias) {
    if (hist[x].won) { run = ant && diasEntre(ant, x) === 1 && run > 0 ? run + 1 : 1; } else run = 0;
    ant = x; melhor = Math.max(melhor, run);
  }
  const dist = Array(TRIES).fill(0);
  dias.forEach((x) => { if (hist[x].won) dist[hist[x].tries - 1]++; });
  return { jogos, vit, seq, melhor, dist };
}

