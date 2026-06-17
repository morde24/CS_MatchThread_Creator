import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const testDir = join(process.cwd(), 'test_suite');
const files = readdirSync(testDir)
  .filter((name) => name.endsWith('.js'))
  .filter((name) => name !== 'testing_harness.js');

if (!files.length) {
  console.log('No test files found in test_suite.');
  process.exit(0);
}

for (const file of files) {
  if (file === 'testing_harness.js' || file === 'run_test_suite.js') continue; // Skip the testing harness and run_test_suite files
  const filePath = join(testDir, file);
  console.log(`\n========================================`);
  console.log(` Running ${file}`);
  console.log(`========================================`);

  const result = spawnSync(process.execPath, [filePath], {
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(`Failed to run ${file}:`, result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`Test file failed: ${file}`);
    process.exit(result.status ?? 1);
  }
}

console.log('\nAll test_suite files completed successfully.');
