import "/js/account.js";
const box = document.getElementById("mesa"), msg = document.getElementById("mesa-msg");
(async () => {
  try {
    const { iniciar } = await import("/mesa/cena.js");
    const m = iniciar(box); msg.remove();
    window.__mesa = m;
    document.querySelectorAll(".cam").forEach((b) => b.addEventListener("click", () => m.irPara(b.dataset.cam)));
    document.getElementById("form-a").addEventListener("change", (e) => m.formar("A", e.target.value));
    document.getElementById("form-b").addEventListener("change", (e) => m.formar("B", e.target.value));
    document.getElementById("form-a").value = m.estado.A; document.getElementById("form-b").value = m.estado.B;
    document.getElementById("tela-cheia").addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen(); else if (box.requestFullscreen) box.requestFullscreen();
    });
  } catch (e) {
    msg.textContent = "Não foi possível carregar o campo 3D neste aparelho (precisa de WebGL e internet).";
    console.error(e);
  }
})();
