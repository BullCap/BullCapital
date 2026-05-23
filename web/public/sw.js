// web/public/sw.js

// Instalação do Service Worker e ativação imediata
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Ativação e controle imediato de todos os clientes ativos
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// O handler de fetch é obrigatório para que o Chrome considere a aplicação um PWA instalável.
// Deixamos a requisição passar normalmente (pass-through) sem cachear chamadas de rede dinâmicas.
// Isso garante 100% de compatibilidade com SSR, autenticação Supabase/Next-Auth e API Railway.
self.addEventListener('fetch', (event) => {
  // Pass-through padrão
});
