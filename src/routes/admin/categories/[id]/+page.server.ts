import type { PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const category = await prisma.category.findUnique({
    where: { id: Number(params.id) },
  });

  if (!category) {
    throw error(404, 'Category not found');
  }

  return {
    category,
  };
};