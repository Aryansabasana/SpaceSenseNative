/**
 * User Profile Setup Screen
 * Shown right after registration (or from Profile -> Edit Preferences)
 * so users can set their display name, preferred interior style, and measurement units.
 */
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const STYLE_OPTIONS = [
  'Minimalist',
  'Modern',
  'Scandinavian',
  'Industrial',
  'Cozy',
  'Workspace',
];

const UNIT_OPTIONS = [
  { key: 'meters', label: 'Meters (m)' },
  { key: 'feet', label: 'Feet (ft)' },
];

export default function ProfileSetupScreen({ navigation }) {
  const { user, completeProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [preferredStyle, setPreferredStyle] = useState(
    user?.preferredStyle || 'Modern'
  );
  const [measurementUnit, setMeasurementUnit] = useState(
    user?.measurementUnit || 'meters'
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isEditingExisting = Boolean(user?.profileCompleted && navigation?.canGoBack?.());

  async function handleSaveProfile() {
    setErrorMessage('');

    if (name.trim().length < 2) {
      setErrorMessage('Display name must be at least 2 characters.');
      return;
    }

    setIsSaving(true);
    try {
      await completeProfile({
        name: name.trim(),
        preferredStyle,
        measurementUnit,
      });

      if (isEditingExisting) {
        navigation.goBack();
      }
    } catch (error) {
      setErrorMessage(error.message || 'Unable to save profile preferences.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.badge}>
          {isEditingExisting ? 'EDIT PROFILE' : 'STEP 2 OF 2'}
        </Text>
        <Text style={styles.title}>Personalize your workspace</Text>
        <Text style={styles.subtitle}>
          These preferences tailor room measurements and AI interior design suggestions.
        </Text>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <FormInput
            label="Display Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            icon="person-outline"
            autoCapitalize="words"
          />

          <Text style={styles.sectionLabel}>Preferred Design Style</Text>
          <View style={styles.chipGrid}>
            {STYLE_OPTIONS.map((styleName) => {
              const selected = preferredStyle === styleName;
              return (
                <TouchableOpacity
                  key={styleName}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setPreferredStyle(styleName)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {styleName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Display Measurement Units</Text>
          <View style={styles.unitRow}>
            {UNIT_OPTIONS.map((unit) => {
              const selected = measurementUnit === unit.key;
              return (
                <TouchableOpacity
                  key={unit.key}
                  style={[styles.unitOption, selected && styles.chipSelected]}
                  onPress={() => setMeasurementUnit(unit.key)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {unit.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <PrimaryButton
            title={isEditingExisting ? 'Save Changes' : 'Finish Setup'}
            onPress={handleSaveProfile}
            loading={isSaving}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primarySoft,
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h1,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.lg,
  },
  errorBanner: {
    backgroundColor: COLORS.errorSoft,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorBannerText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '500',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMain,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  chipSelected: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  unitRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  unitOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  saveButton: {
    marginTop: SPACING.xs,
  },
});
