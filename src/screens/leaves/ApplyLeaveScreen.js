import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { applyLeave } from '../../api/leave.api';
import AppCard from '../../components/common/AppCard';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AppDateTimePicker from '../../components/common/AppDateTimePicker';
import AppDropdown from '../../components/common/AppDropdown';

const { width } = Dimensions.get('window');

const LEAVE_TYPES = [
  { value: 'Paid', label: 'Paid Leave', icon: 'cash-outline', color: '#10B981' },
  { value: 'Sick', label: 'Sick Leave', icon: 'medical-outline', color: '#EF4444' },
  { value: 'CompOff', label: 'Comp-Off', icon: 'gift-outline', color: '#8B5CF6' },
  { value: 'Casual', label: 'Casual', icon: 'cafe-outline', color: '#3B82F6' },
  { value: 'Unpaid', label: 'Unpaid', icon: 'alert-circle-outline', color: '#F59E0B' },
  { value: 'Other', label: 'Other', icon: 'ellipsis-horizontal-circle-outline', color: '#64748B' },
];

const ApplyLeaveScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    leaveType: '',
    startDate: new Date(),
    endDate: new Date(),
    halfDay: false,
    halfDayPeriod: 'Morning',
    reason: '',
  });

  const totalDays = useMemo(() => {
    if (form.halfDay) return 0.5;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diff) ? 0 : Math.max(0, diff);
  }, [form.startDate, form.endDate, form.halfDay]);

  const handleSubmit = async () => {
    if (!form.leaveType) return Toast.show({ type: 'error', text1: 'Selection Required', text2: 'Please select a leave type.' });
    if (!form.reason.trim()) return Toast.show({ type: 'error', text1: 'Reason Required', text2: 'Please provide a reason for your leave.' });
    if (totalDays <= 0) return Toast.show({ type: 'error', text1: 'Invalid Dates', text2: 'End date cannot be before start date.' });

    try {
      setLoading(true);
      const payload = {
        ...form,
        startDate: form.startDate.toISOString().split('T')[0],
        endDate: form.endDate.toISOString().split('T')[0],
      };
      await applyLeave(payload);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Leave request submitted successfully! 🎉' });
      navigation.goBack(); 
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Submission Failed', text2: err.response?.data?.message || 'Error submitting request.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <AppCard style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.headerInfo}>
               <Text style={styles.headerLabel}>PLANNING TO TAKE OFF?</Text>
               <Text style={styles.headerTitle}>Apply for Leave</Text>
            </View>
            <View style={styles.headerIconBg}>
               <Ionicons name="umbrella" size={28} color={colors.primary} />
            </View>
          </View>
          
          <View style={styles.balanceSummary}>
             <View style={styles.balanceItem}>
                <Text style={styles.balVal}>{user?.paidLeaveBalance || 0}</Text>
                <Text style={styles.balLabel}>PAID</Text>
             </View>
             <View style={styles.balDivider} />
             <View style={styles.balanceItem}>
                <Text style={styles.balVal}>{user?.compOffBalance || 0}</Text>
                <Text style={styles.balLabel}>COMP-OFF</Text>
             </View>
             <View style={styles.balDivider} />
             <View style={styles.balanceItem}>
                <Text style={[styles.balVal, { color: colors.error }]}>{user?.sickLeaveBalance || 0}</Text>
                <Text style={styles.balLabel}>SICK</Text>
             </View>
          </View>
        </AppCard>

        <View style={styles.formSection}>
          <AppDropdown
            label="Leave Type"
            options={LEAVE_TYPES}
            value={form.leaveType}
            onSelect={(val) => setForm({ ...form, leaveType: val })}
            placeholder="Choose leave category"
          />

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

          <View style={styles.configRow}>
             <View style={styles.durationBadge}>
                <Ionicons name="time" size={14} color={colors.primary} />
                <Text style={styles.durationText}>{totalDays} {totalDays === 1 ? 'Day' : 'Days'} Selected</Text>
             </View>
             
             <TouchableOpacity 
               style={[styles.halfDayToggle, form.halfDay && styles.toggleOn]}
               onPress={() => setForm({ ...form, halfDay: !form.halfDay, endDate: form.startDate })}
               activeOpacity={0.7}
             >
                <Text style={[styles.toggleText, form.halfDay && styles.toggleTextOn]}>Half Day</Text>
                <Ionicons name={form.halfDay ? "radio-button-on" : "radio-button-off"} size={18} color={form.halfDay ? colors.primary : colors.textTertiary} />
             </TouchableOpacity>
          </View>

          {form.halfDay && (
            <View style={styles.periodPicker}>
              {['Morning', 'Afternoon'].map(p => (
                <TouchableOpacity 
                  key={p} 
                  onPress={() => setForm({ ...form, halfDayPeriod: p })}
                  style={[styles.periodBtn, form.halfDayPeriod === p && styles.periodBtnActive]}
                >
                   <Text style={[styles.periodBtnText, form.halfDayPeriod === p && styles.periodBtnTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reason for Leave</Text>
            <View style={styles.textAreaWrapper}>
              <TextInput
                style={styles.textArea}
                value={form.reason}
                onChangeText={(val) => setForm({...form, reason: val})}
                placeholder="Explain why you're taking time off..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitContainer, loading && styles.submitDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={loading ? ['#CBD5E1', '#94A3B8'] : colors.gradients.primary}
            style={styles.submitBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitText}>Submit Leave Request</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: 20 },
  headerCard: { borderRadius: 32, padding: 24, marginBottom: 24, backgroundColor: '#fff', elevation: 4 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerLabel: { fontSize: 10, fontWeight: '900', color: colors.textTertiary, letterSpacing: 1.5, marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: colors.text },
  headerIconBg: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
  
  balanceSummary: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: 20, padding: 16 },
  balanceItem: { flex: 1, alignItems: 'center' },
  balVal: { fontSize: 18, fontWeight: '900', color: colors.primary },
  balLabel: { fontSize: 8, fontWeight: '800', color: colors.textTertiary, marginTop: 2, letterSpacing: 0.5 },
  balDivider: { width: 1, height: 20, backgroundColor: colors.border },

  formSection: { gap: 8 },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateBox: { flex: 1 },
  
  configRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  durationBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary + '10', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  durationText: { fontSize: 13, fontWeight: '800', color: colors.primary },
  
  halfDayToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  toggleOn: { borderColor: colors.primary, backgroundColor: colors.primary + '05' },
  toggleText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  toggleTextOn: { color: colors.primary },

  periodPicker: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  periodBtn: { flex: 1, height: 44, borderRadius: 12, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  periodBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodBtnText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  periodBtnTextActive: { color: '#fff' },

  inputGroup: { marginTop: 8 },
  label: { fontSize: 12, fontWeight: '800', color: colors.textSecondary, marginBottom: 10, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  textAreaWrapper: { backgroundColor: colors.surfaceAlt, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, height: 120 },
  textArea: { fontSize: 15, fontWeight: '600', color: colors.text, height: '100%' },

  submitContainer: { marginTop: 10, shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  submitBtn: { height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  submitDisabled: { opacity: 0.7, elevation: 0 }
});

export default ApplyLeaveScreen;
