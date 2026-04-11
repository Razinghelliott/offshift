import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { theme } from '../config/theme';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, addDoc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';

export default function BookingDetailsScreen({ route, navigation }) {
  const { user } = useAuth();
  const { bookingId } = route.params;
  const [booking, setBooking] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const bookingRef = doc(db, 'bookings', bookingId);
      const bookingDocSnap = await getDoc(bookingRef);
      if (bookingDocSnap.exists()) {
        const bookingData = bookingDocSnap.data();
        setBooking({ id: bookingDocSnap.id, ...bookingData });

        // Load other user's info
        const otherUserId = bookingData.clientId === user.uid ? bookingData.proId : bookingData.clientId;
        const userRef = doc(db, 'users', otherUserId);
        const userDocSnap = await getDoc(userRef);
        if (userDocSnap.exists()) {
          setOtherUser({ id: userDocSnap.id, ...userDocSnap.data() });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load booking details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setActionLoading(true);
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // Create notification
      const otherUserId = booking.clientId === user.uid ? booking.proId : booking.clientId;
      const notificationType = newStatus === 'confirmed' ? 'confirmed' : 'declined';

      await addDoc(collection(db, 'notifications'), {
        userId: otherUserId,
        type: notificationType,
        fromId: user.uid,
        fromName: booking.clientId === user.uid ? booking.clientName : booking.proName,
        message: newStatus === 'confirmed' ? 'Your booking was confirmed!' : 'Your booking was declined.',
        bookingId: bookingId,
        read: false,
        createdAt: serverTimestamp(),
      });

      loadBooking();
      Alert.alert('Success', `Booking ${newStatus}!`);
    } catch (error) {
      Alert.alert('Error', `Failed to ${newStatus} booking`);
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={theme.red} />
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Booking not found</Text>
      </SafeAreaView>
    );
  }

  const isClient = booking.clientId === user.uid;
  const isPending = booking.status === 'pending';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              booking.status === 'confirmed' && styles.statusConfirmed,
              booking.status === 'declined' && styles.statusDeclined,
              booking.status === 'pending' && styles.statusPending,
              booking.status === 'completed' && styles.statusCompleted,
            ]}
          >
            <Text style={styles.statusText}>{booking.status?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Professional Info */}
        {otherUser && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Details</Text>
            <View style={styles.userCard}>
              {otherUser.profilePhoto ? (
                <Image source={{ uri: otherUser.profilePhoto }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: '#f5f5f5', fontSize: 18, fontWeight: '700' }}>
                    {(otherUser.name || '?')[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{otherUser.name || 'Unknown'}</Text>
                <Text style={styles.userCraft}>{otherUser.craft} • ${otherUser.rate}/hr</Text>
                <Text style={styles.userBio} numberOfLines={2}>{otherUser.bio}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(booking.startTime)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>
              {booking.startTime?.toDate?.().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              {' - '}
              {booking.endTime?.toDate?.().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{booking.duration || '2'} hours</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Price</Text>
            <Text style={styles.detailValueBold}>${booking.totalPrice || 0}</Text>
          </View>
        </View>

        {/* Notes */}
        {booking.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{booking.notes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        {isPending && !isClient && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonConfirm]}
              onPress={() => handleStatusChange('confirmed')}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color={theme.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={theme.white} />
                  <Text style={styles.buttonText}>Confirm</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonDecline]}
              onPress={() => handleStatusChange('declined')}
              disabled={actionLoading}
            >
              <Ionicons name="close-circle" size={20} color={theme.white} />
              <Text style={styles.buttonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.black,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.darkCard,
  },
  statusText: {
    color: theme.white,
    fontSize: 13,
    fontWeight: '700',
  },
  statusConfirmed: {
    backgroundColor: '#4CAF50',
  },
  statusDeclined: {
    backgroundColor: '#FF6B6B',
  },
  statusPending: {
    backgroundColor: theme.red,
  },
  statusCompleted: {
    backgroundColor: '#2196F3',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  userCard: {
    backgroundColor: theme.darkCard,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: theme.white,
    fontSize: 15,
    fontWeight: '700',
  },
  userCraft: {
    color: theme.grayLight,
    fontSize: 12,
    marginTop: 2,
  },
  userBio: {
    color: theme.grayLight,
    fontSize: 12,
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.darkCard,
  },
  detailLabel: {
    color: theme.grayLight,
    fontSize: 13,
  },
  detailValue: {
    color: theme.white,
    fontSize: 13,
    fontWeight: '600',
  },
  detailValueBold: {
    color: theme.red,
    fontSize: 14,
    fontWeight: '700',
  },
  notesText: {
    color: theme.white,
    fontSize: 13,
    lineHeight: 20,
    backgroundColor: theme.darkCard,
    padding: 12,
    borderRadius: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonConfirm: {
    backgroundColor: '#4CAF50',
  },
  buttonDecline: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    color: theme.white,
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: theme.white,
    fontSize: 16,
  },
});
