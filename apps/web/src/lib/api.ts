const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('anni-token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function toApiError(res: Response): Promise<Error> {
  const data = await res.json().catch(() => ({}));
  const serverMessage = typeof data.error === 'string' ? data.error : '';

  if (serverMessage) {
    return new Error(serverMessage);
  }

  if (res.status === 404) {
    return new Error(
      'API-Endpunkt nicht gefunden (404). Bitte pruefe, ob das Backend laeuft und die URL /api korrekt ist.',
    );
  }

  if (res.status >= 500) {
    return new Error('Serverfehler. Bitte versuche es in ein paar Sekunden erneut.');
  }

  return new Error(`Fehler ${res.status}`);
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    throw await toApiError(res);
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
    throw await toApiError(res);
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
    throw await toApiError(res);
  }
  return res.json();
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    throw await toApiError(res);
  }
}

export interface HelpResponse {
  ok: boolean;
  message: string;
  conversationId: string;
}

export async function requestUrgentHelp(conversationId?: string): Promise<HelpResponse> {
  return apiPost<HelpResponse>('/help/urgent', { conversationId });
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
