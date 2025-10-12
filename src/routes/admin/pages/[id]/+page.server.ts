import type { PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  if (params.id === 'new') {
    return {
      page: null,
    };
  }

  const page = await prisma.page.findUnique({
    where: { id: Number(params.id) },
  });

  if (!page) {
    throw error(404, 'Page not found');
  }

  return {
    page,
  };
};