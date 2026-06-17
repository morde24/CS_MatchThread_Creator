import { fileURLToPath } from 'url';
import {
  DiscordRequest,
  InstallGlobalCommands,
  getRandomEmoji,
  capitalize,
  create_Thread,
  getNextTeamMatch,
  getHLTVLinkFromTournamentPage,
  getTeamPageFromName,
  extractTeamNameFromLiquipediaUrl,
} from '../utils.js';

class TestHarness {
  constructor() {
    this.tests = [];
  }

  logTest(name, result, error = null) {
    const status = error ? '❌ FAILED' : '✅ PASSED';
    console.log(`\n${status}: ${name}`);
    if (error) {
      console.log(`  Error: ${error.message}`);
    } else if (result !== undefined) {
      console.log(`  Result: ${JSON.stringify(result, null, 2)}`);
    }
  }

  addTest(name, fn) {
    if (typeof fn !== 'function') {
      throw new Error('Test callback must be a function');
    }
    this.tests.push({ name, fn });
  }

  async runTests(selectedNames = []) {
    const selected = Array.isArray(selectedNames) && selectedNames.length
      ? this.tests.filter((test) => selectedNames.includes(test.name))
      : this.tests;

    if (selected.length === 0) {
      console.log('No tests selected or found. Nothing to run.');
      return;
    }

    console.log('========================================');
    console.log(`     RUNNING ${selected.length} TEST${selected.length === 1 ? '' : 'S'}`);
    if (Array.isArray(selectedNames) && selectedNames.length) {
      console.log(`     Selected: ${selectedNames.join(', ')}`);
    }
    console.log('========================================');

    for (const test of selected) {
      try {
        const result = await test.fn();
        this.logTest(test.name, result);
      } catch (err) {
        this.logTest(test.name, null, err);
      }
    }

    console.log('\n========================================');
    console.log('     TEST SUITE COMPLETE');
    console.log('========================================');
  }
}

const harness = new TestHarness();

// function testGetEmoji() {
//   const emoji = getRandomEmoji();
//   if (!emoji || typeof emoji !== 'string') {
//     throw new Error('getRandomEmoji() did not return a string');
//   }
//   return emoji;
// }

// harness.addTest('getRandomEmoji sample test', testGetEmoji);


export { TestHarness, harness };
