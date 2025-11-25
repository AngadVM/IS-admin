// This script runs directly with Node.js to set up your DB
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function setup() {
  try {
    await client.connect();
    console.log("🔌 Connected to Database...");

    // IMPORTANT: Drop tables in dependency order to avoid constraint errors
    console.log("Dropping existing tables...");
    await client.query('DROP TABLE IF EXISTS plan_features CASCADE;');
    await client.query('DROP TABLE IF EXISTS subscription_plans CASCADE;');
    await client.query('DROP TABLE IF EXISTS plan_types CASCADE;');
    await client.query('DROP TABLE IF EXISTS features CASCADE;');

    // --- 1. Features Table (Holds feature labels and descriptions) ---
    console.log("Creating 'features' table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS features (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        label VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // --- 2. Plan Types Table (Holds the abstract plan name like 'Free', 'Premium') ---
    console.log("Creating 'plan_types' table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS plan_types (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // --- 3. Subscription Plans Table (Holds pricing, duration, and link to plan_types) ---
    console.log("Creating 'subscription_plans' table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          plan_type_id UUID NOT NULL,
          label_suffix VARCHAR(255) NOT NULL, -- e.g., 'monthly' or 'annual'
          price NUMERIC(10, 2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'USD',
          duration_months INTEGER NOT NULL, -- 0 for lifetime, 1 for monthly, 12 for yearly
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (plan_type_id) REFERENCES plan_types(id) ON DELETE RESTRICT,
          UNIQUE (plan_type_id, label_suffix)
      );
    `);

    // --- 4. Plan Features Table (Many-to-Many relationship between Plans and Features) ---
    console.log("Creating 'plan_features' table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS plan_features (
          plan_id UUID NOT NULL,
          feature_id UUID NOT NULL,
          PRIMARY KEY (plan_id, feature_id),
          FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
          FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
      );
    `);

    console.log("✅ Database setup complete! New Plan/Product model created.");
    
    // --- INSERTING INITIAL DATA ---
    console.log("Inserting initial data (Plan Types and Features)...");
    
    // Insert Plan Types
    await client.query(`INSERT INTO plan_types (id, name) VALUES
      ('f896b52c-c46b-4e1a-8c3b-7f3e8b09b5c3', 'Free'),
      ('14a9c80d-a3d2-4b2a-9e1e-2c9f5d6a8b7a', 'Starter'),
      ('5b7f1e0d-b8c3-4d2f-9a4c-1d0e8f7g2h3i', 'Pro')
      ON CONFLICT (name) DO NOTHING;
    `);

    // Insert Features
    await client.query(`INSERT INTO features (id, label, description) VALUES
      ('a2d3c4b5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'Unlimited projects', 'Create and manage an unlimited number of projects.'),
      ('b3e4c5d6-f7g8-5b9c-0d1e-2f3a4b5c6d7e', 'Real-time analytics', 'Access usage and performance metrics in real-time.'),
      ('c4f5d6e7-g8h9-6c0d-1e2f-3a4b5c6d7e8f', 'Priority support', '24/7 access to priority technical assistance.'),
      ('d5g6e7f8-h9i0-7d1e-2f3a-4b5c6d7e8f9g', 'Dedicated sandbox', 'A separate environment for testing and development.')
      ON CONFLICT (label) DO NOTHING;
    `);

  } catch (err) {
    console.error("❌ Error setting up database:", err);
  } finally {
    await client.end();
  }
}

setup();