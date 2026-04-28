import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/colors';
import { useFetch } from '../../hooks/useFetch';
import { getPendingLeaves, approveLeave, rejectLeave } from '../../api/leave.api';
import AppCard from '../../components/common/AppCard';
import Avatar from '../../components/common/Avatar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/dateUtils';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const LeaveApprovalScreen = ({ navigation }) => {
  const { data, loading, execute: fetchLeaves } = useFetch(getPendingLeaves, null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [remarks, setRemarks] = useState('');

  const onRefresh = useCallback(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleApprove = async (id) => {
    try {
      setActionLoading(id);
      await approveLeave(id, { remarks: 'Approved via Mobile' });
      Toast.show({ type: 'success', text1: 'Leave Approved' });
      fetchLeaves();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Approval Failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!remarks.trim()) {
      Toast.show({ type: 'error', text1: 'Remark Required', text2: 'Please provide a reason for rejection' });
      return;
    }
    try {
      setActionLoading(selectedReq._id);
      await rejectLeave(selectedReq._id, { remarks });
      Toast.show({ type: 'success', text1: 'Leave Rejected' });
      setRejectModalVisible(false);
      setRemarks('');
      fetchLeaves();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Rejection Failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (req) => {
    setSelectedReq(req);
    setRemarks('');
    setRejectModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <AppCard style={styles.card}>
      <View style={styles.cardAccent} />
      
      <View style={styles.cardTop}>
        <View style={styles.userInfo}>
          <Avatar url={item.employee?.profileImageUrl} name={item.employee?.name} size={44} />
          <View style={styles.nameSection}>
            <Text style={styles.userName}>{item.employee?.name}</Text>
            <Text style={styles.userCode}>{item.employee?.employeeCode} • {item.employee?.department || 'Staff'}</Text>
          </View>
        </View>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{item.leaveType}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsGrid}>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>DURATION</Text>
          <Text style={styles.detailValue}>{item.totalDays} {item.totalDays === 1 ? 'Day' : 'Days'}</Text>
          {item.halfDay && <Text style={styles.halfDayBadge}>{item.halfDayPeriod}</Text>}
        </View>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>DATES</Text>
          <Text style={styles.detailValueSmall}>{formatDate(item.startDate)} – {formatDate(item.endDate)}</Text>
        </View>
      </View>

      <View style={styles.reasonSection}>
        <Text style={styles.reasonLabel}>REASON</Text>
        <Text style={styles.reasonText}>"{item.reason}"</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.rejectBtn]} 
          onPress={() => openRejectModal(item)}
          disabled={!!actionLoading}
        >
          <Ionicons name="close-circle-outline" size={18} color={colors.error} />
          <Text style={styles.rejectBtnText}>Reject</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionBtnContainer, { flex: 2 }]} 
          onPress={() => handleApprove(item._id)}
          disabled={!!actionLoading}
        >
          <LinearGradient
            colors={colors.gradients.primary}
            style={styles.approveBtn}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {actionLoading === item._id ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.approveBtnText}>Approve</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </AppCard>
  );

  return (
    <View style={styles.container}>
      {loading && !data ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={data?.leaves || []}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[colors.gradients.secondary[0]]} />}
          ListEmptyComponent={<EmptyState icon="checkmark-done-circle-outline" title="All Caught Up!" message="No pending leave requests found." />}
        />
      )}

      {/* Reject Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rejection Remark</Text>
            <Text style={styles.modalSub}>Provide a reason for rejecting {selectedReq?.employee?.name}'s request.</Text>
            <TextInput 
              style={styles.modalInput}
              placeholder="E.g. Critical project deadline, check-in missing..."
              multiline
              value={remarks}
              onChangeText={setRemarks}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setRejectModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleReject} disabled={!!actionLoading}>
                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalConfirmText}>Confirm Reject</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContainer: { padding: 16, paddingBottom: 100 },
  card: { marginBottom: 16, borderRadius: 28, padding: 20, position: 'relative', overflow: 'hidden' },
  cardAccent: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, backgroundColor: colors.gradients.primary[0] },
  
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  nameSection: { marginLeft: 12 },
  userName: { fontSize: 16, fontWeight: '800', color: colors.text },
  userCode: { fontSize: 12, color: colors.textTertiary, fontWeight: '600', marginTop: 2 },
  
  typeBadge: { backgroundColor: colors.gradients.secondary[0] + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  typeText: { fontSize: 10, fontWeight: '900', color: colors.gradients.secondary[0] },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: 18, opacity: 0.6 },
  
  detailsGrid: { flexDirection: 'row', gap: 24, marginBottom: 16 },
  detailCol: { flex: 1 },
  detailLabel: { fontSize: 9, fontWeight: '900', color: colors.textTertiary, letterSpacing: 0.5, marginBottom: 6 },
  detailValue: { fontSize: 15, fontWeight: '800', color: colors.textSecondary },
  detailValueSmall: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  halfDayBadge: { fontSize: 9, fontWeight: '800', backgroundColor: colors.gradients.accent[0] + '15', color: colors.gradients.accent[0], alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },

  reasonSection: { backgroundColor: colors.surfaceAlt, padding: 14, borderRadius: 16, marginBottom: 20 },
  reasonLabel: { fontSize: 9, fontWeight: '900', color: colors.textTertiary, marginBottom: 6 },
  reasonText: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', lineHeight: 18 },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionBtnContainer: { shadowColor: colors.gradients.primary[0], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  rejectBtn: { borderWidth: 1.5, borderColor: colors.error },
  rejectBtnText: { color: colors.error, fontWeight: '800', fontSize: 14 },
  approveBtn: { flex: 1, height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  approveBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: colors.surface, borderRadius: 32, padding: 24, width: '100%', elevation: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 8 },
  modalSub: { fontSize: 14, color: colors.textSecondary, marginBottom: 20, lineHeight: 20 },
  modalInput: { backgroundColor: colors.surfaceAlt, borderRadius: 16, padding: 16, fontSize: 15, height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
  modalBtnRow: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, height: 54, borderRadius: 16, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { color: colors.textSecondary, fontWeight: '700', fontSize: 15 },
  modalConfirmBtn: { flex: 2, height: 54, borderRadius: 16, backgroundColor: colors.error, justifyContent: 'center', alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default LeaveApprovalScreen;
