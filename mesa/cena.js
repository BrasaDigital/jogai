// Futebol de Mesa 3D — protótipo do campo (mesa, feltro, traves, bola e jogadores).
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export const CAMPO = { c: 13.5, l: 8.6 }; // comprimento (x) e largura (z) do campo
const PPU = 170;                        // pixels por unidade na textura do feltro
const MAT = { c: 14.8, l: 9.8 };          // tamanho do tapete de feltro
// medidas das marcações (em unidades da mesa), pensadas para o tamanho dos jogadores e dos gols
const M = { circulo: 1.3, areaP: 2.2, areaPm: 3.1, areaG: 1.0, areaGm: 1.95, penal: 1.6 };

const tex = (canvas, repeat) => {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
};
const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };

// ---------- texturas ----------
function texturaFeltro() {
  const W = MAT.c * PPU, H = MAT.l * PPU, c = canvas(W, H), g = c.getContext("2d");
  const px = (x) => (x + MAT.c / 2) * PPU, py = (z) => (z + MAT.l / 2) * PPU;
  g.fillStyle = "#2b8f46"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < CAMPO.c; i += 2) { g.fillStyle = "rgba(255,255,255,0.05)"; g.fillRect(px(-CAMPO.c / 2 + i), py(-CAMPO.l / 2), Math.min(1, CAMPO.c - i) * PPU, CAMPO.l * PPU); }
  for (let i = 0; i < 60000; i++) { g.fillStyle = Math.random() < 0.5 ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)"; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
  g.strokeStyle = "rgba(255,255,255,0.92)"; g.fillStyle = "rgba(255,255,255,0.92)"; g.lineWidth = 0.035 * PPU; g.lineCap = "round";
  const line = (x1, z1, x2, z2) => { g.beginPath(); g.moveTo(px(x1), py(z1)); g.lineTo(px(x2), py(z2)); g.stroke(); };
  const arc = (x, z, r, a0, a1) => { g.beginPath(); g.arc(px(x), py(z), r * PPU, a0, a1); g.stroke(); };
  const hx = CAMPO.c / 2, hz = CAMPO.l / 2;
  g.strokeRect(px(-hx), py(-hz), CAMPO.c * PPU, CAMPO.l * PPU);
  line(0, -hz, 0, hz);
  arc(0, 0, M.circulo, 0, Math.PI * 2);
  g.beginPath(); g.arc(px(0), py(0), 0.04 * PPU, 0, Math.PI * 2); g.fill();
  for (const s of [-1, 1]) {
    const pa = M.areaP, paw = M.areaPm, ga = M.areaG, gaw = M.areaGm, spot = M.penal, r = M.circulo;
    const gx = s * hx;
    g.strokeRect(px(s < 0 ? gx : gx - pa), py(-paw), pa * PPU, paw * 2 * PPU);
    g.strokeRect(px(s < 0 ? gx : gx - ga), py(-gaw), ga * PPU, gaw * 2 * PPU);
    g.beginPath(); g.arc(px(gx - s * spot), py(0), 0.04 * PPU, 0, Math.PI * 2); g.fill();
    const ang = Math.acos((pa - spot) / r);
    if (s < 0) arc(gx + spot, 0, r, -ang, ang); else arc(gx - spot, 0, r, Math.PI - ang, Math.PI + ang);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const a0 = sx < 0 ? (sz < 0 ? 0 : -Math.PI / 2) : (sz < 0 ? Math.PI / 2 : Math.PI);
    arc(sx * hx, sz * hz, 0.18, a0, a0 + Math.PI / 2);
  }
  return tex(c);
}
function texturaMadeira() {
  const c = canvas(1024, 1024), g = c.getContext("2d");
  g.fillStyle = "#9a6a3c"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 220; i++) { g.strokeStyle = `rgba(60,30,10,${0.04 + Math.random() * 0.1})`; g.lineWidth = 1 + Math.random() * 3; const y = Math.random() * 1024; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(300, y + Math.random() * 14 - 7, 700, y + Math.random() * 14 - 7, 1024, y); g.stroke(); }
  return tex(c, [2, 2]);
}
function texturaRede(rep) {
  const c = canvas(64, 64), g = c.getContext("2d");
  g.strokeStyle = "rgba(255,255,255,0.75)"; g.lineWidth = 3; g.strokeRect(0, 0, 64, 64);
  const t = tex(c, rep); return t;
}
function texturaBola() {
  const c = canvas(512, 256), g = c.getContext("2d");
  g.fillStyle = "#2f6fe0"; g.fillRect(0, 0, 512, 256);
  g.fillStyle = "#ffffff";
  for (let i = 0; i < 14; i++) { g.beginPath(); const x = (i % 7) * 76 + (i < 7 ? 20 : 58), y = i < 7 ? 70 : 180; for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 - Math.PI / 2; g.lineTo(x + Math.cos(a) * 26, y + Math.sin(a) * 26); } g.fill(); }
  return tex(c);
}
function texturaBandeira(tipo) {
  const c = canvas(300, 200), g = c.getContext("2d");
  if (tipo === "br") {
    g.fillStyle = "#17a04a"; g.fillRect(0, 0, 300, 200);
    g.fillStyle = "#ffdf00"; g.beginPath(); g.moveTo(150, 18); g.lineTo(282, 100); g.lineTo(150, 182); g.lineTo(18, 100); g.closePath(); g.fill();
    g.fillStyle = "#1d3f9e"; g.beginPath(); g.arc(150, 100, 44, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#fff"; g.lineWidth = 7; g.beginPath(); g.arc(150, 150, 78, Math.PI * 1.22, Math.PI * 1.78); g.stroke();
  } else {
    g.fillStyle = "#74acdf"; g.fillRect(0, 0, 300, 200);
    g.fillStyle = "#fff"; g.fillRect(0, 67, 300, 66);
    g.fillStyle = "#f6b40e"; g.beginPath(); g.arc(150, 100, 16, 0, Math.PI * 2); g.fill();
  }
  return tex(c);
}
function texturaCamisaListrada(a, b) {
  const c = canvas(64, 64), g = c.getContext("2d");
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * 8, 0, 8, 64); }
  const t = tex(c); return t;
}

// ---------- peças ----------
const mat = (cor, rough = 0.7, extra = {}) => new THREE.MeshStandardMaterial({ color: cor, roughness: rough, metalness: 0, ...extra });
const sombra = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };

export function criarJogador({ camisa, listras, calcao, meiao, pele = "#e3b08a", cabelo = "#2a1b12", goleiro = false }) {
  const g = new THREE.Group();
  const base = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.21, 0.05, 28), mat("#f4f4f4", 0.4)));
  base.position.y = 0.025; g.add(base);
  const pernaGeo = new THREE.CylinderGeometry(0.042, 0.04, 0.1, 10);
  for (const s of [-1, 1]) {
    const meia = sombra(new THREE.Mesh(pernaGeo, mat(meiao))); meia.position.set(s * 0.055, 0.1, 0); g.add(meia);
    const coxa = sombra(new THREE.Mesh(pernaGeo, mat(pele))); coxa.position.set(s * 0.055, 0.2, 0); g.add(coxa);
  }
  const shorts = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.115, 0.13, 16), mat(calcao))); shorts.position.y = 0.32; g.add(shorts);
  const matCamisa = listras ? mat("#ffffff", 0.7, { map: texturaCamisaListrada(listras[0], listras[1]) }) : mat(camisa);
  const torso = sombra(new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.14, 6, 14), matCamisa)); torso.position.y = 0.5; torso.scale.z = 0.72; g.add(torso);
  for (const s of [-1, 1]) {
    const braco = new THREE.Group(); braco.position.set(s * 0.15, 0.58, 0);
    const manga = sombra(new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.1, 4, 8), mat(camisa || listras[0]))); manga.position.y = -0.07; braco.add(manga);
    braco.rotation.z = goleiro ? s * -2.5 : s * 0.5; g.add(braco);
  }
  const cabeca = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.083, 18, 14), mat(pele))); cabeca.position.y = 0.73; g.add(cabeca);
  const cab = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.088, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(cabelo, 0.9))); cab.position.y = 0.735; cab.rotation.x = -0.25; g.add(cab);
  return g;
}

function criarGol(lado) {
  const g = new THREE.Group();
  const w = 3.3, h = 1.05, d = 0.85, hb = 0.66, r = 0.03, hw = w / 2, branco = mat("#ffffff", 0.35);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  // tubo entre dois pontos
  const barra = (A, B) => {
    const dir = B.clone().sub(A), len = dir.length();
    const m = sombra(new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), branco));
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize()); g.add(m);
  };
  const junta = (P) => { const m = sombra(new THREE.Mesh(new THREE.SphereGeometry(r * 1.02, 10, 8), branco)); m.position.copy(P); g.add(m); };
  // pontos da estrutura (x = profundidade, y = altura, z = largura)
  const fe = [V(0, 0, -hw), V(0, h, -hw)], fd = [V(0, 0, hw), V(0, h, hw)];
  const te = [V(d, 0, -hw), V(d, hb, -hw)], td = [V(d, 0, hw), V(d, hb, hw)];
  barra(fe[0], fe[1]); barra(fd[0], fd[1]); barra(fe[1], fd[1]);          // frente: 2 postes + travessão
  barra(te[0], te[1]); barra(td[0], td[1]); barra(te[1], td[1]);          // fundo: 2 postes + barra superior
  barra(fe[1], te[1]); barra(fd[1], td[1]);                               // travas superiores inclinadas
  barra(te[0], td[0]);                                                    // barra do chão no fundo
  barra(fe[0], te[0]); barra(fd[0], td[0]);                               // barras do chão laterais
  [fe[1], fd[1], te[1], td[1], fe[0], fd[0], te[0], td[0]].forEach(junta);
  // redes: quadriláteros com UV, malha de ~0,11 de lado
  const rede = (A, B, C, D) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute([...A, ...B, ...C, ...A, ...C, ...D].flatMap(v => Array.isArray(v) ? v : [v]), 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2));
    const largura = new THREE.Vector3(...B).distanceTo(new THREE.Vector3(...A)), altura = new THREE.Vector3(...D).distanceTo(new THREE.Vector3(...A));
    const mt = new THREE.MeshBasicMaterial({ map: texturaRede([Math.round(largura / 0.11), Math.round(altura / 0.11)]), transparent: true, side: THREE.DoubleSide, depthWrite: false });
    g.add(new THREE.Mesh(geo, mt));
  };
  const P = (v) => [v.x, v.y, v.z];
  rede(P(te[0]), P(td[0]), P(td[1]), P(te[1]));                           // fundo
  rede(P(fe[1]), P(fd[1]), P(td[1]), P(te[1]));                           // teto
  rede(P(fe[0]), P(te[0]), P(te[1]), P(fe[1]));                           // lateral esquerda (trapézio)
  rede(P(fd[0]), P(td[0]), P(td[1]), P(fd[1]));                           // lateral direita
  g.position.x = lado * (CAMPO.c / 2); if (lado < 0) g.rotation.y = Math.PI; // abre para fora do campo
  g.position.y = 0.02;
  return g;
}

function criarBandeira(tipo, x) {
  const g = new THREE.Group();
  const mastro = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.7, 8), mat("#dddddd", 0.3))); mastro.position.y = 0.85; g.add(mastro);
  const geo = new THREE.PlaneGeometry(0.95, 0.63, 14, 8); const base = geo.attributes.position.array.slice();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: texturaBandeira(tipo), side: THREE.DoubleSide, roughness: 0.9 }));
  m.position.set(0.475 * (x < 0 ? -1 : 1) * -1, 1.35, 0); m.castShadow = true; g.add(m);
  g.userData.onda = (t) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const bx = base[i * 3]; p.setZ(i, Math.sin(bx * 7 + t * 3) * 0.05 * ((bx + 0.475) / 0.95)); }
    p.needsUpdate = true; geo.computeVertexNormals();
  };
  g.position.set(x, 0, 0);
  return g;
}

// ---------- formações (posição 0..1 no próprio campo, v de -1 a 1) ----------
export const FORMACOES = {
  "4-3-3": [[0.03, 0], [0.15, -0.75], [0.15, -0.25], [0.15, 0.25], [0.15, 0.75], [0.3, -0.5], [0.3, 0], [0.3, 0.5], [0.44, -0.6], [0.455, 0], [0.44, 0.6]],
  "4-4-2": [[0.03, 0], [0.15, -0.75], [0.15, -0.25], [0.15, 0.25], [0.15, 0.75], [0.3, -0.8], [0.3, -0.27], [0.3, 0.27], [0.3, 0.8], [0.44, -0.3], [0.44, 0.3]],
  "3-5-2": [[0.03, 0], [0.15, -0.55], [0.15, 0], [0.15, 0.55], [0.3, -0.85], [0.3, -0.45], [0.3, 0], [0.3, 0.45], [0.3, 0.85], [0.44, -0.3], [0.44, 0.3]],
};

export const CAMERAS = {
  angulo: { pos: [0, 8.6, 14.4], alvo: [0, 0.2, 0] },
  jogador: { pos: [-11.8, 3.0, 7.2], alvo: [0.5, 0.2, 0] },
  topo: { pos: [0, 19, 0.01], alvo: [0, 0, 0] },
  lateral: { pos: [0, 3.4, 14.6], alvo: [0, 0.4, 0] },
};

export function iniciar(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene(); scene.background = new THREE.Color("#0d0b1e");
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 4; controls.maxDistance = 26; controls.maxPolarAngle = 1.48;

  scene.add(new THREE.HemisphereLight("#ffffff", "#3b3358", 0.75));
  const sol = new THREE.DirectionalLight("#fff0dc", 2.1); sol.position.set(-6, 12, 7); sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048); Object.assign(sol.shadow.camera, { left: -15, right: 15, top: 12, bottom: -12, near: 1, far: 40 }); sol.shadow.bias = -0.0004; scene.add(sol);

  // mesa, feltro e chão
  const mesa = sombra(new THREE.Mesh(new THREE.BoxGeometry(16.8, 0.5, 11.6), mat("#ffffff", 0.6, { map: texturaMadeira() }))); mesa.position.y = -0.27; scene.add(mesa);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 0.5), mat("#6e4524", 0.7))); p.position.set(sx * 7.8, -1.6, sz * 5.1); scene.add(p); }
  const feltro = new THREE.Mesh(new THREE.BoxGeometry(MAT.c, 0.03, MAT.l), [mat("#256f39"), mat("#256f39"), new THREE.MeshStandardMaterial({ map: texturaFeltro(), roughness: 1 }), mat("#256f39"), mat("#256f39"), mat("#256f39")]);
  feltro.position.y = 0.015; feltro.receiveShadow = true; scene.add(feltro);
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mat("#1a1633", 1)); chao.rotation.x = -Math.PI / 2; chao.position.y = -2.7; chao.receiveShadow = true; scene.add(chao);

  scene.add(criarGol(-1), criarGol(1));
  const bandeiraA = criarBandeira("br", -8.0), bandeiraB = criarBandeira("ar", 8.0);
  bandeiraA.position.z = -5.4; bandeiraB.position.z = -5.4; scene.add(bandeiraA, bandeiraB);

  const bola = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 18), mat("#ffffff", 0.45, { map: texturaBola() }))); bola.position.set(0, 0.19, 0); scene.add(bola);

  // times
  const kits = {
    A: { camisa: "#ffd800", calcao: "#1d3f9e", meiao: "#ffffff", cabelo: "#241812", pele: "#d9a37a" },
    B: { listras: ["#74acdf", "#ffffff"], camisa: "#74acdf", calcao: "#1b2a5c", meiao: "#ffffff", cabelo: "#3a2a1c", pele: "#e8b896" },
  };
  const gk = { A: { camisa: "#27b34b", calcao: "#111111", meiao: "#111111", goleiro: true }, B: { camisa: "#f27a1a", calcao: "#111111", meiao: "#111111", goleiro: true } };
  const times = { A: [], B: [] };
  for (const t of ["A", "B"]) for (let i = 0; i < 11; i++) {
    const j = criarJogador(i === 0 ? { ...kits[t], ...gk[t] } : kits[t]);
    j.rotation.y = t === "A" ? Math.PI / 2 : -Math.PI / 2; j.scale.setScalar(1.2);
    j.userData.alvo = new THREE.Vector3(); scene.add(j); times[t].push(j);
  }
  const estado = { A: "4-3-3", B: "4-4-2" };
  function formar(t, nome, instantaneo = false) {
    estado[t] = nome;
    const lado = t === "A" ? -1 : 1;
    FORMACOES[nome].forEach(([u, v], i) => {
      const x = lado * (CAMPO.c / 2 - u * CAMPO.c);
      times[t][i].userData.alvo.set(x, 0.05, v * (CAMPO.l / 2 - 0.45) * (t === "A" ? 1 : -1));
      if (instantaneo) times[t][i].position.copy(times[t][i].userData.alvo);
    });
  }
  formar("A", estado.A, true); formar("B", estado.B, true);

  // câmera
  let anim = null;
  function irPara(nome, instantaneo = false) {
    const c = CAMERAS[nome]; if (!c) return;
    const destino = { pos: new THREE.Vector3(...c.pos), alvo: new THREE.Vector3(...c.alvo) };
    if (instantaneo) { camera.position.copy(destino.pos); controls.target.copy(destino.alvo); controls.update(); return; }
    anim = { t: 0, de: { pos: camera.position.clone(), alvo: controls.target.clone() }, para: destino };
  }
  irPara("angulo", true);

  function ajustar() {
    const w = container.clientWidth, h = container.clientHeight || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(ajustar).observe(container); ajustar();

  const relogio = new THREE.Clock();
  function loop() {
    const dt = Math.min(0.05, relogio.getDelta()), t = relogio.elapsedTime;
    if (anim) {
      anim.t = Math.min(1, anim.t + dt / 0.9); const k = 1 - Math.pow(1 - anim.t, 3);
      camera.position.lerpVectors(anim.de.pos, anim.para.pos, k); controls.target.lerpVectors(anim.de.alvo, anim.para.alvo, k);
      if (anim.t >= 1) anim = null;
    }
    for (const t2 of ["A", "B"]) for (const j of times[t2]) j.position.lerp(j.userData.alvo, 1 - Math.pow(0.001, dt));
    bandeiraA.userData.onda(t); bandeiraB.userData.onda(t + 1.3);
    controls.update(); renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();
  return { scene, camera, controls, renderer, times, bola, formar, irPara, estado };
}
