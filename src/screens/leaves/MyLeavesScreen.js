import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { getMyLeaves, cancelLeave } from '../../api/leave.api';
import AppCard from '../../components/common/AppCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/dateUtils';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PremiumHeader from '../../components/common/PremiumHeader';


const { width } = Dimensions.get('window');

const BalanceCard = ({ label, value, icon, color }) => (
  <View style={styles.balanceCard}>
    <LinearGradient
      colors={[color + '15', colors.surface]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={StyleSheet.absoluteFill}
    />

    <View style={[styles.balanceAccent, { backgroundColor: color }]} />
    <View style={styles.balanceHeader}>
       <View style={[styles.balanceIconBg, { backgroundColor: color + '10' }]}>
          <Ionicons name={icon} size={16} color={color} />
       </View>
       <Text style={styles.balanceLabel}>{label}</Text>
    </View>
    <Text style={styles.balanceValue}>{value ?? 0}</Text>
  </View>
);

const MyLeavesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { data, loading, execute: fetchLeaves } = useFetch(getMyLeaves, null);
  const [cancelLoading, setCancelLoading] = useState(null);

  const onRefresh = useCallback(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleCancel = async (id) => {
    try {
      setCancelLoading(id);
      await cancelLeave(id);
      Toast.show({ type: 'success', text1: 'Leave Cancelled' });
      fetchLeaves();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Cancellation Failed' });
    } finally {
      setCancelLoading(null);
    }
  };

  const balances = useMemo(() => [
    { label: 'PAID', value: user?.paidLeaveBalance, icon: 'checkmark-circle', color: colors.gradients.secondary[0] },
    { label: 'COMP-OFF', value: user?.compOffBalance, icon: 'gift', color: colors.gradients.accent[0] },
    { label: 'SICK', value: user?.sickLeaveBalance || 0, icon: 'medical', color: colors.error },
    { label: 'UNPAID', value: user?.unpaidCount || 0, icon: 'alert-circle', color: colors.warning },
  ], [user]);

  const renderItem = ({ item }) => (
    <AppCard style={styles.card}>
      <View style={styles.statusLine} />
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.typeText}>{item.leaveType} Leave</Text>
            <Text style={styles.durationText}>
              {item.totalDays} {item.totalDays === 1 ? 'Day' : 'Days'} 
              {item.halfDay ? ` (${item.halfDayPeriod})` : ''}
            </Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <View style={styles.divider} />
        
        <View style={styles.dateRow}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>FROM</Text>
            <Text style={styles.dateValue}>{formatDate(item.startDate)}</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={colors.textTertiary} />
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>TO</Text>
            <Text style={styles.dateValue}>{formatDate(item.endDate)}</Text>
          </View>
        </View>

        {item.reason && (
          <View style={styles.reasonBox}>
             <Text style={styles.reasonText} numberOfLines={2}>"{item.reason}"</Text>
          </View>
        )}
        
        {item.status === 'Pending' && (
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={() => handleCancel(item._id)}
            disabled={!!cancelLoading}
          >
            <Ionicons name="close-circle-outline" size={16} color={colors.error} />
            <Text style={styles.cancelBtnText}>{cancelLoading === item._id ? 'Cancelling...' : 'Cancel Request'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </AppCard>
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>


        {/* Balances Section */}
        <View style={styles.balanceSection}>
           <Text style={styles.sectionTitle}>Leave Entitlements</Text>
           <ScrollView 
             horizontal 
             showsHorizontalScrollIndicator={false} 
             contentContainerStyle={styles.balanceScroll}
           >
              {balances.map((b, idx) => <BalanceCard key={idx} {...b} />)}
           </ScrollView>
        </View>

        {/* History List */}
        <Text style={[styles.sectionTitle, { paddingHorizontal: 20 }]}>Request History</Text>
        {loading && !data ? (
          <LoadingSpinner />
        ) : (
          <FlatList
            data={data?.leaves || []}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[colors.gradients.secondary[0]]} />}
            ListEmptyComponent={<EmptyState icon="umbrella-outline" title="No Leaves Found" message="Request your first leave from the Apply tab." />}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingTop: 16 },
  
  balanceSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: colors.textTertiary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, paddingHorizontal: 20 },
  balanceScroll: { paddingHorizontal: 16, gap: 10 },
  balanceCard: { 
    width: (width - 48) / 2.5, 
    backgroundColor: colors.surface, 
    borderRadius: 20, 
    padding: 14, 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8,
    position: 'relative',
    overflow: 'hidden'
  },
  balanceAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  balanceIconBg: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  balanceLabel: { fontSize: 9, fontWeight: '800', color: colors.textTertiary },
  balanceValue: { fontSize: 20, fontWeight: '900', color: colors.text },

  listContainer: { padding: 16, paddingBottom: 100 },
  card: { marginBottom: 14, borderRadius: 24, padding: 0, overflow: 'hidden' },
  statusLine: { height: 4, width: '100%', backgroundColor: colors.border, opacity: 0.5 },
  cardContent: { padding: 20 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  typeText: { fontSize: 17, fontWeight: '800', color: colors.text },
  durationText: { fontSize: 12, color: colors.textTertiary, fontWeight: '600', marginTop: 2 },
  
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16, opacity: 0.6 },
  
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateBlock: { flex: 1 },
  dateLabel: { fontSize: 9, fontWeight: '800', color: colors.textTertiary, marginBottom: 4 },
  dateValue: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  
  reasonBox: { backgroundColor: colors.surfaceAlt, padding: 12, borderRadius: 14, marginTop: 16 },
  reasonText: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic' },
  
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  cancelBtnText: { color: colors.error, fontWeight: '700', fontSize: 13 },
});

export default MyLeavesScreen;
