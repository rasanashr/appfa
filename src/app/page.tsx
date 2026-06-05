'use client';

import { useNavigation } from '@/lib/types';
import AppSidebar from '@/components/app-sidebar';
import MusicPlayer from '@/components/music-player';
import HomeView from '@/components/home-view';
import SearchView from '@/components/search-view';
import AlbumView from '@/components/album-view';
import ArtistView from '@/components/artist-view';
import PlaylistView from '@/components/playlist-view';
import LibraryView from '@/components/library-view';
import TrackView from '@/components/track-view';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlayerStore } from '@/lib/player-store';
import { useEffect } from 'react';

export default function Home() {
  const { viewState, navigate } = useNavigation();
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  const renderView = () => {
    switch (viewState.view) {
      case 'home':
        return <HomeView navigate={navigate} />;
      case 'search':
        return <SearchView navigate={navigate} />;
      case 'album':
        return viewState.id ? (
          <AlbumView albumId={viewState.id} navigate={navigate} />
        ) : null;
      case 'artist':
        return viewState.id ? (
          <ArtistView artistId={viewState.id} navigate={navigate} />
        ) : null;
      case 'playlist':
        return viewState.id ? (
          <PlaylistView playlistId={viewState.id} navigate={navigate} />
        ) : null;
      case 'track':
        return viewState.id ? (
          <TrackView trackId={viewState.id} navigate={navigate} />
        ) : null;
      case 'library':
        return <LibraryView navigate={navigate} />;
      default:
        return <HomeView navigate={navigate} />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#121212] text-white" dir="rtl">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AppSidebar activeView={viewState.view} activeId={viewState.id} navigate={navigate} />

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className={`p-4 md:p-6 lg:p-8 ${currentTrack ? 'pb-28' : 'pb-8'}`}>
              {renderView()}
            </div>
          </ScrollArea>
        </main>
      </div>

      {/* Music Player */}
      {currentTrack && <MusicPlayer />}
    </div>
  );
}
