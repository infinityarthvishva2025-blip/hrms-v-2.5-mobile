import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './src/constants/colors';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';

const { width } = Dimensions.get('window');

const toastConfig = {
  success: ({ text1, text2 }) => (
    <View style={styles.toastContainer}>
      <View style={styles.toastCard}>
        <View style={[styles.statusAccent, { backgroundColor: '#0D9488' }]} />
        <View style={styles.toastContent}>
          <View style={[styles.iconBg, { backgroundColor: 'rgba(13, 148, 136, 0.1)' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#0D9488" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.toastTitle}>{text1}</Text>
            {text2 && <Text style={styles.toastMessage}>{text2}</Text>}
          </View>
        </View>
      </View>
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View style={styles.toastContainer}>
      <View style={styles.toastCard}>
        <View style={[styles.statusAccent, { backgroundColor: '#F43F5E' }]} />
        <View style={styles.toastContent}>
          <View style={[styles.iconBg, { backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}>
            <Ionicons name="alert-circle" size={24} color="#F43F5E" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.toastTitle}>{text1}</Text>
            {text2 && <Text style={styles.toastMessage}>{text2}</Text>}
          </View>
        </View>
      </View>
    </View>
  ),
  info: ({ text1, text2 }) => (
    <View style={styles.toastContainer}>
      <View style={styles.toastCard}>
        <View style={[styles.statusAccent, { backgroundColor: colors.primary }]} />
        <View style={styles.toastContent}>
          <View style={[styles.iconBg, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.toastTitle}>{text1}</Text>
            {text2 && <Text style={styles.toastMessage}>{text2}</Text>}
          </View>
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
      <Toast config={toastConfig} topOffset={60} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    width: width * 0.92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    flexDirection: 'row',
    overflow: 'hidden',
    // Premium Multi-Layer Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  statusAccent: {
    width: 6,
    height: '100%',
  },
  toastContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  iconBg: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.2,
  },
  toastMessage: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 18,
  },
});
