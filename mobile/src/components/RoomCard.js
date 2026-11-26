/**
 * Reusable Room Project Card Component
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import {
  formatArea,
  formatShortDate,
  getRoomTypeIcon,
  getScanStatusMeta,
} from '../utils/units';

export default function RoomCard({ room, unit = 'meters', onPress }) {
  const statusMeta = getScanStatusMeta(room.scanStatus);
  const iconName = getRoomTypeIcon(room.roomType);
  const floorArea = room.dimensions?.floorArea;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.topRow}>
        <View style={styles.iconBox}>
          <Ionicons name={iconName} size={22} color={COLORS.primary} />
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.roomName} numberOfLines={1}>
            {room.roomName}
          </Text>
          <Text style={styles.roomType}>{room.roomType}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusMeta.bgColor }]}>
          <Text style={[styles.statusText, { color: statusMeta.color }]}>
            {statusMeta.label}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="resize-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>{formatArea(floorArea, unit)}</Text>
        </View>

        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>
            Updated {formatShortDate(room.updatedAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  infoBlock: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  roomType: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
