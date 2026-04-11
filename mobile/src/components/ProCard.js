import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { colors, radius, fonts } from '../config/theme';

const ProCard = ({ pro, onPress }) => {
  if (!pro) return null;

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.darkCard,
      borderRadius: radius.default,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.darkBorder,
      marginBottom: 16,
    },
    photoContainer: {
      width: '100%',
      height: 200,
      backgroundColor: colors.grayDark,
      justifyContent: 'center',
      alignItems: 'center',
    },
    photo: {
      width: '100%',
      height: '100%',
    },
    content: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
      gap: 12,
    },
    info: {
      flex: 1,
    },
    name: {
      fontSize: 18,
      fontWeight: '600',
      fontFamily: fonts.serif || 'Georgia',
      color: colors.white,
      marginBottom: 4,
    },
    craftBadge: {
      backgroundColor: colors.red,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    craftText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.whitePure,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    rate: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.white,
    },
    bio: {
      fontSize: 13,
      color: colors.grayLight,
      lineHeight: 18,
      marginBottom: 12,
      maxHeight: 36,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    ratingText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.white,
    },
    availabilityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: pro?.available ? colors.green : colors.grayMuted,
    },
  });

  const renderPhoto = () => {
    if (pro.photoURL) {
      return (
        <Image
          source={{ uri: pro.photoURL }}
          style={styles.photo}
        />
      );
    }
    return <Avatar photoURL={null} name={pro.name} size={80} />;
  };

  const renderRating = () => {
    if (!pro.rating) return null;
    return (
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={14} color={colors.red} solid />
        <Text style={styles.ratingText}>{pro.rating.toFixed(1)}</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.photoContainer}>{renderPhoto()}</View>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text style={styles.name}>{pro.name}</Text>
            <View style={styles.craftBadge}>
              <Text style={styles.craftText}>{pro.craft}</Text>
            </View>
            <Text style={styles.rate}>${pro.rate}/hr</Text>
          </View>
          <View style={styles.availabilityDot} />
        </View>

        {pro.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {pro.bio}
          </Text>
        )}

        <View style={styles.footer}>
          {renderRating()}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ProCard;
