// Toggle between AWS Lambda and local NestJS API for getUsers.
// true  → fetches from AWS Lambda (deployed endpoint)
// false → fetches from local NestJS server (localhost:3000)
const USE_LAMBDA = true;

const LAMBDA_GET_USERS = 'https://2hofv3uwna.execute-api.eu-west-2.amazonaws.com/dev/users';
const BASE = 'http://localhost:3000/users';

export type User = { id: number; name: string; email: string };

export async function getUsers(): Promise<User[]> {
  const res = await fetch(USE_LAMBDA ? LAMBDA_GET_USERS : BASE);
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
