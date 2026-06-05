import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const artist = await db.artist.findUnique({
      where: { id },
      include: {
        albums: {
          orderBy: { releaseYear: 'desc' },
          include: {
            _count: {
              select: { tracks: true },
            },
          },
        },
        tracks: {
          orderBy: { playCount: 'desc' },
          include: {
            album: true,
          },
        },
      },
    });

    if (!artist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(artist);
  } catch (error) {
    console.error('Error fetching artist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artist' },
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
    const { name, imageUrl, bio, monthlyListeners } = body;

    // Check if artist exists
    const existing = await db.artist.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'خواننده یافت نشد' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (bio !== undefined) updateData.bio = bio;
    if (monthlyListeners !== undefined) updateData.monthlyListeners = monthlyListeners;

    const artist = await db.artist.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { albums: true, tracks: true },
        },
      },
    });

    return NextResponse.json(artist);
  } catch (error) {
    console.error('Error updating artist:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی خواننده' },
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

    // Check if artist exists
    const existing = await db.artist.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'خواننده یافت نشد' },
        { status: 404 }
      );
    }

    // Get all track IDs for this artist (needed for playlist cleanup)
    const artistTracks = await db.track.findMany({
      where: { artistId: id },
      select: { id: true },
    });
    const trackIds = artistTracks.map((t) => t.id);

    // Delete playlist track entries for all artist's tracks
    if (trackIds.length > 0) {
      await db.playlistTrack.deleteMany({
        where: { trackId: { in: trackIds } },
      });
    }

    // Delete all tracks by this artist
    await db.track.deleteMany({
      where: { artistId: id },
    });

    // Delete all albums by this artist
    await db.album.deleteMany({
      where: { artistId: id },
    });

    // Delete the artist
    await db.artist.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'خواننده و تمام آثار آن با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting artist:', error);
    return NextResponse.json(
      { error: 'خطا در حذف خواننده' },
      { status: 500 }
    );
  }
}
