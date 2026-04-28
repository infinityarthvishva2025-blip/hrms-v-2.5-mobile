import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EmployeeTabs from './EmployeeTabs';
import EmployeeDetailScreen from '../screens/employees/EmployeeDetailScreen';
import EditEmployeeScreen from '../screens/employees/EditEmployeeScreen';

const Stack = createNativeStackNavigator();

const EmployeeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EmployeeHome" component={EmployeeTabs} />
      <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
      <Stack.Screen name="EditEmployee" component={EditEmployeeScreen} />
    </Stack.Navigator>
  );
};

export default EmployeeStack;
