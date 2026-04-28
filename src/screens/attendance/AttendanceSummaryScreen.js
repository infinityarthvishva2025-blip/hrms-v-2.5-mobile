import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';
import { getMySummary } from '../../api/attendance.api';
import AppCard from '../../components/common/AppCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatTime } from '../../utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

const { width } = Dimensions.get('window');

const MiniStat = ({ label, value, color, icon, loading }) => (
  <View style={[styles.statBox, { borderBottomColor: color }]}>
    <View style={[styles.statIconWrapper, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <Text style={styles.statValue}>{loading ? '—' : value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
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
    
    const checkInTime = item.inTime ? formatTime(new Date(item.inTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})) : '--:--';
    const checkOutTime = item.outTime ? formatTime(new Date(item.outTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})) : '--:--';
    
    const canCorrect = item.status && !['A', 'H', 'WO'].includes(item.status);

    return (
      <AppCard style={styles.recordCard}>
        <View style={styles.cardHeader}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
               <Text style={styles.dateText}>{format(new Date(item.date), 'dd MMM')}</Text>
               <Text style={styles.dayText}>{format(new Date(item.date), 'EEE')}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <StatusBadge status={item.status} />
            {item.isLate && !isWeekOff && (
              <View style={styles.latePill}>
                <Text style={styles.latePillText}>Late {item.lateMinutes}m</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.timeRow}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>In</Text>
            <Text style={[styles.timeValueMain, { color: colors.success }]}>{isWeekOff || isAbsent ? '—' : checkInTime}</Text>
          </View>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Out</Text>
            <Text style={[styles.timeValueMain, { color: colors.primary }]}>{isWeekOff || isAbsent ? '—' : checkOutTime}</Text>
          </View>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Hrs</Text>
            <Text style={styles.timeValueMain}>{item.totalHours ? item.totalHours.toFixed(1) + 'h' : '—'}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {item.correctionRequested ? (
            <View style={styles.correctionBadge}>
              <Ionicons name="time" size={12} color={colors.primary} />
              <Text style={styles.correctionText}>
                Correction {item.correctionStatus?.split('_')[1] || 'Pending'}
              </Text>
            </View>
          ) : canCorrect ? (
            <TouchableOpacity 
              style={styles.correctBtn}
              onPress={() => navigation.navigate('CorrectionRequest', { record: item })}
            >
              <Text style={styles.correctBtnText}>Request Correction</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          ) : <View h={1} />}
        </View>
      </AppCard>
    );
  };

  const avgHours = data?.summary?.present > 0 ? (data.summary.totalHours / data.summary.present).toFixed(1) : '—';

  return (
    <View style={styles.container}>
      <View style={styles.monthNavigator}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.monthDisplay}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text style={styles.monthText}>{format(currentDate, 'MMMM yyyy')}</Text>
        </View>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
          <MiniStat icon="checkmark-circle" label="Present" value={data?.summary?.present} color={colors.success} loading={loading} />
          <MiniStat icon="close-circle" label="Absent" value={data?.summary?.absent} color={colors.error} loading={loading} />
          <MiniStat icon="time" label="Late Ins" value={data?.summary?.late} color={colors.warning} loading={loading} />
          <MiniStat icon="calendar" label="Week Off" value={data?.summary?.weekOff} color={colors.primary} loading={loading} />
          <MiniStat icon="trending-up" label="Avg Hrs" value={avgHours !== '—' ? avgHours + 'h' : '—'} color={colors.accent || colors.secondary} loading={loading} />
        </ScrollView>
      </View>

      {loading && !data ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={data?.records || []}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState title="No Records Found" message="Try switching months" />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  monthNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  monthDisplay: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  monthText: { fontSize: 17, fontWeight: '800', color: colors.text, minWidth: 140, textAlign: 'center' },
  navBtn: { padding: 8, backgroundColor: colors.surfaceAlt, borderRadius: 12 },
  
  statsContainer: { height: 110, marginTop: 12 },
  statsScroll: { paddingHorizontal: 16, gap: 10 },
  statBox: {
    width: (width - 64) / 3,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIconWrapper: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', marginTop: 2 },

  listContainer: { padding: 16, paddingBottom: 32 },
  recordCard: { marginBottom: 12, padding: 16, borderRadius: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  dateText: { fontSize: 16, fontWeight: '800', color: colors.text },
  dayText: { fontSize: 12, color: colors.textTertiary, fontWeight: '600' },
  latePill: { backgroundColor: colors.warning + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: colors.warning + '30' },
  latePillText: { fontSize: 10, fontWeight: '800', color: colors.warning },
  
  timeRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: colors.surfaceAlt, 
    padding: 14, 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeBlock: { flex: 1, alignItems: 'center' },
  timeLabel: { fontSize: 10, color: colors.textTertiary, textTransform: 'uppercase', fontWeight: '800', marginBottom: 4 },
  timeValueMain: { fontSize: 15, fontWeight: '900', color: colors.text },
  
  cardFooter: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  correctBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  correctBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  correctionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary + '10', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, alignSelf: 'flex-start' },
  correctionText: { fontSize: 11, fontWeight: '800', color: colors.primary },
});

export default AttendanceSummaryScreen;
