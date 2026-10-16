import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { login as apiLogin, logout as apiLogout, onAuthExpired, unwrap } from '../api';

const AuthContext = createContext(null);

// Offline demo users — used ONLY in __DEV__ when the API is unreachable
// (ApiError status 0 or demo credentials). Real logins always go through the API.
const DUMMY_USERS = [
  {
    id: 1,
    loginId: '1001',
    username: 'Admin',
    password: 'admin123',
    role: 'admin',
    roles: ['Admin'],
    permissions: ['*'],
  },
  {
    id: 2,
    loginId: '2002',
    username: 'BillStaff',
    password: 'staff123',
    role: 'staff',
    roles: ['Staff'],
    permissions: ['view_stock', 'create_sale', 'view_sale', 'view_ledger', 'search_product'],
  },
];

const dummyLogin = ({ mode, identifier = '', password }) => {
  const found =
    mode === 'loginId'
      ? DUMMY_USERS.find((u) => u.loginId === identifier)
      : DUMMY_USERS.find(
          (u) => u.username.toLowerCase() === identifier.toLowerCase() && u.password === password
        );
  if (!found) throw new Error('Invalid credentials');
  return {
    id: found.id,
    name: found.username,
    loginId: found.loginId,
    role: found.role,
    roles: found.roles,
    permissions: found.permissions,
    demo: true,
  };
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
//   user: { id, name, username, login_id, email, roles: ['Admin'], permissions: [...] } }.
// Still tolerates { data: { user } } | { data: user } | user.
export const toUser = (res, identifier) => {
  const body = unwrap(res) ?? {};
  const u = res?.user ?? body.user ?? body;
  const loginId = u.login_id ?? u.loginId ?? u.employee_id ?? identifier;
  const role = toRole(u);

  const rawRoles = u.roles ?? res?.roles ?? body?.roles ?? [role];
  const roles = Array.isArray(rawRoles)
    ? rawRoles.map((r) => (typeof r === 'string' ? r : r.name || r.title || String(r)))
    : [role];

  const rawPerms = u.permissions ?? res?.permissions ?? body?.permissions ?? [];
  const permissions = Array.isArray(rawPerms)
    ? rawPerms.map((p) => (typeof p === 'string' ? p : p.name || p.slug || p.key || String(p)))
    : [];

  return {
    id: u.id ?? identifier,
    name: u.name || u.username || u.email || identifier,
    loginId: loginId === undefined || loginId === null ? '' : String(loginId),
    role,
    roles,
    permissions,
    email: u.email ?? null,
  };
};

const POST_LOGIN_LOADER_MS = 3000; // the loader must show at least this long, even if the API answered instantly

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  // True for a minimum of POST_LOGIN_LOADER_MS right after a successful sign-in, so
  // RootNavigator keeps the post-login loader on screen for its full show instead of
  // flashing straight to the app when the API responds fast.
  const [justSignedIn, setJustSignedIn] = useState(false);

  // Token refresh failed / 401 → drop back to the login screen.
  useEffect(() => {
    // An offline demo session has no tokens, so every data call 401s — signing it out on the
    // first one would bounce the user back to login a second after they got in. Demo sessions
    // stay signed in and the screens show their own "can't load" states instead.
    const off = onAuthExpired(() => setUser((u) => (u?.demo ? u : null)));
    return typeof off === 'function' ? off : undefined;
  }, []);

  useEffect(() => {
    if (!justSignedIn) return undefined;
    const t = setTimeout(() => setJustSignedIn(false), POST_LOGIN_LOADER_MS);
    return () => clearTimeout(t);
  }, [justSignedIn]);

  const login = async ({ mode = 'username', identifier, password }) => {
    setLoading(true);
    try {
      const res = await apiLogin(toCredentials({ mode, identifier, password }));
      const next = toUser(res, identifier);
      // Loader flag first: if React doesn't batch these (async, old architecture), `user` must not
      // render the app for a frame before the post-login loader is requested.
      setJustSignedIn(true);
      setUser(next);
      return next;
    } catch (e) {
      const isDemoCred =
        identifier === '1001' ||
        identifier === '2002' ||
        identifier.toLowerCase() === 'admin' ||
        identifier.toLowerCase() === 'billstaff';
      if (__DEV__ && (e?.status === 0 || (e?.status === 401 && isDemoCred))) {
        const next = dummyLogin({ mode, identifier, password });
        setJustSignedIn(true);
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
    setJustSignedIn(true);
    setUser({
      id: Date.now(),
      name: username,
      loginId,
      role: 'staff',
      roles: ['Staff'],
      permissions: ['view_stock', 'create_sale', 'view_sale'],
    });
  };

  const logout = () => {
    // Fire and forget — never block the UI on the network.
    Promise.resolve()
      .then(() => apiLogout())
      .catch(() => {});
    setUser(null);
  };

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const r = String(user.role || '').toLowerCase();
    if (r === 'admin' || r === 'superadmin' || r === 'owner') return true;
    return Array.isArray(user.roles) && user.roles.some((role) => {
      const s = String(role).toLowerCase();
      return s === 'admin' || s === 'superadmin' || s === 'owner';
    });
  }, [user]);

  const isStaff = useMemo(() => !isAdmin, [isAdmin]);

  const can = useMemo(() => {
    return (action, resource) => {
      if (!user) return false;
      if (isAdmin) return true;

      const act = String(action || '').toLowerCase();
      const res = String(resource || '').toLowerCase();

      // Check explicit granular permissions if available
      if (Array.isArray(user.permissions) && user.permissions.length > 0) {
        const candidates = [
          '*',
          'all',
          act,
          `${act}_${res}`,
          `${res}_${act}`,
          `${act}.${res}`,
          `${res}.${act}`,
          `manage_${res}`,
          `${res}_manage`,
        ];
        if (user.permissions.some((p) => candidates.includes(String(p).toLowerCase()))) {
          return true;
        }
      }

      // Default role constraints for staff:
      if (act === 'delete' || act === 'destroy' || act === 'remove') {
        return false;
      }
      if (res === 'shop' && (act === 'save' || act === 'update' || act === 'create')) {
        return false;
      }
      if (res === 'branch' && (act === 'create' || act === 'update' || act === 'toggle' || act === 'delete')) {
        return false;
      }
      if (res === 'product' && act === 'delete') {
        return false;
      }
      if (res === 'purchase' && act === 'delete') {
        return false;
      }

      return true;
    };
  }, [user, isAdmin]);

  const hasPermission = useMemo(() => {
    return (permissionName) => {
      if (!user) return false;
      if (isAdmin) return true;
      if (!permissionName) return true;
      const target = String(permissionName).toLowerCase();
      return (
        user.permissions?.some((p) => String(p).toLowerCase() === target || p === '*') || false
      );
    };
  }, [user, isAdmin]);

  const value = useMemo(
    () => ({
      user,
      loading,
      justSignedIn,
      login,
      signUp,
      logout,
      isAdmin,
      isStaff,
      can,
      hasPermission,
    }),
    [user, loading, justSignedIn, isAdmin, isStaff, can, hasPermission]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
