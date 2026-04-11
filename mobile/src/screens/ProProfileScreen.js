import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import Avatar from '../components/Avatar';
import { colors, fonts, spacing, radius, typography } from '../config/theme';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = 280;

const ProProfileScreen = ({ route, navigation }) => {
  const { proId } = route.params;
  const [pro, setPro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState([]);

  // Load pro profile from Firestore
  useEffect(() => {
    const loadPro = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'users', proId);
        const docSnapshot = await getDoc(docRef);

        if (docSnapshot.exists()) {
          const proData = {
            id: docSnapshot.id,
            ...docSnapshot.data(),
          };
          setPro(proData);

          // Load portfolio images if available
          if (proData.portfolio && Array.isArray(proData.portfolio)) {
            setPortfolio(proData.portfolio);
          }
        }
      } catch (error) {
        console.error('Error loading pro profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPro();
  }, [proId]);

  const handleBookingRequest = () => {
    navigation.navigate('Booking', { proId });
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Format availability display
  const getAvailabilityDays = () => {
    if (!pro?.availabilityTemplate) return [];

    const days = [];
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    dayOrder.forEach((day) => {
      const availability = pro.availabilityTemplate[day];
      if (availability && availability.available) {
        days.push({
          day: day.substring(0, 3),
          available: true,
          startTime: availability.startTime || '9:00 AM',
          endTime: availability.endTime || '5:00 PM',
        });
      } else {
        days.push({
          day: day.substring(0, 3),
          available: false,
        });
      }
    });

    return days;
  };

  const renderPortfolioItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.portfolioItem}
      activeOpacity={0.8}
      onPress={() => {
        // Could open lightbox here
        navigation.navigate('Lightbox', { images: portfolio, startIndex: index });
      }}
    >
      {item?.url ? (
        <Image
          source={{ uri: item.url }}
          style={styles.portfolioImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.portfolioPlaceholder}>
          <MaterialCommunityIcons name="image" size={32} color={colors.gray} />
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.red} size="large" />
      </View>
    );
  }

  if (!pro) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color={colors.gray} />
        <Text style={styles.errorText}>Professional not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.black,
    },
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: StatusBar.currentHeight || spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: 'rgba(10, 10, 10, 0.9)',
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: radius.medium,
      backgroundColor: colors.darkCard,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.darkBorder,
    },
    heroContainer: {
      height: HERO_HEIGHT,
      backgroundColor: colors.darkCard,
      overflow: 'hidden',
      position: 'relative',
      marginTop: 0,
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroGradient: {
      width: '100%',
      height: '100%',
      backgroundColor: `rgba(0, 0, 0, 0.3)`,
    },
    avatarContainer: {
      position: 'absolute',
      bottom: -40,
      left: spacing.lg,
      zIndex: 5,
      borderWidth: 3,
      borderColor: colors.black,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    content: {
      paddingTop: 60,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    nameSection: {
      marginBottom: spacing.lg,
    },
    name: {
      ...typography.h2,
      color: colors.white,
      marginBottom: spacing.sm,
    },
    craftBadge: {
      backgroundColor: colors.red,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      alignSelf: 'flex-start',
      marginBottom: spacing.md,
    },
    craftBadgeText: {
      ...typography.buttonSmall,
      color: colors.whitePure,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    rateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    rate: {
      ...typography.h4,
      color: colors.red,
      fontWeight: '700',
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.darkCard,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.darkBorder,
    },
    ratingText: {
      ...typography.body,
      color: colors.white,
      fontWeight: '600',
    },
    bioSection: {
      marginBottom: spacing.xl,
    },
    bioTitle: {
      ...typography.h5,
      color: colors.white,
      marginBottom: spacing.md,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    bioText: {
      ...typography.body,
      color: colors.grayLight,
      lineHeight: 24,
    },
    specialtiesSection: {
      marginBottom: spacing.xl,
    },
    specialtiesLabel: {
      ...typography.bodySmall,
      color: colors.gray,
      marginBottom: spacing.md,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontWeight: '600',
    },
    specialtiesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    specialtyPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.darkCard,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.darkBorder,
      marginBottom: spacing.sm,
    },
    specialtyText: {
      ...typography.bodySmall,
      color: colors.white,
      fontWeight: '500',
    },
    portfolioSection: {
      marginBottom: spacing.xl,
    },
    portfolioTitle: {
      ...typography.h5,
      color: colors.white,
      marginBottom: spacing.md,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    portfolioGrid: {
      gap: spacing.sm,
    },
    portfolioRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    portfolioItem: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: radius.medium,
      overflow: 'hidden',
      backgroundColor: colors.darkCard,
      borderWidth: 1,
      borderColor: colors.darkBorder,
    },
    portfolioImage: {
      width: '100%',
      height: '100%',
    },
    portfolioPlaceholder: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.darkCard,
    },
    availabilitySection: {
      marginBottom: spacing.xl,
    },
    availabilityLabel: {
      ...typography.bodySmall,
      color: colors.gray,
      marginBottom: spacing.md,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontWeight: '600',
    },
    availabilityGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    availabilityDay: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.darkCard,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.darkBorder,
      marginBottom: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    availabilityDayAvailable: {
      borderColor: colors.green,
      backgroundColor: 'rgba(52, 199, 89, 0.1)',
    },
    availabilityDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.green,
    },
    availabilityDotOff: {
      backgroundColor: colors.gray,
    },
    availabilityDayText: {
      ...typography.bodySmall,
      color: colors.white,
      fontWeight: '600',
    },
    availabilityTime: {
      ...typography.caption,
      color: colors.gray,
      marginLeft: spacing.sm,
    },
    bookingButton: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.red,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      marginHorizontal: spacing.lg,
      borderRadius: radius.medium,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bookingButtonText: {
      ...typography.button,
      color: colors.whitePure,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    scrollContent: {
      paddingBottom: 120,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.black,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.black,
      paddingHorizontal: spacing.lg,
    },
    errorText: {
      ...typography.h4,
      color: colors.white,
      marginTop: spacing.lg,
      marginBottom: spacing.xl,
      textAlign: 'center',
    },
    backButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.red,
      borderRadius: radius.medium,
    },
    backButtonText: {
      ...typography.button,
      color: colors.whitePure,
      fontWeight: '600',
    },
  });

  const availabilityDays = getAvailabilityDays();
  const displayName = pro.displayName || `${pro.firstName} ${pro.lastName}`;
  const firstPortfolioImage = portfolio[0]?.url;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleBackPress}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} activeOpacity={0.8}>
          <MaterialCommunityIcons name="heart-outline" size={24} color={colors.red} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          {firstPortfolioImage ? (
            <Image
              source={{ uri: firstPortfolioImage }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroGradient} />
          )}
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Avatar photoURL={pro.photoURL} name={displayName} size={100} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Name and Craft */}
          <View style={styles.nameSection}>
            <Text style={styles.name}>{displayName}</Text>
            <View style={styles.craftBadge}>
              <Text style={styles.craftBadgeText}>{pro.craft || 'Professional'}</Text>
            </View>
            <View style={styles.rateContainer}>
              <Text style={styles.rate}>${pro.hourlyRate || '0'}/hr</Text>
              {pro.rating && (
                <View style={styles.ratingContainer}>
                  <MaterialCommunityIcons name="star" size={16} color={colors.red} />
                  <Text style={styles.ratingText}>{pro.rating.toFixed(1)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Bio */}
          {pro.bio && (
            <View style={styles.bioSection}>
              <Text style={styles.bioTitle}>About</Text>
              <Text style={styles.bioText}>{pro.bio}</Text>
            </View>
          )}

          {/* Specialties */}
          {pro.specialties && pro.specialties.length > 0 && (
            <View style={styles.specialtiesSection}>
              <Text style={styles.specialtiesLabel}>Specialties</Text>
              <View style={styles.specialtiesList}>
                {pro.specialties.map((specialty, index) => (
                  <View key={index} style={styles.specialtyPill}>
                    <Text style={styles.specialtyText}>{specialty}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Portfolio */}
          {portfolio.length > 0 && (
            <View style={styles.portfolioSection}>
              <Text style={styles.portfolioTitle}>Portfolio</Text>
              <View style={styles.portfolioGrid}>
                {portfolio.length > 0 && (
                  <View style={styles.portfolioRow}>
                    {portfolio.slice(0, 3).map((item, index) => (
                      <React.Fragment key={index}>
                        {index === 0 && (
                          <View style={{ flex: 1 }}>
                            {renderPortfolioItem({ item, index })}
                          </View>
                        )}
                        {index === 1 && (
                          <View style={{ flex: 1 }}>
                            {renderPortfolioItem({ item, index })}
                          </View>
                        )}
                        {index === 2 && (
                          <View style={{ flex: 1 }}>
                            {renderPortfolioItem({ item, index })}
                          </View>
                        )}
                      </React.Fragment>
                    ))}
                  </View>
                )}
                {portfolio.length > 3 && (
                  <View style={styles.portfolioRow}>
                    {portfolio.slice(3, 6).map((item, index) => (
                      <View key={index + 3} style={{ flex: 1 }}>
                        {renderPortfolioItem({ item, index: index + 3 })}
                      </View>
                    ))}
                  </View>
                )}
                {portfolio.length > 6 && (
                  <View style={styles.portfolioRow}>
                    {portfolio.slice(6, 9).map((item, index) => (
                      <View key={index + 6} style={{ flex: 1 }}>
                        {renderPortfolioItem({ item, index: index + 6 })}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Availability */}
          {availabilityDays.length > 0 && (
            <View style={styles.availabilitySection}>
              <Text style={styles.availabilityLabel}>Availability Preview</Text>
              <View style={styles.availabilityGrid}>
                {availabilityDays.map((day, index) => (
                  <View
                    key={index}
                    style={[
                      styles.availabilityDay,
                      day.available && styles.availabilityDayAvailable,
                    ]}
                  >
                    <View
                      style={[
                        styles.availabilityDot,
                        !day.available && styles.availabilityDotOff,
                      ]}
                    />
                    <Text style={styles.availabilityDayText}>{day.day}</Text>
                    {day.available && (
                      <Text style={styles.availabilityTime}>
                        {day.startTime} - {day.endTime}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Booking Button */}
      <TouchableOpacity
        style={styles.bookingButton}
        onPress={handleBookingRequest}
        activeOpacity={0.8}
      >
        <Text style={styles.bookingButtonText}>Request Booking</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ProProfileScreen;
