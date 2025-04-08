import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import pg from 'pg';
import { log } from "./vite";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const createPostgresConnection = async () => {
  try {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable not found");
    }
    
    const client = postgres(connectionString);
    
    log("PostgreSQL Database connected successfully");
    
    return drizzle(client);
  } catch (error) {
    log(`PostgreSQL Database connection error: ${error}`, "error");
    throw new Error(`Database connection failed: ${error}`);
  }
};

let dbInstance: ReturnType<typeof drizzle>;

export async function initDatabase() {
  if (!dbInstance) {
    dbInstance = await createPostgresConnection();
  }
  return dbInstance;
}

export function getDb() {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return dbInstance;
}
