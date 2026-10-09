// Progresso dos jogadores nos níveis.
// - Sem login: fica salvo neste aparelho.
// - Com login: fica salvo na conta (tabela `progress`) e vale em qualquer aparelho.
// Ao entrar, o que foi concluído neste aparelho sobe para a conta, em ordem.
import { supabase } from "/js/supabase.js";
import { onAuthChange } from "/js/account.js";
import { isUnlocked as unlocked, firstOpen as open } from "/js/levels.js";

const GAMES = ["reflexo", "encaixe", "cobrinha", "memoria", "alvo", "simon", "incoterms", "ncm", "processo", "erros", "rotas"];
export const GUEST_MAX = 3; // sem conta, só os 3 primeiros níveis
const GUEST_KEY = "jogai_progress_guest";
const LEGACY_ENCAIXE = "jogai_encaixe_done"; // chave da versão anterior do Encaixe

const emptySets = () => Object.fromEntries(GAMES.map((g) => [g, new Set()]));

let done = emptySets();
let uid = null;
const listeners = new Set();
const emit = () => listeners.forEach((cb) => cb());

function loadGuest() {
  const out = emptySets();
  try {
    const raw = JSON.parse(localStorage.getItem(GUEST_KEY) || "{}");
    GAMES.forEach((g) => (raw[g] || []).forEach((n) => out[g].add(n)));
  } catch (_) {}
  try {
    JSON.parse(localStorage.getItem(LEGACY_ENCAIXE) || "[]").forEach((n) => out.encaixe.add(n));
  } catch (_) {}
  return out;
}

function saveGuest(sets) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(
      Object.fromEntries(GAMES.map((g) => [g, [...sets[g]]]))
    ));
    localStorage.removeItem(LEGACY_ENCAIXE);
  } catch (_) {}
}

async function push(game, level) {
  const { error } = await supabase.from("progress").insert({ game, level });
  return !error || error.code === "23505"; // 23505 = já estava salvo
}

async function syncFromAccount() {
  const { data, error } = await supabase.from("progress").select("game,level");
  if (error) return; // sem rede: mantém o que está na memória
  const server = emptySets();
  data.forEach((r) => { if (server[r.game]) server[r.game].add(r.level); });

  // sobe o que foi concluído neste aparelho e a conta ainda não tem
  const guest = loadGuest();
  for (const g of GAMES) {
    const missing = [...guest[g]].filter((n) => !server[g].has(n)).sort((a, b) => a - b);
    for (const n of missing) {
      if (await push(g, n)) server[g].add(n);
      else break; // o servidor só aceita em ordem
    }
  }
  saveGuest(emptySets());
  done = server;
  emit();
}

onAuthChange(({ user }) => {
  if (user) {
    if (user.id === uid) return;
    uid = user.id;
    syncFromAccount().catch(() => {});
  } else {
    uid = null;
    done = loadGuest();
    emit();
  }
});

// Chama `cb()` agora e sempre que o progresso mudar (login, logout, nível concluído).
export function onProgress(cb) {
  listeners.add(cb);
  cb();
}

export const isDone = (game, level) => done[game].has(level);
export const needsLogin = (level) => !uid && level > GUEST_MAX;
export const isUnlocked = (game, level) => !needsLogin(level) && unlocked(done[game], level);
export const firstOpen = (game, max) => open(done[game], uid ? max : Math.min(max, GUEST_MAX));

export async function completeLevel(game, level) {
  done[game].add(level);
  if (!uid) saveGuest(done);
  emit();
  if (uid) await push(game, level);
}
