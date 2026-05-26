import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { AuthUser, UserRole } from "../types";
import { authApi } from "../api/auth";
import type { RawUser } from "../api/auth";

// Normalize raw API user → our internal AuthUser shape
function normalizeUser(raw: RawUser): AuthUser {
  return {
    id: raw.id,
    name: `${raw.first_name} ${raw.last_name}`.trim(),
    email: raw.email,
    role: raw.role.toLowerCase() as UserRole, // "ADMIN" → "admin"
    avatar: raw.avatar_url ?? undefined,
  };
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      setIsLoading(true);
      try {
        const { data } = await authApi.login({ email, password });
        // API wraps payload inside data.data — unwrap it
        const token = data.data.token;
        const user = normalizeUser(data.data.user); // normalize role + name
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setToken(token);
        setUser(user);
        return user;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* noop */
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  // Verify token on mount
  useEffect(() => {
    if (token && !user) {
      authApi
        .me()
        .then(({ data }) => {
          const normalized = normalizeUser(data.data.user);
          setUser(normalized);
          localStorage.setItem("user", JSON.stringify(normalized));
        })
        .catch(() => logout());
    }
  }, [token, user, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
