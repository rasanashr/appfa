import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [featuredPlaylists, newReleases, topArtists, topTracks] = await Promise.all([
      // Featured playlists (public, limited to 6)
      db.playlist.findMany({
        where: { isPublic: true },
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          tracks: {
            include: {
              track: {
                include: {
                  artist: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      }),

      // New releases (albums, limited to 8)
      db.album.findMany({
        take: 8,
        orderBy: { releaseYear: 'desc' },
        include: {
          artist: true,
          tracks: true,
        },
      }),

      // Top artists (by monthly listeners, limited to 8)
      db.artist.findMany({
        take: 8,
        orderBy: { monthlyListeners: 'desc' },
        include: {
          _count: {
            select: { albums: true, tracks: true },
          },
        },
      }),

      // Top tracks (by play count, limited to 10)
      db.track.findMany({
        take: 10,
        orderBy: { playCount: 'desc' },
        include: {
          artist: true,
          album: true,
        },
      }),
    ]);

    return NextResponse.json({
      featuredPlaylists,
      newReleases,
      topArtists,
      topTracks,
    });
  } catch (error) {
    console.error('Error fetching home data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch home data' },
      { status: 500 }
    );
  }
}
