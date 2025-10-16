import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function cleanEvaluations() {
  try {
    console.log('Deleting all completed evaluations to start fresh...');

    const result = await sql.query(
      `DELETE FROM evaluation_jobs
       WHERE status = 'completed'
       RETURNING id`
    );

    const deleted = result.rows || result;
    console.log(`✅ Deleted ${deleted.length} evaluations`);
    console.log('\nYou can now run a fresh evaluation from the app!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanEvaluations();
