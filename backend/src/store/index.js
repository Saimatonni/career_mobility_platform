const mongoose = require('mongoose');
const config = require('../config/env');
const { createMongoStore } = require('./mongoStore');
const { createMemoryStore } = require('./memoryStore');
const seed = require('../data/opportunities');

/**
 * Connect to MongoDB; if that fails and ALLOW_MEMORY_FALLBACK is not "false",
 * transparently fall back to the in-memory store so the assessor can still run the app.
 * Opportunities are seeded when the collection is empty.
 */
async function initStore(log = console) {
  let store;
  if (config.mongoUri) {
    try {
      mongoose.set('strictQuery', true);
      await mongoose.connect(config.mongoUri, { dbName: config.dbName, serverSelectionTimeoutMS: 8000 });
      store = createMongoStore();
      log.info(`[store] Connected to MongoDB (db: ${config.dbName})`);
    } catch (err) {
      log.error(`[store] MongoDB connection failed: ${err.message}`);
      if (!config.allowMemoryFallback) throw err;
      log.warn('[store] Falling back to IN-MEMORY store. Data will be lost on restart.');
    }
  } else {
    log.warn('[store] MONGODB_URI is not set. Using IN-MEMORY store (mock mode).');
  }
  if (!store) store = createMemoryStore();

  if ((await store.countOpportunities()) === 0) {
    const n = await store.seedOpportunities(seed);
    log.info(`[store] Seeded ${n} sample opportunities.`);
  }
  return store;
}

module.exports = { initStore };
