import type { PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';

export const load: PageServerLoad = async () => {
  const categories = await prisma.category.findMany();

  return {
    categories,
  };
};