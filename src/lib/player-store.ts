'use client';

import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  duration: number;
  audioUrl: string;
  coverUrl: string;
  albumId: string | null;
  artistId: string;
  playCount: number;
  genre: string;
  artist: { id: string; name: string; imageUrl: string };
  album: { id: string; title: string; coverUrl: string } | null;
}

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  currentIndex: number;
  progress: number;
  volume: number;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  // Seek request: when set, the audio player should seek to this position
  seekRequest: number | null;

  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  setProgress: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: Track) => void;
  clearSeekRequest: () => void;
}

export const usePlayerStore = create<PlayerState>()((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  queue: [],
  currentIndex: -1,
  progress: 0,
  volume: 0.7,
  shuffle: false,
  repeat: 'off',
  seekRequest: null,

  playTrack: (track, queue) => {
    const state = get();

    if (queue) {
      const index = queue.findIndex((t) => t.id === track.id);
      set({
        currentTrack: track,
        isPlaying: true,
        queue,
        currentIndex: index >= 0 ? index : 0,
        progress: 0,
        seekRequest: 0,
      });
    } else if (state.queue.length > 0) {
      const index = state.queue.findIndex((t) => t.id === track.id);
      if (index >= 0) {
        set({
          currentTrack: track,
          isPlaying: true,
          currentIndex: index,
          progress: 0,
          seekRequest: 0,
        });
      } else {
        const newQueue = [...state.queue];
        const insertIndex = state.currentIndex + 1;
        newQueue.splice(insertIndex, 0, track);
        set({
          currentTrack: track,
          isPlaying: true,
          queue: newQueue,
          currentIndex: insertIndex,
          progress: 0,
          seekRequest: 0,
        });
      }
    } else {
      set({
        currentTrack: track,
        isPlaying: true,
        queue: [track],
        currentIndex: 0,
        progress: 0,
        seekRequest: 0,
      });
    }
  },

  togglePlay: () => {
    set((state) => ({ isPlaying: !state.isPlaying }));
  },

  pause: () => {
    set({ isPlaying: false });
  },

  resume: () => {
    const state = get();
    if (state.currentTrack) {
      set({ isPlaying: true });
    }
  },

  next: () => {
    const state = get();
    if (state.queue.length === 0) return;

    // Repeat one: replay the same track from the beginning
    if (state.repeat === 'one') {
      set({ progress: 0, isPlaying: true, seekRequest: 0 });
      return;
    }

    let nextIndex: number;

    if (state.shuffle) {
      if (state.queue.length <= 1) {
        nextIndex = 0;
      } else {
        do {
          nextIndex = Math.floor(Math.random() * state.queue.length);
        } while (nextIndex === state.currentIndex);
      }
    } else {
      nextIndex = state.currentIndex + 1;

      if (nextIndex >= state.queue.length) {
        if (state.repeat === 'all') {
          nextIndex = 0;
        } else {
          set({ isPlaying: false, progress: 0, seekRequest: 0 });
          return;
        }
      }
    }

    set({
      currentTrack: state.queue[nextIndex],
      currentIndex: nextIndex,
      progress: 0,
      isPlaying: true,
      seekRequest: 0,
    });
  },

  previous: () => {
    const state = get();
    if (state.queue.length === 0) return;

    // If more than 3 seconds into the track, restart it
    if (state.progress > 3) {
      set({ progress: 0, isPlaying: true, seekRequest: 0 });
      return;
    }

    let prevIndex: number;

    if (state.shuffle) {
      if (state.queue.length <= 1) {
        prevIndex = 0;
      } else {
        do {
          prevIndex = Math.floor(Math.random() * state.queue.length);
        } while (prevIndex === state.currentIndex);
      }
    } else {
      prevIndex = state.currentIndex - 1;

      if (prevIndex < 0) {
        if (state.repeat === 'all') {
          prevIndex = state.queue.length - 1;
        } else {
          prevIndex = 0;
        }
      }
    }

    set({
      currentTrack: state.queue[prevIndex],
      currentIndex: prevIndex,
      progress: 0,
      isPlaying: true,
      seekRequest: 0,
    });
  },

  setProgress: (seconds) => {
    set({ progress: seconds });
  },

  setVolume: (vol) => {
    set({ volume: Math.max(0, Math.min(1, vol)) });
  },

  toggleShuffle: () => {
    set((state) => ({ shuffle: !state.shuffle }));
  },

  toggleRepeat: () => {
    set((state) => {
      const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one'];
      const currentModeIndex = modes.indexOf(state.repeat);
      const nextMode = modes[(currentModeIndex + 1) % modes.length];
      return { repeat: nextMode };
    });
  },

  addToQueue: (track) => {
    set((state) => {
      const exists = state.queue.some((t) => t.id === track.id);
      if (exists) {
        return state;
      }
      return { queue: [...state.queue, track] };
    });
  },

  clearSeekRequest: () => {
    set({ seekRequest: null });
  },
}));
