import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';

export async function GET({ params }) {
  const page = await prisma.page.findUnique({
    where: { id: Number(params.id) },
    include: {
      author: true,
    },
  });

  if (!page) {
    return json({ message: 'Page not found' }, { status: 404 });
  }

  return json(page, { status: 200 });
}

export async function PUT({ request, params, locals }) {
  if (!locals.user) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { title, slug, body, featuredImage, seoTitle, seoDescription, schema } = await request.json();

  if (!title || !slug || !body) {
    return json({ message: 'Missing required fields' }, { status: 400 });
  }

  const page = await prisma.page.update({
    where: { id: Number(params.id) },
    data: {
      title,
      slug,
      body,
      featuredImage,
      seoTitle,
      seoDescription,
      schema,
    },
  });

  return json({ message: 'Page updated successfully', page }, { status: 200 });
}

export async function DELETE({ params, locals }) {
  if (!locals.user) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  await prisma.page.delete({
    where: { id: Number(params.id) },
  });

  return json({ message: 'Page deleted successfully' }, { status: 200 });
}