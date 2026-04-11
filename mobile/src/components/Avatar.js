import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../config/theme';

const Avatar = ({ photoURL, name = '', size = 40 }) => {
  const getInitials = () => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.grayDark,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.red,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
      borderRadius: size / 2,
    },
    initials: {
      fontSize: size * 0.35,
      fontWeight: '600',
      color: colors.white,
    },
  });

  if (photoURL) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photoURL }} style={styles.image} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.initials}>{getInitials()}</Text>
    </View>
  );
};

export default Avatar;
