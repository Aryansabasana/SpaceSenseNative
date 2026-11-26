/**
 * Measurement & Room Display Utilities
 * Backend stores all dimensions in meters; these helpers convert for display.
 */
import { COLORS } from '../constants/theme';

const METERS_TO_FEET = 3.28084;
const SQ_METERS_TO_SQ_FEET = 10.7639;

export const ROOM_TYPES = [
  'Bedroom',
  'Living Room',
  'Kitchen',
  'Home Office',
  'Dining Room',
  'Bathroom',
  'Studio',
  'Other',
];

export function formatLength(meters, unit = 'meters') {
  if (typeof meters !== 'number' || Number.isNaN(meters)) {
    return '—';
  }
  if (unit === 'feet') {
    return `${(meters * METERS_TO_FEET).toFixed(2)} ft`;
  }
  return `${meters.toFixed(2)} m`;
}

export function formatArea(sqMeters, unit = 'meters') {
  if (typeof sqMeters !== 'number' || Number.isNaN(sqMeters)) {
    return 'Not measured';
  }
  if (unit === 'feet') {
    return `${(sqMeters * SQ_METERS_TO_SQ_FEET).toFixed(1)} sq ft`;
  }
  return `${sqMeters.toFixed(1)} m²`;
}

export function formatShortDate(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getRoomTypeIcon(roomType) {
  switch (roomType) {
    case 'Bedroom':
      return 'bed-outline';
    case 'Living Room':
      return 'tv-outline';
    case 'Kitchen':
      return 'restaurant-outline';
    case 'Home Office':
      return 'desktop-outline';
    case 'Dining Room':
      return 'cafe-outline';
    case 'Bathroom':
      return 'water-outline';
    case 'Studio':
      return 'cube-outline';
    default:
      return 'home-outline';
  }
}

export function getScanStatusMeta(scanStatus) {
  switch (scanStatus) {
    case 'scanned':
      return {
        label: 'AR Scanned',
        color: COLORS.accent,
        bgColor: COLORS.accentSoft,
      };
    case 'manual_ready':
      return {
        label: 'Manual Layout',
        color: COLORS.primary,
        bgColor: COLORS.primarySoft,
      };
    case 'pending':
      return {
        label: 'Processing',
        color: COLORS.warning,
        bgColor: COLORS.warningSoft,
      };
    default:
      return {
        label: 'Draft',
        color: COLORS.textSecondary,
        bgColor: COLORS.background,
      };
  }
}
