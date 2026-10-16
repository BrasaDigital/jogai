import "/js/account.js";
const box = document.getElementById("mesa"), msg = document.getElementById("mesa-msg");
const TEMPO_ORGANIZAR = 20, TEMPO_JOGO = 180;
const fmt = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(Math.floor(s % 60)).padStart(2, "0");
(async () => {
  try {
    const { iniciar } = await import("/mesa/cena.js");
    const m = iniciar(box); msg.remove(); window.__mesa = m;
    const hud = document.getElementById("hud"), fase = document.getElementById("fase"), relogio = document.getElementById("relogio");
    const fa = document.getElementById("form-a"), fb = document.getElementById("form-b");
    const placar = { A: 0, B: 0 }; hud.hidden = false;
    let estadoJogo = "organizar", resta = 0, timer = null;
    const mostrarPlacar = () => { document.getElementById("pa").textContent = placar.A; document.getElementById("pb").textContent = placar.B; };

    function legenda() {
      const [d, mm, a] = m.estado.A.split("-");
      return `<span class="leg"><i style="background:#3b82f6"></i>Defesa ${d} <i style="background:#facc15"></i>Meio ${mm} <i style="background:#ef4444"></i>Ataque ${a}</span>`;
    }
    function parar() { clearInterval(timer); timer = null; }
    function organizar() {
      parar(); estadoJogo = "organizar"; resta = TEMPO_ORGANIZAR; placar.A = placar.B = 0; mostrarPlacar();
      fa.disabled = fb.disabled = false; m.formar("A", fa.value); m.formar("B", fb.value);
      relogio.textContent = fmt(TEMPO_JOGO); m.organizar(true); m.irPara("topo");
      const desenhar = () => { fase.innerHTML = `<span>Organize seu time: arraste os jogadores dentro de cada região</span>${legenda()}<span class="cont">${resta}s</span><button type="button" id="pronto">✅ Pronto</button>`; document.getElementById("pronto").onclick = iniciarJogo; };
      desenhar();
      timer = setInterval(() => { resta--; if (resta <= 0) iniciarJogo(); else desenhar(); }, 1000);
    }
    function iniciarJogo() {
      parar(); m.organizar(false); estadoJogo = "jogo"; resta = TEMPO_JOGO; fa.disabled = fb.disabled = true;
      fase.innerHTML = "<span>⚽ Bola rolando!</span>"; m.irPara("angulo"); relogio.textContent = fmt(resta);
      setTimeout(() => { if (estadoJogo === "jogo") fase.innerHTML = ""; }, 2500);
      timer = setInterval(() => { resta--; relogio.textContent = fmt(Math.max(0, resta)); if (resta <= 0) fim(); }, 1000);
    }
    function fim() {
      parar(); estadoJogo = "fim";
      fase.innerHTML = `<span>Fim de jogo! ${placar.A} × ${placar.B}</span><button type="button" id="de-novo">🔁 Jogar de novo</button>`; document.getElementById("de-novo").onclick = organizar;
    }
    window.__mesa.placar = placar; window.__mesa.mostrarPlacar = mostrarPlacar; window.__mesa.fase = () => estadoJogo;

    document.querySelectorAll(".cam").forEach((b) => b.addEventListener("click", () => m.irPara(b.dataset.cam)));
    fa.addEventListener("change", (e) => { if (estadoJogo === "organizar") { m.formar("A", e.target.value); organizarAtualiza(); } });
    fb.addEventListener("change", (e) => { if (estadoJogo === "organizar") m.formar("B", e.target.value); });
    function organizarAtualiza() { const l = fase.querySelector(".leg"); if (l) l.outerHTML = legenda(); }
    fa.value = m.estado.A; fb.value = m.estado.B;
    document.getElementById("tela-cheia").addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen(); else if (box.requestFullscreen) box.requestFullscreen();
    });
    organizar();
  } catch (e) {
    msg.textContent = "Não foi possível carregar o campo 3D neste aparelho (precisa de WebGL e internet).";
    console.error(e);
  }
})();
