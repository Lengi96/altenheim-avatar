import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useResident } from '../context/ResidentContext';
import AvatarAnimation from '../components/AvatarAnimation';

export default function IdleScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resident } = useResident();
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  };

  useEffect(() => {
    window.addEventListener('pointerdown', resetTimer);
    return () => window.removeEventListener('pointerdown', resetTimer);
  }, []);

  if (!resident) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-between bg-gray-950 p-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <AvatarAnimation state="idle" name={resident.avatarName} />
        <h1 className="text-kiosk-2xl font-bold text-white">
          {t('idle.greeting', { name: resident.name })}
        </h1>
      </div>

      <nav aria-label={t('idle.navigation')} className="grid w-full max-w-2xl grid-cols-2 gap-4">
        <button
          aria-label={t('idle.tapToTalk')}
          className="col-span-2 flex min-h-touch items-center justify-center rounded-2xl bg-blue-600 p-6 text-kiosk-xl font-bold text-white shadow-lg active:bg-blue-700"
          onClick={() => navigate('/conversation')}
        >
          🎤 {t('idle.tapToTalk')}
        </button>
        <button
          aria-label={t('idle.videoCall')}
          className="flex min-h-touch items-center justify-center rounded-2xl bg-green-600 p-4 text-kiosk-lg font-semibold text-white shadow-lg active:bg-green-700"
          onClick={() => navigate('/video')}
        >
          📹 {t('idle.videoCall')}
        </button>
        <button
          aria-label={t('idle.games')}
          className="flex min-h-touch items-center justify-center rounded-2xl bg-orange-700 p-4 text-kiosk-lg font-semibold text-white shadow-lg active:bg-orange-800"
          onClick={() => navigate('/games')}
        >
          🎮 {t('idle.games')}
        </button>
        <button
          aria-label={t('idle.music')}
          className="col-span-2 flex min-h-touch items-center justify-center rounded-2xl bg-purple-600 p-4 text-kiosk-lg font-semibold text-white shadow-lg active:bg-purple-700"
          onClick={() => navigate('/music')}
        >
          🎵 {t('idle.music')}
        </button>
      </nav>
    </div>
  );
}
