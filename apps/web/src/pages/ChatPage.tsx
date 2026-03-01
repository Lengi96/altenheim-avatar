import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { requestUrgentHelp, streamChat } from '../lib/api';
import Avatar from '../components/Avatar';
import AvatarStylePicker from '../components/AvatarStylePicker';
import type { ChatMode } from '@anni/shared';
import { getAvatarStyle, setAvatarStyle, type AvatarStyle } from '../lib/avatarStyle';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';

export default function ChatPage() {
  const { resident, role, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [conversationId, setConversationId] = useState<string>();
  const [helpLoading, setHelpLoading] = useState(false);
  const [avatarStyle, setAvatarStyleState] = useState<AvatarStyle>(() => getAvatarStyle());
  const [mode] = useState<ChatMode>(role === 'resident' ? 'bewohner' : 'pfleger');
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController>(undefined);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const avatarName = resident?.avatarName || 'Anni';

  function handleAvatarStyleChange(style: AvatarStyle) {
    setAvatarStyleState(style);
    setAvatarStyle(style);
  }

  useEffect(() => {
    const hour = new Date().getHours();
    let greeting: string;
    if (hour < 11) greeting = `Guten Morgen! Ich bin ${avatarName}. Hast du gut geschlafen?`;
    else if (hour < 14) greeting = `Hallo! Ich bin ${avatarName}. Wie war das Mittagessen?`;
    else if (hour < 18) greeting = `Guten Nachmittag! Ich bin ${avatarName}. Wie geht es dir?`;
    else greeting = `Guten Abend! Ich bin ${avatarName}. Wie war dein Tag?`;

    setMessages([{ role: 'assistant', content: greeting }]);
  }, [avatarName]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || isProcessing) return;

      const userMessage: Message = { role: 'user', content: text.trim() };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsProcessing(true);
      setAvatarState('thinking');
      setStreamingText('');

      abortRef.current?.abort();

      let fullReply = '';

      const controller = streamChat(text.trim(), mode, conversationId, {
        onText(chunk) {
          fullReply += chunk;
          setStreamingText(fullReply);
          setAvatarState('speaking');
        },
        onDone(reply, convId) {
          setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
          setStreamingText('');
          setConversationId(convId);
          setIsProcessing(false);
          setAvatarState('idle');
          inputRef.current?.focus();
        },
        onError(error) {
          setMessages((prev) => [...prev, { role: 'assistant', content: error }]);
          setStreamingText('');
          setIsProcessing(false);
          setAvatarState('idle');
        },
      });

      abortRef.current = controller;
    },
    [isProcessing, mode, conversationId],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  async function handleUrgentHelp() {
    if (helpLoading) return;
    setHelpLoading(true);
    try {
      const result = await requestUrgentHelp(conversationId);
      setConversationId(result.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Ich habe sofort Hilfe angefordert. Eine Pflegekraft wird informiert.',
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Hilfeanfrage fehlgeschlagen.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Ich konnte die Hilfeanfrage nicht senden: ${message}`,
        },
      ]);
    } finally {
      setHelpLoading(false);
    }
  }

  return (
    <div className="chat-page" data-mode={mode}>
      <a href="#main-content" className="skip-link">Zum Inhalt springen</a>
      <header className="chat-header">
        <AvatarStylePicker
          id="chat-avatar-style"
          value={avatarStyle}
          onChange={handleAvatarStyleChange}
          compact
        />
        <button type="button" className="btn-logout" onClick={logout} aria-label="Abmelden">
          Abmelden
        </button>
      </header>

      <main id="main-content" className="chat-main">
        <div className="chat-avatar-area">
          <Avatar state={avatarState} size={mode === 'bewohner' ? 140 : 100} variant={avatarStyle} />
          <div className="chat-status" aria-live="polite">
            {avatarState === 'thinking'
              ? `${avatarName} denkt nach...`
              : avatarState === 'speaking'
                ? `${avatarName} spricht...`
                : avatarState === 'listening'
                  ? 'Ich hoere zu...'
                  : 'Ich bin fuer dich da!'}
          </div>
        </div>

        <div
          className="chat-area"
          ref={chatAreaRef}
          role="log"
          aria-label="Chat-Verlauf"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role === 'user' ? 'user' : 'bot'}`}>
              {msg.role === 'assistant' && <span className="sender-name">{avatarName}</span>}
              {msg.content}
            </div>
          ))}
          {streamingText && (
            <div className="chat-message bot" aria-live="polite" aria-atomic="false">
              <span className="sender-name">{avatarName}</span>
              {streamingText}
            </div>
          )}
          {isProcessing && !streamingText && (
            <div className="typing-indicator" role="status" aria-label={`${avatarName} denkt nach`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </div>

        <form className="chat-input-area" onSubmit={handleSubmit}>
          {mode === 'bewohner' && (
            <button
              type="button"
              className="btn-help-emergency"
              onClick={handleUrgentHelp}
              disabled={helpLoading}
            >
              {helpLoading ? 'Hilfe wird angefordert...' : 'Ich brauche jetzt Hilfe'}
            </button>
          )}

          <label htmlFor="chat-input" className="sr-only">
            Nachricht eingeben
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            className="text-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="z. B. Erzaehl mir von frueher..."
            rows={2}
            disabled={isProcessing}
            spellCheck={true}
            autoComplete="off"
          />
          <div className="button-row">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isProcessing || !input.trim()}
            >
              Senden
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
