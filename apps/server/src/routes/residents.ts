import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

const createResidentSchema = z.object({
  name: z.string().min(1),
  roomNumber: z.string().min(1),
  language: z.string().default('de'),
  avatarName: z.string().default('Lena'),
  photoUrl: z.string().url().optional(),
  preferences: z.record(z.unknown()).default({}),
});

const updateResidentSchema = createResidentSchema.partial().extend({
  active: z.boolean().optional(),
});

router.get('/', requireAuth, async (_req, res) => {
  const residents = await prisma.resident.findMany({
    orderBy: { name: 'asc' },
  });
  res.json(residents);
});

router.get('/:id', async (req, res) => {
  const resident = await prisma.resident.findUnique({ where: { id: req.params.id } });
  if (!resident) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(resident);
});

router.post('/', requireAuth, async (req, res) => {
  const parsed = createResidentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    return;
  }
  const resident = await prisma.resident.create({ data: parsed.data });
  res.status(201).json(resident);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const parsed = updateResidentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    return;
  }
  const resident = await prisma.resident.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(resident);
});

router.delete('/:id', requireAuth, async (req, res) => {
  await prisma.resident.update({
    where: { id: req.params.id },
    data: { active: false },
  });
  res.status(204).send();
});

export default router;
