import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';

export async function GET({ params }) {
  const post = await prisma.post.findUnique({
    where: { id: Number(params.id) },
    include: {
      author: true,
      category: true,
      tags: true,
    },
  });

  if (!post) {
    return json({ message: 'Post not found' }, { status: 404 });
  }

  return json(post, { status: 200 });
}

export async function PUT({ request, params, locals }) {
  if (!locals.user) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { title, slug, body, categoryId, featuredImage, video, tags, postType, seoTitle, seoDescription, schema } = await request.json();

  if (!title || !slug || !body || !categoryId) {
    return json({ message: 'Missing required fields' }, { status: 400 });
  }

  const post = await prisma.post.update({
    where: { id: Number(params.id) },
    data: {
      title,
      slug,
      body,
      categoryId,
      featuredImage,
      video,
      postType,
      seoTitle,
      seoDescription,
      schema,
      tags: {
        set: tags.map((tagId: number) => ({ id: tagId })),
      },
    },
  });

  return json({ message: 'Post updated successfully', post }, { status: 200 });
}

export async function DELETE({ params, locals }) {
  if (!locals.user) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  await prisma.post.delete({
    where: { id: Number(params.id) },
  });

  return json({ message: 'Post deleted successfully' }, { status: 200 });
}