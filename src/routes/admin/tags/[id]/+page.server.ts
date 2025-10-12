import type { PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const tag = await prisma.tag.findUnique({
    where: { id: Number(params.id) },
  });

  if (!tag) {
    throw error(404, 'Tag not found');
  }

  return {
    tag,
  };
};