import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { apiPost } from '../lib/api';

interface AuthState {
  token: string;
  role: 'admin' | 'caregiver' | 'family' | 'resident';
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    facilityId: string;
  };
  resident?: {
    id: string;
    firstName: string;
    displayName: string;
    avatarName: string;
    addressForm: string;
    cognitiveLevel: string;
  };
}

interface AuthContextValue {
  isAuthenticated: boolean;
  role: string | null;
  user: AuthState['user'] | null;
  resident: AuthState['resident'] | null;
  token: string | null;
  loginStaff: (email: string, password: string) => Promise<void>;
  loginResident: (facilitySlug: string, pin: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    const saved = localStorage.getItem('anni-auth');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.warn('Gespeicherte Auth-Daten konnten nicht gelesen werden:', err);
        localStorage.removeItem('anni-auth');
      }
    }
    return null;
  });

  const saveAuth = (state: AuthState) => {
    localStorage.setItem('anni-auth', JSON.stringify(state));
    localStorage.setItem('anni-token', state.token);
    setAuth(state);
  };

  const loginStaff = useCallback(async (email: string, password: string) => {
    const data = await apiPost<{ token: string; user: AuthState['user'] }>(
      '/auth/login',
      { email, password },
    );
    saveAuth({
      token: data.token,
      role: data.user!.role as AuthState['role'],
      user: data.user,
    });
  }, []);

  const loginResident = useCallback(async (facilitySlug: string, pin: string) => {
    const data = await apiPost<{ token: string; resident: AuthState['resident'] }>(
      '/auth/resident-login',
      { facilitySlug, pin },
    );
    saveAuth({
      token: data.token,
      role: 'resident',
      resident: data.resident,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('anni-auth');
    localStorage.removeItem('anni-token');
    setAuth(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!auth,
        role: auth?.role || null,
        user: auth?.user || null,
        resident: auth?.resident || null,
        token: auth?.token || null,
        loginStaff,
        loginResident,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden.');
  return ctx;
}
