/**
 * Secure Storage Helper
 * Uses Expo SecureStore on iOS/Android for encrypted persistence (e.g. JWT tokens),
 * with a simple fallback on web where SecureStore is unavailable.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'spacesense_auth_token',
  ONBOARDING_DONE: 'spacesense_onboarding_done',
};

export async function saveItem(key, value) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getItem(key) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  }
  return SecureStore.getItemAsync(key);
}

export async function removeItem(key) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
