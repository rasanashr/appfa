import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const playlist = await db.playlist.findUnique({
      where: { id },
      include: {
        tracks: {
          include: {
            track: {
              include: {
                artist: true,
                album: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(playlist);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { trackId } = body;

    if (!trackId || typeof trackId !== 'string') {
      return NextResponse.json(
        { error: 'trackId is required' },
        { status: 400 }
      );
    }

    // Verify playlist exists
    const playlist = await db.playlist.findUnique({
      where: { id },
      include: {
        tracks: {
          orderBy: { order: 'desc' },
          take: 1,
        },
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    // Verify track exists
    const track = await db.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    // Check if track is already in the playlist
    const existingEntry = await db.playlistTrack.findFirst({
      where: {
        playlistId: id,
        trackId,
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Track is already in this playlist' },
        { status: 409 }
      );
    }

    // Determine the next order value
    const nextOrder = playlist.tracks.length > 0
      ? playlist.tracks[0].order + 1
      : 1;

    const playlistTrack = await db.playlistTrack.create({
      data: {
        playlistId: id,
        trackId,
        order: nextOrder,
      },
      include: {
        track: {
          include: {
            artist: true,
            album: true,
          },
        },
      },
    });

    return NextResponse.json(playlistTrack, { status: 201 });
  } catch (error) {
    console.error('Error adding track to playlist:', error);
    return NextResponse.json(
      { error: 'Failed to add track to playlist' },
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
    const { title, description, coverUrl, isPublic } = body;

    // Check if playlist exists
    const existing = await db.playlist.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'پلی‌لیست یافت نشد' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const playlist = await db.playlist.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { tracks: true },
        },
      },
    });

    return NextResponse.json(playlist);
  } catch (error) {
    console.error('Error updating playlist:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی پلی‌لیست' },
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

    // Check if playlist exists
    const existing = await db.playlist.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'پلی‌لیست یافت نشد' },
        { status: 404 }
      );
    }

    // Delete all playlist track entries first (manual cascade for SQLite)
    await db.playlistTrack.deleteMany({
      where: { playlistId: id },
    });

    // Delete the playlist
    await db.playlist.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'پلی‌لیست با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json(
      { error: 'خطا در حذف پلی‌لیست' },
      { status: 500 }
    );
  }
}
