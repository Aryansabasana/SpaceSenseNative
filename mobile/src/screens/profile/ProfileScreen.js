/**
 * Profile Screen
 * Shows authenticated user account details, lets them edit preferences, or log out.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/PrimaryButton';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || 'S').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Preferred Design Style</Text>
            <Text style={styles.rowValue}>{user?.preferredStyle || 'Modern'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Measurement Units</Text>
            <Text style={styles.rowValue}>{user?.measurementUnit || 'meters'}</Text>
          </View>
        </View>

        <PrimaryButton
          title="Edit Preferences"
          variant="outline"
          onPress={() => navigation.navigate('EditProfile')}
          style={styles.buttonGap}
        />

        <PrimaryButton
          title="Log Out"
          variant="danger"
          onPress={logout}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h1,
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatarText: {
    color: COLORS.surface,
    fontSize: 28,
    fontWeight: '700',
  },
  name: {
    ...TYPOGRAPHY.h2,
  },
  email: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  rowLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMain,
    textTransform: 'capitalize',
  },
  buttonGap: {
    marginBottom: SPACING.sm,
  },
});
