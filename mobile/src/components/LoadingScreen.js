import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors } from '../config/theme';

const LoadingScreen = () => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.black,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoContainer: {
      marginBottom: 32,
    },
    logoText: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.white,
      letterSpacing: 2,
      textAlign: 'center',
    },
    loaderContainer: {
      marginTop: 16,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>OFFSHIFT</Text>
      </View>
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.red} />
      </View>
    </View>
  );
};

export default LoadingScreen;
