import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [totalArtists, totalAlbums, totalTracks, totalPlaylists, aggregateResult] =
      await Promise.all([
        db.artist.count(),
        db.album.count(),
        db.track.count(),
        db.playlist.count(),
        db.track.aggregate({
          _sum: {
            playCount: true,
          },
        }),
      ]);

    const totalPlayCount = aggregateResult._sum.playCount ?? 0;

    const [topTracks, topArtists, recentTracks] = await Promise.all([
      db.track.findMany({
        take: 5,
        orderBy: { playCount: 'desc' },
        include: {
          artist: true,
          album: true,
        },
      }),
      db.artist.findMany({
        take: 5,
        orderBy: { monthlyListeners: 'desc' },
      }),
      db.track.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          artist: true,
          album: true,
        },
      }),
    ]);

    return NextResponse.json({
      totalArtists,
      totalAlbums,
      totalTracks,
      totalPlaylists,
      totalPlayCount,
      topTracks,
      topArtists,
      recentTracks,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت آمار' },
      { status: 500 }
    );
  }
}
