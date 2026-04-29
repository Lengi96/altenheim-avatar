import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useResident } from '../context/ResidentContext';

const SNOOZE_MS = 5 * 60 * 1000;

export default function ReminderOverlay() {
  const { t } = useTranslation();
  const { pendingReminder, clearReminder, snoozeReminder } = useResident();
  const snoozeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!pendingReminder) return null;

  const handleAcknowledge = async () => {
    if (snoozeTimer.current) clearTimeout(snoozeTimer.current);
    try {
      await fetch(`/api/notifications/${pendingReminder.scheduleId}/acknowledge`, {
        method: 'PATCH',
      });
    } catch {
      // best effort
    }
    clearReminder();
  };

  const handleSnooze = () => {
    const snoozed = { ...pendingReminder };
    clearReminder();
    snoozeTimer.current = setTimeout(() => {
      snoozeReminder(snoozed);
    }, SNOOZE_MS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-8">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mb-4 text-6xl">🔔</div>
        <h2 className="mb-2 text-kiosk-xl font-bold text-gray-900">{t('reminder.title')}</h2>
        <p className="mb-8 text-kiosk-lg text-gray-700">{pendingReminder.title}</p>
        <div className="flex gap-4">
          <button
            className="flex-1 min-h-touch rounded-2xl bg-blue-600 p-4 text-kiosk-lg font-bold text-white active:bg-blue-700"
            onClick={handleAcknowledge}
          >
            ✅ {t('reminder.confirm')}
          </button>
          <button
            className="flex-1 min-h-touch rounded-2xl bg-gray-200 p-4 text-kiosk-lg font-semibold text-gray-800 active:bg-gray-300"
            onClick={handleSnooze}
          >
            ⏰ {t('reminder.snooze')}
          </button>
        </div>
      </div>
    </div>
  );
}
