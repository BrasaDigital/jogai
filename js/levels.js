// Regras de desbloqueio de níveis (sem tela, para poder testar por código).
// `done` é um Set com os números dos níveis já concluídos.

// Um nível está liberado se for o 1º, se o anterior foi concluído,
// ou se ele mesmo já foi concluído antes.
export function isUnlocked(done, level) {
  return level <= 1 || done.has(level - 1) || done.has(level);
}

// Primeiro nível ainda não concluído (ou o último, se todos foram concluídos).
export function firstOpen(done, max) {
  for (let l = 1; l <= max; l++) if (!done.has(l)) return l;
  return max;
}
