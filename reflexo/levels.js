// Níveis do Teste de Reflexo.
// Para passar, a média das 3 rodadas precisa ser menor ou igual à meta do nível (em ms).
export const TARGETS = [650, 550, 480, 430, 400, 370, 345, 320, 300, 280];
export const LEVELS = TARGETS.length;

export function targetOf(level) {
  return TARGETS[Math.min(Math.max(level, 1), LEVELS) - 1];
}

export function passed(level, avgMs) {
  return avgMs <= targetOf(level);
}
