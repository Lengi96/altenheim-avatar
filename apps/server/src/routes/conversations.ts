import { Router, Request, Response } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { conversations, messages, residents } from '../db/schema.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/resident/:residentId',
  requireRole('admin', 'caregiver'),
  async (req: Request, res: Response) => {
    try {
      const facilityId = req.auth!.facilityId;

      const [resident] = await db
        .select({ id: residents.id })
        .from(residents)
        .where(
          and(
            eq(residents.id, req.params.residentId as string),
            eq(residents.facilityId, facilityId),
          ),
        )
        .limit(1);

      if (!resident) {
        res.status(404).json({ error: 'Bewohner nicht gefunden.' });
        return;
      }

      const result = await db
        .select()
        .from(conversations)
        .where(eq(conversations.residentId, req.params.residentId as string))
        .orderBy(desc(conversations.startedAt))
        .limit(50);

      res.json(result);
    } catch (err) {
      console.error('Conversations GET resident Fehler:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

router.get('/my', requireRole('resident'), async (req: Request, res: Response) => {
  try {
    const residentId = req.auth!.residentId!;

    const result = await db
      .select()
      .from(conversations)
      .where(eq(conversations.residentId, residentId))
      .orderBy(desc(conversations.startedAt))
      .limit(20);

    res.json(result);
  } catch (err) {
    console.error('Conversations GET my Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

router.get('/:id/messages', async (req: Request, res: Response) => {
  try {
    const auth = req.auth!;

    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, req.params.id as string))
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
      const [resident] = await db
        .select({ facilityId: residents.facilityId })
        .from(residents)
        .where(eq(residents.id, conv.residentId))
        .limit(1);

      if (!resident || resident.facilityId !== auth.facilityId) {
        res.status(403).json({ error: 'Kein Zugriff auf dieses Gespraech.' });
        return;
      }
    }

    const result = await db
      .select({
        id: messages.id,
        role: messages.role,
        content: messages.content,
        moodDetected: messages.moodDetected,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, req.params.id as string))
      .orderBy(messages.createdAt);

    res.json(result);
  } catch (err) {
    console.error('Conversations GET messages Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

router.post('/:id/end', async (req: Request, res: Response) => {
  try {
    const auth = req.auth!;

    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, req.params.id as string))
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
      const [resident] = await db
        .select({ facilityId: residents.facilityId })
        .from(residents)
        .where(eq(residents.id, conv.residentId))
        .limit(1);

      if (!resident || resident.facilityId !== auth.facilityId) {
        res.status(403).json({ error: 'Kein Zugriff auf dieses Gespraech.' });
        return;
      }
    }

    const [updated] = await db
      .update(conversations)
      .set({ endedAt: new Date() })
      .where(eq(conversations.id, req.params.id as string))
      .returning();

    res.json({ message: 'Gespraech beendet.', conversation: updated });
  } catch (err) {
    console.error('Conversations POST end Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

export default router;
