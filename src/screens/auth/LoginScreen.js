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
  Modal,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { forgotPassword } from '../../api/auth.api';
import { colors } from '../../constants/colors';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
const LOGO_IMG = require('../../../assets/images/logo3.6.png');

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
  const [focusedInput, setFocusedInput] = useState(null);

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
      
      <LinearGradient
        colors={['#F8FAFC', '#EFF6FF', '#F8FAFC']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Branding (Premium) */}
          <View style={styles.header}>
             <View style={styles.logoContainer}>
                <Image 
                  source={LOGO_IMG} 
                  style={styles.logoImage} 
                  resizeMode="contain"
                />
             </View>
             <Text style={styles.brandName}>HRMS Portal</Text>
             <Text style={styles.brandTagline}>Intelligent Workforce Management</Text>
          </View>

          {/* Elevated Form Card (Light Mode) */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to continue to your workspace</Text>

            <View style={styles.inputGroup}>
               <Text style={styles.inputLabel}>EMPLOYEE CODE</Text>
               <View style={[
                  styles.inputContainer, 
                  focusedInput === 'code' && { borderColor: '#6366F1', backgroundColor: '#fff' }
                ]}>
                  <Ionicons 
                    name="person-outline" 
                    size={22} 
                    color={focusedInput === 'code' ? '#6366F1' : '#94A3B8'} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    placeholder="Employee Code"
                    placeholderTextColor="#94A3B8"
                    value={employeeCode}
                    onChangeText={setEmployeeCode}
                    onFocus={() => setFocusedInput('code')}
                    onBlur={() => setFocusedInput(null)}
                    style={styles.textInput}
                    autoCapitalize="characters"
                    selectionColor="#6366F1"
                  />
               </View>
            </View>

            <View style={styles.inputGroup}>
               <Text style={styles.inputLabel}>PASSWORD</Text>
               <View style={[
                  styles.inputContainer, 
                  focusedInput === 'password' && { borderColor: '#6366F1', backgroundColor: '#fff' }
                ]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={22} 
                    color={focusedInput === 'password' ? '#6366F1' : '#94A3B8'} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    secureTextEntry={!showPassword}
                    style={styles.textInput}
                    selectionColor="#6366F1"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                     <Ionicons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={22} 
                        color="#94A3B8" 
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
                     <Text style={styles.loginBtnText}>Sign In to Portal</Text>
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
                  <Ionicons name="help-circle-outline" size={32} color="#6366F1" />
               </View>
               <Text style={styles.modalTitle}>Reset Password</Text>
               <Text style={styles.modalSubtitle}>Enter your Employee Code and the new secure password you wish to set.</Text>
            </View>

            <View style={styles.modalBody}>
               <View style={[
                  styles.modalInputContainer,
                  focusedInput === 'forgotCode' && { borderColor: '#6366F1', backgroundColor: '#fff' }
               ]}>
                  <Ionicons 
                    name="person-outline" 
                    size={22} 
                    color={focusedInput === 'forgotCode' ? '#6366F1' : '#94A3B8'} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    placeholder="Employee Code"
                    placeholderTextColor="#94A3B8"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    onFocus={() => setFocusedInput('forgotCode')}
                    onBlur={() => setFocusedInput(null)}
                    style={styles.modalInput}
                    autoCapitalize="characters"
                  />
               </View>

               <View style={[
                  styles.modalInputContainer,
                  focusedInput === 'forgotPass' && { borderColor: '#6366F1', backgroundColor: '#fff' }
               ]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={22} 
                    color={focusedInput === 'forgotPass' ? '#6366F1' : '#94A3B8'} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    placeholder="New Secure Password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedInput('forgotPass')}
                    onBlur={() => setFocusedInput(null)}
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
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {forgotLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.modalBtnText}>Reset Password</Text>
                    )}
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, paddingBottom: 60, justifyContent: 'center' },
  
  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: { 
    width: 110, height: 110, borderRadius: 30, 
    backgroundColor: '#fff', 
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#6366F1', 
    shadowOffset: { width: 0, height: 12 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)'
  },
  logoImage: { width: 80, height: 80 },
  brandName: { fontSize: 32, fontWeight: '900', color: '#1E293B', letterSpacing: -1 },
  brandTagline: { fontSize: 14, fontWeight: '600', color: '#64748B', marginTop: 4 },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  formTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  formSubtitle: { fontSize: 14, fontWeight: '500', color: '#64748B', marginTop: 6, marginBottom: 32 },

  inputGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#6366F1', letterSpacing: 1.2, marginBottom: 10, textTransform: 'uppercase' },
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    height: 62, borderRadius: 20, 
    borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 20
  },
  inputIcon: { marginRight: 14 },
  textInput: { flex: 1, color: '#0F172A', fontSize: 16, fontWeight: '600' },
  
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 32, marginTop: -12, padding: 8 },
  forgotText: { fontSize: 14, fontWeight: '700', color: '#6366F1' },

  loginBtnContainer: { 
    shadowColor: '#6366F1', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.35, 
    shadowRadius: 15, 
    elevation: 10 
  },
  loginBtn: { 
    height: 64, 
    borderRadius: 22, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 12 
  },
  loginBtnText: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  footer: { alignItems: 'center', marginTop: 40 },
  footerText: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.5 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { 
    backgroundColor: '#fff', 
    borderRadius: 36, 
    padding: 32, 
    width: '100%', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 25 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 50, 
    elevation: 15 
  },
  modalHeader: { alignItems: 'center', marginBottom: 28 },
  modalIconBg: { 
    width: 64, height: 64, 
    borderRadius: 22, 
    backgroundColor: '#6366F115', 
    justifyContent: 'center', alignItems: 'center', 
    marginBottom: 20 
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  modalSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 10, lineHeight: 22 },
  modalBody: { gap: 20 },
  modalInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    height: 62, 
    borderRadius: 20, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0', 
    paddingHorizontal: 20 
  },
  modalInput: { flex: 1, color: '#0F172A', fontSize: 16, fontWeight: '600' },
  modalActionBtn: { borderRadius: 20, overflow: 'hidden' },
  modalBtnGradient: { height: 62, justifyContent: 'center', alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  modalCancelBtn: { padding: 10, alignItems: 'center' },
  modalCancelText: { color: '#64748B', fontWeight: '700', fontSize: 15 }
});

export default LoginScreen;
