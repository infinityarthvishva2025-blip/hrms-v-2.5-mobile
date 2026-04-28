import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GurukulScreen from '../screens/gurukul/GurukulScreen';
import VideoDetailScreen from '../screens/gurukul/VideoDetailScreen';

const Stack = createNativeStackNavigator();

const GurukulStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GurukulMain" component={GurukulScreen} />
      <Stack.Screen name="VideoDetail" component={VideoDetailScreen} />
    </Stack.Navigator>
  );
};

export default GurukulStack;
