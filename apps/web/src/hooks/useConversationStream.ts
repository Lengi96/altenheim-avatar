import { useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useConversationStream() {
  const sendMessage = useCallback(
    async (
      residentId: string,
      message: string,
      history: Message[],
      onChunk: (chunk: string) => void,
      onDone: (fullText: string) => void,
      onError: (msg: string) => void
    ) => {
      let response: Response;
      try {
        response = await fetch('/api/conversation/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ residentId, message, history }),
        });
      } catch {
        onError('Verbindungsfehler');
        return;
      }

      if (!response.ok || !response.body) {
        onError('Verbindungsfehler');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'delta') {
              fullText += event.text;
              onChunk(event.text);
            } else if (event.type === 'done') {
              onDone(fullText);
            } else if (event.type === 'error') {
              onError(event.message);
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    },
    []
  );

  return { sendMessage };
}
