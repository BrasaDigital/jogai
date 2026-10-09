import { mk, pick, take, shuffle } from "/js/quiz.js";
import { T, ALL, SEA, ANY } from "/incoterms/data.js";

const others = (list, n, ...exclude) => pick(list.filter((x) => !exclude.includes(x)), n);
const PESSOAS = ["O vendedor", "O comprador"];

// ---- fáceis ----
const easy = [
  () => mk("Em qual Incoterm o vendedor tem a MENOR responsabilidade?", "EXW", others(ALL, 3, "EXW"),
    "No EXW o vendedor só deixa a mercadoria à disposição no seu estabelecimento."),
  () => mk("Qual Incoterm coloca TAMBÉM o desembaraço e os impostos de importação nas costas do vendedor?", "DDP", others(ALL, 3, "DDP"),
    "Só no DDP o vendedor faz o desembaraço de importação."),
  () => mk("Qual destes só pode ser usado em transporte marítimo e hidroviário?", pick(SEA)[0], pick(ANY, 3),
    "FAS, FOB, CFR e CIF são os termos exclusivos de via aquaviária."),
  () => mk("Qual destes pode ser usado em QUALQUER modal de transporte?", pick(ANY)[0], pick(SEA, 3),
    "EXW, FCA, CPT, CIP, DAP, DPU e DDP servem para qualquer modal."),
  () => {
    const t = pick(ALL)[0];
    const certo = T[t].frete === "vendedor" ? "O vendedor" : "O comprador";
    return mk(`No ${t}, quem paga o frete internacional principal?`, certo, [PESSOAS.find((p) => p !== certo), "Metade cada um", "O transportador"],
      `No ${t} o frete principal é do ${T[t].frete}.`);
  },
  () => {
    const t = pick(ALL)[0];
    const certo = T[t].exp === "vendedor" ? "O vendedor" : "O comprador";
    return mk(`No ${t}, quem faz o desembaraço de EXPORTAÇÃO?`, certo, [PESSOAS.find((p) => p !== certo), "O despachante do destino", "Ninguém"],
      `No ${t} a exportação é desembaraçada pelo ${T[t].exp}.`);
  },
  () => {
    const t = pick(ALL)[0];
    const certo = T[t].imp === "vendedor" ? "O vendedor" : "O comprador";
    return mk(`No ${t}, quem faz o desembaraço de IMPORTAÇÃO?`, certo, [PESSOAS.find((p) => p !== certo), "O transportador", "Ninguém"],
      `No ${t} a importação é desembaraçada pelo ${T[t].imp}.`);
  },
  () => {
    const par = pick([["CFR", "CIF"], ["CPT", "CIP"]])[0];
    const cert = par.find((x) => T[x].seguro);
    return mk(`Entre ${par[0]} e ${par[1]}, qual obriga o vendedor a contratar seguro?`, cert, [par.find((x) => x !== cert), "Nenhum dos dois", "Os dois"],
      `${cert} é igual ao termo sem seguro, mais o seguro por conta do vendedor.`);
  },
];

// ---- médias ----
function riscoQ() {
  const t = pick(ALL)[0];
  const certo = T[t].risco;
  const erradas = pick([...new Set(ALL.map((x) => T[x].risco))].filter((r) => r !== certo), 3);
  return mk(`No ${t}, o risco sobre a mercadoria passa para o comprador quando…`, certo, erradas,
    `No ${t} o risco passa quando ${certo}.`);
}
function descQ() {
  const t = pick(ALL)[0];
  return mk(`Qual Incoterm descreve: “${T[t].desc}”`, t, others(ALL, 3, t), `Essa é a definição do ${t}.`);
}
const mid = [
  riscoQ, descQ, descQ,
  () => mk("Qual Incoterm obriga o vendedor a DESCARREGAR a mercadoria no destino?", "DPU", ["DAP", "DDP", "CIP"],
    "No DPU o vendedor descarrega; no DAP entrega pronta para descarga."),
  () => mk("Qual a diferença entre DAP e DPU?", "No DPU o vendedor também descarrega a mercadoria", ["No DAP o vendedor paga o imposto de importação", "O DPU só vale para o mar", "No DAP o comprador paga o frete"],
    "Os dois entregam no destino; o DPU inclui a descarga pelo vendedor."),
  () => mk("No FOB, o frete marítimo é pago por…", "O comprador", ["O vendedor", "O banco", "A alfândega"], "No FOB o vendedor só entrega a bordo; o frete é do comprador."),
  () => mk("Em qual Incoterm o vendedor paga o frete até o destino mas o risco passa na origem, a bordo do navio, sem seguro?", "CFR", ["CIF", "FOB", "DAP"],
    "CFR: frete pago pelo vendedor, risco na origem. CIF seria com seguro."),
];

// ---- difíceis ----
const hard = [
  () => mk("Qual Incoterm 2020 substituiu o DAT?", "DPU", ["DAP", "DDP", "FCA"], "O DAT (Delivered at Terminal) virou DPU (Delivered at Place Unloaded) em 2020."),
  () => mk("No CIP (Incoterms 2020), a cobertura de seguro exigida do vendedor é…", "Ampla (ICC A)", ["Mínima (ICC C)", "Intermediária (ICC B)", "Não há exigência"],
    "Em 2020 o CIP passou a exigir cobertura ampla; o CIF continua com a mínima (ICC C)."),
  () => mk("No CIF, a cobertura de seguro mínima exigida do vendedor é…", "Mínima (ICC C)", ["Ampla (ICC A)", "Intermediária (ICC B)", "Não há exigência"],
    "O CIF exige a cobertura mínima (ICC C), podendo ser ampliada por acordo."),
  () => mk("No CIF, onde o risco passa para o comprador?", "A bordo do navio no porto de embarque", ["No porto de destino", "Na fábrica do vendedor", "Na chegada ao depósito do comprador"],
    "Apesar de o vendedor pagar frete e seguro, o risco passa na origem."),
  () => mk("Para carga em contêiner, qual destes a ICC considera MENOS adequado (a entrega é a bordo, e não no terminal)?", "FOB", ["FCA", "CPT", "CIP"],
    "Para contêineres, a ICC recomenda FCA, CPT, CIP, em vez de FOB, CFR e CIF."),
  () => mk("No EXW, quem normalmente carrega a mercadoria no veículo do comprador?", "O comprador", ["O vendedor", "O banco", "O transportador do vendedor"],
    "No EXW o vendedor não é obrigado a carregar."),
  riscoQ, descQ,
];

export function makeIncoterms(level, count) {
  const pool = level <= 3 ? [...easy] : level <= 7 ? [...easy, ...mid, ...mid] : [...mid, ...hard, ...hard];
  return take(pool, count);
}
