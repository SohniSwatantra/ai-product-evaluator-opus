import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

// Read DATABASE_URL from .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const dbUrl = envContent.match(/DATABASE_URL=(.*)/)?.[1]?.trim() || '';

const sql = neon(dbUrl);

console.log('🔍 Querying Neon database...\n');

const result = await sql`
  SELECT
    id,
    url,
    overall_score,
    buying_intent_probability,
    purchase_intent_anchor,
    timestamp
  FROM evaluations
  ORDER BY timestamp DESC
  LIMIT 10
`;

console.log(`Found ${result.length} evaluations:\n`);

result.forEach((row, idx) => {
  console.log(`${idx + 1}. ID: ${row.id}`);
  console.log(`   URL: ${row.url}`);
  console.log(`   Score: ${row.overall_score}/100`);
  console.log(`   Intent: ${row.buying_intent_probability}% (${row.purchase_intent_anchor})`);
  console.log(`   Date: ${new Date(row.timestamp).toLocaleString()}`);
  console.log('');
});

console.log('✅ Database query complete');
