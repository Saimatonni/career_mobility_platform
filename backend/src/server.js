const config = require('./config/env');
const { initStore } = require('./store');
const { createApp } = require('./app');

async function main() {
  const store = await initStore(console);
  const app = createApp(store);
  const server = app.listen(config.port, () => {
    console.log(`[server] API listening on http://localhost:${config.port}/api  (storage: ${store.mode})`);
  });

  const shutdown = async () => {
    console.log('\n[server] Shutting down...');
    server.close(async () => {
      await store.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[server] Failed to start:', err.message);
  process.exit(1);
});
