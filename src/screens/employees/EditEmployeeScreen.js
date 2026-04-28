import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, TextInput, ActivityIndicator, Switch, StatusBar } from 'react-native';
import { colors } from '../../constants/colors';
import { getEmployeeById, updateEmployee } from '../../api/employee.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ROLES = ['SuperUser', 'HR', 'Manager', 'Director', 'VP', 'GM', 'Employee', 'Intern'];
const DEPARTMENTS = ['IT', 'HR', 'Finance', 'Marketing', 'Accounting', 'Operations', 'General Manager'];
const GENDERS = ['Male', 'Female', 'Other'];
const MARITAL_STATUS = ['Single', 'Married', 'Divorced', 'Widowed'];

const FormSection = ({ title, icon, children, isOpen, onToggle }) => (
  <View style={styles.sectionContainer}>
    <TouchableOpacity 
      style={styles.sectionHeader} 
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionIconBg}>
           <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.textTertiary} />
    </TouchableOpacity>
    {isOpen && <View style={styles.sectionBody}>{children}</View>}
  </View>
);

const EditEmployeeScreen = ({ route, navigation }) => {
  const { employeeId } = route.params;
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [openSection, setOpenSection] = useState('job');

  const [form, setForm] = useState({
    name: '', email: '', mobileNumber: '', alternateMobileNumber: '',
    gender: '', fatherName: '', motherName: '', dateOfBirth: '', maritalStatus: '',
    currentAddress: '', permanentAddress: '', sameAsCurrent: false,
    district: '', state: '', pincode: '',
    experienceType: 'Fresher', totalExperienceYears: '', lastCompanyName: '',
    hasDisease: 'No', diseaseName: '',
    joiningDate: '', department: '', position: '', reportingManager: '', role: 'Employee', salary: '', status: 'Active',
    hscPercent: '', graduationCourse: '', graduationPercent: '', postGraduationCourse: '', postGraduationPercent: '',
    aadhaarNumber: '', panNumber: '',
    accountHolderName: '', bankName: '', accountNumber: '', ifsc: '', branch: '',
    emergencyContactName: '', emergencyContactRelationship: '', emergencyContactMobile: '', emergencyContactAddress: '',
  });

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const { data } = await getEmployeeById(employeeId);
        if (data) {
          // Format internal dates for inputs
          const formatDateStr = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
          
          setForm({
            ...data,
            dateOfBirth: formatDateStr(data.dateOfBirth),
            joiningDate: formatDateStr(data.dateOfJoining || data.joiningDate),
          });
        }
      } catch (err) {
        Toast.show({ type: 'error', text1: 'Load Failed', text2: 'Could not fetch employee details' });
        navigation.goBack();
      } finally {
        setFetching(false);
      }
    };
    fetchEmployee();
  }, [employeeId, navigation]);

  const handleChange = (name, value) => {
    if (name === 'sameAsCurrent') {
      setForm(f => ({
        ...f, sameAsCurrent: value,
        permanentAddress: value ? f.currentAddress : f.permanentAddress
      }));
    } else {
      setForm(f => {
        const newForm = { ...f, [name]: value };
        if (name === 'currentAddress' && f.sameAsCurrent) {
          newForm.permanentAddress = value;
        }
        return newForm;
      });
    }
  };

  const handleUpdate = async () => {
    if (!form.name || !form.email) {
      Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Name and email are required.' });
      return;
    }

    try {
      setLoading(true);
      await updateEmployee(employeeId, form);
      Toast.show({ type: 'success', text1: 'Profile Updated', text2: `${form.name}'s details saved successfully.` });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Update Failed', text2: err?.response?.data?.message || 'Error occurred' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Inline Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
         <LinearGradient colors={colors.gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
         <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
               <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Update Employee</Text>
            <TouchableOpacity onPress={handleUpdate} disabled={loading} style={styles.headerSaveBtn}>
               {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.headerSaveText}>SAVE</Text>}
            </TouchableOpacity>
         </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Identity Card */}
        <View style={styles.identityBar}>
           <Text style={styles.identityLabel}>Editing Member ID</Text>
           <Text style={styles.identityValue}>{form.employeeCode}</Text>
        </View>

        {/* 1. Basic Details */}
        <FormSection title="Core Information" icon="key-outline" isOpen={openSection === 'basic'} onToggle={() => setOpenSection(openSection === 'basic' ? '' : 'basic')}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>FULL NAME *</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={t => handleChange('name', t)} />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>EMAIL ADDRESS *</Text>
            <TextInput style={styles.input} value={form.email} onChangeText={t => handleChange('email', t)} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>MOBILE NUMBER *</Text>
            <TextInput style={styles.input} value={form.mobileNumber} onChangeText={t => handleChange('mobileNumber', t)} keyboardType="phone-pad" />
          </View>
        </FormSection>

        {/* 5. Job Details */}
        <FormSection title="Job & Professional" icon="briefcase-outline" isOpen={openSection === 'job'} onToggle={() => setOpenSection(openSection === 'job' ? '' : 'job')}>
           <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>DEPARTMENT</Text>
              <View style={[styles.pickerRow, { flexWrap: 'wrap' }]}>
                {DEPARTMENTS.map(d => (
                  <TouchableOpacity key={d} onPress={() => handleChange('department', d)} style={[styles.pickerBtn, { marginBottom: 6 }, form.department === d && styles.pickerBtnActive]}>
                    <Text style={[styles.pickerText, form.department === d && styles.pickerTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
           </View>
           <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>ROLE</Text>
              <View style={[styles.pickerRow, { flexWrap: 'wrap' }]}>
                {ROLES.map(r => (
                  <TouchableOpacity key={r} onPress={() => handleChange('role', r)} style={[styles.pickerBtn, { marginBottom: 6 }, form.role === r && styles.pickerBtnActive]}>
                    <Text style={[styles.pickerText, form.role === r && styles.pickerTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
           </View>
           <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>POSITION</Text>
              <TextInput style={styles.input} value={form.position} onChangeText={t => handleChange('position', t)} placeholder="e.g. Senior Developer" />
           </View>
           <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>SALARY (MONTHLY)</Text>
              <TextInput style={styles.input} value={String(form.salary || '')} onChangeText={t => handleChange('salary', t)} keyboardType="numeric" />
           </View>
           <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>EMPLOYEE STATUS</Text>
              <View style={styles.pickerRow}>
                {['Active', 'Inactive'].map(s => (
                  <TouchableOpacity key={s} onPress={() => handleChange('status', s)} style={[styles.pickerBtn, form.status === s && styles.pickerBtnActive]}>
                    <Text style={[styles.pickerText, form.status === s && styles.pickerTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
           </View>
        </FormSection>

        {/* 2. Personal Details */}
        <FormSection title="Personal Information" icon="person-outline" isOpen={openSection === 'personal'} onToggle={() => setOpenSection(openSection === 'personal' ? '' : 'personal')}>
           <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>GENDER</Text>
              <View style={styles.pickerRow}>
                {GENDERS.map(g => (
                  <TouchableOpacity key={g} onPress={() => handleChange('gender', g)} style={[styles.pickerBtn, form.gender === g && styles.pickerBtnActive]}>
                    <Text style={[styles.pickerText, form.gender === g && styles.pickerTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
           </View>
           <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>DATE OF BIRTH (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={form.dateOfBirth} onChangeText={t => handleChange('dateOfBirth', t)} />
           </View>
           <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>CURRENT ADDRESS</Text>
              <TextInput style={[styles.input, styles.textArea]} value={form.currentAddress} onChangeText={t => handleChange('currentAddress', t)} multiline />
           </View>
           <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Permanent same as current</Text>
              <Switch value={form.sameAsCurrent} onValueChange={v => handleChange('sameAsCurrent', v)} trackColor={{ true: colors.primary }} />
           </View>
           {!form.sameAsCurrent && (
             <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>PERMANENT ADDRESS</Text>
                <TextInput style={[styles.input, styles.textArea]} value={form.permanentAddress} onChangeText={t => handleChange('permanentAddress', t)} multiline />
             </View>
           )}
        </FormSection>

        {/* 8. Bank Details */}
        <FormSection title="Banking Information" icon="card-outline" isOpen={openSection === 'bank'} onToggle={() => setOpenSection(openSection === 'bank' ? '' : 'bank')}>
           <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>BANK NAME</Text>
              <TextInput style={styles.input} value={form.bankName} onChangeText={t => handleChange('bankName', t)} />
           </View>
           <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>ACCOUNT NUMBER</Text>
              <TextInput style={styles.input} value={form.accountNumber} onChangeText={t => handleChange('accountNumber', t)} keyboardType="numeric" />
           </View>
           <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>IFSC CODE</Text>
              <TextInput style={[styles.input, { textTransform: 'uppercase' }]} value={form.ifsc} onChangeText={t => handleChange('ifsc', t)} />
           </View>
        </FormSection>

        {/* Submit Bottom Section */}
        <TouchableOpacity 
          style={styles.submitBtnContainer} 
          disabled={loading}
          onPress={handleUpdate}
        >
          <LinearGradient
            colors={colors.gradients.primary}
            style={styles.submitBtn}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
             {loading ? <ActivityIndicator color="#fff" /> : (
               <>
                 <Ionicons name="save-outline" size={20} color="#fff" />
                 <Text style={styles.submitText}>Save Changes</Text>
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
  header: { 
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8, zIndex: 100,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 15 },
  headerBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  headerSaveBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
  headerSaveText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1 },

  scrollContent: { padding: 20 },
  
  identityBar: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 20, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5
  },
  identityLabel: { fontSize: 9, fontWeight: '900', color: colors.textTertiary, letterSpacing: 1, textTransform: 'uppercase' },
  identityValue: { fontSize: 24, fontWeight: '900', color: colors.primary, marginTop: 4 },

  sectionContainer: { backgroundColor: colors.surface, borderRadius: 24, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, backgroundColor: colors.surfaceAlt + '50' },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionIconBg: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  sectionBody: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border },

  fieldRow: { marginBottom: 16 },
  fieldLabel: { fontSize: 10, fontWeight: '900', color: colors.textTertiary, letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: colors.surfaceAlt, height: 48, borderRadius: 12, paddingHorizontal: 14, fontSize: 15, fontWeight: '600', color: colors.text, borderWidth: 1, borderColor: colors.border },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  
  pickerRow: { flexDirection: 'row', gap: 8 },
  pickerBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  pickerBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pickerText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  pickerTextActive: { color: '#fff' },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: 4 },
  switchLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },

  submitBtnContainer: { marginTop: 12, shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
  submitBtn: { height: 62, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitText: { fontSize: 17, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
});

export default EditEmployeeScreen;
