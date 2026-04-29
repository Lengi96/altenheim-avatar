import { useState, useEffect } from 'react';

interface ClockState {
  time: string;   // e.g. "14:37"
  date: string;   // e.g. "Dienstag, 29. April 2025"
  weekday: string;
}

export function useClock(locale: string = 'de-DE'): ClockState {
  const format = () => {
    const now = new Date();
    return {
      time: now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      weekday: now.toLocaleDateString(locale, { weekday: 'long' }),
    };
  };

  const [state, setState] = useState<ClockState>(format);

  useEffect(() => {
    // Tick every second so the clock stays accurate
    const interval = setInterval(() => setState(format()), 1000);
    return () => clearInterval(interval);
  }, [locale]);

  return state;
}
