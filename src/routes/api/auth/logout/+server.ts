import { json } from '@sveltejs/kit';

export async function POST({ cookies }) {
  cookies.delete('token', { path: '/' });
  return json({ message: 'Logged out successfully' }, { status: 200 });
}