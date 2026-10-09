import { createKit } from "/js/kit.js";
import { sfx, initAudio } from "/js/sound.js";
import { generate, ERRS, MAX_MISS } from "/erros/gen.js";

const $ = (id) => document.getElementById(id);
let lvl = 1, cur = null, found = new Set(), miss = 0;

function drawDocs() {
  [["doc-fat", cur.rowsFat], ["doc-pl", cur.rowsPl]].forEach(([id, rows]) => {
    const box = $(id);
    box.innerHTML = "";
    rows.forEach(([key, label, value]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "drow";
      b.dataset.k = key;
      const a = document.createElement("span"); a.textContent = label;
      const v = document.createElement("span"); v.textContent = value;
      b.append(a, v);
      b.addEventListener("click", () => tap(b, key));
      box.appendChild(b);
    });
  });
}

const kit = createKit({
  game: "erros",
  total: 10,
  goalText: (n) => `Ache ${ERRS[n - 1]} erros nos documentos`,
  onSelect(n) {
    lvl = n; cur = null; found = new Set(); miss = 0;
    $("doc-fat").innerHTML = ""; $("doc-pl").innerHTML = "";
    $("hud-a").textContent = "0"; $("hud-g").textContent = ERRS[n - 1]; $("hud-m").textContent = "0";
  },
  onBegin(n) {
    cur = generate(ERRS[n - 1]);
    found = new Set(); miss = 0;
    $("hud-a").textContent = "0"; $("hud-m").textContent = "0";
    drawDocs();
  },
});

function tap(btn, key) {
  if (!kit.isRunning() || btn.classList.contains("found")) return;
  initAudio();
  if (cur.erros.has(key)) {
    sfx.place();
    found.add(key);
    // marca todas as linhas daquela divergência nos dois documentos
    document.querySelectorAll(`.drow[data-k="${key}"]`).forEach((r) => r.classList.add("found"));
    $("hud-a").textContent = found.size;
    if (found.size >= cur.erros.size) kit.win();
  } else {
    miss++;
    $("hud-m").textContent = miss;
    btn.classList.add("miss");
    setTimeout(() => btn.classList.remove("miss"), 500);
    if (miss >= MAX_MISS) kit.lose(`Você marcou ${MAX_MISS} campos que estavam corretos.`);
    else sfx.fail();
  }
}
