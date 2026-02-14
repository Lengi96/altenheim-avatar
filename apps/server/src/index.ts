import { env, requireApiKey } from './config/env.js';
import { logger } from './config/logger.js';
import { createApp } from './app.js';

requireApiKey();

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Anni Server laeuft auf http://localhost:${env.PORT}`);
  logger.info(`Umgebung: ${env.NODE_ENV}`);
});

process.on('SIGTERM', () => {
  logger.info('Server wird heruntergefahren...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  logger.info('Server wird heruntergefahren...');
  server.close(() => process.exit(0));
});
