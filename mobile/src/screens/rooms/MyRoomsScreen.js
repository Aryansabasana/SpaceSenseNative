/**
 * My Rooms Screen
 * Lists all room projects for the authenticated user with search, room-type filters,
 * pull-to-refresh, and pagination.
 */
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import EmptyState from '../../components/EmptyState';
import PrimaryButton from '../../components/PrimaryButton';
import RoomCard from '../../components/RoomCard';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { fetchRooms } from '../../services/roomService';
import { ROOM_TYPES } from '../../utils/units';

const FILTER_OPTIONS = ['All', ...ROOM_TYPES];

export default function MyRoomsScreen({ navigation }) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [selectedType, setSelectedType] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadRooms = useCallback(
    async ({ targetPage = 1, append = false, type = selectedType, search = searchText } = {}) => {
      try {
        setErrorMessage('');
        const data = await fetchRooms({
          page: targetPage,
          limit: 10,
          roomType: type,
          search,
        });

        setRooms((prev) => (append ? [...prev, ...data.rooms] : data.rooms));
        setPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
      } catch (error) {
        setErrorMessage(error.message || 'Unable to load rooms.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [selectedType, searchText]
  );

  useFocusEffect(
    useCallback(() => {
      loadRooms({ targetPage: 1, append: false });
    }, [loadRooms])
  );

  function handleSelectType(type) {
    setSelectedType(type);
    setIsLoading(true);
    loadRooms({ targetPage: 1, append: false, type, search: searchText });
  }

  function handleSearchSubmit() {
    setIsLoading(true);
    loadRooms({ targetPage: 1, append: false, type: selectedType, search: searchText });
  }

  function handleRefresh() {
    setIsRefreshing(true);
    loadRooms({ targetPage: 1, append: false });
  }

  function handleLoadMore() {
    if (isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);
    loadRooms({ targetPage: page + 1, append: true });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScreenHeader
          title="My Rooms"
          subtitle="Manage your scanned & manual room projects"
          rightAction={
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('CreateRoom')}
            >
              <Ionicons name="add" size={20} color={COLORS.surface} />
              <Text style={styles.addBtnText}>New</Text>
            </TouchableOpacity>
          }
        />

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearchSubmit}
            placeholder="Search rooms by name..."
            placeholderTextColor={COLORS.textSecondary}
            returnKeyType="search"
          />
          {searchText ? (
            <TouchableOpacity
              onPress={() => {
                setSearchText('');
                setIsLoading(true);
                loadRooms({ targetPage: 1, append: false, type: selectedType, search: '' });
              }}
            >
              <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {FILTER_OPTIONS.map((type) => {
            const active = selectedType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => handleSelectType(type)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={rooms}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RoomCard
                room={item}
                unit={user?.measurementUnit || 'meters'}
                onPress={() => navigation.navigate('RoomDetails', { roomId: item.id })}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <EmptyState
                icon="cube-outline"
                title="No room projects found"
                message={
                  selectedType === 'All' && !searchText
                    ? 'Create your first room project to start organizing measurements and designs.'
                    : 'No rooms match your current search or filter.'
                }
                actionTitle="Create Room Project"
                onAction={() => navigation.navigate('CreateRoom')}
              />
            }
            ListFooterComponent={
              page < totalPages ? (
                <PrimaryButton
                  title={isLoadingMore ? 'Loading...' : 'Load More'}
                  variant="outline"
                  onPress={handleLoadMore}
                  loading={isLoadingMore}
                  style={styles.loadMoreBtn}
                />
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  addBtnText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMain,
  },
  filterScroll: {
    maxHeight: 42,
    marginBottom: SPACING.md,
  },
  filterContent: {
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  loadMoreBtn: {
    marginTop: SPACING.sm,
  },
});
