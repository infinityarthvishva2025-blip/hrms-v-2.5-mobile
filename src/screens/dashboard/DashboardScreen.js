import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { getTodayStatus, getMySummary } from '../../api/attendance.api';
import { getUpcomingBirthdays } from '../../api/employee.api';
import { isManagement } from '../../utils/roleUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PremiumHeader from '../../components/common/PremiumHeader';
import Avatar from '../../components/common/Avatar';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const PerformanceGraph = ({ summary }) => {
  const data = [
    { label: 'P', value: summary?.present || 0, color: ['#10B981', '#059669'], icon: 'checkmark-circle' },
    { label: 'A', value: summary?.absent || 0, color: ['#EF4444', '#B91C1C'], icon: 'close-circle' },
    { label: 'L', value: summary?.late || 0, color: ['#F59E0B', '#D97706'], icon: 'timer' },
  ];

  const maxValue = Math.max(...data.map(d => d.value), 5);

  return (
    <View style={styles.graphCard}>
      <View style={styles.graphHeader}>
        <View>
          <Text style={styles.graphTitle}>Attendance Trend</Text>
          <Text style={styles.graphSubtitle}>Current Month Overview</Text>
        </View>
        <Ionicons name="stats-chart" size={20} color={colors.primary} />
      </View>
      <View style={styles.graphContent}>
        {data.map((item, index) => {
          const height = (item.value / maxValue) * 120;
          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barBackground}>
                <LinearGradient
                  colors={item.color}
                  style={[styles.barFill, { height: height || 2 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />
              </View>
              <Text style={styles.barLabel}>{item.label}</Text>
              <Text style={styles.barValueText}>{item.value}</Text>
            </View>
          );
        })}
        <View style={styles.graphLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Present</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Absent</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Late</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const QuickActionCard = ({ label, icon, onPress, color, subText }) => (
  <TouchableOpacity
    style={styles.qaCard}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <LinearGradient
      colors={[color + '15', color + '05']}
      style={styles.qaGradient}
    />
    <View style={[styles.qaIconContainer, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.qaTextContainer}>
      <Text style={styles.qaLabel}>{label}</Text>
      <Text style={styles.qaSubText}>{subText}</Text>
    </View>
    <View style={styles.qaChevron}>
      <Ionicons name="chevron-forward" size={16} color={color} />
    </View>
  </TouchableOpacity>
);

const StatCard = ({ icon, label, value, sub, colors: gradientColors }) => (
  <View style={styles.statCard}>
    <LinearGradient
      colors={[gradientColors[0] + '10', '#fff']}
      style={StyleSheet.absoluteFill}
    />
    <View style={[styles.statAccent, { backgroundColor: gradientColors[0] }]} />
    <View style={styles.statTop}>
      <View style={[styles.statIconContainer, { backgroundColor: gradientColors[0] + '15' }]}>
        <Ionicons name={icon} size={18} color={gradientColors[0]} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    <View style={styles.statBottom}>
      <Text style={styles.statValue}>{value ?? '—'}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  </View>
);

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { data: todayStatus, execute: fetchStatus } = useFetch(getTodayStatus, null);
  const { data: summaryData, execute: fetchSummary } = useFetch(getMySummary, { summary: { present: 0, absent: 0, late: 0, totalHours: 0 } });
  const { data: birthdaysResponse, execute: fetchBirthdays } = useFetch(getUpcomingBirthdays, null);

  const birthdays = useMemo(() => {
    const data = birthdaysResponse || {};
    return [...(data.today || []), ...(data.tomorrow || [])];
  }, [birthdaysResponse]);

  const isAdmin = isManagement(user?.role);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
    return () => clearInterval(timer);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await Promise.all([fetchStatus(), fetchSummary(), fetchBirthdays()]);
    setRefreshing(false);
  }, [fetchStatus, fetchSummary, fetchBirthdays]);

  const hr = currentTime.getHours();
  const getGreeting = (h) => {
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const isCheckedIn = !!todayStatus?.record?.inTime;
  const isCheckedOut = !!todayStatus?.record?.outTime;

  const formatTime = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const formatDate = (d) => d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const fmtRecordTime = (time) => {
    if (!time) return '--:--';
    return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate shift progress (assumes 9 hour shift for visualization)
  const shiftProgress = useMemo(() => {
    if (!isCheckedIn || isCheckedOut) return isCheckedOut ? 1 : 0;
    const inTime = new Date(todayStatus.record.inTime);
    const now = currentTime;
    const elapsedHrs = (now - inTime) / (1000 * 60 * 60);
    return Math.min(elapsedHrs / 9, 1);
  }, [isCheckedIn, isCheckedOut, todayStatus?.record?.inTime, currentTime]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <PremiumHeader
        moduleBadge="DASHBOARD"
        user={user}
        navigation={navigation}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeLeft}>
            <Text style={styles.greetingText}>{getGreeting(hr)},</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.digitalTime}>{formatTime(currentTime)}</Text>
          </View>
        </View>

        {/* Hero Attendance Card */}
        <View style={styles.heroWrapper}>
          <LinearGradient
            colors={colors.gradients.primary}
            style={styles.heroCard}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={[styles.blob, styles.blob1]} />
            <View style={[styles.blob, styles.blob2]} />

            <View style={styles.heroContent}>
              <View style={styles.heroHeader}>
                <View style={styles.liveIndicator}>
                  <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
                  <Text style={styles.heroLabel}>TODAY'S ACTIVITY</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('AttendanceTab')}
                  style={styles.historyBtn}
                >
                  <Text style={styles.historyBtnText}>History</Text>
                  <Ionicons name="arrow-forward" size={12} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>

              <View style={styles.timeStats}>
                <View style={styles.timeItem}>
                  <Text style={styles.timeItemLabel}>CHECK IN</Text>
                  <Text style={[styles.timeItemValue, isCheckedIn && styles.activeTimeText]}>
                    {isCheckedIn ? fmtRecordTime(todayStatus.record.inTime) : 'NOT YET'}
                  </Text>
                </View>
                <View style={styles.timeSeparator} />
                <View style={styles.timeItem}>
                  <Text style={styles.timeItemLabel}>CHECK OUT</Text>
                  <Text style={[styles.timeItemValue, isCheckedOut && styles.activeTimeText]}>
                    {isCheckedOut ? fmtRecordTime(todayStatus.record.outTime) : '--:--'}
                  </Text>
                </View>
              </View>

              {/* Shift Progress Bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Shift Progress</Text>
                  <Text style={styles.progressValue}>{Math.round(shiftProgress * 100)}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${shiftProgress * 100}%` }]} />
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryHeroAction}
                onPress={() => navigation.navigate('AttendanceTab')}
                activeOpacity={0.9}
              >
                <Ionicons name="finger-print" size={20} color={colors.gradients.primary[0]} />
                <Text style={styles.primaryHeroActionText}>
                  {isCheckedIn ? (isCheckedOut ? 'Attendance Marked' : 'Mark Check Out') : 'Mark Check In'}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

                {/* Celebrations Section */}
        {birthdays.length > 0 && (
          <View style={styles.celebrationsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Celebrations</Text>
              <Ionicons name="sparkles" size={18} color={colors.warning} />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.celebrationScroll}
            >
              {birthdays.map((emp) => {
                const today = new Date();
                const dob = new Date(emp.dateOfBirth);
                const isToday = dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth();

                return (
                  <View key={emp.employeeCode} style={styles.birthdayCard}>
                    <Avatar name={emp.name} url={emp.profileImageUrl} size={50} />
                    <View style={styles.birthdayInfo}>
                      <Text style={styles.birthdayName} numberOfLines={1}>{emp.name}</Text>
                      <Text style={[styles.birthdayDate, isToday && { color: colors.gradients.accent[0] }]}>
                        {isToday ? 'Today' : 'Tomorrow'}
                      </Text>
                    </View>
                    <View style={[styles.birthdayIconBg, { backgroundColor: colors.gradients.accent[0] + '15' }]}>
                      <Ionicons name="gift" size={20} color={colors.gradients.accent[0]} />
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}



        {/* Quick Actions Section */}
        <View style={styles.quickLinksSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionGrid}>
            <QuickActionCard
              label="Leave Center"
              subText="Apply or Manage"
              icon="airplane-outline"
              color={colors.gradients.secondary[0]}
              onPress={() => navigation.navigate('LeavesTab')}
            />
            <QuickActionCard
              label="My Payroll"
              subText="Salary & Slips"
              icon="cash-outline"
              color={colors.gradients.accent[0]}
              onPress={() => navigation.navigate('MenuTab', { screen: 'Payroll' })}
            />
            <QuickActionCard
              label="Directory"
              subText="Contact Teams"
              icon="people-outline"
              color={colors.primary}
              onPress={() => navigation.navigate(isAdmin ? 'TeamTab' : 'MenuTab', isAdmin ? {} : { screen: 'Profile' })}
            />
            <QuickActionCard
              label="Holidays"
              subText="View Calendar"
              icon="calendar-outline"
              color="#EC4899"
              onPress={() => navigation.navigate('MenuTab', { screen: 'Holidays' })}
            />
          </View>
        </View>


                {/* Monthly Performance Graph */}
        <PerformanceGraph summary={summaryData?.summary} />

        {/* Summary Grid */}
        <View style={styles.statGrid}>
          <StatCard
            icon="timer"
            label="LATE INS"
            value={summaryData?.summary?.late}
            sub="Late Entry"
            colors={[colors.warning, '#D97706']}
          />
          <StatCard
            icon="trending-up"
            label="AVG HOURS"
            value={summaryData?.summary?.present ? (summaryData.summary.totalHours / summaryData.summary.present).toFixed(1) + 'h' : '—'}
            sub="Per Day"
            colors={colors.gradients.accent}
          />
        </View>



        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },
  
  // Welcome Section
  welcomeSection: { marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  welcomeLeft: { flex: 1 },
  greetingText: { fontSize: 16, fontWeight: '700', color: colors.textSecondary },
  userName: { fontSize: 32, fontWeight: '900', color: colors.text, letterSpacing: -1 },
  dateText: { fontSize: 14, color: colors.textTertiary, fontWeight: '600', marginTop: 2 },
  timeContainer: { backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  digitalTime: { fontSize: 16, fontWeight: '800', color: colors.primary, fontVariant: ['tabular-nums'] },

  // Hero Card
  heroWrapper: { marginBottom: 24 },
  heroCard: { borderRadius: 32, padding: 24, overflow: 'hidden', elevation: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15 },
  blob: { position: 'absolute', width: 150, height: 150, borderRadius: 75, opacity: 0.15 },
  blob1: { top: -50, right: -50, backgroundColor: '#fff' },
  blob2: { bottom: -50, left: -50, backgroundColor: '#fff' },
  heroContent: { zIndex: 1 },
  heroHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  heroLabel: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.9)', letterSpacing: 1 },
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  historyBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  
  timeStats: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 20 },
  timeItem: { flex: 1 },
  timeItemLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  timeItemValue: { fontSize: 22, fontWeight: '900', color: 'rgba(255,255,255,0.3)' },
  activeTimeText: { color: '#fff' },
  timeSeparator: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Progress Bar
  progressSection: { marginBottom: 24 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.8)' },
  progressValue: { fontSize: 11, fontWeight: '900', color: '#fff' },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4 },
  progressBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },

  primaryHeroAction: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 18, elevation: 4 },
  primaryHeroActionText: { fontSize: 15, fontWeight: '800', color: colors.primaryDark },

  // Graph Card
  graphCard: { backgroundColor: colors.surface, borderRadius: 28, padding: 20, marginBottom: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  graphHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  graphTitle: { fontSize: 17, fontWeight: '900', color: colors.text },
  graphSubtitle: { fontSize: 12, color: colors.textTertiary, fontWeight: '600', marginTop: 2 },
  graphContent: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 180, paddingTop: 20 },
  barContainer: { alignItems: 'center', flex: 1 },
  barBackground: { height: 120, width: 24, backgroundColor: colors.surfaceAlt, borderRadius: 12, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 12 },
  barLabel: { fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginTop: 10 },
  barValueText: { fontSize: 12, fontWeight: '900', color: colors.text, marginTop: 2 },
  graphLegend: { position: 'absolute', bottom: -10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: '700', color: colors.textTertiary },

  // Stat Grid
  statGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 24, padding: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, overflow: 'hidden' },
  statAccent: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 3 },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statIconContainer: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 9, fontWeight: '800', color: colors.textTertiary, letterSpacing: 0.5 },
  statBottom: { flexDirection: 'column' },
  statValue: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  statSub: { fontSize: 10, color: colors.textTertiary, fontWeight: '600' },

  // Quick Actions
  quickLinksSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 16, letterSpacing: -0.5 },
  quickActionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  qaCard: { width: (width - 52) / 2, backgroundColor: colors.surface, borderRadius: 24, padding: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, overflow: 'hidden', position: 'relative' },
  qaGradient: { ...StyleSheet.absoluteFillObject },
  qaIconContainer: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  qaTextContainer: { marginBottom: 4 },
  qaLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  qaSubText: { fontSize: 11, color: colors.textTertiary, fontWeight: '600' },
  qaChevron: { position: 'absolute', top: 16, right: 16 },

  // Celebrations
  celebrationsSection: { marginTop: 8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  celebrationScroll: { gap: 12, paddingBottom: 10 },
  birthdayCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 14, borderRadius: 24, borderWidth: 1, borderColor: colors.border, width: 220, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  birthdayInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
  birthdayName: { fontSize: 14, fontWeight: '800', color: colors.text },
  birthdayDate: { fontSize: 11, fontWeight: '700', color: colors.primary, marginTop: 2 },
  birthdayIconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});

export default DashboardScreen;

