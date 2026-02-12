import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { env } from './config/env.js';

import authRouter from './routes/auth.js';
import residentsRouter from './routes/residents.js';
import biographiesRouter from './routes/biographies.js';
import chatRouter from './routes/chat.js';
import conversationsRouter from './routes/conversations.js';

export function createApp() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
        },
      },
    }),
  );

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '10kb' }));

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { error: 'Zu viele Anfragen. Bitte warte einen Moment.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    message: { error: 'Zu viele Anfragen. Bitte warte einen Moment.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api/auth', apiLimiter, authRouter);
  app.use('/api/residents', apiLimiter, residentsRouter);
  app.use('/api/biographies', apiLimiter, biographiesRouter);
  app.use('/api/chat', chatLimiter, chatRouter);
  app.use('/api/conversations', apiLimiter, conversationsRouter);

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error('Unbehandelter Fehler:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    },
  );

  return app;
}
