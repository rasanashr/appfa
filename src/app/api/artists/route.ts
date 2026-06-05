import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    const where = search
      ? {
          name: {
            contains: search,
          },
        }
      : {};

    const artists = await db.artist.findMany({
      where,
      orderBy: { monthlyListeners: 'desc' },
      include: {
        _count: {
          select: { albums: true, tracks: true },
        },
      },
    });

    return NextResponse.json(artists);
  } catch (error) {
    console.error('Error fetching artists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artists' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, imageUrl, bio, monthlyListeners } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'نام خواننده الزامی است' },
        { status: 400 }
      );
    }

    const artist = await db.artist.create({
      data: {
        name: name.trim(),
        imageUrl: imageUrl ?? '/covers/artist-default.svg',
        bio: bio ?? '',
        monthlyListeners: monthlyListeners ?? 0,
      },
      include: {
        _count: {
          select: { albums: true, tracks: true },
        },
      },
    });

    return NextResponse.json(artist, { status: 201 });
  } catch (error) {
    console.error('Error creating artist:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد خواننده' },
      { status: 500 }
    );
  }
}
