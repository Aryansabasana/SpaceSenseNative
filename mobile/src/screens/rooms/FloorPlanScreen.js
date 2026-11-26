/**
 * 2D Floor Plan Screen
 * Renders the interactive 2D architectural floor plan with zoom, grid/label toggles,
 * measurement source labeling, and room summary metrics.
 */
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../../components/EmptyState';
import FloorPlan2D from '../../components/FloorPlan2D';
import PrimaryButton from '../../components/PrimaryButton';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { fetchRoomById } from '../../services/roomService';
import { formatArea, formatLength } from '../../utils/units';

export default function FloorPlanScreen({ navigation, route }) {
  const { roomId, room: initialRoom = null } = route.params;
  const { user } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const unit = user?.measurementUnit || 'meters';

  const [room, setRoom] = useState(initialRoom);
  const [isLoading, setIsLoading] = useState(!initialRoom);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  const loadRoom = useCallback(async () => {
    try {
      const data = await fetchRoomById(roomId);
      setRoom(data.room);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useFocusEffect(
    useCallback(() => {
      loadRoom();
    }, [loadRoom])
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const hasGeometry = (room?.geometry?.floorPolygon?.length || 0) >= 3;
  const sourceLabel =
    room?.measurementSource === 'manual'
      ? 'MANUAL ENTRY (USER-MEASURED)'
      : room?.measurementSource === 'sensor'
      ? 'AR SENSOR DERIVED'
      : 'UNMEASURED';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title="2D Floor Plan"
          subtitle={room?.roomName || 'Room Blueprint'}
          onBack={() => navigation.goBack()}
        />

        {!hasGeometry ? (
          <EmptyState
            icon="map-outline"
            title="No floor plan geometry yet"
            message="Enter room dimensions manually to generate a scaled 2D floor plan."
            actionTitle="Open Manual Room Builder"
            onAction={() => navigation.replace('RoomMeasurements', { roomId })}
          />
        ) : (
          <>
            <View style={styles.sourceRow}>
              <View style={styles.sourceBadge}>
                <Text style={styles.sourceBadgeText}>{sourceLabel}</Text>
              </View>
              <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
            </View>

            <FloorPlan2D
              geometry={room.geometry}
              dimensions={room.dimensions}
              unit={unit}
              canvasWidth={Math.max(260, screenWidth - 48)}
              canvasHeight={320}
              zoom={zoom}
              showGrid={showGrid}
              showLabels={showLabels}
            />

            <View style={styles.toolbar}>
              <TouchableOpacity
                style={styles.toolBtn}
                onPress={() => setZoom((z) => Math.max(0.6, Number((z - 0.2).toFixed(2))))}
              >
                <Ionicons name="remove-outline" size={18} color={COLORS.textMain} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.toolBtn} onPress={() => setZoom(1)}>
                <Text style={styles.toolText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolBtn}
                onPress={() => setZoom((z) => Math.min(1.8, Number((z + 0.2).toFixed(2))))}
              >
                <Ionicons name="add-outline" size={18} color={COLORS.textMain} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toolBtn, showGrid && styles.toolBtnActive]}
                onPress={() => setShowGrid((prev) => !prev)}
              >
                <Text style={[styles.toolText, showGrid && styles.toolTextActive]}>
                  Grid
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toolBtn, showLabels && styles.toolBtnActive]}
                onPress={() => setShowLabels((prev) => !prev)}
              >
                <Text style={[styles.toolText, showLabels && styles.toolTextActive]}>
                  Labels
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.legendCard}>
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: COLORS.textMain }]} />
                <Text style={styles.legendLabel}>Walls</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.legendLabel}>Door & Swing</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: COLORS.accent }]} />
                <Text style={styles.legendLabel}>Window</Text>
              </View>
            </View>

            <View style={styles.metricsCard}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Floor Area</Text>
                <Text style={styles.metricValue}>
                  {formatArea(room.dimensions?.floorArea, unit)}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Dimensions (L × W × H)</Text>
                <Text style={styles.metricValue}>
                  {formatLength(room.dimensions?.length, unit)} ×{' '}
                  {formatLength(room.dimensions?.width, unit)} ×{' '}
                  {formatLength(room.dimensions?.height, unit)}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Doors & Windows</Text>
                <Text style={styles.metricValue}>
                  {room.geometry?.openings?.length || 0} openings
                </Text>
              </View>
            </View>

            <PrimaryButton
              title="Edit Room Measurements"
              variant="outline"
              onPress={() => navigation.navigate('RoomMeasurements', { roomId })}
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
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sourceBadge: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  zoomText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toolbar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  toolBtn: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toolBtnActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  toolText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  toolTextActive: {
    color: COLORS.primary,
  },
  legendCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLine: {
    width: 16,
    height: 4,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  metricsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  metricLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMain,
  },
});
