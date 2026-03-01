import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import AvatarStylePicker from '../components/AvatarStylePicker';
import { getAvatarStyle, setAvatarStyle, type AvatarStyle } from '../lib/avatarStyle';

export default function ResidentLoginPage() {
  const { loginResident } = useAuth();
  const [facilitySlug, setFacilitySlug] = useState('sonnenschein');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarStyle, setAvatarStyleState] = useState<AvatarStyle>(() => getAvatarStyle());

  function handleAvatarStyleChange(style: AvatarStyle) {
    setAvatarStyleState(style);
    setAvatarStyle(style);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginResident(facilitySlug, pin);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.';
      setError(`${message} Bitte Einrichtung und PIN pruefen und erneut versuchen.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <a href="#main-content" className="skip-link">Zum Inhalt springen</a>
      <main id="main-content" className="login-card">
        <AvatarStylePicker
          id="resident-avatar-style"
          value={avatarStyle}
          onChange={handleAvatarStyleChange}
        />

        <div className="login-avatar">
          <Avatar state="idle" size={150} variant={avatarStyle} />
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
            name="facilitySlug"
            value={facilitySlug}
            onChange={(e) => setFacilitySlug(e.target.value)}
            placeholder="z. B. sonnenschein..."
            required
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="none"
          />

          <label className="form-label" htmlFor="pin">
            Dein PIN
          </label>
          <input
            id="pin"
            type="password"
            className="form-input form-input-pin"
            name="pin"
            inputMode="numeric"
            pattern="[0-9]{4,6}"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="z. B. 1234..."
            required
            autoComplete="one-time-code"
            spellCheck={false}
          />

          {error && (
            <p className="form-error" role="alert" aria-live="polite">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
            {loading ? 'Moment...' : 'Los geht\'s!'}
          </button>
        </form>

        <Link to="/login" className="login-staff-link">
          Mitarbeiter-Login
        </Link>
      </main>
    </div>
  );
}
