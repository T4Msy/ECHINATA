// Configuração opcional do back-end (Supabase).
// Enquanto estiver vazio, o site funciona em modo demonstração:
// relatos e votos ficam salvos apenas no navegador de quem enviou.
window.ECHINATA_CONFIG = {
  apiUrl: "/api",       // back-end próprio na Vercel (em memória, sem banco)
  supabaseUrl: "",      // ex.: https://xxxx.supabase.co
  supabaseAnonKey: ""   // chave pública (anon / publishable)
};
