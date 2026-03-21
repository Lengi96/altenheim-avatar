import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface Notification { id: string; residentId: string; title: string; type: string; acknowledged: boolean; createdAt: string; }

export default function AdminNotifications() {
  const { token } = useAdminAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
    setNotifications(await res.json());
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Benachrichtigungen</h1>
        <button onClick={fetchNotifications} className="rounded-lg bg-gray-200 px-4 py-2 text-sm">
          Aktualisieren
        </button>
      </div>

      {notifications.length === 0 && (
        <p className="text-gray-500">Keine offenen Benachrichtigungen.</p>
      )}

      <div className="flex flex-col gap-3">
        {notifications.map(n => (
          <div key={n.id} className="rounded-xl bg-white p-4 shadow flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{n.title}</p>
              <p className="text-sm text-gray-500 capitalize">{n.type} · {new Date(n.createdAt).toLocaleString('de-DE')}</p>
            </div>
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700">Ausstehend</span>
          </div>
        ))}
      </div>
    </div>
  );
}
