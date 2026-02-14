import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { loginStaff } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginStaff(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page login-page-staff">
      <div className="login-card">
        <h1 className="login-title">Anni - Mitarbeiter</h1>
        <p className="login-subtitle">Melden Sie sich an, um fortzufahren.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="form-label" htmlFor="email">
            E-Mail
          </label>
          <input
            id="email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@einrichtung.de"
            required
            autoFocus
          />

          <label className="form-label" htmlFor="password">
            Passwort
          </label>
          <input
            id="password"
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort"
            required
          />

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Anmeldung...' : 'Anmelden'}
          </button>
        </form>

        <Link to="/resident" className="login-staff-link">
          Bewohner-Ansicht
        </Link>
      </div>
    </div>
  );
}
