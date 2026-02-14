const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('anni-token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Fehler ${res.status}`);
  }
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Fehler ${res.status}`);
  }
  return res.json();
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Fehler ${res.status}`);
  }
  return res.json();
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Fehler ${res.status}`);
  }
}

export interface StreamCallbacks {
  onText: (text: string) => void;
  onDone: (reply: string, conversationId: string) => void;
  onError: (error: string) => void;
}

export function streamChat(
  message: string,
  mode: 'bewohner' | 'pfleger',
  conversationId: string | undefined,
  callbacks: StreamCallbacks,
  residentId?: string,
): AbortController {
  const controller = new AbortController();

  fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ message, mode, conversationId, residentId }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        callbacks.onError(data.error || 'Fehler beim Senden.');
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        callbacks.onError('Streaming nicht verfügbar.');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') {
              callbacks.onText(data.text);
            } else if (data.type === 'done') {
              callbacks.onDone(data.reply, data.conversationId);
            } else if (data.type === 'error') {
              callbacks.onError(data.error);
            }
          } catch (err) {
            console.warn('SSE Parse-Fehler:', line, err);
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        callbacks.onError('Verbindungsfehler. Bitte versuche es nochmal.');
      }
    });

  return controller;
}
