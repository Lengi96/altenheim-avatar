import app from './app';
import { startReminderEngine } from './lib/reminderEngine';

const PORT = process.env.PORT ?? 3001;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startReminderEngine();
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
