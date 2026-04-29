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

/** Detect whether the browser supports webkitSpeechRecognition */
function hasSpeechRecognition(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export default function ConversationScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resident } = useResident();
  const [state, setState] = useState<ConvState>('idle');
  const [transcript, setTranscript] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [avatarText, setAvatarText] = useState('');
  const [showTextInput, setShowTextInput] = useState(!hasSpeechRecognition());
  const [textDraft, setTextDraft] = useState('');
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  /** Shared send logic — accepts text from voice OR keyboard input */
  const sendText = async (userText: string) => {
    if (!resident || !userText.trim()) return;
    resetInactivity();
    setTranscript(userText);
    setState('thinking');
    setAvatarText('');
    setTextDraft('');

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
  };

  const handleListen = async () => {
    if (!resident || state !== 'idle') return;
    resetInactivity();

    try {
      setState('listening');
      const userText = await startListening();
      await sendText(userText);
    } catch (err) {
      console.error(err);
      setState('idle');
    }
  };

  const handleTextSubmit = async () => {
    if (state !== 'idle' || !textDraft.trim()) return;
    await sendText(textDraft.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  if (!resident) return null;

  const avatarState = state === 'listening' ? 'listening' : state === 'idle' ? 'idle' : 'speaking';
  const isBusy = state !== 'idle';

  return (
    <div
      className="flex h-screen flex-col items-center justify-between bg-gray-950 p-8"
      onPointerDown={resetInactivity}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 w-full max-w-2xl">
        <AvatarAnimation state={avatarState} name={resident.avatarName} />

        {avatarText && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-2xl bg-gray-800 p-6 text-kiosk-base text-white max-h-48 overflow-y-auto w-full"
          >
            {avatarText}
          </div>
        )}

        {state === 'listening' && (
          <p role="status" className="text-kiosk-base text-green-400">{t('conversation.listening')}</p>
        )}
        {state === 'thinking' && (
          <p role="status" className="text-kiosk-base text-blue-400 animate-pulse">{t('conversation.thinking')}</p>
        )}
        {transcript && state !== 'listening' && (
          <p className="text-kiosk-base text-gray-400 italic">"{transcript}"</p>
        )}
      </div>

      {/* Text-input fallback panel */}
      {showTextInput && (
        <div className="w-full max-w-2xl mb-4 flex gap-3">
          <textarea
            ref={textareaRef}
            rows={2}
            disabled={isBusy}
            value={textDraft}
            onChange={e => setTextDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('conversation.textPlaceholder')}
            aria-label={t('conversation.textPlaceholder')}
            className="flex-1 resize-none rounded-2xl border-2 border-gray-600 bg-gray-800 p-4 text-kiosk-base text-white placeholder-gray-500 disabled:opacity-50"
          />
          <button
            disabled={isBusy || !textDraft.trim()}
            aria-label={t('conversation.send')}
            className="min-h-touch rounded-2xl bg-blue-600 px-6 text-kiosk-base font-bold text-white disabled:opacity-50 active:bg-blue-700"
            onClick={handleTextSubmit}
          >
            {t('conversation.send')}
          </button>
        </div>
      )}

      <div className="flex w-full max-w-2xl gap-3">
        {/* Voice button — shown only when STT is available */}
        {hasSpeechRecognition() && (
          <button
            disabled={isBusy}
            aria-label={state === 'listening' ? t('conversation.listening') : t('idle.tapToTalk')}
            className="flex-1 min-h-touch rounded-2xl bg-blue-600 p-6 text-kiosk-xl font-bold text-white shadow-lg active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleListen}
          >
            {state === 'listening' ? '🔴' : '🎤'} {state === 'idle' ? t('idle.tapToTalk') : '...'}
          </button>
        )}

        {/* Toggle text-input button (only shown if STT is available — otherwise always visible) */}
        {hasSpeechRecognition() && (
          <button
            aria-pressed={showTextInput}
            aria-label={t('conversation.toggleKeyboard')}
            className={`min-h-touch rounded-2xl px-5 text-kiosk-base text-white shadow-lg active:opacity-80 ${
              showTextInput ? 'bg-indigo-600' : 'bg-gray-700'
            }`}
            onClick={() => {
              setShowTextInput(v => !v);
              if (!showTextInput) setTimeout(() => textareaRef.current?.focus(), 50);
            }}
          >
            ⌨️
          </button>
        )}

        <button
          aria-label={t('conversation.endCall')}
          className="min-h-touch rounded-2xl bg-gray-700 px-6 text-kiosk-base text-white shadow-lg active:bg-gray-600"
          onClick={() => { stopListening(); navigate('/'); }}
        >
          {t('conversation.endCall')}
        </button>
      </div>
    </div>
  );
}
