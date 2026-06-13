import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, setAccessToken } from '../lib/api';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback((token: string, nextUser: User) => {
    setAccessToken(token);
    setUser(nextUser);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await api.auth.refresh.post();
      if (active && data) {
        applySession(data.accessToken, data.user);
      }
      if (active) setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [applySession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await api.auth.login.post({ email, password });
      if (error) throw new Error((error.value as { message?: string })?.message ?? 'Login failed');
      applySession(data.accessToken, data.user);
    },
    [applySession],
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const { data, error } = await api.auth.register.post({ email, password, displayName });
      if (error) {
        throw new Error((error.value as { message?: string })?.message ?? 'Registration failed');
      }
      applySession(data.accessToken, data.user);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    await api.auth.logout.post();
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
