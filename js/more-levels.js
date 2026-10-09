// Botão "Pedir mais níveis" no fim da lista de níveis.
// Cada conta pode pedir uma vez por jogo; os pedidos ficam na tabela `level_requests`.
import { supabase } from "/js/supabase.js";
import { onAuthChange, openAuth } from "/js/account.js";

export function mountMoreLevels(game) {
  const hint = document.querySelector(".levels-hint");
  if (!hint) return;
  const box = document.createElement("div");
  box.className = "more-levels";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn ghost";
  btn.textContent = "➕ Pedir mais níveis";
  const msg = document.createElement("div");
  msg.className = "msg";
  box.append(btn, msg);
  hint.after(box);

  let user = null;
  let asked = false;
  const render = () => {
    btn.disabled = asked;
    btn.textContent = asked ? "✅ Pedido enviado" : "➕ Pedir mais níveis";
  };

  onAuthChange(async ({ user: u }) => {
    user = u;
    asked = false;
    render();
    if (!u) return;
    const { data } = await supabase.from("level_requests").select("game").eq("game", game);
    asked = !!(data && data.length);
    render();
  });

  btn.addEventListener("click", async () => {
    if (!user) { msg.className = "msg"; msg.textContent = "Entre na sua conta para pedir mais níveis."; openAuth("login"); return; }
    btn.disabled = true;
    const { error } = await supabase.from("level_requests").insert({ game });
    if (error && error.code !== "23505") {
      btn.disabled = false;
      msg.className = "msg err";
      msg.textContent = "Não deu para enviar agora. Tente de novo.";
      return;
    }
    asked = true;
    render();
    msg.className = "msg ok";
    msg.textContent = "Obrigado! Quando muita gente pedir, vamos criar novos níveis.";
  });
}
