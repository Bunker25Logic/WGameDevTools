export interface EnhancementOptions {
  scale?: number; // 1, 2, 4, 8
  algorithm?: 'bicubic' | 'nearest' | 'epx';
  sharpen?: number; // 0-100
  noiseReduction?: number; // 0-100
  contrast?: number; // 0-100
  edgeEnhancement?: number; // 0-100
  colorVibrance?: number; // 0-100
}

export interface ProcessedImage {
  dataUrl: string;
  width: number;
  height: number;
  processingTime: number;
}

/**
 * Process image with hardware accelerated filters and Web Worker for heavy tasks
 */
export async function processImage(
  imageFile: File,
  options: EnhancementOptions
): Promise<ProcessedImage> {
  const startTime = performance.now();
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      img.onload = () => {
        try {
          const maxDimension = 4096; // Max 4K resolution
          const maxInputDimension = 2048; // Max input before auto-resize
          
          let sourceWidth = img.width;
          let sourceHeight = img.height;
          const scale = options.scale || 1;
          
          // Auto-resize large images to prevent memory errors
          if (sourceWidth > maxInputDimension || sourceHeight > maxInputDimension) {
            const ratio = Math.min(maxInputDimension / sourceWidth, maxInputDimension / sourceHeight);
            sourceWidth = Math.floor(sourceWidth * ratio);
            sourceHeight = Math.floor(sourceHeight * ratio);
            console.log(`Imagem redimensionada para ${sourceWidth}x${sourceHeight} para processamento`);
          }
          
          // Validate final size
          if (sourceWidth * scale > maxDimension || sourceHeight * scale > maxDimension) {
            reject(new Error(
              `Imagem muito grande para upscale ${scale}x. Dimensão máxima: ${maxDimension}px. ` +
              `Sua imagem resultaria em ${sourceWidth * scale}x${sourceHeight * scale}px. ` +
              `Tente uma escala menor.`
            ));
            return;
          }
          
          // 1. Initial Canvas (apply GPU filters for contrast/color instantly)
          const canvas = document.createElement('canvas');
          canvas.width = sourceWidth;
          canvas.height = sourceHeight;
          const ctx = canvas.getContext('2d')!;
          
          // Apply native GPU filters for color and contrast
          const contrast = options.contrast ? 100 + options.contrast : 100;
          const saturate = options.colorVibrance ? 100 + options.colorVibrance : 100;
          ctx.filter = `contrast(${contrast}%) saturate(${saturate}%)`;
          
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, sourceWidth, sourceHeight);
          
          const imageData = ctx.getImageData(0, 0, sourceWidth, sourceHeight);
          
          // 2. Send to Web Worker for CPU-intensive operations (EPX, Sharpen, Noise)
          const worker = new Worker(new URL('./imageWorker.ts', import.meta.url), { type: 'module' });
          
          worker.onmessage = (event: MessageEvent<{ imageData: ImageData }>) => {
            const finalImageData = event.data.imageData;
            
            // 3. Draw final result to canvas and resolve
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = finalImageData.width;
            finalCanvas.height = finalImageData.height;
            const finalCtx = finalCanvas.getContext('2d')!;
            
            finalCtx.putImageData(finalImageData, 0, 0);
            
            const processingTime = performance.now() - startTime;
            resolve({
              dataUrl: finalCanvas.toDataURL('image/png'),
              width: finalImageData.width,
              height: finalImageData.height,
              processingTime,
            });
            
            worker.terminate();
          };
          
          worker.onerror = (error) => {
            worker.terminate();
            reject(error);
          };
          
          worker.postMessage({
            imageData,
            options: {
              scale: options.scale || 1,
              algorithm: options.algorithm || 'bicubic',
              sharpen: options.sharpen || 0,
              noiseReduction: options.noiseReduction || 0,
              edgeEnhancement: options.edgeEnhancement || 0
            }
          });
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Download processed image
 */
export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
