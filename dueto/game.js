import { criarJogoPalavras } from "/termo/ui.js";
import { sortear } from "/termo/engine.js";
import { RESPOSTAS } from "/termo/words.js";

// palavras ao mesmo tempo, tentativas (todas com 5 letras)
export const NIVEIS = [[1, 6], [2, 7], [2, 6], [3, 8], [3, 7], [3, 6], [4, 9], [4, 8], [4, 7], [4, 6]];
const nome = (q) => (q === 1 ? "1 palavra" : q === 2 ? "Dueto (2 palavras)" : q === 3 ? "Trio (3 palavras)" : "Quarteto (4 palavras)");
criarJogoPalavras({
  game: "dueto",
  nivel: (n) => ({ len: 5, tries: NIVEIS[n - 1][1], boards: NIVEIS[n - 1][0] }),
  escolher: (len, qtd, n, extra) => sortear([...new Set([...RESPOSTAS[len], ...extra])], qtd).map((palavra) => ({ palavra })),
  goalText: (n) => `${nome(NIVEIS[n - 1][0])} em ${NIVEIS[n - 1][1]} tentativas`,
});
