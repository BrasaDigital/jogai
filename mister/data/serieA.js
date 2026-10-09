// Brasileirão Série A 2026 — dados de DEMONSTRAÇÃO.
// Nomes de clubes e jogadores reais, montados de memória (sem fonte oficial): podem estar
// desatualizados ou errados. Notas (ovr) e idades são ESTIMATIVAS. Corrija à vontade: é só editar as linhas.
// Formato do jogador: "POS Nome ovr idade" (POS = G goleiro, D defensor, M meia, A atacante).
// Quem falta para completar o elenco é gerado como "jogador da base" (fictício).
// Mirassol, Vitória, Coritiba, Chapecoense e Remo estão com elenco 100% fictício (não confiei na memória para esses).
// `caixa` = dinheiro inicial do clube em R$ milhões. `forca` = nível geral usado para completar o elenco.
export const SERIE_A = [
  { sigla: "FLA", nome: "Flamengo", hue: 0, caixa: 120, forca: 77, jogadores: [
    "G Rossi 80 30", "G Matheus Cunha 68 25", "D Varela 77 31", "D Léo Pereira 79 30", "D Léo Ortiz 80 30", "D Danilo 75 34", "D Ayrton Lucas 76 28", "D Alex Sandro 73 35",
    "M Arrascaeta 84 31", "M Jorginho 75 34", "M Saúl 77 32", "M Allan 73 29", "M Carrascal 77 28", "M Evertton Araújo 71 26",
    "A Pedro 82 29", "A Bruno Henrique 76 35", "A Samuel Lino 78 26", "A Luiz Araújo 76 30", "A Gonzalo Plata 76 25" ] },
  { sigla: "PAL", nome: "Palmeiras", hue: 140, caixa: 130, forca: 77, jogadores: [
    "G Weverton 78 38", "G Carlos Miguel 72 27", "D Gustavo Gómez 79 33", "D Murilo 77 28", "D Bruno Fuchs 75 27", "D Khellven 74 25", "D Piquerez 77 27", "D Marcos Rocha 72 37",
    "M Aníbal Moreno 78 26", "M Raphael Veiga 77 30", "M Andreas Pereira 77 30", "M Mauricio 77 24", "M Richard Ríos 75 25", "M Emiliano Martínez 72 21",
    "A Vitor Roque 80 21", "A Flaco López 77 25", "A Paulinho 79 26", "A Felipe Anderson 78 33", "A Ramón Sosa 74 26" ] },
  { sigla: "BOT", nome: "Botafogo", hue: 220, caixa: 90, forca: 72, jogadores: [
    "G John 74 29", "D Alexander Barboza 76 31", "D Bastos 72 34", "D Vitinho 72 26", "D Alex Telles 72 33", "D Cuiabano 71 23", "D Marçal 71 36",
    "M Marlon Freitas 76 30", "M Savarino 76 29", "M Allan 72 29", "M Danilo 75 25", "M Gregore 72 31",
    "A Arthur Cabral 74 27", "A Matheus Martins 72 22", "A Júnior Santos 74 30", "A Artur 70 27" ] },
  { sigla: "CRU", nome: "Cruzeiro", hue: 210, caixa: 85, forca: 73, jogadores: [
    "G Cássio 76 38", "D Fabrício Bruno 76 30", "D Villalba 72 26", "D Kaiki 70 22", "D William 70 30", "D Neris 71 29",
    "M Lucas Romero 72 31", "M Matheus Pereira 79 29", "M Christian 73 24", "M Eduardo 73 28", "M Walace 72 30",
    "A Kaio Jorge 77 24", "A Gabigol 76 30", "A Wanderson 72 25", "A Bruno Rodrigues 71 25" ] },
  { sigla: "COR", nome: "Corinthians", hue: 20, caixa: 70, forca: 71, jogadores: [
    "G Hugo Souza 76 27", "G Matheus Donelli 70 20", "D Gustavo Henrique 73 33", "D André Ramalho 72 33", "D Fagner 70 36", "D Matheuzinho 72 25", "D Angileri 72 31",
    "M Raniele 72 29", "M Breno Bidon 72 20", "M Maycon 72 28", "M Rodrigo Garro 76 28",
    "A Yuri Alberto 78 25", "A Memphis Depay 79 32", "A Talles Magno 73 24", "A Héctor Hernández 70 26", "A Gui Negão 69 23" ] },
  { sigla: "SAO", nome: "São Paulo", hue: 350, caixa: 80, forca: 72, jogadores: [
    "G Rafael 76 36", "D Arboleda 74 34", "D Alan Franco 72 28", "D Sabino 71 29", "D Wendell 72 32", "D Ferraresi 72 27", "D Igor Vinícius 70 28",
    "M Alisson 74 33", "M Lucas Moura 76 33", "M Marcos Antônio 70 25", "M Oscar 78 34", "M Bobadilla 72 29",
    "A Calleri 76 32", "A Luciano 75 32", "A André Silva 70 29", "A Ferreirinha 72 28" ] },
  { sigla: "SAN", nome: "Santos", hue: 50, caixa: 50, forca: 69, jogadores: [
    "G Gabriel Brazão 72 25", "D Gil 70 38", "D Luan Peres 72 31", "D Joaquim 70 28", "D Zé Ivaldo 70 29", "D Escobar 70 24",
    "M Thiago Maia 70 28", "M Gabriel Menino 72 25", "M Barreal 72 27", "M Miguelito 72 27", "M Rollheiser 74 27",
    "A Neymar 82 34", "A Guilherme 72 24", "A Deivid Washington 72 21" ] },
  { sigla: "GRE", nome: "Grêmio", hue: 205, caixa: 60, forca: 71, jogadores: [
    "G Tiago Volpi 74 34", "G Marchesín 75 37", "D Kannemann 76 34", "D Jemerson 72 33", "D Wagner Leonardo 72 26", "D Viery 72 26", "D Mayk 70 27",
    "M Cristaldo 74 30", "M Villasanti 75 28", "M Arezo 72 27", "M Pavón 74 30", "M Edenilson 72 36",
    "A Braithwaite 72 34", "A Carlos Vinícius 70 31", "A Alysson 72 24", "A André Henrique 71 24" ] },
  { sigla: "INT", nome: "Internacional", hue: 355, caixa: 55, forca: 71, jogadores: [
    "G Sergio Rochet 76 32", "D Vitão 73 26", "D Bernabei 72 25", "D Aguirre 71 27", "D Bruno Gomes 71 30", "D Juninho 70 23",
    "M Alan Patrick 76 35", "M Ricardo Mathias 70 30", "M Bruno Henrique 71 36", "M Fernando 72 36", "M Carbonero 72 26",
    "A Borré 74 30", "A Wesley 72 27", "A Alerrandro 72 28", "A Vitinho 72 26", "A Rene 70 24" ] },
  { sigla: "CAM", nome: "Atlético-MG", hue: 0, caixa: 60, forca: 72, jogadores: [
    "G Everson 74 35", "D Lyanco 74 29", "D Junior Alonso 74 32", "D Renzo Saravia 72 31", "D Guilherme Arana 77 28", "D Natanael 70 29",
    "M Gustavo Scarpa 76 32", "M Bernard 72 33", "M Igor Gomes 71 27", "M Alexsander 72 24", "M Otávio 70 31",
    "A Hulk 79 39", "A Cuello 74 26", "A Eduardo Vargas 72 36", "A Biel 72 25", "A Alisson 72 25" ] },
  { sigla: "FLU", nome: "Fluminense", hue: 140, caixa: 55, forca: 72, jogadores: [
    "G Fábio 74 45", "D Thiago Silva 76 41", "D Manoel 72 36", "D Ignácio 72 28", "D Gabriel Fuentes 72 29", "D Samuel Xavier 71 35",
    "M Martinelli 75 24", "M Nonato 72 25", "M Hércules 71 25", "M Lima 72 29", "M Facundo Bernal 72 27",
    "A Kevin Serna 73 25", "A Everaldo 71 34", "A John Kennedy 73 24", "A Germán Cano 76 38", "A Canobbio 73 26" ] },
  { sigla: "VAS", nome: "Vasco da Gama", hue: 0, caixa: 50, forca: 70, jogadores: [
    "G León 72 27", "D Robert Renan 72 22", "D Léo 72 30", "D Lucas Piton 72 25", "D Paulo Henrique 71 28", "D Carlos Cuesta 72 27",
    "M Hugo Moura 71 27", "M Barros 72 30", "M Philippe Coutinho 76 33", "M Tchê Tchê 71 33", "M Payet 72 39",
    "A Rayan 77 19", "A Vegetti 74 37", "A Nuno Moreira 71 26", "A David 71 23" ] },
  { sigla: "BAH", nome: "Bahia", hue: 215, caixa: 50, forca: 71, jogadores: [
    "G Ronaldo 73 28", "G Marcos Felipe 72 28", "D Gilberto 72 31", "D Kanu 72 29", "D Gabriel Xavier 71 25", "D Santiago Arias 71 33", "D Luciano Juba 72 27",
    "M Jean Lucas 73 27", "M Rezende 72 27", "M Cauly 74 30", "M Everton Ribeiro 74 36",
    "A Willian José 73 34", "A Erick Pulga 73 23", "A Ademir 72 31", "A Everaldo 71 34" ] },
  { sigla: "BRA", nome: "Red Bull Bragantino", hue: 0, caixa: 50, forca: 70, jogadores: [
    "G Cleiton 71 27", "D Eduardo Santos 71 28", "D Pedro Henrique 70 26", "D Juninho Capixaba 71 28", "D Andrés Hurtado 70 30", "D Luan Cândido 71 23",
    "M Jhon Jhon 72 24", "M Gabriel 70 25", "M Lucas Evangelista 72 30", "M Eric Ramires 70 28",
    "A Eduardo Sasha 73 33", "A Isidro Pitta 72 27", "A Lincoln 70 25", "A Henry Mosquera 71 24" ] },
  { sigla: "VIT", nome: "Vitória", hue: 355, caixa: 35, forca: 67, jogadores: [] },
  { sigla: "MIR", nome: "Mirassol", hue: 50, caixa: 30, forca: 66, jogadores: [] },
  { sigla: "CAP", nome: "Athletico-PR", hue: 0, caixa: 40, forca: 69, jogadores: [
    "G Santos 72 31", "D Thiago Heleno 69 36", "D Kaique Rocha 70 22", "D Esquivel 70 27", "D Léo Godoy 69 30", "D Aguirre 69 28",
    "M Christian 71 28", "M Fernandinho 71 40", "M Cuello 70 27", "M Bruno Zapelli 70 23",
    "A Mastriani 71 33", "A Nikão 72 33", "A Kevin Viveros 70 27", "A Julimar 69 23" ] },
  { sigla: "CTB", nome: "Coritiba", hue: 140, caixa: 30, forca: 65, jogadores: [] },
  { sigla: "CHA", nome: "Chapecoense", hue: 140, caixa: 20, forca: 62, jogadores: [] },
  { sigla: "REM", nome: "Remo", hue: 215, caixa: 20, forca: 62, jogadores: [] },
];

// Clubes da Série B (sobem e descem). Elencos fictícios; `forca` é o nível geral.
export const SERIE_B = [
  { sigla: "FOR", nome: "Fortaleza", hue: 215, forca: 67 }, { sigla: "CEA", nome: "Ceará", hue: 0, forca: 66 },
  { sigla: "JUV", nome: "Juventude", hue: 140, forca: 64 }, { sigla: "SPT", nome: "Sport", hue: 355, forca: 64 },
  { sigla: "GOI", nome: "Goiás", hue: 140, forca: 63 }, { sigla: "NOV", nome: "Novorizontino", hue: 50, forca: 62 },
  { sigla: "VNO", nome: "Vila Nova", hue: 0, forca: 61 }, { sigla: "CRB", nome: "CRB", hue: 355, forca: 61 },
  { sigla: "AVA", nome: "Avaí", hue: 215, forca: 60 }, { sigla: "CUI", nome: "Cuiabá", hue: 140, forca: 60 },
  { sigla: "AME", nome: "América-MG", hue: 140, forca: 62 }, { sigla: "OPE", nome: "Operário-PR", hue: 0, forca: 60 },
];
