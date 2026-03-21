import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface Resident { id: string; name: string; }
interface Schedule { id: string; residentId: string; type: string; title: string; cronExpression: string; active: boolean; }

export default function AdminSchedules() {
  const { token } = useAdminAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ residentId: '', type: 'medication', title: '', cronExpression: '0 8 * * *' });

  const fetchAll = async () => {
    const [s, r] = await Promise.all([
      fetch('/api/schedules', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/residents', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]);
    setSchedules(s);
    setResidents(r);
    if (r.length > 0 && !form.residentId) setForm(f => ({ ...f, residentId: r[0].id }));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/schedules/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchAll();
  };

  const residentName = (id: string) => residents.find(r => r.id === id)?.name ?? id;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Termine & Erinnerungen</h1>
        <button onClick={() => setShowForm(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-white">
          + Termin hinzufügen
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl bg-white p-6 shadow">
          <div className="grid grid-cols-2 gap-4">
            <select className="rounded-lg border p-2" value={form.residentId} onChange={e => setForm({...form, residentId: e.target.value})}>
              {residents.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select className="rounded-lg border p-2" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option value="medication">Medikament</option>
              <option value="appointment">Termin</option>
              <option value="activity">Aktivität</option>
            </select>
            <input required placeholder="Titel" className="rounded-lg border p-2" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            <input required placeholder="Cron (z.B. 0 8 * * *)" className="rounded-lg border p-2 font-mono" value={form.cronExpression} onChange={e => setForm({...form, cronExpression: e.target.value})} />
          </div>
          <p className="mt-2 text-xs text-gray-500">Cron-Format: Minute Stunde * * * (Täglich um 8:00 = "0 8 * * *")</p>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white">Speichern</button>
            <button type="button" className="rounded-lg bg-gray-200 px-4 py-2" onClick={() => setShowForm(false)}>Abbrechen</button>
          </div>
        </form>
      )}

      <div className="rounded-xl bg-white shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm text-gray-600">
            <tr>
              <th className="p-4">Bewohner</th>
              <th className="p-4">Typ</th>
              <th className="p-4">Titel</th>
              <th className="p-4">Cron</th>
              <th className="p-4">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map(s => (
              <tr key={s.id} className="border-t">
                <td className="p-4">{residentName(s.residentId)}</td>
                <td className="p-4 capitalize">{s.type}</td>
                <td className="p-4 font-medium">{s.title}</td>
                <td className="p-4 font-mono text-sm">{s.cronExpression}</td>
                <td className="p-4">
                  <button onClick={() => handleDelete(s.id)} className="text-sm text-red-600 hover:underline">Löschen</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
