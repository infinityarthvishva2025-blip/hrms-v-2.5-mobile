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
  Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay } from 'date-fns';

import { colors } from '../../constants/colors';
import { getMySummary } from '../../api/attendance.api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Avatar from '../../components/common/Avatar';

const { width } = Dimensions.get('window');

const StatCard = ({ label, value, color, icon, loading }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={14} color={color} />
    </View>
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

  const fetchSummary = useCallback(async (date, silent = false, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (!silent) setLoading(true);

    try {
      const from = format(startOfMonth(date), 'yyyy-MM-dd');
      const to = format(endOfMonth(date), 'yyyy-MM-dd');
      const { data: res } = await getMySummary({ from, to });
      setData(res.data);
    } catch (error) {
      console.error('Summary fetch error:', error);
    } finally {
      if (isRefresh) setRefreshing(false);
      if (!silent) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSummary(currentDate);
      const interval = setInterval(() => {
        fetchSummary(currentDate, true);
      }, 45000); 
      return () => clearInterval(interval);
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
      case 'H': case 'HOLIDAY': return '#3B82F6';
      case 'COFF': return '#EC4899';
      default: return colors.border;
    }
  };

  const renderItem = ({ item }) => {
    const myAtt = item.myAttendance;
    const shared = item.sharedReports || [];
    const statusColor = getStatusColor(item.status);
    
    // Safely parse date
    let dateObj;
    try {
      dateObj = new Date(item.date);
      if (isNaN(dateObj.getTime())) throw new Error("Invalid date");
    } catch (e) {
      dateObj = new Date(); // fallback to prevent crash
    }
    
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
        activeOpacity={0.8} 
        onPress={() => setSelectedDay(item)}
        style={styles.gridCardContainer}
      >
        <View style={[styles.gridCard, isToday && styles.todayGridCard]}>
          <View style={[styles.gridCardAccent, { backgroundColor: statusColor }]} />
          
          <View style={styles.gridCardHeader}>
            <View style={styles.gridDateBox}>
              <Text style={styles.gridDateNum}>{format(dateObj, 'dd')}</Text>
              <Text style={styles.gridDateDay}>{format(dateObj, 'EEE').toUpperCase()}</Text>
            </View>
            <View style={styles.gridStatusBox}>
               <StatusBadge status={item.status} size="small" />
            </View>
          </View>
          
          <View style={styles.gridCardBody}>
            <View style={styles.gridTimeRow}>
              <Text style={styles.gridTimeLabel}>IN</Text>
              <Text style={styles.gridTimeVal}>{myAtt?.inTime ? formatTime(myAtt.inTime) : '—'}</Text>
            </View>
            <View style={styles.gridTimeRow}>
              <Text style={styles.gridTimeLabel}>OUT</Text>
              <Text style={styles.gridTimeVal}>{myAtt?.outTime ? formatTime(myAtt.outTime) : '—'}</Text>
            </View>
            <View style={styles.gridTimeRow}>
              <Text style={styles.gridTimeLabel}>HRS</Text>
              <Text style={[styles.gridTimeVal, { color: colors.primary, fontWeight: '800' }]}>
                {myAtt?.totalHours ? `${myAtt.totalHours.toFixed(1)}h` : '—'}
              </Text>
            </View>
          </View>

          <View style={styles.gridCardFooter}>
            {myAtt?.correctionRequested ? (
              <View style={styles.gridFooterBadge}>
                <Text style={styles.gridFooterTextWarn}>Pending</Text>
              </View>
            ) : canCorrect ? (
              <TouchableOpacity 
                style={styles.gridCorrectBtn}
                onPress={() => navigation.navigate('CorrectionRequest', { record: myAtt })}
              >
                <Text style={styles.gridCorrectBtnText}>Correct</Text>
              </TouchableOpacity>
            ) : hasReport ? (
              <TouchableOpacity style={styles.gridReportBtn} onPress={() => setSelectedDay(item)}>
                <Text style={styles.gridReportText}>Report</Text>
              </TouchableOpacity>
            ) : (
               <View style={{height: 24}} /> // Placeholder for empty footer space
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
          <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{format(currentDate, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavBtn}>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <StatCard icon="checkmark-done" label="Present" value={data?.summary?.present || 0} color="#10B981" loading={loading} />
        <StatCard icon="close-circle" label="Absent" value={data?.summary?.absent || 0} color="#EF4444" loading={loading} />
        <StatCard icon="time" label="Late" value={data?.summary?.late || 0} color="#F59E0B" loading={loading} />
        <StatCard icon="speedometer" label="Avg Hrs" value={`${avgHours}h`} color="#8B5CF6" loading={loading} />
      </View>
    </View>
  );

  const ReportSection = ({ title, content, icon, color }) => {
    if (!content) return null;
    return (
      <View style={styles.reportSection}>
        <View style={styles.reportSectionHeader}>
          <Ionicons name={icon} size={16} color={color} />
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
    let dateObj;
    try {
      dateObj = new Date(selectedDay.date);
      if (isNaN(dateObj.getTime())) throw new Error();
    } catch (e) {
      dateObj = new Date();
    }

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
                <Text style={styles.modalSubTitle}>Daily Attendance Report</Text>
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
                    <View style={styles.modalGroupBadge}>
                      <Text style={styles.modalGroupBadgeText}>{myAtt.totalHours?.toFixed(1)}h logged</Text>
                    </View>
                  </View>
                  
                  <ReportSection 
                    title="TODAY'S WORK" 
                    content={myAtt.todayWork} 
                    icon="briefcase-outline" 
                    color={colors.primary} 
                  />
                  <ReportSection 
                    title="PENDING TASKS" 
                    content={myAtt.pendingWork} 
                    icon="list-outline" 
                    color="#F59E0B" 
                  />
                  <ReportSection 
                    title="ISSUES FACED" 
                    content={myAtt.issuesFaced} 
                    icon="alert-circle-outline" 
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
                        <Avatar name={report.employeeId?.name} url={report.employeeId?.profileImageUrl} size={40} />
                        <View style={styles.teamUserInfo}>
                          <Text style={styles.teamName}>{report.employeeId?.name}</Text>
                          <Text style={styles.teamMeta}>{report.employeeId?.employeeCode} • {report.totalHours?.toFixed(1)}h</Text>
                        </View>
                      </View>
                      <View style={styles.teamCardBody}>
                        <Text style={styles.teamReportText}>{report.todayWork}</Text>
                        {report.pendingWork && (
                           <View style={styles.teamSubSection}>
                              <Text style={styles.teamSubLabel}>Pending: </Text>
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
  listContent: { paddingBottom: 40 },
  rowWrapper: {
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  // Header Styles (White & Single Line Stats)
  header: { 
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    marginBottom: 16,
  },
  monthSelector: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: 16
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  monthTitle: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: 0.5 },

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
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 4
  },
  statInfo: { alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '900' },
  statLabel: { fontSize: 9, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase' },

  // Grid Card Styles (2 columns)
  gridCardContainer: { 
    width: (width - 36) / 2, // 12px padding on each side (24) + 12px gap between (12) = 36. 
  },
  gridCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  todayGridCard: { 
    borderColor: colors.primary + '50', 
    borderWidth: 1.5 
  },
  gridCardAccent: { width: '100%', height: 4 },
  
  gridCardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC'
  },
  gridDateBox: { alignItems: 'flex-start' },
  gridDateNum: { fontSize: 20, fontWeight: '900', color: colors.text, lineHeight: 22 },
  gridDateDay: { fontSize: 10, fontWeight: '700', color: colors.textTertiary, marginTop: 1 },
  gridStatusBox: { alignItems: 'flex-end' },

  gridCardBody: { padding: 12 },
  gridTimeRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 6
  },
  gridTimeLabel: { fontSize: 9, fontWeight: '800', color: colors.textTertiary, width: 30 },
  gridTimeVal: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },

  gridCardFooter: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  gridCorrectBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center'
  },
  gridCorrectBtnText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  
  gridReportBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center'
  },
  gridReportText: { fontSize: 11, fontWeight: '800', color: colors.textSecondary },
  
  gridFooterBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  gridFooterTextWarn: { fontSize: 11, fontWeight: '800', color: '#D97706' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalDismiss: { ...StyleSheet.absoluteFillObject },
  modalContent: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    height: '85%', 
    paddingTop: 12,
    paddingHorizontal: 24
  },
  modalIndicator: { 
    width: 40, 
    height: 4, 
    backgroundColor: '#E2E8F0', 
    borderRadius: 2, 
    alignSelf: 'center', 
    marginBottom: 20 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 24 
  },
  modalTitle: { fontSize: 24, fontWeight: '900', color: colors.text },
  modalSubTitle: { fontSize: 14, fontWeight: '600', color: colors.textTertiary, marginTop: 4 },
  modalCloseBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  modalScroll: { paddingBottom: 40 },
  modalGroup: { marginBottom: 30 },
  modalGroupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalGroupTitle: { fontSize: 12, fontWeight: '900', color: colors.textTertiary, letterSpacing: 1 },
  modalGroupBadge: { backgroundColor: colors.primary + '10', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  modalGroupBadgeText: { fontSize: 11, fontWeight: '800', color: colors.primary },

  reportSection: { marginBottom: 20 },
  reportSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  reportSectionTitle: { fontSize: 13, fontWeight: '800' },
  reportContentBox: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  reportContentText: { fontSize: 15, color: colors.textSecondary, lineHeight: 24 },

  teamCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  teamCardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    backgroundColor: '#F8FAFC', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  teamUserInfo: { marginLeft: 12 },
  teamName: { fontSize: 15, fontWeight: '800', color: colors.text },
  teamMeta: { fontSize: 12, fontWeight: '600', color: colors.textTertiary, marginTop: 2 },
  teamCardBody: { padding: 16 },
  teamReportText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  teamSubSection: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap' },
  teamSubLabel: { fontSize: 13, fontWeight: '800', color: '#F59E0B' },
  teamSubText: { fontSize: 13, color: colors.textSecondary },

  emptyModalState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyModalText: { fontSize: 15, color: colors.textTertiary, marginTop: 16, textAlign: 'center', fontWeight: '600' }
});

export default AttendanceSummaryScreen;


