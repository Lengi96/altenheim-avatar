import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useResident } from '../context/ResidentContext';

export default function VideoScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resident } = useResident();
  const [roomUrl, setRoomUrl] = useState('');
  const [joined, setJoined] = useState(false);

  const defaultRoom = (resident?.preferences as Record<string, unknown>)?.videoRoom as string ?? '';

  const handleJoin = () => {
    const url = roomUrl || defaultRoom;
    if (url) setJoined(true);
  };

  if (joined) {
    const url = roomUrl || defaultRoom;
    return (
      <div className="flex h-screen flex-col bg-black">
        <div className="flex items-center justify-between bg-gray-900 p-4">
          <h1 className="text-kiosk-lg text-white">{t('video.title')}</h1>
          <button
            className="min-h-touch rounded-xl bg-red-600 px-6 text-kiosk-base text-white"
            onClick={() => { setJoined(false); navigate('/'); }}
          >
            {t('video.backToHome')}
          </button>
        </div>
        <iframe
          src={url}
          className="flex-1 w-full border-0"
          allow="camera; microphone; fullscreen; speaker; display-capture"
          title="Video Call"
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8 bg-gray-950 p-8">
      <h1 className="text-kiosk-2xl text-white">📹 {t('video.title')}</h1>

      {defaultRoom ? (
        <button
          className="min-h-touch rounded-2xl bg-green-600 px-12 py-6 text-kiosk-xl font-bold text-white"
          onClick={() => setJoined(true)}
        >
          {t('idle.videoCall')} starten
        </button>
      ) : (
        <div className="flex w-full max-w-lg flex-col gap-4">
          <input
            type="url"
            placeholder={t('video.roomPlaceholder')}
            className="w-full rounded-xl border-2 border-gray-600 bg-gray-800 p-4 text-kiosk-base text-white"
            value={roomUrl}
            onChange={e => setRoomUrl(e.target.value)}
          />
          <button
            disabled={!roomUrl}
            className="min-h-touch rounded-2xl bg-green-600 p-4 text-kiosk-lg font-bold text-white disabled:opacity-50"
            onClick={handleJoin}
          >
            Beitreten
          </button>
        </div>
      )}

      <button
        className="min-h-touch rounded-xl bg-gray-700 px-8 py-4 text-kiosk-base text-white"
        onClick={() => navigate('/')}
      >
        {t('video.backToHome')}
      </button>
    </div>
  );
}
