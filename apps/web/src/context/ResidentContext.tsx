import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Resident {
  id: string;
  name: string;
  language: string;
  avatarName: string;
  preferences: Record<string, unknown>;
}

interface ReminderEvent {
  type: 'reminder';
  scheduleId: string;
  title: string;
  scheduleType: string;
}

interface ResidentContextValue {
  resident: Resident | null;
  setResidentId: (id: string) => void;
  pendingReminder: ReminderEvent | null;
  clearReminder: () => void;
  snoozeReminder: (reminder: ReminderEvent) => void;
}

const ResidentCtx = createContext<ResidentContextValue | null>(null);

const DEMO_RESIDENT_ID = 'demo-resident-id-0000-000000000001';

export function ResidentProvider({ children }: { children: ReactNode }) {
  const [resident, setResident] = useState<Resident | null>(null);
  const [residentId, setResidentId] = useState(DEMO_RESIDENT_ID);
  const [pendingReminder, setPendingReminder] = useState<ReminderEvent | null>(null);

  useEffect(() => {
    fetch(`/api/residents/${residentId}`)
      .then(r => r.json())
      .then(setResident)
      .catch(console.error);
  }, [residentId]);

  useEffect(() => {
    if (!residentId) return;
    let es: EventSource;

    const connect = () => {
      es = new EventSource(`/api/events/stream?residentId=${residentId}`);
      es.onmessage = (e) => {
        const event = JSON.parse(e.data);
        if (event.type === 'reminder') {
          setPendingReminder(event);
        }
      };
      es.onerror = () => {
        es.close();
        setTimeout(connect, 5000);
      };
    };

    connect();
    return () => es?.close();
  }, [residentId]);

  return (
    <ResidentCtx.Provider
      value={{
        resident,
        setResidentId,
        pendingReminder,
        clearReminder: () => setPendingReminder(null),
        snoozeReminder: (reminder) => setPendingReminder(reminder),
      }}
    >
      {children}
    </ResidentCtx.Provider>
  );
}

export function useResident() {
  const ctx = useContext(ResidentCtx);
  if (!ctx) throw new Error('useResident must be inside ResidentProvider');
  return ctx;
}
