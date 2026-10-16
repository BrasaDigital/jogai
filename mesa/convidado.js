// Lado do convidado (time azul) numa partida online: só desenha o estado recebido do anfitrião e envia mira/chute.
import * as THREE from "three";
import { criarMira, VMAX, VMIN } from "/mesa/mira.js";
import { renderFrase } from "/mesa/jogo.js";

export function criarConvidado(m, ui, canal) {
  const { controls, renderer, times, bola, scene } = m, el = renderer.domElement, eu = "B";
  const miraVis = criarMira(scene), alvoBola = new THREE.Vector3(0, 0.19, 0);
  let snap = null, mirando = false, bloqueou = false, pend = null, ultMira = 0, mira = { dx: 1, dz: 0, v: 0, ok: false };

  function aplicar(s) {
    snap = s;
    for (const t of ["A", "B"]) s[t].forEach(([x, z, r], i) => { const j = times[t][i]; j.userData.alvo.set(x, 0.05, z); j.rotation.y = r; });
    alvoBola.set(s.bx, 0.19, s.bz);
    for (const t of ["A", "B"]) for (const j of times[t]) if (j.userData.perna.rotation.x !== 0) j.userData.perna.rotation.x = 0;
    if (s.perna) times[s.perna[0]][s.perna[1]].userData.perna.rotation.x = s.perna[2];
    if (s.mira && s.vez !== eu) miraVis.mostrar(s.bx, s.bz, s.mira[0], s.mira[1], s.mira[2]); else if (!mirando) miraVis.esconder();
    if (pend && !(s.modo === "mirar" && s.vez === eu)) pend = null;
    ui.fase(renderFrase(s.txt, eu, false));
  }
  m.aoQuadro((dt, t) => {
    const antes = bola.position.clone(); bola.position.lerp(alvoBola, Math.min(1, dt * 14));
    const dx = bola.position.x - antes.x, dz = bola.position.z - antes.z, d = Math.hypot(dx, dz);
    if (d > 1e-5) bola.rotateOnWorldAxis(new THREE.Vector3(dz, 0, -dx).normalize(), d / 0.16);
    if (pend && t - pend.t > 0.45 && pend.n < 6) { pend.t = t; pend.n++; canal.enviar("chute", pend.d); }     // reenvia até o anfitrião confirmar
  });

  const minhaVez = () => snap && snap.f === "jogo" && snap.vez === eu && (snap.modo === "mirar" || snap.modo === "anda");
  function atualizar(ev) {
    const p = m.noMesa(ev); if (!p) return; const vx = bola.position.x - p.x, vz = bola.position.z - p.z, d = Math.hypot(vx, vz);
    if (d < 0.35) { mira.ok = false; miraVis.esconder(); return; }
    mira = { dx: vx / d, dz: vz / d, v: Math.min(VMAX, Math.max(VMIN, d * 2.6)), ok: true };
    miraVis.mostrar(bola.position.x, bola.position.z, mira.dx, mira.dz, mira.v);
    const agora = performance.now(); if (agora - ultMira > 70) { ultMira = agora; canal.enviar("mira", { dx: mira.dx, dz: mira.dz, v: mira.v }); }
  }
  el.addEventListener("pointerdown", (ev) => {
    if (!minhaVez()) return; const p = m.noMesa(ev); if (p && Math.hypot(p.x - bola.position.x, p.z - bola.position.z) > 4.5) return;
    bloqueou = true; controls.enabled = false; el.setPointerCapture(ev.pointerId); ev.stopImmediatePropagation();
    if (snap.modo === "mirar") { mirando = true; atualizar(ev); }
  }, true);
  el.addEventListener("pointermove", (ev) => { if (mirando) atualizar(ev); });
  const soltou = () => {
    if (!bloqueou) return; bloqueou = false; controls.enabled = true;
    if (mirando) {
      mirando = false;
      if (mira.ok && snap && snap.modo === "mirar" && snap.vez === eu) { const d = { dx: mira.dx, dz: mira.dz, v: mira.v }; canal.enviar("chute", d); pend = { d, t: performance.now() / 1000, n: 0 }; }
      miraVis.esconder();
    }
  };
  el.addEventListener("pointerup", soltou); el.addEventListener("pointercancel", soltou);

  return { aplicar, parar() { miraVis.esconder(); controls.enabled = true; pend = null; snap = null; } };
}
