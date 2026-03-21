import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthState {
  token: string | null;
  user: { name: string; role: string } | null;
}

interface AdminAuthContextValue extends AuthState {
  login: (token: string, user: AuthState['user']) => void;
  logout: () => void;
}

const AdminAuthCtx = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = sessionStorage.getItem('admin_token');
    const userStr = sessionStorage.getItem('admin_user');
    return {
      token,
      user: userStr ? JSON.parse(userStr) : null,
    };
  });

  const login = (token: string, user: AuthState['user']) => {
    sessionStorage.setItem('admin_token', token);
    sessionStorage.setItem('admin_user', JSON.stringify(user));
    setAuth({ token, user });
  };

  const logout = () => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');
    setAuth({ token: null, user: null });
  };

  return (
    <AdminAuthCtx.Provider value={{ ...auth, login, logout }}>
      {children}
    </AdminAuthCtx.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthCtx);
  if (!ctx) throw new Error('useAdminAuth must be inside AdminAuthProvider');
  return ctx;
}
