import { Router } from 'express';
import { eventBus } from '../lib/eventBus';

const router = Router();

router.get('/stream', (req, res) => {
  const { residentId } = req.query;
  if (!residentId || typeof residentId !== 'string') {
    res.status(400).json({ error: 'residentId required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const pingInterval = setInterval(() => {
    res.write(': ping\n\n');
  }, 30_000);

  res.on('close', () => clearInterval(pingInterval));

  eventBus.register(residentId, res);
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
});

export default router;
