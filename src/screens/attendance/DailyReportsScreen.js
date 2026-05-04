import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput, Modal, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { colors } from '../../constants/colors';
import { useFetch } from '../../hooks/useFetch';
import { getAdminAttendance, markReportAsRead } from '../../api/attendance.api';
import AppCard from '../../components/common/AppCard';
import Avatar from '../../components/common/Avatar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';

const DailyReportsScreen = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Unread', 'Read'
  const [dateRange, setDateRange] = useState('Today'); // 'Today', 'This Week', 'This Month'
  
  // Modal for report details
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReportsFunc = useCallback(async () => {
    let from, to;
    const now = new Date();
    if (dateRange === 'Today') {
      from = startOfDay(now);
      to = endOfDay(now);
    } else if (dateRange === 'This Week') {
      from = startOfWeek(now, { weekStartsOn: 1 });
      to = endOfWeek(now, { weekStartsOn: 1 });
    } else if (dateRange === 'This Month') {
      from = startOfMonth(now);
      to = endOfMonth(now);
    }

    const { data } = await getAdminAttendance({ 
      from: from.toISOString(), 
      to: to.toISOString(), 
      limit: 500 
    });
    
    // Filter records that have todayWork content
    return data.records.filter(r => r.todayWork);
  }, [dateRange]);

  const { data: reports, loading, execute: fetchReports } = useFetch(fetchReportsFunc, null);

  const onRefresh = useCallback(() => {
    fetchReports();
  }, [fetchReports]);

  // Re-fetch when dateRange changes
  React.useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const handleMarkRead = async (id) => {
    setActionLoading(true);
    try {
      await markReportAsRead(id);
      Toast.show({ type: 'success', text1: 'Report Acknowledged' });
      fetchReports();
      setSelectedReport(null);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Action Failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    return reports.filter(r => {
      const matchesSearch = r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isRead = r.reportReadBy?.includes(user?._id);
      
      if (filterStatus === 'Read') return matchesSearch && isRead;
      if (filterStatus === 'Unread') return matchesSearch && !isRead;
      return matchesSearch;
    });
  }, [reports, searchTerm, filterStatus, user]);

  const renderItem = ({ item }) => {
    const isRead = item.reportReadBy?.includes(user?._id);
    const workMode = item.workMode || 'Office';
    const totalHours = item.totalHours || 0;
    
    const workModeColor = workMode === 'Office' ? colors.primary : (workMode === 'Field' ? colors.secondary : colors.accent);

    return (
      <TouchableOpacity onPress={() => setSelectedReport(item)} activeOpacity={0.7}>
        <AppCard style={styles.card}>
          {!isRead && <View style={styles.unreadIndicator} />}
          
          <View style={styles.cardHeader}>
            <View style={styles.userInfo}>
              <Avatar url={item.employee?.profileImageUrl} name={item.employeeName} size={40} />
              <View style={styles.nameSection}>
                <Text style={styles.userName}>{item.employeeName}</Text>
                <Text style={styles.userCode}>{format(new Date(item.date), 'dd MMM yyyy')}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={[styles.workModeBadge, { backgroundColor: workModeColor + '15' }]}>
                <Ionicons name={workMode === 'Office' ? 'home' : (workMode === 'Field' ? 'location' : 'laptop')} size={10} color={workModeColor} />
                <Text style={[styles.workModeText, { color: workModeColor }]}>{workMode}</Text>
              </View>
              {item.issuesFaced ? (
                <View style={styles.blockerBadge}>
                  <Ionicons name="alert-circle" size={10} color={colors.error} />
                  <Text style={styles.blockerText}>Blocker</Text>
                </View>
              ) : (
                <View style={styles.trackBadge}>
                  <Ionicons name="checkmark-circle" size={10} color={colors.success} />
                  <Text style={styles.trackText}>On Track</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.reportPreview} numberOfLines={2}>
            {item.todayWork}
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.timeRow}>
               <View style={styles.timeChip}>
                  <Ionicons name="enter-outline" size={12} color={colors.textTertiary} />
                  <Text style={styles.timeText}>{item.inTime ? format(new Date(item.inTime), 'hh:mm a') : '--'}</Text>
               </View>
               <View style={styles.timeChip}>
                  <Ionicons name="exit-outline" size={12} color={colors.textTertiary} />
                  <Text style={styles.timeText}>{item.outTime ? format(new Date(item.outTime), 'hh:mm a') : '--'}</Text>
               </View>
               <View style={[styles.timeChip, { backgroundColor: colors.primary + '10' }]}>
                  <Ionicons name="time-outline" size={12} color={colors.primary} />
                  <Text style={[styles.timeText, { color: colors.primary, fontWeight: '700' }]}>{totalHours.toFixed(1)}h</Text>
               </View>
            </View>
            <Text style={styles.readStatus}>
              {isRead ? 'Acknowledged' : 'Pending'}
            </Text>
          </View>
        </AppCard>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search & Filter Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput 
            placeholder="Search team members..." 
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
          <View style={styles.filterGroup}>
            {['Today', 'This Week', 'This Month'].map((opt) => (
              <TouchableOpacity 
                key={opt}
                onPress={() => setDateRange(opt)}
                style={[styles.filterBtn, dateRange === opt && styles.filterBtnActive]}
              >
                <Text style={[styles.filterText, dateRange === opt && styles.filterTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.filterDivider} />
          <View style={styles.filterGroup}>
            {['All', 'Unread', 'Read'].map((opt) => (
              <TouchableOpacity 
                key={opt}
                onPress={() => setFilterStatus(opt)}
                style={[styles.filterBtn, filterStatus === opt && styles.filterBtnActive]}
              >
                <Text style={[styles.filterText, filterStatus === opt && styles.filterTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {loading && !reports ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="document-text-outline" title="No Reports Found" message={`Try changing the filters to see more reports`} />}
        />
      )}

      {/* Report Detail Modal */}
      <Modal visible={!!selectedReport} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                 <Avatar name={selectedReport?.employeeName} size={48} />
                 <View>
                    <Text style={styles.modalUserName}>{selectedReport?.employeeName}</Text>
                    <Text style={styles.modalDate}>{selectedReport && format(new Date(selectedReport.date), 'EEEE, dd MMM yyyy')}</Text>
                 </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedReport(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              
              <View style={styles.modalMetrics}>
                 <View style={styles.modalMetricItem}>
                    <Text style={styles.modalMetricLabel}>Clock In</Text>
                    <Text style={styles.modalMetricValue}>{selectedReport?.inTime ? format(new Date(selectedReport.inTime), 'hh:mm a') : '--'}</Text>
                 </View>
                 <View style={styles.modalMetricItem}>
                    <Text style={styles.modalMetricLabel}>Clock Out</Text>
                    <Text style={styles.modalMetricValue}>{selectedReport?.outTime ? format(new Date(selectedReport.outTime), 'hh:mm a') : '--'}</Text>
                 </View>
                 <View style={styles.modalMetricItem}>
                    <Text style={styles.modalMetricLabel}>Mode</Text>
                    <Text style={[styles.modalMetricValue, { color: colors.primary }]}>{selectedReport?.workMode || 'Office'}</Text>
                 </View>
                 <View style={styles.modalMetricItem}>
                    <Text style={styles.modalMetricLabel}>Hours</Text>
                    <Text style={styles.modalMetricValue}>{selectedReport?.totalHours ? selectedReport.totalHours.toFixed(1) + 'h' : '--'}</Text>
                 </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="checkmark-done-circle" size={18} color={colors.success} />
                  <Text style={styles.sectionTitle}>TASKS COMPLETED</Text>
                </View>
                <View style={styles.reportBox}>
                   <Text style={styles.reportContent}>{selectedReport?.todayWork}</Text>
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="time" size={18} color={colors.primary} />
                  <Text style={styles.sectionTitle}>PENDING TASKS</Text>
                </View>
                <View style={[styles.reportBox, { borderColor: colors.border }]}>
                   <Text style={[styles.reportContent, !selectedReport?.pendingWork && { fontStyle: 'italic', color: colors.textTertiary }]}>
                     {selectedReport?.pendingWork || 'No pending tasks reported.'}
                   </Text>
                </View>
              </View>

              {selectedReport?.issuesFaced ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="alert-triangle" size={18} color={colors.error} />
                    <Text style={[styles.sectionTitle, { color: colors.error }]}>BLOCKERS & ISSUES</Text>
                  </View>
                  <View style={[styles.reportBox, { backgroundColor: colors.error + '08', borderColor: colors.error + '20' }]}>
                     <Text style={[styles.reportContent, { color: colors.error }]}>{selectedReport?.issuesFaced}</Text>
                  </View>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedReport(null)}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
              {!selectedReport?.reportReadBy?.includes(user?._id) && (
                <TouchableOpacity 
                  style={styles.ackBtn} 
                  onPress={() => handleMarkRead(selectedReport?._id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Ionicons name="checkmark-done" size={20} color="#fff" />
                      <Text style={styles.ackText}>Acknowledge</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    padding: 16, 
    paddingBottom: 10,
    backgroundColor: colors.surface, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: colors.text, fontWeight: '600' },
  filterGroup: { flexDirection: 'row', gap: 8 },
  filterDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: 12, marginVertical: 6 },
  filterBtn: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 12, 
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  filterTextActive: { color: '#fff' },
  
  listContainer: { padding: 16, paddingBottom: 100 },
  card: { marginBottom: 12, padding: 16, borderRadius: 20, position: 'relative' },
  unreadIndicator: { position: 'absolute', top: 16, left: 0, width: 4, height: 40, backgroundColor: colors.accent, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  nameSection: { marginLeft: 12 },
  userName: { fontSize: 15, fontWeight: '800', color: colors.text },
  userCode: { fontSize: 11, color: colors.textTertiary, fontWeight: '600', marginTop: 2 },
  
  workModeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  workModeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },

  blockerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.error + '12', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  blockerText: { fontSize: 10, fontWeight: '800', color: colors.error },
  trackBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.success + '12', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  trackText: { fontSize: 10, fontWeight: '800', color: colors.success },
  
  reportPreview: { fontSize: 14, color: colors.textSecondary, marginTop: 14, lineHeight: 20 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  timeRow: { flexDirection: 'row', gap: 8 },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceAlt, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 },
  timeText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },

  readStatus: { fontSize: 11, color: colors.textTertiary, fontWeight: '700' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '90%', padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalUserName: { fontSize: 20, fontWeight: '900', color: colors.text },
  modalDate: { fontSize: 13, color: colors.textTertiary, fontWeight: '600', marginTop: 2 },
  closeBtn: { padding: 4 },
  
  modalMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24, backgroundColor: colors.surfaceAlt, padding: 12, borderRadius: 16 },
  modalMetricItem: { flex: 1, minWidth: '40%' },
  modalMetricLabel: { fontSize: 10, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', marginBottom: 2 },
  modalMetricValue: { fontSize: 14, fontWeight: '800', color: colors.text },

  modalBody: { paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: colors.textTertiary, letterSpacing: 1 },
  reportBox: { backgroundColor: colors.surfaceAlt, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  reportContent: { fontSize: 15, color: colors.text, lineHeight: 24 },

  modalFooter: { flexDirection: 'row', gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  modalCloseBtn: { flex: 1, height: 56, borderRadius: 18, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  modalCloseText: { fontSize: 16, fontWeight: '700', color: colors.textSecondary },
  ackBtn: { flex: 2, height: 56, borderRadius: 18, backgroundColor: colors.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ackText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});

export default DailyReportsScreen;
