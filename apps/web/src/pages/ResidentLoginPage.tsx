import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

export default function ResidentLoginPage() {
  const { loginResident } = useAuth();
  const [facilitySlug, setFacilitySlug] = useState('sonnenschein');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginResident(facilitySlug, pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-avatar">
          <Avatar state="idle" size={150} />
        </div>
        <h1 className="login-title">Hallo! Ich bin Anni.</h1>
        <p className="login-subtitle">Gib deinen PIN ein, um zu starten.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="form-label" htmlFor="facility">
            Einrichtung
          </label>
          <input
            id="facility"
            type="text"
            className="form-input"
            value={facilitySlug}
            onChange={(e) => setFacilitySlug(e.target.value)}
            placeholder="Einrichtung"
            required
          />

          <label className="form-label" htmlFor="pin">
            Dein PIN
          </label>
          <input
            id="pin"
            type="password"
            className="form-input form-input-pin"
            inputMode="numeric"
            pattern="[0-9]{4,6}"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="----"
            required
            autoFocus
          />

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
            {loading ? 'Moment...' : 'Los geht\'s!'}
          </button>
        </form>

        <Link to="/login" className="login-staff-link">
          Mitarbeiter-Login
        </Link>
      </div>
    </div>
  );
}
