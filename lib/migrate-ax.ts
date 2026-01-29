/**
 * Migration script to add Agent Experience (AX) columns to existing evaluations table
 */

import { neon } from "@neondatabase/serverless";

// Lazy initialize to avoid build-time errors when DATABASE_URL is not set
let _sql: ReturnType<typeof neon> | null = null;
const getSql = () => {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL environment variable is not configured");
    }
    _sql = neon(url);
  }
  return _sql;
};

export async function migrateAXColumns() {
  try {
    const sql = getSql();
    console.log("Starting AX columns migration...");

    // Add AX columns to existing evaluations table
    await sql`
      ALTER TABLE evaluations
      ADD COLUMN IF NOT EXISTS ax_score INTEGER,
      ADD COLUMN IF NOT EXISTS anps INTEGER,
      ADD COLUMN IF NOT EXISTS ax_factors JSONB,
      ADD COLUMN IF NOT EXISTS agent_accessibility TEXT,
      ADD COLUMN IF NOT EXISTS ax_recommendations JSONB
    `;

    console.log("✓ Successfully added AX columns to evaluations table");
    return { success: true, message: "AX columns migration completed" };
  } catch (error) {
    console.error("Error during AX migration:", error);
    throw error;
  }
}
