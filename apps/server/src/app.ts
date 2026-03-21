import './lib/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRouter from './routes/auth';
import residentsRouter from './routes/residents';
import schedulesRouter from './routes/schedules';
import conversationRouter from './routes/conversation';

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", process.env.CORS_ORIGIN ?? 'http://localhost:5173'],
    },
  },
}));
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/residents', residentsRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/conversation', conversationRouter);

export default app;
