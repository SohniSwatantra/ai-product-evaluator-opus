/**
 * Add user_id column to evaluations table
 * Run with: node lib/add-user-id-migration.mjs
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

console.log('🚀 Running migration: Add user_id column...\n');

try {
  // Check if column already exists
  console.log('1️⃣  Checking if user_id column exists...');
  const columns = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'evaluations' AND column_name = 'user_id'
  `;

  if (columns.length > 0) {
    console.log('   ✅ user_id column already exists. No migration needed.');
    process.exit(0);
  }

  // Add user_id column
  console.log('\n2️⃣  Adding user_id column...');
  await sql`
    ALTER TABLE evaluations
    ADD COLUMN user_id TEXT
  `;
  console.log('   ✅ user_id column added successfully');

  // Create index on user_id
  console.log('\n3️⃣  Creating index on user_id...');
  await sql`
    CREATE INDEX idx_evaluations_user_id ON evaluations(user_id)
  `;
  console.log('   ✅ Index created successfully');

  // Verify the migration
  console.log('\n4️⃣  Verifying migration...');
  const verification = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'evaluations' AND column_name = 'user_id'
  `;

  console.log(`   ✅ user_id column verified:`, verification[0]);

  // Check current data
  const rowCount = await sql`SELECT COUNT(*) as count FROM evaluations`;
  const anonymousCount = await sql`SELECT COUNT(*) as count FROM evaluations WHERE user_id IS NULL`;

  console.log('\n✅ Migration complete!\n');
  console.log('📊 Summary:');
  console.log(`   - Total evaluations: ${rowCount[0].count}`);
  console.log(`   - Anonymous evaluations: ${anonymousCount[0].count}`);
  console.log('\n💡 All existing evaluations are now anonymous (user_id = NULL)');
  console.log('   New evaluations will be associated with logged-in users.');

} catch (error) {
  console.error('\n❌ Migration failed:', error);
  console.error('\nError details:', error.message);
  process.exit(1);
}
