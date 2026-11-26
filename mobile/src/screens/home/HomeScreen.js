/**
 * Home Dashboard Screen
 * Displays personalized greeting, room statistics, quick room creation,
 * recent room projects, and recent activity.
 */
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../../components/EmptyState';
import PrimaryButton from '../../components/PrimaryButton';
import RoomCard from '../../components/RoomCard';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { fetchRooms } from '../../services/roomService';
import { formatArea, formatShortDate } from '../../utils/units';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const unit = user?.measurementUnit || 'meters';

  const [recentRooms, setRecentRooms] = useState([]);
  const [stats, setStats] = useState({
    totalRooms: 0,
    measuredRooms: 0,
    totalAreaSqM: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setErrorMessage('');
      const data = await fetchRooms({ page: 1, limit: 3 });
      setRecentRooms(data.rooms);
      setStats(data.stats);
    } catch (error) {
      setErrorMessage(error.message || 'Could not load dashboard data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  function handleRefresh() {
    setIsRefreshing(true);
    loadDashboard();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Hello, {user?.name || 'Designer'}</Text>
            <Text style={styles.subtitle}>
              Understand Your Space. Reimagine Your World.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.avatarText}>
              {(user?.name || 'S').charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Start a Room Project</Text>
          <Text style={styles.heroBody}>
            Create a workspace for a room to organize dimensions, floor plans, and interior layouts.
          </Text>
          <PrimaryButton
            title="Create New Room"
            onPress={() => navigation.navigate('CreateRoom')}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalRooms}</Text>
            <Text style={styles.statLabel}>Rooms</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.measuredRooms}</Text>
            <Text style={styles.statLabel}>Measured</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {stats.totalAreaSqM > 0 ? formatArea(stats.totalAreaSqM, unit) : '0'}
            </Text>
            <Text style={styles.statLabel}>Total Area</Text>
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Room Projects</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Rooms')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={styles.loader}
          />
        ) : recentRooms.length === 0 ? (
          <EmptyState
            icon="home-outline"
            title="No rooms yet"
            message="Tap Create New Room above to set up your first room project."
          />
        ) : (
          recentRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              unit={unit}
              onPress={() => navigation.navigate('RoomDetails', { roomId: room.id })}
            />
          ))
        )}

        {recentRooms.length > 0 ? (
          <View style={styles.activityCard}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentRooms.map((room) => (
              <View key={`act-${room.id}`} style={styles.activityRow}>
                <Ionicons name="ellipse" size={8} color={COLORS.accent} />
                <Text style={styles.activityText} numberOfLines={1}>
                  Updated "{room.roomName}" ({room.roomType})
                </Text>
                <Text style={styles.activityDate}>
                  {formatShortDate(room.updatedAt)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
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
    paddingBottom: SPACING.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerText: {
    flex: 1,
    marginRight: SPACING.md,
  },
  greeting: {
    ...TYPOGRAPHY.h2,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  heroTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.xs,
  },
  heroBody: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  loader: {
    marginVertical: SPACING.lg,
  },
  activityCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.sm,
    gap: 10,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMain,
  },
  activityDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
