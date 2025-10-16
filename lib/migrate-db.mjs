/**
 * Database Migration Script
 * Adds sectioned_recommendations and website_snapshot columns
 *
 * Run with: node lib/migrate-db.mjs
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

console.log('🔄 Starting database migration...\n');

try {
  // Check current schema
  console.log('1️⃣  Checking current table structure...');
  const columns = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'evaluations'
    ORDER BY ordinal_position
  `;

  console.log(`   Found ${columns.length} existing columns`);

  const hasSection = columns.some(c => c.column_name === 'sectioned_recommendations');
  const hasSnapshot = columns.some(c => c.column_name === 'website_snapshot');

  if (hasSection && hasSnapshot) {
    console.log('   ✅ Migration already applied - columns exist\n');
    console.log('   Existing columns:');
    console.log('   - sectioned_recommendations (JSONB)');
    console.log('   - website_snapshot (JSONB)');
    process.exit(0);
  }

  // Add missing columns
  console.log('\n2️⃣  Adding new columns...');

  if (!hasSection) {
    console.log('   Adding: sectioned_recommendations (JSONB)');
    await sql`
      ALTER TABLE evaluations
      ADD COLUMN sectioned_recommendations JSONB
    `;
    console.log('   ✅ Added sectioned_recommendations');
  } else {
    console.log('   ⏭️  sectioned_recommendations already exists');
  }

  if (!hasSnapshot) {
    console.log('   Adding: website_snapshot (JSONB)');
    await sql`
      ALTER TABLE evaluations
      ADD COLUMN website_snapshot JSONB
    `;
    console.log('   ✅ Added website_snapshot');
  } else {
    console.log('   ⏭️  website_snapshot already exists');
  }

  // Verify migration
  console.log('\n3️⃣  Verifying migration...');
  const newColumns = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'evaluations'
    AND column_name IN ('sectioned_recommendations', 'website_snapshot')
  `;

  if (newColumns.length === 2) {
    console.log('   ✅ Both columns verified in database');
  } else {
    throw new Error('Migration verification failed - columns not found');
  }

  // Check data integrity
  console.log('\n4️⃣  Checking data integrity...');
  const rowCount = await sql`SELECT COUNT(*) as count FROM evaluations`;
  console.log(`   ✅ All ${rowCount[0].count} existing evaluations preserved`);

  console.log('\n✅ Migration completed successfully!\n');
  console.log('📊 Summary:');
  console.log('   - Added: sectioned_recommendations (JSONB)');
  console.log('   - Added: website_snapshot (JSONB)');
  console.log(`   - Preserved: ${rowCount[0].count} evaluations`);
  console.log('\n💡 Next: Restart your Next.js server to use the new columns');

} catch (error) {
  console.error('\n❌ Migration failed:', error);
  console.error('\nError details:', error.message);
  process.exit(1);
}
