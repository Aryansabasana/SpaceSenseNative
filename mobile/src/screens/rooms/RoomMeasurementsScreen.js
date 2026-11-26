/**
 * Room Measurements / Manual Room Builder Screen
 * Allows users to enter room dimensions, add doors and windows along walls,
 * validate geometry constraints, preview a live 2D floor plan, and save in meters.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FloorPlan2D from '../../components/FloorPlan2D';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { fetchRoomById, saveRoomMeasurements } from '../../services/roomService';
import {
  inputToMeters,
  metersToInputString,
  validateAndBuildRoomGeometry,
  WALL_OPTIONS,
} from '../../utils/roomGeometry';
import { formatLength } from '../../utils/units';

export default function RoomMeasurementsScreen({ navigation, route }) {
  const { roomId } = route.params;
  const { user } = useAuth();
  const { width: screenWidth } = useWindowDimensions();

  const [inputUnit, setInputUnit] = useState(user?.measurementUnit || 'meters');
  const [roomName, setRoomName] = useState('Room');

  const [lengthInput, setLengthInput] = useState('');
  const [widthInput, setWidthInput] = useState('');
  const [heightInput, setHeightInput] = useState('2.8');

  // Stored internally in meters
  const [openings, setOpenings] = useState([]);

  // Opening draft fields (entered in current inputUnit)
  const [draftType, setDraftType] = useState('door');
  const [draftWallId, setDraftWallId] = useState('north');
  const [draftWidth, setDraftWidth] = useState('0.9');
  const [draftHeight, setDraftHeight] = useState('2.1');
  const [draftOffset, setDraftOffset] = useState('0.5');
  const [draftSill, setDraftSill] = useState('0.9');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadExisting() {
      try {
        const data = await fetchRoomById(roomId);
        const room = data.room;
        setRoomName(room.roomName);

        const initialUnit = user?.measurementUnit || 'meters';
        if (room.dimensions?.length) {
          setLengthInput(metersToInputString(room.dimensions.length, initialUnit));
        }
        if (room.dimensions?.width) {
          setWidthInput(metersToInputString(room.dimensions.width, initialUnit));
        }
        if (room.dimensions?.height) {
          setHeightInput(metersToInputString(room.dimensions.height, initialUnit));
        } else {
          setHeightInput(initialUnit === 'feet' ? '9.2' : '2.8');
        }

        if (Array.isArray(room.geometry?.openings)) {
          setOpenings(room.geometry.openings);
        }
      } catch (error) {
        setErrorMessage(error.message || 'Unable to load room measurements.');
      }
    }

    loadExisting();
  }, [roomId, user?.measurementUnit]);

  function handleSwitchInputUnit(nextUnit) {
    if (nextUnit === inputUnit) return;

    const lMeters = inputToMeters(lengthInput, inputUnit);
    const wMeters = inputToMeters(widthInput, inputUnit);
    const hMeters = inputToMeters(heightInput, inputUnit);

    const dwMeters = inputToMeters(draftWidth, inputUnit);
    const dhMeters = inputToMeters(draftHeight, inputUnit);
    const doMeters = inputToMeters(draftOffset, inputUnit);
    const dsMeters = inputToMeters(draftSill, inputUnit);

    if (Number.isFinite(lMeters)) setLengthInput(metersToInputString(lMeters, nextUnit));
    if (Number.isFinite(wMeters)) setWidthInput(metersToInputString(wMeters, nextUnit));
    if (Number.isFinite(hMeters)) setHeightInput(metersToInputString(hMeters, nextUnit));

    if (Number.isFinite(dwMeters)) setDraftWidth(metersToInputString(dwMeters, nextUnit));
    if (Number.isFinite(dhMeters)) setDraftHeight(metersToInputString(dhMeters, nextUnit));
    if (Number.isFinite(doMeters)) setDraftOffset(metersToInputString(doMeters, nextUnit));
    if (Number.isFinite(dsMeters)) setDraftSill(metersToInputString(dsMeters, nextUnit));

    setInputUnit(nextUnit);
  }

  function handleSelectDraftType(type) {
    setDraftType(type);
    if (type === 'door') {
      setDraftWidth(inputUnit === 'feet' ? '3.0' : '0.9');
      setDraftHeight(inputUnit === 'feet' ? '6.9' : '2.1');
    } else {
      setDraftWidth(inputUnit === 'feet' ? '4.0' : '1.2');
      setDraftHeight(inputUnit === 'feet' ? '4.0' : '1.2');
      setDraftSill(inputUnit === 'feet' ? '3.0' : '0.9');
    }
  }

  const lengthMeters = inputToMeters(lengthInput, inputUnit);
  const widthMeters = inputToMeters(widthInput, inputUnit);
  const heightMeters = inputToMeters(heightInput, inputUnit);

  const liveValidation = useMemo(() => {
    if (!lengthInput || !widthInput || !heightInput) {
      return null;
    }
    return validateAndBuildRoomGeometry({
      length: lengthMeters,
      width: widthMeters,
      height: heightMeters,
      openings,
    });
  }, [lengthInput, widthInput, heightInput, lengthMeters, widthMeters, heightMeters, openings]);

  function handleAddOpening() {
    setErrorMessage('');
    const baseCheck = validateAndBuildRoomGeometry({
      length: lengthMeters,
      width: widthMeters,
      height: heightMeters,
      openings,
    });

    if (!baseCheck.valid) {
      setErrorMessage('Enter valid room length, width, and ceiling height first.');
      return;
    }

    const candidate = {
      id: `${draftType}-${Date.now()}`,
      type: draftType,
      wallId: draftWallId,
      width: inputToMeters(draftWidth, inputUnit),
      height: inputToMeters(draftHeight, inputUnit),
      offsetFromStart: inputToMeters(draftOffset, inputUnit),
      sillHeight: draftType === 'door' ? 0 : inputToMeters(draftSill, inputUnit),
    };

    const nextOpenings = [...openings, candidate];
    const checkWithOpening = validateAndBuildRoomGeometry({
      length: lengthMeters,
      width: widthMeters,
      height: heightMeters,
      openings: nextOpenings,
    });

    if (!checkWithOpening.valid) {
      setErrorMessage(checkWithOpening.errors[0]);
      return;
    }

    setOpenings(checkWithOpening.geometry.openings);
  }

  function handleRemoveOpening(id) {
    setOpenings((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSave() {
    setErrorMessage('');

    const validation = validateAndBuildRoomGeometry({
      length: lengthMeters,
      width: widthMeters,
      height: heightMeters,
      openings,
    });

    if (!validation.valid) {
      setErrorMessage(validation.errors[0]);
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveRoomMeasurements(roomId, {
        length: validation.dimensions.length,
        width: validation.dimensions.width,
        height: validation.dimensions.height,
        openings: validation.geometry.openings,
      });

      navigation.replace('FloorPlan', {
        roomId: result.room.id,
        room: result.room,
      });
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save room measurements.');
    } finally {
      setIsSaving(false);
    }
  }

  const unitLabel = inputUnit === 'feet' ? 'ft' : 'm';

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
            title="Manual Room Builder"
            subtitle={roomName}
            onBack={() => navigation.goBack()}
          />

          <View style={styles.sourceBanner}>
            <Ionicons name="create-outline" size={16} color={COLORS.primary} />
            <Text style={styles.sourceText}>
              Manual Measurement Mode (User-Measured). Stored internally in meters.
            </Text>
          </View>

          <View style={styles.unitSwitchRow}>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                inputUnit === 'meters' && styles.unitBtnActive,
              ]}
              onPress={() => handleSwitchInputUnit('meters')}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  inputUnit === 'meters' && styles.unitBtnTextActive,
                ]}
              >
                Meters (m)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.unitBtn,
                inputUnit === 'feet' && styles.unitBtnActive,
              ]}
              onPress={() => handleSwitchInputUnit('feet')}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  inputUnit === 'feet' && styles.unitBtnTextActive,
                ]}
              >
                Feet (ft)
              </Text>
            </TouchableOpacity>
          </View>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>1. Room Dimensions ({unitLabel})</Text>

            <View style={styles.rowTwo}>
              <View style={styles.halfCol}>
                <FormInput
                  label={`Length (${unitLabel})`}
                  value={lengthInput}
                  onChangeText={setLengthInput}
                  placeholder={inputUnit === 'feet' ? '14.0' : '4.2'}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.halfCol}>
                <FormInput
                  label={`Width (${unitLabel})`}
                  value={widthInput}
                  onChangeText={setWidthInput}
                  placeholder={inputUnit === 'feet' ? '11.5' : '3.5'}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <FormInput
              label={`Ceiling Height (${unitLabel})`}
              value={heightInput}
              onChangeText={setHeightInput}
              placeholder={inputUnit === 'feet' ? '9.2' : '2.8'}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>2. Doors & Windows (Optional)</Text>

            <View style={styles.typeRow}>
              {['door', 'window'].map((type) => {
                const selected = draftType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeTab, selected && styles.typeTabActive]}
                    onPress={() => handleSelectDraftType(type)}
                  >
                    <Text
                      style={[
                        styles.typeTabText,
                        selected && styles.typeTabTextActive,
                      ]}
                    >
                      {type === 'door' ? 'Door' : 'Window'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Wall Placement</Text>
            <View style={styles.wallGrid}>
              {WALL_OPTIONS.map((w) => {
                const selected = draftWallId === w.id;
                return (
                  <TouchableOpacity
                    key={w.id}
                    style={[styles.wallChip, selected && styles.wallChipActive]}
                    onPress={() => setDraftWallId(w.id)}
                  >
                    <Text
                      style={[
                        styles.wallChipText,
                        selected && styles.wallChipTextActive,
                      ]}
                    >
                      {w.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.rowTwo}>
              <View style={styles.halfCol}>
                <FormInput
                  label={`Width (${unitLabel})`}
                  value={draftWidth}
                  onChangeText={setDraftWidth}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.halfCol}>
                <FormInput
                  label={`Height (${unitLabel})`}
                  value={draftHeight}
                  onChangeText={setDraftHeight}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.rowTwo}>
              <View style={styles.halfCol}>
                <FormInput
                  label={`Distance from Start (${unitLabel})`}
                  value={draftOffset}
                  onChangeText={setDraftOffset}
                  keyboardType="decimal-pad"
                />
              </View>
              {draftType === 'window' ? (
                <View style={styles.halfCol}>
                  <FormInput
                    label={`Sill Height (${unitLabel})`}
                    value={draftSill}
                    onChangeText={setDraftSill}
                    keyboardType="decimal-pad"
                  />
                </View>
              ) : null}
            </View>

            <PrimaryButton
              title={`Add ${draftType === 'door' ? 'Door' : 'Window'}`}
              variant="outline"
              onPress={handleAddOpening}
            />

            {openings.length > 0 ? (
              <View style={styles.openingList}>
                {openings.map((op) => (
                  <View key={op.id} style={styles.openingItem}>
                    <View style={styles.openingInfo}>
                      <Text style={styles.openingTitle}>
                        {op.type === 'door' ? 'Door' : 'Window'} • {op.wallId.toUpperCase()} Wall
                      </Text>
                      <Text style={styles.openingMeta}>
                        W: {formatLength(op.width, inputUnit)} • H: {formatLength(op.height, inputUnit)} • Offset: {formatLength(op.offsetFromStart, inputUnit)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveOpening(op.id)}>
                      <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {liveValidation?.valid ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>3. Live 2D Floor Plan Preview</Text>
              <FloorPlan2D
                geometry={liveValidation.geometry}
                dimensions={liveValidation.dimensions}
                unit={inputUnit}
                canvasWidth={Math.max(240, screenWidth - 82)}
                canvasHeight={240}
              />
            </View>
          ) : liveValidation && !liveValidation.valid ? (
            <View style={styles.warnBanner}>
              <Text style={styles.warnText}>{liveValidation.errors[0]}</Text>
            </View>
          ) : null}

          <PrimaryButton
            title="Save & Generate 2D Floor Plan"
            onPress={handleSave}
            loading={isSaving}
          />
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
    paddingBottom: SPACING.xl,
  },
  sourceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primarySoft,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  sourceText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  unitSwitchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md,
  },
  unitBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unitBtnActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  unitBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  unitBtnTextActive: {
    color: COLORS.primary,
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
  warnBanner: {
    backgroundColor: COLORS.warningSoft,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  warnText: {
    color: COLORS.textMain,
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
  rowTwo: {
    flexDirection: 'row',
    gap: 10,
  },
  halfCol: {
    flex: 1,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md,
  },
  typeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeTabActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  typeTabTextActive: {
    color: COLORS.primary,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMain,
    marginBottom: 8,
  },
  wallGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  wallChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wallChipActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  wallChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  wallChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  openingList: {
    marginTop: SPACING.md,
    gap: 8,
  },
  openingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  openingInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  openingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  openingMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
