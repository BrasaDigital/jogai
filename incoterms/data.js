// Incoterms® 2020 — tabela-base. Todas as perguntas do jogo são geradas a partir dela.
// exp = quem faz o desembaraço de exportação; imp = importação; frete = frete internacional principal;
// seguro: "vendedor-A" (cobertura ampla), "vendedor-C" (mínima) ou null (não há obrigação).
export const SEA = ["FAS", "FOB", "CFR", "CIF"];
export const ANY = ["EXW", "FCA", "CPT", "CIP", "DAP", "DPU", "DDP"];

export const T = {
  EXW: { exp: "comprador", imp: "comprador", frete: "comprador", seguro: null,
    risco: "a mercadoria é colocada à disposição do comprador no estabelecimento do vendedor",
    desc: "O vendedor deixa a mercadoria na sua fábrica, sem carregar, e o comprador cuida de tudo, inclusive do desembaraço de exportação." },
  FCA: { exp: "vendedor", imp: "comprador", frete: "comprador", seguro: null,
    risco: "a mercadoria é entregue ao transportador indicado pelo comprador",
    desc: "O vendedor desembaraça na exportação e entrega a mercadoria ao transportador indicado pelo comprador." },
  CPT: { exp: "vendedor", imp: "comprador", frete: "vendedor", seguro: null,
    risco: "a mercadoria é entregue ao primeiro transportador",
    desc: "O vendedor paga o transporte até o destino, mas o risco passa ao entregar ao primeiro transportador, e o seguro fica por conta do comprador." },
  CIP: { exp: "vendedor", imp: "comprador", frete: "vendedor", seguro: "vendedor-A",
    risco: "a mercadoria é entregue ao primeiro transportador",
    desc: "O vendedor paga o transporte até o destino e contrata seguro de cobertura ampla, mas o risco passa ao entregar ao primeiro transportador." },
  DAP: { exp: "vendedor", imp: "comprador", frete: "vendedor", seguro: null,
    risco: "a mercadoria chega ao local de destino, pronta para ser descarregada",
    desc: "O vendedor entrega no destino com a mercadoria pronta para descarga; o comprador descarrega e desembaraça a importação." },
  DPU: { exp: "vendedor", imp: "comprador", frete: "vendedor", seguro: null,
    risco: "a mercadoria é descarregada no local de destino",
    desc: "O vendedor entrega no destino já com a mercadoria descarregada; o comprador desembaraça a importação." },
  DDP: { exp: "vendedor", imp: "vendedor", frete: "vendedor", seguro: null,
    risco: "a mercadoria chega ao local de destino, pronta para ser descarregada, já desembaraçada na importação",
    desc: "O vendedor entrega no destino e paga também o desembaraço e os impostos de importação." },
  FAS: { exp: "vendedor", imp: "comprador", frete: "comprador", seguro: null,
    risco: "a mercadoria é colocada ao lado do navio no porto de embarque",
    desc: "O vendedor coloca a mercadoria ao lado do navio, no cais do porto de embarque (só marítimo)." },
  FOB: { exp: "vendedor", imp: "comprador", frete: "comprador", seguro: null,
    risco: "a mercadoria está a bordo do navio no porto de embarque",
    desc: "O vendedor desembaraça e coloca a mercadoria a bordo do navio no porto de embarque; frete e seguro são do comprador." },
  CFR: { exp: "vendedor", imp: "comprador", frete: "vendedor", seguro: null,
    risco: "a mercadoria está a bordo do navio no porto de embarque",
    desc: "O vendedor paga o frete marítimo até o porto de destino, sem contratar seguro; o risco passa a bordo, na origem." },
  CIF: { exp: "vendedor", imp: "comprador", frete: "vendedor", seguro: "vendedor-C",
    risco: "a mercadoria está a bordo do navio no porto de embarque",
    desc: "O vendedor paga o frete marítimo até o destino e contrata seguro de cobertura mínima; o risco passa a bordo, na origem." },
};
export const ALL = Object.keys(T);
