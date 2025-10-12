import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';

export async function GET() {
  const tags = await prisma.tag.findMany();
  return json(tags, { status: 200 });
}

export async function POST({ request, locals }) {
  if (!locals.user) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { name, slug } = await request.json();

  if (!name || !slug) {
    return json({ message: 'Missing required fields' }, { status: 400 });
  }

  const tag = await prisma.tag.create({
    data: {
      name,
      slug,
    },
  });

  return json({ message: 'Tag created successfully', tag }, { status: 201 });
}