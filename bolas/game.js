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

// ---------- fases ----------
const MAXFASE = 8;
let nivel = 1, maxLiberada = 1;
try { maxLiberada = Math.min(MAXFASE, parseInt(localStorage.getItem('jogai_bolas_fase')) || 1); nivel = maxLiberada; } catch {}
const BASE = {hordePerEnemy:CFG.hordePerEnemy, hordeHP:CFG.hordeHP, hordeSpeed:CFG.hordeSpeed, bossHP:CFG.bossHP, bossSpeed:CFG.bossSpeed};
const BOSS_COR = [['#d1342a','#e9564a'],['#8a3ad1','#a964ea'],['#d17a1a','#ea9a3c'],['#1a8ad1','#3cabea']];
function aplicarFase(){
  const k = nivel-1;
  CFG.hordeHP = Math.round(BASE.hordeHP*(1+0.1*k)); CFG.hordePerEnemy = BASE.hordePerEnemy*(1+0.1*k); CFG.bossHP = Math.round(BASE.bossHP*(1+0.12*k));
  CFG.hordeSpeed = BASE.hordeSpeed + 0.06*k; CFG.bossSpeed = BASE.bossSpeed + 0.2*k;
  gates.length = 7; // mantém os 7 portais de multiplicação
  const ruins = Math.min(3, Math.floor(nivel/2));    // portais vermelhos (dividem a bola) a partir da fase 2
  const pos = [[332,3.1,1.0],[418,2.7,3.3],[500,3.4,2.0]];
  for(let i=0;i<ruins;i++) gates.push({id:7+i, label:'÷2', mult:0.5, bad:true, y:pos[i][0], w:40, cx0:70, cx1:250, per:pos[i][1], ph:pos[i][2]});
  const el = document.getElementById('fase'); if(el) el.textContent = nivel;
  const m = document.getElementById('melhor'); if(m) m.textContent = melhorDaFase() ? melhorDaFase().toFixed(1)+' s' : '—';
}

// ---------- estado ----------
let S;
function newGame(){
  aplicarFase();
  S = {
    mode:'play', t:0,
    disp:{x:180, tx:180, acc:0},
    balls:[], bullets:[], parts:[], rings:[], lifts:[],
    ammo:0, shotAcc:0, recoil:0, hintT:0, moved:false,
    horde:{hp:CFG.hordeHP, max:CFG.hordeHP, shift:0},
    boss:{active:false, hp:CFG.bossHP, max:CFG.bossHP, x:420, hit:0},
    flash:0, shake:0, kills:0, txts:[], dust:Array.from({length:22},()=>({x:rnd(0,360),y:rnd(0,640),s:rnd(4,14),a:rnd(0,6.28)})), warn:0, prevCols:null
  };
}
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
newGame();
const GATE_H = 10, CHUTE_X = 291, CHUTE_TOP = 318, CHUTE_BOT = 500;
function gateX(g, t){
  if(g.fixed) return g.cx0;
  const k = (Math.sin(t*Math.PI*2/g.per + g.ph)+1)/2;
  return g.cx0 + (g.cx1-g.cx0)*k;
}

// ---------- som (WebAudio, sem arquivos) ----------
let AC = null, mudo = false; try { mudo = localStorage.getItem('jogai_bolas_mudo') === '1'; } catch {}
function audio(){ if(!AC){ try { AC = new (window.AudioContext||window.webkitAudioContext)(); } catch {} } if(AC && AC.state==='suspended') AC.resume(); return AC; }
let ultSom = {};
function tom(f, d=0.08, tipo='sine', vol=0.05, chave='', gap=0.04){
  if(mudo || !AC) return; const t = AC.currentTime;
  if(chave){ if(ultSom[chave] && t-ultSom[chave] < gap) return; ultSom[chave] = t; }
  const o = AC.createOscillator(), g = AC.createGain(); o.type = tipo; o.frequency.setValueAtTime(f,t);
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+d+0.02);
}
const sfx = {
  gate:(m)=>tom(m>=5?880:m>=2?660:300, 0.1,'triangle',0.05,'g',0.03),
  ruim:()=>tom(150,0.18,'sawtooth',0.05,'r',0.05),
  tiro:()=>tom(520+Math.random()*60,0.05,'square',0.02,'t',0.06),
  acerto:()=>tom(180,0.06,'square',0.025,'a',0.05),
  chefe:()=>{ tom(110,0.5,'sawtooth',0.07); setTimeout(()=>tom(90,0.5,'sawtooth',0.07),250); },
  vitoria:()=>[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tom(f,0.25,'triangle',0.07),i*120)),
  derrota:()=>[300,240,180].forEach((f,i)=>setTimeout(()=>tom(f,0.3,'sawtooth',0.06),i*150)),
};
function atualizarMudo(){ const b=document.getElementById('mudo'); if(b){ b.textContent = mudo?'🔇 Som desligado':'🔊 Som ligado'; b.setAttribute('aria-pressed', mudo?'true':'false'); } }
atualizarMudo();
const bm = document.getElementById('mudo'); if(bm) bm.addEventListener('click', ()=>{ mudo=!mudo; try{localStorage.setItem('jogai_bolas_mudo', mudo?'1':'0');}catch{} atualizarMudo(); audio(); });

// ---------- entrada ----------
function toLogical(e){
  const r = cv.getBoundingClientRect();
  return {x:(e.clientX-r.left)/r.width*W, y:(e.clientY-r.top)/r.height*H};
}
let dragging = false;
cv.addEventListener('pointerdown', e => {
  audio();
  const p = toLogical(e);
  if(S.mode !== 'play'){
    if(S.endT > 0.6 && p.x>90 && p.x<270 && p.y>380 && p.y<440){ if(S.mode==='win' && nivel<MAXFASE){ nivel++; guardarFase(); } newGame(); }
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
  if(e.key==='Enter' && S.mode!=='play'){ if(S.mode==='win' && nivel<MAXFASE){ nivel++; guardarFase(); } newGame(); }
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
    b.ox = b.x; b.oy = b.y;
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
        if(g.bad){ b.v = Math.max(0.5, b.v*g.mult); g.flash = 0.25; S.rings.push({x:gx,y:g.y,r:4,l:0.35,bad:true}); sfx.ruim(); continue; }
        sfx.gate(g.mult);
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
      S.ammo -= dmg; S.recoil = 1; sfx.tiro();
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
  burst(x,y,3,'#d8ffb0',120); sfx.acerto();
  if(S.txts.length<14) S.txts.push({x:x+rnd(-8,8), y:y-6, l:0.7, t:'-'+Math.round(d), c:d>=20?'#ffd23f':'#fff'});
  if(!S.boss.active){
    const antes = hordeCols();
    S.horde.hp = Math.max(0, S.horde.hp-d);
    if(hordeCols() < antes) burst(hordeLeft()+4, CFG.laneFloor-30, 8, '#43d36a', 110);
    if(S.horde.hp<=0){ S.boss.active = true; S.boss.x = 420; S.shake=0.4; S.warn=1.6; sfx.chefe(); }
  } else {
    S.boss.hp = Math.max(0, S.boss.hp-d); S.boss.hit = 0.1;
    if(S.boss.hp<=0){ S.mode='win'; S.endT=0; S.shake=0.6; burst(S.boss.x,110,60,'#ff5a4a',220); vitoria(S.t); sfx.vitoria(); }
  }
}
function lose(){ sfx.derrota(); S.mode='fail'; S.endT=0; S.flash=0.5; S.shake=0.5; }

// melhor tempo (só neste aparelho)
function melhorDaFase(){ try { return parseFloat(localStorage.getItem('jogai_bolas_melhor_'+nivel)) || null; } catch { return null; } }
function guardarFase(){ if(nivel>maxLiberada){ maxLiberada = nivel; try { localStorage.setItem('jogai_bolas_fase', String(maxLiberada)); } catch {} } }
function vitoria(t){
  S.venceuEm = t; S.recorde = false;
  const m = melhorDaFase();
  if(!m || t < m){ S.recorde = true; try { localStorage.setItem('jogai_bolas_melhor_'+nivel, String(t)); } catch {} }
  if(nivel<MAXFASE){ guardarFase(); try { localStorage.setItem('jogai_bolas_fase', String(Math.max(maxLiberada, nivel+1))); maxLiberada = Math.max(maxLiberada, nivel+1); } catch {} }
  const el = document.getElementById('melhor'); if(el) el.textContent = Math.min(m||t, t).toFixed(1) + ' s';
}

function stepFx(dt){
  for(let i=S.parts.length-1;i>=0;i--){const p=S.parts[i]; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=200*dt; p.l-=dt; if(p.l<=0) S.parts.splice(i,1);}
  for(let i=S.rings.length-1;i>=0;i--){const r=S.rings[i]; r.r+=70*dt; r.l-=dt; if(r.l<=0) S.rings.splice(i,1);}
  for(let i=S.lifts.length-1;i>=0;i--){const l=S.lifts[i]; l.t+=dt; l.y -= 520*dt; if(l.y<190) S.lifts.splice(i,1);}
  for(let i=S.txts.length-1;i>=0;i--){const q=S.txts[i]; q.y-=40*dt; q.l-=dt; if(q.l<=0) S.txts.splice(i,1);}
  for(const d of S.dust){ d.y -= d.s*dt; d.a += dt; if(d.y<-4){ d.y=644; d.x=rnd(0,360); } }
  S.warn = Math.max(0,S.warn-dt);
  S.shake = Math.max(0,S.shake-dt); S.flash=Math.max(0,S.flash-dt); S.boss.hit=Math.max(0,S.boss.hit-dt);
}

// ---------- desenho ----------
function rr(x,y,w,h,r){ctx.beginPath(); ctx.roundRect(x,y,w,h,r);}
function drawBG(){
  let g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#2b2160'); g.addColorStop(0.28,'#3b2a78'); g.addColorStop(0.3,'#2a1a4a'); g.addColorStop(1,'#1a0f30');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  const cr=[[20,40,30,60],[70,30,24,48],[130,36,34,70],[210,30,26,52],[262,40,36,74],[320,32,28,56]];
  let ci=0;
  for(const [x,y,w,h] of cr){
    ctx.globalAlpha = 0.75+0.25*Math.sin(S.t*2+ci++*1.7);
    ctx.fillStyle='#3fd3ff'; ctx.beginPath(); ctx.moveTo(x,y+h); ctx.lineTo(x+w/2,y); ctx.lineTo(x+w,y+h); ctx.fill();
    ctx.fillStyle='#8be9ff'; ctx.beginPath(); ctx.moveTo(x+w*0.35,y+h); ctx.lineTo(x+w/2,y); ctx.lineTo(x+w*0.55,y+h); ctx.fill();
  }
  ctx.globalAlpha=1;
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
    if(!g.bad && g.mult>=5){ ctx.fillStyle='rgba(75,227,90,.18)'; rr(x-g.w/2-5, g.y-12, g.w+10, 24, 8); ctx.fill(); }
    ctx.fillStyle = f>0 ? (g.bad?'#ffb5b5':'#eaffb5') : (g.bad?'#e84a4a':'#4be35a');
    rr(x-g.w/2, g.y-GATE_H/2-f/2, g.w, GATE_H+f, 3); ctx.fill();
    ctx.fillStyle=g.bad?'#7a1d1d':'#1d6b2a'; ctx.fillRect(x-g.w/2-3, g.y-GATE_H/2-3, 3, GATE_H+6); ctx.fillRect(x+g.w/2, g.y-GATE_H/2-3, 3, GATE_H+6);
    ctx.font = `13px ${FONT}`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.lineWidth=3; ctx.strokeStyle=g.bad?'#4a0f0f':'#0f4a1b'; ctx.strokeText(g.label,x,g.y+1); ctx.fillStyle='#fff'; ctx.fillText(g.label,x,g.y+1);
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
  ctx.lineWidth=2; ctx.lineCap='round';
  for(const b of S.balls){ if(b.ox!==undefined && b.v>=2){ ctx.strokeStyle=b.v>=10?'rgba(255,210,63,.45)':'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.moveTo(b.ox,b.oy); ctx.lineTo(b.x,b.y); ctx.stroke(); } }
  for(const b of S.balls){
    const r = 3 + Math.min(2.2, Math.log2(Math.max(1,b.v))/3);
    ctx.fillStyle=b.v>=10?'#ffe27a':'#f4f2ff'; ctx.beginPath(); ctx.arc(b.x,b.y,r,0,6.28); ctx.fill();
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
  const x=CFG.soldierX, y=CFG.laneFloor - Math.abs(Math.sin(S.t*5))*(S.ammo>=1?0.8:0), rc=S.recoil*3;
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
  const cor = BOSS_COR[(nivel-1)%BOSS_COR.length]; const x=b.x, y=CFG.laneFloor-46, bob=Math.sin(S.t*3)*2, hit=b.hit>0;
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x,CFG.laneFloor,40,6,0,0,6.28); ctx.fill();
  ctx.fillStyle = hit?'#ffffff':cor[0]; ctx.beginPath(); ctx.ellipse(x,y+bob,36,40,0,0,6.28); ctx.fill();
  ctx.fillStyle = hit?'#ffe6e6':cor[1]; ctx.beginPath(); ctx.ellipse(x-6,y-8+bob,26,28,0,0,6.28); ctx.fill();
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
function drawTxts(){
  ctx.font=`13px ${FONT}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=3; ctx.strokeStyle='#120a1f';
  for(const q of S.txts){ ctx.globalAlpha=clamp(q.l*2.5,0,1); ctx.strokeText(q.t,q.x,q.y); ctx.fillStyle=q.c; ctx.fillText(q.t,q.x,q.y); } ctx.globalAlpha=1;
}
function drawDust(){ ctx.fillStyle='rgba(190,170,255,.18)'; for(const d of S.dust){ ctx.beginPath(); ctx.arc(d.x+Math.sin(d.a)*6, d.y, 1.6, 0, 6.28); ctx.fill(); } }
function drawWarn(){
  if(S.warn<=0) return;
  ctx.globalAlpha = 0.5+0.5*Math.sin(S.t*18); ctx.font=`40px ${FONT}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=6; ctx.strokeStyle='#5a0e14';
  ctx.strokeText('⚠ CHEFE! ⚠', W/2, 130); ctx.fillStyle='#ffd23f'; ctx.fillText('⚠ CHEFE! ⚠', W/2, 130); ctx.globalAlpha=1;
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
  ctx.font='11px system-ui'; ctx.textAlign='right'; ctx.fillStyle='#fff'; ctx.fillText(S.boss.active?'CHEFE':'HORDA', 326, 40); ctx.textAlign='left'; ctx.fillText('Fase '+nivel+'/'+MAXFASE, 34, 40);
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
  drawDust(); drawSoldier(); drawHorde(); drawBoss(); drawFx(); drawTxts(); drawHUD(); drawWarn();
  ctx.restore();
  if(S.flash>0){ ctx.fillStyle=`rgba(255,40,40,${S.flash})`; ctx.fillRect(0,0,W,H); }
  if(S.mode!=='play'){
    ctx.fillStyle='rgba(10,5,20,.72)'; ctx.fillRect(0,0,W,H);
    if(S.mode==='fail'){ banner('FALHOU','#d8323c'); button('TENTAR DE NOVO'); }
    else {
      banner('VITÓRIA','#e1a021');
      ctx.font=`18px ${FONT}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#fff';
      ctx.fillText(`Tempo: ${S.venceuEm.toFixed(1)} s${S.recorde?'  · NOVO RECORDE!':''}`, W/2, 350);
      button(nivel<MAXFASE?'PRÓXIMA FASE':'JOGAR DE NOVO');
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
