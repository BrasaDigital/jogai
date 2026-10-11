// Sudoku: gerador com solução única. Grade = array de 81 números (0 = vazio).
const ROWS = Array.from({ length: 81 }, (_, i) => Math.floor(i / 9));
const COLS = Array.from({ length: 81 }, (_, i) => i % 9);
const BOX = Array.from({ length: 81 }, (_, i) => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3));

function shuffle(a, rng) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// conta soluções (até `limite`); se `guardar`, devolve a primeira em guardar.grade
export function contarSolucoes(grade, limite = 2, rng = null, guardar = null) {
  const g = grade.slice();
  const lin = Array(9).fill(0), col = Array(9).fill(0), box = Array(9).fill(0);
  for (let i = 0; i < 81; i++) if (g[i]) { const b = 1 << g[i]; if ((lin[ROWS[i]] | col[COLS[i]] | box[BOX[i]]) & b) return 0; lin[ROWS[i]] |= b; col[COLS[i]] |= b; box[BOX[i]] |= b; }
  let achou = 0;
  function rec() {
    // casa vazia com menos candidatos
    let melhor = -1, menor = 10, cand = 0;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const usados = lin[ROWS[i]] | col[COLS[i]] | box[BOX[i]];
      let livres = 0, n = 0;
      for (let v = 1; v <= 9; v++) if (!(usados & (1 << v))) { livres |= 1 << v; n++; }
      if (n < menor) { menor = n; melhor = i; cand = livres; if (n <= 1) break; }
    }
    if (melhor === -1) { achou++; if (guardar && !guardar.grade) guardar.grade = g.slice(); return achou >= limite; }
    if (menor === 0) return false;
    let vals = [];
    for (let v = 1; v <= 9; v++) if (cand & (1 << v)) vals.push(v);
    if (rng) shuffle(vals, rng);
    for (const v of vals) {
      const b = 1 << v;
      g[melhor] = v; lin[ROWS[melhor]] |= b; col[COLS[melhor]] |= b; box[BOX[melhor]] |= b;
      if (rec()) return true;
      g[melhor] = 0; lin[ROWS[melhor]] &= ~b; col[COLS[melhor]] &= ~b; box[BOX[melhor]] &= ~b;
    }
    return false;
  }
  rec();
  return achou;
}

export function gerarCompleto(rng = Math.random) {
  const out = {};
  contarSolucoes(Array(81).fill(0), 1, rng, out);
  return out.grade;
}

// remove casas até sobrar `pistas` (ou até não dar mais sem perder a solução única)
export function gerarPuzzle(pistas, rng = Math.random) {
  const solucao = gerarCompleto(rng);
  const puzzle = solucao.slice();
  const ordem = shuffle(Array.from({ length: 81 }, (_, i) => i), rng);
  let restantes = 81;
  for (const i of ordem) {
    if (restantes <= pistas) break;
    const v = puzzle[i];
    puzzle[i] = 0;
    if (contarSolucoes(puzzle, 2) !== 1) puzzle[i] = v; else restantes--;
  }
  return { puzzle, solucao, pistas: restantes };
}

// índices com número repetido na linha, coluna ou quadrado
export function conflitos(grade) {
  const bad = new Set();
  const grupos = [ROWS, COLS, BOX];
  for (const G of grupos) {
    const vistos = new Map();
    for (let i = 0; i < 81; i++) {
      if (!grade[i]) continue;
      const k = G[i] * 10 + grade[i];
      if (vistos.has(k)) { bad.add(i); bad.add(vistos.get(k)); } else vistos.set(k, i);
    }
  }
  return bad;
}

export const completo = (grade) => grade.every((v) => v) && conflitos(grade).size === 0;
