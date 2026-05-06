import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  ImageBackground,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { getTodayStatus, getMySummary } from '../../api/attendance.api';
import { getUpcomingBirthdays } from '../../api/employee.api';
import { isManagement } from '../../utils/roleUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '../../components/common/Avatar';

const { width } = Dimensions.get('window');
const CARD_GAP = 16;
const HALF_CARD_WIDTH = (width - 48 - CARD_GAP) / 2;

// -------------------------------
// Helper Components
// -------------------------------

const SectionError = ({ message, onRetry }) => (
  <View style={styles.errorContainer}>
    <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
    <Text style={styles.errorText}>{message || 'Something went wrong'}</Text>
    <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
      <Text style={styles.retryText}>Retry</Text>
      <Ionicons name="refresh-outline" size={14} color="#fff" />
    </TouchableOpacity>
  </View>
);

const SectionEmpty = ({ title, message, icon = 'layers-outline' }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconBg}>
      <Ionicons name={icon} size={28} color="#94A3B8" />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyMessage}>{message}</Text>
  </View>
);

const StaticSkeleton = ({ width: w, height: h, style }) => (
  <View style={[{ width: w, height: h, borderRadius: 20, backgroundColor: '#E2E8F0', opacity: 0.7 }, style]} />
);

// -------------------------------
// Quick Action Component
// -------------------------------
const QuickActionItem = ({ label, icon, onPress, gradient, delay }) => (
  <TouchableOpacity style={styles.qaItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.qaIconWrapper}>
      <LinearGradient
        colors={gradient}
        style={styles.qaIconBox}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={icon} size={24} color="#fff" />
      </LinearGradient>
      {/* Subtle drop shadow mimicking the gradient color */}
      <View style={[styles.qaIconShadow, { backgroundColor: gradient[1] }]} />
    </View>
    <Text style={styles.qaLabel} numberOfLines={1}>{label}</Text>
  </TouchableOpacity>
);

// -------------------------------
// Stat Card Component
// -------------------------------
const StatCard = ({ icon, label, value, sub, colors: gradientColors }) => (
  <View style={styles.statCard}>
    {/* Background Watermark Icon */}
    <Ionicons name={icon} size={80} color={gradientColors[0]} style={styles.statWatermark} />

    <View style={[styles.statAccent, { backgroundColor: gradientColors[0] }]} />
    <View style={styles.statTop}>
      <View style={[styles.statIconContainer, { backgroundColor: gradientColors[0] + '15' }]}>
        <Ionicons name={icon} size={20} color={gradientColors[0]} />
      </View>
    </View>
    <View style={styles.statBottom}>
      <Text style={styles.statValue}>{value ?? '—'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  </View>
);

// -------------------------------
// Main Dashboard Screen
// -------------------------------
const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isAdmin = isManagement(user?.role);

  // Data fetching
  const { data: todayStatus, execute: fetchStatus, loading: statusLoading, error: statusError } = useFetch(getTodayStatus, null);
  const { data: summaryData, execute: fetchSummary, loading: summaryLoading, error: summaryError } = useFetch(
    getMySummary,
    { summary: { present: 0, absent: 0, late: 0, totalHours: 0 } }
  );
  const { data: birthdaysResponse, execute: fetchBirthdays, loading: birthdaysLoading, error: birthdaysError } = useFetch(
    getUpcomingBirthdays,
    null
  );

  const isLoading = statusLoading || summaryLoading || birthdaysLoading;
  const isInitialLoad = !todayStatus && !summaryData && !birthdaysResponse;

  // Derived data
  const birthdays = useMemo(() => {
    const data = birthdaysResponse || {};
    return [...(data.today || []), ...(data.tomorrow || [])];
  }, [birthdaysResponse]);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const onRefresh = useCallback(async () => {
    await Promise.all([fetchStatus(), fetchSummary(), fetchBirthdays()]);
  }, [fetchStatus, fetchSummary, fetchBirthdays]);

  useFocusEffect(
    useCallback(() => {
      fetchStatus();
      fetchSummary();
      fetchBirthdays();
    }, [fetchStatus, fetchSummary, fetchBirthdays])
  );

  // Time helpers
  const getGreeting = (h) => {
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const isCheckedIn = !!todayStatus?.record?.inTime;
  const isCheckedOut = !!todayStatus?.record?.outTime;
  const inTimeStr = isCheckedIn ? new Date(todayStatus.record.inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

  const summary = summaryData?.summary || { present: 0, absent: 0, late: 0, totalHours: 0 };
  const avgHours = summary.present
    ? (summary.totalHours / summary.present).toFixed(1) + 'h'
    : '—';

  // Calculate goal progress (assuming 22 working days)
  const targetDays = 22;
  const goalProgress = Math.min((summary.present / targetDays) * 100, 100);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading && !isInitialLoad} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {/* ---------- PREMIUM GRADIENT HEADER ---------- */}
        <View style={styles.headerWrapper}>
          <LinearGradient
            colors={['#1E3A8A', '#0F766E']} // Deep Blue to Deep Teal
            style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Decorative background circles */}
            <View style={styles.bgCircle1} />
            <View style={styles.bgCircle2} />

            <TouchableOpacity
              style={styles.headerTopRow}
              onPress={() => navigation.navigate('MenuTab', { screen: 'Notifications' })}
            >
              <TouchableOpacity style={styles.avatarGlow}>
                <Avatar
                  name={user?.name}
                  url={user?.profileImageUrl}
                  size={56}
                  style={styles.headerAvatar}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.notifBtn}
               // onPress={() => navigation.navigate('MenuTab', { screen: 'Announcements' })}
              >
                <Ionicons name="notifications" size={24} color="#fff" />
                <View style={styles.notifBadge} />
              </TouchableOpacity>
            </TouchableOpacity>



            <View style={styles.welcomeBox}>
              <Text style={styles.greetingText}>{getGreeting(currentTime.getHours())} <Text style={{ fontSize: 20 }}>👋</Text></Text>
              <Text style={styles.userName} numberOfLines={1}>{user?.name?.toUpperCase() || 'USER NAME'}</Text>
              <View style={styles.empBadge}>
                <Ionicons name="finger-print-outline" size={14} color="#34D399" />
                <Text style={styles.empIdText}>ID: {user?.employeeCode || 'N/A'}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Overlapping Daily Brief Card */}
          <View style={styles.statusCardWrapper}>
            <View style={styles.statusCard}>
              <View style={styles.statusHeaderRow}>
                <Text style={styles.statusLabel}>DAILY BRIEFING</Text>
                <Text style={styles.liveTimeText}>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>

              <View style={styles.statusContentRow}>
                <View style={styles.statusLeft}>
                  <View style={[styles.statusPill, isCheckedIn && !isCheckedOut && styles.statusPillActive]}>
                    <View style={[styles.statusDot, { backgroundColor: isCheckedIn && !isCheckedOut ? '#10B981' : '#94A3B8' }]} />
                    <Text style={[styles.statusText, isCheckedIn && !isCheckedOut && { color: '#047857' }]}>
                      {isCheckedIn ? (isCheckedOut ? 'Off Duty' : 'On Duty') : 'Off Duty'}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusDivider} />

                <View style={styles.statusRight}>
                  <Text style={styles.statusRightLabel}>Check-In Time</Text>
                  <Text style={styles.statusRightValue}>{inTimeStr}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.mainContent}>
          {/* ---------- QUICK ACTIONS GRID ---------- */}
          <View style={styles.quickActionsCard}>
            <View style={styles.sectionHeaderRowQA}>
              <Text style={styles.sectionTitle}>Apps & Modules</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MenuTab')}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.qaGrid}>
              <QuickActionItem
                label="Attendance"
                icon="scan"
                gradient={['#3B82F6', '#2563EB']}
                onPress={() => navigation.navigate('AttendanceTab')}
              />
              <QuickActionItem
                label="Summary"
                icon="pie-chart"
                gradient={['#2DD4BF', '#0D9488']}
                onPress={() => navigation.navigate('AttendanceTab')}
              />
              <QuickActionItem
                label="Leaves"
                icon="wallet"
                gradient={['#8B5CF6', '#6D28D9']}
                onPress={() => navigation.navigate('LeavesTab')}
              />
                            <QuickActionItem
                label="Apply Leave"
                icon="calendar-clear"
                gradient={['#F59E0B', '#D97706']}
                onPress={() => navigation.navigate('LeavesTab')}
              />


              {/* <QuickActionItem
                label="My Profile"
                icon="wallet"
                gradient={['#8B5CF6', '#6D28D9']}
                onPress={() => navigation.navigate('MenuTab', { screen: 'Profile' })}
              /> */}
            </View>
            <View style={[styles.qaGrid, { marginTop: 20 }]}>
              <QuickActionItem
                label="Directory"
                icon="people"
                gradient={['#EC4899', '#BE185D']}
                onPress={() => navigation.navigate('LeavesTab')}
              />
              <QuickActionItem
                label="Holidays"
                icon="flag"
                gradient={['#10B981', '#059669']}
                onPress={() => navigation.navigate('LeavesTab')}
              />
              <QuickActionItem
                label="Announce"
                icon="megaphone"
                gradient={['#0EA5E9', '#0369A1']}
                onPress={() => navigation.navigate('LeavesTab')}
              />
              <QuickActionItem
                label="Gurukul"
                icon="library"
                gradient={['#F43F5E', '#BE123C']}
               onPress={() => navigation.navigate('LeavesTab')}
              />
            </View>
          </View>

          {/* ---------- GOAL PROGRESS BANNER ---------- */}
          <LinearGradient
            colors={['#111827', '#1F2937']}
            style={styles.goalBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="trophy" size={40} color="rgba(255,255,255,0.05)" style={styles.goalBgIcon} />
            <View style={styles.goalInfo}>
              <Text style={styles.goalTitle}>Monthly Target</Text>
              <Text style={styles.goalSub}>Aiming for 100% attendance</Text>
            </View>
            <View style={styles.goalProgressArea}>
              <Text style={styles.goalPctText}>{Math.round(goalProgress)}%</Text>
              <View style={styles.goalTrack}>
                <LinearGradient
                  colors={['#34D399', '#10B981']}
                  style={[styles.goalFill, { width: `${goalProgress}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>
          </LinearGradient>

          {/* ---------- CELEBRATIONS ---------- */}
          <View style={styles.celebrationsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Life Events</Text>
              <View style={styles.badgeSparkle}>
                <Ionicons name="sparkles" size={14} color="#D97706" />
                <Text style={styles.badgeSparkleText}>New</Text>
              </View>
            </View>

            {birthdaysLoading && !birthdaysResponse ? (
              <StaticSkeleton width="100%" height={90} style={{ borderRadius: 24 }} />
            ) : birthdays.length === 0 ? (
              <SectionEmpty title="No Events" message="No birthdays today or tomorrow" icon="happy-outline" />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.celebrationScroll}>
                {birthdays.map((emp) => {
                  const isToday = new Date(emp.dateOfBirth).getDate() === new Date().getDate();
                  return (
                    <LinearGradient
                      key={emp.employeeCode}
                      colors={isToday ? ['#FEF3C7', '#FFFBEB'] : ['#F8FAFC', '#FFFFFF']}
                      style={[styles.birthdayCard, isToday && styles.birthdayCardToday]}
                    >
                      <Avatar name={emp.name} url={emp.profileImageUrl} size={48} />
                      <View style={styles.birthdayInfo}>
                        <Text style={styles.birthdayName} numberOfLines={1}>{emp.name}</Text>
                        <Text style={[styles.birthdayDate, isToday && { color: '#D97706', fontWeight: '800' }]}>
                          {isToday ? '🎉 Birthday Today!' : 'Upcoming Tomorrow'}
                        </Text>
                      </View>
                      <View style={[styles.birthdayIconBg, isToday ? { backgroundColor: '#FDE68A' } : { backgroundColor: '#E2E8F0' }]}>
                        <Ionicons name="gift" size={20} color={isToday ? '#D97706' : '#64748B'} />
                      </View>
                    </LinearGradient>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* ---------- STATS GRID ---------- */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Performance Insights</Text>
          </View>
          <View style={styles.statGrid}>
            <StatCard
              icon="checkmark-circle"
              label="Days Present"
              value={summary.present}
              sub="This month"
              colors={['#10B981', '#059669']}
            />
            <StatCard
              icon="close-circle"
              label="Days Absent"
              value={summary.absent}
              sub="This month"
              colors={['#EF4444', '#B91C1C']}
            />
            <StatCard
              icon="timer"
              label="Late Entries"
              value={summary.late}
              sub="Needs attention"
              colors={['#F59E0B', '#D97706']}
            />
            <StatCard
              icon="flash"
              label="Avg. Hours"
              value={avgHours}
              sub="Daily average"
              colors={['#3B82F6', '#2563EB']}
            />
          </View>
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' }, // Softer, more premium background
  scrollContent: { flexGrow: 1 },

  // --- Premium Header ---
  headerWrapper: { marginBottom: 40 },
  headerGradient: {
    paddingHorizontal: 24,
    paddingBottom: 90,
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    top: -50,
    right: -20,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, zIndex: 2 },
  avatarGlow: {
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderRadius: 30,
  },
  headerAvatar: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' },
  notifBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  notifBadge: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#0F766E',
  },
  welcomeBox: { marginTop: 4, zIndex: 2 },
  greetingText: { fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: '700', marginBottom: 4, letterSpacing: 0.5 },
  userName: { fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -1, textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  empBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  empIdText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 1 },

  // --- Daily Brief Card ---
  statusCardWrapper: {
    position: 'absolute',
    bottom: -35,
    left: 20,
    right: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  statusHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusLabel: { fontSize: 11, fontWeight: '900', color: '#64748B', letterSpacing: 1.5 },
  liveTimeText: { fontSize: 12, fontWeight: '800', color: '#3B82F6', backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },

  statusContentRow: { flexDirection: 'row', alignItems: 'center' },
  statusLeft: { flex: 1 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusPillActive: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontWeight: '800', color: '#475569' },

  statusDivider: { width: 1, height: 40, backgroundColor: '#E2E8F0', marginHorizontal: 16 },

  statusRight: { flex: 1, alignItems: 'flex-end' },
  statusRightLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginBottom: 4 },
  statusRightValue: { fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },

  // --- Main Content ---
  mainContent: { paddingHorizontal: 20, paddingTop: 10 },

  // --- Quick Actions ---
  quickActionsCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  sectionHeaderRowQA: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  sectionTitle: { fontSize: 19, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  seeAllText: { fontSize: 13, fontWeight: '800', color: '#3B82F6' },
  qaGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  qaItem: { alignItems: 'center', width: (width - 88) / 4 },
  qaIconWrapper: { marginBottom: 12, alignItems: 'center' },
  qaIconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  qaIconShadow: {
    position: 'absolute',
    bottom: -4,
    width: 46,
    height: 46,
    borderRadius: 16,
    opacity: 0.4,
    zIndex: 1,
    filter: 'blur(8px)',
  },
  qaLabel: { fontSize: 11, fontWeight: '800', color: '#475569', textAlign: 'center' },

  // --- Goal Banner ---
  goalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 28,
    marginBottom: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  goalBgIcon: { position: 'absolute', right: -10, top: -10, transform: [{ rotate: '15deg' }] },
  goalInfo: { flex: 1 },
  goalTitle: { fontSize: 15, fontWeight: '900', color: '#fff', marginBottom: 4 },
  goalSub: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  goalProgressArea: { alignItems: 'flex-end', width: 80 },
  goalPctText: { fontSize: 18, fontWeight: '900', color: '#34D399', marginBottom: 6 },
  goalTrack: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 3 },

  // --- Celebrations ---
  celebrationsSection: { marginBottom: 28 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  badgeSparkle: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeSparkleText: { fontSize: 10, fontWeight: '900', color: '#D97706', textTransform: 'uppercase' },
  celebrationScroll: { paddingBottom: 8 },
  birthdayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    width: 260,
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  birthdayCardToday: { borderColor: '#FDE68A', elevation: 4, shadowColor: '#F59E0B', shadowOpacity: 0.1 },
  birthdayInfo: { flex: 1, marginLeft: 14 },
  birthdayName: { fontSize: 15, fontWeight: '900', color: '#0F172A', marginBottom: 2 },
  birthdayDate: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  birthdayIconBg: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  // --- Stats Grid ---
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP, marginTop: 8 },
  statCard: {
    width: HALF_CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  statWatermark: { position: 'absolute', right: -20, bottom: -20, opacity: 0.04, transform: [{ rotate: '-15deg' }] },
  statAccent: { position: 'absolute', top: 20, left: 0, bottom: 20, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  statIconContainer: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statBottom: {},
  statValue: { fontSize: 28, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5, marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: '800', color: '#475569' },
  statSub: { fontSize: 10, color: '#94A3B8', fontWeight: '700', marginTop: 4 },

  // --- Errors ---
  errorContainer: { padding: 24, backgroundColor: 'rgba(239,68,68,0.05)', borderRadius: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.1)' },
  errorText: { fontSize: 14, fontWeight: '700', color: '#EF4444', marginTop: 12, marginBottom: 16 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EF4444', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  emptyContainer: { padding: 30, backgroundColor: '#fff', borderRadius: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  emptyIconBg: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  emptyMessage: { fontSize: 13, color: '#64748B', fontWeight: '600', marginTop: 4, textAlign: 'center' },
});

export default DashboardScreen;