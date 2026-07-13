import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the client
// Note: In a real production app for public use, you'd likely proxy this or ask user for key
// For this demo structure, we use import.meta.env as per Vite conventions
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
export const analyzeFrame = async (base64Image: string): Promise<string> => {
  try {
    const base64Data = base64Image.split(',')[1];
    
    // Importar configuração do backend
    const { BACKEND_URL, USE_BACKEND_PROXY } = await import('./backendConfig');

    if (USE_BACKEND_PROXY) {
      const response = await fetch(`${BACKEND_URL}/api/gemini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Analyze this frame in detail.',
          systemPrompt: 'Describe this video frame in detail. Describe the lighting, composition, and main subjects.',
          imageData: base64Data,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze via proxy');
      }

      const data = await response.json();
      return data.text || "No analysis available.";
    } else {
      // Direct call fallback
      if (!API_KEY) throw new Error("VITE_GEMINI_API_KEY is required for direct local access.");
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/png',
          },
        },
        'Describe this video frame in detail. Describe the lighting, composition, and main subjects.',
      ]);

      const response = await result.response;
      return response.text() || "No analysis available.";
    }
  } catch (error) {
    console.error("Gemini analysis error:", error);
    throw new Error("Failed to analyze image. Please check your API key.");
  }
};
