import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const playlists = await db.playlist.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { tracks: true },
        },
      },
    });

    return NextResponse.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, coverUrl, isPublic } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const playlist = await db.playlist.create({
      data: {
        title: title.trim(),
        description: description ?? '',
        coverUrl: coverUrl ?? '/covers/playlist-default.svg',
        isPublic: isPublic ?? true,
      },
      include: {
        _count: {
          select: { tracks: true },
        },
      },
    });

    return NextResponse.json(playlist, { status: 201 });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    );
  }
}
