// Caça-palavras: gera a grade e confere seleções.
export const PALAVRAS = [
  "PORTO","NAVIO","CARGA","FRETE","TARIFA","ADUANA","DESPACHO","EMBARQUE","SEGURO","CAMBIO","TRIBUTO","IMPOSTO","LICENCA","FATURA","PEDIDO","ENTREGA","ARMAZEM","DEPOSITO","GUINDASTE","CAIS","ROTA","CONTEINER","IMPORTAR","EXPORTAR","MERCADORIA","TRANSPORTE",
  "BRASIL","FUTEBOL","CAFE","PRAIA","FLORESTA","MUSICA","LIVRO","JANELA","CIDADE","ESCOLA","AMIGO","SOLAR","CHUVA","MONTANHA","BICICLETA","COMPUTADOR","TELEFONE","FAMILIA","VIAGEM","AVIAO","CAMINHAO","TREM","RODOVIA","ESTRADA","MERCADO","DINHEIRO","BANCO",
  "MAPA","BUSSOLA","OCEANO","MARE","VELEIRO","PEIXE","FRUTA","BANANA","LARANJA","ABACAXI","MELANCIA","CHOCOLATE","PIZZA","FEIJAO","ARROZ","FAROFA","TAPIOCA","FUTURO","JOGO","TIME","GOLEIRO","ATACANTE","ZAGUEIRO","TECNICO","ESTADIO","CAMPEAO","TORCIDA","BOLA","REDE","TROFEU","JARDIM","FLOR","ARVORE","MONTE","RIO","LAGO","VENTO","NUVEM","ESTRELA","PLANETA","FOGUETE",
];
export const DIRS = {
  facil: [[0, 1], [1, 0]],
  medio: [[0, 1], [1, 0], [1, 1], [-1, 1]],
  dificil: [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]],
};
const ALFABETO = "ABCDEFGHIJKLMNOPRSTUVZ";

function embaralha(a, rng) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// devolve { grade: string[][], colocadas: [{palavra, r, c, dr, dc}] } ou null se não coube
export function gerar(n, qtd, dirs, rng = Math.random) {
  const maxLen = n;
  const candidatas = embaralha(PALAVRAS.filter((p) => p.length <= maxLen && p.length >= 4), rng);
  const grade = Array.from({ length: n }, () => Array(n).fill(""));
  const colocadas = [];
  for (const p of candidatas) {
    if (colocadas.length >= qtd) break;
    if (colocadas.some((x) => x.palavra === p || x.palavra.includes(p) || p.includes(x.palavra))) continue;
    let ok = false;
    for (let tent = 0; tent < 60 && !ok; tent++) {
      const [dr, dc] = dirs[Math.floor(rng() * dirs.length)];
      const r = Math.floor(rng() * n), c = Math.floor(rng() * n);
      const r2 = r + dr * (p.length - 1), c2 = c + dc * (p.length - 1);
      if (r2 < 0 || r2 >= n || c2 < 0 || c2 >= n) continue;
      let cabe = true;
      for (let k = 0; k < p.length; k++) { const x = grade[r + dr * k][c + dc * k]; if (x && x !== p[k]) { cabe = false; break; } }
      if (!cabe) continue;
      for (let k = 0; k < p.length; k++) grade[r + dr * k][c + dc * k] = p[k];
      colocadas.push({ palavra: p, r, c, dr, dc });
      ok = true;
    }
  }
  if (colocadas.length < qtd) return null;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!grade[r][c]) grade[r][c] = ALFABETO[Math.floor(rng() * ALFABETO.length)];
  return { grade, colocadas };
}

export function gerarGarantido(n, qtd, dirs, rng = Math.random) {
  for (let i = 0; i < 50; i++) { const g = gerar(n, qtd, dirs, rng); if (g) return g; }
  return gerar(n, Math.max(3, qtd - 2), dirs, rng);
}

// letras ao longo da reta entre (r1,c1) e (r2,c2); null se não for reta (horizontal, vertical ou diagonal)
export function linha(grade, r1, c1, r2, c2) {
  const dr = r2 - r1, dc = c2 - c1;
  if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return null;
  const passos = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = Math.sign(dr), sc = Math.sign(dc);
  const celulas = [];
  for (let k = 0; k <= passos; k++) celulas.push([r1 + sr * k, c1 + sc * k]);
  return { celulas, texto: celulas.map(([r, c]) => grade[r][c]).join("") };
}

// qual palavra (ainda não achada) a seleção forma? (de frente ou de trás)
export function conferir(grade, colocadas, achadas, r1, c1, r2, c2) {
  const l = linha(grade, r1, c1, r2, c2);
  if (!l || l.celulas.length < 2) return null;
  const rev = [...l.texto].reverse().join("");
  const p = colocadas.find((x) => !achadas.has(x.palavra) && (x.palavra === l.texto || x.palavra === rev));
  return p ? { palavra: p.palavra, celulas: l.celulas } : null;
}
