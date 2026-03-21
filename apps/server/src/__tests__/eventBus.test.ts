import { describe, it, expect } from 'vitest';
import { eventBus } from '../lib/eventBus';

describe('EventBus', () => {
  it('returns false when resident not connected', () => {
    const result = eventBus.send('nonexistent-id', {
      type: 'reminder',
      scheduleId: 'test',
      title: 'Test',
      scheduleType: 'medication',
    });
    expect(result).toBe(false);
  });

  it('reports not connected for unknown resident', () => {
    expect(eventBus.isConnected('unknown')).toBe(false);
  });
});
