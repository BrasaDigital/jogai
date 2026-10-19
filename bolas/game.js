// Chuva de Balas — bolas passam por portais de multiplicação, viram munição e o soldado enfrenta a horda e o chefe.
(() => {
const W = 360, H = 640;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let dpr = 1;
function resize(){
  const r = cv.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
}
window.addEventListener('resize', resize); resize();

const FONT = "'Lilita One','Impact',sans-serif";
const rnd = (a,b) => a + Math.random()*(b-a);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));

// ---------- configuração (ajuste aqui o balanceamento) ----------
const CFG = {
  hordeHP: 1800, hordeRows: 5, hordePerEnemy: 22, hordeSpeed: 2.6,
  bossHP: 2600, bossSpeed: 9,
  dropRate: 9,             // bolas por segundo
  liveCap: 380,            // máximo de bolas simultâneas na tela
  gravity: 620, restitution: 0.45,
  soldierX: 38, laneFloor: 168, floorY: 540
};

// ---------- estado ----------
let S;
function newGame(){
  S = {
    mode:'play', t:0,
    disp:{x:180, tx:180, acc:0},
    balls:[], bullets:[], parts:[], rings:[], lifts:[],
    ammo:0, shotAcc:0, recoil:0, hintT:0, moved:false,
    horde:{hp:CFG.hordeHP, max:CFG.hordeHP, shift:0},
    boss:{active:false, hp:CFG.bossHP, max:CFG.bossHP, x:420, hit:0},
    flash:0, shake:0, kills:0
  };
}
newGame();

// pinos
const pegs = [];
for(let r=0;r<8;r++){
  const y = 232 + r*34, off = (r%2)*20;
  for(let x=44+off; x<=278; x+=40) pegs.push({x:x + rnd(-2,2), y});
}
// portais: cx0..cx1 = faixa de movimento do centro, per = período
const gates = [
  {id:0, label:'x2', mult:2, y:292, w:56, cx0:70,  cx1:250, per:4.2, ph:0},
  {id:1, label:'x5', mult:5, y:372, w:56, cx0:70,  cx1:250, per:5.0, ph:2.6},
  {id:2, label:'x5', mult:5, y:462, w:56, cx0:70,  cx1:250, per:3.6, ph:0.9},
  {id:3, label:'x2', mult:2, y:340, w:44, cx0:315, cx1:315, per:1, ph:0, fixed:true},
  {id:4, label:'x2', mult:2, y:380, w:44, cx0:315, cx1:315, per:1, ph:0, fixed:true},
  {id:5, label:'x2', mult:2, y:420, w:44, cx0:315, cx1:315, per:1, ph:0, fixed:true},
  {id:6, label:'x2', mult:2, y:460, w:44, cx0:315, cx1:315, per:1, ph:0, fixed:true},
];
const GATE_H = 10, CHUTE_X = 291, CHUTE_TOP = 318, CHUTE_BOT = 500;
function gateX(g, t){
  if(g.fixed) return g.cx0;
  const k = (Math.sin(t*Math.PI*2/g.per + g.ph)+1)/2;
  return g.cx0 + (g.cx1-g.cx0)*k;
}

// ---------- entrada ----------
function toLogical(e){
  const r = cv.getBoundingClientRect();
  return {x:(e.clientX-r.left)/r.width*W, y:(e.clientY-r.top)/r.height*H};
}
let dragging = false;
cv.addEventListener('pointerdown', e => {
  const p = toLogical(e);
  if(S.mode !== 'play'){
    if(S.endT > 0.6 && p.x>90 && p.x<270 && p.y>380 && p.y<440) newGame();
    return;
  }
  dragging = true; cv.setPointerCapture(e.pointerId);
  S.disp.tx = clamp(p.x, 52, 322); S.moved = true;
});
cv.addEventListener('pointermove', e => { if(dragging && S.mode==='play'){ S.disp.tx = clamp(toLogical(e).x, 52, 322); } });
const up = () => dragging = false;
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
window.addEventListener('keydown', e => {
  if(e.key==='ArrowLeft') S.disp.tx = clamp(S.disp.tx-24,52,322);
  if(e.key==='ArrowRight') S.disp.tx = clamp(S.disp.tx+24,52,322);
  if(e.key==='Enter' && S.mode!=='play') newGame();
});

// ---------- lógica ----------
function spawnBall(x,y,vx,vy,v,hit){ S.balls.push({x,y,vx,vy,v,hit:hit||0}); }
function burst(x,y,n,col,spd=90){
  for(let i=0;i<n;i++){
    const a=rnd(0,6.283), s=rnd(spd*0.3,spd);
    S.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:rnd(0.25,0.5),c:col});
  }
}
function hordeCols(){ return Math.ceil(S.horde.hp / CFG.hordePerEnemy / CFG.hordeRows); }
const COLW = 11;
function hordeLeft(){ return 346 - hordeCols()*COLW + S.horde.shift; }
function frontX(){ return S.boss.active ? S.boss.x - 34 : hordeLeft(); }

function stepBalls(dt){
  const R = 3.5;
  for(let i=S.balls.length-1;i>=0;i--){
    const b = S.balls[i];
    b.vy += CFG.gravity*dt;
    b.x += b.vx*dt; b.y += b.vy*dt;
    if(b.x < 24+R){ b.x = 24+R; b.vx = Math.abs(b.vx)*0.5; }
    if(b.x > 338-R){ b.x = 338-R; b.vx = -Math.abs(b.vx)*0.5; }
    if(b.y>CHUTE_TOP && b.y<CHUTE_BOT){
      if(b.x>CHUTE_X-R && b.x<CHUTE_X+2 && b.vx>0){ b.x = CHUTE_X-R; b.vx = -Math.abs(b.vx)*0.4; }
      else if(b.x<CHUTE_X+R+2 && b.x>CHUTE_X-2 && b.vx<0){ b.x = CHUTE_X+R+2; b.vx = Math.abs(b.vx)*0.4; }
    }
    for(const p of pegs){
      const dx=b.x-p.x, dy=b.y-p.y, d2=dx*dx+dy*dy, rr=R+3.5;
      if(d2<rr*rr){
        const d=Math.sqrt(d2)||0.01, nx=dx/d, ny=dy/d;
        b.x = p.x+nx*rr; b.y = p.y+ny*rr;
        const vn = b.vx*nx+b.vy*ny;
        if(vn<0){ b.vx -= (1+CFG.restitution)*vn*nx; b.vy -= (1+CFG.restitution)*vn*ny; b.vx += rnd(-12,12); }
      }
    }
    for(const g of gates){
      if(b.hit & (1<<g.id)) continue;
      const gx = gateX(g,S.t);
      if(Math.abs(b.y-g.y) < GATE_H/2+2 && Math.abs(b.x-gx) < g.w/2){
        b.hit |= (1<<g.id);
        const room = Math.max(0, CFG.liveCap - S.balls.length);
        const n = Math.min(g.mult-1, 3, room);
        const total = b.v*g.mult, each = total/(n+1);
        b.v = each;
        for(let k=0;k<n;k++) spawnBall(b.x+rnd(-3,3), b.y, b.vx+rnd(-70,70), b.vy*0.8-rnd(0,50), each, b.hit);
        S.rings.push({x:gx,y:g.y,r:4,l:0.35});
        g.flash = 0.25;
      }
    }
    if(b.y > CFG.floorY){
      S.ammo += b.v;
      if(S.lifts.length<36) S.lifts.push({y:CFG.floorY+14, x:11, t:0});
      S.balls.splice(i,1);
    }
  }
}

function update(dt){
  S.t += dt;
  for(const g of gates) if(g.flash>0) g.flash-=dt;
  if(S.mode!=='play'){ S.endT = (S.endT||0)+dt; stepFx(dt); return; }
  if(S.moved) S.hintT += dt;

  S.disp.x += (S.disp.tx - S.disp.x)*Math.min(1, dt*9);
  S.disp.acc += dt*CFG.dropRate;
  while(S.disp.acc>=1){
    S.disp.acc-=1;
    if(S.balls.length < CFG.liveCap) spawnBall(S.disp.x+rnd(-4,4), 236, rnd(-12,12), 20, 1, 0);
  }
  const sub = 2;
  for(let i=0;i<sub;i++) stepBalls(dt/sub);

  S.shotAcc += dt*11;
  while(S.shotAcc>=1){
    S.shotAcc-=1;
    if(S.ammo>=1){
      const dmg = Math.min(S.ammo, Math.max(1, Math.floor(S.ammo/14)));
      S.ammo -= dmg; S.recoil = 1;
      S.bullets.push({x:CFG.soldierX+30, y:118+rnd(-5,5), dmg});
    }
  }
  S.recoil = Math.max(0, S.recoil-dt*8);

  for(let i=S.bullets.length-1;i>=0;i--){
    const b=S.bullets[i]; b.x += 520*dt;
    if(b.x >= frontX()){ applyDamage(b.dmg, b.x, b.y); S.bullets.splice(i,1); }
  }

  const sx = CFG.soldierX+34;
  if(!S.boss.active){
    S.horde.shift -= CFG.hordeSpeed*dt;
    if(hordeLeft() <= sx) return lose();
  } else {
    S.boss.x -= CFG.bossSpeed*dt;
    if(S.boss.x-34 <= sx) return lose();
  }
  stepFx(dt);
}
function applyDamage(d,x,y){
  burst(x,y,3,'#d8ffb0',120);
  if(!S.boss.active){
    S.horde.hp = Math.max(0, S.horde.hp-d);
    if(S.horde.hp<=0){ S.boss.active = true; S.boss.x = 420; S.shake=0.4; }
  } else {
    S.boss.hp = Math.max(0, S.boss.hp-d); S.boss.hit = 0.1;
    if(S.boss.hp<=0){ S.mode='win'; S.endT=0; S.shake=0.6; burst(S.boss.x,110,60,'#ff5a4a',220); vitoria(S.t); }
  }
}
function lose(){ S.mode='fail'; S.endT=0; S.flash=0.5; S.shake=0.5; }

// melhor tempo (só neste aparelho)
let melhor = null; try { melhor = parseFloat(localStorage.getItem('jogai_bolas_melhor')) || null; } catch {}
function vitoria(t){
  S.venceuEm = t; S.recorde = false;
  if(!melhor || t < melhor){ melhor = t; S.recorde = true; try { localStorage.setItem('jogai_bolas_melhor', String(t)); } catch {} }
  const el = document.getElementById('melhor'); if(el) el.textContent = melhor.toFixed(1) + ' s';
}
(() => { const el = document.getElementById('melhor'); if(el && melhor) el.textContent = melhor.toFixed(1) + ' s'; })();

function stepFx(dt){
  for(let i=S.parts.length-1;i>=0;i--){const p=S.parts[i]; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=200*dt; p.l-=dt; if(p.l<=0) S.parts.splice(i,1);}
  for(let i=S.rings.length-1;i>=0;i--){const r=S.rings[i]; r.r+=70*dt; r.l-=dt; if(r.l<=0) S.rings.splice(i,1);}
  for(let i=S.lifts.length-1;i>=0;i--){const l=S.lifts[i]; l.t+=dt; l.y -= 520*dt; if(l.y<190) S.lifts.splice(i,1);}
  S.shake = Math.max(0,S.shake-dt); S.flash=Math.max(0,S.flash-dt); S.boss.hit=Math.max(0,S.boss.hit-dt);
}

// ---------- desenho ----------
function rr(x,y,w,h,r){ctx.beginPath(); ctx.roundRect(x,y,w,h,r);}
function drawBG(){
  let g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#2b2160'); g.addColorStop(0.28,'#3b2a78'); g.addColorStop(0.3,'#2a1a4a'); g.addColorStop(1,'#1a0f30');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  const cr=[[20,40,30,60],[70,30,24,48],[130,36,34,70],[210,30,26,52],[262,40,36,74],[320,32,28,56]];
  for(const [x,y,w,h] of cr){
    ctx.fillStyle='#3fd3ff'; ctx.beginPath(); ctx.moveTo(x,y+h); ctx.lineTo(x+w/2,y); ctx.lineTo(x+w,y+h); ctx.fill();
    ctx.fillStyle='#8be9ff'; ctx.beginPath(); ctx.moveTo(x+w*0.35,y+h); ctx.lineTo(x+w/2,y); ctx.lineTo(x+w*0.55,y+h); ctx.fill();
  }
  g = ctx.createLinearGradient(0,70,0,175); g.addColorStop(0,'#b9a9e8'); g.addColorStop(1,'#8f7fd0');
  ctx.fillStyle=g; ctx.fillRect(0,80,W,92);
  ctx.strokeStyle='rgba(255,255,255,.22)'; ctx.lineWidth=2;
  for(let i=0;i<5;i++){ctx.beginPath(); ctx.moveTo(i*80,100+i*6); ctx.quadraticCurveTo(i*80+40,80+i*10,i*80+90,150); ctx.stroke();}
  ctx.fillStyle='#4a2f7c'; ctx.fillRect(0,CFG.laneFloor,W,12);
  ctx.fillStyle='#ffffff22'; ctx.fillRect(0,CFG.laneFloor,W,2);
  ctx.fillStyle='#22143f'; ctx.fillRect(24,182,314,H-182-90);
  ctx.fillStyle='#160c2b';
  ctx.beginPath(); ctx.moveTo(24,520); ctx.lineTo(160,CFG.floorY+22); ctx.lineTo(200,CFG.floorY+22); ctx.lineTo(338,520); ctx.lineTo(338,H); ctx.lineTo(24,H); ctx.fill();
}
function drawTube(){
  const g=ctx.createLinearGradient(0,0,24,0); g.addColorStop(0,'#5ea11a'); g.addColorStop(0.5,'#b6f04a'); g.addColorStop(1,'#4b8a12');
  ctx.fillStyle=g; ctx.fillRect(0,170,24,H-170-80);
  ctx.fillStyle='#d6ff7a'; ctx.fillRect(-2,170,28,8);
  ctx.fillStyle=g; ctx.fillRect(166,CFG.floorY+14,28,26); ctx.fillStyle='#d6ff7a'; ctx.fillRect(162,CFG.floorY+10,36,8);
  for(const l of S.lifts){ ctx.fillStyle='#f3f1ff'; ctx.beginPath(); ctx.arc(l.x, l.y, 3,0,6.28); ctx.fill(); }
}
function drawGates(){
  for(const g of gates){
    const x = gateX(g,S.t), f = Math.max(0,g.flash||0)*4;
    ctx.fillStyle = f>0 ? '#eaffb5' : '#4be35a';
    rr(x-g.w/2, g.y-GATE_H/2-f/2, g.w, GATE_H+f, 3); ctx.fill();
    ctx.fillStyle='#1d6b2a'; ctx.fillRect(x-g.w/2-3, g.y-GATE_H/2-3, 3, GATE_H+6); ctx.fillRect(x+g.w/2, g.y-GATE_H/2-3, 3, GATE_H+6);
    ctx.font = `13px ${FONT}`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.lineWidth=3; ctx.strokeStyle='#0f4a1b'; ctx.strokeText(g.label,x,g.y+1); ctx.fillStyle='#fff'; ctx.fillText(g.label,x,g.y+1);
  }
  ctx.fillStyle='#6cc72a'; ctx.fillRect(CHUTE_X-2, CHUTE_TOP, 4, CHUTE_BOT-CHUTE_TOP);
}
function drawPegs(){ ctx.fillStyle='#8a73c9'; for(const p of pegs){ctx.beginPath(); ctx.arc(p.x,p.y,3.5,0,6.28); ctx.fill();} ctx.fillStyle='#b9a6f0'; for(const p of pegs){ctx.beginPath(); ctx.arc(p.x-1,p.y-1,1.4,0,6.28); ctx.fill();} }
function drawDispenser(){
  const x=S.disp.x;
  ctx.fillStyle='#8f96a8'; ctx.beginPath(); ctx.moveTo(x-18,224); ctx.quadraticCurveTo(x-18,196,x,194); ctx.quadraticCurveTo(x+18,196,x+18,224); ctx.fill();
  ctx.fillStyle='#c9cfdd'; ctx.beginPath(); ctx.ellipse(x-6,208,5,11,0.3,0,6.28); ctx.fill();
  ctx.fillStyle='#4b5163'; ctx.fillRect(x-18,222,36,6);
  ctx.fillStyle='#232738'; ctx.fillRect(x-5,222,10,8);
  ctx.strokeStyle='rgba(255,255,255,.18)'; ctx.setLineDash([3,5]); ctx.beginPath(); ctx.moveTo(x,232); ctx.lineTo(x,520); ctx.stroke(); ctx.setLineDash([]);
}
function drawBalls(){
  for(const b of S.balls){
    const r = 3 + Math.min(2.2, Math.log2(Math.max(1,b.v))/3);
    ctx.fillStyle='#f4f2ff'; ctx.beginPath(); ctx.arc(b.x,b.y,r,0,6.28); ctx.fill();
    ctx.fillStyle='#b8b4d4'; ctx.beginPath(); ctx.arc(b.x+r*0.3,b.y+r*0.3,r*0.55,0,6.28); ctx.fill();
  }
}
function drawPile(){
  const n = Math.min(320, Math.ceil(S.ammo/2));
  let seed = 7; const r = () => (seed = (seed*16807)%2147483647)/2147483647;
  for(let i=0;i<n;i++){
    const row = Math.floor(Math.sqrt(i*0.9)), spread = 14+row*9;
    const x = 180 + (r()*2-1)*spread*(1-row*0.012), y = CFG.floorY+8 - row*3.2 + r()*3;
    ctx.fillStyle = i%3?'#e9e6fa':'#cfcbe8'; ctx.beginPath(); ctx.arc(clamp(x,34,328), y, 3.2, 0,6.28); ctx.fill();
  }
}
function drawSoldier(){
  const x=CFG.soldierX, y=CFG.laneFloor, rc=S.recoil*3;
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x,y,16,4,0,0,6.28); ctx.fill();
  ctx.fillStyle='#4d4a3a'; ctx.fillRect(x-9,y-24,8,24); ctx.fillRect(x+1,y-24,8,24);
  ctx.fillStyle='#2c2a22'; ctx.fillRect(x-11,y-5,11,5); ctx.fillRect(x+1,y-5,11,5);
  ctx.fillStyle='#6b7a3a'; rr(x-12,y-54,26,32,5); ctx.fill();
  ctx.fillStyle='#4e5a2a'; ctx.fillRect(x-12,y-34,26,5);
  ctx.fillStyle='#7a4b2a'; rr(x-19,y-52,9,22,3); ctx.fill();
  ctx.fillStyle='#e7b48b'; ctx.beginPath(); ctx.arc(x+1,y-64,10,0,6.28); ctx.fill();
  ctx.fillStyle='#2a1c17'; ctx.beginPath(); ctx.arc(x,y-68,10,Math.PI,6.28); ctx.fill();
  ctx.fillStyle='#1b1b1b'; ctx.fillRect(x+4,y-65,3,3);
  ctx.fillStyle='#2b2f38'; rr(x+2-rc,y-48,34,9,2); ctx.fill();
  ctx.fillStyle='#4a5060'; ctx.fillRect(x+30-rc,y-50,14,5);
  ctx.fillStyle='#e7b48b'; ctx.fillRect(x+6-rc,y-45,8,6);
  if(S.recoil>0.7){ ctx.fillStyle='#fff3a8'; ctx.beginPath(); ctx.arc(x+48,y-47,6*S.recoil,0,6.28); ctx.fill(); }
}
function drawSlime(x,y,s){
  ctx.fillStyle='#1f8a3a'; ctx.beginPath(); ctx.ellipse(x,y+1,s*0.95,s*0.8,0,0,6.28); ctx.fill();
  ctx.fillStyle='#43d36a'; ctx.beginPath(); ctx.ellipse(x,y,s*0.9,s*0.75,0,0,6.28); ctx.fill();
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(x-s*0.3,y-s*0.1,s*0.28,0,6.28); ctx.arc(x+s*0.25,y-s*0.1,s*0.28,0,6.28); ctx.fill();
  ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(x-s*0.38,y-s*0.08,s*0.13,0,6.28); ctx.arc(x+s*0.17,y-s*0.08,s*0.13,0,6.28); ctx.fill();
}
function drawHorde(){
  const n = Math.ceil(S.horde.hp/CFG.hordePerEnemy);
  if(n<=0) return;
  const cols = hordeCols(), left = hordeLeft();
  const rowH = 17, base = CFG.laneFloor-9;
  let drawn = 0;
  for(let c=0;c<cols;c++){
    for(let r=0;r<CFG.hordeRows;r++){
      if(drawn++ >= n) break;
      const wob = Math.sin(S.t*6 + c*0.9 + r)*1.2;
      drawSlime(left + c*COLW + 6 + (r%2)*3, base - r*rowH + wob, 9);
    }
  }
}
function drawBoss(){
  const b=S.boss; if(!b.active) return;
  const x=b.x, y=CFG.laneFloor-46, bob=Math.sin(S.t*3)*2, hit=b.hit>0;
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x,CFG.laneFloor,40,6,0,0,6.28); ctx.fill();
  ctx.fillStyle = hit?'#ff9b8f':'#d1342a'; ctx.beginPath(); ctx.ellipse(x,y+bob,36,40,0,0,6.28); ctx.fill();
  ctx.fillStyle = hit?'#ffc1b8':'#e9564a'; ctx.beginPath(); ctx.ellipse(x-6,y-8+bob,26,28,0,0,6.28); ctx.fill();
  ctx.fillStyle='#f0d9a0'; ctx.beginPath(); ctx.moveTo(x-28,y-26+bob); ctx.lineTo(x-42,y-62+bob); ctx.lineTo(x-14,y-36+bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x+28,y-26+bob); ctx.lineTo(x+42,y-62+bob); ctx.lineTo(x+14,y-36+bob); ctx.fill();
  ctx.fillStyle='#ffe34a'; ctx.beginPath(); ctx.ellipse(x-13,y-10+bob,7,5,-0.3,0,6.28); ctx.ellipse(x+13,y-10+bob,7,5,0.3,0,6.28); ctx.fill();
  ctx.fillStyle='#111'; ctx.fillRect(x-14,y-11+bob,3,6); ctx.fillRect(x+11,y-11+bob,3,6);
  ctx.fillStyle='#3a0a0a'; rr(x-18,y+8+bob,36,16,4); ctx.fill();
  ctx.fillStyle='#fff'; for(let i=0;i<5;i++){ctx.fillRect(x-16+i*7,y+8+bob,4,5);}
  const bw=120, p=b.hp/b.max;
  ctx.fillStyle='#1b1020'; rr(x-bw/2,y-78,bw,8,4); ctx.fill();
  ctx.fillStyle='#ff3b3b'; rr(x-bw/2,y-78,Math.max(0,bw*p),8,4); ctx.fill();
}
function drawFx(){
  for(const b of S.bullets){ ctx.fillStyle='#fff6c4'; ctx.fillRect(b.x-8,b.y-1.5,10,3); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(b.x+2,b.y,3,0,6.28); ctx.fill(); }
  for(const p of S.parts){ ctx.globalAlpha=clamp(p.l*3,0,1); ctx.fillStyle=p.c; ctx.fillRect(p.x-1.5,p.y-1.5,3,3);} ctx.globalAlpha=1;
  ctx.lineWidth=2;
  for(const r of S.rings){ ctx.globalAlpha=clamp(r.l*3,0,1); ctx.strokeStyle='#fff3a0'; ctx.beginPath(); ctx.arc(r.x,r.y,r.r,0,6.28); ctx.stroke(); } ctx.globalAlpha=1;
}
function banner(text, col){
  ctx.save(); ctx.translate(W/2,300);
  ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(-130,-30); ctx.lineTo(130,-30); ctx.lineTo(150,0); ctx.lineTo(130,30); ctx.lineTo(-130,30); ctx.lineTo(-150,0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=4; ctx.stroke();
  ctx.font=`44px ${FONT}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=6; ctx.strokeStyle='#5a0e14';
  ctx.strokeText(text,0,3); ctx.fillStyle='#fff'; ctx.fillText(text,0,3); ctx.restore();
}
function button(text){
  ctx.fillStyle='#2f8f2a'; rr(90,382,180,52,12); ctx.fill(); ctx.fillStyle='#58d64a'; rr(90,378,180,52,12); ctx.fill();
  ctx.font=`24px ${FONT}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=4; ctx.strokeStyle='#1c5a1a'; ctx.strokeText(text,180,406); ctx.fillStyle='#fff'; ctx.fillText(text,180,406);
}
function drawHUD(){
  ctx.font=`20px ${FONT}`; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.lineWidth=4; ctx.strokeStyle='#120a1f';
  const a = Math.floor(S.ammo); ctx.strokeText('Munição '+a, 34, 598); ctx.fillStyle='#fff'; ctx.fillText('Munição '+a, 34, 598);
  const tot = S.horde.max + S.boss.max, left = S.horde.hp + S.boss.hp, p = left/tot;
  ctx.fillStyle='#1b1020'; rr(34,14,292,9,5); ctx.fill();
  ctx.fillStyle = S.boss.active ? '#ff3b3b' : '#43d36a'; rr(34,14,Math.max(0,292*p),9,5); ctx.fill();
  ctx.font='11px system-ui'; ctx.textAlign='right'; ctx.fillStyle='#fff'; ctx.fillText(S.boss.active?'CHEFE':'HORDA', 326, 40);
  if(!S.moved || S.hintT<2.5){
    ctx.globalAlpha = S.moved ? clamp(1-(S.hintT/2.5),0,1) : 0.5+0.5*Math.sin(S.t*4);
    ctx.font=`18px ${FONT}`; ctx.textAlign='center'; ctx.lineWidth=4; ctx.strokeStyle='#120a1f'; ctx.strokeText('Arraste para mover o dispensador', W/2, 258); ctx.fillStyle='#fff'; ctx.fillText('Arraste para mover o dispensador', W/2, 258);
    ctx.globalAlpha=1;
  }
}
function draw(){
  ctx.setTransform(cv.width/W,0,0,cv.height/H,0,0);
  ctx.save();
  if(S.shake>0) ctx.translate(rnd(-3,3)*S.shake*4, rnd(-3,3)*S.shake*4);
  drawBG(); drawTube(); drawPegs(); drawGates(); drawDispenser(); drawPile(); drawBalls();
  drawSoldier(); drawHorde(); drawBoss(); drawFx(); drawHUD();
  ctx.restore();
  if(S.flash>0){ ctx.fillStyle=`rgba(255,40,40,${S.flash})`; ctx.fillRect(0,0,W,H); }
  if(S.mode!=='play'){
    ctx.fillStyle='rgba(10,5,20,.72)'; ctx.fillRect(0,0,W,H);
    if(S.mode==='fail'){ banner('FALHOU','#d8323c'); button('TENTAR DE NOVO'); }
    else {
      banner('VITÓRIA','#e1a021');
      ctx.font=`18px ${FONT}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#fff';
      ctx.fillText(`Tempo: ${S.venceuEm.toFixed(1)} s${S.recorde?'  · NOVO RECORDE!':''}`, W/2, 350);
      button('JOGAR DE NOVO');
    }
  }
}

let last = performance.now();
function frame(now){
  const dt = Math.min(0.033,(now-last)/1000); last=now;
  update(dt); draw(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
if (document.fonts && document.fonts.load) document.fonts.load("20px 'Lilita One'");
window.__g = {get S(){return S;}, CFG, step:(n,dt=1/60)=>{for(let i=0;i<n;i++) update(dt);}, draw, newGame};
})();
