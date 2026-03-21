import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface Resident {
  id: string;
  name: string;
  roomNumber: string;
  language: string;
  avatarName: string;
  active: boolean;
}

export default function AdminResidents() {
  const { token } = useAdminAuth();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', roomNumber: '', language: 'de', avatarName: 'Lena' });

  const fetchResidents = async () => {
    const res = await fetch('/api/residents', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setResidents(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchResidents(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/residents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ name: '', roomNumber: '', language: 'de', avatarName: 'Lena' });
    fetchResidents();
  };

  const handleDeactivate = async (id: string) => {
    await fetch(`/api/residents/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchResidents();
  };

  if (loading) return <div className="text-gray-600">Laden...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Bewohner</h1>
        <button onClick={() => setShowForm(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          + Bewohner hinzufügen
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">Neuer Bewohner</h2>
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Name" className="rounded-lg border p-2" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input required placeholder="Zimmer" className="rounded-lg border p-2" value={form.roomNumber} onChange={e => setForm({...form, roomNumber: e.target.value})} />
            <select className="rounded-lg border p-2" value={form.language} onChange={e => setForm({...form, language: e.target.value})}>
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
            <input placeholder="Avatar Name" className="rounded-lg border p-2" value={form.avatarName} onChange={e => setForm({...form, avatarName: e.target.value})} />
          </div>
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
              <th className="p-4">Name</th>
              <th className="p-4">Zimmer</th>
              <th className="p-4">Sprache</th>
              <th className="p-4">Avatar</th>
              <th className="p-4">Status</th>
              <th className="p-4">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {residents.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-4 font-medium">{r.name}</td>
                <td className="p-4">{r.roomNumber}</td>
                <td className="p-4">{r.language.toUpperCase()}</td>
                <td className="p-4">{r.avatarName}</td>
                <td className="p-4">
                  <span className={`rounded-full px-2 py-1 text-xs ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="p-4">
                  {r.active && (
                    <button onClick={() => handleDeactivate(r.id)} className="text-sm text-red-600 hover:underline">
                      Deaktivieren
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
