import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, radius } from '../config/theme';

const EmptyState = ({
  icon = '📭',
  title = 'Nothing here yet',
  subtitle = 'Check back soon',
  actionLabel = null,
  onAction = null,
}) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.black,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    iconContainer: {
      marginBottom: 20,
    },
    icon: {
      fontSize: 56,
      textAlign: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.white,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: colors.grayLight,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 20,
    },
    actionButton: {
      backgroundColor: colors.red,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: radius.small,
    },
    actionText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.whitePure,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default EmptyState;
