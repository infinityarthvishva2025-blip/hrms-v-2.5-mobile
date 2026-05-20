import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { colors } from './src/constants/colors';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some errors here, safe to ignore */
});

import PremiumToast from './src/components/common/PremiumToast';

const toastConfig = {
  success: (props) => (
    <PremiumToast type="success" {...props} />
  ),
  error: (props) => (
    <PremiumToast type="error" {...props} />
  ),
  info: (props) => (
    <PremiumToast type="info" {...props} />
  ),
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
      <Toast config={toastConfig} topOffset={50} visibilityTime={3000} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({});

