'use client';

import { useEffect, useState } from 'react';
import { Play, Heart, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/lib/player-store';
import type { Album, ViewType } from '@/lib/types';
import TrackRow from './track-row';

interface AlbumViewProps {
  albumId: string;
  navigate: (view: ViewType, id?: string) => void;
}

export default function AlbumView({ albumId, navigate }: AlbumViewProps) {
  const [album, setAlbum] = useState<Album | null>(null);
  const { playTrack } = usePlayerStore();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/albums/${albumId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setAlbum(data);
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [albumId]);

  if (!album) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="size-10 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (album.error) {
    return (
      <div className="text-center py-12">
        <p className="text-[#a7a7a7]">آلبوم یافت نشد</p>
      </div>
    );
  }

  const tracks = album.tracks || [];
  const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0);
  const queueTracks = tracks.map((t) => ({
    ...t,
    artist: { id: album.artist.id, name: album.artist.name, imageUrl: album.artist.imageUrl },
  }));

  const handlePlayAll = () => {
    if (queueTracks.length > 0) {
      playTrack(queueTracks[0], queueTracks);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
        <div className="size-48 sm:size-56 rounded-lg overflow-hidden bg-[#282828] shadow-2xl shrink-0">
          <img
            src={album.coverUrl}
            alt={album.title}
            className="size-full object-cover"
          />
        </div>
        <div className="text-center sm:text-right flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-[#a7a7a7] mb-1">آلبوم</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 truncate">
            {album.title}
          </h1>
          <div className="flex items-center gap-2 justify-center sm:justify-start text-sm text-[#a7a7a7]">
            <button
              onClick={() => navigate('artist', album.artist.id)}
              className="font-medium text-white hover:underline"
            >
              {album.artist.name}
            </button>
            <span>•</span>
            <span>{album.releaseYear}</span>
            <span>•</span>
            <span>{tracks.length} آهنگ</span>
            <span>•</span>
            <Clock className="size-3.5" />
            <span>{Math.floor(totalDuration / 60)} دقیقه</span>
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
        style={{ gridTemplateColumns: '2rem minmax(0, 1fr) 5rem 3rem' }}
      >
        <span className="text-center">#</span>
        <span>عنوان</span>
        <span className="text-left">
          <Clock className="size-4 inline" />
        </span>
        <span />
      </div>

      {/* Track list */}
      <div className="space-y-0.5">
        {tracks.map((track, index) => (
          <TrackRow
            key={track.id}
            track={{
              ...track,
              artist: { id: album.artist.id, name: album.artist.name, imageUrl: album.artist.imageUrl },
              album: { id: album.id, title: album.title, coverUrl: album.coverUrl },
            }}
            index={index}
            queue={queueTracks}
            showAlbum={false}
            navigate={navigate}
          />
        ))}
      </div>
    </div>
  );
}
