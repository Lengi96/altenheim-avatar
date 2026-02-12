import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { biographies, residents } from '../db/schema.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth, requireRole('admin', 'caregiver'));

async function verifyResidentBelongsToFacility(
  residentId: string,
  facilityId: string,
): Promise<boolean> {
  const [resident] = await db
    .select({ id: residents.id })
    .from(residents)
    .where(and(eq(residents.id, residentId), eq(residents.facilityId, facilityId)))
    .limit(1);
  return !!resident;
}

async function getBiographyWithFacility(biographyId: string) {
  const [entry] = await db
    .select({
      id: biographies.id,
      residentId: biographies.residentId,
      facilityId: residents.facilityId,
    })
    .from(biographies)
    .innerJoin(residents, eq(biographies.residentId, residents.id))
    .where(eq(biographies.id, biographyId))
    .limit(1);

  return entry;
}

router.get('/resident/:residentId', async (req: Request, res: Response) => {
  const facilityId = req.auth!.facilityId;
  const residentId = req.params.residentId as string;

  if (!(await verifyResidentBelongsToFacility(residentId, facilityId))) {
    res.status(404).json({ error: 'Bewohner nicht gefunden.' });
    return;
  }

  const entries = await db
    .select()
    .from(biographies)
    .where(eq(biographies.residentId, residentId))
    .orderBy(biographies.category, biographies.key);

  res.json(entries);
});

const createSchema = z.object({
  category: z.enum(['family', 'career', 'hobbies', 'hometown', 'memories', 'preferences']),
  key: z.string().min(1).max(100),
  value: z.string().min(1),
  source: z.enum(['manual', 'conversation']).default('manual'),
});

router.post('/resident/:residentId', validate(createSchema), async (req: Request, res: Response) => {
  const facilityId = req.auth!.facilityId;
  const residentId = req.params.residentId as string;

  if (!(await verifyResidentBelongsToFacility(residentId, facilityId))) {
    res.status(404).json({ error: 'Bewohner nicht gefunden.' });
    return;
  }

  const [entry] = await db
    .insert(biographies)
    .values({
      residentId,
      ...req.body,
    })
    .onConflictDoUpdate({
      target: [biographies.residentId, biographies.category, biographies.key],
      set: { value: req.body.value, source: req.body.source },
    })
    .returning();

  res.status(201).json(entry);
});

const updateSchema = z.object({
  value: z.string().min(1).optional(),
  category: z.enum(['family', 'career', 'hobbies', 'hometown', 'memories', 'preferences']).optional(),
  key: z.string().min(1).max(100).optional(),
});

router.put('/:id', validate(updateSchema), async (req: Request, res: Response) => {
  const facilityId = req.auth!.facilityId;
  const biographyId = req.params.id as string;

  const existing = await getBiographyWithFacility(biographyId);
  if (!existing) {
    res.status(404).json({ error: 'Eintrag nicht gefunden.' });
    return;
  }
  if (existing.facilityId !== facilityId) {
    res.status(403).json({ error: 'Kein Zugriff auf diesen Eintrag.' });
    return;
  }

  const [updated] = await db
    .update(biographies)
    .set(req.body)
    .where(eq(biographies.id, biographyId))
    .returning();

  res.json(updated);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const facilityId = req.auth!.facilityId;
  const biographyId = req.params.id as string;

  const existing = await getBiographyWithFacility(biographyId);
  if (!existing) {
    res.status(404).json({ error: 'Eintrag nicht gefunden.' });
    return;
  }
  if (existing.facilityId !== facilityId) {
    res.status(403).json({ error: 'Kein Zugriff auf diesen Eintrag.' });
    return;
  }

  await db.delete(biographies).where(eq(biographies.id, biographyId));
  res.json({ message: 'Eintrag gelÃ¶scht.' });
});

export default router;
