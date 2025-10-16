import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function fixRecommendations() {
  try {
    console.log('Fetching evaluations with object-type recommendations...');

    // Get all completed evaluations
    const result = await sql.query(
      `SELECT id, result
       FROM evaluation_jobs
       WHERE status = 'completed'
       AND result IS NOT NULL`
    );

    const evaluations = result.rows || result;
    console.log(`Found ${evaluations.length} completed evaluations`);

    for (const evaluation of evaluations) {
      const evalResult = evaluation.result;

      // Check if agentExperience.recommendations exists and is an object (not an array)
      if (
        evalResult?.agentExperience?.recommendations &&
        typeof evalResult.agentExperience.recommendations === 'object' &&
        !Array.isArray(evalResult.agentExperience.recommendations)
      ) {
        console.log(`\nFixing evaluation ${evaluation.id}...`);
        console.log('Old recommendations:', evalResult.agentExperience.recommendations);

        // Convert object to array of strings
        const recommendations = [];
        const recObj = evalResult.agentExperience.recommendations;

        if (recObj.strengths) {
          recommendations.push(`Strengths: ${recObj.strengths}`);
        }
        if (recObj.weaknesses) {
          recommendations.push(`Weaknesses: ${recObj.weaknesses}`);
        }
        if (recObj.opportunities) {
          recommendations.push(`Opportunities: ${recObj.opportunities}`);
        }

        // Update the result
        evalResult.agentExperience.recommendations = recommendations;

        // Save back to database
        await sql.query(
          `UPDATE evaluation_jobs
           SET result = $1
           WHERE id = $2`,
          [JSON.stringify(evalResult), evaluation.id]
        );

        console.log('New recommendations:', recommendations);
        console.log(`✓ Fixed evaluation ${evaluation.id}`);
      }
    }

    console.log('\n✓ All evaluations fixed!');
  } catch (error) {
    console.error('Error fixing recommendations:', error);
    process.exit(1);
  }
}

fixRecommendations();
