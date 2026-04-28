import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { registerForPushNotificationsAsync, updateFcmTokenOnBackend } from '../utils/notification.utils';
import * as Notifications from 'expo-notifications';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

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

  if (loading) {
    return <LoadingSpinner fullScreen />;
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
