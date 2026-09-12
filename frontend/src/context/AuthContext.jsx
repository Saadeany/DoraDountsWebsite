import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginUser, registerUser, getCurrentUser } from "../api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem("ff_token");
      const cachedUser = localStorage.getItem("ff_user");
      if (!token) {
        setLoading(false);
        return;
      }
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch {
          // ignore malformed cache
        }
      }
      try {
        const { data } = await getCurrentUser();
        setUser(data.user);
        localStorage.setItem("ff_user", JSON.stringify(data.user));
      } catch {
        localStorage.removeItem("ff_token");
        localStorage.removeItem("ff_user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await loginUser({ email, password });
    localStorage.setItem("ff_token", data.token);
    localStorage.setItem("ff_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await registerUser(payload);
    localStorage.setItem("ff_token", data.token);
    localStorage.setItem("ff_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("ff_token");
    localStorage.removeItem("ff_user");
    setUser(null);
  }, []);

  const refreshUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("ff_user", JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
