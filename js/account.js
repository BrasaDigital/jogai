// Conta do jogador: botão no cabeçalho + janela de entrar / criar conta.
import { supabase } from "/js/supabase.js";

const NICK_RE = /^[A-Za-z0-9_]{3,20}$/;

let state = { user: null, nickname: null };
const listeners = new Set();
let dialog = null;

function emit() { listeners.forEach((cb) => cb({ ...state })); }

// Chama `cb({ user, nickname })` agora e a cada mudança (entrou, saiu).
export function onAuthChange(cb) {
  listeners.add(cb);
  cb({ ...state });
}

export function getAuth() { return { ...state }; }

// ---------- cabeçalho ----------
const holder = document.getElementById("account");

function renderHeader() {
  if (!holder) return;
  holder.innerHTML = "";
  holder.className = "account";
  if (state.user) {
    const name = document.createElement("span");
    name.className = "acc-name";
    name.textContent = `👤 ${state.nickname || "jogador"}`;
    const out = document.createElement("button");
    out.type = "button";
    out.className = "acc-btn";
    out.textContent = "Sair";
    out.addEventListener("click", () => supabase.auth.signOut());
    holder.append(name, out);
  } else {
    const inBtn = document.createElement("button");
    inBtn.type = "button";
    inBtn.className = "acc-btn primary";
    inBtn.textContent = "Entrar";
    inBtn.addEventListener("click", () => openAuth("login"));
    holder.appendChild(inBtn);
  }
}

// ---------- sessão ----------
async function loadProfile(user) {
  if (!user) {
    state = { user: null, nickname: null };
  } else {
    let nick = user.user_metadata?.nickname || null;
    try {
      const { data } = await supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle();
      if (data?.nickname) nick = data.nickname;
    } catch (_) {}
    state = { user, nickname: nick };
    if (dialog && dialog.open) dialog.close();
  }
  renderHeader();
  emit();
}

supabase.auth.onAuthStateChange((_event, session) => {
  // adiado para não travar dentro do callback do supabase-js
  setTimeout(() => loadProfile(session?.user ?? null), 0);
});
supabase.auth.getSession().then(({ data }) => loadProfile(data.session?.user ?? null));
renderHeader();

// ---------- janela de login ----------
function translate(error) {
  const msg = (error && error.message) || "";
  if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(msg)) return "Confirme seu e-mail antes de entrar (veja a caixa de entrada).";
  if (error?.status === 429 || /rate limit|too many/i.test(msg)) return "Muitas tentativas. Espere alguns minutos e tente de novo.";
  if (/at least \d+ characters|password should/i.test(msg)) return "A senha precisa ter pelo menos 6 caracteres.";
  if (/database error saving new user/i.test(msg)) return "Esse apelido já está em uso. Escolha outro.";
  if (/valid email|invalid.*email/i.test(msg)) return "Digite um e-mail válido.";
  return "Não foi possível concluir. Tente de novo.";
}

function buildDialog() {
  dialog = document.createElement("dialog");
  dialog.className = "auth-dialog";
  dialog.innerHTML = `
    <div class="auth-box">
      <button type="button" class="auth-close" aria-label="Fechar">×</button>
      <div class="auth-tabs">
        <button type="button" class="auth-tab" data-tab="login">Entrar</button>
        <button type="button" class="auth-tab" data-tab="signup">Criar conta</button>
      </div>

      <form class="auth-form" data-form="login">
        <label>E-mail<input name="email" type="email" autocomplete="email" required></label>
        <label>Senha<input name="password" type="password" autocomplete="current-password" required></label>
        <button class="btn" type="submit">Entrar</button>
      </form>

      <form class="auth-form" data-form="signup">
        <label>Apelido (aparece no ranking)
          <input name="nickname" type="text" maxlength="20" autocomplete="nickname" required>
        </label>
        <small>3 a 20 caracteres: letras, números ou _</small>
        <label>E-mail<input name="email" type="email" autocomplete="email" required></label>
        <label>Senha<input name="password" type="password" minlength="6" autocomplete="new-password" required></label>
        <small>Mínimo de 6 caracteres</small>
        <button class="btn" type="submit">Criar conta</button>
      </form>

      <p class="auth-msg" role="status"></p>
    </div>`;
  document.body.appendChild(dialog);

  const msgEl = dialog.querySelector(".auth-msg");
  const setMsg = (text, kind = "") => { msgEl.textContent = text; msgEl.className = "auth-msg " + kind; };

  dialog.querySelector(".auth-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  dialog.querySelectorAll(".auth-tab").forEach((t) =>
    t.addEventListener("click", () => setTab(t.dataset.tab)));

  dialog.querySelector('[data-form="login"]').addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    const btn = f.querySelector("button[type=submit]");
    btn.disabled = true;
    setMsg("Entrando...");
    const { error } = await supabase.auth.signInWithPassword({
      email: f.email.value.trim(),
      password: f.password.value,
    });
    btn.disabled = false;
    if (error) return setMsg(translate(error), "err");
    f.reset();
    setMsg("");
  });

  dialog.querySelector('[data-form="signup"]').addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    const btn = f.querySelector("button[type=submit]");
    const nick = f.nickname.value.trim();
    const email = f.email.value.trim();
    if (!NICK_RE.test(nick)) return setMsg("Apelido: 3 a 20 caracteres, só letras, números ou _.", "err");

    btn.disabled = true;
    setMsg("Criando conta...");
    const free = await supabase.rpc("nickname_available", { nick });
    if (free.error) { btn.disabled = false; return setMsg("Não foi possível concluir. Tente de novo.", "err"); }
    if (!free.data) { btn.disabled = false; return setMsg("Esse apelido já está em uso. Escolha outro.", "err"); }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: f.password.value,
      options: { data: { nickname: nick }, emailRedirectTo: location.origin },
    });
    btn.disabled = false;
    if (error) return setMsg(translate(error), "err");
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return setMsg("Esse e-mail já tem conta. Use a aba Entrar.", "err");
    }
    f.reset();
    if (!data.session) {
      setMsg(`Conta criada! Enviamos um e-mail de confirmação para ${email}. Clique no link e depois entre.`, "ok");
    } else {
      setMsg("");
    }
  });
}

function setTab(tab) {
  dialog.querySelectorAll(".auth-tab").forEach((t) => t.classList.toggle("on", t.dataset.tab === tab));
  dialog.querySelectorAll(".auth-form").forEach((f) => { f.hidden = f.dataset.form !== tab; });
  const m = dialog.querySelector(".auth-msg");
  m.textContent = "";
  m.className = "auth-msg";
  const first = dialog.querySelector(`[data-form="${tab}"] input`);
  if (first) setTimeout(() => first.focus(), 0);
}

export function openAuth(tab = "login") {
  if (!dialog) buildDialog();
  setTab(tab);
  if (!dialog.open) dialog.showModal();
}
