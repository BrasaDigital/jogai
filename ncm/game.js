import { createQuiz, perLevel } from "/js/quiz.js";
import { makeNcm } from "/ncm/questions.js";
createQuiz({ game: "ncm", make: (n) => makeNcm(n, perLevel(n)) });
