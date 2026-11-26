/**
 * Root Navigator
 * Chooses Splash, Auth flow, Profile Setup, or Main App based on AuthContext state.
 */
import React from 'react';
import { useAuth } from '../context/AuthContext';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import SplashScreen from '../screens/auth/SplashScreen';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

export default function RootNavigator() {
  const { user, isBootstrapping, hasSeenOnboarding } = useAuth();

  if (isBootstrapping) {
    return <SplashScreen />;
  }

  if (!user) {
    return <AuthNavigator hasSeenOnboarding={hasSeenOnboarding} />;
  }

  if (!user.profileCompleted) {
    return <ProfileSetupScreen />;
  }

  return <MainNavigator />;
}
