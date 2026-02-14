import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../lib/api';

interface ResidentSummary {
  id: string;
  firstName: string;
  displayName?: string;
  birthYear?: number;
  cognitiveLevel: string;
  avatarName: string;
  active: boolean;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [residents, setResidents] = useState<ResidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet<ResidentSummary[]>('/residents')
      .then(setResidents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Anni - Dashboard</h1>
          <p>Willkommen, {user?.name}</p>
        </div>
        <div className="dashboard-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/chat')}>
            Pfleger-Chat
          </button>
          <button className="btn-logout" onClick={logout}>
            Abmelden
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-section">
          <h2>Bewohner</h2>

          {loading && <p className="dashboard-loading">Laden...</p>}
          {error && <p className="form-error">{error}</p>}

          {!loading && residents.length === 0 && (
            <p className="dashboard-empty">Noch keine Bewohner angelegt.</p>
          )}

          <div className="resident-grid">
            {residents.map((r) => (
              <div key={r.id} className="resident-card">
                <div className="resident-card-name">
                  {r.displayName || r.firstName}
                </div>
                {r.birthYear && (
                  <div className="resident-card-detail">
                    Jahrgang {r.birthYear}
                  </div>
                )}
                <div className="resident-card-detail">
                  {r.cognitiveLevel === 'normal'
                    ? 'Keine Einschränkungen'
                    : r.cognitiveLevel === 'mild_dementia'
                      ? 'Leichte Demenz'
                      : 'Fortgeschrittene Demenz'}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
