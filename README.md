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
| Teste de Reflexo | menor tempo médio (ms) |

## Como adicionar um novo jogo

1. Criar a pasta do jogo (ex.: `snake/`) com `index.html` e `game.js`
2. Incluir o jogo na lista de `check` da tabela `scores` no Supabase
3. Usar `getRanking` e `saveScore` de `js/supabase.js`
4. Ativar o card na home
