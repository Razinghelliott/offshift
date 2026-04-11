import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import BookingCard from '../components/BookingCard';
import { colors, spacing, radius, typography, shadows } from '../config/theme';

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
];

const ClientBookingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const unsubscribeRef = React.useRef(null);

  useEffect(() => {
    if (user?.uid) {
      subscribeToBookings();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user?.uid]);

  useEffect(() => {
    applyFilter();
  }, [bookings, activeFilter]);

  const subscribeToBookings = () => {
    setLoading(true);

    const q = query(
      collection(db, 'bookings'),
      where('clientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    unsubscribeRef.current = onSnapshot(
      q,
      (querySnapshot) => {
        const bookingsData = [];
        querySnapshot.forEach((doc) => {
          bookingsData.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setBookings(bookingsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching bookings:', error);
        setLoading(false);
      }
    );
  };

  const applyFilter = () => {
    if (activeFilter === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter((b) => b.status === activeFilter));
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // The onSnapshot listener will update automatically
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleMessagePress = useCallback((bookingId, proId) => {
    navigation.navigate('Messages', {
      bookingId,
      userId: proId,
    });
  }, [navigation]);

  const renderBookingCard = ({ item }) => (
    <BookingCard
      booking={item}
      currentUserId={user.uid}
      onMessage={() => handleMessagePress(item.id, item.proId)}
      onAction={null}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color={colors.grayDark} />
      <Text style={styles.emptyTitle}>No Bookings Yet</Text>
      <Text style={styles.emptyMessage}>
        {activeFilter === 'all'
          ? 'Start by booking a professional service'
          : `No ${activeFilter} bookings`}
      </Text>
    </View>
  );

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <FlatList
        data={STATUS_FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.value}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === item.value && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(item.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === item.value && styles.filterTabTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        scrollEnabled={true}
        contentContainerStyle={styles.filterContent}
      />
    </View>
  );

  if (loading && bookings.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <TouchableOpacity
            onPress={() => navigation.openDrawer?.()}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={28} color={colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={colors.red} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity
          onPress={() => navigation.openDrawer?.()}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={28} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      {renderFilterTabs()}

      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.red}
            colors={[colors.red]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkBorder,
    marginTop: Platform.OS === 'ios' ? 12 : 0,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.white,
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: colors.black,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkBorder,
    paddingVertical: spacing.sm,
  },
  filterContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.darkCard,
    borderWidth: 1,
    borderColor: colors.darkBorder,
  },
  filterTabActive: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  filterTabText: {
    ...typography.buttonSmall,
    color: colors.grayLight,
  },
  filterTabTextActive: {
    color: colors.white,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.h5,
    color: colors.white,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptyMessage: {
    ...typography.body,
    color: colors.grayLight,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});

export default ClientBookingsScreen;
