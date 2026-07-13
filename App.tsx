import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'react-hot-toast';

import Dashboard from './components/Dashboard';
import FrameSnap from './components/FrameSnap';
import VideoBackgroundRemover from './components/VideoBackgroundRemover';
import SmartWarpTool from './components/SmartWarpTool';
import PixelArtGenerator from './components/PixelArtGenerator';
import AnimatedSpriteGenerator from './components/AnimatedSpriteGenerator';
import ImageEnhancer from './components/ImageEnhancer';
import AnimationMaker from './components/AnimationMaker';
import BatchBackgroundRemover from './components/BatchBackgroundRemover';

const App: React.FC = () => {
  const { t } = useTranslation();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />
        
        {/* Navbar */}
        <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center gap-3 cursor-pointer group">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 group-hover:to-white transition-all truncate">
                  {t('app.title')}
                </h1>
              </Link>
              <div className="hidden md:block text-sm text-slate-500 font-medium">
                {t('app.subtitle')}
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/framesnap" element={<FrameSnap />} />
            
            <Route path="/bg-remover" element={
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <Link to="/" className="hover:text-emerald-400 cursor-pointer transition-colors">Home</Link>
                  <span>/</span>
                  <span className="text-emerald-400">BG Remover</span>
                </div>
                <VideoBackgroundRemover />
              </div>
            } />

            <Route path="/smart-warp" element={
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <Link to="/" className="hover:text-amber-400 cursor-pointer transition-colors">Home</Link>
                  <span>/</span>
                  <span className="text-amber-400">Smart Warp Engine</span>
                </div>
                <SmartWarpTool />
              </div>
            } />

            <Route path="/pixel-art" element={
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <Link to="/" className="hover:text-pink-400 cursor-pointer transition-colors">Home</Link>
                  <span>/</span>
                  <span className="text-pink-400">Pixel Art Studio</span>
                </div>
                <PixelArtGenerator />
              </div>
            } />

            <Route path="/sprite-animator" element={
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <Link to="/" className="hover:text-purple-400 cursor-pointer transition-colors">Home</Link>
                  <span>/</span>
                  <span className="text-purple-400">Sprite Animator AI</span>
                </div>
                <AnimatedSpriteGenerator />
              </div>
            } />

            <Route path="/image-enhancer" element={
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <Link to="/" className="hover:text-cyan-400 cursor-pointer transition-colors">Home</Link>
                  <span>/</span>
                  <span className="text-cyan-400">Image Enhancer HD</span>
                </div>
                <ImageEnhancer />
              </div>
            } />

            <Route path="/animation-maker" element={
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <Link to="/" className="hover:text-rose-400 cursor-pointer transition-colors">Home</Link>
                  <span>/</span>
                  <span className="text-rose-400">Animation Maker</span>
                </div>
                <AnimationMaker />
              </div>
            } />

            <Route path="/batch-bg-remover" element={
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <Link to="/" className="hover:text-indigo-400 cursor-pointer transition-colors">Home</Link>
                  <span>/</span>
                  <span className="text-indigo-400">Batch BG Remover</span>
                </div>
                <BatchBackgroundRemover />
              </div>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;