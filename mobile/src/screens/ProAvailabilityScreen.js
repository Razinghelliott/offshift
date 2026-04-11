import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  SafeAreaView,
  Dimensions,
  TextInput as RNTextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { theme } from '../config/theme';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const { width } = Dimensions.get('window');
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayAbbrev = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ProAvailabilityScreen() {
  const { user } = useAuth();
  const [availabilityData, setAvailabilityData] = useState({
    recurring: Array(7)
      .fill()
      .map((_, i) => ({
        day: i,
        dayName: days[i],
        enabled: false,
        slots: [],
      })),
    dateOverrides: {},
    timezone: 'America/New_York',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingDayModal, setEditingDayModal] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [tempSlots, setTempSlots] = useState([]);
  const [overrideModal, setOverrideModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [overrideAvailable, setOverrideAvailable] = useState(true);
  const [overrideSlots, setOverrideSlots] = useState([]);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().availability) {
        setAvailabilityData(docSnap.data().availability);
      }
    } catch (error) {
      console.error('Failed to load availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        availability: availabilityData,
        updatedAt: serverTimestamp(),
      });
      Alert.alert('Success', 'Availability saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save availability');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const toggleDayEnabled = (dayIndex) => {
    setAvailabilityData((prev) => ({
      ...prev,
      recurring: prev.recurring.map((day, i) =>
        i === dayIndex ? { ...day, enabled: !day.enabled } : day
      ),
    }));
  };

  const openDayEditor = (dayIndex) => {
    setEditingDay(dayIndex);
    const day = availabilityData.recurring[dayIndex];
    setTempSlots(day.slots.length > 0 ? day.slots : [{ start: '09:00', end: '17:00' }]);
    setEditingDayModal(true);
  };

  const saveDaySlots = () => {
    setAvailabilityData((prev) => ({
      ...prev,
      recurring: prev.recurring.map((day, i) =>
        i === editingDay ? { ...day, slots: tempSlots } : day
      ),
    }));
    setEditingDayModal(false);
  };

  const addSlot = () => {
    if (tempSlots.length < 3) {
      setTempSlots([...tempSlots, { start: '09:00', end: '17:00' }]);
    }
  };

  const removeSlot = (index) => {
    setTempSlots(tempSlots.filter((_, i) => i !== index));
  };

  const updateSlot = (index, field, value) => {
    setTempSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  };

  const openDateOverride = (date) => {
    const dateStr = formatDateForKey(date);
    const override = availabilityData.dateOverrides[dateStr];
    setSelectedDate(date);
    setOverrideAvailable(override?.available !== false);
    setOverrideSlots(override?.slots || [{ start: '09:00', end: '17:00' }]);
    setOverrideModal(true);
  };

  const saveDateOverride = () => {
    const dateStr = formatDateForKey(selectedDate);
    if (!overrideAvailable) {
      // Blocked day
      setAvailabilityData((prev) => ({
        ...prev,
        dateOverrides: {
          ...prev.dateOverrides,
          [dateStr]: { available: false },
        },
      }));
    } else {
      // Available with slots
      setAvailabilityData((prev) => ({
        ...prev,
        dateOverrides: {
          ...prev.dateOverrides,
          [dateStr]: { available: true, slots: overrideSlots },
        },
      }));
    }
    setOverrideModal(false);
  };

  const deleteDateOverride = (date) => {
    const dateStr = formatDateForKey(date);
    setAvailabilityData((prev) => {
      const newOverrides = { ...prev.dateOverrides };
      delete newOverrides[dateStr];
      return {
        ...prev,
        dateOverrides: newOverrides,
      };
    });
  };

  const formatDateForKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getDateStatus = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = formatDateForKey(date);
    const override = availabilityData.dateOverrides[dateStr];

    if (override) {
      if (override.available) {
        return 'available';
      } else {
        return 'blocked';
      }
    }

    // Check recurring
    const dayOfWeek = date.getDay();
    const recurring = availabilityData.recurring[dayOfWeek];
    if (recurring?.enabled) {
      return 'available';
    }

    return null;
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.calendarDayCell} />
      );
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isToday = new Date().toDateString() === date.toDateString();
      const isFuture = date > new Date();
      const status = getDateStatus(day);

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDayCell,
            isToday && styles.calendarDayToday,
            !isFuture && styles.calendarDayPast,
          ]}
          onPress={() => isFuture && openDateOverride(date)}
          disabled={!isFuture}
        >
          <View
            style={[
              styles.calendarDayDot,
              status === 'available' && styles.calendarDayDotAvailable,
              status === 'blocked' && styles.calendarDayDotBlocked,
            ]}
          >
            <Text style={styles.calendarDayText}>{day}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.red} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Weekly Template */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Template</Text>
          {availabilityData.recurring.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={styles.dayRow}
              onPress={() => openDayEditor(index)}
            >
              <View style={styles.dayToggleContainer}>
                <Text style={styles.dayName}>{day.dayName}</Text>
                <Switch
                  value={day.enabled}
                  onValueChange={() => toggleDayEnabled(index)}
                  trackColor={{ false: theme.darkCard, true: theme.red }}
                  thumbColor={theme.white}
                />
              </View>
              {day.enabled && day.slots.length > 0 && (
                <View style={styles.slotsPreview}>
                  {day.slots.map((slot, i) => (
                    <Text key={i} style={styles.slotText}>
                      {slot.start} - {slot.end}
                      {i < day.slots.length - 1 ? '  •  ' : ''}
                    </Text>
                  ))}
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color={theme.grayLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Calendar Override */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calendar Overrides</Text>

          {/* Month Navigation */}
          <View style={styles.monthHeader}>
            <TouchableOpacity
              onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            >
              <Ionicons name="chevron-back" size={24} color={theme.red} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity
              onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            >
              <Ionicons name="chevron-forward" size={24} color={theme.red} />
            </TouchableOpacity>
          </View>

          {/* Day Labels */}
          <View style={styles.calendarHeader}>
            {dayAbbrev.map((day) => (
              <Text key={day} style={styles.calendarHeaderText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>{renderCalendarGrid()}</View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.red }]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#666' }]} />
              <Text style={styles.legendText}>Blocked</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.white }]} />
              <Text style={styles.legendText}>No Override</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Day Editor Modal */}
      <Modal visible={editingDayModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditingDayModal(false)}>
              <Ionicons name="chevron-back" size={28} color={theme.white} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingDay !== null ? availabilityData.recurring[editingDay].dayName : ''} Availability
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {tempSlots.map((slot, index) => (
              <View key={index} style={styles.slotEditor}>
                <Text style={styles.slotLabel}>Slot {index + 1}</Text>
                <View style={styles.timeRow}>
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeInputLabel}>Start</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={slot.start}
                      onChangeText={(text) => updateSlot(index, 'start', text)}
                      placeholder="09:00"
                      placeholderTextColor={theme.grayLight}
                    />
                  </View>
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeInputLabel}>End</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={slot.end}
                      onChangeText={(text) => updateSlot(index, 'end', text)}
                      placeholder="17:00"
                      placeholderTextColor={theme.grayLight}
                    />
                  </View>
                  {tempSlots.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeSlotButton}
                      onPress={() => removeSlot(index)}
                    >
                      <Ionicons name="trash" size={20} color={theme.red} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {tempSlots.length < 3 && (
              <TouchableOpacity style={styles.addSlotButton} onPress={addSlot}>
                <Ionicons name="add-circle" size={24} color={theme.red} />
                <Text style={styles.addSlotText}>Add Time Slot</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.modalSaveButton} onPress={saveDaySlots}>
            <Text style={styles.modalSaveButtonText}>Save</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {/* Date Override Modal */}
      <Modal visible={overrideModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setOverrideModal(false)}>
              <Ionicons name="chevron-back" size={28} color={theme.white} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedDate?.toLocaleDateString()}
            </Text>
            <TouchableOpacity onPress={() => {
              deleteDateOverride(selectedDate);
              setOverrideModal(false);
            }}>
              <Ionicons name="trash" size={24} color={theme.red} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.overrideToggleContainer}>
              <Text style={styles.overrideLabel}>
                {overrideAvailable ? 'Available' : 'Blocked'}
              </Text>
              <Switch
                value={overrideAvailable}
                onValueChange={setOverrideAvailable}
                trackColor={{ false: '#666', true: theme.red }}
                thumbColor={theme.white}
              />
            </View>

            {overrideAvailable && (
              <>
                {overrideSlots.map((slot, index) => (
                  <View key={index} style={styles.slotEditor}>
                    <Text style={styles.slotLabel}>Slot {index + 1}</Text>
                    <View style={styles.timeRow}>
                      <View style={styles.timeInputContainer}>
                        <Text style={styles.timeInputLabel}>Start</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={slot.start}
                          onChangeText={(text) => {
                            setOverrideSlots((prev) =>
                              prev.map((s, i) => (i === index ? { ...s, start: text } : s))
                            );
                          }}
                          placeholder="09:00"
                          placeholderTextColor={theme.grayLight}
                        />
                      </View>
                      <View style={styles.timeInputContainer}>
                        <Text style={styles.timeInputLabel}>End</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={slot.end}
                          onChangeText={(text) => {
                            setOverrideSlots((prev) =>
                              prev.map((s, i) => (i === index ? { ...s, end: text } : s))
                            );
                          }}
                          placeholder="17:00"
                          placeholderTextColor={theme.grayLight}
                        />
                      </View>
                      {overrideSlots.length > 1 && (
                        <TouchableOpacity
                          style={styles.removeSlotButton}
                          onPress={() => {
                            setOverrideSlots((prev) => prev.filter((_, i) => i !== index));
                          }}
                        >
                          <Ionicons name="trash" size={20} color={theme.red} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}

                {overrideSlots.length < 3 && (
                  <TouchableOpacity
                    style={styles.addSlotButton}
                    onPress={() =>
                      setOverrideSlots([...overrideSlots, { start: '09:00', end: '17:00' }])
                    }
                  >
                    <Ionicons name="add-circle" size={24} color={theme.red} />
                    <Text style={styles.addSlotText}>Add Time Slot</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.modalSaveButton} onPress={saveDateOverride}>
            <Text style={styles.modalSaveButtonText}>Save</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color={theme.white} />
        ) : (
          <Text style={styles.saveButtonText}>Save Availability</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const TextInput = ({ style, ...props }) => (
  <View style={[styles.textInputWrapper, style]}>
    <RNTextInput
      {...props}
      style={styles.textInputInner}
      placeholderTextColor="#666"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.black,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: theme.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  dayRow: {
    backgroundColor: theme.darkCard,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayToggleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayName: {
    color: theme.white,
    fontSize: 15,
    fontWeight: '600',
  },
  slotsPreview: {
    flex: 1,
    marginHorizontal: 12,
  },
  slotText: {
    color: theme.grayLight,
    fontSize: 12,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
  },
  monthTitle: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '700',
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarHeaderText: {
    flex: 1,
    textAlign: 'center',
    color: theme.grayLight,
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  calendarDayCell: {
    width: '14.285%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayToday: {
    borderBottomWidth: 2,
    borderColor: theme.red,
  },
  calendarDayPast: {
    opacity: 0.4,
  },
  calendarDayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayDotAvailable: {
    backgroundColor: theme.red,
    borderColor: theme.red,
  },
  calendarDayDotBlocked: {
    backgroundColor: '#333',
    borderColor: '#666',
  },
  calendarDayText: {
    color: theme.white,
    fontSize: 12,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    color: theme.grayLight,
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.black,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.darkCard,
  },
  modalTitle: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  slotEditor: {
    marginBottom: 20,
  },
  slotLabel: {
    color: theme.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end',
  },
  timeInputContainer: {
    flex: 1,
  },
  timeInputLabel: {
    color: theme.grayLight,
    fontSize: 12,
    marginBottom: 6,
  },
  textInputWrapper: {
    backgroundColor: theme.darkCard,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.grayLight,
  },
  textInputInner: {
    color: theme.white,
    padding: 10,
    fontSize: 14,
  },
  timeInput: {
    backgroundColor: theme.darkCard,
    borderWidth: 1,
    borderColor: theme.grayLight,
    borderRadius: 6,
    padding: 10,
    color: theme.white,
    fontSize: 14,
  },
  removeSlotButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.red,
    borderRadius: 8,
  },
  addSlotText: {
    color: theme.red,
    fontSize: 14,
    fontWeight: '600',
  },
  overrideToggleContainer: {
    backgroundColor: theme.darkCard,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  overrideLabel: {
    color: theme.white,
    fontSize: 15,
    fontWeight: '600',
  },
  modalSaveButton: {
    backgroundColor: theme.red,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.red,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
