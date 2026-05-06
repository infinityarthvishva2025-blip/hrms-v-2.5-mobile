import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { useFetch } from '../../hooks/useFetch';
import { getMyAnnouncements, markAsRead } from '../../api/announcement.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/dateUtils';
import { useAuth } from '../../hooks/useAuth';
import PremiumHeader from '../../components/common/PremiumHeader';

const AnnouncementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { data, loading, execute: fetchAnnouncements, setData } = useFetch(getMyAnnouncements, null);
  const announcements = Array.isArray(data) ? data : (data?.announcements || []);

  const onRefresh = useCallback(() => fetchAnnouncements(), [fetchAnnouncements]);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setData((prev) => {
        const list = Array.isArray(prev) ? prev : (prev?.announcements || []);
        return list.map((a) => a._id === id ? { ...a, isRead: true } : a);
      });
    } catch (err) {
      // Silently fail or use toast
    }
  };

  const getPriorityColor = (priority) => {
    if (priority === 'Urgent') return '#E11D48'; // Rose
    if (priority === 'High') return '#F59E0B'; // Amber
    if (priority === 'Medium') return '#3B82F6'; // Blue
    return '#10B981'; // Emerald
  };

  const renderItem = ({ item }) => {
    const isUnread = !item.isRead;
    const priorityColor = getPriorityColor(item.priority);

    return (
      <View style={[styles.card, isUnread && styles.unreadCard]}>
        {isUnread && (
           <View style={[styles.unreadIndicator, { backgroundColor: colors.accent }]} />
        )}
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: priorityColor + '15' }]}>
            <Ionicons 
               name={item.priority === 'Urgent' ? 'warning' : 'megaphone'} 
               size={18} 
               color={priorityColor} 
            />
          </View>
          <View style={styles.headerText}>
             <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
             <Text style={styles.meta}>{formatDate(item.createdAt)}</Text>
          </View>
          {isUnread && (
            <TouchableOpacity 
              onPress={() => handleMarkRead(item._id)} 
              style={styles.markReadBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-done-circle" size={24} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.message}>{item.message}</Text>

        {item.priority && (
          <View style={[styles.badge, { backgroundColor: priorityColor + '10', borderColor: priorityColor + '30' }]}>
            <Text style={[styles.badgeText, { color: priorityColor }]}>
              {item.priority.toUpperCase()} PRIORITY
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <PremiumHeader 
        title="Announcements" 
        moduleBadge="COMMUNICATION" 
        showBack={true} 
        user={user} 
        navigation={navigation} 
      />

      {loading && !data ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title="No Updates"
              message="You are all caught up on announcements."
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  
  list: { padding: 16, paddingBottom: 100 },
  
  card: { 
    backgroundColor: colors.surface, 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 16, 
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
    overflow: 'hidden'
  },
  unreadCard: { 
    backgroundColor: '#fff', 
    borderColor: colors.accent + '30',
    shadowOpacity: 0.1,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    width: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  iconContainer: {
    width: 40, height: 40, 
    borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center', 
    marginRight: 12
  },
  headerText: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4, lineHeight: 22 },
  meta: { fontSize: 12, fontWeight: '600', color: colors.textTertiary },
  
  markReadBtn: { padding: 4, marginLeft: 8 },
  
  message: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 16 },
  
  badge: { 
    alignSelf: 'flex-start', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
});

export default AnnouncementScreen;
