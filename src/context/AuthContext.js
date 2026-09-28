import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { login as apiLogin, logout as apiLogout, onAuthExpired, unwrap } from '../api';

const AuthContext = createContext(null);

// Offline demo users — used ONLY in __DEV__ when the API is unreachable
// (ApiError status 0). Real logins always go through the API.
const DUMMY_USERS = [
  { id: 1, loginId: '1001', username: 'Admin', password: 'admin123', role: 'admin' },
  { id: 2, loginId: '2002', username: 'BillStaff', password: 'staff123', role: 'staff' },
];

const dummyLogin = ({ mode, identifier = '', password }) => {
  const found =
    mode === 'loginId'
      ? DUMMY_USERS.find((u) => u.loginId === identifier)
      : DUMMY_USERS.find(
          (u) => u.username.toLowerCase() === identifier.toLowerCase() && u.password === password
        );
  if (!found) throw new Error('Invalid credentials');
  return { id: found.id, name: found.username, loginId: found.loginId, role: found.role };
};

// Login request body. Request field names are still unconfirmed — only the
// response shape is known. login_id is sent as the typed string; undefined
// fields (e.g. password in loginId mode) are omitted.
export const toCredentials = ({ mode, identifier, password }) => {
  const body = mode === 'loginId' ? { login_id: identifier } : { email: identifier, username: identifier };
  if (password !== undefined) body.password = password;
  return body;
};

const roleName = (r) => (r && typeof r === 'object' ? r.name : r);

const toRole = (u) => {
  const raw = roleName(u.role) ?? roleName(u.roles?.[0]) ?? u.type;
  return typeof raw === 'string' && raw ? raw.toLowerCase() : 'staff';
};

// Confirmed response: { status, message, access_token, refresh_token,
//   user: { id, name, username, login_id, email, roles: ['Admin'] } }.
// Still tolerates { data: { user } } | { data: user } | user.
export const toUser = (res, identifier) => {
  const body = unwrap(res) ?? {};
  const u = res?.user ?? body.user ?? body;
  const loginId = u.login_id ?? u.loginId ?? u.employee_id ?? identifier;
  return {
    id: u.id ?? identifier,
    name: u.name || u.username || u.email || identifier,
    loginId: loginId === undefined || loginId === null ? '' : String(loginId),
    role: toRole(u),
    email: u.email ?? null,
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Token refresh failed / 401 → drop back to the login screen.
  useEffect(() => {
    const off = onAuthExpired(() => setUser(null));
    return typeof off === 'function' ? off : undefined;
  }, []);

  const login = async ({ mode = 'username', identifier, password }) => {
    setLoading(true);
    try {
      const res = await apiLogin(toCredentials({ mode, identifier, password }));
      const next = toUser(res, identifier);
      setUser(next);
      return next;
    } catch (e) {
      if (__DEV__ && e?.status === 0) {
        const next = dummyLogin({ mode, identifier, password });
        setUser(next);
        return next;
      }
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // NOTE: no sign-up endpoint exists on the backend — this is still a local stub.
  const signUp = async ({ username, loginId, password }) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setLoading(false);
    setUser({ id: Date.now(), name: username, loginId, role: 'admin' });
  };

  const logout = () => {
    // Fire and forget — never block the UI on the network.
    Promise.resolve()
      .then(() => apiLogout())
      .catch(() => {});
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, signUp, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
