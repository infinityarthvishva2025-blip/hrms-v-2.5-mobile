import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Dimensions, StatusBar, Animated, InteractionManager,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { getEmployeeDashboard } from '../../api/dashboard.api';
import { isManagement } from '../../utils/roleUtils';
import Avatar from '../../components/common/Avatar';
import PremiumHeader from '../../components/common/PremiumHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const { width } = Dimensions.get('window');

// Modular Quick Action Component
const QuickAction = ({ label, icon, onPress, bgColor, iconColor }) => (
  <TouchableOpacity style={styles.actionItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.actionIconBox, { backgroundColor: bgColor }]}>
      <Ionicons name={icon} size={24} color={iconColor} />
    </View>
    <Text style={styles.actionLabel} numberOfLines={1}>{label}</Text>
  </TouchableOpacity>
);

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const isAdmin = isManagement(user?.role);
  const scrollY = React.useRef(new Animated.Value(0)).current;

  // Unified Data fetching
  const { data: dashboardData, execute: fetchDashboard, loading: isLoading } = useFetch(getEmployeeDashboard, null);

  const isInitialLoad = !dashboardData;

  const todayRecord = dashboardData?.todayRecord;
  const isCheckedIn = !!todayRecord?.inTime;
  const isCheckedOut = !!todayRecord?.outTime;
  const inTimeStr = isCheckedIn ? new Date(todayRecord.inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

  const summary = dashboardData?.monthlySummary || { present: 0, absent: 0, late: 0, totalHours: 0 };
  const goalProgress = Math.min((summary.present / 22) * 100, 100);

  const leafSummary = dashboardData?.leaveSummary || {
    paidLeaveBalance: user?.paidLeaveBalance || 0,
    compOffBalance: user?.compOffBalance || 0
  };

  const birthdays = useMemo(() => {
    const bday = dashboardData?.birthdays || {};
    return [...(bday.today || []), ...(bday.tomorrow || [])];
  }, [dashboardData]);

  const recentAnnouncements = useMemo(() => {
    return dashboardData?.announcements || [];
  }, [dashboardData]);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const onRefresh = useCallback(async () => {
    await fetchDashboard();
  }, [fetchDashboard]);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        fetchDashboard();
      });
      return () => task.cancel();
    }, [fetchDashboard])
  );

  const getGreeting = (h) => {
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <PremiumHeader 
        variant="dashboard"
        user={user}
        greeting={getGreeting(currentTime.getHours())}
        navigation={navigation}
        scrollY={scrollY}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={isLoading && !isInitialLoad} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.mainContent}>
          
          {/* Daily Status Banner */}
          <View style={styles.statusBanner}>
            <View style={styles.statusLeft}>
              <Text style={styles.statusTitle}>Today's Status</Text>
              <View style={styles.timeWrapper}>
                <Ionicons name="time-outline" size={16} color="#64748B" />
                <Text style={styles.liveTimeText}>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, isCheckedIn && !isCheckedOut && styles.statusBadgeActive]}>
              <View style={[styles.statusDot, { backgroundColor: isCheckedIn && !isCheckedOut ? '#10B981' : '#94A3B8' }]} />
              <Text style={[styles.statusBadgeText, isCheckedIn && !isCheckedOut && { color: '#047857' }]}>
                {isCheckedIn ? (isCheckedOut ? 'Checked Out' : 'Checked In') : 'Not Checked In'}
              </Text>
            </View>
          </View>

          {/* Core Apps Grid */}
          <Text style={styles.sectionHeader}>Quick Access</Text>
          <View style={styles.actionGrid}>
            <QuickAction 
              label="Attendance" icon="scan" 
              bgColor="#EFF6FF" iconColor="#3B82F6"
              onPress={() => navigation.navigate('AttendanceTab')} 
            />
            <QuickAction 
              label="Leaves" icon="calendar-clear" 
              bgColor="#FDF4FF" iconColor="#D946EF"
              onPress={() => navigation.navigate('LeavesTab')} 
            />
            {isAdmin && (
              <QuickAction 
                label="Directory" icon="people" 
                bgColor="#F0FDF4" iconColor="#22C55E"
                onPress={() => navigation.navigate('TeamTab')} 
              />
            )}
            <QuickAction 
              label="Holidays" icon="flag" 
              bgColor="#FFFBEB" iconColor="#F59E0B"
              onPress={() => navigation.navigate('Holidays')} 
            />
            <QuickAction 
              label="Announce" icon="megaphone" 
              bgColor="#ECFEFF" iconColor="#06B6D4"
              onPress={() => navigation.navigate('Announcements')} 
            />
            <QuickAction 
              label="Gurukul" icon="library" 
              bgColor="#FFF1F2" iconColor="#F43F5E"
              onPress={() => navigation.navigate('Gurukul')} 
            />
            <QuickAction 
              label="Summary" icon="pie-chart" 
              bgColor="#F5F3FF" iconColor="#8B5CF6"
              onPress={() => navigation.navigate('AttendanceTab')} 
            />
            <QuickAction 
              label="More" icon="grid" 
              bgColor="#F8FAFC" iconColor="#64748B"
              onPress={() => navigation.navigate('MenuTab')} 
            />
          </View>

          {/* My Leave Balances */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Leave Balances</Text>
            <TouchableOpacity onPress={() => navigation.navigate('LeavesTab')}>
              <Text style={styles.seeAllText}>Apply Leave</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.balanceGrid}>
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.balanceCard} start={{x:0,y:0}} end={{x:1,y:1}}>
              <Ionicons name="calendar" size={32} color="rgba(255,255,255,0.15)" style={styles.balanceIconBg} />
              <Text style={styles.balanceVal}>{leafSummary.paidLeaveBalance}</Text>
              <Text style={styles.balanceLabel}>Paid Leaves (PL)</Text>
            </LinearGradient>
            
            <LinearGradient colors={['#10B981', '#059669']} style={styles.balanceCard} start={{x:0,y:0}} end={{x:1,y:1}}>
              <Ionicons name="time" size={32} color="rgba(255,255,255,0.15)" style={styles.balanceIconBg} />
              <Text style={styles.balanceVal}>{leafSummary.compOffBalance}</Text>
              <Text style={styles.balanceLabel}>Comp-Offs (CO)</Text>
            </LinearGradient>
          </View>

          {/* Goal Progress */}
          <Text style={[styles.sectionHeader, { marginTop: 16 }]}>Monthly Target</Text>
          <View style={styles.goalCard}>
            <View style={styles.goalHeaderRow}>
              <View>
                <Text style={styles.goalTitle}>Working Days</Text>
                <Text style={styles.goalSub}>{summary.present} of 22 days completed</Text>
              </View>
              <Text style={styles.goalPct}>{Math.round(goalProgress)}%</Text>
            </View>
            <View style={styles.goalTrack}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={[styles.goalFill, { width: `${goalProgress}%` }]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
            </View>
          </View>

          {/* Notice Board */}
          {recentAnnouncements.length > 0 && (
            <>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Notice Board</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Announcements')}>
                  <Text style={styles.seeAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.noticeBoard}>
                {recentAnnouncements.map((ann, idx) => (
                  <TouchableOpacity 
                    key={ann._id} 
                    style={[styles.noticeItem, idx === recentAnnouncements.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => navigation.navigate('Announcements')}
                  >
                    <View style={[styles.noticeIconBox, { backgroundColor: ann.priority === 'Urgent' ? '#FFE4E6' : '#EFF6FF' }]}>
                      <Ionicons name={ann.priority === 'Urgent' ? 'warning' : 'megaphone'} size={18} color={ann.priority === 'Urgent' ? '#E11D48' : '#3B82F6'} />
                    </View>
                    <View style={styles.noticeContent}>
                      <Text style={styles.noticeTitle} numberOfLines={1}>{ann.title}</Text>
                      <Text style={styles.noticeMeta}>{new Date(ann.createdAt).toLocaleDateString()} • {ann.priority}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Events */}
          {birthdays.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>Life Events</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsScroll}>
                {birthdays.map((emp) => {
                  const isToday = new Date(emp.dateOfBirth).getDate() === new Date().getDate();
                  return (
                    <View key={emp.employeeCode} style={styles.eventCard}>
                      <Avatar name={emp.name} url={emp.profileImageUrl} size={42} />
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventName} numberOfLines={1}>{emp.name}</Text>
                        <Text style={[styles.eventDate, isToday && { color: '#F59E0B', fontWeight: '700' }]}>
                          {isToday ? '🎉 Birthday Today' : 'Upcoming Tomorrow'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* Upcoming Holidays (New Section!) */}
          {dashboardData?.upcomingHolidays?.length > 0 && (
            <>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Upcoming Holidays</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Holidays')}>
                  <Text style={styles.seeAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsScroll}>
                {dashboardData.upcomingHolidays.map((holiday) => {
                  const holDate = new Date(holiday.date);
                  return (
                    <View key={holiday._id} style={styles.eventCard}>
                      <View style={[styles.noticeIconBox, { backgroundColor: '#FCE7F3', width: 42, height: 42, borderRadius: 14 }]}>
                        <Ionicons name="gift-outline" size={20} color="#DB2777" />
                      </View>
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventName} numberOfLines={1}>{holiday.name}</Text>
                        <Text style={styles.eventDate}>
                          {holDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} • {holiday.type}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* Performance Insights */}
          <Text style={styles.sectionHeader}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{summary.present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>{summary.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{summary.late}</Text>
              <Text style={styles.statLabel}>Late</Text>
            </View>
          </View>

        </View>
        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' }, // Clean light gray
  scrollContent: { flexGrow: 1 },
  mainContent: { paddingHorizontal: 20, paddingTop: 16 },

  // Status Banner
  statusBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statusLeft: { flex: 1 },
  statusTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  timeWrapper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveTimeText: { fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusBadgeActive: { backgroundColor: '#ECFDF5' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusBadgeText: { fontSize: 12, fontWeight: '700', color: '#64748B' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  sectionHeader: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  seeAllText: { fontSize: 13, fontWeight: '700', color: '#3B82F6' },

  // Quick Actions
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 28 },
  actionItem: { 
    width: (width - 40 - 48) / 4, // 4 columns, 20px padding * 2, 3 gaps of 16px
    alignItems: 'center',
  },
  actionIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#475569', textAlign: 'center' },

  // Goal Progress
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  goalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  goalTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  goalSub: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  goalPct: { fontSize: 20, fontWeight: '900', color: '#3B82F6' },
  goalTrack: { width: '100%', height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 4 },

  // Leave Balances
  balanceGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  balanceCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  balanceIconBg: { position: 'absolute', right: -5, bottom: -5, transform: [{ rotate: '-15deg' }] },
  balanceVal: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: -0.5, marginBottom: 4 },
  balanceLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },

  // Notice Board
  noticeBoard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
  },
  noticeItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  noticeIconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  noticeContent: { flex: 1, marginRight: 8 },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  noticeMeta: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },

  // Events
  eventsScroll: { paddingBottom: 16, gap: 16 },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    width: 240,
  },
  eventInfo: { marginLeft: 12, flex: 1 },
  eventName: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  eventDate: { fontSize: 12, fontWeight: '600', color: '#64748B' },

  // Stats Grid
  statsGrid: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statValue: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#64748B' },
});

export default DashboardScreen;