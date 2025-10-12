import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
  if (!locals.user) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { title, slug, body, categoryId, featuredImage, video, tags, postType, seoTitle, seoDescription, schema } = await request.json();

  if (!title || !slug || !body || !categoryId) {
    return json({ message: 'Missing required fields' }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      body,
      authorId: locals.user.id,
      categoryId,
      featuredImage,
      video,
      postType,
      seoTitle,
      seoDescription,
      schema,
      tags: {
        connect: tags.map((tagId: number) => ({ id: tagId })),
      },
    },
  });

  return json({ message: 'Post created successfully', post }, { status: 201 });
}

export async function GET() {
  const posts = await prisma.post.findMany({
    include: {
      author: true,
      category: true,
      tags: true,
    },
  });

  return json(posts, { status: 200 });
}