/**
 * Authentication API Service
 * Keeps all network requests separate from UI screens.
 */
import { apiRequest } from './api';

export async function registerUser({ name, email, password }) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });
}

export async function loginUser({ email, password }) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function fetchCurrentUser(token) {
  return apiRequest('/auth/me', {
    method: 'GET',
    tokenOverride: token,
  });
}

export async function updateUserProfile({ name, preferredStyle, measurementUnit }) {
  return apiRequest('/auth/profile', {
    method: 'PUT',
    body: { name, preferredStyle, measurementUnit },
  });
}

export async function requestPasswordReset(email) {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export async function resetPasswordWithCode({ email, code, newPassword }) {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: { email, code, newPassword },
  });
}
