/**
 * Migration script to add Agent Experience (AX) columns to existing evaluations table
 */

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL || "");

export async function migrateAXColumns() {
  try {
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
