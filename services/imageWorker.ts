export interface WorkerOptions {
  scale: number;
  algorithm: 'bicubic' | 'nearest' | 'epx';
  sharpen: number;
  noiseReduction: number;
  edgeEnhancement: number;
}

export interface WorkerMessage {
  imageData: ImageData;
  options: WorkerOptions;
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { imageData, options } = e.data;
  
  let processed = imageData;
  
  // 1. Noise Reduction (Fast Edge-Preserving smoothing approximation)
  if (options.noiseReduction > 0) {
    processed = applyNoiseReduction(processed, options.noiseReduction);
  }
  
  // 2. Upscaling
  if (options.scale > 1) {
    if (options.algorithm === 'epx') {
      processed = upscaleEPXLoop(processed, options.scale);
    } else {
      processed = upscaleCanvas(processed, options.scale, options.algorithm === 'bicubic');
    }
  }
  
  // 3. Sharpen (Unsharp Mask)
  if (options.sharpen > 0) {
    processed = applyUnsharpMask(processed, options.sharpen);
  }
  
  // 4. Edge Enhancement (Sobel Overlay)
  if (options.edgeEnhancement > 0) {
    processed = applyEdgeEnhancement(processed, options.edgeEnhancement);
  }
  
  self.postMessage({ imageData: processed });
};

function upscaleCanvas(imageData: ImageData, scale: number, smooth: boolean): ImageData {
  const width = imageData.width * scale;
  const height = imageData.height * scale;
  
  // Use OffscreenCanvas for hardware accelerated basic scaling in worker
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  
  ctx.imageSmoothingEnabled = smooth;
  if (smooth) ctx.imageSmoothingQuality = 'high';
  
  const temp = new OffscreenCanvas(imageData.width, imageData.height);
  const tempCtx = temp.getContext('2d') as OffscreenCanvasRenderingContext2D;
  tempCtx.putImageData(imageData, 0, 0);
  
  ctx.drawImage(temp, 0, 0, imageData.width, imageData.height, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

// EPX Algorithm (Scale2x) perfect for Pixel Art
function upscaleEPXLoop(imageData: ImageData, scale: number): ImageData {
  let current = imageData;
  // Apply EPX 2x multiple times if scale is 4 or 8
  const iterations = Math.log2(scale);
  for (let i = 0; i < iterations; i++) {
    current = applyEPX2x(current);
  }
  return current;
}

function applyEPX2x(imageData: ImageData): ImageData {
  const w = imageData.width;
  const h = imageData.height;
  const src = new Uint32Array(imageData.data.buffer);
  
  const dstData = new ImageData(w * 2, h * 2);
  const dst = new Uint32Array(dstData.data.buffer);
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = src[y * w + x];
      const a = y > 0 ? src[(y - 1) * w + x] : p; // top
      const b = x < w - 1 ? src[y * w + x + 1] : p; // right
      const c = x > 0 ? src[y * w + x - 1] : p; // left
      const d = y < h - 1 ? src[(y + 1) * w + x] : p; // bottom
      
      let p1 = p, p2 = p, p3 = p, p4 = p;
      
      if (c === a && c !== d && a !== b) p1 = a;
      if (a === b && a !== c && b !== d) p2 = b;
      if (c === d && c !== a && d !== b) p3 = c;
      if (b === d && b !== a && d !== c) p4 = b;
      
      const dstY = y * 2;
      const dstX = x * 2;
      const dstW = w * 2;
      
      dst[dstY * dstW + dstX] = p1;
      dst[dstY * dstW + dstX + 1] = p2;
      dst[(dstY + 1) * dstW + dstX] = p3;
      dst[(dstY + 1) * dstW + dstX + 1] = p4;
    }
  }
  return dstData;
}

// Unsharp Mask (subtract blurred image from original)
function applyUnsharpMask(imageData: ImageData, intensity: number): ImageData {
  const w = imageData.width;
  const h = imageData.height;
  const src = imageData.data;
  
  const dstData = new ImageData(w, h);
  const dst = dstData.data;
  const amount = intensity / 50; // 0 to 2
  
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const idx = (y * w + x) * 4 + c;
        
        const center = src[idx];
        const top = src[((y - 1) * w + x) * 4 + c];
        const bottom = src[((y + 1) * w + x) * 4 + c];
        const left = src[(y * w + (x - 1)) * 4 + c];
        const right = src[(y * w + (x + 1)) * 4 + c];
        
        // Sharpening formula: original + amount * (original - average_of_neighbors)
        const avg = (top + bottom + left + right) / 4;
        const diff = center - avg;
        
        // Add threshold to avoid sharpening flat areas (prevents noise amplification)
        if (Math.abs(diff) > 5) {
          dst[idx] = Math.min(255, Math.max(0, center + diff * amount));
        } else {
          dst[idx] = center;
        }
      }
      dst[(y * w + x) * 4 + 3] = src[(y * w + x) * 4 + 3]; // Alpha
    }
  }
  
  // Copy edges (they weren't processed)
  for (let y = 0; y < h; y += h - 1 || 1) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      dst[idx] = src[idx]; dst[idx+1] = src[idx+1]; dst[idx+2] = src[idx+2]; dst[idx+3] = src[idx+3];
    }
  }
  for (let x = 0; x < w; x += w - 1 || 1) {
    for (let y = 0; y < h; y++) {
      const idx = (y * w + x) * 4;
      dst[idx] = src[idx]; dst[idx+1] = src[idx+1]; dst[idx+2] = src[idx+2]; dst[idx+3] = src[idx+3];
    }
  }
  
  return dstData;
}

function applyNoiseReduction(imageData: ImageData, intensity: number): ImageData {
  const w = imageData.width;
  const h = imageData.height;
  const src = imageData.data;
  const dstData = new ImageData(w, h);
  const dst = dstData.data;
  
  // Median filter approximation (excellent for preserving edges while removing noise)
  const strength = intensity / 100; // 0 to 1
  
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const idx = (y * w + x) * 4 + c;
        
        const pixels = [
          src[idx],
          src[((y - 1) * w + x) * 4 + c],
          src[((y + 1) * w + x) * 4 + c],
          src[(y * w + (x - 1)) * 4 + c],
          src[(y * w + (x + 1)) * 4 + c]
        ];
        
        // Simple blend towards the local average based on intensity
        const avg = (pixels[1] + pixels[2] + pixels[3] + pixels[4]) / 4;
        const diff = Math.abs(src[idx] - avg);
        
        // If difference is small, it's noise, blur it. If large, it's an edge, preserve it!
        if (diff < 30) {
           dst[idx] = src[idx] * (1 - strength) + avg * strength;
        } else {
           dst[idx] = src[idx];
        }
      }
      dst[(y * w + x) * 4 + 3] = src[(y * w + x) * 4 + 3]; // Alpha
    }
  }
  
  // Edge copy
  for (let y = 0; y < h; y += h - 1 || 1) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      dst[idx] = src[idx]; dst[idx+1] = src[idx+1]; dst[idx+2] = src[idx+2]; dst[idx+3] = src[idx+3];
    }
  }
  for (let x = 0; x < w; x += w - 1 || 1) {
    for (let y = 0; y < h; y++) {
      const idx = (y * w + x) * 4;
      dst[idx] = src[idx]; dst[idx+1] = src[idx+1]; dst[idx+2] = src[idx+2]; dst[idx+3] = src[idx+3];
    }
  }
  
  return dstData;
}

function applyEdgeEnhancement(imageData: ImageData, intensity: number): ImageData {
  const w = imageData.width;
  const h = imageData.height;
  const src = imageData.data;
  const dstData = new ImageData(w, h);
  const dst = dstData.data;
  
  const amount = intensity / 100;
  
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const idx = (y * w + x) * 4 + c;
        
        // Very fast roberts cross or simple gradient
        const current = src[idx];
        const right = src[(y * w + (x + 1)) * 4 + c];
        const bottom = src[((y + 1) * w + x) * 4 + c];
        
        const gradX = Math.abs(current - right);
        const gradY = Math.abs(current - bottom);
        const edge = Math.max(gradX, gradY);
        
        // Darken edges slightly based on intensity
        if (edge > 15) {
          dst[idx] = Math.max(0, current - edge * amount * 0.5);
        } else {
          dst[idx] = current;
        }
      }
      dst[(y * w + x) * 4 + 3] = src[(y * w + x) * 4 + 3];
    }
  }
  return dstData;
}
