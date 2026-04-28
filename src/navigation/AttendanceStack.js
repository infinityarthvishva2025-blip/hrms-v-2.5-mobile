import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AttendanceTabs from './AttendanceTabs';
import CorrectionRequestScreen from '../screens/attendance/CorrectionRequestScreen';
import { useAuth } from '../hooks/useAuth';

const Stack = createNativeStackNavigator();

const AttendanceStack = () => {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* 
          Instead of pointing to a single screen, we point to the Tabs component 
          which handles the role-based sub-navigation for the module.
      */}
      <Stack.Screen name="AttendanceTabs" component={AttendanceTabs} />
      
      {/* 
          Correction Request is kept as a separate stack screen because it's 
          typically opened as a detail/form view from the Summary tab.
      */}
      <Stack.Screen name="CorrectionRequest" component={CorrectionRequestScreen} />
    </Stack.Navigator>
  );
};

export default AttendanceStack;
