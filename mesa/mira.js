// Tracejado de mira (seta) no feltro: usado pelo jogo local e pelo convidado online.
import * as THREE from "three";
import { CAMPO } from "/mesa/cena.js";

export const ATRITO = 2.6, VMAX = 9.5, VMIN = 1.5, RBOLA = 0.16, GOL_L = 3.3;

export function criarMira(scene) {
  const xl = CAMPO.c / 2, zl = CAMPO.l / 2;
  const grupo = new THREE.Group(); grupo.visible = false; scene.add(grupo);
  const mat = new THREE.MeshBasicMaterial({ color: "#ffd23f", transparent: true, opacity: 0.9, depthWrite: false });
  const tracos = [];
  for (let i = 0; i < 70; i++) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.18), mat); d.rotation.x = -Math.PI / 2; d.position.y = 0.045; grupo.add(d); tracos.push(d); }
  const seta = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 3), mat); seta.rotation.x = Math.PI / 2; seta.position.y = 0.05; grupo.add(seta);
  return {
    mostrar(bx, bz, dx, dz, v) {
      let len = (v * v) / (2 * ATRITO);
      for (const [c, p, d, lim] of [["x", bx, dx, xl - RBOLA], ["z", bz, dz, zl - RBOLA]]) {   // corta no limite do campo
        if (Math.abs(d) < 1e-4) continue; const alvo = d > 0 ? lim : -lim, tc = (alvo - p) / d;
        if (tc > 0 && tc < len) { if (c === "x") { const zh = bz + dz * tc; if (Math.abs(zh) < GOL_L / 2 - 0.1) continue; } len = tc; }
      }
      len = Math.max(0.3, len); const n = Math.min(tracos.length, Math.floor(len / 0.28));
      grupo.position.set(bx, 0, bz); grupo.rotation.y = Math.atan2(dx, dz);
      tracos.forEach((d, i) => { d.visible = i < n; d.position.z = 0.32 + i * 0.28; });
      seta.position.z = 0.32 + n * 0.28 + 0.05; mat.color.set(new THREE.Color("#ffd23f").lerp(new THREE.Color("#ff3b30"), (v - VMIN) / (VMAX - VMIN)));
      grupo.visible = true;
    },
    esconder() { grupo.visible = false; },
  };
}
