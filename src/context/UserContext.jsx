import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UserContext = createContext();

const SESSION_KEY = "hc_session";
const SESSION_TTL_DAYS = 7;

function saveSession(role, data) {
  const expiry = Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ role, data, expiry }));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() > session.expiry) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function UserProvider({ children }) {
  const nav = useNavigate();

  // Hydrate from localStorage on first render
  const stored = loadSession();
  const [userRole, setUserRole] = useState(stored?.role || null);
  const [user, setUser] = useState(stored?.data || null);

  // If a valid session exists, redirect away from landing/login pages on mount
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setUserRole(session.role);
      setUser(session.data);
    }
  }, []);

  const login = (role, data) => {
    setUserRole(role);
    setUser(data);
    saveSession(role, data);
  };

  const logout = () => {
    setUserRole(null);
    setUser(null);
    clearSession();
    nav("/");
  };

  return (
    <UserContext.Provider value={{ user, userRole, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
