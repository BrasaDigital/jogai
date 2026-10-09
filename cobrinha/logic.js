export const N = 15;
export const TICKS = [220, 200, 185, 170, 155, 140, 125, 110, 98, 85];
export const GOALS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 15];
export const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export function newState(rand = Math.random) {
  const snake = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }];
  const s = { snake, dir: [1, 0], apple: null, eaten: 0 };
  s.apple = placeApple(snake, rand);
  return s;
}

export function placeApple(snake, rand = Math.random) {
  const used = new Set(snake.map((p) => p.y * N + p.x));
  const free = [];
  for (let i = 0; i < N * N; i++) if (!used.has(i)) free.push(i);
  const i = free[Math.floor(rand() * free.length)];
  return { x: i % N, y: Math.floor(i / N) };
}

// vira, se não for o sentido contrário
export function turn(s, name) {
  const d = DIRS[name];
  if (!d) return;
  if (d[0] === -s.dir[0] && d[1] === -s.dir[1]) return;
  s.dir = d;
}

// avança um passo: "ok" | "eat" | "dead"
export function step(s, rand = Math.random) {
  const h = s.snake[0];
  const nx = h.x + s.dir[0];
  const ny = h.y + s.dir[1];
  if (nx < 0 || ny < 0 || nx >= N || ny >= N) return "dead";
  const eat = nx === s.apple.x && ny === s.apple.y;
  const body = eat ? s.snake : s.snake.slice(0, -1); // a cauda sai do lugar
  if (body.some((p) => p.x === nx && p.y === ny)) return "dead";
  s.snake.unshift({ x: nx, y: ny });
  if (eat) {
    s.eaten++;
    if (s.snake.length < N * N) s.apple = placeApple(s.snake, rand);
    return "eat";
  }
  s.snake.pop();
  return "ok";
}
