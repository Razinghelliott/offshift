import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../config/theme';

const StatusBadge = ({ status = 'pending' }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return colors.orange;
      case 'confirmed':
        return colors.green;
      case 'declined':
        return colors.red;
      case 'completed':
        return colors.grayMuted;
      default:
        return colors.grayMuted;
    }
  };

  const getStatusLabel = () => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const styles = StyleSheet.create({
    badge: {
      backgroundColor: getStatusColor(),
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    text: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.whitePure,
      textTransform: 'capitalize',
    },
  });

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{getStatusLabel()}</Text>
    </View>
  );
};

export default StatusBadge;
