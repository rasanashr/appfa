'use client';

import { Play, Pause } from 'lucide-react';
import { usePlayerStore } from '@/lib/player-store';
import type { Track, ViewType } from '@/lib/types';
import { formatDuration, formatPlayCount } from '@/lib/types';

interface TrackRowProps {
  track: Track;
  index: number;
  queue?: Track[];
  showAlbum?: boolean;
  showCover?: boolean;
  navigate?: (view: ViewType, id?: string) => void;
}

export default function TrackRow({ track, index, queue, showAlbum = true, showCover = true, navigate }: TrackRowProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const isCurrentTrack = currentTrack?.id === track.id;

  const handleRowClick = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack(track, queue);
    }
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigate) {
      navigate('track', track.id);
    }
  };

  const handleArtistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigate) {
      navigate('artist', track.artistId);
    }
  };

  return (
    <div
      onClick={handleRowClick}
      className={`group grid items-center gap-4 rounded-md px-4 py-2 transition-colors hover:bg-white/10 cursor-pointer ${
        isCurrentTrack ? 'bg-white/5' : ''
      }`}
      style={{
        gridTemplateColumns: showAlbum
          ? '2rem minmax(0, 1fr) minmax(0, 1fr) 5rem 3rem'
          : '2rem minmax(0, 1fr) 5rem 3rem',
      }}
    >
      {/* Track number / Play button */}
      <div className="flex items-center justify-center w-8">
        <span className={`group-hover:hidden text-sm ${isCurrentTrack ? 'text-[#1db954]' : 'text-[#a7a7a7]'}`}>
          {isCurrentTrack && isPlaying ? (
            <span className="flex items-center gap-[2px]">
              <span className="w-[3px] h-3 bg-[#1db954] animate-pulse rounded-full" />
              <span className="w-[3px] h-4 bg-[#1db954] animate-pulse rounded-full" style={{ animationDelay: '0.15s' }} />
              <span className="w-[3px] h-2 bg-[#1db954] animate-pulse rounded-full" style={{ animationDelay: '0.3s' }} />
            </span>
          ) : (
            index + 1
          )}
        </span>
        <span className="hidden group-hover:flex items-center justify-center text-white">
          {isCurrentTrack && isPlaying ? (
            <Pause className="size-4 fill-white" />
          ) : (
            <Play className="size-4 fill-white" />
          )}
        </span>
      </div>

      {/* Track title with cover */}
      <div className="flex items-center gap-3 min-w-0">
        {showCover && track.coverUrl && (
          <div className="size-10 shrink-0 rounded overflow-hidden bg-[#282828]">
            <img
              src={track.coverUrl}
              alt={track.title}
              className="size-full object-cover"
            />
          </div>
        )}
        <div className="min-w-0">
          <p
            onClick={handleTitleClick}
            className={`text-sm font-medium truncate hover:underline ${isCurrentTrack ? 'text-[#1db954]' : 'text-white'}`}
          >
            {track.title}
          </p>
          <p
            onClick={handleArtistClick}
            className="text-xs text-[#a7a7a7] truncate hover:underline hover:text-white"
          >
            {track.artist?.name}
          </p>
        </div>
      </div>

      {/* Album name */}
      {showAlbum && (
        <div className="min-w-0">
          <p className="text-sm text-[#a7a7a7] truncate">
            {track.album?.title || '—'}
          </p>
        </div>
      )}

      {/* Play count */}
      <div className="text-sm text-[#a7a7a7] text-left">
        {formatPlayCount(track.playCount)}
      </div>

      {/* Duration */}
      <div className="text-sm text-[#a7a7a7] text-left">
        {formatDuration(track.duration)}
      </div>
    </div>
  );
}
