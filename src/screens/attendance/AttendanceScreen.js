import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  AppState
} from 'react-native';
import { colors } from '../../constants/colors';
import { getTodayStatus, checkIn, checkOut, trackLocation } from '../../api/attendance.api';
import { getManagementEmployees } from '../../api/employee.api';
import AppCard from '../../components/common/AppCard';
import {
  Ionicons,
  MaterialCommunityIcons
} from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { calculateDistance } from '../../utils/geoUtils';
import Toast from 'react-native-toast-message';
import Modal from 'react-native-modal';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

const { width, height } = Dimensions.get('window');

const BYPASS_LAT = 18.534202;
const BYPASS_LNG = 73.839556;
const BYPASS_CODE = 'IA00117';

const AttendanceScreen = ({ navigation }) => {
  const { user, refreshProfile } = useAuth();
  const isBypassUser = user?.employeeCode === BYPASS_CODE;

  const [todayRecord, setTodayRecord] = useState(null);
  const [officeSettings, setOfficeSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      refreshProfile();
    }, [])
  );

  // Geo state
  const [geoStatus, setGeoStatus] = useState('checking');
  const [geoDistance, setGeoDistance] = useState(0);
  const [userLocation, setUserLocation] = useState(null);

  // Timer state
  const [timerDisplay, setTimerDisplay] = useState('00:00:00');
  const [isOvertime, setIsOvertime] = useState(false);
  const [progressPct, setProgressPct] = useState(0);

  // Mode & Action
  const [workMode, setWorkMode] = useState('Office');
  const [trackingActive, setTrackingActive] = useState(false);

  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceOp, setFaceOp] = useState(null);
  const webviewRef = useRef(null);
  const faceOpRef = useRef(null);

  // Pre-load face-verification.html asset once
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [asset] = await Asset.loadAsync(require('../../../face-verification.html'));
        const html = await FileSystem.readAsStringAsync(asset.localUri);
        if (isMounted) setHtmlContent(html);
      } catch (e) {
        console.error('[FaceVerify] Failed to load HTML asset:', e.message);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // EOD Report state
  const [showReportModal, setShowReportModal] = useState(false);
  const [managementEmps, setManagementEmps] = useState([]);
  const [reportForm, setReportForm] = useState({
    todayWork: '',
    pendingWork: '',
    issuesFaced: '',
    reportParticipants: [],
  });

  const locationRef = useRef(null);

  const verifyLocation = useCallback(async (office, forceHighAccuracy = false) => {
    if (!office) return 'invalid';
    setGeoStatus('checking');
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGeoStatus('permission_denied');
        return 'permission_denied';
      }

      // 1. Try quick cached location first (very fast)
      const last = await Location.getLastKnownPositionAsync({ maxAge: 30000 }); // Use location from last 30s
      if (last?.coords) {
        const dist = calculateDistance(last.coords.latitude, last.coords.longitude, office.lat, office.lng);
        if (dist <= office.radius) {
          setGeoDistance(Math.round(dist));
          setUserLocation(last.coords);
          locationRef.current = last.coords;
          setGeoStatus('valid');
          // If we found a valid cached location and don't strictly NEED a fresh high-accuracy one, return early
          if (!forceHighAccuracy) return 'valid';
        }
      }

      // 2. Get fresh location with Balanced accuracy (much faster than High)
      // Balanced uses WiFi/Cell which is usually instant and accurate to ~30m
      const loc = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced,
        timeout: 5000 // 5s timeout to prevent hanging
      });
      
      if (loc?.coords) {
        locationRef.current = loc.coords;
        setUserLocation(loc.coords);
        const dist = calculateDistance(loc.coords.latitude, loc.coords.longitude, office.lat, office.lng);
        setGeoDistance(Math.round(dist));
        const finalStatus = dist <= office.radius ? 'valid' : 'invalid';
        setGeoStatus(finalStatus);
        return finalStatus;
      }
      return 'invalid';
    } catch (error) {
      console.error('Location error:', error);
      setGeoStatus('error');
      return 'error';
    }
  }, []);

  const fetchManagement = async () => {
    try {
      const { data } = await getManagementEmployees();
      setManagementEmps(data.data || []);
    } catch (e) { }
  };

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await getTodayStatus();
      setTodayRecord(data.data.record);
      if (data.data.office) {
        setOfficeSettings(data.data.office);
        if (!isBypassUser) {
          verifyLocation(data.data.office);
        } else {
          setGeoStatus('valid');
        }
      }
    } catch (error) {
      console.error('Status fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [isBypassUser, verifyLocation]);

  useEffect(() => {
    fetchStatus();
    fetchManagement();
  }, [fetchStatus]);

  // Timer & Progress Logic
  useEffect(() => {
    if (!todayRecord?.inTime || todayRecord?.outTime) {
      setTimerDisplay('00:00:00');
      setIsOvertime(false);
      setProgressPct(0);
      return;
    }

    const inTime = new Date(todayRecord.inTime);
    const dayOfWeek = inTime.getDay();
    const shiftHours = dayOfWeek === 6 ? 7 : 8.5; // Saturday 7h, Weekdays 8.5h
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

      const pct = (workedMs / shiftMs) * 100;
      setProgressPct(Math.min(100, Math.max(0, pct)));
    }, 1000);

    return () => clearInterval(interval);
  }, [todayRecord]);

  // Periodic field tracking
  useEffect(() => {
    let intervalId;
    const isCheckedIn = !!todayRecord?.inTime;
    const isCheckedOut = !!todayRecord?.outTime;

    if (isCheckedIn && !isCheckedOut && todayRecord?.workMode === 'Field') {
      setTrackingActive(true);
      const track = async () => {
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') return;
          let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          await trackLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        } catch (err) {
          console.error('Tracking failed', err);
        }
      };

      track();
      intervalId = setInterval(track, 10 * 60 * 1000); // 10 mins
    } else {
      setTrackingActive(false);
    }
    return () => clearInterval(intervalId);
  }, [todayRecord]);

  // ── Action handler ──
  const handleActionClick = async (op) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const currentMode = todayRecord?.workMode || workMode;
    
    // Improved Geo Validation
    if (!isBypassUser && currentMode === 'Office') {
       setActionLoading(true);
       const result = await verifyLocation(officeSettings, true);
       setActionLoading(false);

       if (result !== 'valid' && op === 'checkin') {
          Toast.show({ type: 'error', text1: 'Out of Range', text2: 'Please move closer to office zone' });
          return;
       }
    }

    if (!user.faceDescriptor || user.faceDescriptor.length === 0) {
      Toast.show({ type: 'error', text1: 'Face ID Required', text2: 'Please register Face ID in Profile.' });
      return;
    }

    if (isBypassUser) {
      if (op === 'checkin') proceedCheckIn();
      else setShowReportModal(true);
      return;
    }

    setFaceOp(op);
    faceOpRef.current = op;
    setShowFaceModal(true);
  };

  const handleWebViewMessage = async (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'ready') {
        setTimeout(() => {
          webviewRef.current?.injectJavaScript(`
            window.USER_FACE_DESCRIPTOR = ${JSON.stringify(user.faceDescriptor || [])};
            window.FACE_OP = '${faceOpRef.current}';
            window.CONFIG_LOADED = true;
            true;
          `);
        }, 100);
      } else if (msg.type === 'error') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show({ type: 'error', text1: 'Verification Failed', text2: msg.error });
      } else if (msg.type === 'cancel') {
        setShowFaceModal(false);
      } else if (msg.type === 'descriptor') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({ type: 'success', text1: 'Identity Verified ✓' });
        setShowFaceModal(false);

        const op = faceOpRef.current;
        if (op === 'checkin') proceedCheckIn();
        else if (op === 'checkout') setShowReportModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const proceedCheckIn = async () => {
    setActionLoading(true);
    try {
      const lat = isBypassUser ? BYPASS_LAT : (locationRef.current?.latitude || userLocation?.latitude);
      const lng = isBypassUser ? BYPASS_LNG : (locationRef.current?.longitude || userLocation?.longitude);

      await checkIn({
        latitude: lat,
        longitude: lng,
        workMode: workMode
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Checked In', text2: `Working from ${workMode}` });
      fetchStatus();
      refreshProfile();
    } catch (error) {
      const msg = error.response?.data?.message || 'Check-in failed';
      Toast.show({ type: 'error', text1: 'Failed', text2: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const proceedCheckOut = async () => {
    if (!reportForm.todayWork.trim()) {
      Toast.show({ type: 'error', text1: 'Required', text2: "Please describe today's work" });
      return;
    }

    setActionLoading(true);
    try {
      const lat = isBypassUser ? BYPASS_LAT : (locationRef.current?.latitude || userLocation?.latitude);
      const lng = isBypassUser ? BYPASS_LNG : (locationRef.current?.longitude || userLocation?.longitude);

      const { data } = await checkOut({
        latitude: lat,
        longitude: lng,
        todayWork: reportForm.todayWork,
        pendingWork: reportForm.pendingWork,
        issuesFaced: reportForm.issuesFaced,
        reportParticipants: reportForm.reportParticipants,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const { overtimeMinutes, shortfallMinutes } = data.data;
      if (overtimeMinutes > 0) Toast.show({ type: 'success', text1: 'Checked Out', text2: `Overtime: ${overtimeMinutes}m` });
      else if (shortfallMinutes > 0) Toast.show({ type: 'info', text1: 'Checked Out', text2: `Shortfall: ${shortfallMinutes}m` });
      else Toast.show({ type: 'success', text1: 'Success', text2: 'Attendance synced' });

      setShowReportModal(false);
      setReportForm({ todayWork: '', pendingWork: '', issuesFaced: '', reportParticipants: [] });
      fetchStatus();
      refreshProfile();
    } catch (error) {
      const msg = error.response?.data?.message || 'Check-out failed';
      Toast.show({ type: 'error', text1: 'Failed', text2: msg });
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
  const currentWorkMode = todayRecord?.workMode || workMode;

  const renderGeoStatus = () => {
    if (isBypassUser) {
      return (
        <View style={[styles.geoPill, { backgroundColor: '#EDE9FE', borderColor: '#DDD6FE' }]}>
          <Ionicons name="flash" size={14} color="#7C3AED" />
          <Text style={[styles.geoText, { color: '#7C3AED' }]}>Remote Mode</Text>
        </View>
      );
    }

    if (currentWorkMode !== 'Office') {
      const isTracking = trackingActive && !isCheckedOut;
      return (
        <View style={[styles.geoPill, { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' }]}>
          <Ionicons name={isTracking ? "location" : "home"} size={14} color="#059669" />
          <Text style={[styles.geoText, { color: '#059669' }]}>
            {currentWorkMode} {isTracking ? '· GPS Tracking Active' : ''}
          </Text>
        </View>
      );
    }

    const map = {
      checking: { color: colors.primary, bg: '#E0F2FE', border: '#BAE6FD', icon: 'sync', text: 'Verifying Location...' },
      valid: { color: '#059669', bg: '#D1FAE5', border: '#A7F3D0', icon: 'checkmark-circle', text: `In Range · ${geoDistance}m` },
      invalid: { color: colors.error, bg: '#FEE2E2', border: '#FECACA', icon: 'close-circle', text: `Out of Range · ${geoDistance}m` },
      error: { color: colors.error, bg: '#FEE2E2', border: '#FECACA', icon: 'alert-circle', text: 'Location Error' },
      permission_denied: { color: colors.error, bg: '#FEE2E2', border: '#FECACA', icon: 'alert-circle', text: 'Permission Denied' },
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
      <LinearGradient
        colors={[color + '20', color + '05']}
        style={styles.miniMetricIcon}
      >
        <Ionicons name={icon} size={18} color={color} />
      </LinearGradient>
      <View>
        <Text style={styles.miniMetricLabel}>{label}</Text>
        <Text style={styles.miniMetricValue}>{value}</Text>
      </View>
    </View>
  );

  const canAct = useMemo(() => {
    if (actionLoading) return false;
    if (isBypassUser) return true;
    if (currentWorkMode !== 'Office') return true;
    return geoStatus === 'valid' && !!userLocation;
  }, [actionLoading, isBypassUser, currentWorkMode, geoStatus, userLocation]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStatus} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusSection}>
          {renderGeoStatus()}
          {!isBypassUser && currentWorkMode === 'Office' && (
            <TouchableOpacity onPress={() => verifyLocation(officeSettings, true)} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.heroContainer}>
          <LinearGradient
            colors={colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroCard}
          >
            <View style={[styles.heroBlob, { top: -40, right: -40, width: 200, height: 200, opacity: 0.1 }]} />
            <View style={[styles.heroBlob, { bottom: -30, left: -30, width: 120, height: 120, opacity: 0.05 }]} />

            <View style={styles.heroContent}>
              {isCheckedIn && !isCheckedOut ? (
                <View style={styles.activeSession}>
                  <Text style={[styles.timerLabel, isOvertime && { color: '#FDE047' }]}>
                    {isOvertime ? 'OVERTIME ACTIVE' : 'WORKING HOURS'}
                  </Text>
                  <Text style={[styles.timerText, isOvertime && { color: '#FDE047' }]}>
                    {isOvertime && '+'}{timerDisplay}
                  </Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                      <View style={[
                        styles.progressFill,
                        { width: `${progressPct}%` },
                        isOvertime && { backgroundColor: '#FDE047' }
                      ]} />
                    </View>
                    <Text style={styles.shiftTarget}>
                      Target: {new Date().getDay() === 6 ? '7.0h' : '8.5h'}
                    </Text>
                  </View>
                </View>
              ) : isCheckedOut ? (
                <View style={styles.doneSession}>
                  <View style={styles.doneIconBg}>
                    <Ionicons name="checkmark-done" size={48} color="#fff" />
                  </View>
                  <Text style={styles.doneTitle}>Duty Completed</Text>
                  <Text style={styles.doneSub}>Your records are synced for today.</Text>
                </View>
              ) : (
                <View style={styles.idleSession}>
                  <View style={styles.idleIconBg}>
                    <Ionicons name="finger-print" size={42} color="rgba(255,255,255,0.4)" />
                  </View>
                  <Text style={styles.idleTitle}>Check In</Text>
                  <Text style={styles.idleSub}>Select your mode to start the shift.</Text>
                </View>
              )}

              <View style={styles.heroActions}>
                {!isCheckedIn ? (
                  <>
                    <View style={styles.workModeRow}>
                      {['Office', 'Field', 'WFH'].map((mode) => (
                        <TouchableOpacity
                          key={mode}
                          style={[styles.workModeBtn, workMode === mode && styles.workModeBtnActive]}
                          onPress={() => setWorkMode(mode)}
                        >
                          <Text style={[styles.workModeText, workMode === mode && styles.workModeTextActive]}>
                            {mode}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={[styles.actionBtn, !canAct && styles.actionBtnDisabled]}
                      onPress={() => handleActionClick('checkin')}
                      disabled={!canAct}
                    >
                      <LinearGradient
                        colors={['#fff', '#F1F5F9']}
                        style={styles.actionBtnGradient}
                      >
                        {actionLoading ? <ActivityIndicator color={colors.primary} /> : (
                          <>
                            <Ionicons name="flash" size={18} color={colors.primary} />
                            <Text style={[styles.actionBtnText, { color: colors.primary }]}>START SHIFT</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                ) : !isCheckedOut ? (
                  <TouchableOpacity
                    style={[styles.actionBtn]}
                    onPress={() => handleActionClick('checkout')}
                  >
                    <LinearGradient
                      colors={['#EF4444', '#B91C1C']}
                      style={styles.actionBtnGradient}
                    >
                      {actionLoading ? <ActivityIndicator color="#fff" /> : (
                        <>
                          <Ionicons name="log-out" size={18} color="#fff" />
                          <Text style={[styles.actionBtnText, { color: '#fff' }]}>END SHIFT</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.completedBadge}>
                    <Ionicons name="shield-checkmark" size={14} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.completedBadgeText}>SECURE LOGS ACTIVE</Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.disclaimerContainer}>
          <Ionicons name="information-circle" size={14} color="#B45309" style={{marginRight: 6}} />
          <Text style={styles.disclaimerText}>
            Real-time GPS capture is active. Ensure you are within range.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Duty Overview</Text>
        <View style={styles.metricsGrid}>
          <AppCard style={styles.metricItem}>
            <MiniMetric
              label="Check In"
              value={todayRecord?.inTime ? format(new Date(todayRecord.inTime), 'hh:mm a') : '--:--'}
              icon="time"
              color="#10B981"
            />
          </AppCard>
          <AppCard style={styles.metricItem}>
            <MiniMetric
              label="Check Out"
              value={todayRecord?.outTime ? format(new Date(todayRecord.outTime), 'hh:mm a') : '--:--'}
              icon="log-out"
              color={colors.primary}
            />
          </AppCard>
          <AppCard style={styles.metricItem}>
            <MiniMetric
              label="Total Hrs"
              value={todayRecord?.totalHours ? todayRecord.totalHours.toFixed(1) + 'h' : '0.0h'}
              icon="hourglass"
              color="#F59E0B"
            />
          </AppCard>
          <AppCard style={styles.metricItem}>
            <MiniMetric
              label="Shift"
              value={isCheckedIn ? (isCheckedOut ? 'DONE' : 'ACTIVE') : 'PENDING'}
              icon="calendar"
              color="#8B5CF6"
            />
          </AppCard>
        </View>

        {todayRecord?.isLate && (
          <View style={styles.lateNotice}>
            <View style={styles.lateIconBg}>
              <Ionicons name="alert-circle" size={20} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.lateTitle}>Late Check-In Detected</Text>
              <Text style={styles.lateSub}>Delayed by {todayRecord.lateMinutes} minutes.</Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        isVisible={showFaceModal}
        style={{ margin: 0 }}
        backdropOpacity={1}
        backdropColor="#0F172A"
      >
        <View style={{ flex: 1, backgroundColor: '#0F172A', paddingTop: Platform.OS === 'ios' ? 50 : 0 }}>
          {showFaceModal && !!htmlContent && (
            <WebView
              ref={webviewRef}
              source={{ html: htmlContent, baseUrl: 'https://localhost' }}
              originWhitelist={['*']}
              style={{ flex: 1 }}
              onMessage={handleWebViewMessage}
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback={true}
              onPermissionRequest={(request) => request.grant(request.resources)}
            />
          )}
        </View>
      </Modal>

      <Modal
        isVisible={showReportModal}
        style={styles.modal}
        onBackdropPress={() => !actionLoading && setShowReportModal(false)}
        propagateSwipe
        swipeDirection="down"
        onSwipeComplete={() => !actionLoading && setShowReportModal(false)}
        avoidKeyboard={true}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Daily Report</Text>
                <Text style={styles.modalSubtitle}>Sync your progress before signing off</Text>
              </View>
              <TouchableOpacity onPress={() => !actionLoading && setShowReportModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.reportFieldBlock}>
                <View style={styles.reportLabelRow}>
                  <Ionicons name="briefcase-outline" size={16} color={colors.primary} />
                  <Text style={styles.reportLabel}>Work Completed <Text style={{color: '#EF4444'}}>*</Text></Text>
                </View>
                <TextInput
                  style={[styles.reportInput, { height: 100 }]}
                  placeholder="What did you achieve today?"
                  multiline
                  value={reportForm.todayWork}
                  onChangeText={t => setReportForm({ ...reportForm, todayWork: t })}
                />
              </View>

              <View style={styles.reportFieldBlock}>
                <View style={styles.reportLabelRow}>
                  <Ionicons name="list-outline" size={16} color="#F59E0B" />
                  <Text style={styles.reportLabel}>Pending Tasks</Text>
                </View>
                <TextInput
                  style={[styles.reportInput, { height: 80 }]}
                  placeholder="Tasks for tomorrow..."
                  multiline
                  value={reportForm.pendingWork}
                  onChangeText={t => setReportForm({ ...reportForm, pendingWork: t })}
                />
              </View>

              <View style={styles.reportFieldBlock}>
                <View style={styles.reportLabelRow}>
                  <Ionicons name="people-outline" size={16} color="#6366F1" />
                  <Text style={styles.reportLabel}>Share with Team</Text>
                </View>
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
              </View>
              <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={proceedCheckOut}
                disabled={actionLoading}
              >
                <LinearGradient
                  colors={colors.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtnGradient}
                >
                  {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit & Sign Out</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContainer: { padding: 20 },
  statusSection: { marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  geoPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  geoText: { fontSize: 11, fontWeight: '800' },
  refreshBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' },

  heroContainer: { marginBottom: 24 },
  heroCard: { minHeight: 320, borderRadius: 32, padding: 24, overflow: 'hidden', elevation: 12, shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
  heroBlob: { position: 'absolute', borderRadius: 100, backgroundColor: '#fff' },
  heroContent: { flex: 1, justifyContent: 'space-between' },

  activeSession: { alignItems: 'center' },
  timerLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, marginBottom: 4 },
  timerText: { fontSize: 52, fontWeight: '900', color: '#fff', fontVariant: ['tabular-nums'] },
  progressContainer: { width: '100%', marginTop: 12, alignItems: 'center' },
  progressTrack: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  shiftTarget: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '700', marginTop: 8 },

  idleSession: { alignItems: 'center' },
  idleIconBg: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  idleTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  idleSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },

  doneSession: { alignItems: 'center' },
  doneIconBg: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  doneTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  doneSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },

  heroActions: { marginTop: 16 },
  workModeRow: { flexDirection: 'row', gap: 6, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.15)', padding: 4, borderRadius: 20 },
  workModeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 16 },
  workModeBtnActive: { backgroundColor: '#fff' },
  workModeText: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 12 },
  workModeTextActive: { color: colors.primary, fontWeight: '900' },

  actionBtn: { height: 54, borderRadius: 20, overflow: 'hidden' },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  actionBtnText: { fontSize: 15, fontWeight: '900' },

  completedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 10, borderRadius: 14 },
  completedBadgeText: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },

  disclaimerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 12, borderRadius: 12, marginBottom: 24 },
  disclaimerText: { fontSize: 11, color: '#92400E', flex: 1, lineHeight: 16, fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 16 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricItem: { width: (width - 52) / 2, padding: 16, borderRadius: 24 },
  miniMetric: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniMetricIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  miniMetricLabel: { fontSize: 10, fontWeight: '800', color: colors.textTertiary, textTransform: 'uppercase', marginBottom: 2 },
  miniMetricValue: { fontSize: 15, fontWeight: '900', color: colors.text },

  lateNotice: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, backgroundColor: '#FFF7ED', borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  lateIconBg: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFEDD5', justifyContent: 'center', alignItems: 'center' },
  lateTitle: { fontSize: 13, fontWeight: '800', color: colors.text },
  lateSub: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, marginTop: 1 },

  modal: { margin: 0, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingHorizontal: 20, paddingTop: 12, height: '90%' },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: colors.text },
  modalSubtitle: { fontSize: 13, fontWeight: '600', color: colors.textTertiary, marginTop: 2 },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },

  reportFieldBlock: { marginBottom: 20 },
  reportLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  reportLabel: { fontSize: 14, fontWeight: '800', color: colors.textSecondary },
  reportInput: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: '#E2E8F0', textAlignVertical: 'top' },
  participantsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  participantPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  selectedPill: { backgroundColor: colors.primary, borderColor: colors.primary },
  participantText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  
  modalFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  submitBtn: { height: 54, borderRadius: 18, overflow: 'hidden' },
  submitBtnGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});

export default AttendanceScreen;