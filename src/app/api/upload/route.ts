import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.flac'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'فایل ارسال نشده است' },
        { status: 400 }
      );
    }

    if (!type || (type !== 'image' && type !== 'audio')) {
      return NextResponse.json(
        { error: 'نوع فایل باید "image" یا "audio" باشد' },
        { status: 400 }
      );
    }

    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase();

    // Validate file extension
    if (type === 'image') {
      if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: `فرمت تصویر پشتیبانی نمی‌شود. فرمت‌های مجاز: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}` },
          { status: 400 }
        );
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: 'حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد' },
          { status: 400 }
        );
      }
    } else {
      if (!ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: `فرمت صوتی پشتیبانی نمی‌شود. فرمت‌های مجاز: ${ALLOWED_AUDIO_EXTENSIONS.join(', ')}` },
          { status: 400 }
        );
      }
      if (file.size > MAX_AUDIO_SIZE) {
        return NextResponse.json(
          { error: 'حجم فایل صوتی نباید بیشتر از ۵۰ مگابایت باشد' },
          { status: 400 }
        );
      }
    }

    // Generate unique filename
    const uniqueName = `${Date.now()}-${originalName}`;
    const subDir = type === 'image' ? 'images' : 'audio';
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subDir);
    const filePath = path.join(uploadDir, uniqueName);

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Return public URL path
    const publicUrl = `/uploads/${subDir}/${uniqueName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: 'فایل با موفقیت آپلود شد',
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'خطا در آپلود فایل' },
      { status: 500 }
    );
  }
}
