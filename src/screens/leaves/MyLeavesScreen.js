import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  Dimensions,
  StatusBar
} from 'react-native';
import { colors } from '../../constants/colors';
import { useFetch } from '../../hooks/useFetch';
import { getMyLeaves, cancelLeave } from '../../api/leave.api';
import AppCard from '../../components/common/AppCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/dateUtils';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

const MyLeavesScreen = ({ navigation }) => {
  const { data, loading, execute: fetchLeaves } = useFetch(getMyLeaves, null);
  const [cancelLoading, setCancelLoading] = useState(null);

  const onRefresh = useCallback(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleCancel = async (id) => {
    try {
      setCancelLoading(id);
      await cancelLeave(id);
      Toast.show({ type: 'success', text1: 'Application Cancelled' });
      fetchLeaves();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Cancellation Failed' });
    } finally {
      setCancelLoading(null);
    }
  };

  const renderItem = ({ item }) => {
    const startDate = new Date(item.startDate);
    const endDate = new Date(item.endDate);

    return (
      <AppCard style={styles.card}>
        <View style={styles.cardMain}>
          <View style={styles.cardHeader}>
            <View style={styles.typeWrapper}>
               <View style={styles.iconCircle}>
                  <Ionicons 
                    name={item.leaveType === 'Sick' ? 'medical' : item.leaveType === 'Paid' ? 'cash' : 'calendar'} 
                    size={20} 
                    color={colors.primary} 
                  />
               </View>
               <View>
                 <Text style={styles.leaveTypeText}>{item.leaveType} Leave</Text>
                 <Text style={styles.durationText}>
                    {item.totalDays} {item.totalDays === 1 ? 'Day' : 'Days'} Request
                 </Text>
               </View>
            </View>
            <StatusBadge status={item.status || item.overallStatus} />
          </View>

          <View style={styles.divider} />
          
          <View style={styles.dateGrid}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>FROM</Text>
              <Text style={styles.dateValue}>{format(startDate, 'dd MMM, yyyy')}</Text>
            </View>
            <View style={styles.dateSeparator}>
               <Ionicons name="ellipsis-horizontal" size={16} color={colors.border} />
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>TO</Text>
              <Text style={styles.dateValue}>{format(endDate, 'dd MMM, yyyy')}</Text>
            </View>
          </View>

          {item.reason && (
            <View style={styles.reasonBox}>
               <Ionicons name="chatbox-ellipses-outline" size={14} color={colors.textTertiary} />
               <Text style={styles.reasonText} numberOfLines={2}>{item.reason}</Text>
            </View>
          )}
          
          {(item.status === 'Pending' || item.overallStatus === 'Pending') && (
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => handleCancel(item._id)}
              disabled={!!cancelLoading}
              activeOpacity={0.6}
            >
              <Ionicons name="close-circle-outline" size={16} color={colors.error} />
              <Text style={styles.cancelBtnText}>{cancelLoading === item._id ? 'Processing...' : 'Cancel Request'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </AppCard>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* <View style={styles.header}>
         <Text style={styles.title}>My Leaves</Text>
         <Text style={styles.subtitle}>Track your leave applications and status</Text>
      </View> */}

      <View style={styles.listWrapper}>
        {/* <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Application History</Text>
           <View style={styles.sectionLine} />
        </View> */}

        {loading && !data ? (
          <View style={styles.center}>
            <LoadingSpinner />
          </View>
        ) : (
          <FlatList
            data={data?.leaves || []}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />}
            ListEmptyComponent={<EmptyState icon="document-text-outline" title="No History" message="You haven't applied for any leaves yet." />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>



    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 24, paddingTop: 20, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -0.8 },
  subtitle: { fontSize: 14, color: colors.textTertiary, fontWeight: '600', marginTop: 4 },
  
  listWrapper: { flex: 1 },
  sectionHeader: { paddingHorizontal: 24, marginTop: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#F1F5F9' },

  listContent: { paddingHorizontal: 24, paddingBottom: 60 },
  card: { marginBottom: 20, borderRadius: 28, padding: 0, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
  cardMain: { padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  typeWrapper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
  leaveTypeText: { fontSize: 17, fontWeight: '800', color: colors.text },
  durationText: { fontSize: 12, color: colors.textTertiary, fontWeight: '700', marginTop: 2 },
  
  divider: { height: 1, backgroundColor: '#F8FAFC', marginVertical: 18 },
  
  dateGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateItem: { flex: 1 },
  dateLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 6 },
  dateValue: { fontSize: 14, fontWeight: '800', color: '#334155' },
  dateSeparator: { width: 40, alignItems: 'center' },
  
  reasonBox: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 16, marginTop: 18, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  reasonText: { fontSize: 13, color: '#64748B', fontStyle: 'italic', lineHeight: 18, flex: 1 },
  
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, paddingTop: 18, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  cancelBtnText: { color: colors.error, fontWeight: '800', fontSize: 13 },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default MyLeavesScreen;
