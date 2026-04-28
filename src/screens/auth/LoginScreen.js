import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Dimensions, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  StatusBar,
  Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { forgotPassword } from '../../api/auth.api';
import { colors } from '../../constants/colors';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async () => {
    if (!employeeCode || !password) {
      Toast.show({ type: 'error', text1: 'Missing Credentials', text2: 'Please enter both employee code and password' });
      return;
    }

    try {
      setLoading(true);
      await login({ employeeCode: employeeCode.trim().toUpperCase(), password });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error?.response?.data?.message || 'Invalid credentials'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail || !password) {
      Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please enter Employee Code and New Password' });
      return;
    }
    
    try {
      setForgotLoading(true);
      await forgotPassword({ 
        employeeCode: forgotEmail.trim().toUpperCase(), 
        newPassword: password 
      });
      
      setForgotLoading(false);
      setShowForgotModal(false);
      Toast.show({ 
        type: 'success', 
        text1: 'Password Reset', 
        text2: 'Your password has been updated. You can now sign in.' 
      });
      setForgotEmail('');
      setPassword('');
    } catch (error) {
      setForgotLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: error?.response?.data?.message || 'Could not reset password'
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Branding (Light Mode) */}
          <View style={styles.header}>
             <View style={styles.logoCircle}>
                <LinearGradient
                  colors={colors.gradients.primary}
                  style={styles.logoIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="business" size={44} color="#fff" />
                </LinearGradient>
             </View>
             <Text style={styles.brandName}>HRMS Portal</Text>
             <Text style={styles.brandTagline}>Enterprise Workforce Management</Text>
          </View>

          {/* Elevated Form Card (Light Mode) */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In</Text>
            <Text style={styles.formSubtitle}>Access your professional workspace</Text>

            <View style={styles.inputGroup}>
               <Text style={styles.inputLabel}>EMPLOYEE CODE</Text>
               <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter Code (e.g. IA001)"
                    placeholderTextColor={colors.textTertiary}
                    value={employeeCode}
                    onChangeText={setEmployeeCode}
                    style={styles.textInput}
                    autoCapitalize="characters"
                    selectionColor={colors.primary}
                  />
               </View>
            </View>

            <View style={styles.inputGroup}>
               <Text style={styles.inputLabel}>PASSWORD</Text>
               <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter Password"
                    placeholderTextColor={colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={styles.textInput}
                    selectionColor={colors.primary}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                     <Ionicons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color={colors.textTertiary} 
                     />
                  </TouchableOpacity>
               </View>
            </View>

            <TouchableOpacity 
              style={styles.forgotBtn}
              onPress={() => setShowForgotModal(true)}
            >
               <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleLogin}
              disabled={loading}
              style={styles.loginBtnContainer}
            >
               <LinearGradient
                 colors={colors.gradients.primary}
                 style={styles.loginBtn}
                 start={{ x: 0, y: 0 }}
                 end={{ x: 1, y: 0 }}
               >
                 {loading ? (
                   <ActivityIndicator color="#fff" />
                 ) : (
                   <>
                     <Text style={styles.loginBtnText}>Secure Sign In</Text>
                     <Ionicons name="arrow-forward" size={20} color="#fff" />
                   </>
                 )}
               </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
             <Text style={styles.footerText}>Powered by HRMS Enterprise Cloud</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
               <View style={styles.modalIconBg}>
                  <Ionicons name="help-circle-outline" size={28} color={colors.primary} />
               </View>
               <Text style={styles.modalTitle}>Reset Password</Text>
               <Text style={styles.modalSubtitle}>Enter your Employee Code or Email to receive a reset link.</Text>
            </View>

            <View style={styles.modalBody}>
               <View style={styles.modalInputContainer}>
                  <Ionicons name="person-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Employee Code (e.g. IA001)"
                    placeholderTextColor={colors.textTertiary}
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    style={styles.modalInput}
                    autoCapitalize="characters"
                  />
               </View>

               <View style={styles.modalInputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="New Secure Password"
                    placeholderTextColor={colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.modalInput}
                  />
               </View>

               <TouchableOpacity 
                  style={styles.modalActionBtn}
                  onPress={handleForgotPassword}
                  disabled={forgotLoading}
               >
                  <LinearGradient
                    colors={colors.gradients.primary}
                    style={styles.modalBtnGradient}
                  >
                    {forgotLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Request Reset Link</Text>}
                  </LinearGradient>
               </TouchableOpacity>

               <TouchableOpacity 
                  style={styles.modalCancelBtn}
                  onPress={() => setShowForgotModal(false)}
               >
                  <Text style={styles.modalCancelText}>Back to Login</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, paddingBottom: 60, justifyContent: 'center' },
  
  header: { alignItems: 'center', marginBottom: 50 },
  logoCircle: { 
    width: 90, height: 90, borderRadius: 45, 
    backgroundColor: '#fff', 
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.primary, 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 15,
    elevation: 8
  },
  logoIcon: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  brandName: { fontSize: 28, fontWeight: '900', color: '#1F2937', letterSpacing: -0.5 },
  brandTagline: { fontSize: 13, fontWeight: '600', color: colors.textTertiary, marginTop: 4 },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  formTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  formSubtitle: { fontSize: 13, fontWeight: '500', color: colors.textTertiary, marginTop: 4, marginBottom: 30 },

  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 10, fontWeight: '900', color: colors.primary, letterSpacing: 1, marginBottom: 8 },
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#F9FAFB', 
    height: 56, borderRadius: 16, 
    borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 16
  },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, color: '#111827', fontSize: 15, fontWeight: '600' },
  
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 30, marginTop: -8, padding: 4 },
  forgotText: { fontSize: 13, fontWeight: '700', color: colors.primary },

  loginBtnContainer: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  loginBtn: { height: 60, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loginBtnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  footer: { alignItems: 'center', marginTop: 40 },
  footerText: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 32, padding: 32, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 40, elevation: 10 },
  modalHeader: { alignItems: 'center', marginBottom: 24 },
  modalIconBg: { width: 60, height: 60, borderRadius: 20, backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  modalSubtitle: { fontSize: 13, color: colors.textTertiary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  modalBody: { gap: 16 },
  modalInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', height: 56, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16 },
  modalInput: { flex: 1, color: '#111827', fontSize: 15, fontWeight: '600' },
  modalActionBtn: { borderRadius: 16, overflow: 'hidden' },
  modalBtnGradient: { height: 56, justifyContent: 'center', alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  modalCancelBtn: { padding: 8, alignItems: 'center' },
  modalCancelText: { color: colors.textTertiary, fontWeight: '700', fontSize: 14 }
});

export default LoginScreen;
