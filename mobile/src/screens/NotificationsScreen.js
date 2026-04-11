import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { theme } from '../config/theme';
import { db } from '../config/firebase';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notifs = [];
        snapshot.forEach((doc) => {
          notifs.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setNotifications(notifs);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load notifications:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user.uid]);

  const getIcon = (type) => {
    switch (type) {
      case 'request':
        return 'notifications';
      case 'confirmed':
        return 'checkmark-circle';
      case 'declined':
        return 'close-circle';
      case 'message':
        return 'chatbubble';
      case 'review':
        return 'star';
      case 'payment':
        return 'card';
      default:
        return 'notifications';
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'request':
        return theme.red;
      case 'confirmed':
        return '#4CAF50';
      case 'declined':
        return '#FF6B6B';
      case 'message':
        return theme.red;
      case 'review':
        return '#FFC107';
      case 'payment':
        return '#2196F3';
      default:
        return theme.red;
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, {
        read: true,
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleNotificationTap = async (notification) => {
    // Mark as read
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate to relevant screen
    switch (notification.type) {
      case 'request':
        navigation.navigate('BookingScreen', {
          bookingId: notification.bookingId,
        });
        break;
      case 'confirmed':
      case 'declined':
        navigation.navigate('Bookings');
        break;
      case 'message':
        navigation.navigate('Messages', {
          bookingId: notification.bookingId,
        });
        break;
      case 'review':
        navigation.navigate('ProProfileScreen', {
          proId: notification.fromId,
        });
        break;
      default:
        break;
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarking(true);
      const unreadNotifications = notifications.filter((n) => !n.read);

      const batch = writeBatch(db);
      unreadNotifications.forEach((notif) => {
        const notifRef = doc(db, 'notifications', notif.id);
        batch.update(notifRef, { read: true });
      });

      await batch.commit();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all as read');
      console.error(error);
    } finally {
      setMarking(false);
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const then = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  const renderNotificationItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.read && styles.notificationItemUnread]}
        onPress={() => handleNotificationTap(item)}
      >
        <View
          style={[
            styles.notificationIconContainer,
            { backgroundColor: getIconColor(item.type) },
          ]}
        >
          <Ionicons name={getIcon(item.type)} size={20} color={theme.white} />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationFromName} numberOfLines={1}>
              {item.fromName || 'Unknown'}
            </Text>
            <Text style={styles.notificationTime}>{getTimeAgo(item.createdAt)}</Text>
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
        </View>

        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} disabled={marking}>
            {marking ? (
              <ActivityIndicator size="small" color={theme.red} />
            ) : (
              <Text style={styles.markAllText}>Mark all read</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.red} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={theme.grayLight} />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={true}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.black,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.darkCard,
  },
  headerTitle: {
    color: theme.white,
    fontSize: 24,
    fontWeight: '700',
  },
  markAllText: {
    color: theme.red,
    fontSize: 14,
    fontWeight: '600',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.darkCard,
  },
  notificationItemUnread: {
    backgroundColor: 'rgba(200, 16, 46, 0.08)',
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  notificationFromName: {
    color: theme.white,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  notificationTime: {
    color: theme.grayLight,
    fontSize: 12,
    marginLeft: 8,
  },
  notificationMessage: {
    color: theme.grayLight,
    fontSize: 13,
    lineHeight: 18,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.red,
    marginLeft: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: theme.grayLight,
    fontSize: 16,
    marginTop: 12,
  },
});
