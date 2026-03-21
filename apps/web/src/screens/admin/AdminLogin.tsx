import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Anmeldung fehlgeschlagen');
        return;
      }
      login(data.token, data.user);
      navigate('/admin/residents');
    } catch {
      setError('Verbindungsfehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl"
      >
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Altenheim Admin</h1>
        {error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">{error}</p>}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('admin.email')}</label>
          <input
            type="email"
            required
            className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('admin.password')}</label>
          <input
            type="password"
            required
            className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? '...' : t('admin.login')}
        </button>
      </form>
    </div>
  );
}
