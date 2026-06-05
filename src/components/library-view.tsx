'use client';

import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import type { Playlist, ViewType } from '@/lib/types';

interface LibraryViewProps {
  navigate: (view: ViewType, id?: string) => void;
}

export default function LibraryView({ navigate }: LibraryViewProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/playlists')
      .then((res) => res.json())
      .then((data) => setPlaylists(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="size-10 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-white">کتابخانه شما</h1>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">پلی‌لیست‌ها</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => navigate('playlist', playlist.id)}
              className="group bg-[#181818] hover:bg-[#282828] rounded-lg p-4 transition-all duration-300 text-right"
            >
              <div className="relative mb-4">
                <div className="aspect-square rounded-md overflow-hidden bg-[#282828] shadow-lg">
                  <img
                    src={playlist.coverUrl}
                    alt={playlist.title}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <div className="size-10 rounded-full bg-[#1db954] flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                    <Play className="size-5 text-black fill-black ml-0.5" />
                  </div>
                </div>
              </div>
              <p className="text-sm font-medium text-white truncate">{playlist.title}</p>
              <p className="text-xs text-[#a7a7a7] mt-1 line-clamp-2">{playlist.description}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
