import React, { useState, useRef, useEffect } from 'react';
import { 
  convertToSprite, 
  rotateSprite, 
  analyzeSpriteWithAI,
  generateFramesFromRiggerData,
  downloadFrame,
  downloadAllFrames,
  createSpriteSheet,
  AnimationFrame,
  SmartRiggerData,
  DistortionEffect
} from '../services/spriteAnimationService';
import { UploadIcon, SparklesIcon } from './Icons';

// Subcomponent for the Draggable Anchor
const DraggableAnchor: React.FC<{
  effect: DistortionEffect;
  index: number;
  imgRect: DOMRect | null;
  onChange: (newEffect: DistortionEffect) => void;
}> = ({ effect, index, imgRect, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || !imgRect) return;
      
      // Calculate normalized coordinates
      let x = (e.clientX - imgRect.left) / imgRect.width;
      let y = (e.clientY - imgRect.top) / imgRect.height;
      
      // Clamp between 0 and 1
      x = Math.max(0, Math.min(1, x));
      y = Math.max(0, Math.min(1, y));
      
      onChange({ ...effect, centerX: x, centerY: y });
    };

    const handlePointerUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, imgRect, effect, onChange]);

  if (!imgRect) return null;

  const left = effect.centerX * 100 + '%';
  const top = effect.centerY * 100 + '%';
  const radiusPx = effect.radius * imgRect.width;

  // Colors based on effect type
  const color = effect.type === 'bulge' ? '59, 130, 246' : '239, 68, 68'; // Blue for bulge, Red for pinch

  return (
    <>
      {/* Target Radius Circle */}
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width: radiusPx * 2,
          height: radiusPx * 2,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          border: `2px dashed rgba(${color}, 0.6)`,
          backgroundColor: `rgba(${color}, 0.15)`,
          pointerEvents: 'none'
        }}
      />
      {/* Draggable Dot */}
      <div
        onPointerDown={handlePointerDown}
        style={{
          position: 'absolute',
          left,
          top,
          transform: 'translate(-50%, -50%)',
          width: 24,
          height: 24,
          backgroundColor: `rgb(${color})`,
          border: '3px solid white',
          borderRadius: '50%',
          cursor: isDragging ? 'grabbing' : 'grab',
          boxShadow: '0 0 15px rgba(0,0,0,0.5)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '10px',
          fontWeight: 'bold'
        }}
        title={`Arraste para ajustar o centro. Efeito: ${effect.type}`}
      >
        {index + 1}
      </div>
    </>
  );
};

const AnimatedSpriteGenerator: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [spriteDataUrl, setSpriteDataUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [rotatedSpriteUrl, setRotatedSpriteUrl] = useState<string | null>(null);
  const [animationPrompt, setAnimationPrompt] = useState<string>('');
  const [frameCount, setFrameCount] = useState<8 | 10 | 12>(10);
  
  // New States for 2-step process
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [adjustmentMode, setAdjustmentMode] = useState(false);
  const [riggerData, setRiggerData] = useState<SmartRiggerData | null>(null);
  const [imgRect, setImgRect] = useState<DOMRect | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [generatedFrames, setGeneratedFrames] = useState<AnimationFrame[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(100);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationIntervalRef = useRef<number | null>(null);

  // Update Image Rect for anchor positioning
  const updateImgRect = () => {
    if (imgRef.current) {
      setImgRect(imgRef.current.getBoundingClientRect());
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateImgRect);
    return () => window.removeEventListener('resize', updateImgRect);
  }, []);

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processImageFile(e.target.files[0]);
    }
  };

  const processImageFile = async (file: File) => {
    setIsProcessing(true);
    try {
      setOriginalImage(file);
      const spriteUrl = await convertToSprite(file);
      setSpriteDataUrl(spriteUrl);
      setRotatedSpriteUrl(spriteUrl);
      setRotation(0);
      setGeneratedFrames([]);
      setAdjustmentMode(false);
      setRiggerData(null);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        await processImageFile(file);
      } else {
        alert('Please upload an image file (PNG, JPG, WebP)');
      }
    }
  };

  useEffect(() => {
    if (spriteDataUrl && rotation !== 0) {
      rotateSprite(spriteDataUrl, rotation).then(setRotatedSpriteUrl);
    } else if (spriteDataUrl) {
      setRotatedSpriteUrl(spriteDataUrl);
    }
  }, [rotation, spriteDataUrl]);

  // Step 1: Analyze Image
  const handleAnalyzeSprite = async () => {
    if (!rotatedSpriteUrl || !animationPrompt.trim()) {
      alert('Por favor, faça upload de uma imagem e digite um prompt.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const data = await analyzeSpriteWithAI(rotatedSpriteUrl, animationPrompt, frameCount);
      setRiggerData(data);
      setAdjustmentMode(true);
      // Wait for React to render the image in adjustment mode, then grab bounds
      setTimeout(updateImgRect, 100);
    } catch (error: any) {
      console.error('Error analyzing sprite:', error);
      alert(error.message || 'Falha ao analisar a imagem com a IA.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2: Generate Final Animation
  const handleGenerateFinalFrames = async () => {
    if (!rotatedSpriteUrl || !riggerData) return;

    setIsGenerating(true);
    try {
      const frames = await generateFramesFromRiggerData(rotatedSpriteUrl, frameCount, riggerData);
      setGeneratedFrames(frames);
      setCurrentFrameIndex(0);
      setAdjustmentMode(false);
      setIsPlaying(true);
    } catch (error: any) {
      console.error('Error generating frames:', error);
      alert(error.message || 'Falha ao gerar animação.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Update a specific effect's radius
  const updateEffectRadius = (index: number, newRadius: number) => {
    if (!riggerData) return;
    const newEffects = [...riggerData.effects];
    newEffects[index] = { ...newEffects[index], radius: newRadius };
    setRiggerData({ ...riggerData, effects: newEffects });
  };

  // Animation playback
  useEffect(() => {
    if (isPlaying && generatedFrames.length > 0) {
      animationIntervalRef.current = window.setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % generatedFrames.length);
      }, animationSpeed);
    } else {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    }
    return () => {
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
    };
  }, [isPlaying, generatedFrames.length, animationSpeed]);

  const handleDownloadSpriteSheet = async () => {
    if (generatedFrames.length === 0) return;
    try {
      const spriteSheetUrl = await createSpriteSheet(generatedFrames);
      downloadFrame(spriteSheetUrl, 'sprite_sheet.png');
    } catch (error) {
      console.error('Error creating sprite sheet:', error);
      alert('Failed to create sprite sheet');
    }
  };

  const promptExamples = [
    'cabelo balançando com o vento',
    'piscada de olho, olho na parte superior',
    'respiração natural do peito',
    'movimento leve do corpo todo',
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <SparklesIcon />
          </div>
          Gerador de Sprites (Smart Rigger)
        </h2>
        <p className="text-slate-400">
          Animador com Correção Visual. A IA chuta os pontos, você ajusta se precisar!
        </p>
      </div>

      {!spriteDataUrl ? (
        <div
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-12 transition-all duration-200 cursor-pointer min-h-[400px]
            ${dragActive 
              ? 'border-purple-500 bg-purple-500/10' 
              : 'border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-xl">
            <UploadIcon />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-2">Upload uma Imagem</h3>
          <p className="text-slate-400 text-center max-w-md">
            Arraste e solte sua imagem aqui, ou clique para selecionar
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Sprite Preview / Adjustments */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {adjustmentMode ? "⚠️ Ajuste Fino das Âncoras" : "Preview do Sprite"}
              </h3>
              <div className="bg-slate-950 rounded-xl p-4 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%,transparent_75%,#1e293b_75%,#1e293b),linear-gradient(45deg,#1e293b_25%,transparent_25%,transparent_75%,#1e293b_75%,#1e293b)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] opacity-20"></div>
                
                {rotatedSpriteUrl && (
                  <div className="relative inline-flex items-center justify-center" style={{ maxWidth: '100%', maxHeight: '400px' }}>
                    <img
                      ref={imgRef}
                      src={rotatedSpriteUrl}
                      alt="Sprite"
                      onLoad={updateImgRect}
                      className="max-w-full max-h-[400px] object-contain relative z-10"
                    />
                    
                    {/* Render Draggable Anchors only in Adjustment Mode */}
                    {adjustmentMode && riggerData?.effects.map((effect, idx) => (
                      <DraggableAnchor
                        key={idx}
                        index={idx}
                        effect={effect}
                        imgRect={imgRect}
                        onChange={(newEffect) => {
                          const newEffects = [...riggerData.effects];
                          newEffects[idx] = newEffect;
                          setRiggerData({ ...riggerData, effects: newEffects });
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Radius Adjustment Controls */}
              {adjustmentMode && riggerData && riggerData.effects.length > 0 && (
                <div className="mt-6 space-y-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <h4 className="text-sm font-bold text-white mb-2">Ajustar Tamanho da Área (Raio)</h4>
                  {riggerData.effects.map((effect, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Âncora {idx + 1} ({effect.type})</span>
                        <span>{Math.round(effect.radius * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.01"
                        max="0.5"
                        step="0.01"
                        value={effect.radius}
                        onChange={(e) => updateEffectRadius(idx, parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                  ))}
                  <p className="text-xs text-yellow-400 mt-2">Dica: Arraste a bolinha vermelha na imagem para ajustar a posição.</p>
                </div>
              )}

              {!adjustmentMode && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-300">Rotação</label>
                    <span className="text-sm text-purple-400 font-mono">{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Controls */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Geração de Animação</h3>

              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-slate-300">Descreva a animação (dê dicas espaciais)</label>
                <textarea
                  value={animationPrompt}
                  onChange={(e) => setAnimationPrompt(e.target.value)}
                  placeholder="Ex: piscada de olho, o olho fica na parte superior esquerda..."
                  disabled={adjustmentMode}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none disabled:opacity-50"
                  rows={3}
                />
                {!adjustmentMode && (
                  <div className="flex flex-wrap gap-2">
                    {promptExamples.map((example) => (
                      <button
                        key={example}
                        onClick={() => setAnimationPrompt(example)}
                        className="text-xs px-3 py-1 bg-slate-800 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 rounded-full transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!adjustmentMode ? (
                <button
                  onClick={handleAnalyzeSprite}
                  disabled={isAnalyzing || !animationPrompt.trim()}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Analisando com Inteligência Artificial...
                    </>
                  ) : (
                    <>
                      <SparklesIcon />
                      1. Mapear Movimentos (IA)
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <h4 className="text-green-400 font-semibold mb-1 flex items-center gap-2">
                      <span className="text-xl">✅</span> IA Concluiu a Análise
                    </h4>
                    <p className="text-sm text-slate-300">
                      Revise os pontos na imagem. Se algo estiver fora do lugar, <b>arraste com o mouse</b>.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleGenerateFinalFrames}
                    disabled={isGenerating}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 text-lg"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processando Pixels...
                      </>
                    ) : (
                      <>
                        <SparklesIcon />
                        2. Gerar GIF Animado
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setAdjustmentMode(false)}
                    className="w-full px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors text-sm"
                  >
                    Cancelar e Editar Texto
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Animation Preview */}
      {generatedFrames.length > 0 && !adjustmentMode && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">Preview Final Animado</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-slate-950 rounded-xl p-4 flex items-center justify-center min-h-[300px] relative overflow-hidden border border-slate-800 shadow-inner">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%,transparent_75%,#1e293b_75%,#1e293b),linear-gradient(45deg,#1e293b_25%,transparent_25%,transparent_75%,#1e293b_75%,#1e293b)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] opacity-20"></div>
                <img
                  src={generatedFrames[currentFrameIndex].dataUrl}
                  alt={`Frame ${currentFrameIndex + 1}`}
                  className="max-w-full max-h-[300px] object-contain relative z-10 drop-shadow-2xl"
                />
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium"
                  >
                    {isPlaying ? '⏸ Pausar' : '▶️ Reproduzir'}
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-300">Velocidade</label>
                    <span className="text-sm text-purple-400 font-mono">{animationSpeed}ms</span>
                  </div>
                  <input type="range" min="30" max="300" step="10" value={animationSpeed} onChange={(e) => setAnimationSpeed(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-white">Opções de Download</h4>
              <button onClick={() => downloadAllFrames(generatedFrames, 'sprite')} className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg">Baixar Sequência (PNGs)</button>
              <button onClick={handleDownloadSpriteSheet} className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg">Baixar Sprite Sheet (Grid)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimatedSpriteGenerator;
