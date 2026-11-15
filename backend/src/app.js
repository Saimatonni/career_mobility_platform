const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const { buildRouter } = require('./routes');
const { notFound, errorHandler } = require('./middleware/errors');

/** Build the Express app around a store (Mongo or in-memory). Exported separately so tests can reuse it. */
function createApp(store, options = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: options.corsOrigins || config.corsOrigins }));
  app.use(express.json({ limit: '50kb' }));
  app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: options.rateLimit || 300, standardHeaders: true, legacyHeaders: false }));
  app.use('/api', buildRouter(store));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
