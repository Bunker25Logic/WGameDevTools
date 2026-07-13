import { create } from 'zustand';
import { CapturedFrame } from '../types';

interface AppState {
  videoFile: File | null;
  frames: CapturedFrame[];
  setVideoFile: (file: File | null) => void;
  addFrame: (frame: CapturedFrame) => void;
  deleteFrame: (id: string) => void;
  updateFrame: (id: string, update: Partial<CapturedFrame>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  videoFile: null,
  frames: [],
  setVideoFile: (file) => set({ videoFile: file }),
  addFrame: (frame) => set((state) => ({ frames: [frame, ...state.frames] })),
  deleteFrame: (id) => set((state) => ({ frames: state.frames.filter(f => f.id !== id) })),
  updateFrame: (id, update) => set((state) => ({
    frames: state.frames.map(f => f.id === id ? { ...f, ...update } : f)
  }))
}));
