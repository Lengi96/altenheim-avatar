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
      const message = err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.';
      setError(`${message} Bitte E-Mail und Passwort pruefen und erneut versuchen.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page login-page-staff">
      <a href="#main-content" className="skip-link">Zum Inhalt springen</a>
      <main id="main-content" className="login-card">
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
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="z. B. name@einrichtung.deâ€¦"
            required
            autoComplete="email"
            spellCheck={false}
            autoCapitalize="none"
          />

          <label className="form-label" htmlFor="password">
            Passwort
          </label>
          <input
            id="password"
            type="password"
            className="form-input"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort eingebenâ€¦"
            required
            autoComplete="current-password"
          />

          {error && (
            <p className="form-error" role="alert" aria-live="polite">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Anmeldung?' : 'Anmelden'}
          </button>
        </form>

        <Link to="/resident" className="login-staff-link">
          Bewohner-Ansicht
        </Link>
      </main>
    </div>
  );
}

