// Transporte da partida online: canal de broadcast do Supabase Realtime (sem tabelas).
// Com ?local=1 usa BroadcastChannel do navegador (só para testar com duas abas).
import { supabase } from "/js/supabase.js";

const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
export const novoCodigo = () => Array.from({ length: 4 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join("");

export async function abrirCanal(codigo) {
  const ouvintes = new Map(); const emitir = (ev, dados) => (ouvintes.get(ev) || []).forEach((f) => f(dados));
  const local = new URLSearchParams(location.search).has("local");
  if (local) {
    const bc = new BroadcastChannel("mesa-" + codigo), eu = Math.random().toString(36).slice(2);
    bc.onmessage = (e) => { if (e.data.de !== eu) emitir(e.data.ev, e.data.dados); };
    return { enviar: (ev, dados) => bc.postMessage({ de: eu, ev, dados }), ao: (ev, f) => ouvintes.set(ev, [...(ouvintes.get(ev) || []), f]), fechar: () => bc.close() };
  }
  const canal = supabase.channel("mesa-" + codigo, { config: { broadcast: { self: false, ack: false } } });
  canal.on("broadcast", { event: "*" }, (m) => emitir(m.event, m.payload));
  await new Promise((ok, erro) => {
    const t = setTimeout(() => erro(new Error("tempo esgotado ao conectar")), 10000);
    canal.subscribe((st) => { if (st === "SUBSCRIBED") { clearTimeout(t); ok(); } else if (st === "CHANNEL_ERROR" || st === "TIMED_OUT") { clearTimeout(t); erro(new Error(st)); } });
  });
  return {
    enviar: (ev, dados) => canal.send({ type: "broadcast", event: ev, payload: dados }),
    ao: (ev, f) => ouvintes.set(ev, [...(ouvintes.get(ev) || []), f]),
    fechar: () => supabase.removeChannel(canal),
  };
}
