import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PayrollScreen from '../screens/payroll/PayrollScreen';
import SalarySlipScreen from '../screens/payroll/SalarySlipScreen';
import PayrollDashboard from '../screens/payroll/PayrollDashboard';
import { useAuth } from '../hooks/useAuth';
import { isManagement } from '../utils/roleUtils';

const Stack = createNativeStackNavigator();

const PayrollStack = () => {
  const { user } = useAuth();
  const isAdmin = isManagement(user?.role);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAdmin ? (
        <Stack.Screen name="PayrollDashboard" component={PayrollDashboard} />
      ) : (
        <Stack.Screen name="MyPayroll" component={PayrollScreen} />
      )}
      <Stack.Screen name="SalarySlip" component={SalarySlipScreen} />
    </Stack.Navigator>
  );
};

export default PayrollStack;
