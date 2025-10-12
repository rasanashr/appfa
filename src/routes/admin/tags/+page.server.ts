import type { PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';

export const load: PageServerLoad = async () => {
  const tags = await prisma.tag.findMany();

  return {
    tags,
  };
};