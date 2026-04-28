import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, TextInput, ActivityIndicator, Switch, Dimensions, Modal, FlatList, Platform } from 'react-native';
import { colors } from '../../constants/colors';
import { createEmployee, getNextEmployeeCode, getManagementEmployees, getDepartments } from '../../api/employee.api';
import AppCard from '../../components/common/AppCard';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');

const ROLES = ['SuperUser', 'HR', 'Manager', 'Director', 'VP', 'GM', 'Employee', 'Intern', 'fresher'];
const DEPARTMENTS = ['IT', 'HR', 'Finance', 'Marketing', 'Accounting', 'Operations', 'General Manager', 'Sales', 'Production', 'Logistics'];
const GENDERS = ['Male', 'Female', 'Other'];
const MARITAL_STATUS = ['Single', 'Married', 'Divorced', 'Widowed'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const EXPERIENCE_TYPES = ['Fresher', 'Experienced'];

const AppPicker = ({ label, value, options, onSelect, placeholder = 'Select Option' }) => {
  const [visible, setVisible] = useState(false);
  
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity 
        style={styles.pickerTrigger} 
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.pickerTriggerValue, !value && { color: colors.textTertiary }]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={item => typeof item === 'string' ? item : item.employeeCode}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalOption} 
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>
                    {typeof item === 'string' ? item : `${item.name} (${item.employeeCode})${item.department ? ` - ${item.department}` : ''}`}
                  </Text>
                  {(typeof item === 'string' ? item : item.name) === value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const AppDatePicker = ({ label, value, onChange }) => {
  const [show, setShow] = useState(false);
  
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity 
        style={styles.pickerTrigger} 
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.pickerTriggerValue, !value && { color: colors.textTertiary }]}>
          {value ? formatDate(value) : 'YYYY-MM-DD'}
        </Text>
        <Ionicons name="calendar-outline" size={16} color={colors.textTertiary} />
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShow(false);
            if (selectedDate) onChange(selectedDate.toISOString().split('T')[0]);
          }}
        />
      )}
    </View>
  );
};

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

const CreateEmployeeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [nextCode, setNextCode] = useState('Loading...');
  const [openSection, setOpenSection] = useState('basic');
  const [managementEmployees, setManagementEmployees] = useState([]);
  const [departmentList, setDepartmentList] = useState(DEPARTMENTS);

  const [form, setForm] = useState({
    // 1. Basic
    name: '', email: '', mobileNumber: '', alternateMobileNumber: '', password: '', role: 'Employee',
    // 2. Personal
    gender: '', bloodGroup: '', dateOfBirth: '', maritalStatus: '',
    fatherName: '', motherName: '', currentAddress: '', permanentAddress: '', sameAsCurrent: false,
    district: '', state: '', pincode: '',
    // 3. Experience
    experienceType: 'Fresher', totalExperienceYears: '', lastCompanyName: '',
    // 4. Health
    hasDisease: 'No', diseaseName: '', diseaseType: '', diseaseSince: '', medicinesRequired: '', doctorName: '', doctorContact: '',
    // 5. Job
    joiningDate: new Date().toISOString().split('T')[0], department: '', position: '', reportingManager: '', salary: '',
    // 6. Education
    hscPercent: '', graduationCourse: '', graduationPercent: '', postGraduationCourse: '', postGraduationPercent: '',
    // 7. Identity
    aadhaarNumber: '', panNumber: '',
    // 8. Bank
    accountHolderName: '', bankName: '', accountNumber: '', ifsc: '', branch: '',
    // 9. Emergency
    emergencyContactName: '', emergencyContactRelationship: '', emergencyContactMobile: '', emergencyContactAddress: '',
  });

  const [files, setFiles] = useState({
    profileImage: null,
    aadhaarFile: null,
    panFile: null,
    passbookFile: null,
    tenthMarksheet: null,
    twelfthMarksheet: null,
    graduationMarksheet: null,
    postGraduationMarksheet: null,
    medicalDocument: null,
    experienceCertificate: null,
  });

  useEffect(() => {
    Promise.all([
      getNextEmployeeCode(),
      getManagementEmployees(),
      getDepartments()
    ]).then((results) => {
      const codeRes = results[0].data; // ApiResponse { status, data: { nextCode }, ... }
      const mgmtRes = results[1].data; // ApiResponse { status, data: [...], ... }
      const deptRes = results[2].data; // ApiResponse { status, data: [...], ... }

      if (codeRes && codeRes.data) {
        setNextCode(codeRes.data.nextCode);
      }
      if (mgmtRes && mgmtRes.data) {
        setManagementEmployees(mgmtRes.data);
      }
      if (deptRes && deptRes.data && deptRes.data.length > 0) {
        setDepartmentList(deptRes.data);
      }
    }).catch(err => {
      console.error('Initial fetch failed:', err);
      setNextCode('IAXXXXX');
    });
  }, []);

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

  const pickImage = async (field) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: field === 'profileImage' ? [1, 1] : [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setFiles(prev => ({ ...prev, [field]: result.assets[0] }));
    }
  };

  const pickDocument = async (field) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setFiles(prev => ({ ...prev, [field]: result.assets[0] }));
      }
    } catch (err) {
      console.error('Doc pick error:', err);
    }
  };

  const handleCreate = async () => {
    // 1. Validation
    if (!form.name || !form.email || !form.mobileNumber || !form.role || !form.department) {
      Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill name, email, mobile, role and department.' });
      return;
    }

    if (!form.email.includes('@')) {
      Toast.show({ type: 'error', text1: 'Invalid Email', text2: 'Please enter a valid email address.' });
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      
      // Append all form fields
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value);
        }
      });

      // Append files
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          const fileUri = file.uri;
          const fileName = fileUri.split('/').pop() || `${key}.jpg`;
          const fileType = file.mimeType || 'image/jpeg';
          
          formData.append(key, {
            uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
            name: fileName,
            type: fileType,
          });
        }
      });

      await createEmployee(formData);
      Toast.show({ type: 'success', text1: 'Employee Created', text2: `${form.name} registered as ${nextCode}` });
      navigation.goBack();
    } catch (err) {
      console.error('Create error:', err);
      Toast.show({ type: 'error', text1: 'Failed to Create', text2: err?.response?.data?.message || 'Check connection or fields' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Next Code Banner */}
        <View style={styles.codeBanner}>
           <Text style={styles.codeLabel}>Assigning Employee Code</Text>
           <Text style={styles.codeValue}>{nextCode}</Text>
        </View>

        {/* Profile Image Picker */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={() => pickImage('profileImage')} style={styles.avatarContainer}>
            {files.profileImage ? (
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarImageContainer}>
                  <Ionicons name="person" size={50} color={colors.textTertiary} />
                  <Text style={{ position: 'absolute', fontSize: 10 }}>{files.profileImage.fileName}</Text>
                  {/* Since I can't easily show the image in this environment without a component that handles URIs well, I'll just show an icon and name */}
                  <Ionicons name="camera" size={24} color={colors.primary} style={styles.cameraIcon} />
                </View>
              </View>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="camera-outline" size={32} color={colors.primary} />
                <Text style={styles.avatarText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 1. Basic Details */}
        <FormSection 
          title="Basic Credentials" 
          icon="key-outline" 
          isOpen={openSection === 'basic'} 
          onToggle={() => setOpenSection(openSection === 'basic' ? '' : 'basic')}
        >
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>FULL NAME *</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={t => handleChange('name', t)} placeholder="John Doe" />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>EMAIL ADDRESS *</Text>
            <TextInput style={styles.input} value={form.email} onChangeText={t => handleChange('email', t)} placeholder="john@company.com" keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>MOBILE NUMBER *</Text>
            <TextInput style={styles.input} value={form.mobileNumber} onChangeText={t => handleChange('mobileNumber', t)} placeholder="9876543210" keyboardType="phone-pad" />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>ALTERNATE MOBILE</Text>
            <TextInput style={styles.input} value={form.alternateMobileNumber} onChangeText={t => handleChange('alternateMobileNumber', t)} placeholder="Optional" keyboardType="phone-pad" />
          </View>
          <View style={styles.fieldRow}>
             <Text style={styles.fieldLabel}>PASSWORD</Text>
             <TextInput style={styles.input} value={form.password} onChangeText={t => handleChange('password', t)} placeholder="Min 6 chars" secureTextEntry />
          </View>
          <AppPicker 
            label="ROLE *" 
            value={form.role} 
            options={ROLES} 
            onSelect={v => handleChange('role', v)} 
          />
        </FormSection>

        {/* 2. Personal Details */}
        <FormSection 
          title="Personal Details" 
          icon="person-outline" 
          isOpen={openSection === 'personal'} 
          onToggle={() => setOpenSection(openSection === 'personal' ? '' : 'personal')}
        >
          <AppPicker label="GENDER" value={form.gender} options={GENDERS} onSelect={v => handleChange('gender', v)} />
          <AppPicker label="BLOOD GROUP" value={form.bloodGroup} options={BLOOD_GROUPS} onSelect={v => handleChange('bloodGroup', v)} />
          <AppDatePicker label="DATE OF BIRTH" value={form.dateOfBirth} onChange={v => handleChange('dateOfBirth', v)} />
          <AppPicker label="MARITAL STATUS" value={form.maritalStatus} options={MARITAL_STATUS} onSelect={v => handleChange('maritalStatus', v)} />
          
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>FATHER'S NAME</Text>
            <TextInput style={styles.input} value={form.fatherName} onChangeText={t => handleChange('fatherName', t)} />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>MOTHER'S NAME</Text>
            <TextInput style={styles.input} value={form.motherName} onChangeText={t => handleChange('motherName', t)} />
          </View>
          
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>CURRENT ADDRESS</Text>
            <TextInput style={[styles.input, styles.textArea]} value={form.currentAddress} onChangeText={t => handleChange('currentAddress', t)} multiline placeholder="Full street address..." />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Permanent same as current</Text>
            <Switch value={form.sameAsCurrent} onValueChange={v => handleChange('sameAsCurrent', v)} trackColor={{ true: colors.primary }} />
          </View>
          {!form.sameAsCurrent && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>PERMANENT ADDRESS</Text>
              <TextInput style={[styles.input, styles.textArea]} value={form.permanentAddress} onChangeText={t => handleChange('permanentAddress', t)} multiline placeholder="Home town address..." />
            </View>
          )}
          <View style={styles.row}>
            <View style={[styles.fieldRow, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.fieldLabel}>DISTRICT</Text>
              <TextInput style={styles.input} value={form.district} onChangeText={t => handleChange('district', t)} />
            </View>
            <View style={[styles.fieldRow, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>STATE</Text>
              <TextInput style={styles.input} value={form.state} onChangeText={t => handleChange('state', t)} />
            </View>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>PINCODE</Text>
            <TextInput style={styles.input} value={form.pincode} onChangeText={t => handleChange('pincode', t)} keyboardType="numeric" />
          </View>
        </FormSection>

        {/* 3. Job Details */}
        <FormSection 
          title="Job & Professional" 
          icon="briefcase-outline" 
          isOpen={openSection === 'job'} 
          onToggle={() => setOpenSection(openSection === 'job' ? '' : 'job')}
        >
          <AppDatePicker label="JOINING DATE" value={form.joiningDate} onChange={v => handleChange('joiningDate', v)} />
          <AppPicker label="DEPARTMENT *" value={form.department} options={departmentList} onSelect={v => handleChange('department', v)} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>POSITION</Text>
            <TextInput style={styles.input} value={form.position} onChangeText={t => handleChange('position', t)} />
          </View>
          <AppPicker 
            label="REPORTING MANAGER" 
            value={form.reportingManager} 
            options={managementEmployees} 
            onSelect={m => handleChange('reportingManager', m.name)} 
          />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>MONTHLY SALARY</Text>
            <TextInput style={styles.input} value={form.salary} onChangeText={t => handleChange('salary', t)} placeholder="₹ Amount" keyboardType="numeric" />
          </View>
        </FormSection>

        {/* 4. Experience & Education */}
        <FormSection 
          title="Experience & Education" 
          icon="school-outline" 
          isOpen={openSection === 'education'} 
          onToggle={() => setOpenSection(openSection === 'education' ? '' : 'education')}
        >
          <Text style={styles.sectionSubtitle}>Professional Experience</Text>
          <AppPicker label="EXPERIENCE TYPE" value={form.experienceType} options={EXPERIENCE_TYPES} onSelect={v => handleChange('experienceType', v)} />
          {form.experienceType === 'Experienced' && (
            <>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>TOTAL YEARS</Text>
                <TextInput style={styles.input} value={form.totalExperienceYears} onChangeText={t => handleChange('totalExperienceYears', t)} keyboardType="numeric" />
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>LAST COMPANY</Text>
                <TextInput style={styles.input} value={form.lastCompanyName} onChangeText={t => handleChange('lastCompanyName', t)} />
              </View>
              <TouchableOpacity style={styles.docPicker} onPress={() => pickDocument('experienceCertificate')}>
                <Ionicons name="document-attach-outline" size={20} color={colors.primary} />
                <Text style={styles.docPickerText}>{files.experienceCertificate ? files.experienceCertificate.name : 'Upload Experience Certificate'}</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.divider} />
          <Text style={styles.sectionSubtitle}>Academic Details</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>HSC PERCENTAGE (%)</Text>
            <TextInput style={styles.input} value={form.hscPercent} onChangeText={t => handleChange('hscPercent', t)} keyboardType="numeric" />
          </View>
          <View style={styles.row}>
            <View style={[styles.fieldRow, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.fieldLabel}>GRADUATION COURSE</Text>
              <TextInput style={styles.input} value={form.graduationCourse} onChangeText={t => handleChange('graduationCourse', t)} />
            </View>
            <View style={[styles.fieldRow, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>GRADUATION %</Text>
              <TextInput style={styles.input} value={form.graduationPercent} onChangeText={t => handleChange('graduationPercent', t)} keyboardType="numeric" />
            </View>
          </View>
        </FormSection>

        {/* 5. Documents & Identity */}
        <FormSection 
          title="Documents & Identity" 
          icon="card-outline" 
          isOpen={openSection === 'id'} 
          onToggle={() => setOpenSection(openSection === 'id' ? '' : 'id')}
        >
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>AADHAAR NUMBER</Text>
            <TextInput style={styles.input} value={form.aadhaarNumber} onChangeText={t => handleChange('aadhaarNumber', t)} maxLength={12} keyboardType="numeric" />
          </View>
          <TouchableOpacity style={styles.docPicker} onPress={() => pickDocument('aadhaarFile')}>
            <Ionicons name="document-attach-outline" size={20} color={colors.primary} />
            <Text style={styles.docPickerText}>{files.aadhaarFile ? files.aadhaarFile.name : 'Upload Aadhaar File'}</Text>
          </TouchableOpacity>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>PAN NUMBER</Text>
            <TextInput style={[styles.input, { textTransform: 'uppercase' }]} value={form.panNumber} onChangeText={t => handleChange('panNumber', t)} maxLength={10} />
          </View>
          <TouchableOpacity style={styles.docPicker} onPress={() => pickDocument('panFile')}>
            <Ionicons name="document-attach-outline" size={20} color={colors.primary} />
            <Text style={styles.docPickerText}>{files.panFile ? files.panFile.name : 'Upload PAN File'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.docPicker} onPress={() => pickDocument('tenthMarksheet')}>
            <Ionicons name="document-attach-outline" size={20} color={colors.primary} />
            <Text style={styles.docPickerText}>{files.tenthMarksheet ? files.tenthMarksheet.name : 'Upload 10th Marksheet'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.docPicker} onPress={() => pickDocument('twelfthMarksheet')}>
            <Ionicons name="document-attach-outline" size={20} color={colors.primary} />
            <Text style={styles.docPickerText}>{files.twelfthMarksheet ? files.twelfthMarksheet.name : 'Upload 12th Marksheet'}</Text>
          </TouchableOpacity>
        </FormSection>

        {/* 6. Bank Details */}
        <FormSection 
          title="Banking Details" 
          icon="cash-outline" 
          isOpen={openSection === 'bank'} 
          onToggle={() => setOpenSection(openSection === 'bank' ? '' : 'bank')}
        >
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>ACCOUNT HOLDER NAME</Text>
            <TextInput style={styles.input} value={form.accountHolderName} onChangeText={t => handleChange('accountHolderName', t)} />
          </View>
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
          <TouchableOpacity style={styles.docPicker} onPress={() => pickDocument('passbookFile')}>
            <Ionicons name="document-attach-outline" size={20} color={colors.primary} />
            <Text style={styles.docPickerText}>{files.passbookFile ? files.passbookFile.name : 'Upload Passbook/Cheque File'}</Text>
          </TouchableOpacity>
        </FormSection>

        {/* 7. Health Details */}
        <FormSection 
          title="Health Details" 
          icon="medical-outline" 
          isOpen={openSection === 'health'} 
          onToggle={() => setOpenSection(openSection === 'health' ? '' : 'health')}
        >
          <Text style={styles.switchLabel}>ANY CHRONIC DISEASE?</Text>
          <View style={styles.pickerRow}>
            {['No', 'Yes'].map(opt => (
              <TouchableOpacity 
                key={opt} 
                onPress={() => handleChange('hasDisease', opt)} 
                style={[styles.pickerBtn, form.hasDisease === opt && styles.pickerBtnActive]}
              >
                <Text style={[styles.pickerText, form.hasDisease === opt && styles.pickerTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {form.hasDisease === 'Yes' && (
            <>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>DISEASE NAME</Text>
                <TextInput style={styles.input} value={form.diseaseName} onChangeText={t => handleChange('diseaseName', t)} />
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>DISEASE SINCE</Text>
                <TextInput style={styles.input} value={form.diseaseSince} onChangeText={t => handleChange('diseaseSince', t)} placeholder="e.g. 2 years" />
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>DOCTOR NAME</Text>
                <TextInput style={styles.input} value={form.doctorName} onChangeText={t => handleChange('doctorName', t)} />
              </View>
              <TouchableOpacity style={styles.docPicker} onPress={() => pickDocument('medicalDocument')}>
                <Ionicons name="document-attach-outline" size={20} color={colors.primary} />
                <Text style={styles.docPickerText}>{files.medicalDocument ? files.medicalDocument.name : 'Upload Medical Docs'}</Text>
              </TouchableOpacity>
            </>
          )}
        </FormSection>

        {/* Submit Button */}
        <TouchableOpacity 
          style={styles.submitBtnContainer} 
          disabled={loading}
          onPress={handleCreate}
        >
          <LinearGradient
            colors={colors.gradients.primary}
            style={styles.submitBtn}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
             {loading ? <ActivityIndicator color="#fff" /> : (
               <>
                 <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                 <Text style={styles.submitText}>Save Employee</Text>
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
  scrollContent: { padding: 20 },
  
  codeBanner: { 
    backgroundColor: colors.primary + '10', 
    padding: 20, 
    borderRadius: 24, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '20',
    marginBottom: 20
  },
  codeLabel: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1, textTransform: 'uppercase' },
  codeValue: { fontSize: 28, fontWeight: '900', color: colors.text, marginTop: 4 },

  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surfaceAlt, borderWidth: 2, borderColor: colors.primary + '30', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarWrapper: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  avatarImageContainer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceAlt },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.surface, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.border },
  avatarPlaceholder: { alignItems: 'center' },
  avatarText: { fontSize: 10, fontWeight: '800', color: colors.primary, marginTop: 4 },

  sectionContainer: { backgroundColor: colors.surface, borderRadius: 24, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, backgroundColor: colors.surfaceAlt + '50' },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionIconBg: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  sectionBody: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
  sectionSubtitle: { fontSize: 12, fontWeight: '900', color: colors.text, marginBottom: 16, marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.7 },

  fieldRow: { marginBottom: 16 },
  fieldLabel: { fontSize: 10, fontWeight: '900', color: colors.textTertiary, letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: colors.surfaceAlt, height: 48, borderRadius: 12, paddingHorizontal: 14, fontSize: 15, fontWeight: '600', color: colors.text, borderWidth: 1, borderColor: colors.border },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  row: { flexDirection: 'row' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 20 },

  pickerTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceAlt, height: 48, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border },
  pickerTriggerValue: { fontSize: 15, fontWeight: '600', color: colors.text },
  
  pickerRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pickerBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  pickerBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pickerText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  pickerTextActive: { color: '#fff' },

  docPicker: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primary + '08', padding: 14, borderRadius: 12, borderWeight: 1, borderColor: colors.primary + '20', marginBottom: 16 },
  docPickerText: { fontSize: 13, fontWeight: '700', color: colors.primary, flex: 1 },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: 4 },
  switchLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 40, maxHeight: height * 0.7 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: '900', color: colors.text },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border + '50' },
  modalOptionText: { fontSize: 16, fontWeight: '600', color: colors.text },

  submitBtnContainer: { marginTop: 12, shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
  submitBtn: { height: 62, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitText: { fontSize: 17, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
});

export default CreateEmployeeScreen;
