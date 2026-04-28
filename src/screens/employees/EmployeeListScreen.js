import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TextInput, TouchableOpacity, ScrollView, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useFetch } from '../../hooks/useFetch';
import { getEmployees } from '../../api/employee.api';
import AppCard from '../../components/common/AppCard';
import Avatar from '../../components/common/Avatar';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';

const DEPARTMENTS = ['All', 'IT', 'HR', 'Finance', 'Marketing', 'Accounting', 'Operations', 'General Manager'];

const EmployeeListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  const { data, loading, execute: fetchEmployees } = useFetch(getEmployees, null);

  const onRefresh = useCallback(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filteredEmployees = useMemo(() => {
    const list = data?.employees || [];
    return list.filter((emp) => {
      const matchesSearch = 
        emp.name?.toLowerCase().includes(search.toLowerCase()) ||
        emp.employeeCode?.toLowerCase().includes(search.toLowerCase());
      
      const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
      
      return matchesSearch && matchesDept;
    });
  }, [data, search, selectedDept]);

  const handleCall = (number) => {
    if (number) Linking.openURL(`tel:${number}`);
  };

  const handleEmail = (email) => {
    if (email) Linking.openURL(`mailto:${email}`);
  };

  const renderItem = ({ item }) => (
    <AppCard
      key={item._id}
      style={styles.card}
      onPress={() => navigation.navigate('EmployeeDetail', { employeeId: item._id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
           <Avatar url={item.profileImageUrl} name={item.name} size={50} />
           <View style={styles.nameSection}>
              <Text style={styles.nameText}>{item.name}</Text>
              <Text style={styles.codeText}>{item.employeeCode} • {item.department}</Text>
           </View>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.cardBody}>
         <View style={styles.roleBadge}>
            <Ionicons name="briefcase-outline" size={12} color={colors.primary} />
            <Text style={styles.roleText}>{item.position || item.role}</Text>
         </View>
         <View style={styles.actionGroup}>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => handleCall(item.mobileNumber)}
            >
               <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => handleEmail(item.email)}
            >
               <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.actionBtnActive]}
              onPress={() => navigation.navigate('EmployeeDetail', { employeeId: item._id })}
            >
               <Ionicons name="chevron-forward" size={18} color="#fff" />
            </TouchableOpacity>
         </View>
      </View>
    </AppCard>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            placeholder="Search name or ID code..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Dept Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterScroll}
        >
          {DEPARTMENTS.map(dept => (
            <TouchableOpacity
              key={dept}
              onPress={() => setSelectedDept(dept)}
              style={[styles.filterTab, selectedDept === dept && styles.filterTabActive]}
            >
              <Text style={[styles.filterText, selectedDept === dept && styles.filterTextActive]}>
                {dept}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !data ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filteredEmployees}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="people-outline" title="No Employees Found" message="Try adjusting your search filters" />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    backgroundColor: colors.surface, 
    paddingTop: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border 
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, fontWeight: '600', color: colors.text },
  
  filterScroll: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterTab: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 10, 
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border
  },
  filterTabActive: { 
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  filterTextActive: { color: '#fff' },

  listContainer: { padding: 16, paddingBottom: 100 },
  card: { marginBottom: 14, borderRadius: 24, padding: 18 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  nameSection: { marginLeft: 14 },
  nameText: { fontSize: 16, fontWeight: '800', color: colors.text },
  codeText: { fontSize: 11, color: colors.textTertiary, fontWeight: '600', marginTop: 3 },
  
  cardBody: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 18, 
    paddingTop: 16, 
    borderTopWidth: 1, 
    borderTopColor: colors.border,
    opacity: 0.9 
  },
  roleBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: colors.primary + '10', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8 
  },
  roleText: { fontSize: 11, fontWeight: '800', color: colors.primary },
  
  actionGroup: { flexDirection: 'row', gap: 8 },
  actionBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: colors.surfaceAlt, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  actionBtnActive: { 
    backgroundColor: colors.primary, 
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4
  }
});

export default EmployeeListScreen;
