import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SPACING } from './src/constants/theme';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.badge}>PHASE 1 FOUNDATION</Text>
        <Text style={styles.title}>SpaceSense</Text>
        <Text style={styles.tagline}>
          Understand Your Space. Reimagine Your World.
        </Text>
        <Text style={styles.subtitle}>
          Expo SDK 58 • JavaScript • Ready for Phase 2 (Authentication & Navigation)
        </Text>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
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
  card: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFEDFD',
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
});
