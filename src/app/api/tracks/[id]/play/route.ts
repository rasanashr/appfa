import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/tracks/[id]/play - Increment play count
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const track = await db.track.findUnique({ where: { id } });
    if (!track) {
      return NextResponse.json(
        { error: 'آهنگ یافت نشد' },
        { status: 404 }
      );
    }

    const updated = await db.track.update({
      where: { id },
      data: { playCount: { increment: 1 } },
      include: { artist: true, album: true },
    });

    return NextResponse.json({ playCount: updated.playCount });
  } catch (error) {
    console.error('Error incrementing play count:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی آمار پخش' },
      { status: 500 }
    );
  }
}
