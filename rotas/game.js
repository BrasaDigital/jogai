import { createQuiz, perLevel } from "/js/quiz.js";
import { makeRotas } from "/rotas/questions.js";
createQuiz({ game: "rotas", make: (n) => makeRotas(n, perLevel(n)) });
