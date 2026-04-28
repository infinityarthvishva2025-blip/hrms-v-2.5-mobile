import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

const TabBarIcon = ({ routeName, focused, color, size }) => {
  let iconName;

  switch (routeName) {
    case 'DashboardTab':
      iconName = focused ? 'sparkles' : 'sparkles-outline'; // More premium 'Home' feel
      break;
    case 'AttendanceTab':
      iconName = focused ? 'finger-print' : 'finger-print-outline';
      break;
    case 'LeavesTab':
      iconName = focused ? 'airplane' : 'airplane-outline';
      break;
    case 'TeamTab':
      iconName = focused ? 'people-circle' : 'people-circle-outline';
      break;
    case 'MenuTab':
      iconName = focused ? 'grid' : 'grid-outline';
      break;
    default:
      iconName = 'help-circle-outline';
  }

  return (
    <View style={styles.container}>
      {focused && <View style={styles.bubble} />}
      <Ionicons 
        name={iconName} 
        size={focused ? 24 : 22} 
        color={focused ? colors.primary : colors.textTertiary} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  bubble: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primary + '15', // Soft 15% brand tint
  }
});

export default TabBarIcon;
