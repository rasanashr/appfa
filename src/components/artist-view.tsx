'use client';

import { useEffect, useState } from 'react';
import { Play, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/lib/player-store';
import type { ViewType } from '@/lib/types';
import { formatListeners } from '@/lib/types';
import TrackRow from './track-row';

interface ArtistViewProps {
  artistId: string;
  navigate: (view: ViewType, id?: string) => void;
}

interface ArtistDetail {
  id: string;
  name: string;
  imageUrl: string;
  bio: string;
  monthlyListeners: number;
  tracks: Array<{
    id: string;
    title: string;
    duration: number;
    audioUrl: string;
    coverUrl: string;
    albumId: string | null;
    artistId: string;
    playCount: number;
    genre: string;
    album: { id: string; title: string; coverUrl: string } | null;
  }>;
  albums: Array<{
    id: string;
    title: string;
    coverUrl: string;
    releaseYear: number;
    _count: { tracks: number };
  }>;
}

export default function ArtistView({ artistId, navigate }: ArtistViewProps) {
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const { playTrack } = usePlayerStore();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/artists/${artistId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setArtist(data);
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [artistId]);

  if (!artist) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="size-10 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const queueTracks = artist.tracks.map((t) => ({
    ...t,
    artist: { id: artist.id, name: artist.name, imageUrl: artist.imageUrl },
  }));

  const handlePlayAll = () => {
    if (queueTracks.length > 0) {
      playTrack(queueTracks[0], queueTracks);
    }
  };

  const handleShuffle = () => {
    if (queueTracks.length > 0) {
      const shuffled = [...queueTracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  return (
    <div className="space-y-8 pb-6">
      {/* Hero section */}
      <div className="relative">
        <div className="flex flex-col items-center sm:flex-row gap-6">
          <div className="size-44 sm:size-52 rounded-full overflow-hidden bg-[#282828] shadow-2xl shrink-0">
            <img
              src={artist.imageUrl}
              alt={artist.name}
              className="size-full object-cover"
            />
          </div>
          <div className="text-center sm:text-right flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
              <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase">
                تایید شده
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">
              {artist.name}
            </h1>
            <p className="text-sm text-[#a7a7a7]">
              {formatListeners(artist.monthlyListeners)} شنونده در ماه
            </p>
          </div>
        </div>
      </div>

      {/* Play buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handlePlayAll}
          className="size-12 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black hover:scale-105 transition-all"
          size="icon"
        >
          <Play className="size-6 fill-black ml-0.5" />
        </Button>
        <Button
          onClick={handleShuffle}
          variant="outline"
          className="rounded-full border-[#a7a7a7] text-[#a7a7a7] hover:text-white hover:border-white"
          size="icon"
        >
          <Shuffle className="size-4" />
        </Button>
      </div>

      {/* Popular tracks */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">آهنگ‌های محبوب</h2>
        <div className="space-y-0.5">
          {artist.tracks.slice(0, 5).map((track, index) => (
            <TrackRow
              key={track.id}
              track={{
                ...track,
                artist: { id: artist.id, name: artist.name, imageUrl: artist.imageUrl },
              }}
              index={index}
              queue={queueTracks}
              navigate={navigate}
            />
          ))}
        </div>
      </section>

      {/* Albums */}
      {artist.albums && artist.albums.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">آلبوم‌ها</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {artist.albums.map((album) => (
              <button
                key={album.id}
                onClick={() => navigate('album', album.id)}
                className="group bg-[#181818] hover:bg-[#282828] rounded-lg p-4 transition-all duration-300 text-right"
              >
                <div className="relative mb-4">
                  <div className="aspect-square rounded-md overflow-hidden bg-[#282828] shadow-lg">
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <div className="size-10 rounded-full bg-[#1db954] flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                      <Play className="size-5 text-black fill-black ml-0.5" />
                    </div>
                  </div>
                </div>
                <p className="text-sm font-medium text-white truncate">{album.title}</p>
                <p className="text-xs text-[#a7a7a7] mt-1">{album.releaseYear} • {album._count?.tracks || 0} آهنگ</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* About */}
      {artist.bio && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">درباره</h2>
          <div className="bg-[#181818] rounded-lg p-6">
            <p className="text-[#a7a7a7] text-sm leading-7">{artist.bio}</p>
            <p className="text-white text-sm mt-4 font-medium">
              {formatListeners(artist.monthlyListeners)} شنونده در ماه
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
