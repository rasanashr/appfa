import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const track = await db.track.findUnique({
      where: { id },
      include: {
        artist: true,
        album: true,
        likes: true,
      },
    });

    if (!track) {
      return NextResponse.json(
        { error: 'آهنگ یافت نشد' },
        { status: 404 }
      );
    }

    // Get like count
    const likeCount = track.likes.length;

    // Get related tracks from same artist (exclude current)
    const relatedTracks = await db.track.findMany({
      where: {
        artistId: track.artistId,
        id: { not: track.id },
      },
      take: 6,
      orderBy: { playCount: 'desc' },
      include: { artist: true, album: true },
    });

    return NextResponse.json({
      ...track,
      likeCount,
      relatedTracks,
    });
  } catch (error) {
    console.error('Error fetching track:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات آهنگ' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, artistId, albumId, duration, audioUrl, coverUrl, genre, playCount } = body;

    // Check if track exists
    const existing = await db.track.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'آهنگ یافت نشد' },
        { status: 404 }
      );
    }

    // If artistId is being changed, verify the new artist exists
    if (artistId) {
      const artist = await db.artist.findUnique({ where: { id: artistId } });
      if (!artist) {
        return NextResponse.json(
          { error: 'خواننده یافت نشد' },
          { status: 404 }
        );
      }
    }

    // If albumId is being set, verify the album exists
    if (albumId) {
      const album = await db.album.findUnique({ where: { id: albumId } });
      if (!album) {
        return NextResponse.json(
          { error: 'آلبوم یافت نشد' },
          { status: 404 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (artistId !== undefined) updateData.artistId = artistId;
    if (albumId !== undefined) updateData.albumId = albumId;
    if (duration !== undefined) updateData.duration = duration;
    if (audioUrl !== undefined) updateData.audioUrl = audioUrl;
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl;
    if (genre !== undefined) updateData.genre = genre;
    if (playCount !== undefined) updateData.playCount = playCount;

    const track = await db.track.update({
      where: { id },
      data: updateData,
      include: {
        artist: true,
        album: true,
      },
    });

    return NextResponse.json(track);
  } catch (error) {
    console.error('Error updating track:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی آهنگ' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if track exists
    const existing = await db.track.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'آهنگ یافت نشد' },
        { status: 404 }
      );
    }

    // Delete playlist track entries first (manual cascade for SQLite)
    await db.playlistTrack.deleteMany({
      where: { trackId: id },
    });

    // Delete the track
    await db.track.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'آهنگ با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting track:', error);
    return NextResponse.json(
      { error: 'خطا در حذف آهنگ' },
      { status: 500 }
    );
  }
}
