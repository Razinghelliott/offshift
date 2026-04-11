import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { DarkTheme } from '@react-navigation/native';
import { AuthProvider } from '../context/AuthContext';
import AppNavigator from './AppNavigator';
import { theme } from '../config/theme';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: theme.red,
    background: theme.black,
    card: theme.darkCard,
    text: theme.white,
    border: theme.darkCard,
    notification: theme.red,
  },
};

export default function RootNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer theme={navigationTheme}>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
