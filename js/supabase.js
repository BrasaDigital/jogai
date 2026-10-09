// Cliente do Supabase (login + banco).
// A chave publishable pode ficar no front-end: quem protege os dados são as
// políticas RLS das tabelas.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://tzmyoraisebwakdzplaw.supabase.co";
const SUPABASE_KEY = "sb_publishable_1LqhQVDViiXzujdv4yy1HQ_5qTvNDYW";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

// Top N de um jogo (só o melhor resultado de cada jogador).
// `ascending = true` quando menor é melhor (ex.: tempo).
// `level` é opcional (jogos com várias fases, como o Encaixe).
export async function getRanking(game, { ascending = true, limit = 10, level = null } = {}) {
  let q = supabase.from("ranking").select("player_name,score,created_at").eq("game", game);
  if (level !== null) q = q.eq("level", level);
  const { data, error } = await q
    .order("score", { ascending })
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error("Não foi possível carregar o ranking.");
  return data;
}

// Salva uma pontuação do jogador logado.
// O nome e o dono vêm do servidor (apelido do perfil), não daqui.
export async function saveScore(game, score, level = null) {
  const row = { game, score };
  if (level !== null) row.level = level;
  const { error } = await supabase.from("scores").insert(row);
  if (error) {
    if (error.code === "42501") throw new Error("Entre na sua conta para salvar no ranking.");
    throw new Error("Não foi possível salvar sua pontuação.");
  }
}
