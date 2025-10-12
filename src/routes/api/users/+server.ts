import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';

export async function GET({ locals }) {
  if (!locals.user || locals.user.role !== 'ADMIN') {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  const users = await prisma.user.findMany();
  return json(users, { status: 200 });
}

export async function POST({ request, locals }) {
  if (!locals.user || locals.user.role !== 'ADMIN') {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { email, name, password, role } = await request.json();

  if (!email || !password) {
    return json({ message: 'Email and password are required' }, { status: 400 });
  }

  const userExists = await prisma.user.findUnique({ where: { email } });

  if (userExists) {
    return json({ message: 'User already exists' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role,
    },
  });

  return json({ message: 'User created successfully', user }, { status: 201 });
}