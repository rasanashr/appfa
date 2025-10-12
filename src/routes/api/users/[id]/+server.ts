import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';

export async function GET({ params, locals }) {
  if (!locals.user || locals.user.role !== 'ADMIN') {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(params.id) },
  });

  if (!user) {
    return json({ message: 'User not found' }, { status: 404 });
  }

  return json(user, { status: 200 });
}

export async function PUT({ request, params, locals }) {
  if (!locals.user || locals.user.role !== 'ADMIN') {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { email, name, password, role } = await request.json();

  let hashedPassword;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id: Number(params.id) },
    data: {
      email,
      name,
      password: hashedPassword,
      role,
    },
  });

  return json({ message: 'User updated successfully', user }, { status: 200 });
}

export async function DELETE({ params, locals }) {
  if (!locals.user || locals.user.role !== 'ADMIN') {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  await prisma.user.delete({
    where: { id: Number(params.id) },
  });

  return json({ message: 'User deleted successfully' }, { status: 200 });
}