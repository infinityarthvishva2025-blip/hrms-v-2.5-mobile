import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { colors } from '../../constants/colors';
import { requestCorrection } from '../../api/attendance.api';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../hooks/useAuth';
import AppCard from '../../components/common/AppCard';
import AppDateTimePicker from '../../components/common/AppDateTimePicker';
import { LinearGradient } from 'expo-linear-gradient';
import PremiumHeader from '../../components/common/PremiumHeader';

const { width } = Dimensions.get('window');

const CorrectionRequestScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { record } = route.params;
  const [loading, setLoading] = useState(false);
  
  const getInitialTime = (timeStr, defaultHour, defaultMin) => {
    if (timeStr) {
      return new Date(timeStr);
    }
    const d = new Date();
    d.setHours(defaultHour, defaultMin, 0, 0);
    return d;
  };

  const [form, setForm] = useState({
    requestedInTime: getInitialTime(record.inTime, 9, 30),
    requestedOutTime: getInitialTime(record.outTime, 18, 0),
    reason: '',
    proofUrl: ''
  });
const handleSubmit = async () => {
  if (!form.reason.trim()) {
    Toast.show({
      type: 'error',
      text1: 'Reason Required',
      text2: 'Please describe why this correction is needed.',
    });
    return;
  }

  setLoading(true);

  try {
    // ✅ Step 1: Get base date (LOCAL, not ISO)
    const baseDate = new Date(record.date);

    // ✅ Step 2: Create full datetime objects in LOCAL time
    const inDateTime = new Date(baseDate);
    inDateTime.setHours(
      form.requestedInTime.getHours(),
      form.requestedInTime.getMinutes(),
      0,
      0
    );

    const outDateTime = new Date(baseDate);
    outDateTime.setHours(
      form.requestedOutTime.getHours(),
      form.requestedOutTime.getMinutes(),
      0,
      0
    );

    // ✅ Step 3: Convert to ISO (UTC) before sending
    const payload = {
      reason: form.reason,
      requestedInTime: inDateTime.toISOString(),
      requestedOutTime: outDateTime.toISOString(),
      proofUrl: form.proofUrl,
    };

    // 🔍 Debug (optional but VERY useful)
    console.log('Payload:', payload);

    await requestCorrection(record._id, payload);

    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Your request has been submitted for review.',
    });

    navigation.goBack();
  } catch (error) {
    const msg =
      error.response?.data?.message ||
      'Submission failed. Please check your connection.';

    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: msg,
    });
  } finally {
    setLoading(false);
  }
};
  // const handleSubmit = async () => {
  //   if (!form.reason.trim()) {
  //     Toast.show({ type: 'error', text1: 'Reason Required', text2: 'Please describe why this correction is needed.' });
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     const recordDateStr = new Date(record.date).toISOString().split('T')[0];
      
  //     const inTimeStr = `${recordDateStr}T${form.requestedInTime.getHours().toString().padStart(2, '0')}:${form.requestedInTime.getMinutes().toString().padStart(2, '0')}:00`;
  //     const outTimeStr = `${recordDateStr}T${form.requestedOutTime.getHours().toString().padStart(2, '0')}:${form.requestedOutTime.getMinutes().toString().padStart(2, '0')}:00`;

  //     const payload = {
  //       reason: form.reason,
  //       requestedInTime: inTimeStr,
  //       requestedOutTime: outTimeStr,
  //       proofUrl: form.proofUrl,
  //     };

  //     await requestCorrection(record._id, payload);
  //     Toast.show({ type: 'success', text1: 'Success', text2: 'Your request has been submitted for review.' });
  //     navigation.goBack();
  //   } catch (error) {
  //     const msg = error.response?.data?.message || 'Submission failed. Please check your connection.';
  //     Toast.show({ type: 'error', text1: 'Error', text2: msg });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <PremiumHeader 
          title="Correction Request" 
          moduleBadge="ATTENDANCE" 
          showBack={true} 
          user={user} 
          navigation={navigation} 
        />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <AppCard style={styles.infoCard}>
             <LinearGradient
               colors={['#6366F1', '#4F46E5']}
               style={styles.iconBg}
             >
                <Ionicons name="calendar-clear" size={24} color="#fff" />
             </LinearGradient>
             <View style={styles.infoDetails}>
                <Text style={styles.infoLabel}>RECORD DATE</Text>
                <Text style={styles.infoDate}>
                  {new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </Text>
                <View style={styles.currentStatus}>
                   <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                   <Text style={styles.statusText}>Current Status: {record.status || 'N/A'}</Text>
                </View>
             </View>
          </AppCard>

          <View style={styles.formContainer}>
            <View style={styles.timeRow}>
              <View style={styles.timePickerBox}>
                <AppDateTimePicker
                  label="NEW CLOCK-IN"
                  mode="time"
                  icon="time-outline"
                  value={form.requestedInTime}
                  onChange={(val) => setForm({ ...form, requestedInTime: val })}
                />
              </View>
              <View style={styles.timePickerBox}>
                <AppDateTimePicker
                  label="NEW CLOCK-OUT"
                  mode="time"
                  icon="time-outline"
                  value={form.requestedOutTime}
                  onChange={(val) => setForm({ ...form, requestedOutTime: val })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>JUSTIFICATION *</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.reason}
                  onChangeText={(val) => setForm({...form, reason: val})}
                  placeholder="Why is this correction needed? (e.g., Forgot to punch, Technical issue)"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ATTACHMENT / PROOF LINK (OPTIONAL)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="link-outline" size={20} color={colors.textTertiary} />
                <TextInput
                  style={styles.input}
                  value={form.proofUrl}
                  onChangeText={(val) => setForm({...form, proofUrl: val})}
                  placeholder="https://drive.google.com/..."
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitAction, loading && styles.disabledAction]} 
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={loading ? ['#CBD5E1', '#94A3B8'] : colors.gradients.primary}
              style={styles.gradientBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
                  <Text style={styles.submitText}>SUBMIT FOR APPROVAL</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  
  infoCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 24, 
    borderRadius: 32, 
    marginBottom: 30,
    gap: 20,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12,
  },
  iconBg: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#6366F1', shadowOpacity: 0.3 },
  infoDetails: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '900', letterSpacing: 1.2, marginBottom: 6 },
  infoDate: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginBottom: 10 },
  currentStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  
  formContainer: { gap: 10 },
  timeRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  timePickerBox: { flex: 1 },

  inputGroup: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '900', color: '#64748B', marginBottom: 10, marginLeft: 4, letterSpacing: 0.5 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 20,
    height: 60,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '700', color: '#334155', paddingLeft: 10 },
  
  textAreaWrapper: {
    height: 140,
    alignItems: 'flex-start',
    paddingTop: 18,
  },
  textArea: { flex: 1, height: '100%', paddingTop: 0, lineHeight: 22 },
  
  submitAction: {
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  gradientBtn: {
    height: 64,
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  disabledAction: { opacity: 0.7, elevation: 0 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
});

export default CorrectionRequestScreen;
