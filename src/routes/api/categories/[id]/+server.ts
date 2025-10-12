import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';

export async function GET({ params }) {
  const category = await prisma.category.findUnique({
    where: { id: Number(params.id) },
  });

  if (!category) {
    return json({ message: 'Category not found' }, { status: 404 });
  }

  return json(category, { status: 200 });
}

export async function PUT({ request, params, locals }) {
  if (!locals.user) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { name, slug } = await request.json();

  if (!name || !slug) {
    return json({ message: 'Missing required fields' }, { status: 400 });
  }

  const category = await prisma.category.update({
    where: { id: Number(params.id) },
    data: {
      name,
      slug,
    },
  });

  return json({ message: 'Category updated successfully', category }, { status: 200 });
}

export async function DELETE({ params, locals }) {
  if (!locals.user) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  await prisma.category.delete({
    where: { id: Number(params.id) },
  });

  return json({ message: 'Category deleted successfully' }, { status: 200 });
}