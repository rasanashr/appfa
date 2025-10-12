import type { PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.user || locals.user.role !== 'ADMIN') {
    throw error(403, 'Forbidden');
  }

  if (params.id === 'new') {
    return {
      user: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(params.id) },
  });

  if (!user) {
    throw error(404, 'User not found');
  }

  return {
    user,
  };
};