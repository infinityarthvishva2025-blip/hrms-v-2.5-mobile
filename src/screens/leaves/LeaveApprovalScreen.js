import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
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

const { width } = Dimensions.get('window');

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
      Toast.show({ type: 'success', text1: 'Leave Approved Successfully' });
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
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Avatar url={item.employeeId?.profileImageUrl} name={item.employeeId?.name} size={50} />
          <View style={styles.nameBlock}>
            <Text style={styles.userName}>{item.employeeId?.name}</Text>
            <Text style={styles.userMeta}>{item.employeeId?.employeeCode} • {item.employeeId?.department || 'Staff'}</Text>
          </View>
        </View>
        <View style={styles.typeTag}>
          <Text style={styles.typeTagText}>{item.leaveType}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.requestDetails}>
        <View style={styles.detailItem}>
           <Text style={styles.detailLabel}>DURATION</Text>
           <View style={styles.durationRow}>
              <Text style={styles.durationValue}>{item.totalDays} {item.totalDays === 1 ? 'Day' : 'Days'}</Text>
              {item.halfDay && <View style={styles.halfDayBadge}><Text style={styles.halfDayBadgeText}>{item.halfDayPeriod}</Text></View>}
           </View>
        </View>
        <View style={styles.detailItem}>
           <Text style={styles.detailLabel}>DATES</Text>
           <Text style={styles.dateValueText}>{formatDate(item.startDate)} – {formatDate(item.endDate)}</Text>
        </View>
      </View>

      <View style={styles.reasonBox}>
        <Text style={styles.reasonLabel}>APPLICANT REMARK</Text>
        <Text style={styles.reasonText}>"{item.reason}"</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.btn, styles.btnReject]} 
          onPress={() => openRejectModal(item)}
          disabled={!!actionLoading}
        >
          <Ionicons name="close-circle" size={20} color={colors.error} />
          <Text style={styles.btnRejectText}>Reject</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.btnContainer, { flex: 2 }]} 
          onPress={() => handleApprove(item._id)}
          disabled={!!actionLoading}
        >
          <LinearGradient
            colors={colors.gradients.primary}
            style={styles.btnApprove}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {actionLoading === item._id ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.btnApproveText}>Approve</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </AppCard>
  );

  return (
    <View style={styles.container}>
      {/* <View style={styles.headerArea}>
         <Text style={styles.pageTitle}>Approvals</Text>
         <Text style={styles.pageSub}>Review pending leave applications</Text>
      </View> */}

      {loading && !data ? (
        <View style={styles.loader}>
          <LoadingSpinner />
        </View>
      ) : (
        <FlatList
          data={Array.isArray(data) ? data : (data?.leaves || [])}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="shield-checkmark-outline" title="Clear Workspace" message="No pending leave requests to review." />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Reject Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Reject Request</Text>
               <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                  <Ionicons name="close-circle" size={28} color={colors.textTertiary} />
               </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDesc}>Please specify the reason for rejecting {selectedReq?.employeeId?.name}'s request.</Text>
            
            <View style={styles.modalInputBox}>
              <TextInput 
                style={styles.modalInput}
                placeholder="Type rejection reason here..."
                placeholderTextColor={colors.textTertiary}
                multiline
                value={remarks}
                onChangeText={setRemarks}
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSec} onPress={() => setRejectModalVisible(false)}>
                <Text style={styles.modalBtnSecText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtnPrim, !remarks.trim() && { opacity: 0.5 }]} 
                onPress={handleReject} 
                disabled={!!actionLoading || !remarks.trim()}
              >
                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnPrimText}>Confirm Reject</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerArea: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 10 },
  pageTitle: { fontSize: 26, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  pageSub: { fontSize: 13, color: colors.textTertiary, fontWeight: '600', marginTop: 4 },

  listContent: { padding: 20, paddingBottom: 100 },
  card: { marginBottom: 20, borderRadius: 32, padding: 24, backgroundColor: '#fff', elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  nameBlock: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '800', color: colors.text },
  userMeta: { fontSize: 11, color: colors.textTertiary, fontWeight: '700', marginTop: 2 },
  
  typeTag: { backgroundColor: colors.primary + '10', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  typeTagText: { fontSize: 10, fontWeight: '900', color: colors.primary, textTransform: 'uppercase' },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  
  requestDetails: { flexDirection: 'row', gap: 24, marginBottom: 20 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.8, marginBottom: 6 },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  durationValue: { fontSize: 15, fontWeight: '800', color: '#334155' },
  halfDayBadge: { backgroundColor: '#F59E0B15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  halfDayBadgeText: { fontSize: 9, fontWeight: '800', color: '#D97706' },
  dateValueText: { fontSize: 13, fontWeight: '700', color: '#475569' },

  reasonBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 18, marginBottom: 24 },
  reasonLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', marginBottom: 8 },
  reasonText: { fontSize: 13, color: '#64748B', fontStyle: 'italic', lineHeight: 20 },

  actions: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnContainer: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
  btnReject: { borderWidth: 1.5, borderColor: colors.error },
  btnRejectText: { color: colors.error, fontWeight: '800', fontSize: 15 },
  btnApprove: { flex: 1, height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnApproveText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: colors.text },
  modalDesc: { fontSize: 14, color: colors.textSecondary, marginBottom: 24, lineHeight: 22 },
  modalInputBox: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 24 },
  modalInput: { fontSize: 15, fontWeight: '600', color: colors.text, height: 100, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtnSec: { flex: 1, height: 56, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  modalBtnSecText: { color: colors.textSecondary, fontWeight: '800', fontSize: 15 },
  modalBtnPrim: { flex: 2, height: 56, borderRadius: 18, backgroundColor: colors.error, justifyContent: 'center', alignItems: 'center' },
  modalBtnPrimText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default LeaveApprovalScreen;
