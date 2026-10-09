// Cenários de ordenação. As etapas estão na ordem correta (o jogo embaralha).
// Obs.: a ordem real varia conforme modalidade e regime; aqui vale a sequência mais comum.
export const CENARIOS = [
  { nome: "Importação básica", steps: ["Fechar o pedido com o fornecedor", "Embarque da mercadoria no exterior", "Desembaraço aduaneiro", "Entrega ao importador"] },
  { nome: "Exportação básica", steps: ["Fechar a venda com o comprador", "Emitir fatura comercial e packing list", "Registrar a DU-E", "Embarque e averbação"] },
  { nome: "Importação marítima", steps: ["Fechar o pedido com o fornecedor", "Embarque no exterior e emissão do BL", "Chegada do navio ao porto", "Registro da DI/DUIMP", "Desembaraço aduaneiro"] },
  { nome: "Exportação marítima", steps: ["Fechar a venda com o comprador", "Emitir fatura comercial e packing list", "Registrar a DU-E", "Entregar a carga no terminal", "Embarque e averbação da DU-E"] },
  { nome: "Importação com licença", steps: ["Fechar o pedido (proforma)", "Obter a licença/anuência exigida", "Embarque no exterior", "Chegada ao porto", "Registro da DI/DUIMP", "Desembaraço aduaneiro"] },
  { nome: "Importação aérea", steps: ["Fechar o pedido com o fornecedor", "Embarque no exterior e emissão do AWB", "Chegada ao aeroporto", "Registro da DI/DUIMP", "Parametrização (definição do canal)", "Desembaraço e liberação da carga"] },
  { nome: "Exportação completa", steps: ["Fechar a venda com o comprador", "Emitir fatura comercial e packing list", "Registrar a DU-E", "Entregar a carga no terminal", "Embarque e averbação", "Receber o BL", "Receber o pagamento do exterior"] },
  { nome: "Importação marítima completa", steps: ["Fechar o pedido com o fornecedor", "Obter a licença/anuência exigida", "Embarque no exterior e emissão do BL", "Chegada ao porto", "Registro da DI/DUIMP", "Parametrização (definição do canal)", "Desembaraço aduaneiro", "Retirada da carga do terminal"] },
  { nome: "Importação do início ao fim", steps: ["Cotar frete e escolher o Incoterm", "Fechar o pedido com o fornecedor", "Obter a licença/anuência exigida", "Embarque no exterior e emissão do BL", "Chegada ao porto", "Registro da DI/DUIMP", "Parametrização (definição do canal)", "Desembaraço aduaneiro", "Entrega ao importador"] },
  { nome: "Exportação do início ao fim", steps: ["Cotar frete e escolher o Incoterm", "Fechar a venda com o comprador", "Emitir fatura comercial e packing list", "Reservar espaço no navio (booking)", "Registrar a DU-E", "Entregar a carga no terminal", "Embarque e averbação", "Receber o BL", "Receber o pagamento do exterior"] },
];
