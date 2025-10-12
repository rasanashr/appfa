import type { PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';

export const load: PageServerLoad = async () => {
  const posts = await prisma.post.findMany({
    include: {
      author: true,
      category: true,
    },
  });

  return {
    posts,
  };
};