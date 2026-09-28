// In-memory token holder. Tokens are lost on app restart.
// TODO: plug in persistence (e.g. expo-secure-store) by hydrating in an
// init function and writing through in setTokens/clearTokens.

let accessToken = null;
let refreshToken = null;
const listeners = new Set();

export const getAccessToken = () => accessToken;

export const getRefreshToken = () => refreshToken;

// Only overwrites the tokens that are provided.
export const setTokens = ({ accessToken: access, refreshToken: refresh } = {}) => {
  if (access !== undefined) accessToken = access;
  if (refresh !== undefined) refreshToken = refresh;
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
};

// Fired when a token refresh fails, so the app can log the user out.
export const onAuthExpired = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const notifyAuthExpired = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      // A faulty listener must not break the others.
    }
  });
};
