import React, { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

// Dummy users. Replace with API call once backend is ready.
const DUMMY_USERS = [
  { id: 1, loginId: '1001', username: 'Admin', password: 'admin123', role: 'admin' },
  { id: 2, loginId: '2002', username: 'BillStaff', password: 'staff123', role: 'staff' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async ({ mode = 'username', identifier, password }) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    let found;
    if (mode === 'loginId') {
      found = DUMMY_USERS.find((u) => u.loginId === identifier);
    } else {
      found = DUMMY_USERS.find(
        (u) =>
          u.username.toLowerCase() === identifier.toLowerCase() &&
          u.password === password
      );
    }
    setLoading(false);
    if (!found) throw new Error('Invalid credentials');
    setUser({ id: found.id, name: found.username, loginId: found.loginId, role: found.role });
    return found;
  };

  const signUp = async ({ username, loginId, password }) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setLoading(false);
    setUser({ id: Date.now(), name: username, loginId, role: 'admin' });
  };

  const logout = () => setUser(null);

  const value = useMemo(() => ({ user, loading, login, signUp, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
