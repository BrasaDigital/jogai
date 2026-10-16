import "/js/account.js";
const box = document.getElementById("mesa"), msg = document.getElementById("mesa-msg");
const TEMPO_ORGANIZAR = 20, TEMPO_JOGO = 180;
const fmt = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(Math.floor(s % 60)).padStart(2, "0");
(async () => {
  try {
    const { iniciar } = await import("/mesa/cena.js"); const { criarJogo, renderFrase } = await import("/mesa/jogo.js");
    const { abrirCanal, novoCodigo } = await import("/mesa/online.js"); const { criarConvidado } = await import("/mesa/convidado.js");
    const m = iniciar(box); msg.remove(); window.__mesa = m;
    const $ = (id) => document.getElementById(id);
    const hud = $("hud"), fase = $("fase"), relogio = $("relogio"), fa = $("form-a"), fb = $("form-b"), status = $("m-status");
    const placar = { A: 0, B: 0 }; hud.hidden = false;
    // modo: "bot" | "anfitriao" | "convidado"
    let modo = "bot", estadoJogo = "organizar", resta = 0, timer = null, canal = null, conv = null, snapTimer = null, ultimo = "", ultEnvio = 0, convPronto = false, euPronto = false, formB = "4-4-2", ultRecebido = 0, vigia = null;
    const mostrarPlacar = () => { $("pa").textContent = placar.A; $("pb").textContent = placar.B; };
    const jogo = criarJogo(m, { fase: (h) => { fase.innerHTML = h; }, placar: { valor: placar, atualizar: () => mostrarPlacar() } });
    m.jogo = jogo;

    function parar() { clearInterval(timer); timer = null; jogo.parar(); }
    function sairOnline(texto) {
      clearInterval(snapTimer); clearInterval(vigia); snapTimer = vigia = null;
      if (conv) { conv.parar(); conv = null; } if (canal) { try { canal.fechar(); } catch {} canal = null; }
      if (m.meuTime() !== "A") { m.definirMeu("A"); }
      modo = "bot"; fa.disabled = fb.disabled = false; $("lobby").hidden = false; status.textContent = texto || "";
    }

    // ---------- contra o computador ----------
    function organizar() {
      parar(); estadoJogo = "organizar"; resta = TEMPO_ORGANIZAR; placar.A = placar.B = 0; mostrarPlacar();
      fa.disabled = fb.disabled = false; m.formar("A", fa.value); m.formar("B", fb.value);
      relogio.textContent = fmt(TEMPO_JOGO); m.organizar(true); m.irPara("topo");
      const desenhar = () => { fase.innerHTML = `<span>Planeje o campo todo: arraste cada jogador (o círculo é a área dele). O time azul está escondido e também planeja.</span><span class="cont">${resta}s</span><button type="button" id="pronto">✅ Pronto</button>`; $("pronto").onclick = iniciarJogo; };
      desenhar();
      timer = setInterval(() => { resta--; if (resta <= 0) iniciarJogo(); else desenhar(); }, 1000);
    }
    function iniciarJogo() {
      parar(); m.organizar(false); estadoJogo = "jogo"; resta = TEMPO_JOGO; fa.disabled = fb.disabled = true;
      fase.innerHTML = "<span>⚽ Apito! Saída de bola</span>"; m.irPara("angulo"); relogio.textContent = fmt(resta); jogo.iniciar({ remoto: modo === "anfitriao" });
      timer = setInterval(() => { resta--; relogio.textContent = fmt(Math.max(0, resta)); if (resta <= 0) fim(); }, 1000);
    }
    function fim() {
      parar(); estadoJogo = "fim";
      fase.innerHTML = `<span>Fim de jogo! ${placar.A} × ${placar.B}</span>` + (modo === "bot" ? '<button type="button" id="de-novo">🔁 Jogar de novo</button>' : modo === "anfitriao" ? '<button type="button" id="de-novo">🔁 Jogar de novo</button>' : "");
      const b = $("de-novo"); if (b) b.onclick = modo === "anfitriao" ? comecarOnline : organizar;
    }

    // ---------- online: anfitrião (time amarelo) ----------
    const planoB = () => m.times.B.map((j) => [j.userData.plano.x, j.userData.plano.z]);
    function enviarEstado(forcar) {
      if (!canal) return; const s = jogo.snapshot(); s.f = estadoJogo; s.pa = placar.A; s.pb = placar.B; s.rel = relogio.textContent; s.resta = resta;
      const chave = JSON.stringify(s), agora = performance.now();
      if (chave === ultimo && !forcar && agora - ultEnvio < 2000) return; ultimo = chave; ultEnvio = agora; canal.enviar("estado", s);
    }
    function comecarOnline() {
      // organização simultânea de 20 s: eu planejo A; o convidado planeja B (escondido)
      parar(); estadoJogo = "organizar"; resta = TEMPO_ORGANIZAR; placar.A = placar.B = 0; mostrarPlacar(); convPronto = euPronto = false;
      m.formar("A", fa.value); m.formar("B", formB); relogio.textContent = fmt(TEMPO_JOGO); m.organizar(true); m.irPara("topo");
      canal.enviar("inicio", { formA: fa.value, formB });
      const desenhar = () => {
        fase.innerHTML = euPronto ? `<span>Aguardando o adversário… ${convPronto ? "" : "(ele ainda está planejando)"}</span><span class="cont">${resta}s</span>` : `<span>Planeje o campo todo. O adversário não vê o seu plano.</span><span class="cont">${resta}s</span><button type="button" id="pronto">✅ Pronto</button>`;
        const b = $("pronto"); if (b) b.onclick = () => { euPronto = true; checar(); desenhar(); };
        enviarEstado(true);
      };
      const checar = () => { if (euPronto && convPronto) comecarJogoOnline(); };
      m._checar = checar; desenhar();
      timer = setInterval(() => { resta--; if (resta <= 0) comecarJogoOnline(); else desenhar(); }, 1000);
    }
    function comecarJogoOnline() { if (estadoJogo !== "organizar") return; iniciarJogo(); enviarEstado(true); }
    function ligarAnfitriao(c) {
      canal = c; modo = "anfitriao";
      c.ao("oi", (d) => { formB = d.form || "4-4-2"; fb.value = formB; status.textContent = `Adversário: ${d.nome || "Convidado"}`; if (estadoJogo === "organizar" || estadoJogo === "fim" || !snapTimer) { if (!snapTimer) snapTimer = setInterval(() => enviarEstado(), 100); ultRecebido = performance.now(); comecarOnline(); } });
      c.ao("plano", (d) => { if (d.plano) jogo.definirPlanoB(d.plano); if (d.pronto) { convPronto = true; if (m._checar) m._checar(); } });
      c.ao("mira", (d) => jogo.miraRemota(d.dx, d.dz, d.v));
      c.ao("chute", (d) => jogo.chuteRemoto(d.dx, d.dz, d.v));
      c.ao("bate", () => { ultRecebido = performance.now(); });
      c.ao("tchau", () => { parar(); sairOnline("O adversário saiu da sala."); organizar(); });
      vigia = setInterval(() => { if (canal) canal.enviar("bate", {}); }, 4000);
    }

    // ---------- online: convidado (time azul) ----------
    function ligarConvidado(c, nome) {
      canal = c; modo = "convidado"; conv = criarConvidado(m, { fase: (h) => { fase.innerHTML = h; } }, c);
      let meuPlano = false, vistoJogo = "";
      const enviarPlano = (pronto) => c.enviar("plano", { plano: m.times.B.map((j) => [j.userData.plano.x, j.userData.plano.z]), pronto: !!pronto });
      c.ao("inicio", (d) => {
        estadoJogo = "organizar"; m.definirMeu("B"); m.formar("A", d.formA); m.formar("B", d.formB); fb.value = d.formB; fa.value = d.formA; fa.disabled = fb.disabled = true;
        m.organizar(true); m.irPara("topo"); meuPlano = true; let pronto = false;
        const fimPlano = () => { if (!meuPlano) return; meuPlano = false; pronto = true; enviarPlano(true); m.organizar(false); };
        const pintar = (r) => { fase.innerHTML = `<span>Planeje o campo todo. O adversário não vê o seu plano.</span><span class="cont">${r}s</span><button type="button" id="pronto">✅ Pronto</button>`; $("pronto").onclick = () => { fimPlano(); fase.innerHTML = "<span>Aguardando o adversário…</span>"; }; };
        pintar(TEMPO_ORGANIZAR); relogio.textContent = fmt(TEMPO_JOGO);
        convTick = (s) => { if (meuPlano && s.f === "organizar") pintar(s.resta); else if (meuPlano && s.f !== "organizar") fimPlano(); };
        document.getElementById("mesa").addEventListener("pointerup", () => { if (meuPlano) enviarPlano(false); }, { once: false });
      });
      let convTick = () => {};
      c.ao("estado", (s) => {
        ultRecebido = performance.now(); placar.A = s.pa; placar.B = s.pb; mostrarPlacar(); relogio.textContent = s.rel; estadoJogo = s.f;
        convTick(s);
        if (s.f === "organizar") { vistoJogo = "organizar"; return; }
        if (s.f === "fim") { fase.innerHTML = `<span>Fim de jogo! ${s.pa} × ${s.pb}</span><span>Aguarde o anfitrião reiniciar…</span>`; conv.parar(); return; }
        if (s.f === "jogo" && vistoJogo !== "jogo") m.irPara("angulo"); vistoJogo = s.f;
        conv.aplicar(s);
      });
      c.ao("bate", () => { ultRecebido = performance.now(); });
      c.ao("tchau", () => { sairOnline("O anfitrião saiu da sala."); organizar(); });
      vigia = setInterval(() => { c.enviar("bate", {}); if (performance.now() - ultRecebido > 15000) { sairOnline("Conexão perdida com o anfitrião."); organizar(); } }, 4000);
      ultRecebido = performance.now();
      c.enviar("oi", { nome, form: fb.value });
    }

    async function nomeJogador() { try { const mod = await import("/js/supabase.js"); const { data } = await mod.supabase.auth.getSession(); const u = data && data.session && data.session.user; return (u && (u.user_metadata && (u.user_metadata.name || u.user_metadata.full_name) || (u.email || "").split("@")[0])) || "Convidado"; } catch { return "Convidado"; } }

    $("m-bot").onclick = () => { if (modo !== "bot") { if (canal) canal.enviar("tchau", {}); sairOnline(""); } status.textContent = ""; organizar(); };
    $("m-criar").onclick = async () => {
      if (canal) { canal.enviar("tchau", {}); sairOnline(""); }
      const cod = novoCodigo(); status.textContent = "Criando sala…";
      try { const c = await abrirCanal(cod); parar(); ligarAnfitriao(c); estadoJogo = "organizar"; m.formar("A", fa.value); m.formar("B", fb.value); m.organizar(false); m.irPara("angulo"); fase.innerHTML = `<span>Sala <b style="font-size:20px;letter-spacing:4px">${cod}</b> criada. Passe o código ao adversário e aguarde ele entrar…</span>`; status.textContent = `Sala ${cod} — aguardando adversário`; fb.disabled = true; }
      catch (e) { console.error(e); status.textContent = "Não foi possível criar a sala (Realtime indisponível)."; }
    };
    $("m-entrar").onclick = async () => {
      const cod = $("m-cod").value.trim().toUpperCase(); if (cod.length !== 4) { status.textContent = "Digite o código de 4 letras."; return; }
      if (canal) { canal.enviar("tchau", {}); sairOnline(""); }
      status.textContent = "Entrando…";
      try { const c = await abrirCanal(cod); parar(); const nome = await nomeJogador(); fa.disabled = true; ligarConvidado(c, nome); fase.innerHTML = "<span>Conectado! Aguardando o anfitrião iniciar…</span>"; status.textContent = `Sala ${cod}`; $("lobby").hidden = false; }
      catch (e) { console.error(e); status.textContent = "Não foi possível entrar na sala."; }
    };
    window.addEventListener("pagehide", () => { if (canal) canal.enviar("tchau", {}); });

    window.__mesa.placar = placar; window.__mesa.mostrarPlacar = mostrarPlacar; window.__mesa.fase = () => estadoJogo; window.__mesa.modo = () => modo;
    document.querySelectorAll(".cam").forEach((b) => b.addEventListener("click", () => m.irPara(b.dataset.cam)));
    fa.addEventListener("change", (e) => { if (estadoJogo === "organizar" && modo === "bot") m.formar("A", e.target.value); });
    fb.addEventListener("change", (e) => { if (estadoJogo === "organizar" && modo === "bot") m.formar("B", e.target.value); });
    fa.value = m.estado.A; fb.value = m.estado.B;
    $("tela-cheia").addEventListener("click", () => { if (document.fullscreenElement) document.exitFullscreen(); else if (box.requestFullscreen) box.requestFullscreen(); });
    organizar();
  } catch (e) {
    msg.textContent = "Não foi possível carregar o campo 3D neste aparelho (precisa de WebGL e internet).";
    console.error(e);
  }
})();
