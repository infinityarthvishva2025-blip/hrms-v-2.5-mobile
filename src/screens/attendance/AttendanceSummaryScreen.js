import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  StatusBar 
} from 'react-native';
import { colors } from '../../constants/colors';
import { getMySummary } from '../../api/attendance.api';
import AppCard from '../../components/common/AppCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const MiniStat = ({ label, value, color, icon, loading }) => (
  <View style={styles.statBox}>
    <View style={[styles.statIconBg, { backgroundColor: color + '10' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <View>
      <Text style={styles.statValue}>{loading ? '—' : value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    <View style={[styles.statAccent, { backgroundColor: color }]} />
  </View>
);

const AttendanceSummaryScreen = ({ navigation }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchSummary = useCallback(async (date) => {
    setLoading(true);
    try {
      const from = format(startOfMonth(date), 'yyyy-MM-dd');
      const to = format(endOfMonth(date), 'yyyy-MM-dd');
      const { data: res } = await getMySummary({ from, to });
      setData(res.data);
    } catch (error) {
      console.error('Summary fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary(currentDate);
  }, [currentDate, fetchSummary]);

  const onRefresh = useCallback(() => {
    fetchSummary(currentDate);
  }, [currentDate, fetchSummary]);

  const changeMonth = (offset) => {
    const newDate = offset > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    setCurrentDate(newDate);
  };

  const renderItem = ({ item }) => {
    const isWeekOff = item.status === 'WO' || item.status === 'Week Off';
    const isAbsent = item.status === 'A' || item.status === 'Absent';
    const isHoliday = item.status === 'H' || item.status === 'Holiday';
    
    const formatTimeVal = (timeStr) => {
      if (!timeStr) return '--:--';
      try {
        const d = new Date(timeStr);
        return format(d, 'hh:mm a');
      } catch (e) {
        return '--:--';
      }
    };

    const checkInTime = formatTimeVal(item.inTime);
    const checkOutTime = formatTimeVal(item.outTime);
    
    const canCorrect = item.status && !['A', 'H', 'WO'].includes(item.status);
    const isToday = isSameDay(new Date(item.date), new Date());

    return (
      <AppCard style={[styles.recordCard, isToday && styles.todayCard]}>
        <View style={styles.cardHeader}>
           <View style={styles.dateBlock}>
              <Text style={styles.dateNum}>{format(new Date(item.date), 'dd')}</Text>
              <Text style={styles.dateDay}>{format(new Date(item.date), 'EEE').toUpperCase()}</Text>
           </View>
           <View style={styles.headerInfo}>
              <View style={styles.badgeRow}>
                 <StatusBadge status={item.status} />
                 {item.isLate && !isWeekOff && !isHoliday && (
                    <View style={styles.latePill}>
                       <Ionicons name="alert-circle" size={12} color="#F59E0B" />
                       <Text style={styles.lateText}>Late {item.lateMinutes}m</Text>
                    </View>
                 )}
                 {isToday && <View style={styles.todayChip}><Text style={styles.todayChipText}>TODAY</Text></View>}
              </View>
              <View style={styles.timeGrid}>
                 <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>IN</Text>
                    <Text style={[styles.timeValue, item.inTime && styles.timeActive]}>
                       {isWeekOff || isAbsent || isHoliday ? '—' : checkInTime}
                    </Text>
                 </View>
                 <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>OUT</Text>
                    <Text style={[styles.timeValue, item.outTime && styles.timeActive]}>
                       {isWeekOff || isAbsent || isHoliday ? '—' : checkOutTime}
                    </Text>
                 </View>
                 <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>HRS</Text>
                    <Text style={[styles.timeValue, item.totalHours > 0 && { color: colors.primary }]}>
                       {item.totalHours ? item.totalHours.toFixed(1) + 'h' : '—'}
                    </Text>
                 </View>
              </View>
           </View>
        </View>

        {(item.correctionRequested || canCorrect) && (
          <View style={styles.cardFooter}>
            {item.correctionRequested ? (
              <View style={styles.correctionStatus}>
                <Ionicons name="sync-circle" size={16} color={colors.primary} />
                <Text style={styles.correctionStatusText}>
                  Correction: {item.correctionStatus?.replace('Pending_', '') || 'Pending'}
                </Text>
              </View>
            ) : canCorrect ? (
              <TouchableOpacity 
                style={styles.correctionAction}
                onPress={() => navigation.navigate('CorrectionRequest', { record: item })}
                activeOpacity={0.6}
              >
                <Text style={styles.correctionActionText}>Request Correction</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </AppCard>
    );
  };

  const avgHours = useMemo(() => {
    if (!data?.summary?.present) return '—';
    return (data.summary.totalHours / data.summary.present).toFixed(1);
  }, [data]);

  const ListHeader = () => (
    <View style={styles.whiteHeader}>
      {/* Month Navigator - Clean White Design */}
      <View style={styles.monthNavigator}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.monthDisplay}>
           <Text style={styles.monthTitleText}>{format(currentDate, 'MMMM yyyy')}</Text>
        </View>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.statsContainer}
      >
        <MiniStat icon="checkmark-circle" label="Present" value={data?.summary?.present} color="#10B981" loading={loading} />
        <MiniStat icon="close-circle" label="Absent" value={data?.summary?.absent} color="#EF4444" loading={loading} />
        <MiniStat icon="alarm-outline" label="Late" value={data?.summary?.late} color="#F59E0B" loading={loading} />
        <MiniStat icon="calendar" label="Week Off" value={data?.summary?.weekOff} color="#6366F1" loading={loading} />
        <MiniStat icon="time-outline" label="Avg Hrs" value={avgHours !== '—' ? avgHours + 'h' : '—'} color="#EC4899" loading={loading} />
      </ScrollView>

      <View style={styles.sectionHeader}>
         <Text style={styles.sectionTitle}>Daily Attendance Log</Text>
         <View style={styles.sectionLine} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {loading && !data ? (
        <View style={styles.loader}>
          <LoadingSpinner />
        </View>
      ) : (
        <FlatList
          data={data?.records || []}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listPadding}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState title="No Records" message="Attendance data unavailable for this period." />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' }, // Set main background to white
  
  whiteHeader: {
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
  },
  monthNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 10,
  },
  monthDisplay: { flexDirection: 'row', alignItems: 'center' },
  monthTitleText: { fontSize: 24, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  navBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  
  statsContainer: { paddingHorizontal: 20, gap: 12, marginBottom: 10 },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 14,
    paddingRight: 20,
    gap: 12,
    minWidth: 135,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8,
  },
  statIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '900', color: '#1E293B', lineHeight: 22 },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  statAccent: { position: 'absolute', right: 0, top: '25%', bottom: '25%', width: 3, borderTopLeftRadius: 3, borderBottomLeftRadius: 3 },

  sectionHeader: { paddingHorizontal: 20, marginTop: 24, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#F1F5F9' },

  listPadding: { paddingBottom: 40 },
  
  recordCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 24, padding: 0, overflow: 'hidden', elevation: 2, shadowOpacity: 0.04, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9' },
  todayCard: { borderColor: colors.primary, borderWidth: 1.5 },
  
  cardHeader: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  dateBlock: { width: 50, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#F1F5F9', paddingRight: 14, marginRight: 14 },
  dateNum: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  dateDay: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginTop: 2 },
  
  headerInfo: { flex: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  latePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#FEF3C7' },
  lateText: { fontSize: 10, fontWeight: '800', color: '#D97706' },
  todayChip: { backgroundColor: colors.primary + '10', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  todayChipText: { fontSize: 9, fontWeight: '900', color: colors.primary },
  
  timeGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  timeItem: { flex: 1 },
  timeLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', marginBottom: 4, letterSpacing: 0.5 },
  timeValue: { fontSize: 13, fontWeight: '900', color: '#CBD5E1' },
  timeActive: { color: '#334155' },
  
  cardFooter: { borderTopWidth: 1, borderTopColor: '#F8FAFC', padding: 12, backgroundColor: '#F9FAFB' },
  correctionAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  correctionActionText: { fontSize: 13, fontWeight: '800', color: colors.primary },
  correctionStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary + '05', paddingVertical: 6, borderRadius: 10 },
  correctionStatusText: { fontSize: 11, fontWeight: '800', color: colors.primary },
  
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }
});

export default AttendanceSummaryScreen;
