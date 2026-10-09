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

Os níveis são liberados em ordem: só se avança depois de concluir o anterior.
O progresso fica no aparelho (sem login) ou na conta (tabela `progress`).

## Como adicionar um novo jogo

1. Criar a pasta do jogo (ex.: `snake/`) com `index.html` e `game.js`
2. Incluir o jogo na lista de `check` da tabela `scores` no Supabase
3. Usar `getRanking` e `saveScore` de `js/supabase.js`
4. Ativar o card na home
