import type { PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const categories = await prisma.category.findMany();
  const tags = await prisma.tag.findMany();

  if (params.id === 'new') {
    return {
      post: null,
      categories,
      tags,
    };
  }

  const post = await prisma.post.findUnique({
    where: { id: Number(params.id) },
    include: {
      tags: true,
    },
  });

  if (!post) {
    throw error(404, 'Post not found');
  }

  return {
    post,
    categories,
    tags,
  };
};