import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { applyLeave } from '../../api/leave.api';
import AppCard from '../../components/common/AppCard';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PremiumHeader from '../../components/common/PremiumHeader';


const { width } = Dimensions.get('window');

const LEAVE_TYPES = [
  { value: 'Paid', label: 'Paid Leave', icon: 'cash-outline', color: '#10B981' },
  { value: 'Casual', label: 'Casual', icon: 'cafe-outline', color: '#3B82F6' },
  { value: 'Sick', label: 'Sick Leave', icon: 'medical-outline', color: '#EF4444' },
  { value: 'CompOff', label: 'Comp-Off', icon: 'gift-outline', color: '#8B5CF6' },
  { value: 'Unpaid', label: 'Unpaid', icon: 'alert-circle-outline', color: '#F59E0B' },
  { value: 'Other', label: 'Other', icon: 'ellipsis-horizontal-circle-outline', color: '#64748B' },
];

const ApplyLeaveScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    leaveType: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    halfDay: false,
    halfDayPeriod: 'Morning',
    reason: '',
  });

  const totalDays = useMemo(() => {
    if (form.halfDay) return 0.5;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diff) ? 0 : Math.max(0, diff);
  }, [form.startDate, form.endDate, form.halfDay]);

  const approvalPath = useMemo(() => {
    const role = user?.role;
    if (role === 'Director' || role === 'SuperUser') return 'Auto-Approved';
    if (role === 'VP') return 'Director';
    if (role === 'GM') return 'VP → Director';
    if (role === 'HR') return 'GM → VP → Director';
    if (role === 'Manager') return 'HR → GM → VP → Director';
    return 'Manager → HR → GM → VP';
  }, [user]);

  const handleSubmit = async () => {
    if (!form.leaveType) return Toast.show({ type: 'error', text1: 'Selection Required', text2: 'Please select a leave type.' });
    if (!form.reason.trim()) return Toast.show({ type: 'error', text1: 'Reason Required', text2: 'Please provide a reason for your leave.' });
    if (totalDays <= 0) return Toast.show({ type: 'error', text1: 'Invalid Dates', text2: 'End date cannot be before start date.' });

    try {
      setLoading(true);
      await applyLeave(form);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Leave request submitted successfully! 🎉' });
      // Reset form or navigate
      navigation.goBack(); 
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Submission Failed', text2: err.response?.data?.message || 'Check your internet connection.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>


        
        {/* Leave Type Grid */}
        <Text style={styles.sectionTitle}>Select Leave Type</Text>
        <View style={styles.typeGrid}>
          {LEAVE_TYPES.map((type) => {
            const isActive = form.leaveType === type.value;
            let balance = null;
            if (type.value === 'Paid') balance = user?.paidLeaveBalance;
            if (type.value === 'CompOff') balance = user?.compOffBalance;

            return (
              <TouchableOpacity
                key={type.value}
                onPress={() => setForm({ ...form, leaveType: type.value })}
                activeOpacity={0.8}
                style={[styles.typeCard, isActive && { borderColor: type.color, backgroundColor: type.color + '08' }]}
              >
                <View style={[styles.typeIconBg, { backgroundColor: isActive ? type.color : colors.surfaceAlt }]}>
                  <Ionicons name={type.icon} size={18} color={isActive ? '#fff' : colors.textTertiary} />
                </View>
                <Text style={[styles.typeLabel, isActive && { color: type.color }]}>{type.label}</Text>
                {balance !== undefined && <Text style={styles.balanceText}>Bal: {balance}</Text>}
                {isActive && <View style={[styles.activeDot, { backgroundColor: type.color }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date Selection */}
        <AppCard style={styles.dateCard}>
          <View style={styles.durationHeader}>
             <View style={styles.durationBadge}>
                <Ionicons name="time-outline" size={12} color={colors.primary} />
                <Text style={styles.durationText}>{totalDays} {totalDays === 1 ? 'Day' : 'Days'} Request</Text>
             </View>
             
             <View style={styles.halfDayRow}>
                <Text style={styles.halfDayLabel}>Half Day</Text>
                <TouchableOpacity 
                   onPress={() => setForm({ ...form, halfDay: !form.halfDay })}
                   style={[styles.toggleBase, form.halfDay && styles.toggleActive]}
                >
                   <View style={[styles.toggleThumb, form.halfDay && styles.toggleThumbActive]} />
                </TouchableOpacity>
             </View>
          </View>

          {form.halfDay && (
            <View style={styles.periodRow}>
              {['Morning', 'Afternoon'].map(p => (
                <TouchableOpacity 
                  key={p} 
                  onPress={() => setForm({ ...form, halfDayPeriod: p })}
                  style={[styles.periodBtn, form.halfDayPeriod === p && styles.periodBtnActive]}
                >
                   <Text style={[styles.periodText, form.halfDayPeriod === p && styles.periodTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.dateInputs}>
             <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>START DATE</Text>
                <TextInput 
                  style={styles.dateInput} 
                  value={form.startDate} 
                  onChangeText={t => setForm({ ...form, startDate: t, endDate: t > form.endDate ? t : form.endDate })}
                  placeholder="YYYY-MM-DD"
                />
             </View>
             {!form.halfDay && (
                <>
                  <View style={styles.dateArrow}>
                     <Ionicons name="arrow-forward" size={16} color={colors.textTertiary} />
                  </View>
                  <View style={styles.inputBox}>
                    <Text style={styles.inputLabel}>END DATE</Text>
                    <TextInput 
                       style={styles.dateInput} 
                       value={form.endDate} 
                       onChangeText={t => setForm({ ...form, endDate: t })}
                       placeholder="YYYY-MM-DD"
                    />
                  </View>
                </>
             )}
          </View>
        </AppCard>

        {/* Reason Section */}
        <AppCard style={styles.reasonCard}>
           <Text style={styles.inputLabel}>REASON FOR LEAVE</Text>
           <TextInput 
             style={styles.reasonInput}
             multiline
             numberOfLines={4}
             placeholder="Describe your reason here..."
             value={form.reason}
             onChangeText={t => setForm({ ...form, reason: t })}
             maxLength={500}
           />
           <Text style={styles.charCount}>{form.reason.length}/500</Text>
        </AppCard>

        {/* Approval Path Visibility */}
        {form.leaveType ? (
          <View style={styles.infoBanner}>
             <Ionicons name="information-circle" size={18} color="#065F46" />
             <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Approval Workflow</Text>
                <Text style={styles.infoValue}>{approvalPath}</Text>
             </View>
          </View>
        ) : null}

        {/* Submit Action */}
        <TouchableOpacity 
          style={styles.submitBtnContainer} 
          disabled={loading}
          onPress={handleSubmit}
        >
          <LinearGradient
            colors={colors.gradients.primary}
            style={styles.submitBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
             {loading ? (
               <ActivityIndicator color="#fff" />
             ) : (
               <>
                 <Ionicons name="paper-plane" size={20} color="#fff" />
                 <Text style={styles.submitText}>Submit Request</Text>
               </>
             )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: colors.textTertiary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
  
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  typeCard: { 
    width: (width - 60) / 3, 
    aspectRatio: 0.9, 
    backgroundColor: colors.surface, 
    borderRadius: 18, 
    padding: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5
  },
  typeIconBg: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  typeLabel: { fontSize: 11, fontWeight: '800', color: colors.textSecondary, textAlign: 'center' },
  balanceText: { fontSize: 8, fontWeight: '700', color: colors.textTertiary, marginTop: 4 },
  activeDot: { position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 3 },

  dateCard: { borderRadius: 24, padding: 20, marginBottom: 16 },
  durationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  durationBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary + '10', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  durationText: { fontSize: 11, fontWeight: '900', color: colors.primary },
  
  halfDayRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  halfDayLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  toggleBase: { width: 34, height: 18, borderRadius: 10, backgroundColor: colors.surfaceAlt, padding: 2 },
  toggleActive: { backgroundColor: colors.primary },
  toggleThumb: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.textTertiary },
  toggleThumbActive: { backgroundColor: '#fff', transform: [{ translateX: 16 }] },

  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  periodBtn: { flex: 1, height: 36, borderRadius: 10, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  periodBtnActive: { backgroundColor: colors.primary + '15', borderWidth: 1, borderColor: colors.primary + '30' },
  periodText: { fontSize: 12, fontWeight: '700', color: colors.textTertiary },
  periodTextActive: { color: colors.primary },

  dateInputs: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inputBox: { flex: 1 },
  inputLabel: { fontSize: 9, fontWeight: '900', color: colors.textTertiary, letterSpacing: 0.5, marginBottom: 6 },
  dateInput: { backgroundColor: colors.surfaceAlt, height: 44, borderRadius: 12, paddingHorizontal: 12, fontSize: 14, fontWeight: '700', color: colors.text },
  dateArrow: { marginTop: 15 },

  reasonCard: { borderRadius: 24, padding: 20, marginBottom: 16 },
  reasonInput: { backgroundColor: colors.surfaceAlt, borderRadius: 14, padding: 16, fontSize: 14, height: 100, textAlignVertical: 'top', color: colors.text, fontWeight: '500' },
  charCount: { fontSize: 10, textAlign: 'right', color: colors.textTertiary, marginTop: 4 },

  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ECFDF5', padding: 14, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#10B981', marginBottom: 24 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 11, fontWeight: '900', color: '#065F46', textTransform: 'uppercase' },
  infoValue: { fontSize: 13, color: '#047857', marginTop: 2, fontWeight: '500' },

  submitBtnContainer: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  submitBtn: { height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitText: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
});

export default ApplyLeaveScreen;
