import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useResident } from '../context/ResidentContext';
import { useVoice } from '../hooks/useVoice';
import { useConversationStream } from '../hooks/useConversationStream';
import AvatarAnimation from '../components/AvatarAnimation';

type ConvState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const INACTIVITY_MS = 2 * 60 * 1000;

export default function ConversationScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resident } = useResident();
  const [state, setState] = useState<ConvState>('idle');
  const [transcript, setTranscript] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [avatarText, setAvatarText] = useState('');
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { startListening, stopListening, speak } = useVoice(resident?.language ?? 'de');
  const { sendMessage } = useConversationStream();

  const resetInactivity = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => navigate('/'), INACTIVITY_MS);
  };

  useEffect(() => {
    resetInactivity();
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  const handleListen = async () => {
    if (!resident || state !== 'idle') return;
    resetInactivity();

    try {
      setState('listening');
      const userText = await startListening();
      setTranscript(userText);
      setState('thinking');
      setAvatarText('');

      const newHistory: Message[] = [...history, { role: 'user', content: userText }];
      await sendMessage(
        resident.id,
        userText,
        history,
        (_chunk) => {
          setAvatarText(prev => prev + _chunk);
        },
        async (full) => {
          setState('speaking');
          setHistory([...newHistory, { role: 'assistant', content: full }]);
          await speak(full, resident.language);
          setState('idle');
          setAvatarText('');
        },
        (err) => {
          console.error(err);
          setState('idle');
          setAvatarText(t('conversation.error'));
        }
      );
    } catch (err) {
      console.error(err);
      setState('idle');
    }
  };

  if (!resident) return null;

  const avatarState = state === 'listening' ? 'listening' : state === 'idle' ? 'idle' : 'speaking';

  return (
    <div
      className="flex h-screen flex-col items-center justify-between bg-gray-950 p-8"
      onPointerDown={resetInactivity}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 w-full max-w-2xl">
        <AvatarAnimation state={avatarState} name={resident.avatarName} />

        {avatarText && (
          <div className="rounded-2xl bg-gray-800 p-6 text-kiosk-base text-white max-h-48 overflow-y-auto w-full">
            {avatarText}
          </div>
        )}

        {state === 'listening' && (
          <p className="text-kiosk-base text-green-400">{t('conversation.listening')}</p>
        )}
        {state === 'thinking' && (
          <p className="text-kiosk-base text-blue-400 animate-pulse">{t('conversation.thinking')}</p>
        )}
        {transcript && state !== 'listening' && (
          <p className="text-kiosk-sm text-gray-400 italic">"{transcript}"</p>
        )}
      </div>

      <div className="flex w-full max-w-2xl gap-4">
        <button
          disabled={state !== 'idle'}
          className="flex-1 min-h-touch rounded-2xl bg-blue-600 p-6 text-kiosk-xl font-bold text-white shadow-lg active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleListen}
        >
          {state === 'listening' ? '🔴' : '🎤'} {state === 'idle' ? t('idle.tapToTalk') : '...'}
        </button>
        <button
          className="min-h-touch rounded-2xl bg-gray-700 px-6 text-kiosk-base text-white shadow-lg active:bg-gray-600"
          onClick={() => { stopListening(); navigate('/'); }}
        >
          {t('conversation.endCall')}
        </button>
      </div>
    </div>
  );
}
