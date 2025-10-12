import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

export async function POST({ request, cookies }) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return json({ message: 'Email and password are required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return json({ message: 'Invalid credentials' }, { status: 400 });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return json({ message: 'Invalid credentials' }, { status: 400 });
  }

  const token = jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: '1h' });

  cookies.set('token', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60, // 1 hour
  });

  return json({ message: 'Logged in successfully' }, { status: 200 });
}