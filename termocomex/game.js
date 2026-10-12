import { criarJogoPalavras } from "/termo/ui.js";
import { sortear } from "/termo/engine.js";
import { COMEX } from "/termo/words.js";

export const NIVEIS = [[4, 7], [4, 6], [5, 7], [5, 6], [5, 5], [6, 7], [6, 6], [6, 5], [7, 6], [7, 5]];
criarJogoPalavras({
  game: "termocomex",
  nivel: (n) => ({ len: NIVEIS[n - 1][0], tries: NIVEIS[n - 1][1], boards: 1 }),
  escolher: (len) => sortear(COMEX[len], 1).map(([palavra, dica]) => ({ palavra, dica })),
  goalText: (n) => `Termo de comex com ${NIVEIS[n - 1][0]} letras em ${NIVEIS[n - 1][1]} tentativas`,
});
