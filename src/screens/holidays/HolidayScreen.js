import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Modal, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { useFetch } from '../../hooks/useFetch';
import { getAllHolidays, createHoliday, deleteHoliday } from '../../api/holiday.api';
import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { isManagement } from '../../utils/roleUtils';
import Toast from 'react-native-toast-message';

const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

const HolidayScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const canManage = isManagement(user?.role);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', description: '' });
  const [saving, setSaving] = useState(false);

  const { data, loading, execute: fetchHolidays } = useFetch(getAllHolidays, null);
  const holidays = Array.isArray(data) ? data : (data?.holidays || []);

  const onRefresh = useCallback(() => fetchHolidays(), [fetchHolidays]);

  const handleCreate = async () => {
    if (!form.name || !form.date) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Name and date are required.' });
      return;
    }
    try {
      setSaving(true);
      await createHoliday(form);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Holiday has been added to calendar.' });
      setModalVisible(false);
      setForm({ name: '', date: '', description: '' });
      fetchHolidays();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Failed to add holiday' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteHoliday(id);
      Toast.show({ type: 'success', text1: 'Holiday Removed' });
      fetchHolidays();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to delete' });
    }
  };

  const renderItem = ({ item }) => {
    const d = new Date(item.date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = MONTH_NAMES[d.getMonth()];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });

    return (
      <View style={styles.card}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateMonth}>{month}</Text>
          <Text style={styles.dateDay}>{day}</Text>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.holidayName} numberOfLines={1}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          ) : null}
          <View style={styles.cardFooter}>
            <Text style={styles.dayName}>{dayName}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{item.type || 'PUBLIC'}</Text>
            </View>
          </View>
        </View>

        {canManage && (
          <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Module Master Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <LinearGradient
          colors={colors.gradients.primary}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Holidays</Text>
            <Text style={styles.headerSubtitle}>{holidays.length} designated days</Text>
          </View>
          {canManage ? (
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.headerBtn}>
              <Ionicons name="add-circle-outline" size={26} color="#fff" />
            </TouchableOpacity>
          ) : <View style={styles.headerBtn} />}
        </View>
      </View>

      {loading && !data ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={holidays}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="calendar-outline" title="No Holidays Set" message="No upcoming holidays found in the system." />}
        />
      )}

      {/* Add Holiday Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add New Holiday</Text>
            
            <AppInput
              label="Holiday Name"
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
              placeholder="e.g. Diwali / Christmas"
            />
            <AppInput
              label="Date (YYYY-MM-DD)"
              value={form.date}
              onChangeText={(t) => setForm({ ...form, date: t })}
              placeholder="2026-10-20"
            />
            <AppInput
              label="Description (optional)"
              value={form.description}
              onChangeText={(t) => setForm({ ...form, description: t })}
              placeholder="Brief description here"
            />
            
            <View style={styles.modalButtons}>
              <AppButton 
                 title="Cancel" 
                 variant="outline" 
                 onPress={() => setModalVisible(false)} 
                 style={styles.modalBtn} 
              />
              <AppButton 
                 title="Add to Calendar" 
                 onPress={handleCreate} 
                 loading={saving} 
                 style={styles.modalBtnPrimary} 
              />
            </View>
          </View>
        </View>
      </Modal>
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
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  headerSubtitle: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  
  list: { padding: 16, paddingBottom: 100 },
  
  card: { 
    flexDirection: 'row',
    backgroundColor: '#fff', 
    borderRadius: 20, 
    marginBottom: 16, 
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    overflow: 'hidden'
  },
  dateBlock: { 
    backgroundColor: colors.primary, 
    justifyContent: 'center', alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16 
  },
  dateMonth: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.85)', marginBottom: 2, letterSpacing: 1 },
  dateDay: { fontSize: 26, fontWeight: '900', color: '#fff' },
  
  cardContent: { flex: 1, padding: 16, justifyContent: 'center' },
  holidayName: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
  description: { fontSize: 13, color: colors.textSecondary, marginBottom: 12, lineHeight: 18 },
  
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
  dayName: { fontSize: 12, fontWeight: '700', color: colors.textTertiary },
  
  typeBadge: { backgroundColor: colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeText: { fontSize: 9, fontWeight: '900', color: colors.textSecondary, letterSpacing: 0.5 },
  
  deleteBtn: { padding: 16, justifyContent: 'center', alignItems: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { 
    backgroundColor: colors.surface, 
    borderTopLeftRadius: 32, borderTopRightRadius: 32, 
    padding: 24, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 24, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalBtn: { flex: 1 },
  modalBtnPrimary: { flex: 1.5, backgroundColor: colors.primary },
});

export default HolidayScreen;
