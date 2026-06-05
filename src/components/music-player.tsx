'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  Heart,
  Loader2,
} from 'lucide-react';
import { usePlayerStore } from '@/lib/player-store';
import { formatDuration } from '@/lib/types';

// Unlock audio on first user interaction to bypass autoplay policy
let audioUnlocked = false;
function unlockAudio(audio: HTMLAudioElement) {
  if (audioUnlocked) return;
  const unlock = () => {
    if (audioUnlocked) return;
    audioUnlocked = true;
    // Play a silent source to unlock
    const originalSrc = audio.src;
    audio.src = '';
    audio.play().catch(() => {}).finally(() => {
      if (originalSrc) audio.src = originalSrc;
    });
    document.removeEventListener('click', unlock);
    document.removeEventListener('keydown', unlock);
  };
  document.addEventListener('click', unlock, { once: true });
  document.addEventListener('keydown', unlock, { once: true });
}

export default function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    progress,
    volume,
    shuffle,
    repeat,
    seekRequest,
    togglePlay,
    next,
    previous,
    setProgress,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    clearSeekRequest,
  } = usePlayerStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playerLiked, setPlayerLiked] = useState(false);
  const isSeekingRef = useRef(false);
  const prevTrackIdRef = useRef<string | null>(null);
  const playAttemptRef = useRef(false);

  // Check like status when track changes
  useEffect(() => {
    if (!currentTrack) return;
    const sessionId = typeof window !== 'undefined' ? localStorage.getItem('melody_session_id') : null;
    if (sessionId) {
      fetch(`/api/tracks/${currentTrack.id}/like?sessionId=${sessionId}`)
        .then((res) => res.json())
        .then((d) => setPlayerLiked(d.isLiked))
        .catch(() => queueMicrotask(() => setPlayerLiked(false)));
    } else {
      queueMicrotask(() => setPlayerLiked(false));
    }
  }, [currentTrack]);

  // Initialize audio element once
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = usePlayerStore.getState().volume;
      audioRef.current = audio;
      unlockAudio(audio);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // Handle track changes - load new audio source
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const trackId = currentTrack.id;

    // Only load if track actually changed
    if (prevTrackIdRef.current === trackId) return;
    prevTrackIdRef.current = trackId;

    const audioUrl = currentTrack.audioUrl;
    if (!audioUrl) {
      console.warn('No audio URL for track:', currentTrack.title);
      return;
    }

    // Use queueMicrotask to avoid synchronous setState in effect
    queueMicrotask(() => setIsLoading(true));
    playAttemptRef.current = usePlayerStore.getState().isPlaying;

    // Set new source and load
    audio.pause();
    audio.src = audioUrl;
    audio.currentTime = 0;
    audio.load();

    // Auto-play when loaded enough
    const handleCanPlay = () => {
      setIsLoading(false);
      if (usePlayerStore.getState().isPlaying || playAttemptRef.current) {
        playAttemptRef.current = false;
        audio.play().catch(() => {
          // Autoplay blocked - keep isPlaying true so the user can click play
          // Don't call pause() here - let the user click play manually
        });
      }
    };

    const handleError = () => {
      setIsLoading(false);
      console.error('Audio load error for:', audioUrl);
    };

    const handleEnded = () => {
      // Increment play count when a track finishes
      const currentTrackId = usePlayerStore.getState().currentTrack?.id;
      if (currentTrackId) {
        fetch(`/api/tracks/${currentTrackId}/play`, { method: 'POST' }).catch(() => {});
      }

      const state = usePlayerStore.getState();
      if (state.repeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        state.next();
      }
    };

    const handleTimeUpdate = () => {
      if (!isSeekingRef.current && audio.duration && isFinite(audio.currentTime)) {
        usePlayerStore.getState().setProgress(audio.currentTime);
        if (isFinite(audio.duration)) {
          setAudioDuration(audio.duration);
        }
      }
    };

    const handleLoadedMetadata = () => {
      setIsLoading(false);
      if (isFinite(audio.duration)) {
        setAudioDuration(audio.duration);
      }
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [currentTrack]);

  // Handle play/pause state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      if (audio.readyState >= 2) {
        audio.play().catch(() => {
          // Autoplay blocked - user needs to click play manually
        });
      }
      // If not ready yet, canplay handler will start playback
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // Handle volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  // Handle seek requests (from next/previous/playTrack)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || seekRequest === null) return;

    if (isFinite(seekRequest) && seekRequest >= 0) {
      audio.currentTime = seekRequest;
    }
    clearSeekRequest();
  }, [seekRequest, clearSeekRequest]);

  // Handle play/pause click with user gesture - ensures audio plays
  const handlePlayClick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.pause();
    } else {
      // This is a direct user gesture, so autoplay policy won't block it
      audio.play().catch(() => {});
    }
    togglePlay();
  }, [isPlaying, currentTrack, togglePlay]);

  const seekToPosition = useCallback(
    (percent: number) => {
      if (!currentTrack) return;
      const audio = audioRef.current;
      const duration = audio && isFinite(audio.duration) ? audio.duration : currentTrack.duration;
      const newTime = Math.max(0, Math.min(percent * duration, duration));
      setProgress(newTime);
      if (audio && isFinite(newTime)) {
        audio.currentTime = newTime;
      }
    },
    [currentTrack, setProgress]
  );

  const handleProgressMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      isSeekingRef.current = true;
      const rect = e.currentTarget.getBoundingClientRect();
      const isRTL = document.dir === 'rtl';
      let percent: number;
      if (isRTL) {
        percent = (rect.right - e.clientX) / rect.width;
      } else {
        percent = (e.clientX - rect.left) / rect.width;
      }
      percent = Math.max(0, Math.min(1, percent));
      seekToPosition(percent);

      const handleMouseMove = (ev: MouseEvent) => {
        const isRTLDrag = document.dir === 'rtl';
        let dragPercent: number;
        if (isRTLDrag) {
          dragPercent = (rect.right - ev.clientX) / rect.width;
        } else {
          dragPercent = (ev.clientX - rect.left) / rect.width;
        }
        dragPercent = Math.max(0, Math.min(1, dragPercent));
        seekToPosition(dragPercent);
      };

      const handleMouseUp = () => {
        isSeekingRef.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [seekToPosition]
  );

  const handleVolumeMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const isRTL = document.dir === 'rtl';
      let percent: number;
      if (isRTL) {
        percent = (rect.right - e.clientX) / rect.width;
      } else {
        percent = (e.clientX - rect.left) / rect.width;
      }
      percent = Math.max(0, Math.min(1, percent));
      setVolume(percent);

      const handleMouseMove = (ev: MouseEvent) => {
        const isRTLDrag = document.dir === 'rtl';
        let dragPercent: number;
        if (isRTLDrag) {
          dragPercent = (rect.right - ev.clientX) / rect.width;
        } else {
          dragPercent = (ev.clientX - rect.left) / rect.width;
        }
        dragPercent = Math.max(0, Math.min(1, dragPercent));
        setVolume(dragPercent);
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [setVolume]
  );

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  // Use audio duration state, fallback to track duration from metadata
  const realDuration = audioDuration > 0 ? audioDuration : (currentTrack?.duration ?? 0);
  const progressPercent = realDuration > 0 ? (progress / realDuration) * 100 : 0;

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[90px] bg-[#181818] border-t border-[#282828] z-50">
      <div className="h-full max-w-screen-2xl mx-auto flex items-center gap-4 px-4">
        {/* Track info (RTL - right side) */}
        <div className="flex items-center gap-3 min-w-0 w-[30%] justify-start">
          <div className="size-14 rounded overflow-hidden bg-[#282828] shrink-0">
            <img
              src={currentTrack.coverUrl || currentTrack.album?.coverUrl}
              alt={currentTrack.title}
              className="size-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate hover:underline cursor-pointer">
              {currentTrack.title}
            </p>
            <p className="text-xs text-[#a7a7a7] truncate hover:underline cursor-pointer hover:text-white">
              {currentTrack.artist?.name}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!currentTrack) return;
              const sid = localStorage.getItem('melody_session_id') || 'session_' + Date.now();
              localStorage.setItem('melody_session_id', sid);
              fetch(`/api/tracks/${currentTrack.id}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: sid }),
              })
                .then((res) => res.json())
                .then((d) => setPlayerLiked(d.isLiked))
                .catch(() => {});
            }}
            className={`shrink-0 transition-colors ${
              playerLiked ? 'text-[#1db954] hover:text-[#1ed760]' : 'text-[#a7a7a7] hover:text-[#1db954]'
            }`}
          >
            <Heart className={`size-4 ${playerLiked ? 'fill-[#1db954]' : ''}`} />
          </button>
        </div>

        {/* Playback controls (center) */}
        <div className="flex flex-col items-center gap-1 flex-1 max-w-[600px]">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleShuffle}
              className={`transition-colors ${
                shuffle ? 'text-[#1db954] hover:text-[#1ed760]' : 'text-[#a7a7a7] hover:text-white'
              }`}
            >
              <Shuffle className="size-4" />
            </button>

            <button
              onClick={previous}
              className="text-[#a7a7a7] hover:text-white transition-colors"
            >
              <SkipBack className="size-5 fill-current" />
            </button>

            <button
              onClick={handlePlayClick}
              className="flex items-center justify-center size-9 rounded-full bg-white text-black hover:scale-105 transition-transform"
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="size-5 fill-black" />
              ) : (
                <Play className="size-5 fill-black ml-0.5" />
              )}
            </button>

            <button
              onClick={next}
              className="text-[#a7a7a7] hover:text-white transition-colors"
            >
              <SkipForward className="size-5 fill-current" />
            </button>

            <button
              onClick={toggleRepeat}
              className={`transition-colors ${
                repeat !== 'off' ? 'text-[#1db954] hover:text-[#1ed760]' : 'text-[#a7a7a7] hover:text-white'
              }`}
            >
              {repeat === 'one' ? (
                <Repeat1 className="size-4" />
              ) : (
                <Repeat className="size-4" />
              )}
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-[11px] text-[#a7a7a7] w-10 text-left tabular-nums">
              {formatDuration(progress)}
            </span>
            <div
              className="flex-1 group relative h-1 bg-[#535353] rounded-full cursor-pointer hover:h-1.5 transition-all"
              onMouseDown={handleProgressMouseDown}
            >
              <div
                className="absolute top-0 right-0 h-full bg-white group-hover:bg-[#1db954] rounded-full transition-colors"
                style={{ width: `${progressPercent}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 size-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ right: `calc(${progressPercent}% - 6px)` }}
              />
            </div>
            <span className="text-[11px] text-[#a7a7a7] w-10 text-right tabular-nums">
              {formatDuration(audioDuration > 0 ? audioDuration : (currentTrack?.duration ?? 0))}
            </span>
          </div>
        </div>

        {/* Volume control (RTL - left side) */}
        <div className="hidden sm:flex items-center gap-2 w-[30%] justify-end">
          <button
            onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
            className="text-[#a7a7a7] hover:text-white transition-colors"
          >
            <VolumeIcon className="size-4" />
          </button>
          <div
            className="w-24 group relative h-1 bg-[#535353] rounded-full cursor-pointer hover:h-1.5 transition-all"
            onMouseDown={handleVolumeMouseDown}
          >
            <div
              className="absolute top-0 right-0 h-full bg-white group-hover:bg-[#1db954] rounded-full transition-colors"
              style={{ width: `${volume * 100}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 size-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ right: `calc(${volume * 100}% - 6px)` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
