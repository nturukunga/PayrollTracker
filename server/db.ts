import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { log } from "./vite";

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

// Export a connection instance
export const db = await createPostgresConnection();
