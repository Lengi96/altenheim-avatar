import '@testing-library/jest-dom';

// Mock EventSource (not available in jsdom)
class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;
  readyState = MockEventSource.OPEN;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: Event) => void) | null = null;
  onopen: ((e: Event) => void) | null = null;
  constructor(public url: string) {}
  close() { this.readyState = MockEventSource.CLOSED; }
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return false; }
}

(globalThis as unknown as Record<string, unknown>).EventSource = MockEventSource;
