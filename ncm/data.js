// Capítulos do Sistema Harmonizado (SH), base da NCM. Nível fácil: capítulo (2 dígitos). Difícil: posição (4 dígitos).
export const CAP = {
  "02": "Carnes e miudezas comestíveis", "03": "Peixes e crustáceos", "04": "Leite e laticínios; ovos; mel",
  "08": "Frutas comestíveis", "09": "Café, chá, mate e especiarias", "10": "Cereais", "12": "Sementes e frutos oleaginosos (soja)",
  "17": "Açúcares e produtos de confeitaria", "18": "Cacau e suas preparações", "22": "Bebidas, líquidos alcoólicos e vinagres",
  "24": "Fumo (tabaco)", "27": "Combustíveis minerais e óleos (petróleo)", "29": "Produtos químicos orgânicos",
  "30": "Produtos farmacêuticos", "31": "Adubos (fertilizantes)", "33": "Óleos essenciais, perfumaria e cosméticos",
  "39": "Plásticos e suas obras", "40": "Borracha e suas obras", "44": "Madeira e suas obras", "48": "Papel e cartão",
  "49": "Livros e impressos", "51": "Lã e pelos finos", "52": "Algodão", "61": "Vestuário de malha",
  "62": "Vestuário, exceto de malha", "64": "Calçados", "70": "Vidro e suas obras", "71": "Pérolas, pedras e metais preciosos (joalheria)",
  "72": "Ferro fundido, ferro e aço", "74": "Cobre e suas obras", "76": "Alumínio e suas obras",
  "84": "Máquinas, caldeiras e aparelhos mecânicos", "85": "Máquinas e aparelhos elétricos e eletrônicos",
  "87": "Veículos automóveis, tratores e suas partes", "88": "Aeronaves e suas partes", "89": "Embarcações",
  "90": "Instrumentos e aparelhos de óptica, medida e médicos", "91": "Relógios", "94": "Móveis e iluminação",
  "95": "Brinquedos, jogos e artigos de esporte", "97": "Objetos de arte e antiguidades",
};

// [produto, capítulo]
export const PRODUTOS_CAP = [
  ["Carne bovina congelada", "02"], ["Filé de peixe congelado", "03"], ["Leite em pó", "04"], ["Mel de abelha", "04"],
  ["Laranjas frescas", "08"], ["Café em grão torrado", "09"], ["Pimenta-do-reino", "09"], ["Arroz e trigo em grão", "10"],
  ["Soja em grão", "12"], ["Açúcar de cana", "17"], ["Chocolate em barra", "18"], ["Vinho de uvas frescas", "22"],
  ["Cigarros", "24"], ["Petróleo bruto", "27"], ["Medicamentos embalados para venda a varejo", "30"], ["Adubo (fertilizante)", "31"],
  ["Perfume", "33"], ["Tubos de plástico (PVC)", "39"], ["Pneus novos de borracha", "40"], ["Tábuas de madeira serrada", "44"],
  ["Papel para impressão", "48"], ["Livros impressos", "49"], ["Fios de algodão", "52"], ["Camisetas de malha de algodão", "61"],
  ["Calças jeans de tecido (não malha)", "62"], ["Tênis de couro", "64"], ["Garrafas de vidro", "70"], ["Anéis de ouro", "71"],
  ["Chapas laminadas de aço", "72"], ["Fios de cobre", "74"], ["Perfis de alumínio", "76"], ["Empilhadeiras e máquinas industriais", "84"],
  ["Smartphones", "85"], ["Automóveis de passeio", "87"], ["Aviões", "88"], ["Navios e barcos", "89"],
  ["Aparelhos de ultrassom médicos", "90"], ["Relógios de pulso", "91"], ["Sofás e cadeiras", "94"], ["Bonecas e quebra-cabeças", "95"],
  ["Pinturas originais de artista", "97"],
];

// [produto, posição(4 dígitos), título da posição]
export const POSICOES = [
  ["Café torrado, não descafeinado", "0901", "Café, mesmo torrado ou descafeinado"],
  ["Soja, mesmo triturada", "1201", "Soja, mesmo triturada"],
  ["Carnes de bovinos, congeladas", "0202", "Carnes de animais da espécie bovina, congeladas"],
  ["Açúcar de cana, em bruto ou refinado", "1701", "Açúcares de cana ou de beterraba"],
  ["Vinhos de uvas frescas", "2204", "Vinhos de uvas frescas"],
  ["Óleos brutos de petróleo", "2709", "Óleos brutos de petróleo"],
  ["Pneus novos de borracha", "4011", "Pneus novos de borracha"],
  ["Camisetas (T-shirts) de malha", "6109", "T-shirts e camisetas, de malha"],
  ["Computadores e máquinas de processamento de dados", "8471", "Máquinas automáticas para processamento de dados"],
  ["Celulares e telefones inteligentes", "8517", "Aparelhos telefônicos, incluindo smartphones"],
  ["Automóveis de passageiros", "8703", "Automóveis de passageiros"],
  ["Peças e acessórios de veículos automóveis", "8708", "Partes e acessórios de veículos automóveis"],
  ["Medicamentos acondicionados para venda a retalho", "3004", "Medicamentos em doses ou acondicionados para venda a retalho"],
  ["Cigarros contendo fumo", "2402", "Charutos, cigarrilhas e cigarros"],
  ["Refrigeradores e congeladores", "8418", "Refrigeradores, congeladores e bombas de calor"],
  ["Máquinas de lavar roupa", "8450", "Máquinas de lavar roupa"],
  ["Motores elétricos", "8501", "Motores e geradores elétricos"],
  ["Fios e cabos elétricos isolados", "8544", "Fios, cabos e condutores elétricos isolados"],
  ["Calçados de couro natural", "6403", "Calçados com sola exterior de borracha, plástico ou couro e parte superior de couro"],
  ["Chocolate e preparações com cacau", "1806", "Chocolate e outras preparações alimentícias contendo cacau"],
];
