import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity,
  Dimensions,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useFetch } from '../../hooks/useFetch';
import { getPayrollList } from '../../api/payroll.api';
import PremiumHeader from '../../components/common/PremiumHeader';
import { useAuth } from '../../hooks/useAuth';
import AppCard from '../../components/common/AppCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const { width } = Dimensions.get('window');

const PayrollScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 6, 21).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { data: payrolls, loading, execute: fetchMyPayrolls } = useFetch(
    () => getPayrollList({ 
      startDate: dateRange.startDate, 
      endDate: dateRange.endDate,
      self: true 
    }),
    []
  );

  useEffect(() => {
    fetchMyPayrolls();
  }, [dateRange, fetchMyPayrolls]);

  const onRefresh = useCallback(() => fetchMyPayrolls(), [fetchMyPayrolls]);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => navigation.navigate('SalarySlip', { slip: item })}
    >
      <AppCard style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.periodBox}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={styles.periodText}>
              {new Date(item.fromDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(item.toDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{(item.status || 'Pending').toUpperCase()}</Text>
          </View>
        </View>


        <View style={styles.mainInfo}>
           <View>
              <Text style={styles.netLabel}>NET TAKE HOME</Text>
              <Text style={styles.netValue}>₹{(item.netSalary || 0).toLocaleString()}</Text>
           </View>
           <TouchableOpacity 
             style={styles.downloadBtn}
             onPress={() => navigation.navigate('SalarySlip', { slipId: item._id })}
           >
             <Ionicons name="download" size={20} color={colors.primary} />
           </TouchableOpacity>
        </View>

        <View style={styles.footer}>
           <View style={styles.footItem}>
              <Text style={styles.footLabel}>PAID DAYS</Text>
              <Text style={styles.footValue}>{item.paidDays} / {item.totalDaysInMonth}</Text>
           </View>
           <View style={styles.divider} />
           <View style={styles.footItem}>
              <Text style={styles.footLabel}>GROSS</Text>
              <Text style={styles.footValue}>₹{(item.grossEarnings || 0).toLocaleString()}</Text>
           </View>
        </View>
      </AppCard>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <PremiumHeader 
        title="My Pay Slips" 
        moduleBadge="PAYROLL" 
        showBack={true} 
        user={user} 
        navigation={navigation} 
      />
      
      <View style={styles.filterBar}>
         <View style={styles.dateControl}>
           <Text style={styles.filterLabel}>HISTORY FROM</Text>
           <TextInput 
             style={styles.filterInput}
             value={dateRange.startDate}
             onChangeText={t => setDateRange({...dateRange, startDate: t})}
           />
         </View>
         <View style={styles.dateControl}>
           <Text style={styles.filterLabel}>TO</Text>
           <TextInput 
             style={styles.filterInput}
             value={dateRange.endDate}
             onChangeText={t => setDateRange({...dateRange, endDate: t})}
           />
         </View>
         <TouchableOpacity style={styles.refreshIcon} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color={colors.primary} />
         </TouchableOpacity>
      </View>

      {loading && !payrolls.length ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={payrolls}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
          ListEmptyComponent={<EmptyState title="No pay slips found" message="Salary statements for the selected period will appear here." />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterBar: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
  dateControl: { flex: 1 },
  filterLabel: { fontSize: 10, fontWeight: '800', color: colors.textTertiary, marginBottom: 4 },
  filterInput: { fontSize: 13, fontWeight: '700', color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 2 },
  refreshIcon: { padding: 8, marginTop: 12, backgroundColor: colors.surfaceAlt, borderRadius: 10 },

  list: { padding: 16 },
  card: { marginBottom: 20, padding: 24, borderRadius: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  periodBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  periodText: { fontSize: 12, fontWeight: '800', color: colors.text },
  statusBadge: { backgroundColor: colors.success + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '900', color: colors.success },

  mainInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
  netLabel: { fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 4 },
  netValue: { fontSize: 32, fontWeight: '900', color: colors.text, letterSpacing: -1 },
  downloadBtn: { width: 44, height: 44, borderRadius: 14, borderWeight: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceAlt },

  footer: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 },
  footItem: { flex: 1 },
  footLabel: { fontSize: 10, fontWeight: '800', color: colors.textTertiary, marginBottom: 4 },
  footValue: { fontSize: 14, fontWeight: '800', color: colors.textSecondary },
  divider: { width: 1, height: '80%', backgroundColor: colors.border, marginHorizontal: 12 }
});

export default PayrollScreen;
