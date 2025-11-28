require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function setup() {
  try {
    await client.connect();
    console.log(" Connected to Database...");

    // Drop tables in dependency order to avoid constraint errors
    console.log("Dropping existing tables...");
    await client.query('DROP TABLE IF EXISTS plan_features CASCADE;');
    await client.query('DROP TABLE IF EXISTS subscription_plans CASCADE;');
    await client.query('DROP TABLE IF EXISTS plan_types CASCADE;');
    await client.query('DROP TABLE IF EXISTS features CASCADE;');

    // --- 1. Features Table (No change, as features model in schema is identical) ---
    console.log("Creating 'features' table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS features (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        label VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // --- 2. Plan Types Table (Added 'description' field from schema.prisma) ---
    console.log("Creating 'plan_types' table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS plan_types (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) UNIQUE NOT NULL,
          description TEXT, -- NEW FIELD from schema.prisma
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // --- 3. Subscription Plans Table (Added 'description', 'is_default', 'offer_type', 'offer_value', 'tag') ---
    console.log("Creating 'subscription_plans' table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          plan_type_id UUID NOT NULL,
          label_suffix VARCHAR(255) NOT NULL, -- e.g., 'monthly' or 'annual'
          price NUMERIC(10, 2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'USD',
          duration_months INTEGER NOT NULL, -- 0 for lifetime, 1 for monthly, 12 for yearly
          description TEXT, -- NEW FIELD from schema.prisma
          is_default BOOLEAN DEFAULT FALSE, -- NEW FIELD from schema.prisma
          is_active BOOLEAN DEFAULT TRUE,
          offer_type VARCHAR(20), -- NEW FIELD (Corresponds to 'offer_type_enum' in schema)
          offer_value NUMERIC, -- NEW FIELD from schema.prisma
          tag VARCHAR(255), -- NEW FIELD from schema.prisma
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (plan_type_id) REFERENCES plan_types(id) ON DELETE RESTRICT,
          UNIQUE (plan_type_id, label_suffix)
      );
    `);

    // --- 4. Plan Features Table (No change, as it's the many-to-many link, though missing in schema.prisma) ---
    console.log("Creating 'plan_features' table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS plan_features (
          plan_id UUID NOT NULL,
          feature_id UUID NOT NULL,
          feature_key VARCHAR(50),      -- NEW: Machine-readable key (e.g., 'max_interviews')
          limit_value INTEGER,
          PRIMARY KEY (plan_id, feature_id),
          FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
          FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
      );
    `);

    console.log(" Database setup complete! New Plan/Product model created.");
    
    
  } catch (err) {
    console.error(" Error setting up database:", err);
  } finally {
    await client.end();
  }
}

setup();