'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  Heart,
  Download,
  Music2,
  Headphones,
  Clock,
  Disc3,
  ChevronLeft,
  Share2,
} from 'lucide-react';
import { usePlayerStore } from '@/lib/player-store';
import type { Track, ViewType } from '@/lib/types';
import { formatDuration, formatPlayCount } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import TrackRow from './track-row';

interface TrackViewProps {
  trackId: string;
  navigate: (view: ViewType, id?: string) => void;
}

interface TrackDetail extends Track {
  likeCount: number;
  relatedTracks: Track[];
  isLiked?: boolean;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = localStorage.getItem('melody_session_id');
  if (!sid) {
    sid = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('melody_session_id', sid);
  }
  return sid;
}

export default function TrackView({ trackId, navigate }: TrackViewProps) {
  const [data, setData] = useState<TrackDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [playCountTracked, setPlayCountTracked] = useState(false);
  const { toast } = useToast();

  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();

  useEffect(() => {
    queueMicrotask(() => setLoading(true));
    const sessionId = getSessionId();

    fetch(`/api/tracks/${trackId}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLikeCount(d.likeCount || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Check like status
    fetch(`/api/tracks/${trackId}/like?sessionId=${sessionId}`)
      .then((res) => res.json())
      .then((d) => {
        setIsLiked(d.isLiked);
        setLikeCount(d.likeCount);
      })
      .catch(() => {});
  }, [trackId]);

  const handlePlay = useCallback(() => {
    if (!data) return;
    if (currentTrack?.id === data.id) {
      togglePlay();
    } else {
      playTrack(data, data.relatedTracks.length > 0 ? [data, ...data.relatedTracks] : [data]);

      // Track play count (once per load)
      if (!playCountTracked) {
        setPlayCountTracked(true);
        fetch(`/api/tracks/${data.id}/play`, { method: 'POST' }).catch(() => {});
      }
    }
  }, [data, currentTrack, isPlaying, playTrack, togglePlay, playCountTracked]);

  const handleLike = useCallback(async () => {
    const sessionId = getSessionId();
    try {
      const res = await fetch(`/api/tracks/${trackId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const d = await res.json();
      setIsLiked(d.isLiked);
      setLikeCount(d.likeCount);
    } catch (err) {
      console.error('Like error:', err);
    }
  }, [trackId]);

  const handleDownload = useCallback(() => {
    if (!data?.audioUrl) return;
    const a = document.createElement('a');
    a.href = data.audioUrl;
    a.download = `${data.title} - ${data.artist?.name}.mp3`;
    a.click();
    toast({
      description: 'دانلود شروع شد',
      duration: 2000,
    });
  }, [data, toast]);

  const handleShare = useCallback(() => {
    if (!data) return;
    const url = `${window.location.origin}?view=track&id=${data.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        description: 'لینک آهنگ کپی شد',
        duration: 2000,
      });
    }).catch(() => {});
  }, [data, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#a7a7a7] text-sm">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isCurrentlyPlaying = currentTrack?.id === data.id && isPlaying;

  return (
    <div className="space-y-8 pb-6">
      {/* Back button */}
      <button
        onClick={() => navigate('home')}
        className="flex items-center gap-2 text-[#a7a7a7] hover:text-white transition-colors text-sm"
      >
        <ChevronLeft className="size-5" />
        بازگشت
      </button>

      {/* Hero section */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
        {/* Cover art */}
        <div className="size-56 md:size-64 shrink-0 rounded-lg overflow-hidden shadow-2xl bg-[#282828]">
          <img
            src={data.coverUrl || data.album?.coverUrl}
            alt={data.title}
            className="size-full object-cover"
          />
        </div>

        {/* Track info */}
        <div className="flex flex-col items-center md:items-start gap-3 text-center md:text-right min-w-0 flex-1">
          <span className="text-xs font-medium uppercase tracking-wider text-[#a7a7a7]">آهنگ</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
            {data.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start text-[#a7a7a7]">
            <button
              onClick={() => navigate('artist', data.artist?.id)}
              className="text-white font-medium hover:underline"
            >
              {data.artist?.name}
            </button>
            {data.album && (
              <>
                <span>•</span>
                <button
                  onClick={() => navigate('album', data.album?.id)}
                  className="hover:underline hover:text-white"
                >
                  {data.album.title}
                </button>
              </>
            )}
            <span>•</span>
            <span>{formatDuration(data.duration)}</span>
            <span>•</span>
            <span>{formatPlayCount(data.playCount)} پخش</span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1.5 text-[#a7a7a7] text-sm">
              <Headphones className="size-4" />
              {formatPlayCount(data.playCount)}
            </div>
            <div className="flex items-center gap-1.5 text-[#a7a7a7] text-sm">
              <Heart className="size-4" />
              {likeCount}
            </div>
            <div className="flex items-center gap-1.5 text-[#a7a7a7] text-sm">
              <Clock className="size-4" />
              {formatDuration(data.duration)}
            </div>
            {data.genre && (
              <div className="flex items-center gap-1.5 text-[#a7a7a7] text-sm">
                <Disc3 className="size-4" />
                {data.genre}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={handlePlay}
          className="flex items-center justify-center size-14 rounded-full bg-[#1db954] text-black hover:bg-[#1ed760] hover:scale-105 transition-all shadow-lg"
        >
          {isCurrentlyPlaying ? (
            <Pause className="size-6 fill-black" />
          ) : (
            <Play className="size-6 fill-black ml-1" />
          )}
        </button>

        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
            isLiked
              ? 'border-[#1db954] text-[#1db954] bg-[#1db954]/10'
              : 'border-[#535353] text-[#a7a7a7] hover:border-white hover:text-white'
          }`}
        >
          <Heart className={`size-5 ${isLiked ? 'fill-[#1db954]' : ''}`} />
          <span className="text-sm font-medium">{likeCount}</span>
        </button>

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#535353] text-[#a7a7a7] hover:border-white hover:text-white transition-colors"
        >
          <Download className="size-5" />
          <span className="text-sm font-medium">دانلود</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#535353] text-[#a7a7a7] hover:border-white hover:text-white transition-colors"
        >
          <Share2 className="size-5" />
        </button>
      </div>

      {/* Lyrics placeholder / description section */}
      <section className="bg-[#181818] rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">درباره آهنگ</h3>
        <p className="text-[#a7a7a7] text-sm leading-relaxed">
          {data.title} اثر {data.artist?.name}
          {data.album ? ` از آلبوم ${data.album.title}` : ''}
          {data.genre ? ` • سبک: ${data.genre}` : ''}
          {` • مدت: ${formatDuration(data.duration)}`}
          {` • ${formatPlayCount(data.playCount)} بار پخش شده`}
        </p>
        {data.artist?.bio && (
          <p className="text-[#a7a7a7] text-sm leading-relaxed mt-3">
            {data.artist.bio}
          </p>
        )}
      </section>

      {/* Related tracks */}
      {data.relatedTracks && data.relatedTracks.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">آهنگ‌های مشابه</h2>
          <div className="space-y-1">
            {data.relatedTracks.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index}
                queue={[data, ...data.relatedTracks]}
                navigate={navigate}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
