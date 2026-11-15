/* Re-seed (upsert) the sample opportunities into MongoDB:  npm run seed */
const config = require('../src/config/env');
const { initStore } = require('../src/store');
const seed = require('../src/data/opportunities');

(async () => {
  if (!config.mongoUri) {
    console.error('MONGODB_URI is not set in .env; nothing to seed (memory mode seeds automatically).');
    process.exit(1);
  }
  const prev = config.allowMemoryFallback;
  config.allowMemoryFallback = false;
  const store = await initStore(console);
  const n = await store.seedOpportunities(seed);
  console.log(`Upserted ${seed.length} opportunities. Collection now holds ${n}.`);
  await store.close();
  config.allowMemoryFallback = prev;
})().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});
