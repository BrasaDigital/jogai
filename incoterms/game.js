import { createQuiz, perLevel } from "/js/quiz.js";
import { makeIncoterms } from "/incoterms/questions.js";
createQuiz({ game: "incoterms", make: (n) => makeIncoterms(n, perLevel(n)) });
