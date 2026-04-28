import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LeaveTabs from './LeaveTabs';

const Stack = createNativeStackNavigator();

const LeaveStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LeaveHome" component={LeaveTabs} />
    </Stack.Navigator>
  );
};

export default LeaveStack;
