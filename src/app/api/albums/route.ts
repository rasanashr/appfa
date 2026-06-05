import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    const where = search
      ? {
          OR: [
            { title: { contains: search } },
            { artist: { name: { contains: search } } },
          ],
        }
      : {};

    const albums = await db.album.findMany({
      where,
      orderBy: { releaseYear: 'desc' },
      include: {
        artist: true,
        _count: {
          select: { tracks: true },
        },
      },
    });

    return NextResponse.json(albums);
  } catch (error) {
    console.error('Error fetching albums:', error);
    return NextResponse.json(
      { error: 'Failed to fetch albums' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, artistId, coverUrl, releaseYear } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'عنوان آلبوم الزامی است' },
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

    const album = await db.album.create({
      data: {
        title: title.trim(),
        artistId,
        coverUrl: coverUrl ?? '/covers/album-default.svg',
        releaseYear: releaseYear ?? 2024,
      },
      include: {
        artist: true,
        _count: {
          select: { tracks: true },
        },
      },
    });

    return NextResponse.json(album, { status: 201 });
  } catch (error) {
    console.error('Error creating album:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد آلبوم' },
      { status: 500 }
    );
  }
}
