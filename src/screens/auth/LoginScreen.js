import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  StatusBar,
  Modal,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { forgotPassword } from '../../api/auth.api';
import { colors } from '../../constants/colors';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';

const LOGO_IMG = require('../../../assets/images/logo3.6.png');

// ─── Defined OUTSIDE LoginScreen to prevent remount on each render ───────────
const InputField = ({
  label, icon, value, onChangeText, placeholder,
  isPassword, isShowPassword, toggleShowPassword,
  focusKey, focusedInput, setFocusedInput, autoCapitalize
}) => {
  const isFocused = focusedInput === focusKey;
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, isFocused && styles.inputLabelFocused]}>
        {label}
      </Text>
      <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
        <Ionicons
          name={icon}
          size={18}
          color={isFocused ? colors.primary : '#94A3B8'}
          style={styles.inputIcon}
        />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#B0BAC9"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocusedInput(focusKey)}
          onBlur={() => setFocusedInput(null)}
          secureTextEntry={isPassword && !isShowPassword}
          style={styles.textInput}
          autoCapitalize={autoCapitalize || 'none'}
          selectionColor={colors.primary}
          autoCorrect={false}
          spellCheck={false}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={toggleShowPassword}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isShowPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color="#94A3B8"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─── Login Screen ─────────────────────────────────────────────────────────────
const LoginScreen = () => {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmpCode, setForgotEmpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
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
        text2: error?.response?.data?.message || 'Invalid credentials',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmpCode || !newPassword) {
      Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please enter Employee Code and New Password' });
      return;
    }
    if (newPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'Too Short', text2: 'Password must be at least 6 characters' });
      return;
    }
    try {
      setForgotLoading(true);
      await forgotPassword({
        employeeCode: forgotEmpCode.trim().toUpperCase(),
        newPassword,
      });
      setForgotLoading(false);
      setShowForgotModal(false);
      setForgotEmpCode('');
      setNewPassword('');
      Toast.show({ type: 'success', text1: 'Password Reset', text2: 'You can now sign in with your new password.' });
    } catch (error) {
      setForgotLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: error?.response?.data?.message || 'Could not reset password',
      });
    }
  };

  // Shared props passed to every InputField
  const fieldProps = { focusedInput, setFocusedInput };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <LinearGradient colors={['#FFFFFF', '#F8FAFC', '#F0F4FF']} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Brand ── */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Image source={LOGO_IMG} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.brandTitle}>
              Infinity{' '}
              <Text style={{ color: colors.primary }}>HRMS</Text>
            </Text>
            <Text style={styles.brandSub}>Intelligent Workforce Management</Text>
          </View>

          {/* ── Card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back 👋</Text>
            <Text style={styles.cardSub}>Sign in to continue</Text>

            <InputField
              {...fieldProps}
              label="EMPLOYEE CODE"
              icon="person-outline"
              value={employeeCode}
              onChangeText={setEmployeeCode}
              placeholder="e.g. EMP101"
              focusKey="code"
              autoCapitalize="characters"
            />

            <InputField
              {...fieldProps}
              label="PASSWORD"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              isPassword
              isShowPassword={showPassword}
              toggleShowPassword={() => setShowPassword(p => !p)}
              focusKey="password"
            />

            <TouchableOpacity style={styles.forgotBtn} onPress={() => setShowForgotModal(true)}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={loading}
              style={[styles.loginBtnWrap, loading && { opacity: 0.7 }]}
            >
              <LinearGradient
                colors={colors.gradients.primary}
                style={styles.loginBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.loginBtnText}>Sign In</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>Secure Enterprise Login · v3.6</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Forgot Password Modal ── */}
      <Modal
        visible={showForgotModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFill}
            onPress={() => !forgotLoading && setShowForgotModal(false)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSub}>Enter your employee code and a new password</Text>

            <InputField
              {...fieldProps}
              label="EMPLOYEE CODE"
              icon="person-outline"
              value={forgotEmpCode}
              onChangeText={setForgotEmpCode}
              placeholder="e.g. EMP101"
              focusKey="forgotCode"
              autoCapitalize="characters"
            />

            <InputField
              {...fieldProps}
              label="NEW PASSWORD"
              icon="shield-checkmark-outline"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Min 6 characters"
              isPassword
              focusKey="forgotPass"
            />

            <TouchableOpacity
              style={[styles.loginBtnWrap, { marginTop: 8 }, forgotLoading && { opacity: 0.7 }]}
              onPress={handleForgotPassword}
              disabled={forgotLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={colors.gradients.primary}
                style={styles.loginBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {forgotLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.loginBtnText}>Reset Password</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowForgotModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 22, paddingBottom: 40 },

  // Header
  header: { alignItems: 'center', marginBottom: 28 },
  logoBox: {
    width: 76, height: 76, borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    borderWidth: 1, borderColor: '#EAEDF3',
  },
  logoImage: { width: 52, height: 52 },
  brandTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', letterSpacing: -0.3 },
  brandSub: { fontSize: 12, color: '#94A3B8', marginTop: 3, fontWeight: '500' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06, shadowRadius: 18, elevation: 4,
    borderWidth: 1, borderColor: '#F0F2F8',
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  cardSub: { fontSize: 13, color: '#64748B', marginTop: 2, marginBottom: 22 },

  // Input
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.6, marginBottom: 6 },
  inputLabelFocused: { color: colors.primary },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC',
    height: 50, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E8ECF4',
    paddingHorizontal: 13,
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    backgroundColor: '#fff',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 2,
  },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, color: '#1E293B', fontSize: 14, fontWeight: '600', paddingVertical: 0 },

  // Forgot / Login
  forgotBtn: { alignSelf: 'flex-end', marginTop: -2, marginBottom: 18, padding: 4 },
  forgotText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  loginBtnWrap: {
    borderRadius: 12, overflow: 'hidden',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22, shadowRadius: 8, elevation: 4,
  },
  loginBtn: { height: 50, justifyContent: 'center', alignItems: 'center' },
  loginBtnText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },

  footerText: { textAlign: 'center', marginTop: 28, fontSize: 11, color: '#CBD5E1', fontWeight: '500' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 22, padding: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  modalSub: { fontSize: 13, color: '#64748B', marginTop: 3, marginBottom: 18 },
  modalCancelBtn: { marginTop: 4, padding: 12, alignItems: 'center' },
  modalCancelText: { color: '#94A3B8', fontWeight: '700', fontSize: 13 },
});

export default LoginScreen;
