// Configuração da URL do backend
// Altere isso após fazer deploy no Vercel
export const BACKEND_URL = ''; // Caminho relativo para funcionar perfeitamente no Vercel (w-game-dev-tools.vercel.app) e no localhost

export const USE_BACKEND_PROXY = (import.meta.env as any).PROD; // Automático: false no localhost, true no Vercel
