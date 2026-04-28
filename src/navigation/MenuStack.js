import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MenuScreen from '../screens/menu/MenuScreen';
import HolidayScreen from '../screens/holidays/HolidayScreen';
import AnnouncementScreen from '../screens/announcements/AnnouncementScreen';
import GurukulStack from './GurukulStack';
import ProfileStack from './ProfileStack';
import PayrollStack from './PayrollStack';

const Stack = createNativeStackNavigator();

const MenuStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MenuMain" component={MenuScreen} />
      <Stack.Screen name="Holidays" component={HolidayScreen} />
      <Stack.Screen name="Announcements" component={AnnouncementScreen} />
      <Stack.Screen name="Gurukul" component={GurukulStack} />
      <Stack.Screen name="Profile" component={ProfileStack} />
      <Stack.Screen name="Payroll" component={PayrollStack} />
    </Stack.Navigator>
  );
};

export default MenuStack;
