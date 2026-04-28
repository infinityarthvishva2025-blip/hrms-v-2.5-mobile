import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useFetch } from '../../hooks/useFetch';
import { getVideoById, getSectionsByVideo } from '../../api/gurukul.api';
import PageHeader from '../../components/common/PageHeader';
import AppCard from '../../components/common/AppCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Image } from 'expo-image';

const VideoDetailScreen = ({ route, navigation }) => {
  const { videoId, title } = route.params;

  const { data: video, loading: videoLoading } = useFetch(() => getVideoById(videoId), null);
  const { data: sections, loading: sectionsLoading } = useFetch(() => getSectionsByVideo(videoId), null);

  const sectionList = Array.isArray(sections) ? sections : (sections?.sections || []);

  if (videoLoading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <PageHeader title={title || 'Video'} showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Video thumbnail / preview */}
        {video?.thumbnailUrl ? (
          <Image source={{ uri: video.thumbnailUrl }} style={styles.thumbnail} contentFit="cover" />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="play-circle" size={64} color={colors.primaryLight} />
          </View>
        )}

        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle}>{video?.title}</Text>
          {video?.description && (
            <Text style={styles.videoDesc}>{video.description}</Text>
          )}
        </View>

        {/* Sections */}
        <Text style={styles.sectionHeading}>Sections ({sectionList.length})</Text>
        {sectionsLoading ? (
          <LoadingSpinner />
        ) : (
          sectionList.map((section, idx) => (
            <AppCard key={section._id} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumBadge}>
                  <Text style={styles.sectionNum}>{idx + 1}</Text>
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              {section.description && (
                <Text style={styles.sectionDesc}>{section.description}</Text>
              )}
              {section.videoUrl && (
                <TouchableOpacity
                  style={styles.watchBtn}
                  onPress={() => Linking.openURL(section.videoUrl).catch(() => {})}
                >
                  <Ionicons name="play-circle-outline" size={16} color={colors.primary} />
                  <Text style={styles.watchBtnText}>Watch Section</Text>
                </TouchableOpacity>
              )}
            </AppCard>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 24 },
  thumbnail: { width: '100%', height: 200 },
  thumbnailPlaceholder: { width: '100%', height: 200, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  videoInfo: { padding: 16 },
  videoTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  videoDesc: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  sectionHeading: { fontSize: 16, fontWeight: 'bold', color: colors.text, paddingHorizontal: 16, marginBottom: 8 },
  sectionCard: { marginHorizontal: 12, marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionNumBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  sectionNum: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  sectionDesc: { fontSize: 13, color: colors.textSecondary, marginBottom: 10 },
  watchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: colors.surfaceAlt, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  watchBtnText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
});

export default VideoDetailScreen;
