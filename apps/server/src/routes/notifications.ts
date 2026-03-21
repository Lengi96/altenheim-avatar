import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { acknowledged: false },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(notifications);
});

router.patch('/:id/acknowledge', async (req, res) => {
  await prisma.notification.update({
    where: { id: req.params.id },
    data: { acknowledged: true },
  });
  res.status(204).send();
});

export default router;
