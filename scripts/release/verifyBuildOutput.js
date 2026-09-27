const { inspectProductionSupabaseBundle } = require('./supabaseProductionGuard.cjs');
const { readBuiltJavaScript, verifyBuildStructure } = require('./verifyBuildStructure');

function verifyBuildOutput() {
  const structure = verifyBuildStructure();
  const supabase = inspectProductionSupabaseBundle(readBuiltJavaScript());

  console.log(`Production Supabase configuration PASS: ${supabase.hostname}.`);
  return { ...structure, supabaseHost: supabase.hostname };
}

if (require.main === module) {
  try {
    verifyBuildOutput();
  } catch (error) {
    console.error(`Build output FAIL: ${error.message || error}`);
    process.exit(1);
  }
}

module.exports = { verifyBuildOutput };
