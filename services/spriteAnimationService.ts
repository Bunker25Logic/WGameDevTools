import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export interface AnimationFrame {
  id: string;
  dataUrl: string;
  frameNumber: number;
}

export interface DistortionEffect {
  type: 'pinch_y' | 'pinch_x' | 'bulge';
  centerX: number;
  centerY: number;
  radius: number;
  intensitySequence: number[];
}

export interface SmartRiggerData {
  globalAnimation: 'none' | 'wind' | 'rotate' | 'jump' | 'swing' | 'fly' | 'bounce' | 'wave' | 'breathe';
  globalIntensity: number;
  effects: DistortionEffect[];
}

/**
 * Convert an image to sprite style using canvas processing
 */
export async function convertToSprite(imageFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Rotate a sprite image by specified degrees
 */
export function rotateSprite(
  imageDataUrl: string,
  degrees: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      const radians = (degrees * Math.PI) / 180;
      const sin = Math.abs(Math.sin(radians));
      const cos = Math.abs(Math.cos(radians));
      const newWidth = img.width * cos + img.height * sin;
      const newHeight = img.width * sin + img.height * cos;

      canvas.width = newWidth;
      canvas.height = newHeight;

      ctx.translate(newWidth / 2, newHeight / 2);
      ctx.rotate(radians);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load image for rotation"));
    img.src = imageDataUrl;
  });
}

/**
 * Generate animation frames using AI (Gemini or Grok)
 */
export async function generateAnimationFrames(
  baseImageDataUrl: string,
  prompt: string,
  frameCount: number,
  aiProvider: 'gemini' | 'grok' = 'gemini',
): Promise<AnimationFrame[]> {
  const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY || '';
  
  const { BACKEND_URL, USE_BACKEND_PROXY } = await import('./backendConfig');

  if (aiProvider === 'gemini' && !API_KEY && !USE_BACKEND_PROXY) {
    throw new Error(
      "Gemini API key not configured for local direct access.",
    );
  }
  
  if (aiProvider === 'grok' && !GROK_API_KEY) {
    throw new Error(
      "Grok API key not configured. Please set VITE_GROK_API_KEY in .env.local",
    );
  }

  try {
    let aiAnalysis = '';
    
    // NEW SYSTEM PROMPT FOR SMART RIGGER
    const systemPrompt = `You are an expert Computer Vision Rigger for 2D game sprites.
Your task is to analyze the provided sprite image and output a mathematical distortion map (JSON) to animate the user's request.

User's animation request: "${prompt}"
Frame count: ${frameCount}

1. Analyze the image to find the normalized coordinates (0.0 to 1.0) of the parts that need to move (e.g., eyes for blinking, chest for breathing). X=0 is left edge, X=1 is right edge. Y=0 is top edge, Y=1 is bottom edge.
2. Choose the appropriate localized distortion effect if needed:
   - "pinch_y": Squeezes pixels vertically. Great for blinking eyes or talking mouths.
   - "pinch_x": Squeezes pixels horizontally.
   - "bulge": Pushes pixels outward. Great for breathing chests.
3. For each effect, provide an array "intensitySequence" of exactly ${frameCount} numbers between 0.0 and 1.0. 
   - 0.0 means no distortion (base image).
   - 1.0 means maximum distortion.
   - Example for an eye blink over 10 frames: [0, 0, 0, 0.4, 1.0, 1.0, 0.4, 0, 0, 0]
4. CRITICAL SIZING: The 'radius' value represents the size of the distortion relative to the image size. For small facial features like eyes or mouths, use a very small radius (e.g., 0.03 to 0.08). For larger parts like chests, use 0.15 to 0.25.
5. If the animation requires the WHOLE character to move (like jumping, flying, or wind blowing), choose a "globalAnimation" from this list: "none", "wind", "rotate", "jump", "swing", "fly", "bounce", "wave", "breathe". Set "globalIntensity" from 0.0 to 1.0.

You MUST output ONLY a valid JSON object. No markdown, no backticks, no explanations. Just the JSON:
{
  "globalAnimation": "none",
  "globalIntensity": 0.0,
  "effects": [
    {
      "type": "pinch_y",
      "centerX": 0.45,
      "centerY": 0.15,
      "radius": 0.05,
      "intensitySequence": [0,0,0,1,1,0,0,0]
    }
  ]
}`;

    if (USE_BACKEND_PROXY) {
      const endpoint = aiProvider === 'gemini' ? '/api/gemini' : '/api/grok';
      const base64Data = baseImageDataUrl.split(",")[1];
      
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          systemPrompt,
          imageData: base64Data,
          frameCount,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Backend error: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      aiAnalysis = data.text || '';
    } else {
      if (aiProvider === 'gemini') {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const base64Data = baseImageDataUrl.split(",")[1];

        const result = await model.generateContent([
          systemPrompt,
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Data,
            },
          },
        ]);

        const response = await result.response;
        aiAnalysis = response.text();
      } else {
        const { analyzeFrameWithGrok } = await import('./grokService');
        aiAnalysis = await analyzeFrameWithGrok(baseImageDataUrl, prompt);
      }
    }

    const frames = await createInterpolatedFrames(
      baseImageDataUrl,
      frameCount,
      aiAnalysis,
      prompt
    );

    return frames;
  } catch (error: any) {
    console.error(`Error generating animation frames with ${aiProvider}:`, error);
    throw new Error(
      error.message || `Failed to generate animation frames using ${aiProvider}. Please check your ${aiProvider.toUpperCase()}_API_KEY and try again.`,
    );
  }
}

function parseAIAnalysis(aiAnalysis: string, prompt: string, frameCount: number): SmartRiggerData {
  try {
    // Extract JSON from potential markdown code blocks
    let jsonStr = aiAnalysis.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.substring(7);
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.substring(0, jsonStr.length - 3);
      }
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.substring(3);
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.substring(0, jsonStr.length - 3);
      }
    }

    const parsed = JSON.parse(jsonStr);
    console.log("🎯 Gemini Smart Rigger analisou a imagem e gerou:", parsed);
    
    // Validate arrays length
    if (parsed.effects) {
      parsed.effects.forEach((eff: any) => {
        if (!eff.intensitySequence || eff.intensitySequence.length !== frameCount) {
           console.warn(`Intensity sequence length mismatch. Expected ${frameCount}`);
           // pad or truncate
           if (!eff.intensitySequence) eff.intensitySequence = [];
           while(eff.intensitySequence.length < frameCount) eff.intensitySequence.push(0);
           eff.intensitySequence = eff.intensitySequence.slice(0, frameCount);
        }
      });
    }

    return {
      globalAnimation: parsed.globalAnimation || 'none',
      globalIntensity: parsed.globalIntensity || 0,
      effects: parsed.effects || []
    };
  } catch (e) {
    console.error("Failed to parse AI JSON, falling back to basic analysis", e, aiAnalysis);
    
    // Fallback logic
    const lowerPrompt = prompt.toLowerCase();
    let globalAnimation: SmartRiggerData['globalAnimation'] = 'none';
    let globalIntensity = 0.5;

    if (lowerPrompt.includes('vento') || lowerPrompt.includes('wind') || lowerPrompt.includes('capa')) {
      globalAnimation = 'wind'; globalIntensity = 0.8;
    } else if (lowerPrompt.includes('respira') || lowerPrompt.includes('breathe') || lowerPrompt.includes('peito')) {
      globalAnimation = 'breathe'; globalIntensity = 0.6;
    } else if (lowerPrompt.includes('gir') || lowerPrompt.includes('rotat') || lowerPrompt.includes('spin')) {
      globalAnimation = 'rotate'; globalIntensity = 1.0;
    } else if (lowerPrompt.includes('pul') || lowerPrompt.includes('jump') || lowerPrompt.includes('salt')) {
      globalAnimation = 'jump'; globalIntensity = 0.8;
    } else if (lowerPrompt.includes('balan') || lowerPrompt.includes('swing') || lowerPrompt.includes('sway')) {
      globalAnimation = 'swing'; globalIntensity = 0.6;
    } else if (lowerPrompt.includes('vo') || lowerPrompt.includes('fly') || lowerPrompt.includes('float')) {
      globalAnimation = 'fly'; globalIntensity = 0.7;
    } else if (lowerPrompt.includes('quic') || lowerPrompt.includes('bounce')) {
      globalAnimation = 'bounce'; globalIntensity = 0.9;
    } else if (lowerPrompt.includes('ond') || lowerPrompt.includes('wave')) {
      globalAnimation = 'wave'; globalIntensity = 0.5;
    } else {
      globalAnimation = 'breathe'; globalIntensity = 0.3; // Default
    }

    return {
      globalAnimation,
      globalIntensity,
      effects: [] // No localized mesh distortion on fallback
    };
  }
}

async function createInterpolatedFrames(
  baseImageDataUrl: string,
  frameCount: number,
  aiAnalysis: string,
  userPrompt: string
): Promise<AnimationFrame[]> {
  const frames: AnimationFrame[] = [];
  const riggerData = parseAIAnalysis(aiAnalysis, userPrompt, frameCount);

  for (let i = 0; i < frameCount; i++) {
    const progress = i / (frameCount - 1);
    const frameDataUrl = await applyFrameTransformation(
      baseImageDataUrl,
      progress,
      i,
      riggerData
    );

    frames.push({
      id: `frame-${i}`,
      dataUrl: frameDataUrl,
      frameNumber: i + 1,
    });
  }

  return frames;
}

function render3DRotation(
  ctx: CanvasRenderingContext2D,
  img: HTMLCanvasElement | HTMLImageElement,
  rotateY: number,
  centerX: number,
  centerY: number,
): void {
  const sliceCount = 40;
  const sliceWidth = img.width / sliceCount;
  
  for (let i = 0; i < sliceCount; i++) {
    const sliceX = i * sliceWidth;
    const normalizedX = (i / sliceCount) * 2 - 1;
    const angle = rotateY;
    const z = Math.sin(angle) * normalizedX;
    const x = Math.cos(angle) * normalizedX;
    
    const perspective = 600;
    const scale = perspective / (perspective + z * 100);
    
    const sliceDrawWidth = sliceWidth * scale;
    const sliceDrawHeight = img.height * scale;
    
    const drawX = centerX + x * (img.width / 2) * Math.cos(angle) - sliceDrawWidth / 2;
    const drawY = centerY - sliceDrawHeight / 2;
    
    const lighting = (Math.cos(angle + normalizedX * Math.PI) + 1) / 2;
    const brightness = 0.5 + lighting * 0.5;
    
    ctx.save();
    ctx.globalAlpha = brightness;
    
    ctx.drawImage(
      img,
      sliceX, 0, sliceWidth, img.height,
      drawX, drawY, sliceDrawWidth, sliceDrawHeight
    );
    
    ctx.restore();
  }
}

function renderWindEffect(
  ctx: CanvasRenderingContext2D,
  img: HTMLCanvasElement | HTMLImageElement,
  progressTime: number,
  intensity: number,
  centerX: number,
  centerY: number,
): void {
  const sliceCount = img.height; 
  const sliceHeight = 1;
  
  for (let y = 0; y < sliceCount; y++) {
    const ny = y / sliceCount;
    const rigidity = Math.pow(ny, 2.5); 
    
    const speed = 10;
    const frequency = 4.5;
    const amplitude = 18 * intensity;
    
    const waveX = Math.sin(progressTime * speed + ny * frequency) * amplitude * rigidity;
    
    const drawX = centerX - img.width / 2 + waveX;
    const drawY = centerY - img.height / 2 + y;
    
    ctx.drawImage(
      img,
      0, y, img.width, sliceHeight,
      drawX, drawY, img.width, sliceHeight
    );
  }
}

function applyPixelDistortions(
  img: HTMLImageElement,
  effects: DistortionEffect[],
  frameIndex: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  if (!effects || effects.length === 0) {
    return canvas;
  }

  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imgData.data;
  const outData = ctx.createImageData(img.width, img.height);
  const out = outData.data;
  
  const aspect = img.width / img.height;

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let srcX = x;
      let srcY = y;
      
      const nx = x / img.width;
      const ny = y / img.height;

      for (const effect of effects) {
        const intensity = effect.intensitySequence[frameIndex] || 0;
        if (intensity === 0) continue;

        const dx = (nx - effect.centerX) * aspect;
        const dy = ny - effect.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < effect.radius) {
          const falloff = 1 - (distance / effect.radius);
          const smooth = falloff * falloff * (3 - 2 * falloff);

          if (effect.type === 'pinch_y') {
            const displacement = dy * intensity * smooth * 1.5;
            srcY += displacement * img.height; 
          }
          else if (effect.type === 'pinch_x') {
            const displacement = (nx - effect.centerX) * intensity * smooth * 1.5;
            srcX += displacement * img.width;
          }
          else if (effect.type === 'bulge') {
             const displacementX = dx * intensity * smooth * 0.5;
             const displacementY = dy * intensity * smooth * 0.5;
             srcX -= displacementX * img.width;
             srcY -= displacementY * img.height;
          }
        }
      }

      const sx = Math.max(0, Math.min(img.width - 1, Math.round(srcX)));
      const sy = Math.max(0, Math.min(img.height - 1, Math.round(srcY)));
      
      const srcIdx = (sy * img.width + sx) * 4;
      const dstIdx = (y * img.width + x) * 4;
      
      out[dstIdx] = data[srcIdx];
      out[dstIdx + 1] = data[srcIdx + 1];
      out[dstIdx + 2] = data[srcIdx + 2];
      out[dstIdx + 3] = data[srcIdx + 3];
    }
  }
  
  ctx.putImageData(outData, 0, 0);
  return canvas;
}

async function applyFrameTransformation(
  imageDataUrl: string,
  progress: number,
  frameIndex: number,
  riggerData: SmartRiggerData,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const originalImg = new Image();
    originalImg.onload = () => {
      // Step 1: Apply localized pixel distortions first
      const distortedImgCanvas = applyPixelDistortions(originalImg, riggerData.effects, frameIndex);

      // Step 2: Apply global canvas transformations
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      const padding = 150;
      canvas.width = originalImg.width + padding * 2;
      canvas.height = originalImg.height + padding * 2;
      
      const t = progress * Math.PI * 2;
      let rotateX = 0, rotateY = 0, rotateZ = 0;
      let translateX = 0, translateY = 0;
      let scaleX = 1, scaleY = 1;
      let shadowOffsetX = 0, shadowOffsetY = 0, shadowBlur = 0;
      let use3DRotation = false;
      let useWindDeformation = false;
      let anchorY = 0;

      const intensity = riggerData.globalIntensity;

      switch (riggerData.globalAnimation) {
        case 'wind':
          useWindDeformation = true;
          shadowOffsetY = 12;
          shadowBlur = 10;
          break;
        case 'breathe':
          const breathPhase = Math.sin(t);
          scaleY = 1 + breathPhase * 0.035 * intensity;
          scaleX = 1 - breathPhase * 0.015 * intensity;
          anchorY = originalImg.height / 2; 
          shadowOffsetY = 12;
          shadowBlur = 10 + breathPhase * 2;
          break;
        case 'rotate':
          rotateY = t * intensity;
          use3DRotation = true;
          translateY = Math.sin(t) * 10; 
          shadowOffsetX = Math.sin(rotateY) * 30;
          shadowOffsetY = 15;
          shadowBlur = 20 + Math.abs(Math.sin(t)) * 10;
          break;
        case 'jump':
          const jumpProgress = Math.sin(t);
          translateY = -Math.abs(jumpProgress) * 100 * intensity;
          rotateX = jumpProgress * 0.15;
          scaleY = 1 - Math.abs(jumpProgress) * 0.08; 
          scaleX = 1 + Math.abs(jumpProgress) * 0.04;
          shadowOffsetY = 25 + Math.abs(jumpProgress) * 40;
          shadowBlur = 15 + Math.abs(jumpProgress) * 25;
          break;
        case 'swing':
          const swingAngle = Math.sin(t) * 0.5 * intensity;
          rotateY = swingAngle;
          use3DRotation = swingAngle > 0.2 || swingAngle < -0.2;
          rotateZ = swingAngle * 0.3;
          translateX = Math.sin(t) * 20;
          shadowOffsetX = Math.sin(t) * 20;
          shadowOffsetY = 12;
          shadowBlur = 15;
          break;
        case 'fly':
          translateY = Math.sin(t) * 40 * intensity;
          translateX = Math.cos(t * 0.5) * 25;
          rotateZ = Math.sin(t) * 0.08;
          scaleX = scaleY = 1 + Math.sin(t) * 0.06;
          shadowOffsetY = 20 + Math.abs(Math.sin(t)) * 15;
          shadowBlur = 25;
          break;
        case 'bounce':
          const bounceProgress = Math.abs(Math.sin(t * 2));
          translateY = -bounceProgress * 80 * intensity;
          scaleY = 1 + (1 - bounceProgress) * 0.2; 
          scaleX = 1 - (1 - bounceProgress) * 0.1;
          shadowOffsetY = 20 + bounceProgress * 35;
          shadowBlur = 10 + bounceProgress * 20;
          break;
        case 'wave':
          const wave = Math.sin(t);
          scaleX = scaleY = 1 + wave * 0.1 * intensity;
          rotateZ = wave * 0.06;
          translateY = wave * 8;
          shadowOffsetY = 15;
          shadowBlur = 12;
          break;
        case 'none':
        default:
          shadowOffsetY = 12;
          shadowBlur = 10;
          break;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      if (shadowBlur > 0) {
        ctx.save();
        ctx.translate(centerX + translateX, centerY + translateY);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.filter = `blur(${shadowBlur}px)`;
        ctx.beginPath();
        ctx.ellipse(
          shadowOffsetX,
          shadowOffsetY + originalImg.height / 2,
          originalImg.width / 3,
          originalImg.height / 8,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.filter = 'none';
        ctx.restore();
      }

      ctx.save();
      ctx.translate(centerX + translateX, centerY + translateY);

      if (use3DRotation) {
        render3DRotation(ctx, distortedImgCanvas, rotateY, 0, 0);
      } else if (useWindDeformation) {
        renderWindEffect(ctx, distortedImgCanvas, progress, intensity, 0, 0);
      } else {
        if (Math.abs(rotateX) > 0.01) {
          ctx.scale(1, Math.cos(rotateX));
        }

        if (Math.abs(rotateZ) > 0.01) {
          ctx.rotate(rotateZ);
        }

        if (anchorY !== 0) {
          ctx.translate(0, anchorY);
          ctx.scale(scaleX, scaleY);
          ctx.translate(0, -anchorY);
        } else {
          ctx.scale(scaleX, scaleY);
        }

        ctx.drawImage(distortedImgCanvas, -originalImg.width / 2, -originalImg.height / 2);
      }

      ctx.restore();
      resolve(canvas.toDataURL("image/png"));
    };
    originalImg.onerror = () =>
      reject(new Error("Failed to load image for transformation"));
    originalImg.src = imageDataUrl;
  });
}

export function downloadFrame(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadAllFrames(
  frames: AnimationFrame[],
  baseName: string = "sprite",
): void {
  frames.forEach((frame, index) => {
    const paddedNumber = String(index + 1).padStart(3, "0");
    downloadFrame(frame.dataUrl, `${baseName}_frame_${paddedNumber}.png`);
  });
}

export async function createSpriteSheet(
  frames: AnimationFrame[],
): Promise<string> {
  if (frames.length === 0) {
    throw new Error("No frames to create sprite sheet");
  }

  return new Promise((resolve, reject) => {
    const firstImg = new Image();
    firstImg.onload = () => {
      const frameWidth = firstImg.width;
      const frameHeight = firstImg.height;
      const cols = Math.ceil(Math.sqrt(frames.length));
      const rows = Math.ceil(frames.length / cols);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      canvas.width = frameWidth * cols;
      canvas.height = frameHeight * rows;

      let loadedCount = 0;
      const images: HTMLImageElement[] = [];

      frames.forEach((frame, index) => {
        const img = new Image();
        img.onload = () => {
          images[index] = img;
          loadedCount++;

          if (loadedCount === frames.length) {
            images.forEach((image, idx) => {
              const col = idx % cols;
              const row = Math.floor(idx / cols);
              ctx.drawImage(image, col * frameWidth, row * frameHeight);
            });

            resolve(canvas.toDataURL("image/png"));
          }
        };
        img.onerror = () => reject(new Error(`Failed to load frame ${index}`));
        img.src = frame.dataUrl;
      });
    };
    firstImg.onerror = () => reject(new Error("Failed to load first frame"));
    firstImg.src = frames[0].dataUrl;
  });
}
