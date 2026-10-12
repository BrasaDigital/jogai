import { criarJogoPalavras } from "/termo/ui.js";
import { sortear } from "/termo/engine.js";
import { RESPOSTAS } from "/termo/words.js";

// letras e tentativas por nível
export const NIVEIS = [[4, 7], [4, 6], [5, 7], [5, 6], [5, 5], [6, 7], [6, 6], [6, 5], [7, 6], [7, 5]];
criarJogoPalavras({
  game: "termo",
  nivel: (n) => ({ len: NIVEIS[n - 1][0], tries: NIVEIS[n - 1][1], boards: 1 }),
  escolher: (len) => sortear(RESPOSTAS[len], 1).map((palavra) => ({ palavra })),
  goalText: (n) => `Palavra de ${NIVEIS[n - 1][0]} letras em ${NIVEIS[n - 1][1]} tentativas`,
});
