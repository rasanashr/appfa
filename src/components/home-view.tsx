'use client';

import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { usePlayerStore } from '@/lib/player-store';
import type { HomeData, ViewType } from '@/lib/types';
import TrackRow from './track-row';

interface HomeViewProps {
  navigate: (view: ViewType, id?: string) => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'صبح بخیر! ☀️';
  if (hour < 17) return 'ظهر بخیر! 🌤️';
  if (hour < 21) return 'عصر بخیر! 🌅';
  return 'شب بخیر! 🌙';
}

// Quick-play grid items for the top section
function QuickPlayCard({ playlist, navigate }: { playlist: HomeData['featuredPlaylists'][0]; navigate: (view: ViewType, id?: string) => void }) {
  return (
    <button
      onClick={() => navigate('playlist', playlist.id)}
      className="flex items-center bg-white/10 hover:bg-white/20 rounded-md overflow-hidden transition-colors group"
    >
      <div className="size-12 shrink-0">
        <img
          src={playlist.coverUrl}
          alt={playlist.title}
          className="size-full object-cover"
        />
      </div>
      <span className="px-3 text-sm font-medium text-white truncate flex-1 text-right">{playlist.title}</span>
      <div className="shrink-0 ml-2 mr-auto opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
        <div className="size-8 rounded-full bg-[#1db954] flex items-center justify-center shadow-lg">
          <Play className="size-4 text-black fill-black ml-0.5" />
        </div>
      </div>
    </button>
  );
}

export default function HomeView({ navigate }: HomeViewProps) {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const { playTrack } = usePlayerStore();

  useEffect(() => {
    fetch('/api/home')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#a7a7a7] text-sm">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const handlePlayTrack = (track: (typeof data.topTracks)[0]) => {
    playTrack(
      {
        ...track,
        artist: { id: track.artist.id, name: track.artist.name, imageUrl: track.artist.imageUrl },
      },
      data.topTracks.map((t) => ({
        ...t,
        artist: { id: t.artist.id, name: t.artist.name, imageUrl: t.artist.imageUrl },
      }))
    );
  };

  return (
    <div className="space-y-8 pb-6">
      {/* Gradient header background */}
      <div className="relative -m-4 md:-m-6 lg:-m-8 mb-0 p-4 md:p-6 lg:p-8 pb-8 bg-gradient-to-b from-[#1a4731] to-[#121212]">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            {getGreeting()}
          </h1>
        </div>

        {/* Quick play grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.featuredPlaylists.slice(0, 6).map((playlist) => (
            <QuickPlayCard key={playlist.id} playlist={playlist} navigate={navigate} />
          ))}
        </div>
      </div>

      {/* Featured Playlists */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">پلی‌لیست‌های منتخب</h2>
          <button
            onClick={() => navigate('library')}
            className="text-sm text-[#a7a7a7] hover:text-white hover:underline transition-colors"
          >
            مشاهده همه
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {data.featuredPlaylists.map((playlist) => (
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

      {/* New Albums */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">آلبوم‌های جدید</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {data.newReleases.map((album) => (
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
              <p className="text-xs text-[#a7a7a7] mt-1">{album.artist?.name} • {album.releaseYear}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Top Artists */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">هنرمندان برتر</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {data.topArtists.map((artist) => (
            <button
              key={artist.id}
              onClick={() => navigate('artist', artist.id)}
              className="group bg-[#181818] hover:bg-[#282828] rounded-lg p-4 transition-all duration-300 text-right"
            >
              <div className="relative mb-4">
                <div className="aspect-square rounded-full overflow-hidden bg-[#282828] shadow-lg">
                  <img
                    src={artist.imageUrl}
                    alt={artist.name}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </div>
              <p className="text-sm font-medium text-white truncate">{artist.name}</p>
              <p className="text-xs text-[#a7a7a7] mt-1">هنرمند</p>
            </button>
          ))}
        </div>
      </section>

      {/* Top Tracks */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">محبوب‌ترین آهنگ‌ها</h2>
        </div>
        <div className="space-y-1">
          {data.topTracks.slice(0, 5).map((track, index) => (
            <TrackRow
              key={track.id}
              track={{
                ...track,
                artist: { id: track.artist.id, name: track.artist.name, imageUrl: track.artist.imageUrl },
              }}
              index={index}
              queue={data.topTracks.map((t) => ({
                ...t,
                artist: { id: t.artist.id, name: t.artist.name, imageUrl: t.artist.imageUrl },
              }))}
              navigate={navigate}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
