import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { useFetch } from '../../hooks/useFetch';
import { getAllLeaves } from '../../api/leave.api';
import AppCard from '../../components/common/AppCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Avatar from '../../components/common/Avatar';
import { formatDate } from '../../utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import PremiumHeader from '../../components/common/PremiumHeader';
import { useAuth } from '../../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';


const LeaveDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const [filterStatus, setFilterStatus] = useState('All');
  const { data, loading, execute: fetchLeaves } = useFetch(() => getAllLeaves({ limit: 100 }), null);

  const onRefresh = useCallback(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const filteredLeaves = useMemo(() => {
    if (!data?.leaves) return [];
    return data.leaves.filter(item => {
      const matchesSearch = 
        item.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.employee?.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [data, searchTerm, filterStatus]);

  const renderItem = ({ item }) => (
    <AppCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
           <Avatar url={item.employee?.profileImageUrl} name={item.employee?.name} size={40} />
           <View style={styles.nameSection}>
              <Text style={styles.userName}>{item.employee?.name}</Text>
              <Text style={styles.userCode}>{item.employee?.employeeCode} • {item.employee?.department || 'Staff'}</Text>
           </View>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.leaveInfo}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>TYPE</Text>
          <Text style={styles.infoValue}>{item.leaveType} Leave</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>PERIOD</Text>
          <Text style={styles.infoValue}>{formatDate(item.startDate)} – {formatDate(item.endDate)}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>TOTAL</Text>
          <Text style={styles.infoValueMain}>{item.totalDays}d</Text>
        </View>
      </View>
    </AppCard>
  );

  return (
    <View style={styles.container}>
      {/* Filters Header */}
      <View style={styles.header}>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput 
            placeholder="Search employees..." 
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        
        <View style={styles.filterRow}>
          {['All', 'Pending', 'Approved', 'Rejected'].map(status => {
            const active = filterStatus === status;
            return (
              <TouchableOpacity 
                key={status} 
                onPress={() => setFilterStatus(status)}
                style={styles.filterBtnWrapper}
              >
                {active ? (
                  <LinearGradient
                    colors={colors.gradients.secondary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.filterBtnActive}
                  >
                    <Text style={styles.filterTextActive}>{status}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.filterBtn}>
                    <Text style={styles.filterText}>{status}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filteredLeaves}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[colors.gradients.secondary[0]]} />}
        ListEmptyComponent={
          loading && !data ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}><LoadingSpinner /></View>
          ) : (
            <EmptyState icon="journal-outline" title="No Records Found" message="Try adjusting your filters" />
          )
        }
      />
    </View>
  );

};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    padding: 16, 
    backgroundColor: colors.surface, 
    borderBottomWidth:1, 
    borderBottomColor: colors.border 
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: colors.text, fontWeight: '600' },
  filterBtnWrapper: { borderRadius: 10, overflow: 'hidden' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  filterBtnActive: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  filterText: { fontSize: 11, fontWeight: '800', color: colors.textTertiary },
  filterTextActive: { fontSize: 11, fontWeight: '800', color: '#fff' },


  listContainer: { padding: 16, paddingBottom: 100 },
  card: { marginBottom: 12, borderRadius: 24, padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  nameSection: { marginLeft: 12 },
  userName: { fontSize: 15, fontWeight: '800', color: colors.text },
  userCode: { fontSize: 11, color: colors.textTertiary, fontWeight: '600', marginTop: 2 },
  
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14, opacity: 0.6 },
  
  leaveInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: 8, fontWeight: '800', color: colors.textTertiary, letterSpacing: 0.5, marginBottom: 4 },
  infoValue: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  infoValueMain: { fontSize: 14, fontWeight: '900', color: colors.gradients.secondary[0] },
});

export default LeaveDashboardScreen;
