import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// ============================================================
// DB TOGGLE — control which database the local NestJS API uses
// ============================================================
// true  → connects to AWS RDS (live database)
// false → connects to local PostgreSQL (local dev database)
//
// To switch: change USE_RDS below, then restart the NestJS server.
// ============================================================
const USE_RDS = false;

const connectionString = USE_RDS
  ? process.env.RDS_URL        // AWS RDS — set in .env
  : process.env.DATABASE_URL;  // Local PostgreSQL — set in .env

export const pool = new Pool({ connectionString });
