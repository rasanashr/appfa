import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const genre = searchParams.get('genre');
    const artistId = searchParams.get('artistId');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { artist: { name: { contains: search } } },
        { album: { title: { contains: search } } },
      ];
    }

    if (genre) {
      if (where.OR) {
        // If search is active, add genre filter on top
        const searchConditions = where.OR;
        delete where.OR;
        where.AND = [
          { OR: searchConditions },
          { genre: { contains: genre } },
        ];
      } else {
        where.genre = { contains: genre };
      }
    }

    if (artistId) {
      if (where.AND) {
        (where.AND as Record<string, unknown>[]).push({ artistId });
      } else if (where.OR) {
        const searchConditions = where.OR;
        delete where.OR;
        where.AND = [
          { OR: searchConditions },
          { artistId },
        ];
      } else {
        where.artistId = artistId;
      }
    }

    const tracks = await db.track.findMany({
      where,
      orderBy: { playCount: 'desc' },
      include: {
        artist: true,
        album: true,
      },
    });

    return NextResponse.json(tracks);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, artistId, albumId, duration, audioUrl, coverUrl, genre, playCount } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'عنوان آهنگ الزامی است' },
        { status: 400 }
      );
    }

    if (!artistId || typeof artistId !== 'string') {
      return NextResponse.json(
        { error: 'شناسه خواننده الزامی است' },
        { status: 400 }
      );
    }

    // Verify artist exists
    const artist = await db.artist.findUnique({ where: { id: artistId } });
    if (!artist) {
      return NextResponse.json(
        { error: 'خواننده یافت نشد' },
        { status: 404 }
      );
    }

    // If albumId is provided, verify it exists
    if (albumId) {
      const album = await db.album.findUnique({ where: { id: albumId } });
      if (!album) {
        return NextResponse.json(
          { error: 'آلبوم یافت نشد' },
          { status: 404 }
        );
      }
    }

    const track = await db.track.create({
      data: {
        title: title.trim(),
        artistId,
        albumId: albumId ?? null,
        duration: duration ?? 0,
        audioUrl: audioUrl ?? '',
        coverUrl: coverUrl ?? '',
        genre: genre ?? 'پاپ',
        playCount: playCount ?? 0,
      },
      include: {
        artist: true,
        album: true,
      },
    });

    return NextResponse.json(track, { status: 201 });
  } catch (error) {
    console.error('Error creating track:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد آهنگ' },
      { status: 500 }
    );
  }
}
