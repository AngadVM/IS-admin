// lib/db.ts

import { Pool } from 'pg';

// Use a single, persistent Pool instance for better performance
let pool: Pool;

/**
 * Initializes and returns the PostgreSQL connection pool.
 * Uses environment variable DATABASE_URL.
 * @returns The PostgreSQL Pool object.
 */
export const getDbPool = () => {
    if (!pool) {
        // Ensure DATABASE_URL is set in .env file
        if (!process.env.DATABASE_URL) {
            throw new Error("FATAL: DATABASE_URL environment variable is not set.");
        }
        
        const config = {
            connectionString: process.env.DATABASE_URL,
        };

        pool = new Pool(config);
        
        pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
        
        console.log("Database connection pool initialized.");
    }
    return pool;
};

/**
 * Executes a query using the established connection pool.
 * @param text The SQL query text.
 * @param params Optional array of parameters for parameterized query.
 * @returns The result object from the query execution.
 */
export const query = (text: string, params?: any[]) => {
    const dbPool = getDbPool();
    return dbPool.query(text, params);
};