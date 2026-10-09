// Sons gerados com Web Audio API (sem arquivos de áudio).
// O áudio só pode começar depois de um clique/toque, então chame initAudio()
// dentro de um evento do usuário.

let ctx = null;
let muted = false;

try { muted = localStorage.getItem("jogai_muted") === "1"; } catch (_) {}

export function initAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === "suspended") ctx.resume();
}

export function isMuted() { return muted; }

export function setMuted(value) {
  muted = value;
  try { localStorage.setItem("jogai_muted", value ? "1" : "0"); } catch (_) {}
}

function tone(freq, start, dur, { type = "square", vol = 0.12, endFreq = null } = {}) {
  if (muted || !ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  // começo da espera (tensão)
  wait() { tone(220, 0, 0.12, { type: "triangle", vol: 0.1 }); },
  // tela ficou verde: bipe agudo e curto
  go() { tone(880, 0, 0.18, { type: "square", vol: 0.14 }); },
  // clique registrado: sobe o tom quanto mais rápido (ms menor = mais agudo)
  hit(ms) {
    const f = Math.max(400, Math.min(1200, 1400 - ms * 1.5));
    tone(f, 0, 0.1, { type: "triangle", vol: 0.16 });
    tone(f * 1.5, 0.08, 0.14, { type: "triangle", vol: 0.14 });
  },
  // clicou cedo demais
  fail() { tone(180, 0, 0.35, { type: "sawtooth", vol: 0.12, endFreq: 70 }); },
  // fim das 3 rodadas
  win() {
    [523, 659, 784, 1047].forEach((f, i) =>
      tone(f, i * 0.1, 0.18, { type: "square", vol: 0.12 })
    );
  },
  // pontuação salva
  saved() {
    tone(660, 0, 0.1, { type: "triangle", vol: 0.14 });
    tone(990, 0.1, 0.2, { type: "triangle", vol: 0.14 });
  },
};
