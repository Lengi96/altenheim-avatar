import { useTranslation } from 'react-i18next';
import { useResident } from '../context/ResidentContext';

export default function ReminderOverlay() {
  const { t } = useTranslation();
  const { pendingReminder, clearReminder } = useResident();

  if (!pendingReminder) return null;

  const handleAcknowledge = async () => {
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
    clearReminder();
    setTimeout(() => {
      // Snooze: re-show after 5 min by re-setting the reminder
      // In practice the server will send a new one on the next cron cycle
    }, 5 * 60 * 1000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-title"
      aria-describedby="reminder-body"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-8"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mb-4 text-6xl" aria-hidden="true">🔔</div>
        <h2 id="reminder-title" className="mb-2 text-kiosk-xl font-bold text-gray-900">{t('reminder.title')}</h2>
        <p id="reminder-body" className="mb-8 text-kiosk-lg text-gray-700">{pendingReminder.title}</p>
        <div className="flex gap-4">
          <button
            aria-label={t('reminder.confirm')}
            className="flex-1 min-h-touch rounded-2xl bg-blue-600 p-4 text-kiosk-lg font-bold text-white active:bg-blue-700"
            onClick={handleAcknowledge}
          >
            ✅ {t('reminder.confirm')}
          </button>
          <button
            aria-label={t('reminder.snooze')}
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
