require('dotenv').config();

const toBool = (v, d) => (v === undefined || v === '' ? d : String(v).toLowerCase() !== 'false');

module.exports = {
  port: Number(process.env.PORT) || 5050,
  mongoUri: (process.env.MONGODB_URI || '').trim(),
  dbName: process.env.DB_NAME || 'career_mobility',
  allowMemoryFallback: toBool(process.env.ALLOW_MEMORY_FALLBACK, true),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
