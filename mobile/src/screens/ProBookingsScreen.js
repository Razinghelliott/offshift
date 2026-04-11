import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, addDoc, FieldValue } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import BookingCard from '../components/BookingCard';
import { colors, spacing, radius, typography, shadows } from '../config/theme';

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Declined', value: 'declined' },
  { label: 'Completed', value: 'completed' },
];

const ProBookingsScreen = ({ navigation }) => {
  const { user, userProfile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actioningId, setActioningId] = useState(null);
  const [statusCounts, setStatusCounts] = useState({});
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
    calculateCounts();
  }, [bookings, activeFilter]);

  const subscribeToBookings = () => {
    setLoading(true);

    const q = query(
      collection(db, 'bookings'),
      where('proId', '==', user.uid),
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

  const calculateCounts = () => {
    const counts = {
      pending: 0,
      confirmed: 0,
      declined: 0,
      completed: 0,
    };

    bookings.forEach((booking) => {
      if (counts.hasOwnProperty(booking.status)) {
        counts[booking.status] += 1;
      }
    });

    setStatusCounts(counts);
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
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleMessagePress = useCallback((bookingId, clientId) => {
    navigation.navigate('Messages', {
      bookingId,
      userId: clientId,
    });
  }, [navigation]);

  const handleAcceptBooking = async (booking) => {
    setActioningId(booking.id);

    try {
      const bookingRef = doc(db, 'bookings', booking.id);

      // Update booking status
      await updateDoc(bookingRef, {
        status: 'confirmed',
        updatedAt: serverTimestamp(),
      });

      // Create notification for client
      await addDoc(collection(db, 'notifications'), {
        userId: booking.clientId,
        type: 'booking_confirmed',
        bookingId: booking.id,
        fromName: userProfile?.displayName || 'Professional',
        message: `Your booking request has been confirmed for ${booking.date} at ${booking.time}`,
        read: false,
        createdAt: serverTimestamp(),
      });

      // Clear unread notification for pro
      await updateDoc(bookingRef, {
        [`unreadBy.${user.uid}`]: FieldValue.arrayRemove ? FieldValue.arrayRemove(user.uid) : null,
      });

      Alert.alert('Success', 'Booking accepted');
    } catch (error) {
      console.error('Error accepting booking:', error);
      Alert.alert('Error', 'Failed to accept booking');
    } finally {
      setActioningId(null);
    }
  };

  const handleDeclineBooking = async (booking) => {
    Alert.alert(
      'Decline Booking',
      'Are you sure you want to decline this booking request?',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Decline',
          onPress: async () => {
            setActioningId(booking.id);

            try {
              const bookingRef = doc(db, 'bookings', booking.id);

              // Update booking status
              await updateDoc(bookingRef, {
                status: 'declined',
                updatedAt: serverTimestamp(),
              });

              // Create notification for client
              await addDoc(collection(db, 'notifications'), {
                userId: booking.clientId,
                type: 'booking_declined',
                bookingId: booking.id,
                fromName: userProfile?.displayName || 'Professional',
                message: `Your booking request for ${booking.date} at ${booking.time} has been declined`,
                read: false,
                createdAt: serverTimestamp(),
              });

              // Clear unread notification for pro
              await updateDoc(bookingRef, {
                [`unreadBy.${user.uid}`]: FieldValue.arrayRemove ? FieldValue.arrayRemove(user.uid) : null,
              });

              Alert.alert('Success', 'Booking declined');
            } catch (error) {
              console.error('Error declining booking:', error);
              Alert.alert('Error', 'Failed to decline booking');
            } finally {
              setActioningId(null);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderBookingCard = ({ item }) => (
    <BookingCardWithActions
      booking={item}
      currentUserId={user.uid}
      onMessage={() => handleMessagePress(item.id, item.clientId)}
      onAction={(action) => {
        if (action === 'accept') {
          handleAcceptBooking(item);
        } else if (action === 'decline') {
          handleDeclineBooking(item);
        }
      }}
      isActioning={actioningId === item.id}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color={colors.grayDark} />
      <Text style={styles.emptyTitle}>No Bookings Yet</Text>
      <Text style={styles.emptyMessage}>
        {activeFilter === 'all'
          ? 'No booking requests yet'
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
        renderItem={({ item }) => {
          const count =
            item.value === 'all'
              ? bookings.length
              : statusCounts[item.value] || 0;

          return (
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
                {count > 0 && ` (${count})`}
              </Text>
            </TouchableOpacity>
          );
        }}
        scrollEnabled={true}
        contentContainerStyle={styles.filterContent}
      />
    </View>
  );

  if (loading && bookings.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Booking Requests</Text>
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
        <Text style={styles.headerTitle}>Booking Requests</Text>
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

// Custom BookingCard with Pro-specific actions
const BookingCardWithActions = ({
  booking,
  currentUserId,
  onMessage,
  onAction,
  isActioning,
}) => {
  if (!booking) return null;

  const isCurrentUserPro = booking.proId === currentUserId;
  const isPending = booking.status === 'pending';
  const isProAndPending = isCurrentUserPro && isPending;

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.darkCard,
      borderRadius: radius.medium,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.darkBorder,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    userSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: spacing.md,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.white,
    },
    details: {
      marginBottom: spacing.md,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    detailText: {
      fontSize: 13,
      color: colors.grayLight,
    },
    statusBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
      backgroundColor: colors.dark,
      borderWidth: 1,
      borderColor: colors.darkBorder,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.grayLight,
      textTransform: 'capitalize',
    },
    statusTextPending: {
      color: colors.orange,
    },
    statusTextConfirmed: {
      color: colors.green,
    },
    statusTextDeclined: {
      color: colors.red,
    },
    priceSection: {
      marginBottom: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.darkBorder,
    },
    totalPrice: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.white,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    actionButton: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.small,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
    },
    messageButton: {
      backgroundColor: colors.grayDark,
      borderWidth: 1,
      borderColor: colors.darkBorder,
    },
    acceptButton: {
      backgroundColor: colors.green,
    },
    declineButton: {
      backgroundColor: colors.red,
    },
    actionButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.whitePure,
    },
    messageButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.grayLight,
    },
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return colors.orange;
      case 'confirmed':
        return colors.green;
      case 'declined':
        return colors.red;
      case 'completed':
        return colors.grayLight;
      default:
        return colors.grayLight;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.userSection}>
          <View>
            <Text style={styles.userName}>{booking.clientName || 'Client'}</Text>
          </View>
        </View>
        <View
          style={[styles.statusBadge, { borderColor: getStatusColor(booking.status) }]}
        >
          <Text
            style={[
              styles.statusText,
              booking.status === 'pending' && styles.statusTextPending,
              booking.status === 'confirmed' && styles.statusTextConfirmed,
              booking.status === 'declined' && styles.statusTextDeclined,
            ]}
          >
            {booking.status}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={14} color={colors.grayLight} />
          <Text style={styles.detailText}>{formatDate(booking.date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={14} color={colors.grayLight} />
          <Text style={styles.detailText}>
            {booking.time} ({booking.duration}h)
          </Text>
        </View>
        {booking.message && (
          <View style={styles.detailRow}>
            <Ionicons name="chatbubble" size={14} color={colors.grayLight} />
            <Text style={styles.detailText} numberOfLines={1}>
              {booking.message}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.priceSection}>
        <Text style={styles.totalPrice}>
          ${booking.estimatedTotal?.toFixed(2) || '0.00'}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.messageButton]}
          onPress={onMessage}
          activeOpacity={0.7}
          disabled={isActioning}
        >
          {isActioning ? (
            <ActivityIndicator size="small" color={colors.grayLight} />
          ) : (
            <>
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color={colors.grayLight}
              />
              <Text style={styles.messageButtonText}>Message</Text>
            </>
          )}
        </TouchableOpacity>

        {isProAndPending && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => onAction('accept')}
              activeOpacity={0.8}
              disabled={isActioning}
            >
              {isActioning ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color={colors.whitePure} />
                  <Text style={styles.actionButtonText}>Accept</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => onAction('decline')}
              activeOpacity={0.8}
              disabled={isActioning}
            >
              {isActioning ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="close" size={16} color={colors.whitePure} />
                  <Text style={styles.actionButtonText}>Decline</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
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

export default ProBookingsScreen;
