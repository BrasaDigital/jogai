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

export function criarJogador({ camisa, listras, calcao, meiao, pele = "#f0d6c0", cabelo = "#1d1410", goleiro = false, luva = "#f08a24" }) {
  const g = new THREE.Group(), V = (x, y, z) => new THREE.Vector3(x, y, z);
  const mPele = mat(pele, 0.6), mCalcao = mat(calcao, 0.75), mMeia = mat(meiao, 0.8), mBota = mat("#15151a", 0.4), mBranco = mat("#f4f4f4", 0.4);
  const mCamisa = listras ? mat("#ffffff", 0.7, { map: texturaCamisaListrada(listras[0], listras[1]) }) : mat(camisa, 0.7);
  const corManga = mat(camisa || listras[0], 0.7);
  // membro cônico entre dois pontos, com juntas arredondadas
  const membro = (dono, A, B, rA, rB, m, juntas = true) => {
    const d = B.clone().sub(A), l = d.length();
    const s = sombra(new THREE.Mesh(new THREE.CylinderGeometry(rB, rA, l, 12), m));
    s.position.copy(A).add(B).multiplyScalar(0.5); s.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); dono.add(s);
    if (juntas) for (const [P, r] of [[A, rA], [B, rB]]) { const j = sombra(new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), m)); j.position.copy(P); dono.add(j); }
  };
  const bota = (dono, P) => { const s = sombra(new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.07, 4, 10), mBota)); s.rotation.x = Math.PI / 2; s.scale.set(1, 1, 0.8); s.position.set(P.x, P.y - 0.03, P.z + 0.04); dono.add(s); };

  // base retangular fina (como a plaquinha do Gulliver)
  const forma = new THREE.Shape(), bw = 0.15, z0 = -0.105, z1 = 0.105, rr = 0.05;
  forma.moveTo(-bw + rr, z0); forma.lineTo(bw - rr, z0); forma.quadraticCurveTo(bw, z0, bw, z0 + rr); forma.lineTo(bw, z1 - rr); forma.quadraticCurveTo(bw, z1, bw - rr, z1);
  forma.lineTo(-bw + rr, z1); forma.quadraticCurveTo(-bw, z1, -bw, z1 - rr); forma.lineTo(-bw, z0 + rr); forma.quadraticCurveTo(-bw, z0, -bw + rr, z0);
  const base = sombra(new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: 0.03, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 }), mBranco));
  base.rotation.x = Math.PI / 2; base.position.y = 0.03; g.add(base);

  const hip = 0.36;
  // perna de apoio (esquerda): joelho dobrado à frente
  const apoio = goleiro ? [V(-0.075, 0.2, 0.0), V(-0.085, 0.085, 0.0)] : [V(-0.07, 0.2, -0.025), V(-0.07, 0.085, -0.04)];   // apoio: quase reta, de pé
  const H = V(-0.07, hip, 0);
  const Hm = H.clone().lerp(apoio[0], 0.5);
  membro(g, Hm, apoio[0], 0.048, 0.042, mPele);
  membro(g, H, Hm, 0.062, 0.058, mCalcao);
  membro(g, apoio[0], apoio[1], 0.042, 0.036, mMeia);
  bota(g, apoio[1]);

  // perna de chute (direita): pivô no quadril, com a alavanca atrás (userData.perna gira no eixo X)
  const perna = new THREE.Group(); perna.position.set(0.07, hip, 0); g.add(perna);
  const joelho = goleiro ? V(0, -0.15, 0.0) : V(0, -0.14, 0.12), tornozelo = goleiro ? V(0, -0.275, 0.0) : V(0, -0.265, 0.14);
  const jm = joelho.clone().multiplyScalar(0.5);
  membro(perna, jm, joelho, 0.048, 0.042, mPele);
  membro(perna, V(0, 0, 0), jm, 0.062, 0.058, mCalcao);
  membro(perna, joelho, tornozelo, 0.042, 0.036, mMeia);
  bota(perna, tornozelo);
  // alavanca no quadril: sai de trás da coxa; apertar a ponta para baixo faz o pé avançar (rotation.x negativa)
  const mAlav = mat("#e8e8ee", 0.45);
  const p0 = V(0, 0.005, -0.03), p1 = V(0, 0.02, -0.25);
  membro(perna, p0, p1, 0.016, 0.016, mAlav, false);
  const aba = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.014, 16), mAlav)); aba.position.copy(p1); aba.rotation.x = Math.PI / 2 - 0.1; perna.add(aba);
  g.userData.perna = perna;

  // quadril e tronco levemente inclinado para frente
  const pelve = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.1, 18), mCalcao)); pelve.position.y = hip + 0.01; pelve.scale.z = 0.75; g.add(pelve);
  const tronco = new THREE.Group(); tronco.position.set(0, hip + 0.04, 0); tronco.rotation.x = goleiro ? 0.05 : 0.17; g.add(tronco);
  const peito = sombra(new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.15, 6, 16), mCamisa)); peito.position.y = 0.14; peito.scale.set(1.05, 1, 0.72); tronco.add(peito);

  // braços dobrados, em posição de corrida (goleiro: abertos e para cima, com luvas)
  const ombroY = 0.22;
  for (const s of [-1, 1]) {
    const O = V(s * 0.135, ombroY, 0);
    let E, M;
    if (goleiro) { E = V(s * 0.24, ombroY + 0.05, 0.03); M = V(s * 0.29, ombroY + 0.15, 0.06); }
    else if (s < 0) { E = V(s * 0.15, ombroY - 0.1, 0.04); M = V(s * 0.12, ombroY - 0.04, 0.14); }      // esquerdo à frente (oposto à perna que chuta)
    else { E = V(s * 0.15, ombroY - 0.1, -0.07); M = V(s * 0.14, ombroY - 0.2, -0.1); }               // esquerdo atrás, mão junto ao quadril
    membro(tronco, O, E, 0.038, 0.032, corManga);
    membro(tronco, E, M, 0.03, 0.026, goleiro ? mat(camisa, 0.7) : mPele);
    const mao = sombra(new THREE.Mesh(new THREE.SphereGeometry(goleiro ? 0.045 : 0.032, 12, 10), goleiro ? mat(luva, 0.6) : mPele)); mao.position.copy(M); tronco.add(mao);
  }
  // pescoço, cabeça, cabelo e rosto
  membro(tronco, V(0, 0.27, 0), V(0, 0.33, 0.01), 0.03, 0.03, mPele, false);
  const cabeca = new THREE.Group(); cabeca.position.set(0, 0.4, 0.015); tronco.add(cabeca);
  const crânio = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 16), mPele)); crânio.scale.set(0.94, 1.06, 1); cabeca.add(crânio);
  const cab = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.079, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), mat(cabelo, 0.9))); cab.rotation.x = -0.35; cab.position.set(0, 0.008, -0.006); cabeca.add(cab);
  const nuca = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 10, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.4), mat(cabelo, 0.9))); nuca.position.set(0, -0.005, -0.012); cabeca.add(nuca);
  for (const s of [-1, 1]) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), mat("#1a1a1a", 0.3)); o.position.set(s * 0.028, 0.004, 0.07); cabeca.add(o); }
  const nariz = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), mPele)); nariz.position.set(0, -0.012, 0.076); cabeca.add(nariz);
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

// raio da área de cada jogador (círculo de atuação planejado)
export const RAIO_AREA = 1.1;

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
  sol.shadow.mapSize.set(2048, 2048); Object.assign(sol.shadow.camera, { left: -15, right: 15, top: 12, bottom: -12, near: 1, far: 40 }); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.03; scene.add(sol);

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
    j.userData.alvo = new THREE.Vector3(); j.userData.plano = new THREE.Vector3(); scene.add(j); times[t].push(j);
  }
  let meu = "A"; const outro = () => (meu === "A" ? "B" : "A");
  const org = { ativo: false, arrasto: null, soPlano: false };
  const estado = { A: "4-3-3", B: "4-4-2" };
  function formar(t, nome, instantaneo = false) {
    estado[t] = nome;
    const lado = t === "A" ? -1 : 1;
    FORMACOES[nome].forEach(([u, v], i) => {
      const x = lado * (CAMPO.c / 2 - u * CAMPO.c);
      times[t][i].userData.alvo.set(x, 0.05, v * (CAMPO.l / 2 - 0.45) * (t === "A" ? 1 : -1));
      if (t === meu && org.ativo) times[t][i].userData.plano.copy(times[t][i].userData.alvo);
      if (instantaneo) times[t][i].position.copy(times[t][i].userData.alvo);
    });
  }
  formar("A", estado.A, true); formar("B", estado.B, true);

  // ---------- planejamento do time (posição + área de cada jogador, no campo todo) ----------
  const aneis = times.A.map(() => {
    const g = new THREE.Group(); g.position.y = 0.034;
    const disco = new THREE.Mesh(new THREE.CircleGeometry(RAIO_AREA, 48), new THREE.MeshBasicMaterial({ color: "#ffd23f", transparent: true, opacity: 0.14, depthWrite: false }));
    const borda = new THREE.Mesh(new THREE.RingGeometry(RAIO_AREA - 0.045, RAIO_AREA, 64), new THREE.MeshBasicMaterial({ color: "#ffd23f", transparent: true, opacity: 0.85, depthWrite: false }));
    disco.rotation.x = borda.rotation.x = -Math.PI / 2; g.add(disco, borda); g.visible = false; scene.add(g); g.userData.mats = [disco.material, borda.material]; return g;
  });
  const raio = new THREE.Raycaster(), plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.05), ptr = new THREE.Vector2(), tmp = new THREE.Vector3();
  const rayDe = (ev) => {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); raio.setFromCamera(ptr, camera);
  };
  const noMesa = (ev) => { rayDe(ev); return raio.ray.intersectPlane(plano, tmp) ? tmp.clone() : null; };
  const jogadorSob = (ev) => {
    rayDe(ev); const hit = raio.intersectObjects(times[meu], true)[0]; if (!hit) return -1;
    let o = hit.object; while (o && !times[meu].includes(o)) o = o.parent; return o ? times[meu].indexOf(o) : -1;
  };
  function limitar(i, x, z) {
    const gk = i === 0, ld = meu === "A" ? -1 : 1, g0 = ld * (CAMPO.c / 2 - 0.015 * CAMPO.c), g1 = ld * (CAMPO.c / 2 - 0.08 * CAMPO.c);
    const xmin = gk ? Math.min(g0, g1) : -CAMPO.c / 2 + 0.45, xmax = gk ? Math.max(g0, g1) : CAMPO.c / 2 - 0.45;
    const zm = gk ? 1.25 : CAMPO.l / 2 - 0.45, cl = () => { x = Math.min(xmax, Math.max(xmin, x)); z = Math.min(zm, Math.max(-zm, z)); };
    cl();
    for (let k = 0; k < 3; k++) { for (let n = 0; n < 11; n++) {            // mantém distância dos colegas
      if (n === i) continue; const o = times[meu][n].userData.plano, dx = x - o.x, dz = z - o.z, d = Math.hypot(dx, dz), min = 0.85;
      if (d < min) { x = o.x + (d > 1e-4 ? (dx / d) * min : min); z = o.z + (d > 1e-4 ? (dz / d) * min : 0); }
      cl();
    } }
    return [x, z];
  }
  const el = renderer.domElement;
  el.addEventListener("pointerdown", (ev) => {
    if (!org.ativo) return; const p = noMesa(ev); if (!p) return;
    let i = -1;
    if (org.soPlano) { let md = 0.8; times[meu].forEach((jj, n) => { const d = Math.hypot(jj.userData.plano.x - p.x, jj.userData.plano.z - p.z); if (d < md) { md = d; i = n; } }); }
    else i = jogadorSob(ev);
    if (i < 0) return;
    const ref = org.soPlano ? times[meu][i].userData.plano : times[meu][i].position;
    org.arrasto = { i, dx: ref.x - p.x, dz: ref.z - p.z };
    controls.enabled = false; el.setPointerCapture(ev.pointerId); el.style.cursor = "grabbing";
  }, true);
  el.addEventListener("pointermove", (ev) => {
    if (!org.ativo) return;
    if (!org.arrasto) { el.style.cursor = jogadorSob(ev) >= 0 ? "grab" : ""; return; }
    const p = noMesa(ev); if (!p) return; const { i, dx, dz } = org.arrasto;
    const [x, z] = limitar(i, p.x + dx, p.z + dz); const j = times[meu][i];
    if (org.soPlano) { j.userData.plano.set(x, 0.05, z); return; }      // replanejamento: só o círculo se move
    j.userData.alvo.set(x, 0.05, z); j.userData.plano.copy(j.userData.alvo); j.position.copy(j.userData.alvo);
  });
  const soltar = () => { if (!org.arrasto) return; org.arrasto = null; controls.enabled = true; el.style.cursor = ""; };
  el.addEventListener("pointerup", soltar); el.addEventListener("pointercancel", soltar);
  // ativo = fase de planejamento (só o time A visível, no campo todo); falso = apito (posição de saída padrão; o plano fica guardado)
  // replanejamento rápido (tiro de meta): só os círculos de plano se movem, os jogadores ficam onde estão
  function planejar(ativo) {
    soltar(); org.ativo = ativo; org.soPlano = ativo; el.style.cursor = "";
    aneis.forEach((a) => { a.userData.mats[0].opacity = ativo ? 0.2 : 0.05; a.userData.mats[1].opacity = ativo ? 0.95 : 0.35; });
  }
  function organizar(ativo) {
    soltar(); org.ativo = ativo; org.soPlano = false; el.style.cursor = "";
    if (ativo) {
      formar("B", estado.B, true); formar("A", estado.A, true);
      times[meu].forEach((j) => { j.visible = true; }); times[outro()].forEach((j) => (j.visible = false)); times[meu].forEach((j) => j.userData.plano.copy(j.userData.alvo));
    } else {
      for (const t2 of ["A", "B"]) times[t2].forEach((j) => { j.visible = true; }); formar(outro(), estado[outro()], true); formar(meu, estado[meu]);   // o meu time desliza do plano para a saída
    }
    aneis.forEach((a) => { a.visible = true; a.userData.mats[0].opacity = ativo ? 0.14 : 0.05; a.userData.mats[1].opacity = ativo ? 0.85 : 0.35; });
  }

  // câmera
  let anim = null;
  function irPara(nome, instantaneo = false) {
    const c = CAMERAS[nome]; if (!c) return; const s = meu === "B" ? -1 : 1;     // quem joga de azul vê o campo girado (seu gol à esquerda)
    const destino = { pos: new THREE.Vector3(c.pos[0] * s, c.pos[1], c.pos[2] * s), alvo: new THREE.Vector3(c.alvo[0] * s, c.alvo[1], c.alvo[2] * s) };
    if (instantaneo) { camera.position.copy(destino.pos); controls.target.copy(destino.alvo); controls.update(); return; }
    anim = { t: 0, de: { pos: camera.position.clone(), alvo: controls.target.clone() }, para: destino };
  }
  function definirMeu(t) { meu = t; irPara("angulo", true); }
  irPara("angulo", true);

  function ajustar() {
    const w = container.clientWidth, h = container.clientHeight || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(ajustar).observe(container); ajustar();

  const ganchos = [];
  const relogio = new THREE.Clock();
  function loop() {
    const dt = Math.min(0.05, relogio.getDelta()), t = relogio.elapsedTime;
    if (anim) {
      anim.t = Math.min(1, anim.t + dt / 0.9); const k = 1 - Math.pow(1 - anim.t, 3);
      camera.position.lerpVectors(anim.de.pos, anim.para.pos, k); controls.target.lerpVectors(anim.de.alvo, anim.para.alvo, k);
      if (anim.t >= 1) anim = null;
    }
    for (const t2 of ["A", "B"]) for (const j of times[t2]) j.position.lerp(j.userData.alvo, 1 - Math.pow(0.001, dt));
    aneis.forEach((a, i) => a.position.set(times[meu][i].userData.plano.x, 0.034, times[meu][i].userData.plano.z));
    bandeiraA.userData.onda(t); bandeiraB.userData.onda(t + 1.3);
    ganchos.forEach((f) => f(dt, t));
    controls.update(); renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();
  return { scene, camera, controls, renderer, times, bola, formar, irPara, estado, organizar, planejar, definirMeu, meuTime: () => meu, limitar, noMesa, aoQuadro: (f) => ganchos.push(f) };
}
