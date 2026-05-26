// web/public/sw.js

// Instalação do Service Worker.
self.addEventListener('install', () => {
  // Não usamos skipWaiting aqui para evitar trocar o service worker no meio do
  // carregamento de chunks de um deploy novo.
});

// Ativação sem claim agressivo; novas navegações passam a usar o worker novo.
self.addEventListener('activate', () => {
  return undefined;
});

// O handler de fetch é obrigatório para que o Chrome considere a aplicação um PWA instalável.
// Deixamos a requisição passar normalmente (pass-through) sem cachear chamadas de rede dinâmicas.
// Isso garante 100% de compatibilidade com SSR, autenticação Supabase/Next-Auth e API Railway.
self.addEventListener('fetch', () => {
  return undefined;
});
