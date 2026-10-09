// Gera uma fatura comercial e um packing list com divergências escondidas.
import { pick, shuffle } from "/js/quiz.js";

const EXPORTADORES = ["Café Serra Alta Ltda", "Têxtil Vale do Sol S/A", "Plásticos Nova Era Ltda", "Metalúrgica Três Rios", "Agro Cerrado Exportação"];
const IMPORTADORES = ["Hamburg Trading GmbH", "Pacific Goods Inc.", "Lusa Import Lda", "Rotterdam Foods B.V.", "Andes Comercial S.A."];
const PRODUTOS = [
  ["Café torrado em grão, sacas de 60 kg", 60, 310], ["Camisetas de algodão, caixas c/ 100", 18, 520], ["Conexões de PVC, caixas c/ 50", 12, 240],
  ["Peças de aço usinadas, paletes", 450, 1900], ["Suco de laranja concentrado, tambores", 250, 1100],
];
const PORTOS_ORIGEM = ["Santos", "Paranaguá", "Itajaí", "Rio Grande"];
const PORTOS_DESTINO = ["Roterdã", "Hamburgo", "Los Angeles", "Lisboa", "Buenos Aires"];
const PAISES = ["Brasil", "Argentina", "China", "Portugal"];
const INCOTERMS = ["FOB", "CIF", "FCA", "CFR"];

const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const money = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "USD" });
const num = (v) => v.toLocaleString("pt-BR");

// quantidade de divergências por nível
export const ERRS = [2, 2, 3, 3, 4, 4, 5, 5, 6, 6];
export const MAX_MISS = 3;

export function generate(nErros) {
  const [descricao, pesoUnit, precoBase] = pick(PRODUTOS)[0];
  const qtd = r(10, 90) * 5;
  const preco = r(Math.round(precoBase * 0.8), Math.round(precoBase * 1.2));
  const base = {
    exportador: pick(EXPORTADORES)[0], importador: pick(IMPORTADORES)[0], descricao,
    qtd, pais: "Brasil", origem: pick(PORTOS_ORIGEM)[0], destino: pick(PORTOS_DESTINO)[0],
    incoterm: pick(INCOTERMS)[0], preco,
    liquido: qtd * pesoUnit, bruto: Math.round(qtd * pesoUnit * 1.06), volumes: r(2, 20),
  };
  base.total = qtd * preco;

  const fat = { ...base }, pl = { ...base };
  // divergências possíveis: [id, aplica(fat, pl)]
  const defeitos = [
    ["exportador", () => { pl.exportador = pick(EXPORTADORES.filter((x) => x !== base.exportador))[0]; }],
    ["importador", () => { pl.importador = pick(IMPORTADORES.filter((x) => x !== base.importador))[0]; }],
    ["qtd", () => { pl.qtd = base.qtd + pick([5, 10, -5, -10])[0]; }],
    ["pais", () => { pl.pais = pick(PAISES.filter((x) => x !== "Brasil"))[0]; }],
    ["origem", () => { pl.origem = pick(PORTOS_ORIGEM.filter((x) => x !== base.origem))[0]; }],
    ["destino", () => { pl.destino = pick(PORTOS_DESTINO.filter((x) => x !== base.destino))[0]; }],
    ["total", () => { fat.total = base.total + pick([100, 250, -100, -250])[0]; }], // total ≠ qtd × preço
    ["pesos", () => { pl.liquido = base.bruto + r(5, 80); }], // líquido maior que o bruto
  ];
  const escolhidos = shuffle(defeitos).slice(0, nErros).map((d) => { d[1](); return d[0]; });

  const rowsFat = [
    ["exportador", "Exportador", fat.exportador], ["importador", "Importador", fat.importador],
    ["descricao", "Descrição", fat.descricao], ["qtd", "Quantidade", num(fat.qtd)],
    ["preco", "Preço unitário", money(fat.preco)], ["total", "Valor total", money(fat.total)],
    ["incoterm", "Incoterm", `${fat.incoterm} ${fat.origem}`], ["pais", "País de origem", fat.pais],
    ["origem", "Porto de embarque", fat.origem], ["destino", "Porto de destino", fat.destino],
  ];
  const rowsPl = [
    ["exportador", "Exportador", pl.exportador], ["importador", "Importador", pl.importador],
    ["descricao", "Descrição", pl.descricao], ["qtd", "Quantidade", num(pl.qtd)],
    ["pesos", "Peso líquido (kg)", num(pl.liquido)], ["pesos", "Peso bruto (kg)", num(pl.bruto)],
    ["volumes", "Volumes", String(pl.volumes)], ["pais", "País de origem", pl.pais],
    ["origem", "Porto de embarque", pl.origem], ["destino", "Porto de destino", pl.destino],
  ];
  return { rowsFat, rowsPl, erros: new Set(escolhidos), base, fat, pl };
}
