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

  const verifyLocation = useCallback(async (office) => {
    if (!office) return;
    setGeoStatus('checking');
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGeoStatus('permission_denied');
        return;
      }

      let coords = null;
      try {
        const last = await Location.getLastKnownPositionAsync();
        if (last?.coords) {
          coords = last.coords;
          setUserLocation(coords);
          const dist = calculateDistance(coords.latitude, coords.longitude, office.lat, office.lng);
          setGeoDistance(Math.round(dist));
          setGeoStatus(dist <= office.radius ? 'valid' : 'invalid');
        }
      } catch (_) {}

      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low })
        .then(loc => {
          if (!loc?.coords) return;
          coords = loc.coords;
          locationRef.current = coords;
          setUserLocation(coords);
          const dist = calculateDistance(coords.latitude, coords.longitude, office.lat, office.lng);
          setGeoDistance(Math.round(dist));
          setGeoStatus(dist <= office.radius ? 'valid' : 'invalid');
        })
        .catch(() => {
          if (!coords) setGeoStatus('error');
        });
    } catch (error) {
      setGeoStatus('error');
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

  // ── Haptic‑rich action handler ──
  const handleActionClick = (op) => {
    // Haptic feedback on button tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const currentWorkMode = todayRecord?.workMode || workMode; // always use workMode from record
    // Zone check only for Office mode, bypass allowed for bypass users
    if (!isBypassUser && currentWorkMode === 'Office' && geoStatus !== 'valid') {
      Toast.show({ type: 'error', text1: 'Error', text2: 'You must be within office zone' });
      return;
    }

    if (!user.faceDescriptor || user.faceDescriptor.length === 0) {
      Toast.show({ type: 'error', text1: 'Face ID Required', text2: 'Please register Face ID in your Profile.' });
      return;
    }

    if (isBypassUser) {
      if (op === 'checkin') {
        proceedCheckIn();
      } else {
        setShowReportModal(true);
      }
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
        if (op === 'checkin') {
          proceedCheckIn();
        } else if (op === 'checkout') {
          setShowReportModal(true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const proceedCheckIn = async () => {
    setActionLoading(true);
    try {
      const lat = isBypassUser ? BYPASS_LAT : userLocation?.latitude;
      const lng = isBypassUser ? BYPASS_LNG : userLocation?.longitude;

      await checkIn({
        latitude: lat,
        longitude: lng,
        workMode: workMode
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
      const lat = isBypassUser ? BYPASS_LAT : userLocation?.latitude;
      const lng = isBypassUser ? BYPASS_LNG : userLocation?.longitude;

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
      if (overtimeMinutes > 0) Toast.show({ type: 'success', text1: 'Success', text2: `Checked out! Overtime: ${overtimeMinutes}m` });
      else if (shortfallMinutes > 0) Toast.show({ type: 'info', text1: 'Early Checkout', text2: `Checked out ${shortfallMinutes}m early` });
      else Toast.show({ type: 'success', text1: 'Success', text2: 'Checked out successfully' });

      setShowReportModal(false);
      setReportForm({ todayWork: '', pendingWork: '', issuesFaced: '', reportParticipants: [] });
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
  const currentWorkMode = todayRecord?.workMode || workMode;

  const renderGeoStatus = () => {
    if (isBypassUser) {
      return (
        <View style={[styles.geoPill, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
          <Ionicons name="flash" size={14} color="#8B5CF6" />
          <Text style={[styles.geoText, { color: '#8B5CF6' }]}>Remote Access</Text>
        </View>
      );
    }

    if (currentWorkMode !== 'Office') {
      const isTracking = trackingActive && !isCheckedOut;
      return (
        <View style={[styles.geoPill, { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)' }]}>
          <Ionicons name={isTracking ? "location" : "home"} size={14} color={colors.success} />
          <Text style={[styles.geoText, { color: colors.success }]}>
            {currentWorkMode} {isTracking ? '· Tracking Active' : ''}
          </Text>
        </View>
      );
    }

    const map = {
      checking: { color: '#2076C7', bg: 'rgba(32,118,199,0.12)', border: 'rgba(32,118,199,0.3)', icon: 'sync', text: 'Verifying Location...' },
      valid: { color: '#059669', bg: 'rgba(5,150,105,0.12)', border: 'rgba(5,150,105,0.3)', icon: 'checkmark-circle', text: `Within Office · ${geoDistance}m` },
      invalid: { color: colors.error, bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: 'close-circle', text: `Out of Zone · ${geoDistance}m` },
      error: { color: colors.error, bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: 'alert-circle', text: 'Location Error' },
      permission_denied: { color: colors.error, bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: 'alert-circle', text: 'Location Blocked' },
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
        {/* Geo Status Chip */}
        <View style={styles.statusSection}>
          {renderGeoStatus()}
          {!isBypassUser && currentWorkMode === 'Office' && (
            <TouchableOpacity onPress={() => verifyLocation(officeSettings)} style={{ padding: 8 }}>
              <Ionicons name="refresh" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Premium Hero Action Card */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={['#1E3A8A', '#3B82F6']}  // deeper, more premium gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroCard}
          >
            <View style={[styles.heroBlob, { top: -60, right: -60, width: 220, height: 220, opacity: 0.15 }]} />
            <View style={[styles.heroBlob, { bottom: -40, left: -40, width: 140, height: 140, opacity: 0.1 }]} />

            <View style={styles.heroContent}>
              {isCheckedIn && !isCheckedOut ? (
                <View style={styles.activeSession}>
                  {/* Timer Section – gradient pill */}
                  <LinearGradient
                    colors={isOvertime
                      ? ['rgba(245,158,11,0.22)', 'rgba(239,68,68,0.18)']
                      : ['rgba(32,118,199,0.22)', 'rgba(28,173,163,0.22)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.timerGradientCard}
                  >
                    <Text style={[styles.timerLabel, isOvertime && { color: '#FCD34D' }]}>
                      {isOvertime ? '🔥 OVERTIME RUNNING' : '⏱ TIME REMAINING'}
                    </Text>
                    <Text
                      style={[styles.timerText, isOvertime && { color: '#FCD34D' }]}
                      adjustsFontSizeToFit
                      numberOfLines={1}
                    >
                      {isOvertime && '+'}{timerDisplay}
                    </Text>
                    <View style={styles.progressTrack}>
                      <View style={[
                        styles.progressFill,
                        { width: `${progressPct}%` },
                        isOvertime && { backgroundColor: '#FCD34D' }
                      ]} />
                    </View>
                    <Text style={[styles.shiftTarget, { marginTop: 8 }]}>
                      SHIFT GOAL · {new Date().getDay() === 6 ? '7.0 hrs' : '8.5 hrs'}
                    </Text>
                  </LinearGradient>
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
                  <Text style={styles.idleTitle}>Ready to Begin?</Text>
                  <Text style={styles.idleSub}>Select work mode and check in securely.</Text>
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
                          activeOpacity={0.7}
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
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={canAct ? ['#fff', 'rgba(255,255,255,0.9)'] : ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.3)']}
                        style={styles.actionBtnGradient}
                      >
                        {actionLoading ? <ActivityIndicator color={colors.primary} /> : (
                          <>
                            <Ionicons name="flash" size={20} color={canAct ? colors.primary : '#fff'} />
                            <Text style={[styles.actionBtnText, { color: canAct ? colors.primary : '#fff' }]}>GEO CHECK IN</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                ) : !isCheckedOut ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, !canAct && styles.actionBtnDisabled]}
                    onPress={() => handleActionClick('checkout')}
                    disabled={!canAct}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={canAct ? ['#EF4444', '#DC2626'] : ['#94a3b8', '#64748b']}
                      style={styles.actionBtnGradient}
                    >
                      {actionLoading ? <ActivityIndicator color="#fff" /> : (
                        <>
                          <Ionicons name="log-out" size={20} color="#fff" />
                          <Text style={[styles.actionBtnText, { color: '#fff' }]}>GEO CHECK OUT</Text>
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

        {/* Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            ⚠️ Disclaimer: Your live location is being captured for attendance purposes.
            Please do not use camera photos or fake location methods.
          </Text>
        </View>

        {/* Premium Metrics Grid */}
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

      {/* Face Verification Modal (WebView) */}
      <Modal
        isVisible={showFaceModal}
        style={{ margin: 0 }}
        animationIn="fadeIn"
        animationOut="fadeOut"
        animationInTiming={250}
        animationOutTiming={200}
        backdropOpacity={1}
        backdropColor="#080C14"
        useNativeDriver
      >
        <View style={{ flex: 1, backgroundColor: '#080C14', paddingTop: Platform.OS === 'ios' ? 44 : 0 }}>
          {showFaceModal && !!htmlContent && (
            <WebView
              ref={webviewRef}
              source={{ html: htmlContent, baseUrl: 'https://localhost' }}
              originWhitelist={['*']}
              allowFileAccessFromFileURLs={true}
              allowUniversalAccessFromFileURLs={true}
              mixedContentMode="always"
              style={{ flex: 1, backgroundColor: '#080C14' }}
              onMessage={handleWebViewMessage}
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              cacheEnabled={true}
              onPermissionRequest={(request) => {
                request.grant(request.resources);
              }}
            />
          )}
        </View>
      </Modal>

      {/* Checkout Report Modal – Premium Bottom Sheet */}
      <Modal
        isVisible={showReportModal}
        style={styles.modal}
        onBackdropPress={() => !actionLoading && setShowReportModal(false)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        animationInTiming={350}
        animationOutTiming={300}
        backdropTransitionInTiming={200}
        backdropTransitionOutTiming={200}
        propagateSwipe
        swipeDirection="down"
        onSwipeComplete={() => !actionLoading && setShowReportModal(false)}
        avoidKeyboard={true}
        useNativeDriver={true}
        hideModalContentWhileAnimating={true}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <View style={styles.modalContent}>
            {/* Drag handle */}
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>End of Day Report</Text>
                <Text style={styles.modalSubtitle}>Required before check-out</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => !actionLoading && setShowReportModal(false)}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              keyboardShouldPersistTaps="handled"
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Today's Work */}
              <View style={styles.reportFieldBlock}>
                <View style={styles.reportLabelRow}>
                  <View style={[styles.reportLabelIcon, { backgroundColor: colors.success + '15' }]}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                  </View>
                  <Text style={styles.reportLabel}>Today's Completed Work <Text style={{ color: colors.error }}>*</Text></Text>
                </View>
                <TextInput
                  style={[styles.reportInput, { height: 90 }]}
                  placeholder="Describe what you accomplished today…"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={reportForm.todayWork}
                  onChangeText={t => setReportForm({ ...reportForm, todayWork: t })}
                />
              </View>

              {/* Pending Work */}
              <View style={styles.reportFieldBlock}>
                <View style={styles.reportLabelRow}>
                  <View style={[styles.reportLabelIcon, { backgroundColor: colors.warning + '15' }]}>
                    <Ionicons name="time-outline" size={16} color={colors.warning} />
                  </View>
                  <Text style={styles.reportLabel}>Pending / Carry-over Tasks</Text>
                </View>
                <TextInput
                  style={[styles.reportInput, { height: 70 }]}
                  placeholder="Tasks carrying over to tomorrow…"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                  value={reportForm.pendingWork}
                  onChangeText={t => setReportForm({ ...reportForm, pendingWork: t })}
                />
              </View>

              {/* Issues */}
              <View style={styles.reportFieldBlock}>
                <View style={styles.reportLabelRow}>
                  <View style={[styles.reportLabelIcon, { backgroundColor: colors.error + '12' }]}>
                    <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                  </View>
                  <Text style={styles.reportLabel}>Issues / Blockers</Text>
                </View>
                <TextInput
                  style={[styles.reportInput, { height: 70 }]}
                  placeholder="Any blockers or challenges faced?"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                  value={reportForm.issuesFaced}
                  onChangeText={t => setReportForm({ ...reportForm, issuesFaced: t })}
                />
              </View>

              {/* Share with */}
              <View style={styles.reportFieldBlock}>
                <View style={styles.reportLabelRow}>
                  <View style={[styles.reportLabelIcon, { backgroundColor: colors.info + '12' }]}>
                    <Ionicons name="people-outline" size={16} color={colors.info} />
                  </View>
                  <Text style={styles.reportLabel}>Share Report With</Text>
                </View>
                <View style={styles.participantsContainer}>
                  {managementEmps.map(emp => {
                    const selected = reportForm.reportParticipants.includes(emp._id);
                    return (
                      <TouchableOpacity
                        key={emp._id}
                        onPress={() => toggleParticipant(emp._id)}
                        style={[styles.participantPill, selected && styles.selectedPill]}
                        activeOpacity={0.75}
                      >
                        {selected && <Ionicons name="checkmark" size={12} color="#fff" style={{ marginRight: 4 }} />}
                        <Text style={[styles.participantText, selected && { color: '#fff' }]}>{emp.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={{ height: 100 }} />
            </ScrollView>

            {/* Sticky Submit Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.submitBtn, actionLoading && styles.disabledBtn]}
                onPress={proceedCheckOut}
                disabled={actionLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtnGradient}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="log-out" size={20} color="#fff" />
                      <Text style={styles.submitBtnText}>Submit & Check Out</Text>
                    </>
                  )}
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
  container: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { padding: 20, paddingTop: 16 },

  statusSection: { marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
    minHeight: 340,
    borderRadius: 36,
    padding: 28,
    overflow: 'hidden',
    elevation: 14,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    backgroundColor: 'transparent', // gradient handles background
  },
  heroBlob: {
    position: 'absolute',
    borderRadius: 110,
    backgroundColor: '#fff',
  },
  heroContent: { flex: 1, justifyContent: 'space-between', zIndex: 2 },

  activeSession: { alignItems: 'center', marginTop: 10 },
  timerGradientCard: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  timerLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.75)', letterSpacing: 1.5, marginBottom: 6 },
  timerText: {
    fontSize: 56,
    fontWeight: '900',
    color: '#fff',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1.5,
  },
  progressTrack: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 3
  },
  shiftTarget: { fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: '800', letterSpacing: 0.5 },

  idleSession: { alignItems: 'center', marginTop: 10 },
  idleIconBg: { width: 72, height: 72, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  idleTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 6, letterSpacing: -0.5 },
  idleSub: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: 220, lineHeight: 20 },

  doneSession: { alignItems: 'center', marginTop: 20 },
  doneIconBg: { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  doneTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 8 },
  doneSub: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: 240 },

  heroActions: { marginTop: 20 },
  workModeRow: { flexDirection: 'row', gap: 8, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.1)', padding: 4, borderRadius: 20 },
  workModeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 16 },
  workModeBtnActive: { backgroundColor: '#fff', elevation: 2 },
  workModeText: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 13 },
  workModeTextActive: { color: colors.primary, fontWeight: '900' },

  actionBtn: {
    height: 60,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  actionBtnDisabled: { opacity: 0.8 },
  actionBtnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  actionBtnText: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  completedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, borderRadius: 16 },
  completedBadgeText: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },

  sectionTitle: { fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 16, letterSpacing: -0.8 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricItem: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)', // semi‑transparent glass
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  miniMetric: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  miniMetricIcon: { width: 38, height: 38, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  miniMetricLabel: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', marginBottom: 2, letterSpacing: 0.6 },
  miniMetricValue: { fontSize: 16, fontWeight: '900', color: colors.text },

  lateNotice: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: 24, marginTop: 20, backgroundColor: colors.warning + '08', borderLeftWidth: 4, borderLeftColor: colors.warning },
  lateIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.warning + '15', justifyContent: 'center', alignItems: 'center' },
  lateTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  lateSub: { fontSize: 12, fontWeight: '600', color: colors.textTertiary, marginTop: 2 },

  modal: { margin: 0, justifyContent: 'flex-end' },
  modalContent: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: '94%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.borderDark,
    alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
    paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.8 },
  modalSubtitle: { fontSize: 13, fontWeight: '600', color: colors.textTertiary, marginTop: 3 },
  modalCloseBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center', alignItems: 'center',
  },
  reportFieldBlock: { marginBottom: 4 },
  reportLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 10 },
  reportLabelIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  reportLabel: { fontSize: 13, fontWeight: '800', color: colors.textSecondary },
  reportInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 18,
    padding: 16,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: colors.border,
    lineHeight: 22,
  },
  participantsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  participantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  disclaimerContainer: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    padding: 10,
    marginBottom: 12,
    borderRadius: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
  selectedPill: { backgroundColor: colors.primary, borderColor: colors.primary },
  participantText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  modalFooter: {
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitBtn: {
    height: 58,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnGradient: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 10,
  },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  disabledBtn: { opacity: 0.65 }
});

export default AttendanceScreen;