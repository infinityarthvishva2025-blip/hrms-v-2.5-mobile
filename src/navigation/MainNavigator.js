import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { isManagement } from '../utils/roleUtils';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import AttendanceStack from './AttendanceStack';
import LeaveStack from './LeaveStack';
import EmployeeStack from './EmployeeStack';
import MenuStack from './MenuStack';

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation, insets }) => {
  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title !== undefined ? options.title : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName;
          switch (route.name) {
            case 'DashboardTab': iconName = isFocused ? 'home' : 'home-outline'; break;
            case 'AttendanceTab': iconName = isFocused ? 'time' : 'time-outline'; break;
            case 'LeavesTab': iconName = isFocused ? 'calendar' : 'calendar-outline'; break;
            case 'TeamTab': iconName = isFocused ? 'people' : 'people-outline'; break;
            case 'MenuTab': iconName = isFocused ? 'grid' : 'grid-outline'; break;
            default: iconName = 'help-circle';
          }

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              style={[styles.tabItem, isFocused && styles.tabItemFocused]}
              activeOpacity={0.7}
            >
              {isFocused ? (
                <LinearGradient
                  colors={colors.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.activeTabGradient}
                >
                  <Ionicons name={iconName} size={18} color="#FFF" />
                  <Text style={styles.labelFocused} numberOfLines={1}>{label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.inactiveTab}>
                  <Ionicons name={iconName} size={22} color={colors.textTertiary} />
                  <Text style={styles.labelInactive} numberOfLines={1}>{label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const MainNavigator = () => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const showTeamTab = isManagement(user?.role);

  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} insets={insets} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardScreen} 
        options={{ title: 'Home' }} 
      />
      <Tab.Screen 
        name="AttendanceTab" 
        component={AttendanceStack} 
        options={{ title: 'Entry' }} 
      />
      <Tab.Screen 
        name="LeavesTab" 
        component={LeaveStack} 
        options={{ title: 'Leaves' }} 
      />
      
      {showTeamTab && (
        <Tab.Screen 
          name="TeamTab" 
          component={EmployeeStack} 
          options={{ title: 'Team' }} 
        />
      )}
      
      <Tab.Screen 
        name="MenuTab" 
        component={MenuStack} 
        options={{ title: 'More' }} 
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    // Premium Multi-Layer Shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingVertical: 8,
  },
  tabItemFocused: {
    flex: 2.2, // Give more room for the horizontal pill
  },
  activeTabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 28,
    width: '100%',
  },
  inactiveTab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelFocused: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  labelInactive: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default MainNavigator;
