// Regras da partida: 5 toques por turno, posse = jogador mais próximo, chute com a alavanca, gols.
import * as THREE from "three";
import { CAMPO, RAIO_AREA, FORMACOES } from "/mesa/cena.js";

const ATRITO = 2.6, VMAX = 9.5, VMIN = 1.5, RBOLA = 0.16, RJOG = 0.28, REST_PAREDE = 0.78, REST_JOG = 0.55, GOL_L = 3.3, TOQUES = 5, ANTES_DO_DESLIZE = 3;
const PADRAO = { A: Math.PI / 2, B: -Math.PI / 2 };
const pontos = (n) => "●".repeat(Math.max(0, n)) + "○".repeat(Math.max(0, TOQUES - n));

export function criarJogo(m, ui) {
  const { scene, controls, renderer, times, bola } = m, el = renderer.domElement;
  const xl = CAMPO.c / 2, zl = CAMPO.l / 2;
  let ativo = false, vez = "A", toques = TOQUES, chutesSaida = 0, slideFeito = false, modo = "espera", jog = null, relogio = 0;
  let ultimoToque = "A", ignorar = null, ignorarAte = 0, anim = null, mirando = false, mira = { dir: new THREE.Vector2(1, 0), vel: 0, ok: false };
  const vel = new THREE.Vector2(), agenda = [];
  const depois = (s, fn) => agenda.push({ t: relogio + s, fn });

  // ----- tracejado de mira -----
  const grupoMira = new THREE.Group(); grupoMira.visible = false; scene.add(grupoMira);
  const matMira = new THREE.MeshBasicMaterial({ color: "#ffd23f", transparent: true, opacity: 0.9, depthWrite: false });
  const tracos = [];
  for (let i = 0; i < 70; i++) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.18), matMira); d.rotation.x = -Math.PI / 2; d.position.y = 0.045; grupoMira.add(d); tracos.push(d); }
  const seta = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 3), matMira); seta.rotation.x = Math.PI / 2; seta.position.y = 0.05; grupoMira.add(seta);
  function desenharMira() {
    const { dir, vel: v } = mira, bx = bola.position.x, bz = bola.position.z;
    let len = (v * v) / (2 * ATRITO);
    for (const [c, p, d, lim] of [["x", bx, dir.x, xl - RBOLA], ["z", bz, dir.y, zl - RBOLA]]) {   // corta no limite do campo
      if (Math.abs(d) < 1e-4) continue; const alvo = d > 0 ? lim : -lim, tc = (alvo - p) / d;
      if (tc > 0 && tc < len) { if (c === "x") { const zh = bz + dir.y * tc; if (Math.abs(zh) < GOL_L / 2 - 0.1) continue; } len = tc; }
    }
    len = Math.max(0.3, len); const n = Math.min(tracos.length, Math.floor(len / 0.28));
    grupoMira.position.set(bx, 0, bz); grupoMira.rotation.y = Math.atan2(dir.x, dir.y);
    tracos.forEach((d, i) => { d.visible = i < n; d.position.z = 0.32 + i * 0.28; });
    seta.position.z = 0.32 + n * 0.28 + 0.05; matMira.color.set(new THREE.Color("#ffd23f").lerp(new THREE.Color("#ff3b30"), (v - VMIN) / (VMAX - VMIN)));
    grupoMira.visible = true;
  }

  // ----- jogadores -----
  const todos = () => [...times.A.map((j) => ({ j, time: "A" })), ...times.B.map((j) => ({ j, time: "B" }))];
  function maisProximo(filtro) {
    let melhor = null; for (const o of todos()) { if (filtro && o.time !== filtro) continue; const d = Math.hypot(o.j.position.x - bola.position.x, o.j.position.z - bola.position.z); if (!melhor || d < melhor.d) melhor = { ...o, d }; }
    return melhor;
  }
  function posicionar(j, dir) {          // atrás da bola, perna de chute alinhada com a direção
    const th = Math.atan2(dir.x, dir.y), rx = Math.cos(th), rz = -Math.sin(th);
    j.userData.alvo.set(bola.position.x - dir.x * 0.5 - rx * 0.084, 0.05, bola.position.z - dir.y * 0.5 - rz * 0.084); j.userData.rotAlvo = th;
  }
  const restaurarRotacao = () => { for (const { j, time } of todos()) if (j !== jog) j.rotation.y = PADRAO[time]; };

  // ----- fluxo de turnos -----
  const textoVez = () => vez === "A" ? `<span>Sua vez · <b>${pontos(toques)}</b> · puxe para trás, como um estilingue, e solte para chutar</span>` : `<span>Vez do Azul · <b>${pontos(toques)}</b></span>`;
  function proximo(forcado = false) {
    if (!ativo) return;
    const p = forcado ? maisProximo(vez) : maisProximo();
    if (!forcado && (toques <= 0 || p.time !== vez)) { vez = p.time; toques = TOQUES; }
    if (!forcado && p.d > RAIO_AREA && toques > 1) toques--;               // bola fora da área: a corrida gasta um toque
    jog = p.j; restaurarRotacao(); ui.fase(textoVez());
    const dir = new THREE.Vector2(vez === "A" ? 1 : -1, 0); mira.dir.copy(dir); posicionar(jog, dir); modo = "anda";
  }
  function chegou() {
    modo = "mirar";
    if (vez === "B") depois(0.5, decidirIA);
  }
  function decidirIA() {
    if (!ativo || modo !== "mirar" || vez !== "B") return;
    const alvoZ = (Math.random() - 0.5) * 1.6, dx = -xl - bola.position.x, dz = alvoZ - bola.position.z, d = Math.hypot(dx, dz);
    const ang = Math.atan2(dz, dx) + (Math.random() - 0.5) * 0.26, v = Math.min(VMAX, Math.max(3, Math.sqrt(2 * ATRITO * (d + 1.2)) * (0.9 + Math.random() * 0.25)));
    mira.dir.set(Math.cos(ang), Math.sin(ang)); mira.vel = v; posicionar(jog, mira.dir); desenharMira();
    depois(0.8, () => { if (ativo && modo === "mirar") chutar(mira.dir.clone(), v); });
  }
  function chutar(dir, v) {
    ultimoToque = vez; modo = "chute"; mirando = false; grupoMira.visible = false; posicionar(jog, dir);
    jog.position.copy(jog.userData.alvo); jog.rotation.y = jog.userData.rotAlvo;
    anim = { j: jog, t: 0, dir, v, batido: false };
  }
  function animarChute(dt) {
    const a = anim; if (!a) return; a.t += dt; const perna = a.j.userData.perna;
    if (a.t < 0.12) perna.rotation.x = -1.0 * Math.sin((a.t / 0.12) * Math.PI / 2);
    else if (a.t < 0.28) perna.rotation.x = -1.0;
    else perna.rotation.x = -1.0 * Math.max(0, 1 - (a.t - 0.28) / 0.3);
    if (!a.batido && a.t >= 0.1) {
      a.batido = true; vel.set(a.dir.x * a.v, a.dir.y * a.v); ignorar = a.j; ignorarAte = relogio + 0.5; modo = "rolando"; toques--;
      if (!slideFeito) chutesSaida++;
    }
    if (a.t >= 0.6) { perna.rotation.x = 0; anim = null; }
  }
  function bolaParou() {
    vel.set(0, 0); modo = "espera";
    depois(0.35, () => { if (!ativo) return; if (!slideFeito && chutesSaida >= ANTES_DO_DESLIZE) deslizar(); else proximo(); });
  }
  function deslizar() {
    slideFeito = true; modo = "slide"; ui.fase("<span>Todos vão para as posições planejadas…</span>");
    for (const { j } of todos()) {
      const a = j.userData.plano.clone(), dx = a.x - bola.position.x, dz = a.z - bola.position.z, d = Math.hypot(dx, dz);
      if (d < 0.65) { a.x = bola.position.x + (d > 1e-3 ? dx / d : 1) * 0.65; a.z = bola.position.z + (d > 1e-3 ? dz / d : 0) * 0.65; }
      j.userData.alvo.copy(a); j.userData.alvo.y = 0.05;
    }
    depois(1.8, () => proximo());
  }
  const nomeTime = (t) => (t === "A" ? "Brasil" : "Argentina");
  function fora(tipo, x, z) {
    if (modo !== "rolando") return; modo = "fora"; vel.set(0, 0);
    if (tipo === "lateral") {
      const time = ultimoToque === "A" ? "B" : "A", px = Math.max(-xl + 1, Math.min(xl - 1, x)), pz = Math.sign(z) * (zl - 0.3);
      ui.fase(`<span>Bola fora pela lateral — ${nomeTime(time)} repõe</span>`);
      depois(1.6, () => { bola.position.set(px, 0.19, pz); vez = time; toques = TOQUES; chutesSaida = 0; slideFeito = false; jog = null; proximo(true); });
    } else {
      const time = x > 0 ? "B" : "A", lado = x > 0 ? 1 : -1;
      ui.fase(`<span>Bola pela linha de fundo — tiro de meta ${time === "A" ? "do Brasil" : "da Argentina"}</span>`);
      depois(1.4, () => tiroDeMeta(time, lado));
    }
  }
  function tiroDeMeta(time, lado) {
    bola.position.set(lado * (xl - 1.2), 0.19, 0); modo = "planejar"; jog = null;
    // computador replaneja: desloca um pouco cada jogador
    times.B.forEach((jj, i) => { if (i === 0) return; const p = jj.userData.plano; p.x = Math.max(-xl + 0.5, Math.min(xl - 0.5, p.x + (Math.random() - 0.5) * 2.4)); p.z = Math.max(-zl + 0.5, Math.min(zl - 0.5, p.z + (Math.random() - 0.5) * 2.4)); });
    m.planejar(true);
    let resta = 5;
    const encerrar = () => { if (modo !== "planejar") return; modo = "espera"; m.planejar(false); vez = time; toques = TOQUES; chutesSaida = 0; slideFeito = false; proximo(true); };
    const desenhar = () => { ui.fase(`<span>Tiro de meta: replaneje o time (arraste os círculos)</span><span class="cont">${resta}s</span><button type="button" id="pronto-meta">✅ Pronto</button>`); const b = document.getElementById("pronto-meta"); if (b) b.onclick = encerrar; };
    desenhar();
    const tic = () => { if (!ativo || modo !== "planejar") return; resta--; if (resta <= 0) encerrar(); else { desenhar(); depois(1, tic); } };
    depois(1, tic);
  }
  function gol(time) {
    if (modo === "gol") return; modo = "gol"; ui.placar.valor[time]++; ui.placar.atualizar();
    ui.fase(`<span>⚽ GOOOL ${time === "A" ? "do Brasil" : "da Argentina"}!</span>`);
    depois(2.4, () => {
      bola.position.set(0, 0.19, 0); vel.set(0, 0); m.formar("A", m.estado.A, true); m.formar("B", m.estado.B, true);
      vez = time === "A" ? "B" : "A"; toques = TOQUES; chutesSaida = 0; slideFeito = false; jog = null; proximo(true);
    });
  }

  // ----- física da bola -----
  function fisica(dt) {
    const passos = 3, h = dt / passos;
    for (let s = 0; s < passos && modo === "rolando"; s++) {
      const sp = vel.length(); if (sp > 0) vel.multiplyScalar(Math.max(0, sp - ATRITO * h) / sp);
      let x = bola.position.x + vel.x * h, z = bola.position.z + vel.y * h;
      const naBoca = Math.abs(z) < GOL_L / 2 - 0.1, noGol = Math.abs(x) > xl;
      if (noGol && naBoca) { const zm = GOL_L / 2 - 0.1; if (Math.abs(z) > zm) { z = Math.sign(z) * zm; vel.y = -Math.sign(z) * Math.abs(vel.y) * REST_PAREDE; } }   // paredes da rede
      else if (Math.abs(z) > zl) { fora("lateral", x, z); return; }
      else if (Math.abs(x) > xl) { fora("fundo", x, z); return; }
      if (Math.abs(x) > xl + 0.12 && naBoca) { gol(x > 0 ? "A" : "B"); }
      if (Math.abs(x) > xl + 0.75) { x = Math.sign(x) * (xl + 0.75); vel.multiplyScalar(0.2); }
      for (const { j } of todos()) {
        if (j === ignorar && relogio < ignorarAte) continue;
        const dx = x - j.position.x, dz = z - j.position.z, d = Math.hypot(dx, dz), min = RBOLA + RJOG;
        if (d < min && d > 1e-4) {
          const nx = dx / d, nz = dz / d; x = j.position.x + nx * min; z = j.position.z + nz * min;
          const vn = vel.x * nx + vel.y * nz; if (vn < 0) { vel.x -= (1 + REST_JOG) * vn * nx; vel.y -= (1 + REST_JOG) * vn * nz; }
        }
      }
      const dist = Math.hypot(x - bola.position.x, z - bola.position.z);
      if (dist > 0) { const eixo = new THREE.Vector3(z - bola.position.z, 0, -(x - bola.position.x)).normalize(); bola.rotateOnWorldAxis(eixo, dist / RBOLA); }
      bola.position.x = x; bola.position.z = z;
    }
    if (modo === "rolando" && vel.length() < 0.12) bolaParou();
  }

  // ----- entrada do jogador (arrastar a partir da bola) -----
  function atualizarMira(ev) {
    const p = m.noMesa(ev); if (!p) return; const vx = bola.position.x - p.x, vz = bola.position.z - p.z, d = Math.hypot(vx, vz);   // estilingue: o chute vai no sentido contrário ao arraste
    if (d < 0.35) { mira.ok = false; grupoMira.visible = false; return; }
    mira.ok = true; mira.dir.set(vx / d, vz / d); mira.vel = Math.min(VMAX, Math.max(VMIN, d * 2.6)); posicionar(jog, mira.dir); desenharMira();
  }
  el.addEventListener("pointerdown", (ev) => {
    if (!ativo || modo !== "mirar" || vez !== "A") return; const p = m.noMesa(ev); if (!p) return;
    if (Math.hypot(p.x - bola.position.x, p.z - bola.position.z) > 2.4) return;
    mirando = true; controls.enabled = false; el.setPointerCapture(ev.pointerId); atualizarMira(ev);
  }, true);
  el.addEventListener("pointermove", (ev) => { if (mirando) atualizarMira(ev); });
  const soltou = () => { if (!mirando) return; mirando = false; controls.enabled = true; if (mira.ok && modo === "mirar") chutar(mira.dir.clone(), mira.vel); else grupoMira.visible = false; };
  el.addEventListener("pointerup", soltou); el.addEventListener("pointercancel", soltou);

  // ----- laço -----
  m.aoQuadro((dt) => {
    if (!ativo) return; relogio += dt;
    for (let i = agenda.length - 1; i >= 0; i--) if (agenda[i].t <= relogio) { const f = agenda[i].fn; agenda.splice(i, 1); f(); }
    if (jog && (modo === "anda" || modo === "mirar")) {
      let d = jog.userData.rotAlvo - jog.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); jog.rotation.y += d * Math.min(1, dt * 12);
      if (modo === "anda" && jog.position.distanceTo(jog.userData.alvo) < 0.06) chegou();
    }
    animarChute(dt); if (modo === "rolando") fisica(dt);
  });

  return {
    iniciar() {
      // plano do computador: a mesma formação, mais adiantada
      FORMACOES[m.estado.B].forEach(([u, v], i) => {
        const uu = i === 0 ? u : Math.min(0.47, u * 1.45);
        times.B[i].userData.plano.set(xl - uu * CAMPO.c, 0.05, v * (zl - 0.45) * -1);
      });
      agenda.length = 0; anim = null; bola.position.set(0, 0.19, 0); vel.set(0, 0);
      ativo = true; vez = "A"; toques = TOQUES; chutesSaida = 0; slideFeito = false; jog = null; ignorar = null; modo = "espera";
      depois(1.2, () => proximo(true));
    },
    _chutar: (dx, dz, v) => { if (modo === "mirar") chutar(new THREE.Vector2(dx, dz).normalize(), v); },
    _lancar: (x, z, vx, vz) => { bola.position.set(x, 0.19, z); vel.set(vx, vz); modo = "rolando"; ultimoToque = "A"; },
    info: () => ({ modo, vez, toques, chutesSaida, slideFeito, bx: bola.position.x, bz: bola.position.z }),
    parar() { if (modo === "planejar") m.planejar(false); ativo = false; modo = "espera"; agenda.length = 0; anim = null; mirando = false; controls.enabled = true; grupoMira.visible = false; vel.set(0, 0); bola.position.set(0, 0.19, 0); },
  };
}
