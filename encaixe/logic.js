// Regras do Encaixe (sem nada de tela, para poder testar por código).
// Tabuleiro 7 colunas x 4 linhas. O = círculo, X = cruz, S = quadrado.

export const ROWS = 4;
export const COLS = 7;
export const BOARD = [
  "OOXXXOS",
  "OSSSXSX",
  "SOXOOSO",
  "SOXSXXO",
];

// Dominós: forma de cima e de baixo (a peça pode girar)
const DOM = { A: "OX", B: "SX", C: "OS", D: "XX", E: "SS", F: "OO" };

// Peças em L (lado da frente), grade 2x2 com null no canto sem furo
const LP = {
  G: [["O", null], ["S", "S"]],
  H: [["X", "O"], ["S", null]],
  I: [["S", null], ["O", "X"]],
  J: [["X", null], ["X", "S"]],
  K: [["O", null], ["O", "S"]],
  L: [["S", null], ["O", "O"]],
  M: [["S", null], ["X", "O"]],
  N: [["X", null], ["S", "O"]],
};

export const NAMES = "ABCDEFGHIJKLMN";

function baseCells(name) {
  if (DOM[name]) {
    const [a, b] = DOM[name];
    return [[0, 0, a], [0, 1, b]];
  }
  const out = [];
  LP[name].forEach((row, r) => row.forEach((s, c) => { if (s) out.push([r, c, s]); }));
  return out;
}

function norm(cells) {
  const mr = Math.min(...cells.map((x) => x[0]));
  const mc = Math.min(...cells.map((x) => x[1]));
  return cells
    .map(([r, c, s]) => [r - mr, c - mc, s])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

// gira 90 graus no sentido horário
function rotateCells(cells) {
  const maxR = Math.max(...cells.map((x) => x[0]));
  return norm(cells.map(([r, c, s]) => [c, maxR - r, s]));
}

// células [linha, coluna, forma] da peça girada `rot` vezes (0 a 3)
export function orient(name, rot) {
  let cells = norm(baseCells(name));
  for (let i = 0; i < rot; i++) cells = rotateCells(cells);
  return cells;
}

export function emptyOccupancy() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

// A célula (r0, c0) recebe a primeira célula da peça (em ordem de leitura).
export function computePlacement(name, rot, r0, c0, occupied) {
  const cells = orient(name, rot);
  const [ar, ac] = cells[0];
  let ok = true;
  const out = [];
  for (const [r, c, s] of cells) {
    const rr = r0 + r - ar;
    const cc = c0 + c - ac;
    out.push([rr, cc]);
    if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || BOARD[rr][cc] !== s || occupied[rr][cc] !== null) {
      ok = false;
    }
  }
  return { ok, cells: out };
}

export function formatTime(total) {
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}
