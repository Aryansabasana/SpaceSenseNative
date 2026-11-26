/**
 * Forgot Password Screen
 * Supports requesting a 6-digit reset code and resetting the password.
 * In development mode (when no email service is connected), displays the generated dev code clearly.
 */
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import { requestPasswordReset, resetPasswordWithCode } from '../../services/authService';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState('request'); // 'request' | 'reset'
  const [statusMessage, setStatusMessage] = useState('');
  const [devCode, setDevCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRequestCode() {
    setErrorMessage('');
    setStatusMessage('');

    if (!email.trim().includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestPasswordReset(email.trim());
      setStatusMessage(result.message);
      if (result.devResetCode) {
        setDevCode(result.devResetCode);
      }
      setStep('reset');
    } catch (error) {
      setErrorMessage(error.message || 'Unable to process reset request.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword() {
    setErrorMessage('');

    if (!code.trim() || newPassword.length < 6) {
      setErrorMessage('Enter the 6-digit code and a new password (min 6 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resetPasswordWithCode({
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });
      setStatusMessage(result.message);
      navigation.navigate('Login');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              {step === 'request'
                ? 'Enter your account email to generate a reset code.'
                : 'Enter the 6-digit reset code and choose a new password.'}
            </Text>
          </View>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {statusMessage ? (
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>{statusMessage}</Text>
              {devCode ? (
                <Text style={styles.devCodeText}>
                  Dev mode reset code (no SMTP configured): {devCode}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.card}>
            <FormInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              icon="mail-outline"
              keyboardType="email-address"
            />

            {step === 'reset' ? (
              <>
                <FormInput
                  label="6-Digit Reset Code"
                  value={code}
                  onChangeText={setCode}
                  placeholder="123456"
                  icon="key-outline"
                  keyboardType="number-pad"
                />

                <FormInput
                  label="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Minimum 6 characters"
                  icon="lock-closed-outline"
                  secureTextEntry
                />
              </>
            ) : null}

            <PrimaryButton
              title={step === 'request' ? 'Generate Reset Code' : 'Update Password'}
              onPress={step === 'request' ? handleRequestCode : handleResetPassword}
              loading={isSubmitting}
            />
          </View>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.linkText}>Back to Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h1,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
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
  infoBanner: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  infoBannerText: {
    color: COLORS.textMain,
    fontSize: 13,
  },
  devCodeText: {
    marginTop: 6,
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backLink: {
    alignSelf: 'center',
    marginTop: SPACING.lg,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
