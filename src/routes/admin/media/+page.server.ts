import type { PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';

export const load: PageServerLoad = async () => {
  const media = await prisma.media.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    media,
  };
};