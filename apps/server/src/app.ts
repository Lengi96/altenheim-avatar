import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ipKeyGenerator } from 'express-rate-limit';
import cors from 'cors';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { isDatabaseConnectionError } from './utils/errors.js';

import authRouter from './routes/auth.js';
import residentsRouter from './routes/residents.js';
import biographiesRouter from './routes/biographies.js';
import chatRouter from './routes/chat.js';
import conversationsRouter from './routes/conversations.js';

export function createApp() {
  const app = express();

  function keyFromJwtOrIp(req: express.Request): string {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload = JSON.parse(
          Buffer.from(authHeader.slice(7).split('.')[1], 'base64').toString(),
        );
        return payload.userId || payload.residentId || ipKeyGenerator(req.ip || 'unknown');
      } catch {
        return ipKeyGenerator(req.ip || 'unknown');
      }
    }
    return ipKeyGenerator(req.ip || 'unknown');
  }

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
    keyGenerator: keyFromJwtOrIp,
  });

  const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    message: { error: 'Zu viele Anfragen. Bitte warte einen Moment.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyFromJwtOrIp,
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
      logger.error('Unbehandelter Fehler:', err);

      if (isDatabaseConnectionError(err)) {
        res.status(503).json({
          error:
            'Datenbank nicht erreichbar. Bitte pruefe, ob PostgreSQL laeuft und die Migrationen ausgefuehrt wurden.',
        });
        return;
      }

      res.status(500).json({ error: 'Interner Serverfehler.' });
    },
  );

  return app;
}
