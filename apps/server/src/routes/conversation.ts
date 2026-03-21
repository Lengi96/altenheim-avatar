import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ClaudeProvider } from '../providers/ClaudeProvider';
import type { Message } from '../providers/ConversationProvider';

const router = Router();
const provider = new ClaudeProvider();

const messageSchema = z.object({
  residentId: z.string().min(1),
  message: z.string().min(1),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .default([]),
});

router.post('/stream', async (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  const { residentId, message, history } = parsed.data;

  let resident;
  try {
    resident = await prisma.resident.findUnique({ where: { id: residentId } });
  } catch (err) {
    console.error('DB error fetching resident:', err);
    res.status(500).json({ error: 'Database error' });
    return;
  }

  if (!resident) {
    res.status(404).json({ error: 'Resident not found' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let clientDisconnected = false;
  req.on('close', () => {
    clientDisconnected = true;
  });

  const messages: Message[] = [
    ...history,
    { role: 'user', content: message },
  ];

  try {
    let fullResponse = '';

    for await (const chunk of provider.stream(messages, {
      name: resident.name,
      language: resident.language,
      avatarName: resident.avatarName,
      preferences: resident.preferences as Record<string, unknown>,
      todaySchedule: [],
    })) {
      if (clientDisconnected) break;
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ type: 'delta', text: chunk })}\n\n`);
    }

    if (!clientDisconnected) {
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    }

    if (fullResponse) {
      prisma.conversation
        .create({
          data: {
            residentId,
            messages: [
              ...messages,
              { role: 'assistant', content: fullResponse, timestamp: new Date().toISOString() },
            ],
          },
        })
        .catch(console.error);
    }
  } catch (err) {
    console.error('Conversation stream error:', err);
    if (!clientDisconnected && !res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Entschuldigung, ich habe einen Fehler. Bitte versuchen Sie es erneut.' })}\n\n`);
      res.end();
    }
  }
});

export default router;
