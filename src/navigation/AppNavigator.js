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

// Shared Screens (accessible from multiple tabs, render above the tab bar)
import HolidayScreen from '../screens/holidays/HolidayScreen';
import AnnouncementScreen from '../screens/announcements/AnnouncementScreen';
import GurukulStack from './GurukulStack';
import ProfileStack from './ProfileStack';
import PayrollStack from './PayrollStack';

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
  }, [user?._id]);

  // Handle native splash screen hiding
  React.useEffect(() => {
    const prepare = async () => {
      try {
        // Hide the native splash screen immediately so our JS splash is visible
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
      }
    };
    prepare();
  }, []);

  // Show Premium Splash until BOTH the auth check is done AND the animation minimum time is met
  if (loading || !splashFinished) {
    return <PremiumSplashScreen onFinish={() => setSplashFinished(true)} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Group>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen name="Holidays" component={HolidayScreen} />
          <Stack.Screen name="Announcements" component={AnnouncementScreen} />
          <Stack.Screen name="Gurukul" component={GurukulStack} />
          <Stack.Screen name="Profile" component={ProfileStack} />
          <Stack.Screen name="Payroll" component={PayrollStack} />
        </Stack.Group>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
