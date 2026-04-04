// src/db/index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Puxa a string de conexão do seu .env
const sql = neon(import.meta.env.DATABASE_URL);
export const db = drizzle(sql);