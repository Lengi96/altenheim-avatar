import { env, requireApiKey } from './config/env.js';
import { createApp } from './app.js';

requireApiKey();

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`Anni Server laeuft auf http://localhost:${env.PORT}`);
  console.log(`Umgebung: ${env.NODE_ENV}`);
});

process.on('SIGTERM', () => {
  console.log('Server wird heruntergefahren...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Server wird heruntergefahren...');
  server.close(() => process.exit(0));
});
