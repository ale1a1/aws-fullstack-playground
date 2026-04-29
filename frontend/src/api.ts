// Toggle between AWS Lambda and local NestJS API (so far done for getUsers and deleteUser only)
// true  → fetches from AWS Lambda (deployed endpoints)
// false → fetches from local NestJS server (localhost:3000)
const USE_LAMBDA = true;

const LAMBDA_BASE = 'https://12tcv4g2fl.execute-api.eu-west-2.amazonaws.com/users';
const BASE = 'http://localhost:3000/users';

// 👉 Single source of truth for base URL
const API_BASE = USE_LAMBDA ? LAMBDA_BASE : BASE;

export type User = { id: number; name: string; email: string };

export async function getUsers(): Promise<User[]> {
  const res = await fetch(API_BASE);
  return res.json();
}

export async function deleteUser(id: number): Promise<void> {
  await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
}

export async function createUser(name: string, email: string): Promise<User> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  });
  return res.json();
}

export async function updateUser(id: number, name: string, email: string): Promise<User> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  });
  return res.json();
}