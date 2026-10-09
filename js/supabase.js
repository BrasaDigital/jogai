// Configuração pública do Supabase (a chave publishable pode ficar no front-end;
// quem protege os dados são as políticas RLS da tabela "scores").
const SUPABASE_URL = "https://tzmyoraisebwakdzplaw.supabase.co";
const SUPABASE_KEY = "sb_publishable_1LqhQVDViiXzujdv4yy1HQ_5qTvNDYW";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

// Busca o top N de um jogo. `ascending = true` quando menor é melhor (ex.: tempo).
export async function getRanking(game, { ascending = true, limit = 10 } = {}) {
  const order = ascending ? "score.asc" : "score.desc";
  const url =
    `${SUPABASE_URL}/rest/v1/scores?game=eq.${encodeURIComponent(game)}` +
    `&select=player_name,score,created_at&order=${order},created_at.asc&limit=${limit}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error("Não foi possível carregar o ranking.");
  return res.json();
}

// Salva uma pontuação.
export async function saveScore(game, playerName, score) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({ game, player_name: playerName.trim(), score }),
  });
  if (!res.ok) throw new Error("Não foi possível salvar sua pontuação.");
}
