import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

const createScheduleSchema = z.object({
  residentId: z.string().min(1),
  type: z.enum(['medication', 'appointment', 'activity']),
  title: z.string().min(1),
  cronExpression: z.string().min(1),
  active: z.boolean().default(true),
});

router.get('/', requireAuth, async (req, res) => {
  const { residentId } = req.query;
  const where = residentId ? { residentId: String(residentId) } : {};
  const schedules = await prisma.schedule.findMany({ where, orderBy: { title: 'asc' } });
  res.json(schedules);
});

router.post('/', requireAuth, async (req, res) => {
  const parsed = createScheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    return;
  }
  const schedule = await prisma.schedule.create({ data: parsed.data });
  res.status(201).json(schedule);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const parsed = createScheduleSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }
  const schedule = await prisma.schedule.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(schedule);
});

router.delete('/:id', requireAuth, async (req, res) => {
  await prisma.schedule.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
