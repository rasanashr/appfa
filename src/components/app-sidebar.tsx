'use client';

import { useEffect, useState } from 'react';
import { Home, Search, Library, Music, ListMusic, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { ViewType, Playlist } from '@/lib/types';

interface SidebarContentProps {
  activeView: ViewType;
  activePlaylistId?: string;
  playlists: Playlist[];
  onNav: (view: ViewType) => void;
  onPlaylistNav: (id: string) => void;
}

function SidebarContent({ activeView, activePlaylistId, playlists, onNav, onPlaylistNav }: SidebarContentProps) {
  const navItems = [
    { icon: Home, label: 'خانه', view: 'home' as ViewType },
    { icon: Search, label: 'جستجو', view: 'search' as ViewType },
    { icon: Library, label: 'کتابخانه', view: 'library' as ViewType },
  ];

  return (
    <div className="flex flex-col h-full bg-[#000000] text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex items-center justify-center size-9 rounded-full bg-[#1db954]">
          <Music className="size-5 text-black" />
        </div>
        <span className="text-xl font-bold">ملودی</span>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onNav(item.view)}
              className={`flex items-center gap-4 w-full px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
                isActive
                  ? 'text-[#1db954] bg-white/5'
                  : 'text-[#a7a7a7] hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="size-5 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="my-4 mx-4 border-t border-[#282828]" />

      {/* Playlists header */}
      <div className="px-3 mb-2">
        <button
          onClick={() => onNav('library')}
          className="flex items-center gap-2 text-[#a7a7a7] hover:text-white text-xs font-medium uppercase tracking-wider transition-colors"
        >
          <ListMusic className="size-4" />
          <span>پلی‌لیست‌ها</span>
        </button>
      </div>

      {/* Playlists list - RTL: cover image first (right), then title (left) */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-0.5 pb-4">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => onPlaylistNav(playlist.id)}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-md transition-colors text-sm ${
                  activeView === 'playlist' && activePlaylistId === playlist.id
                    ? 'text-white bg-white/10'
                    : 'text-[#a7a7a7] hover:text-white hover:bg-white/5'
              }`}
            >
              {/* Cover image - appears first in RTL (right side) */}
              <div className="size-8 rounded overflow-hidden bg-[#282828] shrink-0">
                <img
                  src={playlist.coverUrl}
                  alt={playlist.title}
                  className="size-full object-cover"
                />
              </div>
              {/* Title - appears after cover in RTL */}
              <span className="truncate text-right">{playlist.title}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface AppSidebarProps {
  activeView: ViewType;
  activeId?: string;
  navigate: (view: ViewType, id?: string) => void;
}

export default function AppSidebar({ activeView, activeId, navigate }: AppSidebarProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('/api/playlists')
      .then((res) => res.json())
      .then((data) => setPlaylists(data))
      .catch(console.error);
  }, []);

  const handleNav = (view: ViewType) => {
    navigate(view);
    setOpen(false);
  };

  const handlePlaylistNav = (id: string) => {
    navigate('playlist', id);
    setOpen(false);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 lg:w-72 shrink-0 flex-col h-full">
        <SidebarContent
          activeView={activeView}
          activePlaylistId={activeId}
          playlists={playlists}
          onNav={handleNav}
          onPlaylistNav={handlePlaylistNav}
        />
      </aside>

      {/* Mobile sidebar with sheet */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-3 right-3 z-50 text-white bg-[#000000]/80 backdrop-blur-sm rounded-full size-10"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-72 bg-[#000000] border-[#282828]">
            <SidebarContent
              activeView={activeView}
              activePlaylistId={activeId}
              playlists={playlists}
              onNav={handleNav}
              onPlaylistNav={handlePlaylistNav}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
