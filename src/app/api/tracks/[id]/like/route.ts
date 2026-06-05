import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/tracks/[id]/like - Check if current session likes this track + get like count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    const likeCount = await db.like.count({
      where: { trackId: id },
    });

    let isLiked = false;
    if (sessionId) {
      const existing = await db.like.findUnique({
        where: { trackId_sessionId: { trackId: id, sessionId } },
      });
      isLiked = !!existing;
    }

    return NextResponse.json({ likeCount, isLiked });
  } catch (error) {
    console.error('Error checking like:', error);
    return NextResponse.json(
      { error: 'خطا در بررسی لایک' },
      { status: 500 }
    );
  }
}

// POST /api/tracks/[id]/like - Toggle like
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'شناسه نشست الزامی است' },
        { status: 400 }
      );
    }

    // Check if track exists
    const track = await db.track.findUnique({ where: { id } });
    if (!track) {
      return NextResponse.json(
        { error: 'آهنگ یافت نشد' },
        { status: 404 }
      );
    }

    // Check existing like
    const existing = await db.like.findUnique({
      where: { trackId_sessionId: { trackId: id, sessionId } },
    });

    if (existing) {
      // Unlike
      await db.like.delete({ where: { id: existing.id } });
      const likeCount = await db.like.count({ where: { trackId: id } });
      return NextResponse.json({ isLiked: false, likeCount });
    } else {
      // Like
      await db.like.create({
        data: { trackId: id, sessionId },
      });
      const likeCount = await db.like.count({ where: { trackId: id } });
      return NextResponse.json({ isLiked: true, likeCount });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت لایک' },
      { status: 500 }
    );
  }
}
