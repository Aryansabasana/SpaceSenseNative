/**
 * Base HTTP Client
 * Centralizes API base URL resolution, timeouts, Bearer token headers, and error parsing.
 */
import { NativeModules, Platform } from 'react-native';

function resolveApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;

  // Use explicit non-auto URL when provided (e.g. staging/production or custom tunnel)
  if (configuredUrl && configuredUrl !== 'auto') {
    return configuredUrl.replace(/\/+$/, '');
  }

  // In development, derive the PC's current LAN IP automatically from Metro's scriptURL
  // so switching Wi-Fi networks or hotspots doesn't break physical-device requests.
  if (__DEV__) {
    const scriptUrl =
      NativeModules?.SourceCode?.getConstants?.()?.scriptURL ||
      NativeModules?.SourceCode?.scriptURL ||
      '';
    const match = scriptUrl.match(/^https?:\/\/([^/:]+)(?::\d+)?\//i);
    const metroHost = match ? match[1] : '';

    if (
      metroHost &&
      (/^\d{1,3}(\.\d{1,3}){3}$/.test(metroHost) || metroHost === 'localhost')
    ) {
      return `http://${metroHost}:5000/api`;
    }
  }

  return Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api'
    : 'http://localhost:5000/api';
}

const API_BASE_URL = resolveApiBaseUrl();

let authToken = null;

export function setApiAuthToken(token) {
  authToken = token || null;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeoutMs = 10000,
    tokenOverride = null,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  const activeToken = tokenOverride || authToken;
  if (activeToken) {
    requestHeaders.Authorization = `Bearer ${activeToken}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed (${response.status})`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError' || /abort|cancel/i.test(error.message || '')) {
      throw new Error(
        `Request timed out reaching ${API_BASE_URL}. Make sure the backend server is running and reachable on your current Wi-Fi.`
      );
    }
    if (error instanceof TypeError || /network request failed|connect/i.test(error.message || '')) {
      throw new Error(
        `Cannot connect to backend at ${API_BASE_URL}. Make sure "npm.cmd run dev" is running in backend/.`
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
