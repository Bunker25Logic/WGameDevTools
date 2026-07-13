import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "app.title": "Wellinton Game Dev Tools",
      "app.subtitle": "Client-side • Secure • AI Powered",
      "home.welcome": "Welcome to Your Toolkit",
      "home.description": "Powerful browser-based tools for developers and content creators. Secure, fast, and enhanced with Google Gemini AI.",
      "tool.launch": "Launch Tool",
      
      // Tool Names
      "tool.framesnap.title": "FrameSnap AI",
      "tool.framesnap.desc": "Extract high-quality frames from any video instantly. Analyze scenes automatically using Gemini AI.",
      
      "tool.bgremover.title": "BG Remover",
      "tool.bgremover.desc": "Real-time video background removal directly in your browser using computer vision.",
      
      "tool.smartwarp.title": "Smart Warp 2.5D",
      "tool.smartwarp.desc": "Advanced physics engine to animate still images. Use prompts to control wind, breath, and distortion.",
      
      "tool.pixelart.title": "Pixel Art Studio",
      "tool.pixelart.desc": "Turn photos into retro game assets. Auto-isolates subjects and applies 16/32/64-bit styling.",
      
      "tool.spriteanimator.title": "Sprite Animator AI",
      "tool.spriteanimator.desc": "Transform static images into animated sprites. Generate 8/10/12 frames with AI-powered motion.",
      
      "tool.imageenhancer.title": "Image Enhancer HD",
      "tool.imageenhancer.desc": "Upscale and enhance images up to 8x. Apply sharpening, noise reduction, and advanced filters.",
      
      "tool.animationmaker.title": "Animation Maker",
      "tool.animationmaker.desc": "Create animated GIFs and WebPs from multiple frames. Control FPS, ping-pong, and quality.",
      
      "tool.batchbgremover.title": "Batch BG Remover",
      "tool.batchbgremover.desc": "Remove background from multiple images at once. Download as individual files or ZIP archive."
    }
  },
  "pt-BR": {
    translation: {
      "app.title": "Ferramentas Game Dev do Wellinton",
      "app.subtitle": "Client-side • Seguro • Com IA",
      "home.welcome": "Bem-vindo ao seu Kit de Ferramentas",
      "home.description": "Poderosas ferramentas no navegador para desenvolvedores e criadores de conteúdo. Seguro, rápido e aprimorado com IA.",
      "tool.launch": "Abrir Ferramenta",
      
      // Nomes das Ferramentas
      "tool.framesnap.title": "FrameSnap IA",
      "tool.framesnap.desc": "Extraia frames de alta qualidade de qualquer vídeo instantaneamente. Analise cenas automaticamente usando Gemini IA.",
      
      "tool.bgremover.title": "Removedor de Fundo",
      "tool.bgremover.desc": "Remoção de fundo de vídeo em tempo real diretamente no seu navegador usando visão computacional.",
      
      "tool.smartwarp.title": "Smart Warp 2.5D",
      "tool.smartwarp.desc": "Engine avançada de física para animar imagens estáticas. Use prompts para controlar vento, respiração e distorção.",
      
      "tool.pixelart.title": "Estúdio Pixel Art",
      "tool.pixelart.desc": "Transforme fotos em assets retrô de jogos. Isola automaticamente sujeitos e aplica estilo de 16/32/64-bits.",
      
      "tool.spriteanimator.title": "Animador de Sprites IA",
      "tool.spriteanimator.desc": "Transforme imagens estáticas em sprites animados. Gere 8/10/12 frames com movimento potencializado por IA.",
      
      "tool.imageenhancer.title": "Aprimorador de Imagem HD",
      "tool.imageenhancer.desc": "Faça upscale e aprimore imagens em até 8x. Aplique nitidez, redução de ruído e filtros avançados.",
      
      "tool.animationmaker.title": "Criador de Animações",
      "tool.animationmaker.desc": "Crie GIFs e WebPs animados a partir de múltiplos frames. Controle FPS, ping-pong e qualidade.",
      
      "tool.batchbgremover.title": "Removedor de Fundo em Lote",
      "tool.batchbgremover.desc": "Remova o fundo de múltiplas imagens de uma vez. Baixe como arquivos individuais ou em arquivo ZIP."
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "pt-BR", // Inicializando com pt-BR
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
