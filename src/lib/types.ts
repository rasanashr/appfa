"use client";

import { useEffect, useState, useCallback } from "react";

// Types
export interface Artist {
  id: string;
  name: string;
  imageUrl: string;
  bio: string;
  monthlyListeners: number;
}

export interface Album {
  id: string;
  title: string;
  coverUrl: string;
  releaseYear: number;
  artistId: string;
  artist: Artist;
  tracks?: Track[];
}

export interface Track {
  id: string;
  title: string;
  duration: number;
  audioUrl: string;
  coverUrl: string;
  albumId: string | null;
  artistId: string;
  playCount: number;
  genre: string;
  artist: Artist;
  album: { id: string; title: string; coverUrl: string } | null;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  isPublic: boolean;
  tracks?: { id: string; track: Track; order: number }[];
}

export interface HomeData {
  featuredPlaylists: Playlist[];
  newReleases: Album[];
  topArtists: Artist[];
  topTracks: Track[];
}

// View types
export type ViewType = "home" | "search" | "library" | "album" | "artist" | "playlist" | "track";

export interface ViewState {
  view: ViewType;
  id?: string;
}

function getInitialViewState(): ViewState {
  if (typeof window === "undefined") return { view: "home" };
  const params = new URLSearchParams(window.location.search);
  const view = (params.get("view") as ViewType) || "home";
  const id = params.get("id") || undefined;
  return { view, id };
}

// Navigation hook using URL params
export function useNavigation() {
  const [viewState, setViewState] = useState<ViewState>(getInitialViewState);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const view = (params.get("view") as ViewType) || "home";
      const id = params.get("id") || undefined;
      setViewState({ view, id });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((view: ViewType, id?: string) => {
    const params = new URLSearchParams();
    params.set("view", view);
    if (id) params.set("id", id);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, "", url);
    setViewState({ view, id });
  }, []);

  return { viewState, navigate };
}

// Format helpers
export function formatDuration(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatPlayCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
  return count.toString();
}

export function formatListeners(count: number): string {
  return new Intl.NumberFormat("fa-IR").format(count);
}
