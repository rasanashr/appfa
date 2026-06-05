'use client';

import { useEffect, useState } from 'react';
import { Play, Heart, Clock, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/lib/player-store';
import type { Playlist, ViewType } from '@/lib/types';
import TrackRow from './track-row';

interface PlaylistViewProps {
  playlistId: string;
  navigate: (view: ViewType, id?: string) => void;
}

export default function PlaylistView({ playlistId, navigate }: PlaylistViewProps) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const { playTrack } = usePlayerStore();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/playlists/${playlistId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setPlaylist(data);
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [playlistId]);

  if (!playlist) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="size-10 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const playlistTracks = playlist.tracks || [];
  const queueTracks = playlistTracks.map((pt) => ({
    ...pt.track,
    artist: { id: pt.track.artist.id, name: pt.track.artist.name, imageUrl: pt.track.artist.imageUrl },
  }));
  const totalDuration = queueTracks.reduce((sum, t) => sum + t.duration, 0);

  const handlePlayAll = () => {
    if (queueTracks.length > 0) {
      playTrack(queueTracks[0], queueTracks);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
        <div className="size-48 sm:size-56 rounded-lg overflow-hidden bg-[#282828] shadow-2xl shrink-0 flex items-center justify-center">
          {playlist.coverUrl ? (
            <img
              src={playlist.coverUrl}
              alt={playlist.title}
              className="size-full object-cover"
            />
          ) : (
            <Music className="size-16 text-[#a7a7a7]" />
          )}
        </div>
        <div className="text-center sm:text-right flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-[#a7a7a7] mb-1">پلی‌لیست</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 truncate">
            {playlist.title}
          </h1>
          {playlist.description && (
            <p className="text-sm text-[#a7a7a7] mb-2">{playlist.description}</p>
          )}
          <div className="flex items-center gap-2 justify-center sm:justify-start text-sm text-[#a7a7a7]">
            <span>{playlistTracks.length} آهنگ</span>
            <span>•</span>
            <Clock className="size-3.5" />
            <span>حدود {Math.floor(totalDuration / 60)} دقیقه</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handlePlayAll}
          className="size-12 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black hover:scale-105 transition-all"
          size="icon"
        >
          <Play className="size-6 fill-black ml-0.5" />
        </Button>
        <button className="text-[#a7a7a7] hover:text-white transition-colors">
          <Heart className="size-8" />
        </button>
      </div>

      {/* Track list header */}
      <div
        className="grid items-center gap-4 px-4 py-2 border-b border-[#282828] text-[#a7a7a7] text-xs uppercase tracking-wider"
        style={{ gridTemplateColumns: '2rem minmax(0, 1fr) minmax(0, 1fr) 5rem 3rem' }}
      >
        <span className="text-center">#</span>
        <span>عنوان</span>
        <span>آلبوم</span>
        <span className="text-left">
          <Clock className="size-4 inline" />
        </span>
        <span />
      </div>

      {/* Track list */}
      <div className="space-y-0.5">
        {playlistTracks.map((pt, index) => (
          <TrackRow
            key={pt.id}
            track={{
              ...pt.track,
              artist: { id: pt.track.artist.id, name: pt.track.artist.name, imageUrl: pt.track.artist.imageUrl },
            }}
            index={index}
            queue={queueTracks}
            navigate={navigate}
          />
        ))}
      </div>

      {/* Empty state */}
      {playlistTracks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#a7a7a7] text-lg">این پلی‌لیست خالی است</p>
        </div>
      )}
    </div>
  );
}
