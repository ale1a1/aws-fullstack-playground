// ============================================================
// FE TOGGLE — control where the frontend sends requests
// ============================================================
// true  → calls AWS API Gateway → Lambda → RDS (live)
// false → calls local NestJS API on localhost:3000
//
// To switch: change USE_LAMBDA below.
//   Local dev:  no rebuild needed, Vite hot-reloads
//   Production: npm run build → re-upload dist/ to S3
// ============================================================
const USE_LAMBDA = false;

// Replace with your API Gateway URL after running: serverless deploy
// Format: https://YOUR-API-ID.execute-api.YOUR-REGION.amazonaws.com/users
const LAMBDA_BASE = 'https://YOUR-API-ID.execute-api.YOUR-REGION.amazonaws.com/users';
const LOCAL_BASE = 'http://localhost:3000/users';

const API_BASE = USE_LAMBDA ? LAMBDA_BASE : LOCAL_BASE;

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