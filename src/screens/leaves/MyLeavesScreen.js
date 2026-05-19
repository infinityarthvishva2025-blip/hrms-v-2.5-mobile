import React, { useCallback, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { useFetch } from '../../hooks/useFetch';
import { getMyLeaves, cancelLeave } from '../../api/leave.api';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';

// ── Leave type config ──────────────────────────────────────────────────────────
const LEAVE_CONFIG = {
  Paid:    { icon: 'cash',           color: '#10B981', bg: '#ECFDF5' },
  Sick:    { icon: 'medical',        color: '#EF4444', bg: '#FEF2F2' },
  CompOff: { icon: 'gift',           color: '#8B5CF6', bg: '#F5F3FF' },
  Casual:  { icon: 'cafe',           color: '#3B82F6', bg: '#EFF6FF' },
  Unpaid:  { icon: 'alert-circle',   color: '#F59E0B', bg: '#FFFBEB' },
  Other:   { icon: 'ellipsis-horizontal-circle', color: '#64748B', bg: '#F8FAFC' },
};

const STATUS_CONFIG = {
  Pending:   { color: '#F59E0B', bg: '#FFFBEB', icon: 'time' },
  Approved:  { color: '#10B981', bg: '#ECFDF5', icon: 'checkmark-circle' },
  Rejected:  { color: '#EF4444', bg: '#FEF2F2', icon: 'close-circle' },
  Cancelled: { color: '#94A3B8', bg: '#F8FAFC', icon: 'ban' },
};

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'];

// ── Balance Chip ───────────────────────────────────────────────────────────────
const BalChip = ({ val, label, color, bgIcon }) => (
  <View style={bs.chip}>
    <View style={[bs.iconCircle, { backgroundColor: bgIcon }]}>
      <Ionicons name={label === 'PAID' ? 'cash-outline' : 'gift-outline'} size={16} color={color} />
    </View>
    <Text style={[bs.chipVal, { color }]}>{val ?? 0}</Text>
    <Text style={bs.chipLbl}>{label}</Text>
  </View>
);
const bs = StyleSheet.create({
  chip:    { flex: 1, alignItems: 'center', paddingVertical: 10 },
  iconCircle: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  chipVal: { fontSize: 18, fontWeight: '900' },
  chipLbl: { fontSize: 9, fontWeight: '800', color: colors.textTertiary, marginTop: 2, letterSpacing: 0.5 },
});

// ── Leave Card ─────────────────────────────────────────────────────────────────
const LeaveCard = ({ item, onCancel, cancelLoading }) => {
  const cfg    = LEAVE_CONFIG[item.leaveType] || LEAVE_CONFIG.Other;
  const stCfg  = STATUS_CONFIG[item.overallStatus] || STATUS_CONFIG.Pending;
  const isPending = item.overallStatus === 'Pending';

  return (
    <View style={lc.card}>
      <View style={[lc.accent, { backgroundColor: cfg.color }]} />

      <View style={lc.body}>
        {/* Header Row */}
        <View style={lc.headerRow}>
          <View style={[lc.iconBox, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={20} color={cfg.color} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={lc.typeText}>{item.leaveType} Leave</Text>
            <Text style={lc.daysText}>{item.totalDays} {item.totalDays === 1 ? 'day' : 'days'}{item.halfDay ? ' · Half Day' : ''}</Text>
          </View>
          <View style={[lc.statusBadge, { backgroundColor: stCfg.bg }]}>
            <Ionicons name={stCfg.icon} size={12} color={stCfg.color} />
            <Text style={[lc.statusText, { color: stCfg.color }]}>{item.overallStatus}</Text>
          </View>
        </View>

        {/* Date Range */}
        <View style={lc.dateRow}>
          <View style={lc.dateItem}>
            <Text style={lc.dateLabel}>FROM</Text>
            <Text style={lc.dateValue}>{format(new Date(item.startDate), 'dd MMM, yyyy')}</Text>
          </View>
          <View style={lc.dateArrow}>
            <Ionicons name="arrow-forward" size={14} color="#CBD5E1" />
          </View>
          <View style={[lc.dateItem, { alignItems: 'flex-end' }]}>
            <Text style={lc.dateLabel}>TO</Text>
            <Text style={lc.dateValue}>{format(new Date(item.endDate), 'dd MMM, yyyy')}</Text>
          </View>
        </View>

        {/* Reason */}
        {item.reason ? (
          <View style={lc.reasonBox}>
            <Ionicons name="chatbox-ellipses-outline" size={13} color="#94A3B8" />
            <Text style={lc.reasonText} numberOfLines={2}>{item.reason}</Text>
          </View>
        ) : null}

        {/* Approval Stage (if pending) */}
        {isPending && item.currentApproverRole && item.currentApproverRole !== 'Completed' && (
          <View style={lc.stageRow}>
            <Ionicons name="hourglass-outline" size={12} color="#F59E0B" />
            <Text style={lc.stageText}>Awaiting {item.currentApproverRole} approval</Text>
          </View>
        )}

        {/* Cancel Button */}
        {isPending && (
          <TouchableOpacity
            style={lc.cancelBtn}
            onPress={() => onCancel(item._id)}
            disabled={!!cancelLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle-outline" size={15} color="#EF4444" />
            <Text style={lc.cancelText}>
              {cancelLoading === item._id ? 'Cancelling...' : 'Cancel Request'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const lc = StyleSheet.create({
  card:       { backgroundColor: '#fff', borderRadius: 20, marginBottom: 16, flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  accent:     { width: 4 },
  body:       { flex: 1, padding: 16 },
  headerRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconBox:    { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  typeText:   { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  daysText:   { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800' },

  dateRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 10 },
  dateItem:  { flex: 1 },
  dateArrow: { width: 32, alignItems: 'center' },
  dateLabel: { fontSize: 9, fontWeight: '900', color: '#CBD5E1', letterSpacing: 0.8, marginBottom: 4 },
  dateValue: { fontSize: 13, fontWeight: '800', color: '#334155' },

  reasonBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, marginBottom: 8 },
  reasonText:{ fontSize: 12, color: '#64748B', fontStyle: 'italic', flex: 1, lineHeight: 18 },

  stageRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  stageText: { fontSize: 11, fontWeight: '700', color: '#F59E0B' },

  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, marginTop: 6, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  cancelText:{ color: '#EF4444', fontWeight: '800', fontSize: 12 },
});

// ── Main Screen ────────────────────────────────────────────────────────────────
const MyLeavesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [filter, setFilter]             = useState('All');
  const [cancelLoading, setCancelLoading] = useState(null);

  const { data, loading, execute: fetchLeaves } = useFetch(getMyLeaves, null);

  useFocusEffect(useCallback(() => { fetchLeaves(); }, [fetchLeaves]));

  const onRefresh = useCallback(() => fetchLeaves(), [fetchLeaves]);

  const handleCancel = (id) => {
    Alert.alert('Cancel Leave', 'Are you sure you want to cancel this leave request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            setCancelLoading(id);
            await cancelLeave(id);
            Toast.show({ type: 'success', text1: 'Cancelled', text2: 'Leave request has been cancelled.' });
            fetchLeaves();
          } catch {
            Toast.show({ type: 'error', text1: 'Failed', text2: 'Could not cancel. Please retry.' });
          } finally {
            setCancelLoading(null);
          }
        },
      },
    ]);
  };

  const allLeaves = data?.leaves || [];
  const summary   = data?.summary || {};

  const filtered = useMemo(() => {
    if (filter === 'All') return allLeaves;
    return allLeaves.filter((l) => l.overallStatus === filter);
  }, [allLeaves, filter]);

  if (loading && !data) {
    return <View style={styles.center}><LoadingSpinner /></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Beautiful Premium Balance & Stats Card ── */}
      <View style={styles.balCardContainer}>
        {/* Balances */}
        {/* <View style={styles.balRow}>
          <BalChip val={user?.paidLeaveBalance} label="PAID"     color="#10B981" bgIcon="#10B98112" />
          <View style={styles.balDivide} />
          <BalChip val={user?.compOffBalance}   label="COMP-OFF" color="#8B5CF6" bgIcon="#8B5CF612" />
        </View> */}

        <View style={styles.horizontalLine} />

        {/* Summary Stats */}
        <View style={styles.summaryRow}>
          {[
            { label: 'Total', val: summary.total ?? allLeaves.length, color: colors.primary },
            { label: 'Approved', val: summary.approved ?? 0, color: '#10B981' },
            { label: 'Pending',  val: summary.pending  ?? 0, color: '#F59E0B' },
            { label: 'Rejected', val: summary.rejected ?? 0, color: '#EF4444' },
          ].map((s) => (
            <View key={s.label} style={styles.summaryChip}>
              <Text style={[styles.summaryVal, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.summaryLbl}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Filter Bar ── */}
      <View style={styles.filterWrap}>
        <FlatList
          data={FILTERS}
          keyExtractor={(f) => f}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item: f }) => {
            const active = filter === f;
            return (
              <TouchableOpacity
                onPress={() => setFilter(f)}
                style={[styles.filterChip, active && styles.filterChipActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <LeaveCard item={item} onCancel={handleCancel} cancelLoading={cancelLoading} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title={filter === 'All' ? 'No Leaves Yet' : `No ${filter} Leaves`}
            message={filter === 'All'
              ? "You haven't applied for any leaves yet."
              : `You have no ${filter.toLowerCase()} leave applications.`}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Bal & Stats Card
  balCardContainer: { margin: 16, marginBottom: 8, backgroundColor: '#fff', borderRadius: 28, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 3 },
  balRow:      { flexDirection: 'row', alignItems: 'center' },
  balDivide: { width: 1, height: 40, backgroundColor: '#F1F5F9' },
  horizontalLine: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },

  summaryRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  summaryChip: { flex: 1, alignItems: 'center' },
  summaryVal:  { fontSize: 17, fontWeight: '900' },
  summaryLbl:  { fontSize: 9, fontWeight: '800', color: colors.textTertiary, marginTop: 3, letterSpacing: 0.5 },

  // Filter
  filterWrap: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, marginBottom: 4 },
  filterList: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9',
    borderWidth: 1.5, borderColor: '#F1F5F9' },
  filterChipActive: { backgroundColor: colors.primary + '12', borderColor: colors.primary },
  filterText:       { fontSize: 13, fontWeight: '700', color: '#64748B' },
  filterTextActive: { color: colors.primary },

  // List
  listContent: { padding: 16, paddingBottom: 100 },
});

export default MyLeavesScreen;
