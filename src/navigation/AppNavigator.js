import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { registerForPushNotificationsAsync, updateFcmTokenOnBackend } from '../utils/notification.utils';
import * as Notifications from 'expo-notifications';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import PremiumSplashScreen from '../components/common/PremiumSplashScreen';
import * as SplashScreen from 'expo-splash-screen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();
  const [splashFinished, setSplashFinished] = React.useState(false);

  // Register for notifications and handle listeners
  React.useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync().then(token => {
        if (token) updateFcmTokenOnBackend(token);
      });

      // Listener for notifications received while app is running
      const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('🔔 Notification Received:', notification);
      });

      // Listener for when user interacts with notification
      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('👆 Notification Clicked:', response);
      });

      return () => {
        notificationListener.remove();
        responseListener.remove();
      };
    }
  }, [user]);

  // Handle native splash screen hiding
  React.useEffect(() => {
    const prepare = async () => {
      try {
        // If JS Splash has finished its minimum time, hide the native one
        if (splashFinished) {
          await SplashScreen.hideAsync();
        }
      } catch (e) {
        console.warn(e);
      }
    };
    prepare();
  }, [splashFinished]);

  // Show Premium Splash until BOTH the auth check is done AND the animation minimum time is met
  if (loading || !splashFinished) {
    return <PremiumSplashScreen onFinish={() => setSplashFinished(true)} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
