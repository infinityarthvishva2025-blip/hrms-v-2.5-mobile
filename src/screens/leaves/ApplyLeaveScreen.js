import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView,
  Platform, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { applyLeave, getCompOffBalanceHistory } from '../../api/leave.api';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AppDateTimePicker from '../../components/common/AppDateTimePicker';
import AppDropdown from '../../components/common/AppDropdown';
import { format } from 'date-fns';

const LEAVE_TYPES = [
  { value: 'Paid',    label: 'Paid Leave',   icon: 'cash-outline',                       color: '#10B981' },
  { value: 'Sick',    label: 'Sick Leave',    icon: 'medical-outline',                    color: '#EF4444' },
  { value: 'CompOff', label: 'Comp-Off',      icon: 'gift-outline',                       color: '#8B5CF6' },
  { value: 'Casual',  label: 'Casual Leave',  icon: 'cafe-outline',                       color: '#3B82F6' },
  { value: 'Unpaid',  label: 'Unpaid Leave',  icon: 'alert-circle-outline',               color: '#F59E0B' },
  { value: 'Other',   label: 'Other',         icon: 'ellipsis-horizontal-circle-outline', color: '#64748B' },
];

const getLeaveTypeConfig = (val) => LEAVE_TYPES.find((t) => t.value === val) || {};

// ── Comp-Off Detail Modal ──────────────────────────────────────────────────────
const CompOffModal = ({ visible, onClose }) => {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true); setError(null);
    getCompOffBalanceHistory()
      .then((res) => setData(res.data?.data || res.data))
      .catch(() => setError('Failed to load Comp-Off details.'))
      .finally(() => setLoading(false));
  }, [visible]);

  const getStatusColor = (s) => ({ Available: '#10B981', Used: '#64748B', Expired: '#EF4444', Deduction: '#F59E0B' }[s] || '#64748B');
  const getStatusIcon  = (s) => ({ Available: 'checkmark-circle', Used: 'checkmark-done-circle', Expired: 'time', Deduction: 'remove-circle' }[s] || 'ellipse');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={cm.overlay}>
        <View style={cm.sheet}>
          <View style={cm.handle} />

          <View style={cm.sheetHeader}>
            <View>
              <Text style={cm.sheetTitle}>Comp-Off Details</Text>
              <Text style={cm.sheetSub}>Your compensatory leave history</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={cm.closeBtn}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {data && !loading && (
            <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={cm.balBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="gift" size={22} color="#fff" />
              <View style={{ marginLeft: 12 }}>
                <Text style={cm.balBadgeVal}>{data.currentBalance ?? 0}</Text>
                <Text style={cm.balBadgeLbl}>Available Comp-Off Days</Text>
              </View>
            </LinearGradient>
          )}

          {loading ? (
            <View style={cm.center}><ActivityIndicator size="large" color="#8B5CF6" /></View>
          ) : error ? (
            <View style={cm.center}>
              <Ionicons name="cloud-offline-outline" size={40} color="#CBD5E1" />
              <Text style={cm.errorText}>{error}</Text>
            </View>
          ) : (data?.history?.length === 0) ? (
            <View style={cm.center}>
              <Ionicons name="gift-outline" size={48} color="#CBD5E1" />
              <Text style={cm.emptyTitle}>No Comp-Off History</Text>
              <Text style={cm.emptyText}>You haven't earned any Comp-Off yet.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {(data?.history || []).map((item, idx) => (
                <View key={item._id || idx} style={cm.historyItem}>
                  <View style={[cm.historyIconBox, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <Ionicons name={getStatusIcon(item.status)} size={20} color={getStatusColor(item.status)} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={cm.historyRow}>
                      <Text style={cm.historyType}>{item.type === 'Accrual' ? 'Earned' : 'Used/Deducted'}</Text>
                      <View style={[cm.statusPill, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                        <Text style={[cm.statusPillText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                      </View>
                    </View>
                    <Text style={cm.historyRemarks} numberOfLines={2}>{item.remarks || '—'}</Text>
                    <View style={cm.historyMeta}>
                      <Text style={cm.historyMetaText}>
                        {item.type === 'Accrual' ? '+' : '-'}{item.amount} day{item.amount !== 1 ? 's' : ''}
                      </Text>
                      {item.earnedDate && (
                        <Text style={cm.historyMetaDate}>
                          {format(new Date(item.earnedDate), 'dd MMM yyyy')}
                        </Text>
                      )}
                      {item.expiryDate && item.status === 'Available' && (
                        <Text style={[cm.historyMetaDate, { color: '#F59E0B' }]}>
                          Expires {format(new Date(item.expiryDate), 'dd MMM yy')}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ── Main Screen ────────────────────────────────────────────────────────────────
const ApplyLeaveScreen = ({ navigation }) => {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCompOffModal, setShowCompOffModal] = useState(false);
  const [form, setForm] = useState({
    leaveType:     '',
    startDate:     new Date(),
    endDate:       new Date(),
    halfDay:       false,
    halfDayPeriod: 'Morning',
    reason:        '',
  });

  useFocusEffect(useCallback(() => { refreshProfile(); }, [refreshProfile]));

  const totalDays = useMemo(() => {
    if (form.halfDay) return 0.5;
    const s = new Date(form.startDate); s.setHours(0,0,0,0);
    const e = new Date(form.endDate);   e.setHours(0,0,0,0);
    const d = Math.round((e - s) / 86400000) + 1;
    return isNaN(d) ? 0 : Math.max(0, d);
  }, [form.startDate, form.endDate, form.halfDay]);

  const selectedType = getLeaveTypeConfig(form.leaveType);

  const getAvailableBalance = () => {
    if (form.leaveType === 'Paid')    return user?.paidLeaveBalance ?? 0;
    if (form.leaveType === 'CompOff') return user?.compOffBalance   ?? 0;
    return null;
  };

  const availableBalance = getAvailableBalance();
  const isBalanceInsufficient = availableBalance !== null && totalDays > availableBalance;

  const handleSubmit = async () => {
    if (!form.leaveType)        return Toast.show({ type: 'error', text1: 'Leave Type Required', text2: 'Please select a leave type.' });
    if (!form.reason.trim())    return Toast.show({ type: 'error', text1: 'Reason Required',    text2: 'Please provide a reason.' });
    if (totalDays <= 0)         return Toast.show({ type: 'error', text1: 'Invalid Dates',      text2: 'End date cannot be before start date.' });
    if (isBalanceInsufficient)  return Toast.show({ type: 'error', text1: 'Insufficient Balance', text2: `You only have ${availableBalance} day(s) available.` });

    try {
      setLoading(true);
      await applyLeave({
        ...form,
        startDate: form.startDate.toISOString().split('T')[0],
        endDate:   form.endDate.toISOString().split('T')[0],
      });
      await refreshProfile();
      Toast.show({ type: 'success', text1: 'Request Submitted!', text2: 'Your leave has been sent for approval. 🎉' });
      
      // Clear the form fields back to their initial state
      setForm({
        leaveType:     '',
        startDate:     new Date(),
        endDate:       new Date(),
        halfDay:       false,
        halfDayPeriod: 'Morning',
        reason:        '',
      });

      // Redirect to the "My Leaves" tab instead of going back to Home
      navigation.navigate('LeaveHome', { tab: 'overview' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Submission Failed', text2: err.response?.data?.message || 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* ── Beautiful Premium White Balance Card ── */}
          <View style={styles.balCardContainer}>
            <View style={styles.balRow}>
              <View style={styles.balItem}>
                <View style={[styles.balIconCircle, { backgroundColor: '#10B98112' }]}>
                  <Ionicons name="cash-outline" size={18} color="#10B981" />
                </View>
                <Text style={[styles.balVal, { color: '#10B981' }]}>{user?.paidLeaveBalance ?? 0}</Text>
                <Text style={styles.balLbl}>PAID LEAVES</Text>
              </View>

              <View style={styles.balDivide} />

              <TouchableOpacity style={styles.balItem} activeOpacity={0.7} onPress={() => setShowCompOffModal(true)}>
                <View style={[styles.balIconCircle, { backgroundColor: '#8B5CF612' }]}>
                  <Ionicons name="gift-outline" size={18} color="#8B5CF6" />
                </View>
                <Text style={[styles.balVal, { color: '#8B5CF6' }]}>{user?.compOffBalance ?? 0}</Text>
                <Text style={styles.balLbl}>COMP-OFF</Text>
                <View style={styles.tapHint}>
                  <Ionicons name="information-circle-outline" size={11} color="#8B5CF6AA" />
                  <Text style={styles.tapHintText}>Tap details</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.balDivide} />

              <View style={styles.balItem}>
                <View style={[styles.balIconCircle, { backgroundColor: '#EF444412' }]}>
                  <Ionicons name="medical-outline" size={18} color="#EF4444" />
                </View>
                <Text style={[styles.balVal, { color: '#EF4444' }]}>{user?.sickLeaveBalance ?? 0}</Text>
                <Text style={styles.balLbl}>SICK LEAVES</Text>
              </View>
            </View>
          </View>

          {/* ── Form Card ── */}
          <View style={styles.formCard}>

            {/* Leave Type */}
            <AppDropdown
              label="Leave Type"
              options={LEAVE_TYPES}
              value={form.leaveType}
              onSelect={(val) => setForm({ ...form, leaveType: val })}
              placeholder="Choose leave category"
            />

            {/* Active Type Badge */}
            {form.leaveType ? (
              <View style={[styles.typeBadge, { backgroundColor: selectedType.color + '10', borderColor: selectedType.color + '30' }]}>
                <Ionicons name={selectedType.icon} size={14} color={selectedType.color} />
                <Text style={[styles.typeBadgeText, { color: selectedType.color }]}>{selectedType.label} selected</Text>
                {availableBalance !== null && (
                  <Text style={[styles.typeBadgeBalance, { color: isBalanceInsufficient ? '#EF4444' : selectedType.color }]}>
                    · {availableBalance} day{availableBalance !== 1 ? 's' : ''} available
                  </Text>
                )}
              </View>
            ) : null}

            {/* Date Row */}
            <View style={styles.dateRow}>
              <View style={styles.dateBox}>
                <AppDateTimePicker
                  label="From Date"
                  value={form.startDate}
                  onChange={(val) => setForm({ ...form, startDate: val, endDate: val > form.endDate ? val : form.endDate })}
                />
              </View>
              <View style={styles.dateBox}>
                <AppDateTimePicker
                  label="To Date"
                  value={form.endDate}
                  onChange={(val) => setForm({ ...form, endDate: val })}
                  disabled={form.halfDay}
                />
              </View>
            </View>

            {/* Duration + Half Day toggle */}
            <View style={styles.configRow}>
              <View style={[styles.durationBadge, isBalanceInsufficient && styles.durationBadgeWarn]}>
                <Ionicons name="time" size={14} color={isBalanceInsufficient ? '#EF4444' : colors.primary} />
                <Text style={[styles.durationText, isBalanceInsufficient && { color: '#EF4444' }]}>
                  {totalDays} {totalDays === 1 ? 'Day' : 'Days'}
                  {isBalanceInsufficient ? ' — Insufficient!' : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.halfDayToggle, form.halfDay && styles.toggleOn]}
                onPress={() => setForm({ ...form, halfDay: !form.halfDay, endDate: form.startDate })}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleText, form.halfDay && styles.toggleTextOn]}>Half Day</Text>
                <Ionicons name={form.halfDay ? 'radio-button-on' : 'radio-button-off'} size={18}
                  color={form.halfDay ? colors.primary : colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {/* Half Day Period */}
            {form.halfDay && (
              <View style={styles.periodPicker}>
                {['Morning', 'Afternoon'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setForm({ ...form, halfDayPeriod: p })}
                    style={[styles.periodBtn, form.halfDayPeriod === p && styles.periodBtnActive]}
                  >
                    <Ionicons
                      name={p === 'Morning' ? 'sunny-outline' : 'moon-outline'}
                      size={14}
                      color={form.halfDayPeriod === p ? '#fff' : colors.textSecondary}
                    />
                    <Text style={[styles.periodBtnText, form.halfDayPeriod === p && styles.periodBtnTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Reason */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reason for Leave <Text style={{ color: '#EF4444' }}>*</Text></Text>
              <View style={[styles.textAreaWrapper, form.reason.length > 0 && styles.textAreaFocused]}>
                <TextInput
                  style={styles.textArea}
                  value={form.reason}
                  onChangeText={(v) => setForm({ ...form, reason: v })}
                  placeholder="Explain why you're taking time off..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{form.reason.length} chars</Text>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitWrap, (loading || isBalanceInsufficient) && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={loading || isBalanceInsufficient}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={loading || isBalanceInsufficient ? ['#CBD5E1', '#94A3B8'] : colors.gradients.primary}
                style={styles.submitBtn}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="send" size={18} color="#fff" />
                    <Text style={styles.submitText}>Submit Leave Request</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

          </View>
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <CompOffModal visible={showCompOffModal} onClose={() => setShowCompOffModal(false)} />
    </>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { paddingBottom: 20 },

  // Premium Balance Card
  balCardContainer: { margin: 16, marginBottom: 8, backgroundColor: '#fff', borderRadius: 28, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 3 },
  balRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balItem:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  balIconCircle: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  balVal:    { fontSize: 20, fontWeight: '900', color: colors.text },
  balLbl:    { fontSize: 9, fontWeight: '800', color: colors.textSecondary, letterSpacing: 0.5, marginTop: 4 },
  balDivide: { width: 1, height: 48, backgroundColor: '#F1F5F9' },
  tapHint:   { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  tapHintText: { fontSize: 8, color: '#8B5CF6AA', fontWeight: '700' },

  // Form Card
  formCard:  { margin: 16, backgroundColor: '#fff', borderRadius: 28, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 3 },

  // Type Badge
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1, marginTop: 4, marginBottom: 8 },
  typeBadgeText:    { fontSize: 12, fontWeight: '700' },
  typeBadgeBalance: { fontSize: 12, fontWeight: '700' },

  // Dates
  dateRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  dateBox: { flex: 1 },

  // Config Row
  configRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 },
  durationBadge:{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary + '10',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  durationBadgeWarn: { backgroundColor: '#FEE2E2' },
  durationText: { fontSize: 13, fontWeight: '800', color: colors.primary },

  halfDayToggle:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  toggleOn:       { borderColor: colors.primary, backgroundColor: colors.primary + '08' },
  toggleText:     { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  toggleTextOn:   { color: colors.primary },

  // Period Picker
  periodPicker: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  periodBtn:       { flex: 1, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: colors.border, flexDirection: 'row', gap: 6 },
  periodBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodBtnText:   { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  periodBtnTextActive: { color: '#fff' },

  // Reason
  inputGroup:     { marginTop: 8 },
  label:          { fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  textAreaWrapper:{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 14, borderWidth: 1.5,
    borderColor: colors.border, minHeight: 110 },
  textAreaFocused:{ borderColor: colors.primary + '60' },
  textArea:       { fontSize: 15, fontWeight: '500', color: colors.text, flex: 1 },
  charCount:      { fontSize: 10, color: colors.textTertiary, textAlign: 'right', marginTop: 4, fontWeight: '600' },

  // Submit
  submitWrap:     { marginTop: 20, borderRadius: 20, overflow: 'hidden',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5 },
  submitBtn:      { height: 58, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  submitText:     { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
  submitDisabled: { opacity: 0.65, elevation: 0, shadowOpacity: 0 },
});

// ── CompOff Modal Styles ───────────────────────────────────────────────────────
const cm = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 20, maxHeight: '85%' },
  handle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 16 },
  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sheetTitle:   { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  sheetSub:     { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
  closeBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },

  balBadge:     { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  balBadgeVal:  { fontSize: 28, fontWeight: '900', color: '#fff' },
  balBadgeLbl:  { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  center:       { alignItems: 'center', paddingVertical: 48 },
  errorText:    { fontSize: 14, color: '#94A3B8', marginTop: 12, fontWeight: '600' },
  emptyTitle:   { fontSize: 16, fontWeight: '800', color: '#475569', marginTop: 12 },
  emptyText:    { fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: '500' },

  historyItem:  { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  historyIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  historyRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  historyType:  { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  statusPill:   { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  historyRemarks: { fontSize: 12, color: '#64748B', fontWeight: '500', lineHeight: 18 },
  historyMeta:  { flexDirection: 'row', gap: 12, marginTop: 6, flexWrap: 'wrap' },
  historyMetaText: { fontSize: 12, fontWeight: '800', color: '#475569' },
  historyMetaDate: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
});

export default ApplyLeaveScreen;
