import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions } from 'react-native';
import { colors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { isManagement } from '../utils/roleUtils';
import EmployeeListScreen from '../screens/employees/EmployeeListScreen';
import CreateEmployeeScreen from '../screens/employees/CreateEmployeeScreen';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../components/common/Avatar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import PagerView from 'react-native-pager-view';

const EmployeeTabs = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef(null);
  
  const canAddEmployee = useMemo(() => {
    return isManagement(user?.role) && user?.role !== 'Manager';
  }, [user]);
  
  const [activeIndex, setActiveIndex] = useState(0);

  const tabs = useMemo(() => {
    const baseTabs = [
      { id: 'directory', label: 'Directory', icon: 'people-outline' },
    ];
    if (canAddEmployee) {
      baseTabs.push(
        { id: 'add', label: 'Add Employee', icon: 'person-add-outline' }
      );
    }
    return baseTabs;
  }, [canAddEmployee]);

  const onTabPress = (index) => {
    setActiveIndex(index);
    pagerRef.current?.setPage(index);
  };

  const onPageSelected = (e) => {
    setActiveIndex(e.nativeEvent.position);
  };

  const renderTabContent = (tabId) => {
    switch (tabId) {
      case 'directory': return <EmployeeListScreen navigation={navigation} />;
      case 'add': return <CreateEmployeeScreen navigation={navigation} />;
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Master Native Header - Compact & Premium */}
      <View style={[styles.masterHeader, { paddingTop: insets.top + 4 }]}>
        <LinearGradient
          colors={colors.gradients.primary}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        {/* <View style={styles.headerTop}>
          <TouchableOpacity 
            //onPress={() => navigation.getParent()?.openDrawer()} 
            style={styles.headerBtn}
          >
            <Ionicons name="menu-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleCenter}>
            <Text style={styles.headerMainTitle}>HRMS</Text>
            <View style={styles.moduleBadge}>
               <Text style={styles.moduleBadgeText}>EMPLOYEE HUB</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerBtn}   onPress={() => navigation.navigate('MenuTab', { screen: 'Announcements' })}>
              <Ionicons name="notifications-outline" size={18} color="#fff" />
            </TouchableOpacity>
            <Avatar 
              name={user?.name} 
              url={user?.profileImageUrl} 
              size={26} 
              style={styles.headerAvatar} 
            />
          </View>
        </View> */}

        {/* Integrated Tab Bar - Sleeker & More Compact */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.tabBarContent}
        >
          {tabs.map((tab, index) => {
            const isActive = activeIndex === index;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => onTabPress(index)}
                style={[styles.tabItem, isActive && styles.activeTabItem]}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={tab.icon} 
                  size={14} 
                  color={isActive ? '#fff' : 'rgba(255,255,255,0.6)'} 
                />
                <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                  {tab.label}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <PagerView 
        ref={pagerRef}
        style={styles.content} 
        initialPage={0}
        onPageSelected={onPageSelected}
      >
        {tabs.map((tab) => (
          <View key={tab.id} collapsable={false}>
            {renderTabContent(tab.id)}
          </View>
        ))}
      </PagerView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  masterHeader: { 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 15,
  },
  headerTitleCenter: { alignItems: 'center' },
  headerMainTitle: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  moduleBadge: { 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6,
    marginTop: 2,
  },
  moduleBadgeText: { fontSize: 8, fontWeight: '900', color: 'rgba(255,255,255,0.8)', letterSpacing: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  headerAvatar: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  
  tabBarContent: { paddingHorizontal: 16, height: 48, alignItems: 'center' },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 40,
    gap: 6,
    marginRight: 6,
    borderRadius: 12,
  },
  activeTabItem: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tabLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  activeTabLabel: { color: '#fff' },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    left: '40%',
    right: '40%',
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  content: { flex: 1 },
});

export default EmployeeTabs;
