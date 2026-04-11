import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius, typography, shadows } from '../config/theme';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const BookingScreen = ({ route, navigation }) => {
  const { proId, proName, proRate } = route.params;
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [duration, setDuration] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [proData, setProData] = useState(null);
  const [availabilityTemplate, setAvailabilityTemplate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [successVisible, setSuccessVisible] = useState(false);
  const [calendarDays, setCalendarDays] = useState([]);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProData();
  }, [proId]);

  useEffect(() => {
    if (selectedDate && availabilityTemplate) {
      updateAvailableSlots(selectedDate);
    }
  }, [selectedDate, availabilityTemplate]);

  useEffect(() => {
    generateCalendarDays();
  }, []);

  const loadProData = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'users', proId);
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setProData(data);
        if (data.availabilityTemplate) {
          setAvailabilityTemplate(data.availabilityTemplate);
        }
      }
    } catch (error) {
      console.error('Error loading pro data:', error);
      Alert.alert('Error', 'Failed to load professional information');
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const days = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      const dateString = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const dayNum = date.getDate();

      days.push({
        dateString,
        dayOfWeek,
        dayNum,
        fullDate: date,
      });
    }

    setCalendarDays(days);
  };

  const updateAvailableSlots = (dateString) => {
    if (!availabilityTemplate) {
      setAvailableSlots([]);
      return;
    }

    const date = new Date(dateString);
    const dayOfWeek = date.getDay();

    // Check for date overrides first
    if (availabilityTemplate.dateOverrides?.[dateString]) {
      const override = availabilityTemplate.dateOverrides[dateString];
      if (override.available && override.slots) {
        setAvailableSlots(override.slots);
        return;
      }
    }

    // Check recurring availability
    const recurringDay = availabilityTemplate.recurring?.find(
      (r) => r.day === dayOfWeek
    );

    if (recurringDay?.enabled && recurringDay.slots) {
      const slots = [];
      recurringDay.slots.forEach((slot) => {
        slots.push(...generateSlotIntervals(slot.start, slot.end));
      });
      setAvailableSlots(slots);
    } else {
      setAvailableSlots([]);
    }
  };

  const generateSlotIntervals = (startTime, endTime) => {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;
    const endTotalMin = endHour * 60 + endMin;

    while (currentHour * 60 + currentMin < endTotalMin) {
      const timeString = `${String(currentHour).padStart(2, '0')}:${String(
        currentMin
      ).padStart(2, '0')}`;
      slots.push(timeString);

      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour += 1;
      }
    }

    return slots;
  };

  const isDateAvailable = (dateString) => {
    if (!availabilityTemplate) return false;

    const date = new Date(dateString);
    const dayOfWeek = date.getDay();

    if (availabilityTemplate.dateOverrides?.[dateString]) {
      return availabilityTemplate.dateOverrides[dateString].available;
    }

    const recurringDay = availabilityTemplate.recurring?.find(
      (r) => r.day === dayOfWeek
    );

    return recurringDay?.enabled ?? false;
  };

  const estimatedTotal = proRate * duration;

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Missing Information', 'Please select a date and time');
      return;
    }

    Keyboard.dismiss();
    setSubmitting(true);

    try {
      const bookingData = {
        proId,
        clientId: user.uid,
        proName,
        clientName: user.displayName || 'Client',
        clientEmail: user.email,
        clientPhoto: user.photoURL || null,
        date: selectedDate,
        time: selectedTime,
        duration,
        estimatedTotal,
        message,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: message || null,
        lastMessageAt: message ? serverTimestamp() : null,
        unreadBy: {
          [proId]: true,
        },
      };

      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
      const bookingId = bookingRef.id;

      // Create notification for pro
      await addDoc(collection(db, 'notifications'), {
        userId: proId,
        type: 'booking_request',
        bookingId,
        fromName: user.displayName || 'Client',
        message: `New booking request from ${user.displayName || 'Client'} for ${selectedDate} at ${selectedTime}`,
        read: false,
        createdAt: serverTimestamp(),
      });

      // Show success animation
      showSuccessAnimation();
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', 'Failed to create booking request');
    } finally {
      setSubmitting(false);
    }
  };

  const showSuccessAnimation = () => {
    setSuccessVisible(true);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Booking</Text>
          <View style={{ width: 28 }} />
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Booking</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Pro Info */}
        <View style={styles.proCard}>
          <View style={styles.proHeader}>
            <View>
              <Text style={styles.proName}>{proName}</Text>
              <Text style={styles.proRate}>${proRate}/hour</Text>
            </View>
          </View>
        </View>

        {/* Calendar Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.calendarScroll}
            contentContainerStyle={styles.calendarContent}
          >
            {calendarDays.map((day) => {
              const available = isDateAvailable(day.dateString);
              const isSelected = selectedDate === day.dateString;

              return (
                <TouchableOpacity
                  key={day.dateString}
                  onPress={() => available && setSelectedDate(day.dateString)}
                  style={[
                    styles.dateButton,
                    isSelected && styles.dateButtonSelected,
                    !available && styles.dateButtonDisabled,
                  ]}
                  activeOpacity={available ? 0.7 : 1}
                  disabled={!available}
                >
                  <Text style={styles.dateDayLabel}>
                    {DAYS_OF_WEEK[day.dayOfWeek]}
                  </Text>
                  <Text
                    style={[
                      styles.dateLabel,
                      isSelected && styles.dateLabelSelected,
                      !available && styles.dateLabelDisabled,
                    ]}
                  >
                    {day.dayNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time Section */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Time</Text>
            <View style={styles.timeSlotsContainer}>
              {availableSlots.length > 0 ? (
                <>
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTime === slot;
                    return (
                      <TouchableOpacity
                        key={slot}
                        onPress={() => setSelectedTime(slot)}
                        style={[
                          styles.timeSlot,
                          isSelected && styles.timeSlotSelected,
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.timeSlotText,
                            isSelected && styles.timeSlotTextSelected,
                          ]}
                        >
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </>
              ) : (
                <Text style={styles.noSlotsText}>No availability for this date</Text>
              )}
            </View>
          </View>
        )}

        {/* Duration Section */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duration (Hours)</Text>
            <View style={styles.durationContainer}>
              <TouchableOpacity
                onPress={() => duration > 1 && setDuration(duration - 1)}
                style={styles.durationButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="remove"
                  size={24}
                  color={duration > 1 ? colors.red : colors.grayDark}
                />
              </TouchableOpacity>

              <Text style={styles.durationValue}>{duration}h</Text>

              <TouchableOpacity
                onPress={() => duration < 8 && setDuration(duration + 1)}
                style={styles.durationButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="add"
                  size={24}
                  color={duration < 8 ? colors.red : colors.grayDark}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Message Section */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Message (Optional)</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Add any additional details..."
              placeholderTextColor={colors.grayMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {message.length}/500
            </Text>
          </View>
        )}

        {/* Summary Card */}
        {selectedDate && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Professional</Text>
              <Text style={styles.summaryValue}>{proName}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time</Text>
              <Text style={styles.summaryValue}>{selectedTime || '—'}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{duration} hour{duration > 1 ? 's' : ''}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated Total</Text>
              <Text style={styles.estimatedTotal}>${estimatedTotal.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Send Request Button */}
      {selectedDate && selectedTime && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonLoading]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Send Request</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Success Overlay */}
      {successVisible && (
        <Animated.View
          style={[
            styles.successOverlay,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={80} color={colors.green} />
            <Text style={styles.successTitle}>Request Sent!</Text>
            <Text style={styles.successMessage}>
              Your booking request has been sent to {proName}
            </Text>
          </View>
        </Animated.View>
      )}
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
    ...typography.h5,
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: 120,
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proCard: {
    backgroundColor: colors.darkCard,
    borderRadius: radius.medium,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.darkBorder,
  },
  proHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proName: {
    ...typography.h5,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  proRate: {
    ...typography.body,
    color: colors.grayLight,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.white,
    marginBottom: spacing.md,
  },
  calendarScroll: {
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.md,
  },
  calendarContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  dateButton: {
    width: 60,
    paddingVertical: spacing.md,
    borderRadius: radius.small,
    backgroundColor: colors.darkCard,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButtonSelected: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  dateButtonDisabled: {
    opacity: 0.4,
  },
  dateDayLabel: {
    ...typography.bodySmall,
    color: colors.grayLight,
    marginBottom: spacing.xs,
  },
  dateLabel: {
    ...typography.h6,
    color: colors.white,
  },
  dateLabelSelected: {
    color: colors.white,
  },
  dateLabelDisabled: {
    color: colors.grayMuted,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  timeSlot: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.small,
    backgroundColor: colors.darkCard,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    width: '23%',
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  timeSlotText: {
    ...typography.bodySmall,
    color: colors.white,
  },
  timeSlotTextSelected: {
    fontWeight: '600',
    color: colors.white,
  },
  noSlotsText: {
    ...typography.body,
    color: colors.grayMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    backgroundColor: colors.darkCard,
    borderRadius: radius.medium,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.darkBorder,
  },
  durationButton: {
    width: 48,
    height: 48,
    borderRadius: radius.small,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.darkBorder,
  },
  durationValue: {
    ...typography.h4,
    color: colors.white,
    minWidth: 80,
    textAlign: 'center',
  },
  messageInput: {
    backgroundColor: colors.darkCard,
    borderRadius: radius.small,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.white,
    minHeight: 100,
    ...typography.body,
  },
  charCount: {
    ...typography.caption,
    color: colors.grayMuted,
    marginTop: spacing.sm,
    textAlign: 'right',
  },
  summaryCard: {
    backgroundColor: colors.darkCard,
    borderRadius: radius.medium,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.red,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.grayLight,
  },
  summaryValue: {
    ...typography.h6,
    color: colors.white,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.darkBorder,
    marginVertical: spacing.md,
  },
  estimatedTotal: {
    ...typography.h4,
    color: colors.red,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.black,
    borderTopWidth: 1,
    borderTopColor: colors.darkBorder,
    paddingBottom: spacing.lg + (Platform.OS === 'ios' ? 20 : 0),
  },
  submitButton: {
    backgroundColor: colors.red,
    borderRadius: radius.medium,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  submitButtonLoading: {
    opacity: 0.7,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.white,
    fontSize: 16,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successContainer: {
    alignItems: 'center',
  },
  successTitle: {
    ...typography.h3,
    color: colors.white,
    marginTop: spacing.lg,
  },
  successMessage: {
    ...typography.body,
    color: colors.grayLight,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});

export default BookingScreen;
