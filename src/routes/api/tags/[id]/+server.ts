import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';

export async function GET({ params }) {
  const tag = await prisma.tag.findUnique({
    where: { id: Number(params.id) },
  });

  if (!tag) {
    return json({ message: 'Tag not found' }, { status: 404 });
  }

  return json(tag, { status: 200 });
}

export async function PUT({ request, params, locals }) {
  if (!locals.user) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { name, slug } = await request.json();

  if (!name || !slug) {
    return json({ message: 'Missing required fields' }, { status: 400 });
  }

  const tag = await prisma.tag.update({
    where: { id: Number(params.id) },
    data: {
      name,
      slug,
    },
  });

  return json({ message: 'Tag updated successfully', tag }, { status: 200 });
}

export async function DELETE({ params, locals }) {
  if (!locals.user) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  await prisma.tag.delete({
    where: { id: Number(params.id) },
  });

  return json({ message: 'Tag deleted successfully' }, { status: 200 });
}