import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { residents } from '../db/schema.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Alle Routes brauchen Staff-Auth
router.use(requireAuth, requireRole('admin', 'caregiver'));

// ---- Liste aller Bewohner der Einrichtung ----
router.get('/', async (req: Request, res: Response) => {
  try {
    const facilityId = req.auth!.facilityId;

    const result = await db
      .select({
        id: residents.id,
        firstName: residents.firstName,
        displayName: residents.displayName,
        birthYear: residents.birthYear,
        gender: residents.gender,
        addressForm: residents.addressForm,
        cognitiveLevel: residents.cognitiveLevel,
        avatarName: residents.avatarName,
        active: residents.active,
        createdAt: residents.createdAt,
      })
      .from(residents)
      .where(and(eq(residents.facilityId, facilityId), eq(residents.active, true)))
      .orderBy(residents.firstName);

    res.json(result);
  } catch (err) {
    console.error('Residents GET Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ---- Einzelner Bewohner ----
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const facilityId = req.auth!.facilityId;

    const [resident] = await db
      .select()
      .from(residents)
      .where(
        and(
          eq(residents.id, req.params.id as string),
          eq(residents.facilityId, facilityId)
        )
      )
      .limit(1);

    if (!resident) {
      res.status(404).json({ error: 'Bewohner nicht gefunden.' });
      return;
    }

    // PIN nicht zurueckgeben
    const { pin, ...residentData } = resident;
    res.json(residentData);
  } catch (err) {
    console.error('Residents GET/:id Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ---- Bewohner anlegen ----
const createSchema = z.object({
  firstName: z.string().min(1).max(100),
  displayName: z.string().max(100).optional(),
  pin: z.string().regex(/^\d{4,6}$/, 'PIN muss 4-6 Ziffern haben.'),
  birthYear: z.number().int().min(1900).max(2030).optional(),
  gender: z.string().max(20).optional(),
  addressForm: z.enum(['du', 'sie']).default('du'),
  language: z.string().max(10).default('de'),
  cognitiveLevel: z.enum(['normal', 'mild_dementia', 'moderate_dementia']).default('normal'),
  avatarName: z.string().max(50).default('Anni'),
});

router.post('/', validate(createSchema), async (req: Request, res: Response) => {
  try {
    const facilityId = req.auth!.facilityId;
    const data = req.body;

    const pinHash = await bcrypt.hash(data.pin, 10);

    const [resident] = await db
      .insert(residents)
      .values({
        facilityId,
        firstName: data.firstName,
        displayName: data.displayName,
        pin: pinHash,
        birthYear: data.birthYear,
        gender: data.gender,
        addressForm: data.addressForm,
        language: data.language,
        cognitiveLevel: data.cognitiveLevel,
        avatarName: data.avatarName,
      })
      .returning();

    const { pin, ...residentData } = resident;
    res.status(201).json(residentData);
  } catch (err) {
    console.error('Residents POST Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ---- Bewohner bearbeiten ----
const updateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  displayName: z.string().max(100).optional(),
  pin: z.string().regex(/^\d{4,6}$/).optional(),
  birthYear: z.number().int().min(1900).max(2030).optional(),
  gender: z.string().max(20).optional(),
  addressForm: z.enum(['du', 'sie']).optional(),
  language: z.string().max(10).optional(),
  cognitiveLevel: z.enum(['normal', 'mild_dementia', 'moderate_dementia']).optional(),
  avatarName: z.string().max(50).optional(),
});

router.put('/:id', validate(updateSchema), async (req: Request, res: Response) => {
  try {
    const facilityId = req.auth!.facilityId;
    const data = req.body;

    // PIN separat hashen falls vorhanden
    const updateData: Record<string, unknown> = { ...data };
    if (data.pin) {
      updateData.pin = await bcrypt.hash(data.pin, 10);
    }

    const [updated] = await db
      .update(residents)
      .set(updateData)
      .where(
        and(
          eq(residents.id, req.params.id as string),
          eq(residents.facilityId, facilityId)
        )
      )
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Bewohner nicht gefunden.' });
      return;
    }

    const { pin, ...residentData } = updated;
    res.json(residentData);
  } catch (err) {
    console.error('Residents PUT Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ---- Bewohner deaktivieren (Soft Delete) ----
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const facilityId = req.auth!.facilityId;

    const [updated] = await db
      .update(residents)
      .set({ active: false })
      .where(
        and(
          eq(residents.id, req.params.id as string),
          eq(residents.facilityId, facilityId)
        )
      )
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Bewohner nicht gefunden.' });
      return;
    }

    res.json({ message: 'Bewohner deaktiviert.' });
  } catch (err) {
    console.error('Residents DELETE Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

export default router;
