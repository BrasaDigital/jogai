// Service worker do Jogaí.
// Estratégia: rede primeiro (sempre pega a versão nova do site); se estiver offline, usa o cache.
// Supabase e outros domínios nunca passam pelo cache.
const CACHE = "jogai-v1";
const SHELL = [
  "/", "/css/style.css", "/css/auth.css", "/css/levels.css", "/css/games.css", "/css/encaixe.css",
  "/js/supabase.js", "/js/account.js", "/js/sound.js", "/js/levels.js", "/js/progress.js", "/js/kit.js", "/js/more-levels.js", "/js/pwa.js",
  "/reflexo/", "/encaixe/", "/cobrinha/", "/memoria/", "/alvo/", "/simon/",
  "/icons/icon-192.png", "/manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u)))));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
