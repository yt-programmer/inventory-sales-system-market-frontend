import { createContext, useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "./lib/api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // The session lives in an httpOnly cookie, so we ask the server who is logged in
  useEffect(() => {
    api("/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Any 401 from the server (session expired) sends us back to the login page
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("mm:unauthorized", onExpired);
    return () => window.removeEventListener("mm:unauthorized", onExpired);
  }, []);

  const login = async (password, username) => {
    const d = await api("/auth/login", {
      method: "POST",
      body: { password, ...(username ? { username } : {}) },
    });
    setUser(d.user);
    return d.user;
  };

  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      /* the session had already expired */
    }
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, loading, login, logout }}>{children}</AuthCtx.Provider>;
}

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

export function RequireRole({ roles, children }) {
  const { user } = useAuth();
  return roles.includes(user?.role) ? children : <Navigate to="/" replace />;
}
