import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '../components/common/Avatar';
import { colors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import AdminAttendance from '../screens/attendance/AdminAttendance';
import AttendanceScreen from '../screens/attendance/AttendanceScreen';
import AttendanceSummaryScreen from '../screens/attendance/AttendanceSummaryScreen';
import CorrectionApproval from '../screens/attendance/CorrectionApproval';
import DailyReportsScreen from '../screens/attendance/DailyReportsScreen';
import { isManagement } from '../utils/roleUtils';

const AttendanceTabs = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef(null);
  const isAdmin = useMemo(() => isManagement(user?.role), [user]);

  const [activeIndex, setActiveIndex] = useState(0);

  const tabs = useMemo(() => {
    const baseTabs = [
      { id: 'attendance', label: 'Attendance', icon: 'time-outline' },
      { id: 'summary', label: 'Summary', icon: 'list-outline' },
    ];
    if (isAdmin) {
      baseTabs.push(
        // { id: 'team', label: 'Team', icon: 'people-outline' },
        { id: 'approvals', label: 'Approvals', icon: 'checkmark-circle-outline' },
        { id: 'reports', label: 'Reports', icon: 'document-text-outline' }
      );
    }
    return baseTabs;
  }, [isAdmin]);

  const onTabPress = useCallback((index) => {
    setActiveIndex(index);
    pagerRef.current?.setPage(index);
  }, []);

  const onPageSelected = useCallback((e) => {
    setActiveIndex(e.nativeEvent.position);
  }, []);

  const renderTabContent = useCallback((tabId) => {
    switch (tabId) {
      case 'attendance': return <AttendanceScreen navigation={navigation} />;
      case 'summary': return <AttendanceSummaryScreen navigation={navigation} />;
      // case 'team': return <AdminAttendance navigation={navigation} />;
      case 'approvals': return <CorrectionApproval navigation={navigation} />;
      case 'reports': return <DailyReportsScreen navigation={navigation} />;
      default: return null;
    }
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.masterHeader, { paddingTop: insets.top + 4 }]}>
        <LinearGradient
          colors={colors.gradients.primary}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />

        {/* <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => { }}
          >
            <Ionicons name="menu-outline" size={20} color="#fff" />
          </TouchableOpacity> 
          <View style={styles.headerTitleCenter}>
            <View style={styles.moduleBadge}>
              <Text style={styles.moduleBadgeText}>ATTENDANCE</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('MenuTab', { screen: 'Announcements' })} >
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
          <View key={tab.id} style={{ flex: 1 }}>
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
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 100,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  headerTitleCenter: { alignItems: 'center' },
  moduleBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  moduleBadgeText: { fontSize: 8, fontWeight: '900', color: 'rgba(255,255,255,0.8)', letterSpacing: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  headerAvatar: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },

  tabBarContent: { paddingHorizontal: 16, height: 48, alignItems: 'center' },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
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

export default AttendanceTabs;