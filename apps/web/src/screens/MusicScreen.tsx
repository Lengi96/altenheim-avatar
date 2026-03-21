import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useResident } from '../context/ResidentContext';

const PLAYLISTS: Record<string, { label: string; url: string }[]> = {
  Schlager: [
    { label: 'Schlager Hits', url: 'https://www.youtube.com/embed/videoseries?list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSK' },
  ],
  Klassik: [
    { label: 'Klassische Musik', url: 'https://www.youtube.com/embed/videoseries?list=PLhQjrBAgIEJub-ZB1VR4fRWWCuXbLQ7EN' },
  ],
  Jazz: [
    { label: 'Entspannender Jazz', url: 'https://www.youtube.com/embed/videoseries?list=PLkqz3S84Tw-QHIfcPHKqS-F5Pj5_4WrDT' },
  ],
};

const DEFAULT_PLAYLIST = { label: 'Entspannende Musik', url: 'https://www.youtube.com/embed/videoseries?list=PLhQjrBAgIEJub-ZB1VR4fRWWCuXbLQ7EN' };

export default function MusicScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resident } = useResident();

  const genre = (resident?.preferences as Record<string, unknown>)?.music as string ?? 'Schlager';
  const playlists = PLAYLISTS[genre] ?? [DEFAULT_PLAYLIST];
  const playlist = playlists[0];

  return (
    <div className="flex h-screen flex-col bg-gray-950">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-kiosk-xl text-white">🎵 {t('music.title')}</h1>
        <button
          className="min-h-touch rounded-xl bg-gray-700 px-6 py-3 text-kiosk-base text-white"
          onClick={() => navigate('/')}
        >
          {t('music.backToHome')}
        </button>
      </div>
      <p className="px-4 text-kiosk-sm text-gray-400">{genre} — {playlist.label}</p>
      <div className="flex-1 p-4">
        <iframe
          src={playlist.url}
          className="h-full w-full rounded-2xl border-0"
          allow="autoplay; encrypted-media"
          title="Music Player"
        />
      </div>
    </div>
  );
}
