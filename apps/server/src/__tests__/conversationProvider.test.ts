import { describe, it, expect, vi } from 'vitest';

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        stream: vi.fn().mockReturnValue({
          [Symbol.asyncIterator]: async function* () {
            yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hallo ' } };
            yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Maria!' } };
            yield { type: 'message_stop' };
          },
        }),
      },
    })),
  };
});

// Import AFTER mock is set up
const { ClaudeProvider } = await import('../providers/ClaudeProvider');

describe('ClaudeProvider', () => {
  it('streams text chunks', async () => {
    const provider = new ClaudeProvider();
    const chunks: string[] = [];

    const stream = provider.stream(
      [{ role: 'user', content: 'Hallo' }],
      {
        name: 'Maria',
        language: 'de',
        avatarName: 'Lena',
        preferences: {},
        todaySchedule: [],
      }
    );

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(chunks.join('')).toBe('Hallo Maria!');
  });
});
