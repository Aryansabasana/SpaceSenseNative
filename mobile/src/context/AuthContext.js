/**
 * Authentication Context
 * Manages logged-in user state, JWT session restoration, onboarding state, and auth actions.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { setApiAuthToken } from '../services/api';
import {
  fetchCurrentUser,
  loginUser,
  registerUser,
  updateUserProfile,
} from '../services/authService';
import { getItem, removeItem, saveItem, STORAGE_KEYS } from '../services/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Restore JWT session and onboarding status when the app launches
  useEffect(() => {
    async function restoreSession() {
      try {
        const [onboardingFlag, savedToken] = await Promise.all([
          getItem(STORAGE_KEYS.ONBOARDING_DONE),
          getItem(STORAGE_KEYS.AUTH_TOKEN),
        ]);

        setHasSeenOnboarding(onboardingFlag === 'true');

        if (savedToken) {
          setApiAuthToken(savedToken);
          const result = await fetchCurrentUser(savedToken);
          setToken(savedToken);
          setUser(result.user);
        }
      } catch (error) {
        // Clear stale or invalid token if backend rejects it
        setApiAuthToken(null);
        await removeItem(STORAGE_KEYS.AUTH_TOKEN);
        setToken(null);
        setUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    }

    restoreSession();
  }, []);

  async function saveSession(newToken, newUser) {
    setApiAuthToken(newToken);
    await saveItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
    setToken(newToken);
    setUser(newUser);
  }

  async function register({ name, email, password }) {
    const data = await registerUser({ name, email, password });
    await saveSession(data.token, data.user);
    return data.user;
  }

  async function login({ email, password }) {
    const data = await loginUser({ email, password });
    await saveSession(data.token, data.user);
    return data.user;
  }

  async function completeProfile(profilePayload) {
    const data = await updateUserProfile(profilePayload);
    setUser(data.user);
    return data.user;
  }

  async function completeOnboarding() {
    await saveItem(STORAGE_KEYS.ONBOARDING_DONE, 'true');
    setHasSeenOnboarding(true);
  }

  async function logout() {
    setApiAuthToken(null);
    await removeItem(STORAGE_KEYS.AUTH_TOKEN);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isBootstrapping,
        hasSeenOnboarding,
        register,
        login,
        logout,
        completeProfile,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
