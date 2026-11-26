/**
 * Onboarding Screen
 * Introduces SpaceSense capabilities before Login/Registration.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '../../components/PrimaryButton';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const SLIDES = [
  {
    icon: 'scan-outline',
    title: 'Intelligent Room Scanning',
    description:
      'Capture floor and wall boundaries using supported AR sensors, or build accurate rooms with manual measurements.',
    accent: COLORS.primary,
  },
  {
    icon: 'cube-outline',
    title: '2D Plans & 3D Digital Twins',
    description:
      'Convert room dimensions into clean 2D floor plans and interactive 3D models you can inspect from any angle.',
    accent: COLORS.accent,
  },
  {
    icon: 'sparkles-outline',
    title: 'AI Design & Placement Checks',
    description:
      'Detect existing furniture, test new layouts with geometry-based collision checks, and get tailored design ideas.',
    accent: COLORS.secondary,
  },
];

export default function OnboardingScreen({ navigation }) {
  const { completeOnboarding } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);

  const currentSlide = SLIDES[stepIndex];
  const isLastSlide = stepIndex === SLIDES.length - 1;

  async function handleContinue() {
    if (!isLastSlide) {
      setStepIndex((prev) => prev + 1);
      return;
    }
    await completeOnboarding();
    navigation.replace('Login');
  }

  async function handleSkip() {
    await completeOnboarding();
    navigation.replace('Login');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.brandSmall}>SpaceSense</Text>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.centerContent}>
        <View style={[styles.iconCircle, { backgroundColor: `${currentSlide.accent}1A` }]}>
          <Ionicons name={currentSlide.icon} size={56} color={currentSlide.accent} />
        </View>

        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.description}>{currentSlide.description}</Text>

        <View style={styles.dotsRow}>
          {SLIDES.map((slide, index) => (
            <View
              key={slide.title}
              style={[
                styles.dot,
                index === stepIndex ? styles.activeDot : null,
              ]}
            />
          ))}
        </View>
      </View>

      <PrimaryButton
        title={isLastSlide ? 'Get Started' : 'Next'}
        onPress={handleContinue}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandSmall: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  centerContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h2,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
  },
  activeDot: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
});
