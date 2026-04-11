import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  FlatList,
  TextInput,
  SafeAreaView,
  Dimensions,
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
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  arrayRemove,
  arrayUnion,
} from 'firebase/firestore';

const { width, height } = Dimensions.get('window');
const isTablet = width > 600;

export default function MessagesScreen({ route }) {
  const { user } = useAuth();
  const [view, setView] = useState(isTablet ? 'split' : 'list');
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(route?.params?.bookingId || null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [threadDetails, setThreadDetails] = useState({});
  const scrollViewRef = useRef();

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (selectedThreadId) {
      loadMessages(selectedThreadId);
    }
  }, [selectedThreadId]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      const clientBookingsQuery = query(
        collection(db, 'bookings'),
        where('clientId', '==', user.uid),
        orderBy('lastMessageAt', 'desc')
      );

      const proBookingsQuery = query(
        collection(db, 'bookings'),
        where('proId', '==', user.uid),
        orderBy('lastMessageAt', 'desc')
      );

      const [clientSnap, proSnap] = await Promise.all([
        getDocs(clientBookingsQuery),
        getDocs(proBookingsQuery),
      ]);

      const allBookings = [];
      clientSnap.forEach((doc) => {
        allBookings.push({
          id: doc.id,
          ...doc.data(),
          isClient: true,
        });
      });
      proSnap.forEach((doc) => {
        allBookings.push({
          id: doc.id,
          ...doc.data(),
          isClient: false,
        });
      });

      // Sort by lastMessageAt
      allBookings.sort((a, b) => {
        const timeA = a.lastMessageAt?.toMillis?.() || 0;
        const timeB = b.lastMessageAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setThreads(allBookings);

      // Load user details for all threads
      const userIds = new Set();
      allBookings.forEach((booking) => {
        if (booking.isClient) {
          userIds.add(booking.proId);
        } else {
          userIds.add(booking.clientId);
        }
      });

      const details = {};
      for (const userId of userIds) {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          details[userId] = userDoc.data();
        }
      }
      setThreadDetails(details);
    } catch (error) {
      console.error('Failed to load threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (bookingId) => {
    try {
      const messagesQuery = query(
        collection(db, 'bookings', bookingId, 'messages'),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(messagesQuery, (snap) => {
        const msgs = [];
        snap.forEach((doc) => {
          msgs.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setMessages(msgs);

        // Mark as read
        const bookingRef = doc(db, 'bookings', bookingId);
        updateDoc(bookingRef, {
          unreadBy: arrayRemove(user.uid),
        });
      });

      return unsubscribe;
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedThreadId) return;

    try {
      setSendingMessage(true);
      const msg = messageInput.trim();
      setMessageInput('');

      const bookingRef = doc(db, 'bookings', selectedThreadId);
      const messagesRef = collection(bookingRef, 'messages');

      await addDoc(messagesRef, {
        senderId: user.uid,
        senderName: threadDetails[user.uid]?.name || 'Unknown',
        senderAvatar: threadDetails[user.uid]?.profilePhoto || null,
        text: msg,
        createdAt: new Date(),
      });

      // Update booking's last message
      await updateDoc(bookingRef, {
        lastMessage: msg,
        lastMessageAt: new Date(),
        unreadBy: arrayUnion(
          selectedThreadId === threads.find((t) => t.id === selectedThreadId)?.proId
            ? threads.find((t) => t.id === selectedThreadId)?.proId
            : threads.find((t) => t.id === selectedThreadId)?.clientId
        ),
      });

      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      console.error(error);
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredThreads = threads.filter((thread) => {
    const otherUserId = thread.isClient ? thread.proId : thread.clientId;
    const otherUser = threadDetails[otherUserId];
    const name = otherUser?.name || 'Unknown';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getOtherUserInfo = (thread) => {
    const otherUserId = thread.isClient ? thread.proId : thread.clientId;
    return threadDetails[otherUserId] || {};
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const then = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const renderThreadItem = ({ item }) => {
    const otherUser = getOtherUserInfo(item);
    const isUnread = item.unreadBy?.includes(user.uid);

    return (
      <TouchableOpacity
        style={[
          styles.threadItem,
          selectedThreadId === item.id && styles.threadItemActive,
          isUnread && styles.threadItemUnread,
        ]}
        onPress={() => {
          setSelectedThreadId(item.id);
          if (!isTablet) {
            setView('chat');
          }
        }}
      >
        {otherUser.profilePhoto ? (
          <Image source={{ uri: otherUser.profilePhoto }} style={styles.threadAvatar} />
        ) : (
          <View style={[styles.threadAvatar, { backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: '#f5f5f5', fontSize: 16, fontWeight: '700' }}>
              {(otherUser.name || '?')[0].toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.threadContent}>
          <View style={styles.threadHeader}>
            <Text
              style={[styles.threadName, isUnread && styles.threadNameUnread]}
              numberOfLines={1}
            >
              {otherUser.name || 'Unknown'}
            </Text>
            <Text style={styles.threadTime}>{getTimeAgo(item.lastMessageAt)}</Text>
          </View>
          <Text style={styles.threadPreview} numberOfLines={1}>
            {item.lastMessage || 'No messages yet'}
          </Text>
        </View>
        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const renderMessageItem = ({ item, index }) => {
    const isOwn = item.senderId === user.uid;
    const showDate =
      index === 0 ||
      (messages[index - 1] &&
        item.createdAt.toDate().toDateString() !==
          messages[index - 1].createdAt.toDate().toDateString());

    return (
      <View>
        {showDate && (
          <View style={styles.messageDateDivider}>
            <Text style={styles.messageDateText}>
              {item.createdAt.toDate().toLocaleDateString()}
            </Text>
          </View>
        )}
        <View style={[styles.messageBubbleContainer, isOwn && styles.messageBubbleOwn]}>
          {!isOwn && (
            item.senderAvatar ? (
              <Image source={{ uri: item.senderAvatar }} style={styles.messageBubbleAvatar} />
            ) : (
              <View style={[styles.messageBubbleAvatar, { backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ color: '#f5f5f5', fontSize: 10, fontWeight: '700' }}>
                  {(item.senderName || '?')[0].toUpperCase()}
                </Text>
              </View>
            )
          )}
          <View
            style={[
              styles.messageBubble,
              isOwn ? styles.messageBubbleOwnBg : styles.messageBubbleOtherBg,
            ]}
          >
            <Text
              style={[
                styles.messageBubbleText,
                isOwn ? styles.messageBubbleOwnText : styles.messageBubbleOtherText,
              ]}
            >
              {item.text}
            </Text>
            <Text style={styles.messageTime}>
              {item.createdAt.toDate().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // List View (Phone)
  if (!isTablet && view === 'list') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={theme.grayLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations"
            placeholderTextColor={theme.grayLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.red} />
          </View>
        ) : filteredThreads.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={theme.grayLight} />
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        ) : (
          <FlatList
            data={filteredThreads}
            renderItem={renderThreadItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={true}
          />
        )}
      </SafeAreaView>
    );
  }

  // Chat View (Phone or Tablet)
  if (!isTablet && view === 'chat') {
    const selectedThread = threads.find((t) => t.id === selectedThreadId);
    const otherUser = selectedThread ? getOtherUserInfo(selectedThread) : {};

    return (
      <SafeAreaView style={styles.container}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setView('list')}>
            <Ionicons name="chevron-back" size={28} color={theme.white} />
          </TouchableOpacity>
          <View style={styles.chatHeaderContent}>
            {otherUser.profilePhoto ? (
              <Image source={{ uri: otherUser.profilePhoto }} style={styles.chatHeaderAvatar} />
            ) : (
              <View style={[styles.chatHeaderAvatar, { backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ color: '#f5f5f5', fontSize: 14, fontWeight: '700' }}>
                  {(otherUser.name || '?')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.chatHeaderName}>{otherUser.name || 'Unknown'}</Text>
              {selectedThread && (
                <Text style={styles.chatHeaderInfo}>
                  {selectedThread.craft} • ${selectedThread.rate}/hr
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="information-circle-outline" size={24} color={theme.white} />
        </View>

        {/* Messages */}
        <FlatList
          ref={scrollViewRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input */}
        <View style={styles.messageInputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            placeholderTextColor={theme.grayLight}
            value={messageInput}
            onChangeText={setMessageInput}
            multiline
            maxHeight={100}
          />
          <TouchableOpacity
            style={[styles.messageSendButton, sendingMessage && styles.messageSendButtonDisabled]}
            onPress={sendMessage}
            disabled={sendingMessage || !messageInput.trim()}
          >
            {sendingMessage ? (
              <ActivityIndicator size="small" color={theme.white} />
            ) : (
              <Ionicons name="send" size={20} color={theme.white} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Split View (Tablet)
  return (
    <SafeAreaView style={styles.containerTablet}>
      {/* Threads List Side */}
      <View style={styles.threadListSide}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={theme.grayLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations"
            placeholderTextColor={theme.grayLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.red} />
          </View>
        ) : filteredThreads.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={theme.grayLight} />
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        ) : (
          <FlatList
            data={filteredThreads}
            renderItem={renderThreadItem}
            keyExtractor={(item) => item.id}
          />
        )}
      </View>

      {/* Chat Side */}
      <View style={styles.chatSide}>
        {selectedThreadId ? (
          <>
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderContent}>
                {getOtherUserInfo(threads.find((t) => t.id === selectedThreadId)).profilePhoto ? (
                  <Image
                    source={{ uri: getOtherUserInfo(threads.find((t) => t.id === selectedThreadId)).profilePhoto }}
                    style={styles.chatHeaderAvatar}
                  />
                ) : (
                  <View style={[styles.chatHeaderAvatar, { backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: '#f5f5f5', fontSize: 14, fontWeight: '700' }}>
                      {(getOtherUserInfo(threads.find((t) => t.id === selectedThreadId)).name || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={styles.chatHeaderName}>
                    {getOtherUserInfo(threads.find((t) => t.id === selectedThreadId)).name ||
                      'Unknown'}
                  </Text>
                  {threads.find((t) => t.id === selectedThreadId) && (
                    <Text style={styles.chatHeaderInfo}>
                      {threads.find((t) => t.id === selectedThreadId).craft} •
                      ${threads.find((t) => t.id === selectedThreadId).rate}/hr
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons name="information-circle-outline" size={24} color={theme.white} />
            </View>

            {/* Messages */}
            <FlatList
              ref={scrollViewRef}
              data={messages}
              renderItem={renderMessageItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesContainer}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Input */}
            <View style={styles.messageInputContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder="Type a message..."
                placeholderTextColor={theme.grayLight}
                value={messageInput}
                onChangeText={setMessageInput}
                multiline
                maxHeight={100}
              />
              <TouchableOpacity
                style={[styles.messageSendButton, sendingMessage && styles.messageSendButtonDisabled]}
                onPress={sendMessage}
                disabled={sendingMessage || !messageInput.trim()}
              >
                {sendingMessage ? (
                  <ActivityIndicator size="small" color={theme.white} />
                ) : (
                  <Ionicons name="send" size={20} color={theme.white} />
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.centerContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={theme.grayLight} />
            <Text style={styles.emptyText}>Select a conversation</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.black,
  },
  containerTablet: {
    flex: 1,
    backgroundColor: theme.black,
    flexDirection: 'row',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.darkCard,
  },
  headerTitle: {
    color: theme.white,
    fontSize: 24,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.darkCard,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: theme.white,
    fontSize: 14,
  },
  threadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.darkCard,
  },
  threadItemActive: {
    backgroundColor: theme.darkCard,
  },
  threadItemUnread: {
    backgroundColor: 'rgba(200, 16, 46, 0.1)',
  },
  threadAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  threadContent: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  threadName: {
    color: theme.white,
    fontSize: 15,
    fontWeight: '600',
  },
  threadNameUnread: {
    fontWeight: '700',
  },
  threadTime: {
    color: theme.grayLight,
    fontSize: 12,
  },
  threadPreview: {
    color: theme.grayLight,
    fontSize: 13,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.red,
    marginLeft: 8,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.darkCard,
  },
  chatHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatHeaderName: {
    color: theme.white,
    fontSize: 15,
    fontWeight: '700',
  },
  chatHeaderInfo: {
    color: theme.grayLight,
    fontSize: 12,
    marginTop: 2,
  },
  messagesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  messageDateDivider: {
    alignItems: 'center',
    marginVertical: 16,
  },
  messageDateText: {
    color: theme.grayLight,
    fontSize: 12,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 6,
  },
  messageBubbleOwn: {
    justifyContent: 'flex-end',
  },
  messageBubbleAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: '70%',
  },
  messageBubbleOwnBg: {
    backgroundColor: theme.red,
  },
  messageBubbleOtherBg: {
    backgroundColor: theme.darkCard,
  },
  messageBubbleText: {
    fontSize: 14,
    marginBottom: 4,
  },
  messageBubbleOwnText: {
    color: theme.white,
  },
  messageBubbleOtherText: {
    color: theme.white,
  },
  messageTime: {
    fontSize: 11,
    color: theme.grayLight,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.darkCard,
    gap: 10,
  },
  messageInput: {
    flex: 1,
    backgroundColor: theme.darkCard,
    borderWidth: 1,
    borderColor: theme.grayLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: theme.white,
    maxHeight: 100,
    fontSize: 14,
  },
  messageSendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageSendButtonDisabled: {
    opacity: 0.5,
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
  threadListSide: {
    width: width > 900 ? 360 : 300,
    borderRightWidth: 1,
    borderRightColor: theme.darkCard,
  },
  chatSide: {
    flex: 1,
  },
});
