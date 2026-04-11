import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, spacing, radius, typography } from '../config/theme';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    }
  };

  const handleEmailAuth = async () => {
    try {
      setError('');

      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }

      if (isSignUp) {
        if (!firstName || !lastName) {
          setError('Please enter your name');
          return;
        }
        await signUpWithEmail(email, password, firstName, lastName);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else {
        setError(err.message || 'Authentication failed');
      }
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.black,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xxxl,
    },
    centerContent: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    logo: {
      ...typography.h1,
      color: colors.white,
      letterSpacing: 3,
      textTransform: 'uppercase',
      fontFamily: fonts.sans,
      fontWeight: '700',
      marginBottom: spacing.md,
      marginTop: spacing.xxxl,
    },
    tagline: {
      ...typography.bodyLarge,
      fontStyle: 'italic',
      fontFamily: fonts.serif,
      color: colors.grayLight,
      marginBottom: spacing.xxxl,
      textAlign: 'center',
    },
    formContainer: {
      width: '100%',
      marginBottom: spacing.xl,
    },
    inputContainer: {
      marginBottom: spacing.lg,
    },
    label: {
      ...typography.body,
      color: colors.white,
      marginBottom: spacing.sm,
      fontWeight: '500',
    },
    input: {
      backgroundColor: colors.darkCard,
      borderWidth: 1,
      borderColor: colors.darkBorder,
      borderRadius: radius.medium,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      color: colors.white,
      ...typography.body,
      fontFamily: fonts.sans,
    },
    inputFocused: {
      borderColor: colors.red,
    },
    inputRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    inputRowItem: {
      flex: 1,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.darkCard,
      borderWidth: 1,
      borderColor: colors.darkBorder,
      borderRadius: radius.medium,
      paddingHorizontal: spacing.lg,
    },
    passwordInput: {
      flex: 1,
      paddingVertical: spacing.md,
      color: colors.white,
      ...typography.body,
      fontFamily: fonts.sans,
    },
    passwordToggle: {
      padding: spacing.md,
    },
    button: {
      backgroundColor: colors.red,
      paddingVertical: spacing.md,
      borderRadius: radius.medium,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
      minHeight: 48,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      ...typography.button,
      color: colors.whitePure,
      fontWeight: '600',
    },
    googleButton: {
      backgroundColor: colors.white,
      paddingVertical: spacing.md,
      borderRadius: radius.medium,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
      flexDirection: 'row',
      gap: spacing.md,
      minHeight: 48,
    },
    googleButtonText: {
      ...typography.button,
      color: colors.black,
      fontWeight: '600',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: spacing.xl,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.darkBorder,
    },
    dividerText: {
      ...typography.body,
      color: colors.gray,
      marginHorizontal: spacing.md,
    },
    toggleContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xl,
    },
    toggleText: {
      ...typography.body,
      color: colors.gray,
    },
    toggleButton: {
      padding: spacing.sm,
    },
    toggleButtonText: {
      ...typography.button,
      color: colors.red,
      fontWeight: '600',
    },
    errorContainer: {
      backgroundColor: 'rgba(200, 16, 46, 0.1)',
      borderWidth: 1,
      borderColor: colors.red,
      borderRadius: radius.medium,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    errorText: {
      ...typography.bodySmall,
      color: colors.red,
      flex: 1,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      height: 48,
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centerContent}>
          <Text style={styles.logo}>OFFSHIFT</Text>
          <Text style={styles.tagline}>Charleston's Elite Talent Marketplace</Text>

          {error && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={colors.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.formContainer}>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.black} />
              ) : (
                <>
                  <MaterialCommunityIcons name="google" size={20} color={colors.black} />
                  <Text style={styles.googleButtonText}>Sign in with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {isSignUp && (
              <View style={styles.inputRow}>
                <View style={styles.inputRowItem}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="First"
                    placeholderTextColor={colors.gray}
                    value={firstName}
                    onChangeText={setFirstName}
                    editable={!loading}
                  />
                </View>
                <View style={styles.inputRowItem}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Last"
                    placeholderTextColor={colors.gray}
                    value={lastName}
                    onChangeText={setLastName}
                    editable={!loading}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={colors.gray}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter password"
                  placeholderTextColor={colors.gray}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.gray}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleEmailAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={colors.whitePure} />
                </View>
              ) : (
                <Text style={styles.buttonText}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
            >
              <Text style={styles.toggleButtonText}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
