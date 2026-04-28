import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { colors } from '../../constants/colors';
import { useFetch } from '../../hooks/useFetch';
import { getAdminAttendance } from '../../api/attendance.api';
import AppCard from '../../components/common/AppCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Avatar from '../../components/common/Avatar';
import { formatTime } from '../../utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

const AdminAttendance = () => {
  const [date] = useState(new Date().toISOString().split('T')[0]); // Today YYYY-MM-DD
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');

  const { data, loading, execute: fetchAttendance } = useFetch(
    () => getAdminAttendance({ date, limit: 200 }),
    null
  );

  const onRefresh = useCallback(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const departments = useMemo(() => {
    if (!data?.records) return ['All'];
    const depts = new Set(data.records.map(r => r.employee?.department).filter(Boolean));
    return ['All', ...Array.from(depts)];
  }, [data]);

  const filteredData = useMemo(() => {
    if (!data?.records) return [];
    return data.records.filter(item => {
      const matchesSearch = 
        item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = filterDept === 'All' || item.employee?.department === filterDept;
      
      return matchesSearch && matchesDept;
    });
  }, [data, searchTerm, filterDept]);

  const renderItem = ({ item }) => {
    const isCheckedIn = !!item.inTime;
    const isCheckedOut = !!item.outTime;
    
    return (
      <AppCard style={styles.card}>
        <View style={styles.cardAccent} />
        
        <View style={styles.userInfoRow}>
          <Avatar url={item.employee?.profileImageUrl} name={item.employeeName} size={44} />
          <View style={styles.userDetails}>
             <Text style={styles.userName}>{item.employeeName}</Text>
             <Text style={styles.userCode}>{item.employeeCode} • {item.employee?.department || 'Staff'}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        {isCheckedIn ? (
          <View style={styles.timeRow}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>CHECK IN</Text>
              <Text style={[styles.timeValue, { color: colors.success }]}>
                {formatTime(new Date(item.inTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true}))}
              </Text>
            </View>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>CHECK OUT</Text>
              <Text style={[styles.timeValue, { color: isCheckedOut ? colors.primary : colors.textTertiary }]}>
                {isCheckedOut ? formatTime(new Date(item.outTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})) : '--:--'}
              </Text>
            </View>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>TOTAL</Text>
              <Text style={styles.timeValue}>{item.totalHours ? item.totalHours.toFixed(1) + 'h' : '--'}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.absentRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textTertiary} />
            <Text style={styles.absentText}>Not checked in for today</Text>
          </View>
        )}
        
        {item.isLate && (
           <View style={styles.lateInfo}>
             <Ionicons name="alert-circle" size={14} color={colors.warning} />
             <Text style={styles.lateText}>Late by {item.lateMinutes} mins</Text>
           </View>
        )}
      </AppCard>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search & Filter Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput 
            placeholder="Search by name or code..." 
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        
        <FlatList 
          data={departments}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => setFilterDept(item)}
              style={[styles.deptPill, filterDept === item && styles.deptPillActive]}
            >
              <Text style={[styles.deptText, filterDept === item && styles.deptTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.deptList}
        />
      </View>

      {loading && !data ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="people-outline" title="No Records Found" message="Try searching for another employee" />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    padding: 16, 
    backgroundColor: colors.surface, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border,
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
    marginBottom: 16,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: colors.text, fontWeight: '600' },
  
  deptList: { gap: 8 },
  deptPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  deptPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  deptText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  deptTextActive: { color: '#fff' },

  listContainer: { padding: 16, paddingBottom: 100 },
  card: { marginBottom: 16, borderRadius: 28, padding: 20, position: 'relative', overflow: 'hidden' },
  cardAccent: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, backgroundColor: colors.primary },
  
  userInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  userDetails: { flex: 1, marginLeft: 14 },
  userName: { fontSize: 17, fontWeight: '800', color: colors.text },
  userCode: { fontSize: 12, color: colors.textTertiary, fontWeight: '600', marginTop: 2 },
  
  timeRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: colors.surfaceAlt, 
    padding: 16, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  absentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: colors.surfaceAlt, borderRadius: 20, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  absentText: { fontSize: 14, fontStyle: 'italic', color: colors.textTertiary, fontWeight: '500' },
  
  timeBlock: { flex: 1, alignItems: 'center' },
  timeLabel: { fontSize: 10, color: colors.textTertiary, fontWeight: '800', marginBottom: 8, letterSpacing: 0.5 },
  timeValue: { fontSize: 15, fontWeight: '900', color: colors.text },
  
  lateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    backgroundColor: colors.warning + '12',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning + '20',
  },
  lateText: { fontSize: 12, fontWeight: '800', color: colors.warning },
});

export default AdminAttendance;
