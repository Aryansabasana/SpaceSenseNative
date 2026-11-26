/**
 * Create New Room Screen
 * Creates a room project in MongoDB and opens RoomDetails.
 */
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { createRoom } from '../../services/roomService';
import { getRoomTypeIcon, ROOM_TYPES } from '../../utils/units';

export default function CreateRoomScreen({ navigation }) {
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState('Bedroom');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate() {
    setErrorMessage('');

    if (roomName.trim().length < 2) {
      setErrorMessage('Room name must be at least 2 characters.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await createRoom({
        roomName: roomName.trim(),
        roomType,
        notes: notes.trim(),
      });
      navigation.replace('RoomDetails', { roomId: result.room.id });
    } catch (error) {
      setErrorMessage(error.message || 'Could not create room project.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader
            title="New Room Project"
            subtitle="Set up a room before scanning or measuring"
            onBack={() => navigation.goBack()}
          />

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <FormInput
              label="Room Name"
              value={roomName}
              onChangeText={setRoomName}
              placeholder="e.g., Master Bedroom"
              icon="home-outline"
              autoCapitalize="words"
            />

            <Text style={styles.sectionLabel}>Room Category</Text>
            <View style={styles.typeGrid}>
              {ROOM_TYPES.map((type) => {
                const selected = roomType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeChip, selected && styles.typeChipSelected]}
                    onPress={() => setRoomType(type)}
                  >
                    <Ionicons
                      name={getRoomTypeIcon(type)}
                      size={15}
                      color={selected ? COLORS.primary : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        selected && styles.typeTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Goal, lighting notes, or constraints..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <PrimaryButton
              title="Create Room Project"
              onPress={handleCreate}
              loading={isSaving}
            />
          </View>
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
  content: {
    padding: SPACING.lg,
  },
  errorBanner: {
    backgroundColor: COLORS.errorSoft,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
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
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeChipSelected: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  typeText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  typeTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 14,
    color: COLORS.textMain,
    minHeight: 84,
    marginBottom: SPACING.lg,
  },
});
