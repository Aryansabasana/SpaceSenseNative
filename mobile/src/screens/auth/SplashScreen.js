/**
 * Splash Screen
 * Displayed while AuthContext restores the saved JWT session from SecureStore.
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoMark}>
        <Ionicons name="cube-outline" size={42} color={COLORS.surface} />
      </View>
      <Text style={styles.brand}>SpaceSense</Text>
      <Text style={styles.tagline}>Understand Your Space. Reimagine Your World.</Text>
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        style={styles.spinner}
      />
      <Text style={styles.statusText}>Restoring workspace session...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  logoMark: {
    width: 84,
    height: 84,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  brand: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  spinner: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
