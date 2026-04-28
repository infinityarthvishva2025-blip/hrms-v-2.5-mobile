import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, roleColors } from '../../constants/colors';
import { useFetch } from '../../hooks/useFetch';
import { getEmployeeById } from '../../api/employee.api';
import Avatar from '../../components/common/Avatar';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/dateUtils';
import { useAuth } from '../../hooks/useAuth';
import { isManagement } from '../../utils/roleUtils';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const DataItem = ({ label, value, icon, fullWidth }) => (
  <View style={[styles.dataItem, fullWidth && { width: '100%' }]}>
    <View style={styles.dataIconBg}>
       <Ionicons name={icon} size={14} color={colors.primary} />
    </View>
    <View style={styles.dataContent}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue} numberOfLines={2}>{value || '—'}</Text>
    </View>
  </View>
);

const SectionHeader = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
     <View style={styles.sectionIconBg}>
        <Ionicons name={icon} size={18} color={colors.primary} />
     </View>
     <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const EmployeeDetailScreen = ({ route, navigation }) => {
  const { employeeId } = route.params;
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();
  const { data: emp, loading, execute: fetchEmp } = useFetch(() => getEmployeeById(employeeId), null);

  const isAdmin = useMemo(() => isManagement(currentUser?.role), [currentUser]);

  if (loading && !emp) return <LoadingSpinner fullScreen />;
  if (!emp) return (
    <View style={styles.container}>
      <Text style={styles.errorText}>Employee not found.</Text>
    </View>
  );

  const roleColor = roleColors[emp.role] || roleColors.Employee;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Title & Back */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
         <LinearGradient colors={colors.gradients.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
         <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
               <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>View Profile</Text>
            {isAdmin ? (
               <TouchableOpacity onPress={() => navigation.navigate('EditEmployee', { employeeId: emp._id })} style={styles.headerBtn}>
                  <Ionicons name="create-outline" size={22} color="#fff" />
               </TouchableOpacity>
            ) : <View style={{ width: 44 }} />}
         </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchEmp} colors={[colors.primary]} />}
      >
        {/* Profile Hero */}
        <View style={styles.heroCard}>
           <LinearGradient colors={['#fff', colors.surfaceAlt]} style={StyleSheet.absoluteFill} />
           <View style={styles.heroTop}>
              <Avatar url={emp.profileImageUrl} name={emp.name} size={90} style={styles.avatar} />
              <View style={styles.heroMainInfo}>
                 <Text style={styles.heroName}>{emp.name}</Text>
                 <View style={styles.heroMetaRow}>
                    <Text style={styles.heroCode}>{emp.employeeCode}</Text>
                    <View style={styles.metaDivider} />
                    <Text style={styles.heroDept}>{emp.department || 'N/A'}</Text>
                 </View>
                 <View style={[styles.roleBadge, { backgroundColor: roleColor.bg }]}>
                    <Text style={[styles.roleText, { color: roleColor.text }]}>{emp.role}</Text>
                 </View>
              </View>
           </View>
           <View style={styles.heroBottom}>
              <StatusBadge status={emp.status} />
              <TouchableOpacity style={styles.heroActionBtn}>
                 <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
                 <Text style={styles.heroActionText}>Message</Text>
              </TouchableOpacity>
           </View>
        </View>

        {/* 1. Job Details Section */}
        <View style={styles.sectionCard}>
           <SectionHeader title="Professional Information" icon="briefcase-outline" />
           <View style={styles.dataGrid}>
              <DataItem label="POSITION" value={emp.position} icon="ribbon-outline" />
              <DataItem label="DATE OF JOINING" value={formatDate(emp.dateOfJoining)} icon="calendar-outline" />
              <DataItem label="REPORTING TO" value={emp.reportingManager} icon="person-outline" />
              <DataItem label="EXPECTED SALARY" value={emp.salary ? `₹${emp.salary}` : null} icon="cash-outline" />
           </View>
        </View>

        {/* 2. Contact Section */}
        <View style={styles.sectionCard}>
           <SectionHeader title="Contact Information" icon="call-outline" />
           <View style={styles.dataGrid}>
              <DataItem label="EMAIL ADDRESS" value={emp.email} icon="mail-outline" fullWidth />
              <DataItem label="MOBILE NUMBER" value={emp.mobileNumber} icon="call-outline" />
              <DataItem label="ALTERNATE NO" value={emp.alternateMobileNumber} icon="phone-portrait-outline" />
           </View>
        </View>

        {/* 3. Personal Section */}
        <View style={styles.sectionCard}>
           <SectionHeader title="Personal Details" icon="person-outline" />
           <View style={styles.dataGrid}>
              <DataItem label="GENDER" value={emp.gender} icon="transgender-outline" />
              <DataItem label="DATE OF BIRTH" value={formatDate(emp.dateOfBirth)} icon="calendar-outline" />
              <DataItem label="MARITAL STATUS" value={emp.maritalStatus} icon="heart-outline" />
              <DataItem label="FATHER NAME" value={emp.fatherName} icon="body-outline" />
           </View>
           <View style={styles.divider} />
           <DataItem label="CURRENT ADDRESS" value={emp.currentAddress} icon="home-outline" fullWidth />
           <View style={styles.divider} />
           <DataItem label="PERMANENT ADDRESS" value={emp.permanentAddress} icon="location-outline" fullWidth />
        </View>

        {/* 4. Education Section */}
        <View style={styles.sectionCard}>
           <SectionHeader title="Education Background" icon="school-outline" />
           <View style={styles.dataGrid}>
              <DataItem label="12TH PERCENT" value={emp.hscPercent ? `${emp.hscPercent}%` : null} icon="document-text-outline" />
              <DataItem label="GRADUATION" value={`${emp.graduationCourse} (${emp.graduationPercent}%)`} icon="school-outline" />
              {emp.postGraduationCourse && (
                <DataItem label="POST GRADUATION" value={`${emp.postGraduationCourse} (${emp.postGraduationPercent}%)`} icon="ribbon-outline" />
              )}
           </View>
        </View>

        {/* 5. Bank Section */}
        <View style={styles.sectionCard}>
           <SectionHeader title="Banking Information" icon="card-outline" />
           <View style={styles.dataGrid}>
              <DataItem label="ACCOUNT HOLDER" value={emp.accountHolderName} icon="person-circle-outline" />
              <DataItem label="BANK NAME" value={emp.bankName} icon="business-outline" />
              <DataItem label="ACCOUNT NO" value={emp.accountNumber} icon="numeric" />
              <DataItem label="IFSC CODE" value={emp.ifsc} icon="code-working-outline" />
           </View>
        </View>

        {/* 6. Identity Section */}
        <View style={styles.sectionCard}>
           <SectionHeader title="Identity Proofs" icon="id-card-outline" />
           <View style={styles.dataGrid}>
              <DataItem label="AADHAAR NUMBER" value={emp.aadhaarNumber} icon="finger-print-outline" />
              <DataItem label="PAN CARD" value={emp.panNumber} icon="document-outline" />
           </View>
        </View>

        {/* 7. Emergency Section */}
        <View style={[styles.sectionCard, { marginBottom: 100 }]}>
           <SectionHeader title="Emergency Contact" icon="warning-outline" />
           <View style={styles.dataGrid}>
              <DataItem label="CONTACT PERSON" value={emp.emergencyContactName} icon="person-outline" />
              <DataItem label="RELATIONSHIP" value={emp.emergencyContactRelationship} icon="people-outline" />
              <DataItem label="MOBILE NO" value={emp.emergencyContactMobile} icon="call-outline" fullWidth />
           </View>
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
  
  heroCard: { backgroundColor: colors.surface, borderRadius: 32, padding: 24, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'center', zIndex: 1 },
  avatar: { borderWidth: 3, borderColor: colors.primary + '20' },
  heroMainInfo: { marginLeft: 20, flex: 1 },
  heroName: { fontSize: 24, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  heroCode: { fontSize: 13, fontWeight: '700', color: colors.primary },
  metaDivider: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.textTertiary },
  heroDept: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginTop: 10 },
  roleText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  heroBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border, zIndex: 1 },
  heroActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary + '10', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  heroActionText: { fontSize: 13, fontWeight: '800', color: colors.primary },

  sectionCard: { backgroundColor: colors.surface, borderRadius: 28, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  sectionIconBg: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: colors.text },
  
  dataGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  dataItem: { width: (width - 100) / 2, flexDirection: 'row', gap: 10 },
  dataIconBg: { marginTop: 2 },
  dataContent: { flex: 1 },
  dataLabel: { fontSize: 9, fontWeight: '900', color: colors.textTertiary, letterSpacing: 0.5, marginBottom: 4 },
  dataValue: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, lineHeight: 18 },
  divider: { height: 1.5, backgroundColor: colors.border, marginVertical: 16, opacity: 0.5 },
  errorText: { textAlign: 'center', marginTop: 100, fontSize: 16, color: colors.textTertiary, fontWeight: '700' },
});

export default EmployeeDetailScreen;
