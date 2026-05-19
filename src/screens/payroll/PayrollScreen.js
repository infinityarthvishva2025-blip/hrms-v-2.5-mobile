import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { useFetch } from '../../hooks/useFetch';
import { getPayrollList, generatePayroll } from '../../api/payroll.api';
import PremiumHeader from '../../components/common/PremiumHeader';
import { useAuth } from '../../hooks/useAuth';
import AppCard from '../../components/common/AppCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import AppDateTimePicker from '../../components/common/AppDateTimePicker';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const formatLocalDateToISO = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const PayrollScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);
  
  // Set default search range: past 6 months to today
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() - 6, 21)
  );
  const [endDate, setEndDate] = useState(new Date());

  // Hook into getPayrollList endpoint
  const { data, loading, execute: fetchMyPayrolls } = useFetch(
    useCallback(() => {
      const startStr = formatLocalDateToISO(startDate);
      const endStr = formatLocalDateToISO(endDate);
      return getPayrollList({ 
        startDate: startStr, 
        endDate: endStr,
        self: true 
      });
    }, [startDate, endDate]),
    null
  );

  // Safely extract payroll list array from backend paginated payload
  const payrollList = useMemo(() => data?.payrolls || [], [data]);

  // Extract the latest payslip to show as a premium spotlight highlight card
  const latestSlip = useMemo(() => payrollList[0] || null, [payrollList]);

  // Trigger fetch when dates are changed
  useEffect(() => {
    fetchMyPayrolls();
  }, [startDate, endDate, fetchMyPayrolls]);

  const onRefresh = useCallback(() => {
    fetchMyPayrolls();
  }, [fetchMyPayrolls]);

  // On-demand self-generation of payslip matching EmployeePayroll.jsx logic
  const handleGenerate = async () => {
    setActionLoading(true);
    try {
      const startStr = formatLocalDateToISO(startDate);
      const endStr = formatLocalDateToISO(endDate);
      await generatePayroll({
        employeeId: user?._id,
        startDate: startStr,
        endDate: endStr
      });
      Toast.show({ 
        type: 'success', 
        text1: 'Payslip Generated Successfully',
        text2: 'Your statement for the cycle has been processed.'
      });
      fetchMyPayrolls();
    } catch (err) {
      console.error(err);
      Toast.show({ 
        type: 'error', 
        text1: 'Generation Failed', 
        text2: err.response?.data?.message || 'Failed to generate payslip' 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const formattedFromDate = new Date(item.fromDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const formattedToDate = new Date(item.toDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    
    return (
      <TouchableOpacity 
        activeOpacity={0.85}
        onPress={() => navigation.navigate('SalarySlip', { slip: item })}
      >
        <AppCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.periodBox}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={styles.periodText}>
                {formattedFromDate} - {formattedToDate}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{(item.status || 'Processed').toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.mainInfo}>
            <View>
              <Text style={styles.netLabel}>NET TAKE HOME</Text>
              <Text style={styles.netValue}>₹{(item.netSalary || 0).toLocaleString('en-IN')}</Text>
            </View>
            <TouchableOpacity 
              style={styles.actionCircleBtn}
              onPress={() => navigation.navigate('SalarySlip', { slip: item })}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.footer}>
            <View style={styles.footItem}>
              <Text style={styles.footLabel}>PAID DAYS</Text>
              <Text style={styles.footValue}>{item.paidDays} / {item.totalDaysInMonth}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.footItem}>
              <Text style={styles.footLabel}>GROSS EARNINGS</Text>
              <Text style={styles.footValue}>₹{(item.grossEarnings || 0).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </AppCard>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <PremiumHeader 
        title="My Pay Slips" 
        moduleBadge="PAYROLL" 
        showBack={true} 
        user={user} 
        navigation={navigation} 
      />

      <FlatList
        data={payrollList}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={onRefresh} 
            colors={[colors.primary]} 
            tintColor={colors.primary} 
          />
        }
        ListHeaderComponent={
          <View style={styles.headerComponent}>
            {/* Premium Date Filters & Self Generation Card */}
            <AppCard style={styles.filterCard}>
              <Text style={styles.filterCardTitle}>Select Statement Period</Text>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerWrapper}>
                  <AppDateTimePicker 
                    label="From" 
                    value={startDate} 
                    onChange={setStartDate} 
                  />
                </View>
                <View style={styles.dateSpacer} />
                <View style={styles.datePickerWrapper}>
                  <AppDateTimePicker 
                    label="To" 
                    value={endDate} 
                    onChange={setEndDate} 
                  />
                </View>
              </View>

              {/* On-demand self-generation button */}
              <TouchableOpacity 
                style={styles.generateBtnContainer}
                onPress={handleGenerate}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']} // Emerald Gradient from Web App
                  style={styles.generateBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="trending-up" size={18} color="#fff" />
                      <Text style={styles.generateBtnText}>Generate Slip</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </AppCard>

            {/* Spotlight Latest Slip Hero Card */}
            {latestSlip && (
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => navigation.navigate('SalarySlip', { slip: latestSlip })}
              >
                <LinearGradient
                  colors={colors.gradients.primary}
                  style={styles.spotlightCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.spotlightHeader}>
                    <View style={styles.spotlightBadge}>
                      <Ionicons name="sparkles" size={12} color="#fff" />
                      <Text style={styles.spotlightBadgeText}>LATEST STATEMENT</Text>
                    </View>
                    <Ionicons name="arrow-forward-circle" size={28} color="rgba(255,255,255,0.85)" />
                  </View>

                  <Text style={styles.spotlightLabel}>Net Take Home Pay</Text>
                  <Text style={styles.spotlightValue}>₹{(latestSlip.netSalary || 0).toLocaleString('en-IN')}</Text>

                  <View style={styles.spotlightFooter}>
                    <Text style={styles.spotlightPeriod}>
                      {new Date(latestSlip.fromDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(latestSlip.toDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                    <Text style={styles.spotlightPaidDays}>
                      {latestSlip.paidDays} Paid Days
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Statement History</Text>
              {loading && <ActivityIndicator size="small" color={colors.primary} />}
            </View>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState 
              icon="document-text-outline"
              title="No statements found" 
              message="There are no processed salary slips for the selected range." 
              actionLabel="Generate Now"
              onAction={handleGenerate}
            />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  list: { 
    paddingHorizontal: 20, 
    paddingBottom: 40 
  },
  headerComponent: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  filterCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  filterCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerWrapper: {
    flex: 1,
  },
  dateSpacer: {
    width: 16,
  },
  generateBtnContainer: {
    marginTop: 18,
    borderRadius: 16,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  generateBtn: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  spotlightCard: {
    padding: 24,
    borderRadius: 28,
    marginBottom: 28,
    elevation: 6,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
  },
  spotlightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  spotlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  spotlightBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  spotlightLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    marginBottom: 4,
  },
  spotlightValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
    marginBottom: 20,
  },
  spotlightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 14,
  },
  spotlightPeriod: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '700',
  },
  spotlightPaidDays: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.3,
  },
  card: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 18 
  },
  periodBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: colors.surfaceAlt, 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 10 
  },
  periodText: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: colors.textSecondary 
  },
  statusBadge: { 
    backgroundColor: colors.success + '12', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  statusText: { 
    fontSize: 9, 
    fontWeight: '900', 
    color: colors.success 
  },
  mainInfo: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end', 
    marginBottom: 18 
  },
  netLabel: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: colors.textTertiary, 
    marginBottom: 4 
  },
  netValue: { 
    fontSize: 26, 
    fontWeight: '900', 
    color: colors.text, 
    letterSpacing: -0.8 
  },
  actionCircleBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: colors.surfaceAlt 
  },
  divider: { 
    height: 1, 
    backgroundColor: colors.border, 
    marginBottom: 14 
  },
  footer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  footItem: { 
    flex: 1 
  },
  footLabel: { 
    fontSize: 9, 
    fontWeight: '900', 
    color: colors.textTertiary, 
    marginBottom: 4 
  },
  footValue: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: colors.textSecondary 
  },
  verticalDivider: { 
    width: 1, 
    height: 24, 
    backgroundColor: colors.border, 
    marginHorizontal: 16 
  }
});

export default PayrollScreen;
