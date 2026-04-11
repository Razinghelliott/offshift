import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import StatusBadge from './StatusBadge';
import { colors, radius } from '../config/theme';

const BookingCard = ({ booking, currentUserId, onMessage, onAction }) => {
  if (!booking) return null;

  const isCurrentUserPro = booking.proId === currentUserId;
  const otherParty = isCurrentUserPro ? booking.client : booking.pro;
  const isPending = booking.status === 'pending';
  const isProAndPending = isCurrentUserPro && isPending;

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.darkCard,
      borderRadius: radius.default,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.darkBorder,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    userSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.white,
    },
    details: {
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    detailText: {
      fontSize: 13,
      color: colors.grayLight,
    },
    priceSection: {
      marginBottom: 12,
      paddingTop: 12,
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
      gap: 10,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: radius.small,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
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

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const time = new Date(timeString);
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAccept = () => {
    onAction && onAction('accept', booking.id);
  };

  const handleDecline = () => {
    onAction && onAction('decline', booking.id);
  };

  const handleMessage = () => {
    onMessage && onMessage(booking.id, otherParty?.id);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.userSection}>
          <Avatar
            photoURL={otherParty?.photoURL}
            name={otherParty?.name}
            size={40}
          />
          <Text style={styles.userName}>{otherParty?.name}</Text>
        </View>
        <StatusBadge status={booking.status} />
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={14} color={colors.grayLight} />
          <Text style={styles.detailText}>
            {formatDate(booking.date)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={14} color={colors.grayLight} />
          <Text style={styles.detailText}>
            {formatTime(booking.date)} ({booking.duration}h)
          </Text>
        </View>
      </View>

      <View style={styles.priceSection}>
        <Text style={styles.totalPrice}>
          ${booking.total?.toFixed(2) || '0.00'}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.messageButton]}
          onPress={handleMessage}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={16} color={colors.grayLight} />
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>

        {isProAndPending && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={16} color={colors.whitePure} />
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={handleDecline}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={16} color={colors.whitePure} />
              <Text style={styles.actionButtonText}>Decline</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

export default BookingCard;
