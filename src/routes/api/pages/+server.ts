import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
  if (!locals.user) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { title, slug, body, featuredImage, seoTitle, seoDescription, schema } = await request.json();

  if (!title || !slug || !body) {
    return json({ message: 'Missing required fields' }, { status: 400 });
  }

  const page = await prisma.page.create({
    data: {
      title,
      slug,
      body,
      authorId: locals.user.id,
      featuredImage,
      seoTitle,
      seoDescription,
      schema,
    },
  });

  return json({ message: 'Page created successfully', page }, { status: 201 });
}

export async function GET() {
  const pages = await prisma.page.findMany({
    include: {
      author: true,
    },
  });

  return json(pages, { status: 200 });
}