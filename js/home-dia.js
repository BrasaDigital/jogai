// Destaque da home: mostra se o jogo do dia já foi feito e a sequência.
import { spHoje, estatisticas } from "/termo/stats.js";
const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; } };
const hoje = spHoje();
for (const game of ["termodia", "comexdia"]) {
  const el = document.querySelector(`[data-dia="${game}"]`);
  if (!el) continue;
  const st = read(`jogai_dia_${game}`), hist = read(`jogai_dia_hist_${game}`) || {};
  const s = estatisticas(hist, hoje);
  const feito = st && st.day === hoje && st.done;
  const tag = el.querySelector(".dia-tag");
  tag.textContent = feito ? (st.won ? "✅ Feito hoje" : "Feito hoje") : "Jogar agora →";
  if (feito) el.classList.add("feito");
  const seq = el.querySelector(".dia-seq");
  if (s.seq > 0) seq.textContent = `🔥 ${s.seq} ${s.seq === 1 ? "dia seguido" : "dias seguidos"}`;
}
