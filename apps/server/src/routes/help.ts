import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { conversations } from '../db/schema.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth, requireRole('resident'));

const urgentHelpSchema = z.object({
  conversationId: z.string().uuid().optional(),
});

router.post('/urgent', validate(urgentHelpSchema), async (req: Request, res: Response) => {
  const auth = req.auth!;
  const { conversationId } = req.body;

  try {
    if (conversationId) {
      const [updated] = await db
        .update(conversations)
        .set({
          flagged: true,
          flagReason: 'URGENT_HELP_BUTTON',
        })
        .where(
          and(
            eq(conversations.id, conversationId),
            eq(conversations.residentId, auth.residentId!),
          ),
        )
        .returning({ id: conversations.id });

      if (updated) {
        res.status(201).json({
          ok: true,
          message: 'Hilfe wurde angefordert. Eine Pflegekraft wird informiert.',
          conversationId: updated.id,
        });
        return;
      }
    }

    const [created] = await db
      .insert(conversations)
      .values({
        residentId: auth.residentId!,
        mode: 'bewohner',
        flagged: true,
        flagReason: 'URGENT_HELP_BUTTON',
        summary: 'Notfallhilfe ueber Bewohner-Button angefordert.',
      })
      .returning({ id: conversations.id });

    res.status(201).json({
      ok: true,
      message: 'Hilfe wurde angefordert. Eine Pflegekraft wird informiert.',
      conversationId: created.id,
    });
  } catch (err) {
    console.error('Help POST /urgent Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

export default router;
