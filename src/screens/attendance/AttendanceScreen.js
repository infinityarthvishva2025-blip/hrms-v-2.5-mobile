// screens/attendance/AttendanceScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../../constants/colors';
import { getTodayStatus, checkIn, checkOut } from '../../api/attendance.api';
import { getManagementEmployees } from '../../api/employee.api';
import AppCard from '../../components/common/AppCard';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { calculateDistance } from '../../utils/geoUtils';
import Toast from 'react-native-toast-message';
import Modal from 'react-native-modal';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../hooks/useAuth';
import PremiumHeader from '../../components/common/PremiumHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

const AttendanceScreen = ({ navigation }) => {
  const { refreshProfile } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [officeSettings, setOfficeSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Geo state
  const [geoStatus, setGeoStatus] = useState('checking');
  const [geoDistance, setGeoDistance] = useState(0);
  const [userLocation, setUserLocation] = useState(null);

  // Timer state
  const [timerDisplay, setTimerDisplay] = useState('00:00:00');
  const [isOvertime, setIsOvertime] = useState(false);

  // EOD Report state
  const [showReportModal, setShowReportModal] = useState(false);
  const [managementEmps, setManagementEmps] = useState([]);
  const [reportForm, setReportForm] = useState({
    todayWork: '',
    pendingWork: '',
    issuesFaced: '',
    reportParticipants: [],
  });

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await getTodayStatus();
      setTodayRecord(data.data.record);
      setOfficeSettings(data.data.office);
      if (data.data.office) {
        verifyLocation(data.data.office);
      }
    } catch (error) {
      console.error('Status fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchManagement();
  }, [fetchStatus]);

  const fetchManagement = async () => {
    try {
      const { data } = await getManagementEmployees();
      setManagementEmps(data.data || []);
    } catch (e) {}
  };

  const verifyLocation = async (office) => {
    setGeoStatus('checking');
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGeoStatus('error');
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUserLocation(location.coords);

      const dist = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        office.lat,
        office.lng
      );

      setGeoDistance(dist);
      setGeoStatus(dist <= office.radius ? 'valid' : 'invalid');
    } catch (error) {
      console.error('Location error:', error);
      setGeoStatus('error');
    }
  };

  // Timer Logic
  useEffect(() => {
    if (!todayRecord?.inTime || todayRecord?.outTime) {
      setTimerDisplay('00:00:00');
      setIsOvertime(false);
      return;
    }

    const inTime = new Date(todayRecord.inTime);
    const shiftHours = inTime.getDay() === 6 ? 7 : 8.5; // Saturday 7h, Weekdays 8.5h
    const shiftMs = shiftHours * 3600000;

    const interval = setInterval(() => {
      const workedMs = Date.now() - inTime.getTime();
      const remainingMs = shiftMs - workedMs;

      setIsOvertime(remainingMs < 0);
      const absMs = Math.abs(remainingMs);

      const h = Math.floor(absMs / 3600000);
      const m = Math.floor((absMs % 3600000) / 60000);
      const s = Math.floor((absMs % 60000) / 1000);

      setTimerDisplay(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [todayRecord]);

  const handleAction = async (op) => {
    if (geoStatus !== 'valid') {
      Toast.show({ type: 'error', text1: 'Error', text2: 'You must be within office zone' });
      return;
    }

    if (op === 'checkin') {
      proceedCheckIn();
    } else if (op === 'checkout') {
      setShowReportModal(true);
    }
  };

  const proceedCheckIn = async () => {
    setActionLoading(true);
    try {
      await checkIn({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Checked in successfully' });
      fetchStatus();
      refreshProfile();
    } catch (error) {
      const msg = error.response?.data?.message || 'Check-in failed';
      Toast.show({ type: 'error', text1: 'Check-in Failed', text2: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const proceedCheckOut = async () => {
    if (!reportForm.todayWork.trim()) {
      Toast.show({ type: 'error', text1: 'Missing Info', text2: "Please describe today's work" });
      return;
    }

    setActionLoading(true);
    try {
      await checkOut({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        todayWork: reportForm.todayWork,
        pendingWork: reportForm.pendingWork,
        issuesFaced: reportForm.issuesFaced,
        reportParticipants: reportForm.reportParticipants,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Checked out successfully' });
      setShowReportModal(false);
      fetchStatus();
      refreshProfile();
    } catch (error) {
      const msg = error.response?.data?.message || 'Check-out failed';
      Toast.show({ type: 'error', text1: 'Check-out Failed', text2: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const toggleParticipant = (id) => {
    setReportForm(prev => ({
      ...prev,
      reportParticipants: prev.reportParticipants.includes(id)
        ? prev.reportParticipants.filter(x => x !== id)
        : [...prev.reportParticipants, id],
    }));
  };

  const isCheckedIn = !!todayRecord?.inTime;
  const isCheckedOut = !!todayRecord?.outTime;

  const renderGeoStatus = () => {
    const map = {
      checking: { color: '#D97706', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: 'sync', text: 'Verifying Location...' },
      valid: { color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', icon: 'checkmark-circle', text: `Within Office · ${geoDistance}m` },
      invalid: { color: colors.error, bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', icon: 'close-circle', text: `Out of Zone · ${geoDistance}m` },
      error: { color: colors.error, bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', icon: 'alert-circle', text: 'Location Error' },
    };
    const s = map[geoStatus] || map.checking;
    return (
      <View style={[styles.geoPill, { backgroundColor: s.bg, borderColor: s.border }]}>
        <Ionicons name={s.icon} size={14} color={s.color} />
        <Text style={[styles.geoText, { color: s.color }]}>{s.text}</Text>
      </View>
    );
  };

  const MiniMetric = ({ label, value, icon, color }) => (
    <View style={styles.miniMetric}>
      <View style={[styles.miniMetricIcon, { backgroundColor: color + '10' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View>
        <Text style={styles.miniMetricLabel}>{label}</Text>
        <Text style={styles.miniMetricValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStatus} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Geo Status Chip */}
        <View style={styles.statusSection}>{renderGeoStatus()}</View>

        {/* Hero Action Card */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroCard}
          >
            {/* Geometric Overlays */}
            <View style={[styles.heroBlob, { top: -60, right: -60, width: 220, height: 220, opacity: 0.15 }]} />
            <View style={[styles.heroBlob, { bottom: -40, left: -40, width: 140, height: 140, opacity: 0.1 }]} />

            <View style={styles.heroContent}>
              {isCheckedIn && !isCheckedOut ? (
                <View style={styles.activeSession}>
                  <View style={styles.glassTimer}>
                    <Text style={[styles.timerLabel, isOvertime && { color: '#FCD34D' }]}>
                      {isOvertime ? 'OVERTIME RUNNING' : 'REMAINING TIME'}
                    </Text>
                    <Text style={[styles.timerText, isOvertime && { color: '#FCD34D' }]}>
                      {isOvertime && '+'}{timerDisplay}
                    </Text>
                  </View>
                  <Text style={styles.shiftTarget}>
                    SHIPPING GOAL: {new Date().getDay() === 6 ? '7.0h' : '8.5h'}
                  </Text>
                </View>
              ) : isCheckedOut ? (
                <View style={styles.doneSession}>
                  <View style={styles.doneIconBg}>
                    <Ionicons name="checkmark-done-circle" size={54} color="#fff" />
                  </View>
                  <Text style={styles.doneTitle}>All Set for Today!</Text>
                  <Text style={styles.doneSub}>Your attendance is locked and synced.</Text>
                </View>
              ) : (
                <View style={styles.idleSession}>
                  <View style={styles.idleIconBg}>
                    <Ionicons name="finger-print-outline" size={42} color="rgba(255,255,255,0.4)" />
                  </View>
                  <Text style={styles.idleTitle}>Not Clocked In</Text>
                  <Text style={styles.idleSub}>Position yourself in the office zone to start your shift.</Text>
                </View>
              )}

              {/* Action Button */}
              <View style={styles.heroActions}>
                {!isCheckedIn ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, geoStatus !== 'valid' && styles.actionBtnDisabled]}
                    onPress={() => handleAction('checkin')}
                    disabled={geoStatus !== 'valid' || actionLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                       colors={geoStatus === 'valid' ? ['#fff', 'rgba(255,255,255,0.9)'] : ['#94a3b8', '#64748b']}
                       style={styles.actionBtnGradient}
                    >
                      {actionLoading ? <ActivityIndicator color={colors.primary} /> : (
                        <>
                          <Ionicons name="flash" size={20} color={geoStatus === 'valid' ? colors.primary : '#fff'} />
                          <Text style={[styles.actionBtnText, { color: geoStatus === 'valid' ? colors.primary : '#fff' }]}>START SHIFT</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ) : !isCheckedOut ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, geoStatus !== 'valid' && styles.actionBtnDisabled]}
                    onPress={() => handleAction('checkout')}
                    disabled={geoStatus !== 'valid' || actionLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                       colors={geoStatus === 'valid' ? ['#EF4444', '#DC2626'] : ['#94a3b8', '#64748b']}
                       style={styles.actionBtnGradient}
                    >
                      {actionLoading ? <ActivityIndicator color="#fff" /> : (
                        <>
                          <Ionicons name="log-out" size={20} color="#fff" />
                          <Text style={styles.actionBtnText}>END SHIFT</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.completedBadge}>
                    <Ionicons name="shield-checkmark" size={16} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.completedBadgeText}>WORK LOGGED SECURELY</Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Metrics Grid */}
        <Text style={styles.sectionTitle}>Shift Metrics</Text>
        <View style={styles.metricsGrid}>
          <AppCard style={styles.metricItem}>
            <MiniMetric 
              label="Clock In" 
              value={todayRecord?.inTime ? format(new Date(todayRecord.inTime), 'hh:mm a') : '--:--'} 
              icon="enter-outline" 
              color={colors.success} 
            />
          </AppCard>
          <AppCard style={styles.metricItem}>
            <MiniMetric 
              label="Clock Out" 
              value={todayRecord?.outTime ? format(new Date(todayRecord.outTime), 'hh:mm a') : '--:--'} 
              icon="exit-outline" 
              color={colors.primary} 
            />
          </AppCard>
          <AppCard style={styles.metricItem}>
            <MiniMetric 
              label="Worked" 
              value={todayRecord?.totalHours ? todayRecord.totalHours.toFixed(1) + 'h' : '0.0h'} 
              icon="time-outline" 
              color={colors.warning} 
            />
          </AppCard>
          <AppCard style={styles.metricItem}>
            <MiniMetric 
              label="Status" 
              value={isCheckedIn ? (isCheckedOut ? 'DONE' : 'ON-GOING') : 'ABSENT'} 
              icon="analytics-outline" 
              color={colors.gradients.secondary[0]} 
            />
          </AppCard>
        </View>

        {todayRecord?.isLate && (
          <AppCard style={styles.lateNotice}>
            <View style={styles.lateIconBg}>
              <Ionicons name="alert-circle" size={20} color={colors.warning} />
            </View>
            <View>
              <Text style={styles.lateTitle}>Late Entry Detected</Text>
              <Text style={styles.lateSub}>You were late by {todayRecord.lateMinutes} minutes today.</Text>
            </View>
          </AppCard>
        )}
        
        <View style={{ height: 60 }} />
      </ScrollView>


      {/* Checkout Report Modal */}
      <Modal
        isVisible={showReportModal}
        style={styles.modal}
        onBackdropPress={() => setShowReportModal(false)}
        propagateSwipe
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Check-out Report</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.reportLabel}>Today's Completed Work *</Text>
              <TextInput
                style={[styles.reportInput, { height: 80 }]}
                placeholder="What did you achieve today?"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={reportForm.todayWork}
                onChangeText={t => setReportForm({ ...reportForm, todayWork: t })}
              />

              <Text style={styles.reportLabel}>Pending / Carry-over Tasks</Text>
              <TextInput
                style={[styles.reportInput, { height: 60 }]}
                placeholder="Tasks for tomorrow..."
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                value={reportForm.pendingWork}
                onChangeText={t => setReportForm({ ...reportForm, pendingWork: t })}
              />

              <Text style={styles.reportLabel}>Issues / Blockers</Text>
              <TextInput
                style={[styles.reportInput, { height: 60 }]}
                placeholder="Any challenges faced?"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                value={reportForm.issuesFaced}
                onChangeText={t => setReportForm({ ...reportForm, issuesFaced: t })}
              />

              <Text style={styles.reportLabel}>Share Report With</Text>
              <View style={styles.participantsContainer}>
                {managementEmps.map(emp => {
                  const selected = reportForm.reportParticipants.includes(emp._id);
                  return (
                    <TouchableOpacity
                      key={emp._id}
                      onPress={() => toggleParticipant(emp._id)}
                      style={[styles.participantPill, selected && styles.selectedPill]}
                    >
                      <Text style={[styles.participantText, selected && { color: '#fff' }]}>{emp.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, actionLoading && styles.disabledBtn]}
                onPress={proceedCheckOut}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit & Check Out</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { padding: 20, paddingTop: 16 },
  
  statusSection: { marginBottom: 20 },
  geoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  geoText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },
  
  heroContainer: { marginBottom: 28 },
  heroCard: {
    height: 340,
    borderRadius: 36,
    padding: 28,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  heroBlob: {
    position: 'absolute',
    borderRadius: 110,
    backgroundColor: '#fff',
  },
  heroContent: { flex: 1, justifyContent: 'space-between', zIndex: 2 },
  
  activeSession: { alignItems: 'center', marginTop: 10 },
  glassTimer: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 20,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    width: '100%',
  },
  timerLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, marginBottom: 6 },
  timerText: { fontSize: 54, fontWeight: '900', color: '#fff', fontVariant: ['tabular-nums'], letterSpacing: -1 },
  shiftTarget: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 14, fontWeight: '800', letterSpacing: 0.5 },
  
  idleSession: { alignItems: 'center', marginTop: 20 },
  idleIconBg: { width: 80, height: 80, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  idleTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 8, letterSpacing: -0.5 },
  idleSub: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: 220, lineHeight: 20 },
  
  doneSession: { alignItems: 'center', marginTop: 20 },
  doneIconBg: { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  doneTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 8 },
  doneSub: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: 240 },

  heroActions: { marginTop: 20 },
  actionBtn: { height: 64, borderRadius: 24, overflow: 'hidden', elevation: 6 },
  actionBtnDisabled: { opacity: 0.8 },
  actionBtnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  actionBtnText: { fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  
  completedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, borderRadius: 16 },
  completedBadgeText: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },

  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 16, letterSpacing: -0.5 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricItem: { width: (width - 52) / 2, padding: 16, borderRadius: 24 },
  miniMetric: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  miniMetricIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  miniMetricLabel: { fontSize: 10, fontWeight: '800', color: colors.textTertiary, textTransform: 'uppercase', marginBottom: 2, letterSpacing: 0.5 },
  miniMetricValue: { fontSize: 15, fontWeight: '900', color: colors.text },
  
  lateNotice: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: 24, marginTop: 20, backgroundColor: colors.warning + '08', borderLeftWidth: 4, borderLeftColor: colors.warning },
  lateIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.warning + '15', justifyContent: 'center', alignItems: 'center' },
  lateTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  lateSub: { fontSize: 12, fontWeight: '600', color: colors.textTertiary, marginTop: 2 },

  modal: { margin: 0, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 28,
    paddingTop: 32,
    maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.8 },
  reportLabel: { fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 10, marginTop: 18, marginLeft: 2 },
  reportInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    padding: 18,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  participantsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  participantPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  selectedPill: { backgroundColor: colors.primary, borderColor: colors.primary },
  participantText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  submitBtn: {
    backgroundColor: colors.primary,
    height: 60,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 36,
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
});

export default AttendanceScreen;