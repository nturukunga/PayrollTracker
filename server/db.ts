import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import pg from 'pg';
import { log } from "./vite";

const { Pool } = pg;

// Create a pg Pool for session store
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create PostgreSQL connection using environment variables
export const createPostgresConnection = async () => {
  try {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable not found");
    }
    
    // Create postgres connection
    const client = postgres(connectionString);
    
    log("PostgreSQL Database connected successfully");
    
    // Initialize and return the drizzle ORM instance
    return drizzle(client);
  } catch (error) {
    log(`PostgreSQL Database connection error: ${error}`, "error");
    throw new Error(`Database connection failed: ${error}`);
  }
};

// Create a connection function to be called at application startup
let dbInstance: ReturnType<typeof drizzle>;

export async function initDatabase() {
  if (!dbInstance) {
    dbInstance = await createPostgresConnection();
  }
  return dbInstance;
}

// Export a function to get the db instance
export function getDb() {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return dbInstance;
}
