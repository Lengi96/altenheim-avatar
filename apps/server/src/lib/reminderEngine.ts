import cron from 'node-cron';
import { prisma } from './prisma';
import { eventBus } from './eventBus';

export function startReminderEngine(): void {
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentCron = `${now.getMinutes()} ${now.getHours()} * * *`;

    try {
      const due = await prisma.schedule.findMany({
        where: { active: true, cronExpression: currentCron },
      });

      for (const schedule of due) {
        eventBus.send(schedule.residentId, {
          type: 'reminder',
          scheduleId: schedule.id,
          title: schedule.title,
          scheduleType: schedule.type,
        });

        await prisma.notification.create({
          data: {
            residentId: schedule.residentId,
            scheduleId: schedule.id,
            title: schedule.title,
            type: schedule.type,
            acknowledged: false,
          },
        });

        await prisma.schedule.update({
          where: { id: schedule.id },
          data: { lastTriggeredAt: now },
        });
      }
    } catch (err) {
      console.error('Reminder engine error:', err);
    }
  });

  console.log('Reminder engine started');
}
