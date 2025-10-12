import type { PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user || locals.user.role !== 'ADMIN') {
    throw error(403, 'Forbidden');
  }

  const users = await prisma.user.findMany();

  return {
    users,
  };
};