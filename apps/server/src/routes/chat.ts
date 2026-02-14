import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { conversations, messages, residents, biographies } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { streamChat } from '../services/claude.js';

const router = Router();

const MAX_HISTORY_MESSAGES = 20;

router.use(requireAuth);

const chatSchema = z.object({
  message: z.string().min(1, 'Nachricht darf nicht leer sein.').max(2000),
  mode: z.enum(['bewohner', 'pfleger']),
  conversationId: z.string().uuid().optional(),
  residentId: z.string().uuid().optional(),
});

router.post('/', validate(chatSchema), async (req: Request, res: Response) => {
  const { message, mode, conversationId, residentId } = req.body;
  const auth = req.auth!;

  if (mode === 'bewohner' && !auth.residentId) {
    res.status(403).json({ error: 'Bewohner-Modus erfordert Bewohner-Login.' });
    return;
  }

  if (mode === 'pfleger' && auth.role === 'resident') {
    res.status(403).json({ error: 'Pfleger-Modus ist nur fuer Mitarbeiter.' });
    return;
  }

  let targetResidentId = mode === 'bewohner' ? auth.residentId : residentId;
  if (mode === 'pfleger' && !targetResidentId && !conversationId) {
    res.status(400).json({ error: 'residentId ist beim Start eines Pfleger-Chats erforderlich.' });
    return;
  }

  try {
    if (auth.role !== 'resident' && targetResidentId) {
      const [resident] = await db
        .select({ id: residents.id })
        .from(residents)
        .where(
          and(
            eq(residents.id, targetResidentId),
            eq(residents.facilityId, auth.facilityId),
          ),
        )
        .limit(1);

      if (!resident) {
        res.status(403).json({ error: 'Kein Zugriff auf diesen Bewohner.' });
        return;
      }
    }

    let convId = conversationId;
    if (convId) {
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, convId))
        .limit(1);

      if (!conv) {
        res.status(404).json({ error: 'Gespraech nicht gefunden.' });
        return;
      }

      if (auth.role === 'resident' && conv.residentId !== auth.residentId) {
        res.status(403).json({ error: 'Kein Zugriff auf dieses Gespraech.' });
        return;
      }

      if (auth.role !== 'resident') {
        const [convResident] = await db
          .select({ facilityId: residents.facilityId })
          .from(residents)
          .where(eq(residents.id, conv.residentId))
          .limit(1);

        if (!convResident || convResident.facilityId !== auth.facilityId) {
          res.status(403).json({ error: 'Kein Zugriff auf dieses Gespraech.' });
          return;
        }
      }

      if (!targetResidentId) {
        targetResidentId = conv.residentId;
      }

      if (conv.residentId !== targetResidentId) {
        res.status(400).json({ error: 'conversationId passt nicht zum angegebenen Bewohner.' });
        return;
      }

      if (conv.mode !== mode) {
        res.status(400).json({ error: 'conversationId passt nicht zum gewaehlten Modus.' });
        return;
      }
    } else {
      const [conv] = await db
        .insert(conversations)
        .values({
          residentId: targetResidentId!,
          mode,
        })
        .returning();
      convId = conv.id;
    }

    if (!convId || !targetResidentId) {
      res.status(500).json({ error: 'Gespraech konnte nicht initialisiert werden.' });
      return;
    }

    const history = await db
      .select({ role: messages.role, content: messages.content })
      .from(messages)
      .where(eq(messages.conversationId, convId))
      .orderBy(messages.createdAt)
      .limit(MAX_HISTORY_MESSAGES);

    await db.insert(messages).values({
      conversationId: convId,
      role: 'user',
      content: message,
    });

    let residentData = undefined;
    if (mode === 'bewohner') {
      // Combined query: resident + biographies in one go
      const [r] = await db
        .select()
        .from(residents)
        .where(eq(residents.id, targetResidentId))
        .limit(1);

      if (r) {
        const bios = await db
          .select({
            category: biographies.category,
            key: biographies.key,
            value: biographies.value,
          })
          .from(biographies)
          .where(eq(biographies.residentId, targetResidentId));

        residentData = {
          firstName: r.firstName,
          displayName: r.displayName || undefined,
          addressForm: r.addressForm,
          avatarName: r.avatarName,
          cognitiveLevel: r.cognitiveLevel,
          biographies: bios,
        };
      }
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    await streamChat(
      {
        message,
        mode,
        history: history as { role: 'user' | 'assistant'; content: string }[],
        resident: residentData,
      },
      {
        onText(text) {
          if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
          }
        },
        async onDone(fullReply, tokensUsed) {
          try {
            await db.insert(messages).values({
              conversationId: convId,
              role: 'assistant',
              content: fullReply,
              tokensUsed,
            });

            // +2 accounts for the new user message and assistant reply
            await db
              .update(conversations)
              .set({
                messageCount: history.length + 2,
              })
              .where(eq(conversations.id, convId));
          } catch (err) {
            console.error('Fehler beim Speichern der Antwort:', err);
          }

          if (!res.writableEnded) {
            res.write(
              `data: ${JSON.stringify({ type: 'done', reply: fullReply, conversationId: convId })}\n\n`,
            );
            res.end();
          }
        },
        onError(error) {
          if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ type: 'error', error })}\n\n`);
            res.end();
          }
        },
      },
    );
  } catch (err) {
    console.error('Chat-Route Fehler:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Interner Serverfehler.' });
    } else if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Interner Serverfehler.' })}\n\n`);
      res.end();
    }
  }
});

export default router;
