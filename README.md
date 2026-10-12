# Jogaí

Joguinhos rápidos no navegador, com ranking salvo no Supabase.

- Site: https://jogai-iota.vercel.app
- Stack: HTML/CSS/JS puro (sem build) + Supabase (tabela `scores`) + Vercel

## Estrutura

```
index.html          home com a lista de jogos
css/style.css       estilo global
js/supabase.js      acesso ao Supabase (ranking e salvar score)
reflexo/            jogo Teste de Reflexo
```

## Jogos

| Jogo | Ranking |
|------|---------|
| Teste de Reflexo | 10 níveis; passa quem fica dentro da meta de média (ms); ranking por nível |
| Encaixe | 40 desafios com solução única; menor tempo (s) por desafio |
| Incoterms, NCM, Rotas e Portos | 10 níveis de quiz (perguntas geradas de tabelas em `*/data.js`); 3 erros e o nível acaba; menor tempo no ranking |
| Processo de Comex, Caça aos Erros | 10 níveis; ordenar etapas / achar divergências em fatura e packing list |
| Mister | Gerenciamento de futebol: Brasileirão Série A (20 clubes, dados de demonstração em `mister/data/serieA.js`), lesões e cartões, caixa, transferências, contratos, subida e descida; carreira salva no aparelho ou na conta (`career_saves`) |
| Cobrinha, Memória, Acerte o Alvo, Simon | 10 níveis cada; menor tempo (s) por nível; estrutura comum em `js/kit.js` |
| Sudoku, Caça-palavras, 2048, Campo Minado | 10 níveis cada, menor tempo; lógica pura em `*/logic.js` (Sudoku com solução única garantida) |
| Termo, Dueto e Quarteto, Termo Comex, Lingo | 10 níveis cada; motor em `termo/` (dicionário PT em `termo/dict/*.txt`, respostas em `termo/words.js`) |
| Termo do Dia, Comex do Dia | 1 palavra por dia (tabela `daily_words`, liberada por RLS só até hoje, fuso de Brasília); resultado em `daily_results`; tela em `termo/diario.js` |

Os níveis são liberados em ordem: só se avança depois de concluir o anterior.
O progresso fica no aparelho (sem login) ou na conta (tabela `progress`).

## Como adicionar um novo jogo

1. Criar a pasta do jogo (ex.: `snake/`) com `index.html` e `game.js`
2. Incluir o jogo na lista de `check` da tabela `scores` no Supabase
3. Usar `getRanking` e `saveScore` de `js/supabase.js`
4. Ativar o card na home
