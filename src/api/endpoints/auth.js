import { apiRequest, pickAccessToken, pickRefreshToken, refreshAccessToken } from '../client';
import { clearTokens, setTokens } from '../tokenStore';

// Confirmed success response: { status: true, message, access_token, refresh_token, user }.
// A { status: false, message } body is thrown as ApiError(message) by apiRequest.
export const login = async (credentials) => {
  const res = await apiRequest('/login', { method: 'POST', body: credentials, auth: false });
  const accessToken = pickAccessToken(res);
  if (accessToken) setTokens({ accessToken, refreshToken: pickRefreshToken(res) });
  return res;
};

export const refreshToken = () => refreshAccessToken();

export const logout = async () => {
  try {
    return await apiRequest('/logout', { method: 'POST' });
  } finally {
    clearTokens();
  }
};
