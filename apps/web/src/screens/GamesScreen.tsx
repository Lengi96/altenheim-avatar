import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MemoryGame from '../games/MemoryGame';
import TriviaGame from '../games/TriviaGame';

type GameView = 'menu' | 'memory' | 'trivia';

export default function GamesScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [view, setView] = useState<GameView>('menu');

  if (view === 'memory') {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-kiosk-xl text-white">🃏 {t('games.memory')}</h1>
          <button className="min-h-touch rounded-xl bg-gray-700 px-6 py-3 text-kiosk-base text-white" onClick={() => setView('menu')}>
            {t('games.backToHome')}
          </button>
        </div>
        <MemoryGame />
      </div>
    );
  }

  if (view === 'trivia') {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-kiosk-xl text-white">🧠 {t('games.trivia')}</h1>
          <button className="min-h-touch rounded-xl bg-gray-700 px-6 py-3 text-kiosk-base text-white" onClick={() => setView('menu')}>
            {t('games.backToHome')}
          </button>
        </div>
        <TriviaGame />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-gray-950 p-8">
      <h1 className="text-kiosk-2xl text-white">🎮 {t('idle.games')}</h1>
      <div className="flex w-full max-w-lg flex-col gap-4">
        <button className="min-h-touch rounded-2xl bg-blue-600 p-6 text-kiosk-xl font-bold text-white" onClick={() => setView('memory')}>
          🃏 {t('games.memory')}
        </button>
        <button className="min-h-touch rounded-2xl bg-green-600 p-6 text-kiosk-xl font-bold text-white" onClick={() => setView('trivia')}>
          🧠 {t('games.trivia')}
        </button>
        <button className="min-h-touch rounded-xl bg-gray-700 p-4 text-kiosk-base text-white" onClick={() => navigate('/')}>
          {t('games.backToHome')}
        </button>
      </div>
    </div>
  );
}
