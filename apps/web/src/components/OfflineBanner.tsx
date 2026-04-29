import { useTranslation } from 'react-i18next';
import { useOnline } from '../hooks/useOnline';

export default function OfflineBanner() {
  const { t } = useTranslation();
  const online = useOnline();

  if (online) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-3 bg-red-700 px-6 py-4 text-kiosk-base font-semibold text-white shadow-lg"
    >
      <span className="text-2xl">⚠️</span>
      <span>{t('offline')}</span>
    </div>
  );
}
