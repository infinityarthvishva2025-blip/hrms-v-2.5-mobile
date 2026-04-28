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
  ActivityIndicator
} from 'react-native';
import { colors } from '../../constants/colors';
import { requestCorrection } from '../../api/attendance.api';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../hooks/useAuth';
import PremiumHeader from '../../components/common/PremiumHeader';
import AppCard from '../../components/common/AppCard';
import { LinearGradient } from 'expo-linear-gradient';


const CorrectionRequestScreen = ({ route, navigation }) => {
  const { user } = useAuth(); // Assuming useAuth is available or I'll add it
  const { record } = route.params;
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    requestedInTime: record.inTime ? new Date(record.inTime).toTimeString().slice(0, 5) : '09:30',
    requestedOutTime: record.outTime ? new Date(record.outTime).toTimeString().slice(0, 5) : '18:00',
    reason: '',
    proofUrl: ''
  });

  const handleSubmit = async () => {
    if (!form.reason.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please provide a reason' });
      return;
    }

    setLoading(true);
    try {
      const date = new Date(record.date).toISOString().split('T')[0];
      const payload = {
        reason: form.reason,
        requestedInTime: `${date}T${form.requestedInTime}:00`,
        requestedOutTime: `${date}T${form.requestedOutTime}:00`,
        proofUrl: form.proofUrl,
      };

      await requestCorrection(record._id, payload);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Correction request submitted' });
      navigation.goBack();
    } catch (error) {
      console.error('Correction error:', error);
      Toast.show({ 
        type: 'error', 
        text1: 'Failed', 
        text2: error.response?.data?.message || 'Could not submit request' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <PremiumHeader 
          title="Correction Request"
          moduleBadge="CORRECTION"
          showBack={true}
          onBack={() => navigation.goBack()}
          user={user}
          navigation={navigation}
        />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <AppCard style={styles.infoCard}>
             <View style={styles.infoIcon}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
             </View>
             <View>
                <Text style={styles.infoLabel}>Correction for Date</Text>
                <Text style={styles.infoValue}>
                  {new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
             </View>
          </AppCard>

          <View style={styles.formSection}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Requested In-Time</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="time-outline" size={20} color={colors.textTertiary} />
                <TextInput
                  style={styles.input}
                  value={form.requestedInTime}
                  onChangeText={(val) => setForm({...form, requestedInTime: val})}
                  placeholder="HH:MM (24h)"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Requested Out-Time</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="time-outline" size={20} color={colors.textTertiary} />
                <TextInput
                  style={styles.input}
                  value={form.requestedOutTime}
                  onChangeText={(val) => setForm({...form, requestedOutTime: val})}
                  placeholder="HH:MM (24h)"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Reason *</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.textTertiary} style={styles.textAreaIcon} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.reason}
                  onChangeText={(val) => setForm({...form, reason: val})}
                  placeholder="Provide a valid reason for correction..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Supporting Proof (Link)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="link" size={20} color={colors.textTertiary} />
                <TextInput
                  style={styles.input}
                  value={form.proofUrl}
                  onChangeText={(val) => setForm({...form, proofUrl: val})}
                  placeholder="Link to document or image"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitBtnContainer, loading && styles.disabledBtn]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? [colors.textTertiary, colors.textTertiary] : colors.gradients.primary}
              style={styles.submitBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Submit Request</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>

  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: colors.surface, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border,
    gap: 12
  },
  title: { fontSize: 20, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  infoCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: 24, 
    marginBottom: 24,
    gap: 16
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: { fontSize: 11, color: colors.textTertiary, textTransform: 'uppercase', fontWeight: '800', marginBottom: 4, letterSpacing: 1 },
  infoValue: { fontSize: 17, fontWeight: '900', color: colors.text },
  
  formSection: { gap: 4 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 10, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56
  },
  input: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text, paddingLeft: 12 },
  
  textAreaWrapper: {
    height: 120,
    alignItems: 'flex-start',
    paddingTop: 16,
  },
  textAreaIcon: { marginTop: 2 },
  textArea: { flex: 1, height: '100%', paddingTop: 0 },
  
  submitBtnContainer: {
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtn: {
    height: 62,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  disabledBtn: { opacity: 0.6, elevation: 0, shadowOpacity: 0 },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
});


export default CorrectionRequestScreen;
