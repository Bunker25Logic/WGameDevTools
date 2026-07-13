import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import VideoWorkspace from './VideoWorkspace';
import FrameGallery from './FrameGallery';
import { UploadIcon } from './Icons';
import { useAppStore } from '../store/useAppStore';
import { analyzeFrame } from '../services/geminiService';
import toast from 'react-hot-toast';
import { CapturedFrame } from '../types';

const FrameSnap: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const { videoFile, setVideoFile, frames, addFrame, deleteFrame, updateFrame } = useAppStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
      } else {
        toast.error("Please upload a video file.");
      }
    }
  };

  const handleAnalyzeFrame = async (id: string) => {
    const frameToAnalyze = frames.find(f => f.id === id);
    if (!frameToAnalyze) return;

    updateFrame(id, { isAnalyzing: true });
    
    const toastId = toast.loading('Analyzing frame with AI...');

    try {
      const analysis = await analyzeFrame(frameToAnalyze.dataUrl);
      updateFrame(id, { isAnalyzing: false, analysis });
      toast.success('Frame analyzed successfully!', { id: toastId });
    } catch (error) {
      console.error(error);
      updateFrame(id, { isAnalyzing: false, analysis: "Analysis failed." });
      toast.error('Failed to analyze frame.', { id: toastId });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
        <Link to="/" className="hover:text-indigo-400 cursor-pointer transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-indigo-400">FrameSnap AI</span>
      </div>

      <section className="min-h-[300px] sm:min-h-[400px] md:min-h-[500px] flex flex-col">
        {!videoFile ? (
          <div 
            className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer px-4
              ${dragActive 
                ? 'border-indigo-500 bg-indigo-500/10' 
                : 'border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900'
              }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('video-upload')?.click()}
          >
            <input 
              id="video-upload"
              type="file" 
              accept="video/*" 
              className="hidden" 
              onChange={handleFileChange}
            />
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-xl">
              <UploadIcon />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2 text-center">Upload a Video</h3>
            <p className="text-slate-400 text-center max-w-sm text-sm sm:text-base">
              Drag and drop your video here, or click to browse. 
              <br />
              <span className="text-xs mt-2 block text-slate-600">Supports MP4, WebM, MOV</span>
            </p>
          </div>
        ) : (
          <VideoWorkspace 
            videoFile={videoFile} 
            onClose={() => setVideoFile(null)} 
            onCapture={addFrame}
          />
        )}
      </section>

      {frames.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
              Captured Frames
              <span className="text-sm font-normal text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
                {frames.length}
              </span>
            </h2>
          </div>
          <FrameGallery 
            frames={frames} 
            onDelete={deleteFrame}
            onAnalyze={handleAnalyzeFrame}
          />
        </section>
      )}
    </div>
  );
};

export default FrameSnap;
