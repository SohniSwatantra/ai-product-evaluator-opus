import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function checkDatabase() {
  try {
    const result = await sql.query(
      `SELECT id, status, result, created_at
       FROM evaluation_jobs
       ORDER BY created_at DESC
       LIMIT 5`
    );

    const evaluations = result.rows || result;
    console.log(`\nFound ${evaluations.length} recent evaluations:\n`);

    for (const evaluation of evaluations) {
      console.log(`ID: ${evaluation.id}`);
      console.log(`Status: ${evaluation.status}`);
      console.log(`Created: ${evaluation.created_at}`);

      if (evaluation.result) {
        console.log('Result structure:', JSON.stringify(evaluation.result, null, 2).substring(0, 500) + '...');
      } else {
        console.log('No result');
      }
      console.log('---\n');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDatabase();
