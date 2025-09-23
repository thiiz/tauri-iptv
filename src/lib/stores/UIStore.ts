import { create } from 'zustand';

interface UIStore {
  // UI State
  currentView: 'dashboard' | 'channels' | 'movies' | 'shows' | 'settings';
  selectedCategory: string | null;
  isLoading: boolean;
  error: string | null;

  // Player State
  currentStream: {
    type: 'channel' | 'movie' | 'episode';
    id: string;
    name: string;
    url: string;
  } | null;
  isPlaying: boolean;

  // Actions
  setCurrentView: (
    view: 'dashboard' | 'channels' | 'movies' | 'shows' | 'settings'
  ) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentStream: (stream: UIStore['currentStream']) => void;
  setPlaying: (playing: boolean) => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  // Initial state
  currentView: 'dashboard',
  selectedCategory: null,
  isLoading: false,
  error: null,
  currentStream: null,
  isPlaying: false,

  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setCurrentStream: (stream) => set({ currentStream: stream }),
  setPlaying: (playing) => set({ isPlaying: playing })
}));
