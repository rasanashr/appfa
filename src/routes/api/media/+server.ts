import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';

export async function POST({ request, locals }) {
  if (!locals.user) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.formData();
  const file = data.get('file') as File;

  if (!file) {
    return json({ message: 'No file uploaded' }, { status: 400 });
  }

  const fileName = `${Date.now()}-${file.name}`;
  // Note: SvelteKit's CWD is the project root, so this path is correct.
  const filePath = resolve('static/uploads', fileName);
  const fileUrl = `/uploads/${fileName}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const media = await prisma.media.create({
      data: {
        url: fileUrl,
        type: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
        altText: data.get('altText')?.toString(),
        uploadedById: locals.user.id,
      },
    });

    return json({ message: 'File uploaded successfully', media }, { status: 201 });
  } catch (error) {
    console.error(error);
    return json({ message: 'File upload failed' }, { status: 500 });
  }
}

export async function GET() {
  const media = await prisma.media.findMany({
    include: {
      uploadedBy: true,
    },
  });
  return json(media, { status: 200 });
}