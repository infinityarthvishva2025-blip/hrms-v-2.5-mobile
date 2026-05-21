import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  Modal,
  Dimensions,
  Platform,
  InteractionManager
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../../constants/colors';
import { getMySummary } from '../../api/attendance.api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Avatar from '../../components/common/Avatar';

const { width } = Dimensions.get('window');

const StatCard = ({ label, value, color, icon, loading }) => (
  <View style={styles.statCard}>
    <LinearGradient
      colors={[color + '20', color + '05']}
      style={styles.statIconBox}
    >
      <Ionicons name={icon} size={16} color={color} />
    </LinearGradient>
    <View style={styles.statInfo}>
      <Text style={[styles.statValue, { color: colors.text }]}>{loading ? '-' : value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

const AttendanceSummaryScreen = ({ navigation }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async (date, silent = false, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (!silent) setLoading(true);
    if (!silent && !isRefresh) setError(null);

    try {
      const from = format(startOfMonth(date), 'yyyy-MM-dd');
      const to = format(endOfMonth(date), 'yyyy-MM-dd');
      const { data: res } = await getMySummary({ from, to, _bypassCache: true });
      setData(res.data);
      setError(null);
    } catch (err) {
      const isNetworkError = !err.response;
      const serverMsg = err.response?.data?.message;
      setError(
        isNetworkError
          ? 'No internet connection. Check your network and try again.'
          : serverMsg || 'Failed to load attendance data. Please try again.'
      );
    } finally {
      if (isRefresh) setRefreshing(false);
      if (!silent) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let interval;
      const task = InteractionManager.runAfterInteractions(() => {
        fetchSummary(currentDate);
        interval = setInterval(() => {
          fetchSummary(currentDate, true);
        }, 45000);
      });
      return () => {
        task.cancel();
        if (interval) clearInterval(interval);
      };
    }, [currentDate, fetchSummary])
  );

  const onRefresh = useCallback(() => {
    fetchSummary(currentDate, false, true);
  }, [currentDate, fetchSummary]);

  const changeMonth = (offset) => {
    const newDate = offset > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    setCurrentDate(newDate);
  };

  const getStatusColor = (status) => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'P': case 'PRESENT': return '#10B981';
      case 'A': case 'ABSENT': return '#EF4444';
      case 'HD': case 'HALF DAY': return '#F59E0B';
      case 'WO': case 'WEEK OFF': return '#6366F1';
      case 'H': case 'HOLIDAY': return '#DB2777';
      case 'COFF': return '#8B5CF6';
      default: return colors.border;
    }
  };

  const renderItem = ({ item }) => {
    const myAtt = item.myAttendance;
    const shared = item.sharedReports || [];
    const statusColor = getStatusColor(item.status);
    
    const dateObj = new Date(item.date);
    const dayNum = dateObj.getUTCDate();
    const dayName = format(dateObj, 'EEE', { timeZone: 'UTC' }).toUpperCase();
    
    const isToday = isSameDay(dateObj, new Date());
    const hasReport = !!(myAtt?.todayWork || shared.length > 0);
    const canCorrect = myAtt && !['WO', 'H'].includes(item.status) && !myAtt.correctionRequested;

    const formatTime = (timeStr) => {
      if (!timeStr) return '--:--';
      try {
        return format(new Date(timeStr), 'hh:mm a');
      } catch (e) {
        return '--:--';
      }
    };

    return (
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => setSelectedDay(item)}
        style={styles.gridCardContainer}
      >
        <View style={[styles.gridCard, isToday && styles.todayGridCard]}>
          <View style={[styles.gridCardAccent, { backgroundColor: statusColor }]} />
          
          <View style={styles.gridCardHeader}>
            <View style={styles.gridDateBox}>
              <Text style={[styles.gridDateNum, isToday && {color: colors.primary}]}>{dayNum}</Text>
              <Text style={styles.gridDateDay}>{dayName}</Text>
            </View>
            <View style={styles.gridStatusBox}>
               <StatusBadge status={item.status} size="small" />
            </View>
          </View>
          
          <View style={styles.gridCardBody}>
            {item.holiday && (
              <Text style={styles.holidayName} numberOfLines={1}>
                {item.holiday.name}
              </Text>
            )}
            <View style={styles.gridTimeRow}>
              <Text style={styles.gridTimeLabel}>IN</Text>
              <Text style={[styles.gridTimeVal, myAtt?.inTime && {color: colors.text, fontWeight: '800'}]}>
                {myAtt?.inTime ? formatTime(myAtt.inTime) : '—'}
              </Text>
            </View>
            <View style={styles.gridTimeRow}>
              <Text style={styles.gridTimeLabel}>OUT</Text>
              <Text style={[styles.gridTimeVal, myAtt?.outTime && {color: colors.text, fontWeight: '800'}]}>
                {myAtt?.outTime ? formatTime(myAtt.outTime) : '—'}
              </Text>
            </View>
            <View style={styles.gridTimeRow}>
              <Text style={styles.gridTimeLabel}>HRS</Text>
              <Text style={[styles.gridTimeVal, { color: statusColor, fontWeight: '900', fontSize: 12 }]}>
                {myAtt?.totalHours ? `${myAtt.totalHours.toFixed(1)}h` : '—'}
              </Text>
            </View>
          </View>

          <View style={styles.gridCardFooter}>
            {myAtt?.correctionRequested ? (
              <View style={styles.gridFooterBadge}>
                <Ionicons name="time-outline" size={10} color="#A16207" style={{marginRight: 4}} />
                <Text style={styles.gridFooterTextWarn}>Pending</Text>
              </View>
            ) : canCorrect ? (
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => navigation.navigate('CorrectionRequest', { record: myAtt })}
                style={styles.gridActionBtnContainer}
              >
                <LinearGradient
                  colors={colors.gradients.primary}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.gridActionBtn}
                >
                  <Ionicons name="create-outline" size={12} color="#fff" style={{marginRight: 4}} />
                  <Text style={styles.gridCorrectBtnText}>Correct</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : hasReport ? (
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setSelectedDay(item)}
                style={styles.gridActionBtnContainer}
              >
                <View style={[styles.gridActionBtn, { backgroundColor: colors.primary + '10', borderRadius: 10, borderWidth: 1, borderColor: colors.primary + '20' }]}>
                  <Ionicons name="document-text-outline" size={12} color={colors.primary} style={{marginRight: 4}} />
                  <Text style={styles.gridReportText}>Report</Text>
                </View>
              </TouchableOpacity>
            ) : (
               <View style={styles.emptyFooter}>
                 <Ionicons name="ellipse" size={4} color={colors.border} />
               </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const avgHours = useMemo(() => {
    if (!data?.summary?.present) return '0.0';
    return (data.summary.totalHours / data.summary.present).toFixed(1);
  }, [data]);

  const ListHeader = () => (
    <View style={styles.header}>
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNavBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.monthTitleBox}>
          <Text style={styles.monthTitle}>{format(currentDate, 'MMMM yyyy')}</Text>
        </View>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavBtn}>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <StatCard icon="checkmark-circle" label="Present" value={data?.summary?.present || 0} color="#10B981" loading={loading} />
        <StatCard icon="close-circle" label="Absent" value={data?.summary?.absent || 0} color="#EF4444" loading={loading} />
        <StatCard icon="alert-circle" label="Late" value={data?.summary?.late || 0} color="#F59E0B" loading={loading} />
        <StatCard icon="trending-up" label="Avg Hrs" value={`${avgHours}h`} color="#8B5CF6" loading={loading} />
      </View>
    </View>
  );

  const ReportSection = ({ title, content, icon, color }) => {
    if (!content) return null;
    return (
      <View style={styles.reportSection}>
        <View style={styles.reportSectionHeader}>
          <View style={[styles.reportIconCircle, {backgroundColor: color + '15'}]}>
            <Ionicons name={icon} size={14} color={color} />
          </View>
          <Text style={[styles.reportSectionTitle, { color }]}>{title}</Text>
        </View>
        <View style={styles.reportContentBox}>
          <Text style={styles.reportContentText}>{content}</Text>
        </View>
      </View>
    );
  };

  const DailyDetailModal = () => {
    if (!selectedDay) return null;
    const myAtt = selectedDay.myAttendance;
    const shared = selectedDay.sharedReports || [];
    const dateObj = new Date(selectedDay.date);

    return (
      <Modal 
        visible={!!selectedDay} 
        transparent 
        animationType="slide" 
        onRequestClose={() => setSelectedDay(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalDismiss} 
            activeOpacity={1} 
            onPress={() => setSelectedDay(null)} 
          />
          <View style={styles.modalContent}>
            <View style={styles.modalIndicator} />
            
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{format(dateObj, 'EEEE, dd MMMM')}</Text>
                <View style={styles.modalSubRow}>
                  <StatusBadge status={selectedDay.status} size="small" />
                  {selectedDay.holiday && (
                    <Text style={styles.modalHolidayTag}>• {selectedDay.holiday.name}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedDay(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {myAtt && (
                <View style={styles.modalGroup}>
                  <View style={styles.modalGroupHeader}>
                    <Text style={styles.modalGroupTitle}>MY REPORT</Text>
                    <LinearGradient
                      colors={colors.gradients.primary}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={styles.modalGroupBadge}
                    >
                      <Text style={styles.modalGroupBadgeText}>{myAtt.totalHours?.toFixed(1)}h logged</Text>
                    </LinearGradient>
                  </View>
                  
                  <ReportSection 
                    title="TODAY'S WORK" 
                    content={myAtt.todayWork} 
                    icon="briefcase" 
                    color={colors.primary} 
                  />
                  <ReportSection 
                    title="PENDING TASKS" 
                    content={myAtt.pendingWork} 
                    icon="list" 
                    color="#F59E0B" 
                  />
                  <ReportSection 
                    title="ISSUES FACED" 
                    content={myAtt.issuesFaced} 
                    icon="alert-circle" 
                    color="#EF4444" 
                  />
                </View>
              )}

              {shared.length > 0 && (
                <View style={styles.modalGroup}>
                  <Text style={styles.modalGroupTitle}>TEAM REPORTS ({shared.length})</Text>
                  {shared.map((report, idx) => (
                    <View key={idx} style={styles.teamCard}>
                      <View style={styles.teamCardHeader}>
                        <Avatar name={report.employeeId?.name} url={report.employeeId?.profileImageUrl} size={36} />
                        <View style={styles.teamUserInfo}>
                          <Text style={styles.teamName}>{report.employeeId?.name}</Text>
                          <Text style={styles.teamMeta}>{report.employeeId?.employeeCode} • {report.totalHours?.toFixed(1)}h</Text>
                        </View>
                      </View>
                      <View style={styles.teamCardBody}>
                        <Text style={styles.teamReportText}>{report.todayWork}</Text>
                        {report.pendingWork && (
                           <View style={styles.teamSubSection}>
                              <Ionicons name="arrow-redo-outline" size={14} color="#F59E0B" style={{marginRight: 6}} />
                              <Text style={styles.teamSubText}>{report.pendingWork}</Text>
                           </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {!myAtt?.todayWork && shared.length === 0 && (
                <View style={styles.emptyModalState}>
                  <Ionicons name="document-text-outline" size={60} color={colors.border} />
                  <Text style={styles.emptyModalText}>No detailed reports available for this date.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={data?.records || []}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        numColumns={2}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.rowWrapper}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          loading && !data ? (
            <View style={styles.centerBox}><LoadingSpinner /></View>
          ) : error ? (
            <View style={styles.errorBox}>
              <View style={styles.errorIconBg}>
                <Ionicons name="cloud-offline-outline" size={44} color="#EF4444" />
              </View>
              <Text style={styles.errorTitle}>Something went wrong</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity
                onPress={() => fetchSummary(currentDate)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={colors.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.retryBtn}
                >
                  <Ionicons name="refresh" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.retryBtnText}>Retry</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <EmptyState title="No Records" message="No attendance data for this period" />
          )
        }
        showsVerticalScrollIndicator={false}
      />
      <DailyDetailModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerBox: { paddingVertical: 60, alignItems: 'center' },
  listContent: { paddingBottom: 120 },
  errorBox: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  errorIconBg: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  errorMessage: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  rowWrapper: {
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  // Header Styles
  header: { 
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    marginBottom: 20,
  },
  monthSelector: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 8,
  },
  monthTitleBox: { flexDirection: 'row', alignItems: 'center' },
  monthNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  monthTitle: { fontSize: 17, fontWeight: '900', color: colors.text, letterSpacing: -0.2 },

  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  statCard: { 
    alignItems: 'center',
    flex: 1,
  },
  statIconBox: { 
    width: 36, 
    height: 36, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 8
  },
  statInfo: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 9, fontWeight: '800', color: colors.textTertiary, textTransform: 'uppercase', marginTop: 1 },

  // Grid Card Styles
  gridCardContainer: { 
    width: (width - 48) / 2,
  },
  gridCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  todayGridCard: { 
    borderColor: colors.primary, 
    borderWidth: 1.5,
    backgroundColor: '#FBFCFF'
  },
  gridCardAccent: { width: 4, height: '100%', position: 'absolute', left: 0, top: 0 },
  
  gridCardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  gridDateBox: { alignItems: 'flex-start', marginLeft: 6 },
  gridDateNum: { fontSize: 22, fontWeight: '900', color: colors.text, lineHeight: 24 },
  gridDateDay: { fontSize: 10, fontWeight: '800', color: colors.textTertiary, marginTop: 1 },
  gridStatusBox: { alignItems: 'flex-end' },

  gridCardBody: { paddingHorizontal: 12, paddingBottom: 10, marginLeft: 6 },
  holidayName: { fontSize: 9, fontWeight: '800', color: '#DB2777', marginBottom: 6, textTransform: 'uppercase' },
  gridTimeRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 5
  },
  gridTimeLabel: { fontSize: 9, fontWeight: '900', color: colors.textTertiary, width: 28 },
  gridTimeVal: { fontSize: 11, fontWeight: '700', color: colors.textTertiary },

  gridCardFooter: {
    paddingHorizontal: 10,
    paddingBottom: 12,
    alignItems: 'center',
  },
  gridActionBtnContainer: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden'
  },
  gridActionBtn: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  gridCorrectBtnText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  gridReportText: { fontSize: 11, fontWeight: '800', color: colors.primary },
  
  gridFooterBadge: {
    backgroundColor: '#FEFCE8',
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEF08A'
  },
  gridFooterTextWarn: { fontSize: 9, fontWeight: '900', color: '#A16207', textTransform: 'uppercase' },
  emptyFooter: { height: 32, justifyContent: 'center' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalDismiss: { ...StyleSheet.absoluteFillObject },
  modalContent: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 36, 
    borderTopRightRadius: 36, 
    height: '88%', 
    paddingTop: 12,
    paddingHorizontal: 24
  },
  modalIndicator: { 
    width: 36, 
    height: 5, 
    backgroundColor: '#E5E7EB', 
    borderRadius: 3, 
    alignSelf: 'center', 
    marginBottom: 20 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 24 
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  modalSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  modalHolidayTag: { fontSize: 13, fontWeight: '700', color: '#DB2777', marginLeft: 8 },
  modalCloseBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#F3F4F6', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  modalScroll: { paddingBottom: 60 },
  modalGroup: { marginBottom: 30 },
  modalGroupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalGroupTitle: { fontSize: 11, fontWeight: '900', color: colors.textTertiary, letterSpacing: 1.5 },
  modalGroupBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  modalGroupBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  reportSection: { marginBottom: 20 },
  reportSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  reportIconCircle: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  reportSectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.2 },
  reportContentBox: { backgroundColor: '#F9FAFB', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#F3F4F6' },
  reportContentText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, fontWeight: '500' },

  teamCard: { 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  teamCardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 14, 
    backgroundColor: '#F9FAFB', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6',
  },
  teamUserInfo: { marginLeft: 12 },
  teamName: { fontSize: 15, fontWeight: '800', color: colors.text },
  teamMeta: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, marginTop: 1 },
  teamCardBody: { padding: 18 },
  teamReportText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  teamSubSection: { marginTop: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', padding: 10, borderRadius: 12 },
  teamSubText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', flex: 1 },

  emptyModalState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyModalText: { fontSize: 15, color: colors.textTertiary, marginTop: 16, textAlign: 'center', fontWeight: '700' }
});

export default AttendanceSummaryScreen;
