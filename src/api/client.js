import { API_BASE_URL } from './config';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  notifyAuthExpired,
  setTokens,
} from './tokenStore';

export class ApiError extends Error {
  constructor(message, { status = 0, data = null, errors = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.errors = errors;
  }
}

export const unwrap = (res) => res?.data ?? res;

// POST /login (confirmed) returns top-level access_token / refresh_token, which
// are read first; the other keys are fallbacks for unconfirmed endpoints (e.g. refresh).
export const pickAccessToken = (res) =>
  res?.access_token ?? res?.token ?? res?.data?.access_token ?? res?.data?.token ?? null;

export const pickRefreshToken = (res) => res?.refresh_token ?? res?.data?.refresh_token ?? null;

const isEmpty = (v) => v === undefined || v === null || v === '';

const buildUrl = (path, query) => {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const qs = Object.entries(query)
    .filter(([, v]) => !isEmpty(v))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return qs ? `${url}?${qs}` : url;
};

const isFormData = (body) => typeof FormData !== 'undefined' && body instanceof FormData;

const parseBody = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
};

const defaultMessage = (status) => {
  if (status === 401) return 'Your session has expired — please log in again';
  if (status === 403) return 'You do not have permission to do this';
  if (status === 404) return 'Not found';
  if (status === 422) return 'Please check the entered details';
  if (status >= 500) return 'Server error — please try again later';
  if (status >= 200 && status < 300) return 'Request failed';
  return `Request failed (${status})`;
};

const toError = (status, data) => {
  const obj = data && typeof data === 'object' ? data : null;
  const errors = obj?.errors && typeof obj.errors === 'object' ? obj.errors : null;
  const message = (typeof obj?.message === 'string' && obj.message) || defaultMessage(status);
  return new ApiError(message, { status, data, errors });
};

const send = async (url, init) => {
  try {
    return await fetch(url, init);
  } catch (e) {
    // Let callers distinguish deliberate cancellation from connectivity problems.
    if (e?.name === 'AbortError') throw e;
    throw new ApiError('Network error — check your connection', { status: 0 });
  }
};

// Single-flight: concurrent 401s share one refresh request.
let refreshPromise = null;

export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh = getRefreshToken();
      if (!refresh) throw new ApiError('No refresh token', { status: 401 });
      const response = await send(buildUrl('/refresh-token'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refresh}`,
        },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      const data = await parseBody(response);
      const access = pickAccessToken(data);
      if (!response.ok || !access) throw toError(response.ok ? 401 : response.status, data);
      setTokens({ accessToken: access, refreshToken: pickRefreshToken(data) ?? refresh });
      return access;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiRequest(path, { method = 'GET', body, query, auth = true, signal } = {}) {
  const url = buildUrl(path, query);

  const run = async () => {
    const headers = { Accept: 'application/json' };
    let payload;
    if (body !== undefined && body !== null) {
      if (isFormData(body)) {
        // No Content-Type: fetch sets the multipart boundary itself.
        payload = body;
      } else {
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
      }
    }
    const token = auth ? getAccessToken() : null;
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await send(url, { method, headers, body: payload, signal });
    return { response, data: await parseBody(response) };
  };

  let { response, data } = await run();

  if (response.status === 401 && auth) {
    try {
      await refreshAccessToken();
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      clearTokens();
      notifyAuthExpired();
      throw toError(401, data);
    }
    ({ response, data } = await run());
  }

  if (!response.ok) throw toError(response.status, data);
  if (data && typeof data === 'object' && (data.status === false || data.success === false)) {
    throw toError(response.status, data);
  }
  return data;
}
