import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const album = await db.album.findUnique({
      where: { id },
      include: {
        artist: true,
        tracks: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(album);
  } catch (error) {
    console.error('Error fetching album:', error);
    return NextResponse.json(
      { error: 'Failed to fetch album' },
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
    const { title, artistId, coverUrl, releaseYear } = body;

    // Check if album exists
    const existing = await db.album.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'آلبوم یافت نشد' },
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

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (artistId !== undefined) updateData.artistId = artistId;
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl;
    if (releaseYear !== undefined) updateData.releaseYear = releaseYear;

    const album = await db.album.update({
      where: { id },
      data: updateData,
      include: {
        artist: true,
        _count: {
          select: { tracks: true },
        },
      },
    });

    return NextResponse.json(album);
  } catch (error) {
    console.error('Error updating album:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی آلبوم' },
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

    // Check if album exists
    const existing = await db.album.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'آلبوم یافت نشد' },
        { status: 404 }
      );
    }

    // Get all track IDs for this album (needed for playlist cleanup)
    const albumTracks = await db.track.findMany({
      where: { albumId: id },
      select: { id: true },
    });
    const trackIds = albumTracks.map((t) => t.id);

    // Delete playlist track entries for all album's tracks
    if (trackIds.length > 0) {
      await db.playlistTrack.deleteMany({
        where: { trackId: { in: trackIds } },
      });
    }

    // Delete all tracks in this album
    await db.track.deleteMany({
      where: { albumId: id },
    });

    // Delete the album
    await db.album.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'آلبوم و تمام آهنگ‌های آن با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting album:', error);
    return NextResponse.json(
      { error: 'خطا در حذف آلبوم' },
      { status: 500 }
    );
  }
}
