import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Share,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import config from '../../constants/config';
import PremiumHeader from '../../components/common/PremiumHeader';
import { useAuth } from '../../hooks/useAuth';
import AppCard from '../../components/common/AppCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-toast-message';
import { storage } from '../../utils/storage';

const SectionHeader = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    <Ionicons name={icon} size={18} color={colors.primary} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const DetailRow = ({ label, value, isNegative = false, isTotal = false }) => (
  <View style={[styles.detailRow, isTotal && styles.totalRow]}>
    <Text style={[styles.detailLabel, isTotal && styles.totalLabel]}>{label}</Text>
    <Text style={[
      styles.detailValue, 
      isNegative && { color: colors.error },
      isTotal && styles.totalValue
    ]}>
      {isNegative ? '-' : ''}₹{Number(value || 0).toLocaleString()}
    </Text>
  </View>
);

const SalarySlipScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { slip } = route.params;
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {

          Toast.show({ 
            type: 'success', 
            text1: 'Upcoming Feature',
            text2: 'next version '
          });



    // if (!slip?._id) {
    //   Toast.show({ type: 'error', text1: 'Not Available', text2: 'PDF slip data missing.' });
    //   return;
    // }

    // setDownloading(true);
    // try {
    //   const pdfUrl = `${config.API_URL}/payroll/salary-slip/${slip._id}`;
    //   const filename = `SalarySlip_${slip.employeeCode}_${slip.month}_${slip.year}.pdf`;
    //   const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      
    //   const token = await storage.getAccessToken();
    //   const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
    //   const downloadRes = await FileSystem.downloadAsync(pdfUrl, fileUri, { headers });
      
    //   if (downloadRes.status === 200) {
    //     await Sharing.shareAsync(downloadRes.uri, {
    //       mimeType: 'application/pdf',
    //       dialogTitle: 'Share Salary Slip',
    //       UTI: 'com.adobe.pdf'
    //     });
    //   }
    // } catch (error) {
    //   console.error(error);
    //   Toast.show({ type: 'error', text1: 'Failed', text2: 'Error downloading PDF' });
    // } finally {
    //   setDownloading(false);
    // }
  };

  if (!slip) return <View style={styles.center}><Text>No data found</Text></View>;

  return (
    <View style={styles.container}>
      <PremiumHeader 
        title="Salary Slip" 
        moduleBadge="PAYROLL" 
        showBack={true} 
        user={user} 
        navigation={navigation} 
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Summary */}
        <AppCard style={styles.headerCard}>
          <View style={styles.headerInfo}>
            <Text style={styles.empName}>{slip.employeeName}</Text>
            <Text style={styles.empCode}>{slip.employeeCode} | {slip.employee?.department || 'Staff'}</Text>
            <View style={styles.periodPill}>
               <Text style={styles.periodText}>
                 {new Date(slip.fromDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(slip.toDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
               </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.pdfBtn} 
            onPress={handleDownload}
            disabled={downloading}
          >
            {downloading ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="download-outline" size={24} color={colors.primary} />}
          </TouchableOpacity>
        </AppCard>

        {/* Attendance Summary */}
        <AppCard style={styles.sectionCard}>
           <SectionHeader title="Attendance Summary" icon="calendar" />
           <View style={styles.attendanceGrid}>
              <View style={styles.gridItem}>
                 <Text style={styles.gridLabel}>Paid Days</Text>
                 <Text style={styles.gridValue}>{slip.paidDays}</Text>
              </View>
              <View style={styles.gridItem}>
                 <Text style={[styles.gridLabel, { color: colors.error }]}>Absents</Text>
                 <Text style={[styles.gridValue, { color: colors.error }]}>{slip.absentDays}</Text>
              </View>
              <View style={styles.gridItem}>
                 <Text style={[styles.gridLabel, { color: colors.warning }]}>Half Days</Text>
                 <Text style={[styles.gridValue, { color: colors.warning }]}>{slip.halfDays}</Text>
              </View>
           </View>
        </AppCard>

        {/* Detailed Breakdown */}
        <View style={styles.splitGrid}>
           <AppCard style={[styles.sectionCard, { flex: 1, marginRight: 8 }]}>
              <SectionHeader title="Earnings" icon="trending-up" />
              <DetailRow label="Base CTC" value={slip.baseSalary} />
              <View style={styles.dashedDivider} />
              <DetailRow label="Gross" value={slip.grossEarnings} isTotal />
           </AppCard>

           <AppCard style={[styles.sectionCard, { flex: 1, marginLeft: 8 }]}>
              <SectionHeader title="Deductions" icon="trending-down" />
              <DetailRow label="Prof. Tax" value={slip.professionalTax} isNegative />
              <View style={styles.dashedDivider} />
              <DetailRow label="Total" value={slip.professionalTax} isNegative isTotal />
           </AppCard>
        </View>

        {/* Net Take Home */}
        <AppCard style={styles.netCard}>
           <View>
              <Text style={styles.netLabel}>Final Net Payable</Text>
              <Text style={styles.netValue}>₹{(slip.netSalary || 0).toLocaleString()}</Text>
           </View>
           <View style={styles.statusBox}>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <Text style={styles.statusText}>{(slip.status || 'Processed').toUpperCase()}</Text>
           </View>
        </AppCard>

        {/* Shift Logs (Half Days / Absents) */}
        {(slip.halfDayDetails?.length > 0 || slip.absentDayDetails?.length > 0) && (
          <AppCard style={styles.sectionCard}>
             <SectionHeader title="Adjustment Logs" icon="list" />
             {slip.halfDayDetails?.map((d, i) => (
                <View key={`h-${i}`} style={styles.logRow}>
                   <View style={[styles.logIndicator, { backgroundColor: colors.warning }]} />
                   <View style={styles.logInfo}>
                      <Text style={styles.logDate}>{new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                      <Text style={styles.logType}>Half Day</Text>
                   </View>
                   <Text style={styles.logReason}>{d.reason || 'N/A'}</Text>
                </View>
             ))}
             {slip.absentDayDetails?.map((d, i) => (
                <View key={`a-${i}`} style={styles.logRow}>
                   <View style={[styles.logIndicator, { backgroundColor: colors.error }]} />
                   <View style={styles.logInfo}>
                      <Text style={styles.logDate}>{new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                      <Text style={styles.logType}>Absent</Text>
                   </View>
                   <Text style={styles.logReason}>{d.reason || 'N/A'}</Text>
                </View>
             ))}
          </AppCard>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16 },
  headerCard: { padding: 24, borderRadius: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  empName: { fontSize: 20, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  empCode: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginTop: 4 },
  periodPill: { alignSelf: 'flex-start', backgroundColor: colors.primary + '10', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 12 },
  periodText: { fontSize: 11, fontWeight: '800', color: colors.primary },
  pdfBtn: { width: 50, height: 50, borderRadius: 15, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },

  sectionCard: { padding: 20, borderRadius: 24, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },

  attendanceGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  gridItem: { alignItems: 'center' },
  gridLabel: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, marginBottom: 6 },
  gridValue: { fontSize: 18, fontWeight: '900', color: colors.text },

  splitGrid: { flexDirection: 'row' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  detailValue: { fontSize: 13, fontWeight: '700', color: colors.text },
  totalRow: { marginTop: 4 },
  totalLabel: { fontWeight: '800', color: colors.text },
  totalValue: { fontSize: 15, fontWeight: '900' },
  dashedDivider: { height: 1, borderTopWidth: 1, borderTopColor: colors.border, borderStyle: 'dashed', marginVertical: 8 },

  netCard: { 
     backgroundColor: '#0F172A', 
     padding: 24, 
     borderRadius: 28, 
     flexDirection: 'row', 
     justifyContent: 'space-between', 
     alignItems: 'center', 
     marginBottom: 16,
     shadowColor: colors.primary,
     shadowOffset: { width: 0, height: 10 },
     shadowOpacity: 0.2,
     shadowRadius: 15,
     elevation: 8
  },
  netLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  netValue: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  statusBox: { alignItems: 'center', gap: 4 },
  statusText: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.8)' },

  logRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  logIndicator: { width: 6, height: 28, borderRadius: 3 },
  logInfo: { flex: 0.4 },
  logDate: { fontSize: 13, fontWeight: '800', color: colors.text },
  logType: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  logReason: { flex: 0.6, fontSize: 12, color: colors.textTertiary, fontStyle: 'italic' },
});

export default SalarySlipScreen;
