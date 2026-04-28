import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  StatusBar 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { changePassword } from '../../api/auth.api';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';

const ChangePasswordScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'All fields are required.' });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      Toast.show({ type: 'error', text1: 'Mismatch', text2: 'Passwords do not match.' });
      return;
    }
    if (form.newPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'Security Rule', text2: 'Password must be at least 6 characters.' });
      return;
    }

    try {
      setLoading(true);
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      Toast.show({ type: 'success', text1: 'Security Updated', text2: 'Password changed successfully.' });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Update Failed', text2: err?.response?.data?.message || 'Check your credentials' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Module Master Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <LinearGradient
          colors={colors.gradients.primary}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Security</Text>
          <View style={styles.headerBtn} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Info Banner */}
        <View style={styles.infoBanner}>
           <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
           <Text style={styles.infoText}>
              Ensure your new password contains a mix of letters, numbers, and symbols for maximum protection.
           </Text>
        </View>

        <View style={styles.formCard}>
           <Text style={styles.cardTitle}>Update Password</Text>

           {/* Current Password */}
           <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CURRENT PASSWORD</Text>
              <View style={styles.inputContainer}>
                 <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
                 <TextInput
                    placeholder="Enter current password"
                    placeholderTextColor={colors.textTertiary}
                    value={form.currentPassword}
                    onChangeText={(t) => setForm({ ...form, currentPassword: t })}
                    secureTextEntry={!showCurrent}
                    style={styles.textInput}
                 />
                 <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                    <Ionicons name={showCurrent ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textTertiary} />
                 </TouchableOpacity>
              </View>
           </View>

           {/* New Password */}
           <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NEW PASSWORD</Text>
              <View style={styles.inputContainer}>
                 <Ionicons name="key-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
                 <TextInput
                    placeholder="Min. 6 characters"
                    placeholderTextColor={colors.textTertiary}
                    value={form.newPassword}
                    onChangeText={(t) => setForm({ ...form, newPassword: t })}
                    secureTextEntry={!showNew}
                    style={styles.textInput}
                 />
                 <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                    <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textTertiary} />
                 </TouchableOpacity>
              </View>
           </View>

           {/* Confirm Password */}
           <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
              <View style={styles.inputContainer}>
                 <Ionicons name="checkmark-shield-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
                 <TextInput
                    placeholder="Re-enter new password"
                    placeholderTextColor={colors.textTertiary}
                    value={form.confirmPassword}
                    onChangeText={(t) => setForm({ ...form, confirmPassword: t })}
                    secureTextEntry={!showConfirm}
                    style={styles.textInput}
                 />
                 <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                    <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textTertiary} />
                 </TouchableOpacity>
              </View>
           </View>

           <TouchableOpacity 
             activeOpacity={0.8} 
             onPress={handleSubmit} 
             disabled={loading}
             style={styles.actionBtnContainer}
           >
              <LinearGradient
                colors={colors.gradients.primary}
                style={styles.actionBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>Update Access Key</Text>
                  </>
                )}
              </LinearGradient>
           </TouchableOpacity>
        </View>

        <View style={styles.footer}>
           <Text style={styles.footerText}>Secure Terminal Connection Active</Text>
           <Text style={styles.footerText}>v2.1.0_S</Text>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8, zIndex: 100,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 15 },
  headerBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 1 },

  scrollContent: { padding: 16 },
  
  infoBanner: { 
    flexDirection: 'row', gap: 12, 
    backgroundColor: colors.primary + '08', 
    padding: 16, borderRadius: 20, 
    marginBottom: 20, borderWidth: 1, borderColor: colors.primary + '15'
  },
  infoText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, flex: 1, lineHeight: 18 },

  formCard: { 
    backgroundColor: colors.surface, 
    borderRadius: 28, padding: 24, 
    marginBottom: 20, elevation: 4, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12,
    borderWidth: 1, borderColor: colors.border
  },
  cardTitle: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 24 },

  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 9, fontWeight: '900', color: colors.primary, letterSpacing: 1, marginBottom: 8 },
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: colors.surfaceAlt, 
    height: 56, borderRadius: 16, 
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 16
  },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },

  actionBtnContainer: { marginTop: 12, shadowColor: colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  actionBtn: { height: 60, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  actionBtnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  footer: { marginTop: 32, alignItems: 'center', gap: 4 },
  footerText: { fontSize: 10, fontWeight: '800', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1 }
});

export default ChangePasswordScreen;
