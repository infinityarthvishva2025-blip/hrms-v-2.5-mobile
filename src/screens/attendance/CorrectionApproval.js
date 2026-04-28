import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput, Modal, ActivityIndicator, ScrollView, Linking } from 'react-native';
import { colors } from '../../constants/colors';
import { useFetch } from '../../hooks/useFetch';
import { getPendingCorrections, approveCorrection, rejectCorrection } from '../../api/attendance.api';
import AppCard from '../../components/common/AppCard';
import Avatar from '../../components/common/Avatar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

const CorrectionApproval = () => {
  const { data, loading, execute: fetchCorrections } = useFetch(getPendingCorrections, null);
  const [actionLoading, setActionLoading] = useState(null);
  const [remarks, setRemarks] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal for rejection remarks
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [tempRemark, setTempRemark] = useState('');

  const onRefresh = useCallback(() => {
    fetchCorrections();
  }, [fetchCorrections]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(req => 
      req.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      req.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const handleApprove = async (id) => {
    try {
      setActionLoading(id);
      const remark = remarks[id] || 'Approved';
      await approveCorrection(id, { remark });
      Toast.show({ type: 'success', text1: 'Correction Approved' });
      fetchCorrections();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Approval Failed', text2: err.response?.data?.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!tempRemark.trim()) {
      Toast.show({ type: 'error', text1: 'Remark Required', text2: 'Please provide a reason for rejection' });
      return;
    }
    try {
      setActionLoading(selectedReqId);
      await rejectCorrection(selectedReqId, { remark: tempRemark });
      Toast.show({ type: 'success', text1: 'Correction Rejected' });
      setRejectModalVisible(false);
      setTempRemark('');
      fetchCorrections();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Rejection Failed', text2: err.response?.data?.message });
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (id) => {
    setSelectedReqId(id);
    setTempRemark('');
    setRejectModalVisible(true);
  };

  const formatT = (s) => s ? format(new Date(s), 'hh:mm a') : '--';

  const renderItem = ({ item }) => (
    <AppCard style={styles.card}>
      <View style={styles.cardAccent} />
      
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Avatar url={item.employee?.profileImageUrl} name={item.employeeName} size={44} />
          <View style={styles.nameSection}>
            <Text style={styles.userName}>{item.employeeName}</Text>
            <Text style={styles.userCode}>{item.employeeCode} • {format(new Date(item.date), 'dd MMM yyyy')}</Text>
          </View>
        </View>
        <View style={styles.stageBadge}>
          <Text style={styles.stageText}>STAGE: {item.correctionStatus?.split('_')[1] || 'Pending'}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Comparison Grid */}
      <View style={styles.comparisonGrid}>
        <View style={styles.comparisonCol}>
          <Text style={styles.colLabel}>Current</Text>
          <Text style={styles.colValueOld}>{formatT(item.inTime)} – {formatT(item.outTime)}</Text>
        </View>
        <View style={styles.comparisonCol}>
          <Text style={[styles.colLabel, { color: colors.primary }]}>Requested</Text>
          <Text style={styles.colValueNew}>{formatT(item.requestedInTime)} – {formatT(item.requestedOutTime)}</Text>
        </View>
      </View>

      <View style={styles.reasonBox}>
        <Text style={styles.reasonLabel}>REASON</Text>
        <Text style={styles.reasonText}>"{item.correctionReason}"</Text>
        {item.correctionProofUrl && (
          <TouchableOpacity onPress={() => Linking.openURL(item.correctionProofUrl)} style={styles.proofBtn}>
            <Ionicons name="document-attach-outline" size={14} color={colors.primary} />
            <Text style={styles.proofBtnText}>View Supporting Proof</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actionSection}>
        <TextInput 
          placeholder="Add optional remarks..." 
          style={styles.remarkInput}
          value={remarks[item._id] || ''}
          onChangeText={(t) => setRemarks(prev => ({ ...prev, [item._id]: t }))}
        />
        <View style={styles.btnRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.rejectBtn]} 
            onPress={() => openRejectModal(item._id)}
            disabled={!!actionLoading}
          >
            <Ionicons name="close-circle-outline" size={18} color={colors.error} />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.approveBtn]} 
            onPress={() => handleApprove(item._id)}
            disabled={!!actionLoading}
          >
            {actionLoading === item._id ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.approveBtnText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </AppCard>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput 
            placeholder="Search employee..." 
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && !data ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="checkmark-done-circle-outline" title="All Caught Up!" message="No pending correction requests found." />}
        />
      )}

      {/* Reject Remark Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rejection Remark</Text>
            <Text style={styles.modalSub}>Please provide a reason for rejecting this correction request.</Text>
            <TextInput 
              style={styles.modalInput}
              placeholder="E.g. Incomplete proof, incorrect times..."
              multiline
              numberOfLines={3}
              value={tempRemark}
              onChangeText={setTempRemark}
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
  searchHeader: { 
    padding: 16, 
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
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: colors.text, fontWeight: '600' },
  
  listContainer: { padding: 16, paddingBottom: 100 },
  card: { marginBottom: 16, borderRadius: 24, padding: 20, overflow: 'hidden' },
  cardAccent: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, backgroundColor: colors.primary },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  nameSection: { marginLeft: 12 },
  userName: { fontSize: 16, fontWeight: '800', color: colors.text },
  userCode: { fontSize: 12, color: colors.textTertiary, fontWeight: '600', marginTop: 2 },
  
  stageBadge: { backgroundColor: colors.info + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.info + '30' },
  stageText: { fontSize: 10, fontWeight: '800', color: colors.info },
  
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16, opacity: 0.6 },
  
  comparisonGrid: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  comparisonCol: { flex: 1 },
  colLabel: { fontSize: 10, fontWeight: '800', color: colors.textTertiary, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  colValueOld: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, textDecorationLine: 'line-through' },
  colValueNew: { fontSize: 15, fontWeight: '800', color: colors.primary },
  
  reasonBox: { backgroundColor: colors.surfaceAlt, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  reasonLabel: { fontSize: 10, fontWeight: '800', color: colors.textTertiary, marginBottom: 6 },
  reasonText: { fontSize: 13, color: colors.text, fontStyle: 'italic', lineHeight: 18 },
  proofBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  proofBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  
  actionSection: { marginTop: 16 },
  remarkInput: { backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 12, height: 40, fontSize: 13, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  btnRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  rejectBtn: { borderWidth: 1.5, borderColor: colors.error },
  rejectBtnText: { color: colors.error, fontWeight: '800', fontSize: 14 },
  approveBtn: { backgroundColor: colors.primary },
  approveBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: colors.surface, borderRadius: 28, padding: 24, width: '100%', elevation: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 8 },
  modalSub: { fontSize: 14, color: colors.textSecondary, marginBottom: 20, lineHeight: 20 },
  modalInput: { backgroundColor: colors.surfaceAlt, borderRadius: 16, padding: 16, fontSize: 15, textAlignVertical: 'top', borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
  modalBtnRow: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, height: 54, borderRadius: 16, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { color: colors.textSecondary, fontWeight: '700', fontSize: 15 },
  modalConfirmBtn: { flex: 2, height: 54, borderRadius: 16, backgroundColor: colors.error, justifyContent: 'center', alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default CorrectionApproval;
