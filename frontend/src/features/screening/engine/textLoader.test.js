import {
  loadInstrumentTextBundle,
  getInstrumentLicensing,
  isInstrumentRunnable,
  applyInstrumentText,
  resetLoadedTexts,
  parseCSVItemBundle,
} from './textLoader.js';

export function runTextLoaderUnitTests() {
  const results = [];
  const assert = (condition, name) => {
    if (condition) {
      results.push({ pass: true, name });
    } else {
      results.push({ pass: false, name });
      console.error(`FAIL: ${name}`);
    }
  };

  // Test 1: Check baseline unrunnable state for permission-pending instruments
  resetLoadedTexts();
  assert(isInstrumentRunnable('raads_r') === false, 'RAADS-R is not runnable when textLoaded=false');
  assert(isInstrumentRunnable('asrs6') === true, 'ASRS-6 is runnable (public screener)');

  // Test 2: Parse CSV bundle
  const sampleCsv = `instrumentId,itemId,number,text
raads_r,r_1,1,"Authorized item 1"
raads_r,r_2,2,"Authorized item 2"`;

  const parsed = parseCSVItemBundle(sampleCsv);
  assert(parsed.raads_r && parsed.raads_r.length === 2, 'CSV parser extracted 2 items for raads_r');
  assert(parsed.raads_r[0].text === 'Authorized item 1', 'Item 1 text matches');

  // Test 3: Load bundle via JSON and verify state transition
  const jsonBundle = JSON.stringify({
    raads_r: [
      { id: 'r_1', number: 1, text: 'Authorized text 1' },
      { id: 'r_2', number: 2, text: 'Authorized text 2' },
    ],
  });

  loadInstrumentTextBundle(jsonBundle);
  assert(isInstrumentRunnable('raads_r') === true, 'RAADS-R becomes runnable after loading authorized bundle');

  const dummyRaadsConfig = {
    id: 'raads_r',
    items: [
      { id: 'r_1', number: 1, text: '[Placeholder 1]' },
      { id: 'r_2', number: 2, text: '[Placeholder 2]' },
      { id: 'r_3', number: 3, text: '[Placeholder 3]' },
    ],
  };

  const hydrated = applyInstrumentText(dummyRaadsConfig);
  assert(hydrated.items[0].text === 'Authorized text 1', 'Hydrated Item 1 text replaces placeholder');
  assert(hydrated.items[1].text === 'Authorized text 2', 'Hydrated Item 2 text replaces placeholder');
  assert(hydrated.items[2].text === '[Placeholder 3]', 'Unmodified items retain placeholder');

  // Clean up
  resetLoadedTexts();
  assert(isInstrumentRunnable('raads_r') === false, 'Reset cleans up dynamic overlays');

  console.log(`✅ TextLoader Tests: ${results.filter(r => r.pass).length}/${results.length} passed.`);
  return results;
}

// Auto-run if run directly with Node
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('textLoader.test.js')) {
  runTextLoaderUnitTests();
}
