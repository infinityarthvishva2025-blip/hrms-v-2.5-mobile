import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useFetch } from '../../hooks/useFetch';
import { getPayrollList, generatePayroll, generateAllPayroll } from '../../api/payroll.api';
import { getEmployees } from '../../api/employee.api';
import PageHeader from '../../components/common/PageHeader';
import AppCard from '../../components/common/AppCard';
import Avatar from '../../components/common/Avatar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Toast from 'react-native-toast-message';
import Modal from 'react-native-modal';

const { width } = Dimensions.get('window');

const getDefaultRange = () => {
  const today = new Date();
  const currMonth = today.getMonth();
  const currYear = today.getFullYear();
  const start = new Date(currYear, currMonth - 1, 21);
  const end = new Date(currYear, currMonth, 20);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
};

const PayrollDashboard = ({ navigation }) => {
  const [dateRange, setDateRange] = useState(getDefaultRange());
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [showGenModal, setShowGenModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);

  const { data: payrolls, loading, execute: fetchPayrolls } = useFetch(
    () => getPayrollList({ startDate: dateRange.startDate, endDate: dateRange.endDate }),
    []
  );

  const fetchEmployees = async () => {
    try {
      const { data } = await getEmployees({ limit: 1000, status: 'Active' });
      setEmployees(data.data?.employees || data.data || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchEmployees();
    fetchPayrolls();
  }, [dateRange, fetchPayrolls]);

  const onRefresh = useCallback(() => {
    fetchPayrolls();
    fetchEmployees();
  }, [fetchPayrolls]);

  const handleProcessAll = async () => {
    setActionLoading(true);
    try {
      await generateAllPayroll({ 
        startDate: dateRange.startDate, 
        endDate: dateRange.endDate 
      });
      fetchPayrolls();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessSingle = async (employeeId) => {
    setActionLoading(true);
    try {
      await generatePayroll({ 
        employeeId, 
        startDate: dateRange.startDate, 
        endDate: dateRange.endDate 
      });
      setShowGenModal(false);
      fetchPayrolls();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderItem = ({ item: emp }) => {
    const payroll = Array.isArray(payrolls) ? payrolls.find(p => p.employeeId === emp._id || p.employeeId?._id === emp._id) : null;
    const isProcessed = !!payroll;

    return (
      <AppCard style={styles.card}>
        <View style={styles.cardMain}>
          <Avatar url={emp.profileImageUrl} name={emp.name} size={48} />
          <View style={styles.empInfo}>
            <Text style={styles.empName}>{emp.name}</Text>
            <Text style={styles.empCode}>{emp.employeeCode} • {emp.department}</Text>
          </View>
          <View style={styles.statusBox}>
            {isProcessed ? (
              <View style={styles.processedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={styles.processedText}>PROCESSED</Text>
              </View>
            ) : (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>PENDING</Text>
              </View>
            )}
          </View>
        </View>

        {isProcessed && (
          <View style={styles.payrollDetails}>
            <View style={styles.detailItem}>
               <Text style={styles.detailLabel}>PAID DAYS</Text>
               <Text style={styles.detailValue}>{payroll.paidDays}</Text>
            </View>
            <View style={styles.detailItem}>
               <Text style={styles.detailLabel}>ABSENTS</Text>
               <Text style={[styles.detailValue, { color: colors.error }]}>{payroll.absentDays}</Text>
            </View>
            <View style={styles.detailItem}>
               <Text style={styles.detailLabel}>NET SALARY</Text>
               <Text style={[styles.detailValue, { color: colors.success }]}>₹{(payroll.netSalary || 0).toLocaleString()}</Text>
            </View>
          </View>
        )}

        <View style={styles.actionRow}>
          {isProcessed ? (
            <TouchableOpacity 
              style={styles.viewBtn} 
              onPress={() => navigation.navigate('SalarySlip', { slip: payroll })}
            >
              <Ionicons name="file-text-outline" size={16} color={colors.primary} />
              <Text style={styles.viewBtnText}>Salary Slip</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.processBtn} 
              onPress={() => handleProcessSingle(emp._id)}
              disabled={actionLoading}
            >
              {actionLoading ? <ActivityIndicator size={14} color={colors.primary} /> : <><Ionicons name="flash-outline" size={16} color={colors.primary} /><Text style={styles.processBtnText}>Process Now</Text></>}
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.optionsBtn}
            onPress={() => {
              setSelectedEmp(emp);
              setShowGenModal(true);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </AppCard>
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader title="Payroll Engine" showBack={false} />
      
      <View style={styles.controls}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search employees..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <View style={styles.dateSelector}>
           <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>CYCLE START</Text>
              <TextInput 
                style={styles.dateInput} 
                value={dateRange.startDate} 
                onChangeText={t => setDateRange({...dateRange, startDate: t})}
              />
           </View>
           <Ionicons name="arrow-forward" size={16} color={colors.borderDark} style={{ marginTop: 20 }} />
           <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>CYCLE END</Text>
              <TextInput 
                style={styles.dateInput} 
                value={dateRange.endDate} 
                onChangeText={t => setDateRange({...dateRange, endDate: t})}
              />
           </View>
        </View>

        <TouchableOpacity 
          style={[styles.bulkBtn, actionLoading && styles.disabledBtn]} 
          onPress={handleProcessAll}
          disabled={actionLoading}
        >
          {actionLoading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="rocket" size={20} color="#fff" /><Text style={styles.bulkBtnText}>Process All Active ({employees.length})</Text></>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filteredEmployees}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
          ListEmptyComponent={<EmptyState title="No employees found" />}
        />
      )}

      {/* Manual Process Modal */}
      <Modal 
        isVisible={showGenModal}
        onBackdropPress={() => setShowGenModal(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
           <Text style={styles.modalTitle}>Process Payroll</Text>
           <Text style={styles.modalSub}>{selectedEmp?.name} ({selectedEmp?.employeeCode})</Text>
           
           <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>Confirm Start Date</Text>
              <TextInput style={styles.mInput} value={dateRange.startDate} onChangeText={t => setDateRange({...dateRange, startDate: t})} />
              
              <Text style={styles.inputLabel}>Confirm End Date</Text>
              <TextInput style={styles.mInput} value={dateRange.endDate} onChangeText={t => setDateRange({...dateRange, endDate: t})} />

              <TouchableOpacity 
                style={styles.mSubmitBtn}
                onPress={() => handleProcessSingle(selectedEmp?._id)}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mBtnText}>Process Now</Text>}
              </TouchableOpacity>
           </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  controls: { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, paddingHorizontal: 12, borderRadius: 12, height: 48, marginBottom: 16 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, fontWeight: '500' },
  dateSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dateBox: { flex: 0.45 },
  dateLabel: { fontSize: 10, fontWeight: '800', color: colors.textTertiary, marginBottom: 4 },
  dateInput: { fontSize: 14, fontWeight: '700', color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 4 },
  bulkBtn: { backgroundColor: colors.primary, height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  bulkBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  disabledBtn: { opacity: 0.7 },

  list: { padding: 16 },
  card: { marginBottom: 16, padding: 16, borderRadius: 20 },
  cardMain: { flexDirection: 'row', alignItems: 'center' },
  empInfo: { flex: 1, marginLeft: 12 },
  empName: { fontSize: 16, fontWeight: '800', color: colors.text },
  empCode: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statusBox: { alignItems: 'flex-end' },
  processedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.success + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  processedText: { fontSize: 10, fontWeight: '900', color: colors.success },
  pendingBadge: { backgroundColor: colors.textTertiary + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pendingText: { fontSize: 10, fontWeight: '900', color: colors.textTertiary },

  payrollDetails: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surfaceAlt, padding: 12, borderRadius: 12, marginTop: 12 },
  detailItem: { alignItems: 'center' },
  detailLabel: { fontSize: 9, fontWeight: '800', color: colors.textTertiary, marginBottom: 2 },
  detailValue: { fontSize: 13, fontWeight: '900', color: colors.text },

  actionRow: { flexDirection: 'row', marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, alignItems: 'center' },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  viewBtnText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  processBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  processBtnText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  optionsBtn: { padding: 4 },

  modal: { margin: 0, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.text },
  modalSub: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 24 },
  modalForm: { gap: 16 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: colors.textTertiary },
  mInput: { backgroundColor: colors.surfaceAlt, height: 50, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, fontWeight: '600' },
  mSubmitBtn: { backgroundColor: colors.primary, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  mBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default PayrollDashboard;
