import type { PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';

export const load: PageServerLoad = async () => {
  const pages = await prisma.page.findMany({
    include: {
      author: true,
    },
  });

  return {
    pages,
  };
};