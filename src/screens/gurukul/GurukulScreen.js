import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useFetch } from '../../hooks/useFetch';
import { getAllVideos } from '../../api/gurukul.api';
import PageHeader from '../../components/common/PageHeader';
import AppCard from '../../components/common/AppCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Image } from 'expo-image';

const GurukulScreen = ({ navigation }) => {
  const { data, loading, execute: fetchVideos } = useFetch(getAllVideos, null);
  const videos = Array.isArray(data) ? data : (data?.videos || []);

  const onRefresh = useCallback(() => fetchVideos(), [fetchVideos]);

  const renderItem = ({ item }) => (
    <AppCard
      style={styles.card}
      noPadding
      onPress={() => navigation.navigate('VideoDetail', { videoId: item._id, title: item.title })}
    >
      {item.thumbnailUrl ? (
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={styles.thumbnail}
          contentFit="cover"
        />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Ionicons name="play-circle" size={48} color={colors.primaryLight} />
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        )}
        <View style={styles.metaRow}>
          <Ionicons name="albums-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.metaText}>{item.sectionsCount || 0} sections</Text>
        </View>
      </View>
    </AppCard>
  );

  return (
    <View style={styles.container}>
      <PageHeader title="Gurukul" subtitle="Learning Center" showBack={false} />
      {loading && !data ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              icon="school-outline"
              title="No Courses Yet"
              message="Learning content will appear here once added by admins."
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 12 },
  card: { marginBottom: 12 },
  thumbnail: { width: '100%', height: 160, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  thumbnailPlaceholder: { width: '100%', height: 160, backgroundColor: colors.surfaceAlt, borderTopLeftRadius: 12, borderTopRightRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardContent: { padding: 12 },
  videoTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  description: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textSecondary },
});

export default GurukulScreen;
