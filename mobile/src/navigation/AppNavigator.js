import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { theme } from '../config/theme';
import { db } from '../config/firebase';
import { collectionGroup, query, where, onSnapshot } from 'firebase/firestore';

// Screens
import LoginScreen from '../screens/LoginScreen';
import BrowseScreen from '../screens/BrowseScreen';
import ProProfileScreen from '../screens/ProProfileScreen';
import BookingScreen from '../screens/BookingScreen';
import BookingDetailsScreen from '../screens/BookingDetailsScreen';
import ClientBookingsScreen from '../screens/ClientBookingsScreen';
import ProBookingsScreen from '../screens/ProBookingsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProDashboardScreen from '../screens/ProDashboardScreen';
import ProAvailabilityScreen from '../screens/ProAvailabilityScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ClientProfileScreen from '../screens/ClientProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: {
    backgroundColor: theme.black,
    borderBottomColor: theme.darkCard,
    borderBottomWidth: 1,
  },
  headerTintColor: theme.white,
  headerTitleStyle: {
    fontWeight: '700',
    fontSize: 17,
  },
  headerBackTitle: 'Back',
  cardStyle: {
    backgroundColor: theme.black,
  },
};

// Browse Stack
function BrowseStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="BrowseScreen"
        component={BrowseScreen}
        options={{
          title: 'Browse Professionals',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="ProProfileScreen"
        component={ProProfileScreen}
        options={({ route }) => ({
          title: route.params?.proName || 'Professional',
          headerShown: true,
        })}
      />
      <Stack.Screen
        name="BookingScreen"
        component={BookingScreen}
        options={{
          title: 'Book Service',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
}

// Bookings Stack
function BookingsStack({ userRole }) {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {userRole === 'pro' ? (
        <>
          <Stack.Screen
            name="ProBookingsScreen"
            component={ProBookingsScreen}
            options={{
              title: 'My Bookings',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="BookingDetailsScreen"
            component={BookingDetailsScreen}
            options={{
              title: 'Booking Details',
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="ClientBookingsScreen"
            component={ClientBookingsScreen}
            options={{
              title: 'My Bookings',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="BookingDetailsScreen"
            component={BookingDetailsScreen}
            options={{
              title: 'Booking Details',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// Messages Stack
function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="MessagesScreen"
        component={MessagesScreen}
        options={{
          title: 'Messages',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

// Dashboard Stack (Pro)
function DashboardStackPro() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="ProDashboardScreen"
        component={ProDashboardScreen}
        options={{
          title: 'My Profile',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="ProAvailabilityScreen"
        component={ProAvailabilityScreen}
        options={{
          title: 'Availability',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="ProBookingsScreenFromDashboard"
        component={ProBookingsScreen}
        options={{
          title: 'My Bookings',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
}

// Dashboard Stack (Client)
function DashboardStackClient() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="ClientProfileScreen"
        component={ClientProfileScreen}
        options={{
          title: 'My Profile',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
}

// Notifications Stack
function NotificationsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="NotificationsScreen"
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabs({ userRole, unreadMessagesCount, unreadNotificationsCount }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111',
          borderTopColor: theme.darkCard,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.red,
        tabBarInactiveTintColor: theme.grayLight,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case 'BrowseTab':
              iconName = 'search';
              break;
            case 'BookingsTab':
              iconName = 'calendar';
              break;
            case 'MessagesTab':
              iconName = 'chatbubble';
              break;
            case 'DashboardTab':
              iconName = 'person';
              break;
            case 'NotificationsTab':
              iconName = 'notifications';
              break;
            default:
              iconName = 'home';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="BrowseTab"
        component={BrowseStack}
        options={{
          title: 'Browse',
          tabBarLabel: 'Browse',
        }}
      />

      <Tab.Screen
        name="BookingsTab"
        component={BookingsStack}
        initialParams={{ userRole }}
        options={{
          title: 'Bookings',
          tabBarLabel: 'Bookings',
        }}
      />

      <Tab.Screen
        name="MessagesTab"
        component={MessagesStack}
        options={{
          title: 'Messages',
          tabBarLabel: 'Messages',
          tabBarBadge: unreadMessagesCount > 0 ? unreadMessagesCount : null,
        }}
      />

      <Tab.Screen
        name="DashboardTab"
        component={userRole === 'pro' ? DashboardStackPro : DashboardStackClient}
        options={{
          title: 'Dashboard',
          tabBarLabel: userRole === 'pro' ? 'Dashboard' : 'Profile',
        }}
      />

      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsStack}
        options={{
          title: 'Notifications',
          tabBarLabel: 'Notifications',
          tabBarBadge: unreadNotificationsCount > 0 ? unreadNotificationsCount : null,
        }}
      />
    </Tab.Navigator>
  );
}

// Root App Navigator
export default function AppNavigator() {
  const { user, userRole, loading } = useAuth();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Listen to unread messages count
    const messagesQuery = query(
      collectionGroup(db, 'messages'),
      where('read', '==', false),
      where('senderId', '!=', user.uid)
    );

    const messagesUnsubscribe = onSnapshot(messagesQuery, (snap) => {
      setUnreadMessagesCount(snap.size);
    });

    // Listen to unread notifications count
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    );

    // Note: collection import needed for the above query
    // Add import: import { collection, query, where, onSnapshot, collectionGroup } from 'firebase/firestore';

    return () => {
      messagesUnsubscribe();
    };
  }, [user]);

  // Need to handle notifications separately
  useEffect(() => {
    if (!user) return;

    const { query: notifQuery, onSnapshot: notifOnSnapshot, where: notifWhere, collection: notifCollection } = require('firebase/firestore');

    const notificationsQuery = notifQuery(
      notifCollection(db, 'notifications'),
      notifWhere('userId', '==', user.uid),
      notifWhere('read', '==', false)
    );

    const notificationsUnsubscribe = notifOnSnapshot(notificationsQuery, (snap) => {
      setUnreadNotificationsCount(snap.size);
    });

    return () => {
      notificationsUnsubscribe();
    };
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.black, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.red} />
      </View>
    );
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        initialParams={{
          userRole,
          unreadMessagesCount,
          unreadNotificationsCount,
        }}
      />
    </Stack.Navigator>
  );
}
