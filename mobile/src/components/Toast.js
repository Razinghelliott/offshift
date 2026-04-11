import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../config/theme';

const Toast = ({
  message = '',
  type = 'info',
  visible = false,
  duration = 3000,
  onDismiss = null,
}) => {
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        dismissToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, slideAnim]);

  const dismissToast = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss && onDismiss();
    });
  };

  const getTypeColor = () => {
    switch (type) {
      case 'success':
        return colors.green;
      case 'error':
        return colors.red;
      case 'info':
      default:
        return colors.grayMuted;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
    },
    toast: {
      backgroundColor: colors.darkCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.darkBorder,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    icon: {
      color: getTypeColor(),
    },
    message: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.white,
      flex: 1,
    },
  });

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.toast,
          {
            transform: [
              {
                translateY: slideAnim,
              },
            ],
          },
        ]}
      >
        <Ionicons
          name={getIcon()}
          size={20}
          color={getTypeColor()}
          style={styles.icon}
        />
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
};

export default Toast;
