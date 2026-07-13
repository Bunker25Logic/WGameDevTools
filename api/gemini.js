// API Proxy para Gemini - Protege a chave API
export default async function handler(req, res) {
  // CORS - Lendo do ambiente, com fallback para localhost em dev
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:3001,http://localhost:5173,https://w-game-dev-tools.vercel.app";
  const allowedOrigins = allowedOriginsEnv.split(",").map(s => s.trim());

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { systemPrompt, prompt, imageData, frameCount } = req.body;

  if (!prompt || !imageData) {
    return res.status(400).json({ error: "Missing required fields (prompt, imageData)" });
  }

  try {
    const finalSystemPrompt = systemPrompt || `You are an expert sprite animator for game development. 
Your task is to analyze the provided sprite image and create ${frameCount || 8} animation frames based on the user's animation request.

User's animation request: "${prompt}"

Please provide detailed descriptions for ${frameCount || 8} sequential animation frames that would create smooth, natural movement.
Each frame description should specify:
1. The frame number (1-${frameCount || 8})
2. Specific changes from the base image (position, rotation, deformation)
3. Which parts of the sprite should move and how

Format your response as a JSON array of frame descriptions.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: finalSystemPrompt },
                {
                  inlineData: {
                    mimeType: "image/png",
                    data: imageData,
                  },
                },
              ],
            },
          ],
        }),
      },
    );

    // Adiciona a chave API como query parameter (método da API Gemini)
    const url = new URL(response.url);
    url.searchParams.set("key", process.env.GEMINI_API_KEY);

    const finalResponse = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: finalSystemPrompt },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: imageData,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!finalResponse.ok) {
      const errorData = await finalResponse.json();
      throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
    }

    const data = await finalResponse.json();

    // Extrai o texto da resposta
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    res.status(200).json({ text });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({
      error: "Failed to generate animation frames",
      details: error.message,
    });
  }
}
