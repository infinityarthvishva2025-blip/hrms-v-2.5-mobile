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

const { width } = Dimensions.get('window');

const toastConfig = {
  success: ({ text1, text2 }) => (
    <View style={styles.toastContainer}>
      <View style={[styles.toastCard, { borderLeftColor: '#10B981' }]}>
        <View style={[styles.iconBg, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.toastTitle}>{text1}</Text>
          {text2 && <Text style={styles.toastMessage} numberOfLines={2}>{text2}</Text>}
        </View>
      </View>
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View style={styles.toastContainer}>
      <View style={[styles.toastCard, { borderLeftColor: '#EF4444' }]}>
        <View style={[styles.iconBg, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.toastTitle}>{text1}</Text>
          {text2 && <Text style={styles.toastMessage} numberOfLines={2}>{text2}</Text>}
        </View>
      </View>
    </View>
  ),
  info: ({ text1, text2 }) => (
    <View style={styles.toastContainer}>
      <View style={[styles.toastCard, { borderLeftColor: colors.primary }]}>
        <View style={[styles.iconBg, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.toastTitle}>{text1}</Text>
          {text2 && <Text style={styles.toastMessage} numberOfLines={2}>{text2}</Text>}
        </View>
      </View>
    </View>
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

const styles = StyleSheet.create({
  toastContainer: {
    width: width * 0.85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    // Premium Minimal Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    borderLeftWidth: 4,
  },
  iconBg: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  toastMessage: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 1,
  },
});
