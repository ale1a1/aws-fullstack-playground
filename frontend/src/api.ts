const BASE = 'http://localhost:3000/users';

export type User = { id: number; name: string; email: string };

export async function getUsers(): Promise<User[]> {
  const res = await fetch(BASE);
  return res.json();
}

export async function createUser(name: string, email: string): Promise<User> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  });
  return res.json();
}

export async function updateUser(id: number, name: string, email: string): Promise<User> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  });
  return res.json();
}

export async function deleteUser(id: number): Promise<void> {
  await fetch(`${BASE}/${id}`, { method: 'DELETE' });
}
