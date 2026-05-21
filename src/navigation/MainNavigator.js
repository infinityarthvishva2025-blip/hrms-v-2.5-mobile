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
import MenuScreen from '../screens/menu/MenuScreen';

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation, insets }) => {
  return (
    <View style={[styles.container, { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 16 }]}>
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
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              {isFocused ? (
                <LinearGradient
                  colors={colors.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.activeTabGradient}
                >
                  <Ionicons name={iconName} size={16} color="#FFF" />
                  <Text style={styles.labelFocused} numberOfLines={1}>{label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.inactiveTab}>
                  <Ionicons name={iconName} size={20} color={colors.textTertiary} />
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
        component={MenuScreen} 
        options={{ title: 'More' }} 
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    // Sleek premium micro-borders
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.05)',
    // Premium soft dynamic multi-layered drop shadow
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabItemFocused: {
    flex: 2.2, // Give more room for active pill
  },
  activeTabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 26,
    width: '100%',
    paddingHorizontal: 12,
  },
  inactiveTab: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    width: '100%',
  },
  labelFocused: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    marginLeft: 6,
    letterSpacing: -0.2,
  },
  labelInactive: {
    color: colors.textTertiary,
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: -0.1,
  },
});

export default MainNavigator;
