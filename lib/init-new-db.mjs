/**
 * Initialize New Database
 * Creates the evaluations table from scratch with ALL columns
 *
 * Run with: node lib/init-new-db.mjs
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

// Read DATABASE_URL from .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const dbUrl = envContent.match(/DATABASE_URL=(.*)/)?.[1]?.trim() || '';

if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sql = neon(dbUrl);

console.log('🚀 Initializing new database...\n');

try {
  // Create the evaluations table with ALL columns
  console.log('1️⃣  Creating evaluations table...');

  await sql`
    CREATE TABLE IF NOT EXISTS evaluations (
      id SERIAL PRIMARY KEY,
      url TEXT NOT NULL,
      overall_score INTEGER NOT NULL,
      buying_intent_probability INTEGER NOT NULL,
      purchase_intent_anchor TEXT NOT NULL,
      target_demographics JSONB NOT NULL,
      product_attributes JSONB NOT NULL,
      factors JSONB NOT NULL,
      analysis TEXT NOT NULL,
      demographic_impact TEXT NOT NULL,
      recommendations JSONB NOT NULL,
      ssr_score INTEGER,
      ssr_confidence INTEGER,
      ssr_margin_confidence INTEGER,
      ssr_distribution JSONB,
      textual_analysis TEXT,
      methodology_comparison JSONB,
      ax_score INTEGER,
      anps INTEGER,
      ax_factors JSONB,
      agent_accessibility TEXT,
      ax_recommendations JSONB,
      sectioned_recommendations JSONB,
      website_snapshot JSONB,
      timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  console.log('   ✅ Table created successfully');

  // Create index on timestamp for faster queries
  console.log('\n2️⃣  Creating indexes...');

  await sql`
    CREATE INDEX IF NOT EXISTS idx_evaluations_timestamp
    ON evaluations(timestamp DESC)
  `;

  console.log('   ✅ Index created on timestamp');

  // Verify table structure
  console.log('\n3️⃣  Verifying table structure...');

  const columns = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'evaluations'
    ORDER BY ordinal_position
  `;

  console.log(`   ✅ Found ${columns.length} columns`);

  // Check for our new columns
  const hasSection = columns.some(c => c.column_name === 'sectioned_recommendations');
  const hasSnapshot = columns.some(c => c.column_name === 'website_snapshot');

  if (hasSection && hasSnapshot) {
    console.log('   ✅ New columns verified:');
    console.log('      - sectioned_recommendations (JSONB)');
    console.log('      - website_snapshot (JSONB)');
  } else {
    throw new Error('Missing expected columns!');
  }

  // Check row count
  console.log('\n4️⃣  Checking data...');
  const rowCount = await sql`SELECT COUNT(*) as count FROM evaluations`;
  console.log(`   ✅ Current evaluations: ${rowCount[0].count}`);

  console.log('\n✅ Database initialization complete!\n');
  console.log('📊 Summary:');
  console.log(`   - Database: ${dbUrl.split('@')[1].split('/')[0]}`);
  console.log('   - Table: evaluations');
  console.log(`   - Columns: ${columns.length}`);
  console.log(`   - Rows: ${rowCount[0].count}`);
  console.log('\n💡 Your database is ready to store evaluations!');

} catch (error) {
  console.error('\n❌ Initialization failed:', error);
  console.error('\nError details:', error.message);
  process.exit(1);
}
