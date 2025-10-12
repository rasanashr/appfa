import { redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import prisma from '$lib/server/prisma';

export async function handle({ event, resolve }) {
  const token = event.cookies.get('token');
  const unprotectedRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register'];

  if (!token && !unprotectedRoutes.includes(event.url.pathname)) {
    throw redirect(303, '/login');
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });

      if (user) {
        event.locals.user = user;
      } else {
        event.cookies.delete('token', { path: '/' });
        if (!unprotectedRoutes.includes(event.url.pathname)) {
          throw redirect(303, '/login');
        }
      }
    } catch (error) {
      event.cookies.delete('token', { path: '/' });
      if (!unprotectedRoutes.includes(event.url.pathname)) {
        throw redirect(303, '/login');
      }
    }
  }

  if (token && (event.url.pathname === '/login' || event.url.pathname === '/register')) {
    throw redirect(303, '/');
  }

  return resolve(event);
}