/**
 * Room Details Screen
 * Displays room metadata, measurement status, inline editing, and deletion.
 */
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import {
  deleteRoom,
  fetchRoomById,
  updateRoom,
} from '../../services/roomService';
import {
  formatArea,
  formatLength,
  formatShortDate,
  getRoomTypeIcon,
  getScanStatusMeta,
  ROOM_TYPES,
} from '../../utils/units';

export default function RoomDetailsScreen({ navigation, route }) {
  const { roomId } = route.params;
  const { user } = useAuth();
  const unit = user?.measurementUnit || 'meters';

  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('Bedroom');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadRoom = useCallback(async () => {
    try {
      setErrorMessage('');
      const data = await fetchRoomById(roomId);
      setRoom(data.room);
      setEditName(data.room.roomName);
      setEditType(data.room.roomType);
      setEditNotes(data.room.notes || '');
    } catch (error) {
      setErrorMessage(error.message || 'Unable to load room details.');
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useFocusEffect(
    useCallback(() => {
      loadRoom();
    }, [loadRoom])
  );

  async function handleSaveEdit() {
    setErrorMessage('');
    if (editName.trim().length < 2) {
      setErrorMessage('Room name must be at least 2 characters.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateRoom(roomId, {
        roomName: editName.trim(),
        roomType: editType,
        notes: editNotes.trim(),
      });
      setRoom(result.room);
      setIsEditing(false);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to update room.');
    } finally {
      setIsSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete Room Project',
      `Are you sure you want to permanently delete "${room?.roomName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: handleDelete,
        },
      ]
    );
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteRoom(roomId);
      navigation.goBack();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to delete room.');
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!room) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ScreenHeader title="Room Details" onBack={() => navigation.goBack()} />
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage || 'Room not found.'}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const statusMeta = getScanStatusMeta(room.scanStatus);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title={room.roomName}
          subtitle={room.roomType}
          onBack={() => navigation.goBack()}
          rightAction={
            <TouchableOpacity
              style={styles.editToggle}
              onPress={() => setIsEditing((prev) => !prev)}
            >
              <Ionicons
                name={isEditing ? 'close-outline' : 'create-outline'}
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.editToggleText}>
                {isEditing ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          }
        />

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {isEditing ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Edit Room Details</Text>
            <FormInput
              label="Room Name"
              value={editName}
              onChangeText={setEditName}
              placeholder="Room name"
              icon="home-outline"
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>Room Category</Text>
            <View style={styles.typeGrid}>
              {ROOM_TYPES.map((type) => {
                const selected = editType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeChip, selected && styles.typeChipSelected]}
                    onPress={() => setEditType(type)}
                  >
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

            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Room notes..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <PrimaryButton
              title="Save Changes"
              onPress={handleSaveEdit}
              loading={isSaving}
            />
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.summaryHeader}>
                <View style={styles.iconBox}>
                  <Ionicons
                    name={getRoomTypeIcon(room.roomType)}
                    size={26}
                    color={COLORS.primary}
                  />
                </View>
                <View style={[styles.badge, { backgroundColor: statusMeta.bgColor }]}>
                  <Text style={[styles.badgeText, { color: statusMeta.color }]}>
                    {statusMeta.label}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Measurement Source</Text>
                <Text style={styles.infoValue}>
                  {room.measurementSource === 'manual'
                    ? 'Manual (User-Measured)'
                    : room.measurementSource === 'sensor'
                    ? 'AR Sensor'
                    : 'Not measured'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sensor Confidence</Text>
                <Text style={styles.infoValue}>
                  {room.measurementSource === 'manual'
                    ? 'N/A (Manual)'
                    : room.measurementConfidence > 0
                    ? `${Math.round(room.measurementConfidence * 100)}%`
                    : 'Not measured'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Doors & Windows</Text>
                <Text style={styles.infoValue}>
                  {room.geometry?.openings?.length || 0} openings
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>{formatShortDate(room.createdAt)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Updated</Text>
                <Text style={styles.infoValue}>{formatShortDate(room.updatedAt)}</Text>
              </View>

              {room.notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.fieldLabel}>Project Notes</Text>
                  <Text style={styles.notesBody}>{room.notes}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Spatial Dimensions</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricTile}>
                  <Text style={styles.metricLabel}>Length</Text>
                  <Text style={styles.metricValue}>
                    {formatLength(room.dimensions?.length, unit)}
                  </Text>
                </View>
                <View style={styles.metricTile}>
                  <Text style={styles.metricLabel}>Width</Text>
                  <Text style={styles.metricValue}>
                    {formatLength(room.dimensions?.width, unit)}
                  </Text>
                </View>
                <View style={styles.metricTile}>
                  <Text style={styles.metricLabel}>Ceiling</Text>
                  <Text style={styles.metricValue}>
                    {formatLength(room.dimensions?.height, unit)}
                  </Text>
                </View>
                <View style={styles.metricTile}>
                  <Text style={styles.metricLabel}>Floor Area</Text>
                  <Text style={styles.metricValue}>
                    {formatArea(room.dimensions?.floorArea, unit)}
                  </Text>
                </View>
              </View>

              <PrimaryButton
                title={
                  (room.geometry?.floorPolygon?.length || 0) >= 3
                    ? 'Edit Manual Measurements'
                    : 'Measure Room Manually'
                }
                onPress={() =>
                  navigation.navigate('RoomMeasurements', { roomId: room.id })
                }
                style={styles.actionGap}
              />

              {(room.geometry?.floorPolygon?.length || 0) >= 3 ? (
                <PrimaryButton
                  title="View 2D Floor Plan"
                  variant="outline"
                  onPress={() =>
                    navigation.navigate('FloorPlan', { roomId: room.id, room })
                  }
                />
              ) : null}
            </View>

            <PrimaryButton
              title="Delete Room Project"
              variant="danger"
              onPress={confirmDelete}
              loading={isDeleting}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  editToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primarySoft,
  },
  editToggleText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
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
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  notesBox: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMain,
    marginBottom: 6,
  },
  notesBody: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: SPACING.md,
  },
  metricTile: {
    width: '48%',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  actionGap: {
    marginBottom: SPACING.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
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
    marginBottom: SPACING.md,
  },
});
