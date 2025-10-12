import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';

export async function GET() {
  const categories = await prisma.category.findMany();
  return json(categories, { status: 200 });
}

export async function POST({ request, locals }) {
  if (!locals.user) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { name, slug } = await request.json();

  if (!name || !slug) {
    return json({ message: 'Missing required fields' }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: {
      name,
      slug,
    },
  });

  return json({ message: 'Category created successfully', category }, { status: 201 });
}