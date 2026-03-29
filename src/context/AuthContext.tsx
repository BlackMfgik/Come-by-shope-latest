import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { UserInfo } from '../api';

interface AuthCtx {
  token: string | null;
  user: UserInfo | null;
  saveAuth: (token: string, user: UserInfo) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [user, setUser] = useState<UserInfo | null>(() => {
    try { return JSON.parse(localStorage.getItem('authUser') ?? 'null'); } catch { return null; }
  });

  function saveAuth(t: string, u: UserInfo) {
    localStorage.setItem('authToken', t);
    localStorage.setItem('authUser', JSON.stringify(u));
    setToken(t);
    setUser(u);
  }

  function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ token, user, saveAuth, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
