'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search as SearchIcon, Play } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { usePlayerStore } from '@/lib/player-store';
import type { Track, Artist, Album, ViewType } from '@/lib/types';
import TrackRow from './track-row';

interface SearchViewProps {
  navigate: (view: ViewType, id?: string) => void;
}

const genres = [
  { name: 'پاپ', color: 'bg-rose-700' },
  { name: 'سنتی', color: 'bg-amber-700' },
  { name: 'راک', color: 'bg-red-800' },
  { name: 'عاشقانه', color: 'bg-pink-700' },
  { name: 'پرانرژی', color: 'bg-orange-700' },
];

export default function SearchView({ navigate }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { playTrack } = usePlayerStore();

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setTracks([]);
      setArtists([]);
      setAlbums([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const [tRes, aRes, alRes] = await Promise.all([
        fetch(`/api/tracks?search=${encodeURIComponent(q)}`),
        fetch(`/api/artists?search=${encodeURIComponent(q)}`),
        fetch(`/api/albums?search=${encodeURIComponent(q)}`),
      ]);
      const [tData, aData, alData] = await Promise.all([
        tRes.json(),
        aRes.json(),
        alRes.json(),
      ]);
      setTracks(tData);
      setArtists(aData);
      setAlbums(alData);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const hasResults = tracks.length > 0 || artists.length > 0 || albums.length > 0;

  return (
    <div className="space-y-8 pb-6">
      {/* Search input */}
      <div className="relative max-w-md">
        <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 size-5 text-[#a7a7a7]" />
        <Input
          type="text"
          placeholder="چه چیزی می‌خواهی گوش بدی؟"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pr-10 h-12 bg-[#282828] border-none rounded-full text-white placeholder:text-[#a7a7a7] text-base focus-visible:ring-1 focus-visible:ring-white/30"
        />
      </div>

      {/* Loading */}
      {searching && (
        <div className="flex items-center justify-center py-12">
          <div className="size-8 border-3 border-[#1db954] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Genre cards (shown when no search) */}
      {!query && !searching && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">دسته‌بندی‌ها</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {genres.map((genre) => (
              <button
                key={genre.name}
                onClick={() => setQuery(genre.name)}
                className={`${genre.color} relative h-24 rounded-lg overflow-hidden p-4 text-right transition-transform hover:scale-105`}
              >
                <span className="text-lg font-bold text-white">{genre.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Search results */}
      {query && !searching && !hasResults && (
        <div className="text-center py-12">
          <p className="text-[#a7a7a7] text-lg">نتیجه‌ای برای &laquo;{query}&raquo; پیدا نشد</p>
        </div>
      )}

      {query && !searching && hasResults && (
        <>
          {/* Tracks */}
          {tracks.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-4">آهنگ‌ها</h2>
              <div className="space-y-1">
                {tracks.slice(0, 6).map((track, index) => (
                  <TrackRow
                    key={track.id}
                    track={{
                      ...track,
                      artist: { id: track.artist.id, name: track.artist.name, imageUrl: track.artist.imageUrl },
                    }}
                    index={index}
                    queue={tracks.map((t) => ({
                      ...t,
                      artist: { id: t.artist.id, name: t.artist.name, imageUrl: t.artist.imageUrl },
                    }))}
                    navigate={navigate}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Artists */}
          {artists.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-4">هنرمندان</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {artists.map((artist) => (
                  <button
                    key={artist.id}
                    onClick={() => navigate('artist', artist.id)}
                    className="group bg-[#181818] hover:bg-[#282828] rounded-lg p-4 transition-all duration-300 text-right"
                  >
                    <div className="aspect-square rounded-full overflow-hidden bg-[#282828] mb-4 shadow-lg">
                      <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <p className="text-sm font-medium text-white truncate">{artist.name}</p>
                    <p className="text-xs text-[#a7a7a7] mt-1">هنرمند</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Albums */}
          {albums.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-4">آلبوم‌ها</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {albums.map((album) => (
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
          )}
        </>
      )}
    </div>
  );
}
